import crypto from "node:crypto";
import path from "path";
import { getOAuthToken } from "../oauthTokenService/index";
import { EventResponse } from "../types";
import { fetchWithRetry, saveCsv } from "../utilities";

import { getTimeBefore180SecondsAlt, validateDateTimeStrict } from "../utilities/index";
type AnyObject = { [key: string]: any };



/**
 * Recursively flattens an object into a single-level object with
 * underscore-separated keys.
 *
 * Example: { a: { b: 1 } } -> { "a_b": 1 }
 *
 * Usage: exported helper used when callers need a flat row-style
 * representation (e.g., CSV export). Not used internally in this
 * module but available for other modules to import.
 *
 * @param obj - The object to flatten.
 * @param parentKey - Internal recursion prefix (do not pass normally).
 * @param result - Internal accumulator (do not pass normally).
 * @returns The flattened object.
 */
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



/**
 * Fetch a single page of events via `fetchWithRetry` and return the
 * received token and typed `EventResponse` data.
 *
 * This is a small wrapper around `fetchWithRetry` that normalizes the
 * response shape for the callers in this module. It is used by both
 * `downloadAllEventsOfDayCSV` and `downloadAllEventsOfDLastTwoMinutes`.
 *
 * @param url - Full URL for the events endpoint page.
 * @param token - Current OAuth token (may be refreshed by fetchWithRetry).
 * @param clientId - OAuth client id used by `fetchWithRetry` if token refresh needed.
 * @param clientSecret - OAuth client secret used by `fetchWithRetry`.
 * @param instanceUrl - Instance host used by `fetchWithRetry`.
 * @returns Object with `token` (possibly refreshed) and `data` typed as `EventResponse`.
 */
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

/**
 * Return the next calendar day in `YYYY-MM-DD` format for a given
 * `YYYY-MM-DD` input string.
 *
 * Usage: used by `processEventItems` to detect when fetched event
 * pages cross into the following day, allowing the downloader to stop
 * collecting events for the requested date.
 *
 * @param dateString - Date string in `YYYY-MM-DD` form.
 * @returns Date string for the next day in `YYYY-MM-DD`.
 */
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

/**
 * Process an array of event items and push them into `output` while
 * enforcing a date boundary.
 *
 * Behavior:
 * - If an event's `time` indicates it belongs to the next calendar
 *   day (based on `sinceDate`) the function logs and returns `false`
 *   to signal the caller to stop pagination.
 * - Otherwise, it extracts `activityId` from `activityDetails` and
 *   pushes a top-level object into `output`.
 *
 * Usage: called from `downloadAllEventsOfDayCSV` during page
 * iteration to accumulate events for the requested date.
 *
 * @param items - Event items from a page response.
 * @param sinceDate - The starting date (YYYY-MM-DD) used to detect day boundaries.
 * @param output - Accumulator array to receive processed events.
 * @returns `true` to continue pagination, `false` to stop.
 */
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

        item["uniqueId"] = generateHash(item);
        item["Change"] = item.activityChanges || item.inventoryChanges || item.requestChanges || item.userChanges || {};
        item["Id"] = item.activityId || item.resourceDetails?.resourceId || '-';

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
): Promise<any[]> {
    console.log("Downloading events...OnlyData:", onlyData);

    // Convenience wrapper: returns the same data as
    // `downloadAllEventsOfDayCSV` but kept as a separate exported
    // function for readability and future extension.
    let data = await downloadAllEventsOfDayCSV(clientId, clientSecret, instanceUrl, subscriptionId, sinceDate, onlyData);
    return data;
}

export async function downloadAllEventsOfDayCSV(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    subscriptionId: string,
    sinceDate: string,
    onlyData: boolean
): Promise<any[]> {
    /**
     * Download all events for a specific calendar day and return them as an
     * array. Internally handles pagination and will stop when pages cross
     * into the next day.
     *
     * Key behaviors and usage:
     * - Builds an initial request for the given `sinceDate` and pages
     *   through results using `fetchEventsPage`.
     * - Uses `processEventItems` to add items to the `events` array and
     *   stop when the date boundary is reached.
     * - If `onlyData` is false the collected events are saved to a CSV on
     *   disk via `saveCsv`.
     *
     * Called by: `downloadAllEventsOfDay` (simple wrapper) and can be
     * imported directly by other modules that need the raw event list.
     *
     * @param clientId - OAuth client id for token operations.
     * @param clientSecret - OAuth client secret for token operations.
     * @param instanceUrl - Instance host used to construct the endpoint.
     * @param subscriptionId - Events subscription id to fetch.
     * @param sinceDate - Date string in `YYYY-MM-DD` to fetch events for.
     * @param onlyData - When true, skip saving CSV to disk and return data only.
     * @returns Array of event objects collected for the requested date.
     */

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
        console.error("nextPage", nextPage, "Records:", page.items?.length, "Time:", page.items?.[0]?.time);
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
        if (page.items) {
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
    if (!onlyData) {
        try {
            if (events.length === 0) {
                console.warn(`⚠️ No events to save for ${sinceDate}. Skipping CSV export.`);
            } else {
                saveCsv(events, fullPath);
                console.log(`✅ Saved ${events.length} events to: ${fullPath}`);
            }
        } catch (error) {
            console.error(`Failed to save events CSV to ${fullPath}:`, error);
        }
    }
    return events
}




/**
 * Deterministically stringify a value for stable hashing.
 *
 * - Sorts object keys so property order does not affect output.
 * - Recursively processes arrays and objects.
 * - Falls back to `JSON.stringify` for primitive values.
 *
 * This is used by `generateHash` to produce a stable representation
 * of event payloads before hashing.
 *
 * @param value - The value to stringify (object, array, or primitive).
 * @returns A deterministic string representation of `value`.
 */
function stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(",")}]`;
    }

    if (value && typeof value === "object") {
        return `{${Object.keys(value as Record<string, unknown>)
            .sort()
            .map(key => `"${key}":${stableStringify((value as Record<string, unknown>)[key])}`)
            .join(",")}}`;
    }

    return JSON.stringify(value);
}
/**
 * Generate a deterministic SHA-256 hash for an event item.
 *
 * This uses a stable stringification of the selected fields so that
 * object property ordering does not change the resulting hash. Useful
 * for deduplication or consistent event identity across runs.
 *
 * @param item - Object containing `eventType`, `activityId`, `time`, and `activityChanges`.
 * @returns Hex-encoded SHA-256 hash string representing the event.
 */
export function generateHash(item: {
    eventType: string;
    activityId: string | number;
    time: string;
    activityChanges: unknown;
    inventoryChanges?: unknown;
    resourceDetails: { resourceId: string | number };
    requestChanges?: unknown;
    userDetails?: { login: string; status: string };
    activityDetails?: { activityId: string | number };
}): string {
    return crypto
        .createHash("sha256")
        .update(
            stableStringify({
                eventType: item.eventType,
                activityId: item.activityDetails?.activityId || item.resourceDetails?.resourceId || item.userDetails?.login || '-',
                time: item.time,
                activityChanges: item.activityChanges || item.inventoryChanges || item.requestChanges || {},
            })
        )
        .digest("hex");
}

/**
 *  Events of last two minutes
 * @param clientId 
 * @param clientSecret 
 * @param instanceUrl 
 * @param subscriptionId 
 * @returns 
 */
export async function downloadAllEventsOfDLastTwoMinutes(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    subscriptionId: string,
): Promise<any[]> {

    /**
     * Download events from the last ~180 seconds and return them as an
     * array.
     *
     * Differences from `downloadAllEventsOfDayCSV`:
     * - The `since` timestamp is computed using `getTimeBefore180SecondsAlt`.
     * - Validates the generated timestamp with `validateDateTimeStrict`.
     * - For each fetched item, this function attaches a `uniqueId` field
     *   generated by `generateHash` (used for deduplication or tracing).
     *
     * Usage: lightweight polling helper to retrieve recent events for
     * short-lived processing or monitoring.
     *
     * @param clientId - OAuth client id.
     * @param clientSecret - OAuth client secret.
     * @param instanceUrl - Instance host.
     * @param subscriptionId - Subscription id for events.
     * @returns Array of recent event objects.
     */

    // All collected events
    const events: any[] = [];

    const since = getTimeBefore180SecondsAlt();

    let isValidate = validateDateTimeStrict(since);
    if (!isValidate.isValid) {
        throw new Error(isValidate.error);
    }

    // Build initial request URL
    const baseUrl = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/events`;
    const initialUrl = `${baseUrl}?subscriptionId=${encodeURIComponent(subscriptionId)}&since=${encodeURIComponent(since)}`;
    console.log("sinceDate", since);
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
        console.error("nextPage", nextPage, "Records:", page.items?.length, "Time:", page.items?.[0]?.time);
        // Prevent infinite looping
        if (nextPage === lastSeenPage) {
            repeatedPageCount++;
            if (repeatedPageCount > 15) {
                console.warn("⚠️ Pagination repeating same page more than 15 times. Stopping.");
                break;
            }
        } else {
            lastSeenPage = nextPage;
            repeatedPageCount = 0;
        }

        // Add events
        if (!page.items) {
            console.warn("⚠️ No items found in page. Stopping.");
            break;
        }

        for (let k of page.items) {
            k["uniqueId"] = generateHash(k);
            k["Change"] = k.activityChanges || k.inventoryChanges || k.requestChanges || k.userChanges || {};
            k["Id"] = k.activityDetails?.activityId || k.resourceDetails?.resourceId || `${k.userDetails?.login}(${k.userDetails?.status})` || '-';
            events.push(k);
        }

    }


    return events
}