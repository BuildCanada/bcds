# 19 — Marimekko Chart

**Status:** Draft
**Purpose:** Composition across entities where the *width* of each entity's column also encodes a quantity (e.g., spending mix per province, width = population). Reference behavior: owid-grapher `stackedCharts/Marimekko*`.

## Data consumed

- Entities × one target time × ≥1 `y` metrics (stack segments) + optional `x` metric (column width).
- No `x` binding → equal-width columns (a plain 100%-stacked column comparison).

## Marks & layout

- One vertical column per entity; width proportional to `x` (minimum visible width enforced); segments stacked by metric in order; columns ordered by sort (default: `x` descending).
- Entity labels beneath columns, angled, decluttered by priority (wider columns first, cap ~20); every entity remains identifiable via tooltip.
- Optional **no-data area** at the right edge grouping entities lacking `y` data (toggleable, `showNoDataArea`).
- Categorical legend (metric → colour).

## Axes

- Y: 0–100% (relative is the natural mode) or absolute values; X: cumulative width axis labelled with the `x` metric's unit when bound.

## Interaction

- Hover a segment → tooltip: entity, metric, value, share of column, column width value; hover legend/metric → emphasize across columns; selection highlights columns.

## Time behavior

Single target time; per-column tolerance; x and y may resolve from slightly different times (flagged).

## Faceting

Not faceted in v1.

## Static rendering

Identical; labels decluttered.

## Edge cases

- Entity missing `x` but having `y`: excluded when width-bound (reported), included at equal width otherwise.
- Tiny widths: enforced minimum, exact value in tooltip.
- Single metric: column heights uniform (100%); the chart reads as width comparison.

## Test expectations

- Width math: pixel share equals x-share within rounding; minimum width enforcement.
- Sort orders incl. by-width and by-total.
- No-data area membership fixture.
- Label declutter cap and priority.
