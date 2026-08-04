/**
 * Example script to generate the OFSC metadata configuration file using the `src/metadata` helpers.
 *
 * Environment variables:
 * - CLIENT_ID
 * - CLIENT_SECRET
 * - INSTANCE_URL (host portion, e.g. example-instance)
 * - OUTPUT_FILE_NAME (optional)
 *
 * compile + run:
 *   tsc && node dist/metadata/scripts/create-configuration-example.js
 */

import { createConfigurationFile } from "..";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;
const fileName = process.env.OUTPUT_FILE_NAME || "OFSC_CONFIGURATION_SHEET.xlsx";

if (!clientId || !clientSecret || !instanceUrl) {
    console.error("Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL");
    process.exit(1);
}

(async () => {
    try {
        console.log("Generating OFSC metadata configuration file...");
        await createConfigurationFile(clientId, clientSecret, instanceUrl, fileName);
        console.log(`Configuration workbook saved to ${fileName}`);
    } catch (err) {
        console.error("Error generating metadata configuration file:", err);
        process.exit(2);
    }
})();
