# Events module

This document describes the exported functions and internal helpers found in `src/events/index.ts` and how to use them.

## Overview

The module provides helpers to download and process events from the OFSC events API. Key responsibilities:

- Fetch paginated event pages with retry and token refresh behavior.
- Collect events for a specific calendar day (stop when page crosses into next day).
- Collect recent events (last ~180 seconds) for polling use.
- Provide stable normalization and hashing utilities for deduplication.

The main public functions are:

- `downloadAllEventsOfDay`
- `downloadAllEventsOfDayCSV`
- `downloadAllEventsOfDLastTwoMinutes`
- `flattenObject` (utility)
- `generateHash` (utility)

Internal helpers (also exported for convenience):

- `fetchEventsPage`
- `processEventItems`
- `getNextDay`
- `stableStringify`

Refer to the repository `readme.md` for project-level setup and authentication notes.

---

## Functions

### `flattenObject(obj: AnyObject): AnyObject`

- Purpose: Recursively flatten a nested object into a single-level object using underscore-separated keys.
- Use case: Preparing event objects for CSV export or tabular storage.
- Example:

  ```ts
  import { flattenObject } from "./events";

  const flat = flattenObject({ a: { b: 1 }, c: 2 });
  // flat -> { "a_b": 1, "c": 2 }
  ```

### `fetchEventsPage(url: string, token: string, clientId: string, clientSecret: string, instanceUrl: string)`

- Purpose: Wrapper around `fetchWithRetry` that returns `{ token, data }` where `data` is typed as `EventResponse`.
- Use case: Internal helper used by pagination loops to fetch a single page and get a possibly refreshed token back.
- Called by: `downloadAllEventsOfDayCSV`, `downloadAllEventsOfDLastTwoMinutes`.

### `getNextDay(dateString: string): string`

- Purpose: Given a `YYYY-MM-DD` input returns the next calendar day in the same format.
- Use case: Used by `processEventItems` to detect when a page's events moved into the following day, so pagination can stop.
- Example:

  ```ts
  getNextDay("2026-08-03"); // -> "2026-08-04"
  ```

### `processEventItems(items: any[], sinceDate: string, output: any[]): boolean`

- Purpose: Iterate page `items`, push processed objects into `output` and stop when an item belongs to the next calendar day.
- Behavior: Adds `activityId` (from `activityDetails.activityId`) as a top-level property on the pushed object.
- Return: `true` to continue pagination, `false` to stop.
- Called by: `downloadAllEventsOfDayCSV` (to collect items for a specific date).

### `stableStringify(value: unknown): string`

- Purpose: Produce a deterministic string representation of arrays/objects/primitives by sorting object keys and recursively serializing children.
- Use case: Ensure consistent input to hashing so identical content (even with different key order) yields the same hash.
- Called by: `generateHash`.

### `generateHash(item: { eventType: string; activityId: string|number; time: string; activityChanges: unknown; }): string`

- Purpose: Compute a SHA-256 hex digest of a stable stringified representation of selected event fields.
- Use case: Create a stable `uniqueId` for events to deduplicate or trace events across runs.
- Example:

  ```ts
  import { generateHash } from "./events";

  const id = generateHash({
    eventType: "UPDATE",
    activityId: 123,
    time: "2026-08-03 10:00:00",
    activityChanges: { state: "X" },
  });
  ```

- Note: `downloadAllEventsOfDLastTwoMinutes` attaches `uniqueId` to each returned item via `generateHash`.

### `downloadAllEventsOfDay(clientId, clientSecret, instanceUrl, subscriptionId, sinceDate, onlyData): Promise<any[]>`

- Purpose: Thin wrapper that calls `downloadAllEventsOfDayCSV` and returns the array of events.
- Use case: Public simple entrypoint when you only need the event list.
- Example:

  ```ts
  import { downloadAllEventsOfDay } from "./events";

  const events = await downloadAllEventsOfDay(
    CLIENT_ID,
    CLIENT_SECRET,
    instance,
    subscriptionId,
    "2026-08-02",
    true,
  );
  ```

### `downloadAllEventsOfDayCSV(clientId, clientSecret, instanceUrl, subscriptionId, sinceDate, onlyData): Promise<any[]>`

- Purpose: Fetch all event pages for a calendar day, accumulate events, optionally save them to a CSV, and return the array.
- Behavior details:
  - Constructs an initial `since` timestamp of `sinceDate 00:00:00` and pages the API.
  - Uses `fetchEventsPage` to fetch pages and manage token refresh.
  - Uses `processEventItems` to add items and stop when the day boundary is crossed.
  - If `onlyData` is `false`, saves a CSV file named `events-<sinceDate>_<ts>.csv` using `saveCsv` from utilities.
- Example:

  ```ts
  import { downloadAllEventsOfDayCSV } from "./events";

  const events = await downloadAllEventsOfDayCSV(
    CLIENT_ID,
    CLIENT_SECRET,
    instance,
    subscriptionId,
    "2026-08-02",
    false,
  );
  // CSV saved to disk and events array returned.
  ```

### `downloadAllEventsOfDLastTwoMinutes(clientId, clientSecret, instanceUrl, subscriptionId): Promise<any[]>`

- Purpose: Poll recent events for approximately the last 180 seconds.
- Behavior details:
  - Computes `since` via `getTimeBefore180SecondsAlt()`.
  - Validates timestamp with `validateDateTimeStrict`.
  - Pages results similarly to other downloaders.
  - For each item it computes a `uniqueId` via `generateHash` and attaches it: `k["uniqueId"] = generateHash(k);`
- Use case: Polling loop or short-lived monitoring/processing to get recent events.
- Example:

  ```ts
  import { downloadAllEventsOfDLastTwoMinutes } from "./events";

  const recent = await downloadAllEventsOfDLastTwoMinutes(
    CLIENT_ID,
    CLIENT_SECRET,
    instance,
    subscriptionId,
  );
  recent.forEach((r) => console.log(r.uniqueId, r.time));
  ```

---

## Integration notes

- Authentication: These functions call `getOAuthToken` from `oauthTokenService` and `fetchWithRetry` from `utilities`. Ensure your credentials are set and `readme.md` steps for setting env vars / tokens are followed.
- CSV export: `downloadAllEventsOfDayCSV` calls `saveCsv` from `utilities`. The CSV includes the fields as collected; if you need flattened rows for CSV columns, call `flattenObject` before saving.
- Deduplication: Use `generateHash` to create stable identifiers. Consider storing seen-hashes in a small cache to avoid reprocessing.

## Where to look next

- See [readme.md](../../readme.md) for project setup and authentication instructions.
- See `src/utilities` for `fetchWithRetry`, `saveCsv`, and time helpers.

---
