/*
 * Usage:
 *   npm run build
 *   source scripts/.env
 *   node scripts/test-get-subscriptions-meta-data.js
 *
 * Required env vars:
 *   CLIENT_ID
 *   CLIENT_SECRET
 *   INSTANCE_URL
 *
 * Optional env vars:
 *   TOKEN              - existing OAuth token
 *   OUTPUT_FILE_NAME   - file to save the response JSON
 */

const fs = require("fs");
const { default: OfscUtility } = require("../dist/index.js");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;
const token = process.env.TOKEN || "";
const outputFileName = process.env.OUTPUT_FILE_NAME;

if (!clientId || !clientSecret || !instanceUrl) {
  console.error(
    "Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL",
  );
  process.exit(1);
}

(async () => {
  try {
    console.log("Fetching subscription metadata...");
    const response = await OfscUtility.metadata.getSubscriptionsMetaData(
      clientId,
      clientSecret,
      instanceUrl,
      token,
    );

    console.log("Subscription metadata response:");
    console.log(JSON.stringify(response, null, 2));

    const subscriptions = response["Subscription Config"] || [];
    console.log(`Found ${subscriptions.length} subscriptions.`);

    if (outputFileName) {
      fs.writeFileSync(outputFileName, JSON.stringify(response, null, 2), "utf8");
      console.log(`Saved response to ${outputFileName}`);
    }
  } catch (err) {
    console.error("Error fetching subscription metadata:", err);
    process.exit(2);
  }
})();
