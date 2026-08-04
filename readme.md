# OFSC Utility

A small TypeScript wrapper for Oracle Field Service Cloud (OFSC) REST APIs.

This package exposes grouped API helpers for common OFSC operations, including:

- authentication
- export/download helpers
- inventory and activity records
- metadata file generation

## Installation

```bash
npm install ofsc-utility
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
```

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
- `downloadAllUsersCSV`
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
