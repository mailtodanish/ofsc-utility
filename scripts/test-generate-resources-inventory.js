/**
 * Example script to run `generateAllOnHandInventoryOfAllResources`
 * from the built distribution.
 *
 * Usage:
 *   npm run build
 *   source scripts/.env
 *   node scripts/test-generate-resources-inventory.js
 *
 * Required environment variables:
 * - CLIENT_ID
 * - CLIENT_SECRET
 * - INSTANCE_URL
 */

// Real Project
// const { generateAllOnHandInventoryOfAllResources } = require("ofsc-utility");

// Only for testing
const {
  generateAllOnHandInventoryOfAllResources,
} = require("../dist/index.js");

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
    console.log("Fetching all resource inventories...");

    const inventories = await generateAllOnHandInventoryOfAllResources(
      clientId,
      clientSecret,
      instanceUrl,
      100, // consider only last 100 resources
    );

    console.log(`Fetched ${inventories.length} inventory rows`);

    if (inventories.length > 0) {
      console.log("Sample row:", inventories[0]);
    }
  } catch (err) {
    console.error("Error generating inventory rows:", err);
    process.exit(2);
  }
})();
