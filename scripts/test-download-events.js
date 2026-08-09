const { downloadAllEventsOfDLastTwoMinutes } = require("../dist/index.js");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;
const subscriptionId = process.env.SUBSCRIPTION_ID;

if (!clientId || !clientSecret || !instanceUrl || !subscriptionId) {
  console.error(
    "Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL, SUBSCRIPTION_ID",
  );
  process.exit(1);
}

(async () => {
  try {
    console.log("Fetching events from the last ~180 seconds...");

    const recent = await downloadAllEventsOfDLastTwoMinutes(
      clientId,
      clientSecret,
      instanceUrl,
      subscriptionId,
    );

    console.log(`Fetched ${recent.length} recent events`);
    if (recent.length > 0) {
      console.log("Sample event:", recent[0]);
    }
  } catch (err) {
    console.error("Error fetching events:", err);
    process.exit(2);
  }
})();
