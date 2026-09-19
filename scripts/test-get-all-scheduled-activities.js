/*
 * Usage:
 *   npm run build
 *   export CLIENT_ID=yourClientId
 *   export CLIENT_SECRET=yourClientSecret
 *   export INSTANCE_URL=yourInstanceName
 *   export ROOT_BUCKET=US
 *   source scripts/.env
 *   node scripts/test-get-all-scheduled-activities.js
 */

const { getAllScheduledActivities } = require("../dist/index.js");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;
const rootBucket = process.env.ROOT_BUCKET || "US";

if (!clientId || !clientSecret || !instanceUrl) {
  console.error(
    "Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL",
  );
  process.exit(1);
}

(async () => {
  try {
    console.log(`Fetching scheduled activities for root bucket: ${rootBucket}`);

    const activities = await getAllScheduledActivities(
      clientId,
      clientSecret,
      instanceUrl,
      rootBucket,
    );

    console.log(`Found ${activities.length} scheduled activities.`);
    console.log("Sample records:");
    console.log(JSON.stringify(activities.slice(0, 5), null, 2));
  } catch (error) {
    console.error("Failed to fetch scheduled activities:", error);
    process.exit(1);
  }
})();
