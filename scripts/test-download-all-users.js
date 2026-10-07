/**
 * Example script to run `downloadAllUsers` from the built package.
 *
 * Usage:
 *   npm run build
 *   source scripts/.env
 *   node scripts/test-download-all-users.js
 */

const { downloadAllUsers } = require("../dist/index.js");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;

if (!clientId || !clientSecret || !instanceUrl) {
  console.error(
    "Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL",
  );
  process.exit(1);
}

(async () => {
  try {
    console.log("Downloading all users...");

    const start = Date.now();
    const users = await downloadAllUsers(
      clientId,
      clientSecret,
      instanceUrl,
    );
    const elapsedMs = Date.now() - start;

    console.log(`Downloaded ${users.length} users in ${elapsedMs}ms.`);

    if (users.length > 0) {
      console.log("Sample user:", JSON.stringify(users[0], null, 2));
    } else {
      console.log("No users were returned.");
    }
  } catch (err) {
    console.error("Error downloading users:", err);
    process.exit(2);
  }
})();
