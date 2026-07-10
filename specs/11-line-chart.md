# 11 — Line Chart

**Status:** Draft
**Purpose:** Values over time for one or more series. The default chart type. Reference behavior: owid-grapher `lineCharts/`.

## Data consumed

- Entities × time × ≥1 numeric metric.
- **Series strategy:** one metric → each entity is a line; multiple metrics → each metric is a line (per selected entity; with multiple entities × multiple metrics, series are "Entity – Metric"). Author may force a strategy.

## Marks & layout

- Continuous lines through available time points; small point markers at data points (hidden automatically when dense; always shown for single-point series and "markers only" columns).
- **Series labels at line ends** (right edge), vertically nudged to avoid collisions; label text is the series name. When labels can't fit, they fall back to a legend.
- Projection segments (per column metadata) render dashed with a lighter weight, with the transition point marked.
- A vertical **hover guide** spans the plot at the hovered time.

## Axes

- X: time axis (no vertical gridlines, ticks on natural boundaries).
- Y: value axis, zero-anchored by default, log toggle optional; horizontal gridlines.

## Colour

Categorical assignment per `04` with persistence; optional value-driven line colouring via a `colour` binding (then a numeric legend appears and line segments tint by value).

## Interaction

- Hovering anywhere shows the time guide + multi-series tooltip (all series at that time, sorted by value).
- Hover/focus emphasis per `07` (hover label or line → others dim).

## Missing data

- Gaps break the line (no implicit interpolation); a column may opt into interpolation, which is then visually distinguished (lighter dash) and tooltipped as interpolated.
- `missingData: hide` drops entities lacking any data in the window.

## Relative mode

- When enabled (and exposed), values transform to **cumulative % change since the selected start time**; the title gains "Change in…"; y-axis formats as +/-%. Changing the start handle rebases.

## Time behavior

- Range selection trims the window. Collapsing to a single time switches to discrete-bar form when the definition includes it (`types: [line, discrete-bar]`), else renders point markers at the single time.

## Faceting

Supported (`entity`/`metric`), per `09`.

## Static rendering

Identical marks; end-of-line labels always on (decluttered); no hover guide; slightly heavier strokes/markers at small sizes for legibility.

## Edge cases

- Single series: heavier line, larger markers.
- Single time point: markers only.
- Many series (> palette): see `04 §2`; suggest faceting in authoring tools.
- All-negative values: zero gridline emphasized inside the domain.

## Test expectations

- Series strategy selection truth table (n metrics × n entities × override).
- Label declutter: fixture with colliding end labels → deterministic nudged positions, no overlaps.
- Gap rendering: series with missing middle values renders two segments.
- Relative mode: rebasing math vs hand-computed fixture; start-handle move rebases.
- Line↔bar switch at range collapse, and back.
