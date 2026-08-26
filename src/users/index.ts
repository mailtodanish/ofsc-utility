import * as fs from "fs";
import fetch from "node-fetch";
import { getOAuthToken } from "../oauthTokenService/index";
import { ResourceResponse } from "../types";
import { parseOFSCDate } from "../utilities/index";

export async function downloadAllUsersCSV(
  clientId: string,
  clientSecret: string,
  instanceUrl: string
): Promise<void> {

  let offset = 0;
  const limit = 100;

  let allItems: any[] = [];
  let totalFetched = 0;

  console.log("🚀 Starting users download...");
  console.log("-------------------------------------");

  while (true) {
    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/users/?offset=${offset}&limit=${limit}`;

    const token = await getOAuthToken(clientId, clientSecret, instanceUrl);

    console.log(`➡️ Fetching offset=${offset} limit=${limit}`);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      throw new Error(`❌ Fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as ResourceResponse;

    allItems.push(...data.items);
    totalFetched += data.items.length;

    console.log(`   ✔ Received ${data.items.length} items (Total: ${totalFetched})`);

    if (offset + limit >= data.totalResults) break;

    offset += limit;
  }

  console.log("-------------------------------------");
  console.log("🧩 Collecting all unique properties...");

  // Collect union of all properties
  const allProperties = new Set<string>();

  for (const item of allItems) {
    for (const key of Object.keys(item)) {
      if (!["resources", "collaborationGroups", "resourceInternalIds", "links"].includes(key)) {
        allProperties.add(key);
      }
    }
  }

  const headers = Array.from(allProperties);
  console.log(`📝 Total unique fields: ${headers.length}`);

  // Build CSV rows
  const csvRows: string[] = [];
  csvRows.push(headers.join(","));

  for (const item of allItems) {
    const row = headers.map(field => {
      let value = item[field];

      if (field === "keys") {
        if (Array.isArray(value)) return `"${value.join("|")}"`;
        if (value) return `"${String(value)}"`;
        return "";
      }

      // Objects → JSON-safe string
      if (typeof value === "object" && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, "'")}"`;
      }

      return value !== undefined ? `"${String(value).replace(/"/g, "'")}"` : "";
    });

    csvRows.push(row.join(","));
  }

  const filePath = "./users.csv";
  fs.writeFileSync(filePath, csvRows.join("\n"));

  console.log("-------------------------------------");
  console.log("✅ Users CSV Created Successfully!");
  console.log(`📁 File: ${filePath}`);
  console.log(`📦 Total Records: ${totalFetched}`);
  console.log(`🧩 Total Columns (Dynamic): ${headers.length}`);
  console.log(`🧩 Date Time: ${new Date()}`);
  console.log("-------------------------------------");
}


export {
  generateUsersCollaborationCSV
} from './collaborationGroups';


const OfscUserUtility = {
  generateUsersCollaborationCSV: require('./collaborationGroups').generateUsersCollaborationCSV,
  downloadAllUsersCSV,
  downloadAllInactiveUsersCSV
};



/**
 * Returns true if the user is "inactive":
 * - has no lastLoginTime at all, OR
 * - lastLoginTime is older than thresholdDays
 */
function isInactiveUser(item: any, thresholdDays: number, now: Date = new Date()): boolean {
  const lastLogin = parseOFSCDate(item.lastLoginTime);
  if (!lastLogin) return true; // never logged in => treat as inactive

  const diffMs = now.getTime() - lastLogin.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays > thresholdDays;
}

export async function downloadAllInactiveUsersCSV(
  clientId: string,
  clientSecret: string,
  instanceUrl: string,
  inactivityThresholdDays: number = 14
): Promise<void> {

  let offset = 0;
  const limit = 100;

  let allItems: any[] = [];
  let totalFetched = 0;

  console.log("🚀 Starting users download...");
  console.log("-------------------------------------");

  while (true) {
    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscCore/v1/users/?offset=${offset}&limit=${limit}`;

    const token = await getOAuthToken(clientId, clientSecret, instanceUrl);

    console.log(`➡️ Fetching offset=${offset} limit=${limit}`);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      throw new Error(`❌ Fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as ResourceResponse;

    allItems.push(...data.items);
    totalFetched += data.items.length;

    console.log(`   ✔ Received ${data.items.length} items (Total: ${totalFetched})`);

    if (offset + limit >= data.totalResults) break;

    offset += limit;
  }

  console.log("-------------------------------------");
  console.log(`🔎 Filtering inactive users (no login in last ${inactivityThresholdDays} days)...`);

  const now = new Date();
  const inactiveItems = allItems.filter(item => isInactiveUser(item, inactivityThresholdDays, now));

  console.log(`   ✔ ${inactiveItems.length} of ${allItems.length} users are inactive`);

  console.log("-------------------------------------");
  console.log("🧩 Collecting all unique properties...");

  // Collect union of all properties (from inactive users only)
  const allProperties = new Set<string>();

  for (const item of inactiveItems) {
    for (const key of Object.keys(item)) {
      if (!["resources", "collaborationGroups", "resourceInternalIds", "links"].includes(key)) {
        allProperties.add(key);
      }
    }
  }

  const headers = Array.from(allProperties);
  console.log(`📝 Total unique fields: ${headers.length}`);

  // Build CSV rows
  const csvRows: string[] = [];
  csvRows.push(headers.join(","));

  for (const item of inactiveItems) {
    const row = headers.map(field => {
      let value = item[field];

      if (field === "keys") {
        if (Array.isArray(value)) return `"${value.join("|")}"`;
        if (value) return `"${String(value)}"`;
        return "";
      }

      // Objects → JSON-safe string
      if (typeof value === "object" && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, "'")}"`;
      }

      return value !== undefined ? `"${String(value).replace(/"/g, "'")}"` : "";
    });

    csvRows.push(row.join(","));
  }

  const filePath = "./inactive_users.csv";
  fs.writeFileSync(filePath, csvRows.join("\n"));

  console.log("-------------------------------------");
  console.log("✅ Inactive Users CSV Created Successfully!");
  console.log(`📁 File: ${filePath}`);
  console.log(`📦 Total Fetched: ${totalFetched}`);
  console.log(`🚫 Inactive Records (>${inactivityThresholdDays} days): ${inactiveItems.length}`);
  console.log(`🧩 Total Columns (Dynamic): ${headers.length}`);
  console.log(`🧩 Date Time: ${new Date()}`);
  console.log("-------------------------------------");
}
export default OfscUserUtility;