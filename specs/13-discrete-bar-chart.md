# 13 — Discrete Bar Chart

**Status:** Draft
**Purpose:** Compare values across series at a single time. The natural "collapsed" form of a line chart. Reference behavior: owid-grapher `barCharts/`.

## Data consumed

- Entities (or metrics) × one target time × 1 metric per bar.
- Series strategy as in `11`. Series with no value at the target time (within tolerance) are excluded.

## Marks & layout

- **Horizontal bars** from a zero baseline; series label left of each bar; formatted **value label** at the bar end (outside for positive, mirrored for negative).
- Default sort: value descending; author-configurable (`sort`), reader-sortable where exposed.
- Toleranced values append "in ‹time›" to the value label; projected values render with the projection pattern.

## Axes

- X: value axis with zero included, gridlines, ticks; Y: categorical positions (no axis line).

## Colour

- Single-metric: bars share the palette primary unless entity colours are fixed (registry/author), keeping continuity with the line view of the same data.
- Multi-metric (metric series): one colour per metric per `04`.

## Interaction

- Hover a bar → emphasize + tooltip (entity, value, time, tolerance note).
- When the chart arrived via line-chart collapse, moving the timeline handle re-targets the time; bars **animate to their new lengths and re-sorted positions** (see `25`).

## Relative mode

Where exposed: values as share of the visible total.

## Faceting

Supported by metric.

## Static rendering

Identical; value labels always on.

## Edge cases

- Negative values: bars extend left of the zero line; labels mirror.
- All-zero values: zero-width bars with labels at baseline.
- Long entity names: label column truncates with full name in tooltip/static subtitle, never overlapping bars.
- Very many bars: bar height compresses to a floor, then the chart scrolls (interactive) or extends vertically (static).

## Test expectations

- Sort options (value/name/custom, asc/desc) → exact order fixtures.
- Tolerance suffix appears exactly when value time ≠ target time.
- Negative/positive mixed fixture: baseline placement, label mirroring.
- Re-sort animation produces stable, deterministic final layout equal to a fresh render.
