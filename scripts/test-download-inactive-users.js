/**
 * Example script to run `downloadAllInactiveUsersCSV` from the built package.
 *
 * Usage:
 *   npm run build
 *   source scripts/.env
 *   node scripts/test-download-inactive-users.js
 *
 * Optional environment variable:
 * - INACTIVITY_THRESHOLD_DAYS (defaults to 14)
 */

const { downloadAllInactiveUsersCSV } = require("../dist/index.js");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;
const thresholdValue = process.env.INACTIVITY_THRESHOLD_DAYS;
const inactivityThresholdDays =
  thresholdValue === undefined ? 14 : Number(thresholdValue);

if (!clientId || !clientSecret || !instanceUrl) {
  console.error(
    "Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL",
  );
  process.exit(1);
}

if (!Number.isFinite(inactivityThresholdDays) || inactivityThresholdDays < 0) {
  console.error("INACTIVITY_THRESHOLD_DAYS must be a non-negative number");
  process.exit(1);
}

(async () => {
  try {
    console.log(
      `Downloading users inactive for more than ${inactivityThresholdDays} days...`,
    );

    await downloadAllInactiveUsersCSV(
      clientId,
      clientSecret,
      instanceUrl,
      inactivityThresholdDays,
    );

    console.log("Inactive users CSV download complete.");
  } catch (err) {
    console.error("Error downloading inactive users:", err);
    process.exit(2);
  }
})();
