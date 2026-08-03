/**
 * Example script to fetch events using the `src/events` helpers.
 *
 * This copy lives under `src/` so `tsc` will emit it into `dist/scripts/`.
 *
 * Environment variables:
 * - CLIENT_ID
 * - CLIENT_SECRET
 * - INSTANCE_URL (host portion, e.g. example-instance)
 * - SUBSCRIPTION_ID
 * - SINCE_DATE (optional) - YYYY-MM-DD to fetch a full day's events
 * - ONLY_DATA (optional) - when "true", skip saving CSV in downloader
 *
 compile + run:
 *   tsc && node dist/events/scripts/fetch-events-example.js
 */


import { downloadAllEventsOfDayCSV, downloadAllEventsOfDLastTwoMinutes } from "..";



const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;
const subscriptionId = process.env.SUBSCRIPTION_ID;

if (!clientId || !clientSecret || !instanceUrl || !subscriptionId) {
    console.error("Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL, SUBSCRIPTION_ID");
    process.exit(1);
}

(async () => {
    try {
        if (process.env.SINCE_DATE) {
            const sinceDate = process.env.SINCE_DATE;
            const onlyData = process.env.ONLY_DATA === "true";

            console.log(`Fetching events for day ${sinceDate}...`);
            const events = await downloadAllEventsOfDayCSV(
                clientId,
                clientSecret,
                instanceUrl,
                subscriptionId,
                sinceDate,
                onlyData
            );

            console.log(`Fetched ${events.length} events for ${sinceDate}`);
            if (events.length > 0) console.log("Sample:", events[0]);
        } else {
            console.log("Fetching events from last ~180 seconds...");
            const recent = await downloadAllEventsOfDLastTwoMinutes(
                clientId,
                clientSecret,
                instanceUrl,
                subscriptionId
            );

            console.log(`Fetched ${recent.length} recent events`);
            if (recent.length > 0) console.log("Sample:", recent[0]);
        }
    } catch (err) {
        console.error("Error fetching events:", err);
        process.exit(2);
    }
})();
