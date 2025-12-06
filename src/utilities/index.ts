import { getOAuthToken } from "../oauthTokenService";

/**
 * Fetches a URL with retry logic for expired tokens.
 *
 * @param {string} url - The URL to fetch.
 * @param {string} clientId - The OFSC client ID.
 * @param {string} clientSecret - The OFSC client secret.
 * @param {string} instanceUrl - The OFSC instance URL.
 * @param {string} token - The current OAuth token.
 *
 * @returns {Promise<{ data: any; token: string }>} A promise which resolves to an object containing the parsed JSON data and the latest OAuth token.
 */
export const fetchWithRetry = async (
    url: string,
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    token: string
): Promise<{ data: any; token: string }> => {

    const doFetch = async (bearer: string) => {
        return fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${bearer}`,
                Accept: "application/json"
            }
        });
    };

    // Try with the current token
    let res = await doFetch(token);

    // If 401 → renew and retry
    if (res.status === 401) {
        console.warn("⚠️ Token expired — renewing token…");
        token = await getOAuthToken(clientId, clientSecret, instanceUrl);

        res = await doFetch(token);
    }

    // If still not OK → fail
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`❌ Request failed: ${res.status} ${res.statusText}\n${body}`);
    }

    // Return parsed JSON + latest token
    return {
        data: await res.json(),
        token
    };
};

import fs from "fs";
import path from "path";

export function saveCsv<T extends Record<string, any>>(
    rows: T[],
    filePath: string
): void {
    if (!rows || rows.length === 0) {
        throw new Error("CSV creation failed: no rows provided.");
    }

    // Extract headers from the first row
    const headers = Object.keys(rows[0]);

    // Build CSV content
    const csvLines = [
        headers.join(","), // header row
        ...rows.map(row =>
            headers.map(h => escapeCsvValue(row[h])).join(",")
        )
    ];

    const csvContent = csvLines.join("\n");

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(filePath, csvContent);

    console.log(`CSV saved: ${filePath}`);
}

// Escape CSV fields
function escapeCsvValue(value: any): string {
    if (value == null) return "";
    const str = String(value);

    // Wrap in quotes if needed
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
}