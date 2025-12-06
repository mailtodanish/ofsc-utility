import * as fs from "fs";
import fetch from "node-fetch";
import { getOAuthToken } from "../oauthTokenService/index";
import { InventoryTypePayload, Response } from "../types";

export async function downloadAllInventoryTypesCSV(
    clientId: string,
    clientSecret: string,
    instanceUrl: string
): Promise<void> {

    let offset = 0;
    const limit = 100;

    let allItems: any[] = [];
    let totalFetched = 0;

    console.log("🚀 Starting all nventory type download...");
    console.log("-------------------------------------");

    while (true) {
        const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/inventoryTypes/?offset=${offset}&limit=${limit}`;

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

        const data = (await res.json()) as Response;

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

    const filePath = "./all_inventories.csv";
    fs.writeFileSync(filePath, csvRows.join("\n"));

    console.log("-------------------------------------");
    console.log("✅ Inventories CSV Created Successfully!");
    console.log(`📁 File: ${filePath}`);
    console.log(`📦 Total Records: ${totalFetched}`);
    console.log(`🧩 Total Columns (Dynamic): ${headers.length}`);
    console.log(`🧩 Date Time: ${new Date()}`);
    console.log("-------------------------------------");
}

export async function getInventoryTypesDetail(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    label: string
): Promise<Response> {

    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/inventoryTypes/${label}`;

    const token = await getOAuthToken(clientId, clientSecret, instanceUrl);

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

    return await res.json() as Response;
}

export async function updateCreateInventoryType(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    label: string,
    payload: InventoryTypePayload
): Promise<InventoryTypePayload> {

    const url = `https://${instanceUrl}.fs.ocs.oraclecloud.com/rest/ofscMetadata/v1/inventoryTypes/${label}`;

    const token = await getOAuthToken(clientId, clientSecret, instanceUrl);

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error(`❌ PUT failed: ${res.status} ${res.statusText}`);
    }

    return await res.json() as InventoryTypePayload;
}