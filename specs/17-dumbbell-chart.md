# 17 — Dumbbell Chart

**Status:** Draft
**Purpose:** Show each entity's movement between two values — two times of one metric, or two metrics at one time. Reference behavior: owid-grapher `dumbbellCharts/`.

## Data consumed

- **Time-range mode:** entities × {start, end} × 1 metric.
- **Two-metric mode:** entities × 1 time × 2 metrics (start = first metric, end = second).
- Series missing either endpoint are excluded (listed under "No data").

## Marks & layout

- One row per entity: dots at start and end values joined by a **connector** (`arrow` pointing at the end value — default — or plain `line`).
- Entity label left; **value labels** per `valueLabelMode`: `absolute` (both endpoints), `change` (signed difference), `percentChange`, or `none`.
- Sort by end value, start value, change, name, or custom.

## Axes

- X: shared value axis (zero included when data spans it). Y: entity rows.

## Colour

- Default **trend colouring**: themed semantic colours for increase/decrease/flat (overridable per theme/author: `trendColours`).
- Alternative: entity identity colours per `04`.

## Interaction

- Hover a dumbbell → tooltip with start, end, absolute and % change, trend arrow; emphasis/dimming per `07`.

## Time behavior

Time-range mode binds to the timeline's two handles like slope chart.

## Faceting

Not faceted in v1.

## Static rendering

Identical with labels resolved.

## Edge cases

- start == end: a single dot with "no change" treatment.
- % change from zero start: shown as "—" (undefined), not infinity.
- Crossing connectors are fine (rows are independent).

## Test expectations

- Endpoint filtering and no-data listing.
- Value-label modes → exact strings (signs, %, zero-start guard).
- Sort by change with mixed signs.
- Arrow vs line connector renders per config.
