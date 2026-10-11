/*
 * Usage:
 *   npm run build
 *   source scripts/.env
 *   node scripts/test-get-property-meta-data.js
 *
 * Required env vars:
 *   CLIENT_ID
 *   CLIENT_SECRET
 *   INSTANCE_URL
 *   PROPERTY_LABEL
 *
 * Optional env vars:
 *   ALL_USED_PROPES_PATH   - JSON file with an array of used properties
 *   OUTPUT_FILE_NAME       - file to save the response JSON
 */

const fs = require("fs");
const path = require("path");
const { getPropertyMetaData } = require("../dist/index.js");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;
const propertyLabel = process.env.PROPERTY_LABEL;
const allUsedPropesPath = process.env.ALL_USED_PROPES_PATH;
const outputFileName = process.env.OUTPUT_FILE_NAME;

if (!clientId || !clientSecret || !instanceUrl || !propertyLabel) {
  console.error(
    "Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL, PROPERTY_LABEL",
  );
  process.exit(1);
}

function loadAllUsedPropes() {
  if (!allUsedPropesPath) {
    return [];
  }

  const resolvedPath = path.isAbsolute(allUsedPropesPath)
    ? allUsedPropesPath
    : path.resolve(process.cwd(), allUsedPropesPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`ALL_USED_PROPES_PATH file not found: ${resolvedPath}`);
    process.exit(1);
  }

  try {
    const fileContents = fs.readFileSync(resolvedPath, "utf8");
    const parsed = JSON.parse(fileContents);

    if (!Array.isArray(parsed)) {
      throw new Error("Expected JSON array");
    }

    return parsed;
  } catch (err) {
    console.error("Failed to read ALL_USED_PROPES_PATH:", err);
    process.exit(2);
  }
}

(async () => {
  try {
    const allUsedPropes = loadAllUsedPropes();

    console.log(`Fetching metadata for property label: ${propertyLabel}`);
    const response = await getPropertyMetaData(
      propertyLabel,
      clientId,
      clientSecret,
      instanceUrl,
      allUsedPropes,
    );

    console.log("Property metadata response:");
    console.log(JSON.stringify(response, null, 2));

    const overview = response["Properties Overview"] || [];
    const enumerations = response["Properties Enumerations"] || [];

    console.log(`Found ${overview.length} matching property records.`);
    console.log(`Found ${enumerations.length} enum records.`);

    if (outputFileName) {
      fs.writeFileSync(outputFileName, JSON.stringify(response, null, 2), "utf8");
      console.log(`Saved response to ${outputFileName}`);
    }
  } catch (err) {
    console.error("Error fetching property metadata:", err);
    process.exit(2);
  }
})();
