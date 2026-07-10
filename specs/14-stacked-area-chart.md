# 14 — Stacked Area Chart

**Status:** Draft
**Purpose:** Composition of a total over time. Reference behavior: owid-grapher `stackedCharts/StackedAreaChart`.

## Data consumed

- Entities or metrics × time range × numeric values; series stack in definition order (first series at the bottom of the stack; legend matches).
- Values must be non-negative for stacking; negative values are a validation error directing authors to stacked bar (which supports them) or line.

## Marks & layout

- Filled bands stacked from a zero baseline; thin top edge stroke per band; band opacity from theme (defaults ~0.75, full on emphasis).
- **Series labels** at the right edge at each band's final midpoint, collision-resolved; legend fallback when bands are too thin.

## Axes

- X: time. Y: zero-based value axis whose max is the stacked total's max. Log scale unavailable.

## Missing data

- Interior gaps are **linearly interpolated** to keep bands continuous (interpolated spans tooltipped as such); leading/trailing missing times are trimmed per series.
- Per `missingData`: `hide` drops entities/metrics with gaps; `auto` interpolates.

## Relative mode

- Toggles to **share of total** (0–100%) at each time; y-axis max pins to 100%; tooltip shows both share and absolute value.

## Interaction

- Hover: time guide + tooltip listing every band's value (stack order) and the total.
- Hover/focus on a band, its label, or legend → emphasize that band (full opacity), dim others.

## Time behavior

Range selection trims the window; single-time collapse switches to stacked discrete bar when the definition includes it.

## Faceting

Supported; per-panel stacks with shared colour mapping and legend.

## Static rendering

Identical bands; labels always resolved; no hover guide.

## Edge cases

- A series that is zero throughout the window is dropped from the stack but kept in the legend (greyed).
- Single series: renders as a simple area.
- Sharp discontinuities (e.g., program created mid-window): band starts at its first time; the stack below remains continuous.

## Test expectations

- Stacking math: per-time offsets equal cumulative sums; order matches definition.
- Relative mode: shares sum to 100% (± rounding) at every time.
- Interpolation: fixture with interior gaps → exact interpolated values; tooltip flags them.
- Negative input rejected with the prescribed error.
