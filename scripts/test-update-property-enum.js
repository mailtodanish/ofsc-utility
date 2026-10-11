/*
 * Usage:
 *   npm run build
 *   source scripts/.env
 *   PROPERTY_LABEL=MY_PROPERTY \
 *   ENUM_PAYLOAD_PATH=./property-enum-payload.json \
 *   node scripts/test-update-property-enum.js
 *
 * Required env vars:
 *   CLIENT_ID
 *   CLIENT_SECRET
 *   INSTANCE_URL
 *   PROPERTY_LABEL
 *   ENUM_PAYLOAD_PATH  - JSON object with an "items" array
 *
 * This script previews the request by default. Set APPLY_ENUM_UPDATE=true
 * only when you intend to update the property's enumeration values.
 */

const fs = require("fs");
const path = require("path");
const { updatePropertyEnum } = require("../dist/index.js");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const instanceUrl = process.env.INSTANCE_URL;
const propertyLabel = process.env.PROPERTY_LABEL;
const payloadPath = process.env.ENUM_PAYLOAD_PATH;
const token = process.env.TOKEN || "";

if (!clientId || !clientSecret || !instanceUrl || !propertyLabel || !payloadPath) {
  console.error(
    "Missing required env vars: CLIENT_ID, CLIENT_SECRET, INSTANCE_URL, PROPERTY_LABEL, ENUM_PAYLOAD_PATH",
  );
  process.exit(1);
}

const resolvedPayloadPath = path.isAbsolute(payloadPath)
  ? payloadPath
  : path.resolve(process.cwd(), payloadPath);

if (!fs.existsSync(resolvedPayloadPath)) {
  console.error(`ENUM_PAYLOAD_PATH file not found: ${resolvedPayloadPath}`);
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(fs.readFileSync(resolvedPayloadPath, "utf8"));
} catch (err) {
  console.error("Failed to read or parse ENUM_PAYLOAD_PATH:", err);
  process.exit(1);
}

if (
  payload === null ||
  typeof payload !== "object" ||
  !Array.isArray(payload.items)
) {
  console.error('Invalid payload: expected an object containing an "items" array.');
  process.exit(1);
}

console.log(`Property label: ${propertyLabel}`);
console.log(`Enumeration item count: ${payload.items.length}`);
console.log("Payload:");
console.log(JSON.stringify(payload, null, 2));

if (process.env.APPLY_ENUM_UPDATE !== "true") {
  console.log(
    "Dry run only; set APPLY_ENUM_UPDATE=true to send this update.",
  );
  process.exit(0);
}

(async () => {
  try {
    console.log(`Updating enumeration values for "${propertyLabel}"...`);
    const response = await updatePropertyEnum(
      clientId,
      clientSecret,
      instanceUrl,
      propertyLabel,
      payload,
      token,
    );
    console.log("Update response:");
    console.log(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error("Failed to update property enumeration:", err);
    process.exitCode = 2;
  }
})();
