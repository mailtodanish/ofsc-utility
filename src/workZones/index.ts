import * as fs from "fs";
import fetch from "node-fetch";
import { getOAuthToken } from "../oauthTokenService/index";
import { WorkZoneResponse } from "../types";

export async function downloadWorkZoneCSV(
  clientId: string, clientSecret: string, instanceUrl: string
): Promise<void> {

  const startTime = Date.now();

  let offset = 0;
  const limit = 100;

  let totalWorkZones = 0;
  let totalKeys = 0;

  let csvRows: string[] = [
    "workZoneLabel,workZoneName,key,status,travelArea"
  ];

  while (true) {
    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/workZones?offset=${offset}&limit=${limit}`;
    let token = await getOAuthToken(clientId, clientSecret, instanceUrl);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch work zones: ${res.status} ${res.statusText}`
      );
    }

    const data = (await res.json()) as WorkZoneResponse;

    totalWorkZones += data.items.length;

    for (const item of data.items) {
      // Normalize keys (ensure it's always an array)
      const keys = Array.isArray(item.keys)
        ? item.keys
        : item.keys
        ? [item.keys]
        : [];

      totalKeys += keys.length;

      for (const key of keys) {
        csvRows.push(
          `${item.workZoneLabel},${item.workZoneName},${key},${item.status},${item.travelArea}`
        );
      }
    }

    if (!data.hasMore) break;

    offset = data.offset + limit;
  }

  const csv = csvRows.join("\n");
  const filePath = "./workzones.csv";

  fs.writeFileSync(filePath, csv);

  const endTime = Date.now();
  const durationSec = ((endTime - startTime) / 1000).toFixed(2);

  // --- Summary ---
  console.log("\n=== Work Zone Extraction Summary ===");
  console.log(`Total Work Zones Processed : ${totalWorkZones}`);
  console.log(`Total Keys Extracted       : ${totalKeys}`);
  console.log(`CSV Saved To               : ${filePath}`);
  console.log(`Time Taken                 : ${durationSec} sec`);
  console.log("====================================\n");

  console.log("✔ Work Zone CSV download completed.");
}