// npx dotenv -e .env -- node test-oauth.js
/*
 * Usage:
 *   npm run build
 *   source scripts/.env
 *   node scripts/test-get-resource.js
 */
const { getResourcebyId } = require("../dist/index.js");

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
    console.log("Requesting OAuth token...");

    const start = Date.now();
    const token = await getResourcebyId(
      "5457",
      clientId,
      clientSecret,
      instanceUrl,
    );
    const elapsedMs = Date.now() - start;

    if (typeof token !== "string" || token.length === 0) {
      console.error("Token response was empty or not a string:", token);
      process.exit(2);
    }

    console.log(`Fetched token in ${elapsedMs}ms`);
    console.log(`Token length: ${token.length}`);
    console.log(`Token preview: ${token.slice(0, 12)}...${token.slice(-4)}`);
  } catch (err) {
    console.error("Error fetching OAuth token:", err);
    process.exit(2);
  }
})();
