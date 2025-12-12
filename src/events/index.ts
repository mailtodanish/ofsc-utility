import path from "path";
import { getOAuthToken } from "../oauthTokenService/index";
import { EventResponse } from "../types";
import { fetchWithRetry, saveCsv } from "../utilities";


type AnyObject = { [key: string]: any };



export function flattenObject(
  obj: AnyObject,
  parentKey: string = "",
  result: AnyObject = {}
): AnyObject {
  for (const key in obj) {
    const newKey = parentKey ? `${parentKey}_${key}` : key;

    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      flattenObject(obj[key], newKey, result);
    } else {
      result[newKey] = obj[key];
    }
  }

  return result;
}



async function fetchEventsPage(
    url: string,
    token: string,
    clientId: string,
    clientSecret: string,
    instanceUrl: string
) {
    const res = await fetchWithRetry(url, clientId, clientSecret, instanceUrl, token);

    return {
        token: res.token,
        data: res.data as EventResponse
    };
}

function getNextDay(dateString: string): string {
  // Parse manually to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());

  return `${y}-${m}-${d}`;
}

function processEventItems(items: any[], sinceDate: string, output: any[]) {
    for (const item of items) {
        const eventTime = item.time as string;

        // Stop if date changes
        if (eventTime.startsWith(getNextDay(sinceDate))) {
            console.log("Stopping at different event date:", eventTime);
            return false;
        }

        // Add activityId as first level field
        const activityId = item.activityDetails?.activityId ?? null;

        output.push({ activityId, ...item });
    }
    return true
}

export async function downloadAllEventsOfDay(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    subscriptionId: string,
    sinceDate: string,
    onlyData: boolean
): Promise< any[]> {
    console.log("Downloading events...OnlyData:", onlyData);

    let data = await downloadAllEventsOfDayCSV(clientId, clientSecret, instanceUrl, subscriptionId, sinceDate, onlyData);    
    return data ;
}

export async function downloadAllEventsOfDayCSV(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    subscriptionId: string,
    sinceDate: string,
    onlyData: boolean
): Promise<any[]> {

    // All collected events
    const events: any[] = [];

    // Build initial request URL
    const baseUrl = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/events`;
    const initialUrl = `${baseUrl}?subscriptionId=${encodeURIComponent(subscriptionId)}&since=${encodeURIComponent(sinceDate + " 00:00:00")}`;
    console.log("sinceDate", sinceDate);
    let token = await getOAuthToken(clientId, clientSecret, instanceUrl);

    // Get first page
    let firstPage = await fetchEventsPage(initialUrl, token, clientId, clientSecret, instanceUrl);
    token = firstPage.token;

    let nextPage = firstPage.data.nextPage;
    let found = firstPage.data.found;

    // Controls infinite loop
    let lastSeenPage = nextPage;
    let repeatedPageCount = 0;

    // Loop through pages
    while (found && nextPage) {
        const pageUrl = new URL(baseUrl);
        pageUrl.search = new URLSearchParams({
            subscriptionId,
            page: nextPage,
            limit: "1000",
        }).toString();

        const finalUrl = pageUrl.toString();

        const result = await fetchEventsPage(finalUrl, token, clientId, clientSecret, instanceUrl);
        token = result.token;

        const page = result.data;
        found = page.found;
        nextPage = page.nextPage;
        console.error("nextPage", nextPage, "Records:", page.items?.length , "Time:", page.items?.[0]?.time);
        // Prevent infinite looping
        if (nextPage === lastSeenPage) {
            repeatedPageCount++;
            if (repeatedPageCount > 10) {
                console.warn("⚠️ Pagination repeating same page more than 10 times. Stopping.");
                break;
            }
        } else {
            lastSeenPage = nextPage;
            repeatedPageCount = 0;
        }

        // Add events
        if (page.items){
            if (!processEventItems(page.items, sinceDate, events)) {
                break;
            }
        } else {
            console.warn("⚠️ No items found in page. Stopping.");
            break;
        }
    }

    // Save CSV
    const ts = Math.floor(Date.now() / 1000);
    const filename = `events-${sinceDate}_${ts}.csv`;
    const fullPath = path.resolve(filename);
    if(!onlyData){
        saveCsv(events, fullPath);
        console.log(`✅ Saved ${events.length} events to: ${fullPath}`);
    }     
    return events
}