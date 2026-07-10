# 12 — Slope Chart

**Status:** Draft
**Purpose:** Compare each series' change between exactly two times. Reference behavior: owid-grapher `slopeCharts/`.

## Data consumed

- Entities × two times × 1 metric (entity series), or 1 entity × two times × n metrics (metric series).
- Only series with values at **both** endpoints render; incomplete series are listed in a "No data" note (per `missingData`).

## Marks & layout

- One straight line per series from start value to end value; dots at both ends.
- Start/end **time labels** at the column heads ("2014–15", "2024–25").
- **Series name + value labels** beside each endpoint, collision-resolved vertically; font scales down with series count.
- Zero line drawn when the domain spans zero.

## Axes

- Y: shared value axis (linear/log); X: just the two endpoint positions — no continuous time axis.

## Colour

Standard categorical assignment per `04` (each series keeps its identity colour, consistent with the same entity's line chart). An optional **trend colouring** mode colours by direction (rising/falling/flat) using themed semantic colours.

## Interaction

- Hover a slope or its labels → emphasize, dim others; tooltip shows start, end, absolute and % change with trend arrow.
- Focus per `07`.

## Time behavior

- Endpoints come from the timeline's two handles; dragging either re-renders. Defaults to earliest/latest.

## Faceting

Not faceted in v1.

## Static rendering

All labels on; tooltips replaced by endpoint value labels (always shown statically).

## Edge cases

- Flat series (start == end): horizontal line, "flat" trend.
- Crossing slopes with adjacent labels: declutter must keep label→line attribution unambiguous (leader lines allowed).
- One series: still renders with full labels.

## Test expectations

- Endpoint filtering: fixture with partially-missing entities → exact rendered/no-data split.
- Change math in tooltip (absolute, %, zero-start guarded).
- Label collision fixture with ≥10 series → no overlaps, every label adjacent to its line.
- Trend colouring mode maps rising/falling/flat correctly including negative values.
