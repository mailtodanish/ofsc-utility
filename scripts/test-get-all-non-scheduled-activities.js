/*
 * Usage:
 *   npm run build
 *   export CLIENT_ID=yourClientId
 *   export CLIENT_SECRET=yourClientSecret
 *   export INSTANCE_URL=yourInstanceName
 *   export RESOURCES=US
 *   export FIELDS=activityId,activityType,date,status
 *   source scripts/.env
 *   node scripts/test-get-all-non-scheduled-activities.js
 */

const { getAllNonScheduledActivities } = require("../dist/index.js");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;
const rootBucket = process.env.ROOT_BUCKET || "US";
const fields = process.env.FIELDS || "activityId,activityType,date,status";

if (!clientId || !clientSecret || !instanceUrl) {
  console.error(
    "Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL",
  );
  process.exit(1);
}

(async () => {
  try {
    const activities = await getAllNonScheduledActivities(
      clientId,
      clientSecret,
      instanceUrl,
      rootBucket,
      fields,
    );

    console.log(`Found ${activities.length} non-scheduled activities.`);
    console.log("Sample records:");
    console.log(JSON.stringify(activities.slice(0, 5), null, 2));
  } catch (error) {
    console.error("Failed to fetch non-scheduled activities:", error);
    process.exit(1);
  }
})();
