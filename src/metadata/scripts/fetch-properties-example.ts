/**
 * Example script to fetch properties metadata using `src/metadata/properties.ts`.
 *
 * Environment variables:
 * - CLIENT_ID
 * - CLIENT_SECRET
 * - INSTANCE_URL (host portion, e.g. example-instance)
 * - ALL_USED_PROPES_PATH (optional) - local JSON file path containing an array of property usage records
 * - OUTPUT_FILE_NAME (optional) - save JSON output to this file
 *
 * compile + run:
 *   source src/events/scripts/.env
 *   tsc && node dist/metadata/scripts/fetch-properties-example.js
 */

import fs from 'fs';
import path from 'path';
import { getPropertiesMetaData } from "..";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;
const allUsedPropesPath = process.env.ALL_USED_PROPES_PATH;
const outputFileName = process.env.OUTPUT_FILE_NAME;

if (!clientId || !clientSecret || !instanceUrl) {
    console.error("Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL");
    process.exit(1);
}

function loadAllUsedPropes(): any[] {
    if (!allUsedPropesPath) {
        return [];
    }

    const resolvedPath = path.isAbsolute(allUsedPropesPath)
        ? allUsedPropesPath
        : path.resolve(process.cwd(), allUsedPropesPath);

    if (!fs.existsSync(resolvedPath)) {
        console.error(`ALL_USED_PROPES_PATH file not found: ${resolvedPath}`);
        process.exit(1);
    }

    try {
        const fileContents = fs.readFileSync(resolvedPath, "utf8");
        const parsed = JSON.parse(fileContents);
        if (!Array.isArray(parsed)) {
            throw new Error("Expected JSON array");
        }
        return parsed;
    } catch (err) {
        console.error("Failed to read ALL_USED_PROPES_PATH:", err);
        process.exit(1);
    }
}

(async () => {
    try {
        const allUsedPropes = loadAllUsedPropes();

        console.log("Fetching properties metadata...");
        const response = await getPropertiesMetaData(
            clientId,
            clientSecret,
            instanceUrl,
            allUsedPropes
        );

        console.log("Properties metadata response:");
        console.log(JSON.stringify(response, null, 2));

        if (outputFileName) {
            fs.writeFileSync(outputFileName, JSON.stringify(response, null, 2), "utf8");
            console.log(`Saved response to ${outputFileName}`);
        }
    } catch (err) {
        console.error("Error fetching properties metadata:", err);
        process.exit(2);
    }
})();
