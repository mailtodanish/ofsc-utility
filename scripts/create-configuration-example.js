
/**
 * Generate the OFSC metadata configuration workbook.
 *
 * From the repository root, compile the TypeScript sources and run:
 * source scripts/.env
 *   npx tsc
 *   CLIENT_ID=yourClientId CLIENT_SECRET=yourClientSecret INSTANCE_URL=yourInstance node scripts/create-configuration-example.js
 *
 * Set OUTPUT_FILE_NAME to change the output path. The default is
 * OFSC_CONFIGURATION_SHEET.xlsx.
 */

const { createConfigurationFile } = require("../dist/metadata");

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
