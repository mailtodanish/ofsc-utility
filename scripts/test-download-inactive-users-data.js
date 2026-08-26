/**
 * Example script to run `User.downloadAllInactiveUsers` from the built package.
 *
 * Usage:
 *   npm run build
 *   source scripts/.env
 *   node scripts/test-download-inactive-users-data.js
 *
 * Optional environment variable:
 * - INACTIVITY_THRESHOLD_DAYS (defaults to 14)
 */

const { User } = require("../dist/index.js");

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
      `Collecting users inactive for more than ${inactivityThresholdDays} days...`,
    );

    const users = await User.downloadAllInactiveUsers(
      clientId,
      clientSecret,
      instanceUrl,
      inactivityThresholdDays,
    );

    console.log(`Collected ${users.length} inactive users.`);
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error collecting inactive users:", err);
    process.exit(2);
  }
})();
