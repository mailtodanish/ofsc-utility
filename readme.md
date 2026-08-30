# OFSC Utility

A small TypeScript wrapper for Oracle Field Service Cloud (OFSC) REST APIs.

This package exposes grouped API helpers for common OFSC operations, including:

- authentication
- export/download helpers
- inventory and activity records
- metadata file generation

### Built-in resilience for OFSC's server errors

OFSC's REST API sits behind Oracle's gateway infrastructure, which means calls can occasionally fail with transient errors that have nothing to do with your request — the gateway losing its connection to the backend, a brief service restart, or normal rate limiting under load. This package handles those cases automatically so your integration doesn't fail on a blip that would have succeeded a second later.

### Exponential backoff

Retries don't hammer the API at a fixed interval — each attempt waits longer than the last (starting at a small base delay and doubling each time), unless OFSC explicitly tells us how long to wait via Retry-After. This gives Oracle's backend room to recover instead of adding to the load that likely caused the error in the first place.

### Why this matters for OFSC specifically

OFSC's gateway is known to return 503s and connection resets during normal operation — not just outages — especially under sustained polling or bulk export workloads (events, activities, inventory).Handling these
transparently means:

- Scheduled jobs don't die on a single flaky response and require manual re-runs
- Token expiry mid-session is handled without the caller needing to track token lifetimes
- You get clear, real error messages (with the response body attached) for
  genuine failures, instead of noisy retries on errors that were never going
  to succeed

## Installation

```bash
npm install ofsc-utility@latest
```

## Getting Started

1. Install the package:

```bash
npm install ofsc-utility
```

2. Create a `.env` file or export environment variables in your shell:

```bash
export CLIENT_ID=yourClientId
export CLIENT_SECRET=yourClientSecret
export INSTANCE_NAME=yourInstanceName
export SUBSCRIPTION_ID=yourSubscriptionId
```

- `instanceUrl` is the OFSC instance name only, not the full URL. For example: `mycompany` for `mycompany.fs.ocs.oraclecloud.com`.

3. Create a file such as `example.js` and add the sample code below.

4. Run the example:

```bash
node example.js
```

## Quick Start

### CommonJS

```js
const ofs = require("ofsc-utility");

async function main() {
  const token = await ofs.getOAuthToken(
    "CLIENT_ID",
    "CLIENT_SECRET",
    "INSTANCE_NAME",
  );
  console.log("OAuth token:", token);
}

main().catch(console.error);
```

### ES Modules

```js
import ofs from "ofsc-utility";

async function main() {
  const token = await ofs.getOAuthToken(
    "CLIENT_ID",
    "CLIENT_SECRET",
    "INSTANCE_NAME",
  );
  console.log("OAuth token:", token);
}

main().catch(console.error);
```

## Complete Example

This example shows a full CommonJS script that retrieves activity type metadata and prints the result.

```js
const ofs = require("ofsc-utility");

async function main() {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const instanceUrl = process.env.INSTANCE_NAME;

  if (!clientId || !clientSecret || !instanceUrl) {
    throw new Error(
      "Please set CLIENT_ID, CLIENT_SECRET and INSTANCE_NAME environment variables",
    );
  }

  const activityTypes = await ofs.metadata.getActivityTypesMetaData(
    clientId,
    clientSecret,
    instanceUrl,
  );

  console.log("Activity type metadata:");
  console.log(JSON.stringify(activityTypes, null, 2));
}

main().catch((error) => {
  console.error("Error running example:", error);
  process.exit(1);
});
```

## Usage

### Authentication

```js
const token = await ofs.getOAuthToken(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
);
```

### Download CSV files

```js
await ofs.downloadWorkZoneCSV(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
);

await ofs.downloadAllResourcesCSV(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
);

await ofs.downloadAllUsersCSV(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
);

await ofs.downloadAllInactiveUsersCSV(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
  14,
);
```

#### Download inactive users

`downloadAllInactiveUsersCSV` downloads all users from the OFSC Users API, filters
the results, and writes the matching users to `./inactive_users.csv`.

A user is considered inactive when either:

- `lastLoginTime` is missing or cannot be parsed, or
- the time since `lastLoginTime` is greater than `inactivityThresholdDays`

The threshold defaults to `14` days. The comparison uses the current date and
time when the function runs. A user whose last login is exactly at the threshold
is not included because the function uses a strictly greater-than comparison.

```js
const ofs = require("ofsc-utility");

async function downloadInactiveUsers() {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const instanceUrl = process.env.INSTANCE_NAME;

  if (!clientId || !clientSecret || !instanceUrl) {
    throw new Error(
      "Set CLIENT_ID, CLIENT_SECRET and INSTANCE_NAME before running this example",
    );
  }

  await ofs.downloadAllInactiveUsersCSV(
    clientId,
    clientSecret,
    instanceUrl,
    14,
  );
}

downloadInactiveUsers().catch((error) => {
  console.error("Failed to download inactive users:", error);
  process.exit(1);
});
```

**Function signature**

```ts
downloadAllInactiveUsersCSV(
  clientId: string,
  clientSecret: string,
  instanceUrl: string,
  inactivityThresholdDays?: number,
): Promise<void>
```

**Parameters**

- `clientId`: OFSC OAuth client ID.
- `clientSecret`: OFSC OAuth client secret.
- `instanceUrl`: OFSC instance name only, such as `mycompany`. Do not include
  `https://` or `.fs.ocs.oraclecloud.com`.
- `inactivityThresholdDays`: optional non-negative number of days. Defaults to
  `14`.

**Output**

- File: `./inactive_users.csv`, relative to the process working directory.
- The CSV contains one row per inactive user.
- Nested fields such as `resources`, `collaborationGroups`,
  `resourceInternalIds`, and `links` are excluded.
- The remaining columns are generated dynamically from the fields returned by
  the API. `keys` arrays are joined with `|`; other objects are serialized as
  JSON strings.

The helper retrieves users in pages of 100 records and requires valid OFSC API
credentials. It does not return the CSV contents; successful completion resolves
to `void`.

To run the repository test script against a built distribution:

```bash
npm run build
export CLIENT_ID=yourClientId
export CLIENT_SECRET=yourClientSecret
export INSTANCE_URL=yourInstanceName
export INACTIVITY_THRESHOLD_DAYS=14
node scripts/test-download-inactive-users.js
```

`INACTIVITY_THRESHOLD_DAYS` is optional in the test script and defaults to `14`.

#### Collect inactive users

`downloadAllInactiveUsers` downloads users from the OFSC Users API, filters out
users whose last login is within the inactivity threshold, and returns the
matching users as an array of plain objects. It does not create a CSV file.

Unlike `downloadAllInactiveUsersCSV`, users with a blank or unparsable
`lastLoginTime` are skipped. The threshold defaults to `14` days, and a user is
included only when the time since the last login is strictly greater than the
threshold.

```js
const ofs = require("ofsc-utility");

async function collectInactiveUsers() {
  const users = await ofs.User.downloadAllInactiveUsers(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.INSTANCE_NAME,
    14,
  );

  console.log(`Collected ${users.length} inactive users`);
  console.log(users[0]);
}

collectInactiveUsers().catch((error) => {
  console.error("Failed to collect inactive users:", error);
  process.exit(1);
});
```

**Function signature**

```ts
downloadAllInactiveUsers(
  clientId: string,
  clientSecret: string,
  instanceUrl: string,
  inactivityThresholdDays?: number,
): Promise<Record<string, any>[]>
```

**Parameters and result**

- `clientId`: OFSC OAuth client ID.
- `clientSecret`: OFSC OAuth client secret.
- `instanceUrl`: OFSC instance name only, such as `mycompany`. Do not include
  `https://` or `.fs.ocs.oraclecloud.com`.
- `inactivityThresholdDays`: optional non-negative number of days. Defaults to
  `14`.
- The returned array contains one object per inactive user.
- Nested fields such as `resources`, `collaborationGroups`,
  `resourceInternalIds`, and `links` are excluded.
- `keys` arrays are joined with `|`; other object values remain objects.

The helper retrieves users in pages of 100 records and requires valid OFSC API
credentials.

To run the repository test script against a built distribution:

```bash
npm run build
export CLIENT_ID=yourClientId
export CLIENT_SECRET=yourClientSecret
export INSTANCE_URL=yourInstanceName
export INACTIVITY_THRESHOLD_DAYS=14
node scripts/test-download-inactive-users-data.js
```

`INACTIVITY_THRESHOLD_DAYS` is optional in the test script and defaults to `14`.

### Resource related methods

```js
await ofs.generateAllOnHandInventoryOfAllResourcesCSV(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
);
```

This helper fetches all active resources and writes their on-hand inventory rows to a CSV file.

```js
const inventoryResult = await ofs.generateAllOnHandInventoryOfAllResources(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
);

console.log(`Loaded ${inventoryResult.data.length} inventory rows`);
console.log("Available table columns:", inventoryResult.props);
```

This method fetches active resources and returns an object containing:

- `data`: an array of inventory row objects
- `props`: an array of unique keys found across all row objects

The `props` array can be used as your dynamic table columns. For example:

```js
const columns = inventoryResult.props;
const rows = inventoryResult.data;

columns.forEach((col) => {
  console.log(`Column: ${col}`);
});

rows.forEach((row) => {
  const cells = columns.map((col) => row[col]);
  console.log(cells);
});
```

This gives you a dynamic table definition based on the actual inventory row fields returned by OFSC.

### Activity and inventory helpers

```js
const activities = await ofs.getAllActivities(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
  "US",
  "2025-11-01",
  "2025-11-30",
  "status=='pending'",
  "activityId,activityType,date,status",
);

const activityData = await ofs.getActivitybyId(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
  "ACTIVITY_ID",
);

const inventoryDetail = await ofs.InventoryType.getInventoryTypesDetail(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
  "inventory_label",
);
```

### Create a configuration workbook

```js
await ofs.createConfigurationFile(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
  "OFSC_CONFIGURATION_SHEET.xlsx",
);
```

### Metadata helpers

The `metadata` group exposes metadata-specific retrieval helpers.

```js
const meta = ofs.metadata;

const activityTypes = await meta.getActivityTypesMetaData(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
);

const activityGroups = await meta.getActivityTypesGroupsMetaData(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
);

const workZones = await meta.getWorkZonesMetaData(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
);
```

### Namespace-style imports

```js
const ofs = require("ofsc-utility");

await ofs.WorkZone.downloadWorkZoneCSV(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
);

await ofs.User.generateUsersCollaborationCSV(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
  process.env.SUBSCRIPTION_ID,
);
```

## Available exports

Top-level exports include:

- `getOAuthToken`
- `downloadWorkZoneCSV`
- `downloadAllResourcesCSV`
- `getResource`
- `downloadAllUsersCSV`
- `downloadAllInactiveUsersCSV`
- `generateAllOnHandInventoryOfAllResourcesCSV`
- `generateAllOnHandInventoryOfAllResources`
- `downloadAllInventoryTypesCSV`
- `getInventoryTypesDetail`
- `updateCreateInventoryType`
- `getAllActivities`
- `getActivitybyId`
- `getActivityCustomerInventories`
- `createActivityCustomerInventories`
- `downloadAllEventsOfDay`
- `downloadAllEventsOfDayCSV`
- `createExcelFile`
- `createConfigurationFile`

Grouped exports include:

- `ofs.Activity`
- `ofs.ActivityInventories`
- `ofs.Events`
- `ofs.Inventory`
- `ofs.InventoryType`
- `ofs.OauthTokenService`
- `ofs.Resource`
- `ofs.User`
- `ofs.Utilities`
- `ofs.WorkZone`
- `ofs.metadata`

## Metadata namespace

The `metadata` object exposes metadata helpers such as:

- `getActivityTypesMetaData`
- `getActivityTypesGroupsMetaData`
- `getApplictaionsIntegrationsDetailMetaData`
- `getCapacityMetaData`
- `getFormsMetaData`
- `getInventoryTypesMetaData`
- `getPropertiesMetaData`
- `getResourceTypesMetaData`
- `getShiftMetaData`
- `getTimeSlotsMetaData`
- `getWorkSkillsMetaData`
- `getWorkZoneKeyMetaData`
- `getWorkZonesMetaData`
- `createConfigurationFile`

### Properties metadata note

The `getPropertiesMetaData` helper fetches OFSC property definitions and then builds:

- `Properties Overview`: one row per property, including label, name, type, entity, GUI, clone flag, and deduplicated comments
- `Properties Enumerations`: combined enumeration dropdown values for any properties whose data type is `enumeration`

This function requires an `allUsedPropes` array to identify which properties are referenced by other metadata types and to collect comments for the overview.

```js
const allPropes = [];

const propertiesSheet = await ofs.metadata.getPropertiesMetaData(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.INSTANCE_NAME,
  allPropes,
);

console.log(propertiesSheet["Properties Overview"]);
console.log(propertiesSheet["Properties Enumerations"]);
```

## Notes

- `instanceUrl` is the OFSC instance name only, not the full URL. For example: `mycompany` for `mycompany.fs.ocs.oraclecloud.com`.
- All API helper methods accept the same `clientId`, `clientSecret`, and `instanceUrl` parameters at minimum.
- Most helper methods return a promise and should be used with `await` or `.then()`.

## Testing

```bash
npm test
```

## License

MIT
