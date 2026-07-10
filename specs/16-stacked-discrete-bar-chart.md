# 16 — Stacked Discrete Bar Chart

**Status:** Draft
**Purpose:** Compare composition across entities at a single time (one stacked horizontal bar per entity). Reference behavior: owid-grapher `stackedCharts/StackedDiscreteBarChart`.

## Data consumed

- Entities × one target time × ≥2 metrics (the stack segments). Series strategy is metric.
- Entities missing **all** metrics are excluded; entities missing some render partial stacks (missing segments contribute zero and are flagged in the tooltip). `missingData: hide` excludes any entity with a gap.

## Marks & layout

- One horizontal bar per entity; segments left-to-right in metric order; entity label left; optional **total label** at bar end (`hideTotalLabel`).
- Negative segments extend left of the zero line (offset independently of positives).
- Sort: by total (default, desc), by entity name, by a chosen metric, or custom; reader-sortable where exposed; re-sorts animate.
- Categorical legend (metric → colour) above.

## Axes

- X: value axis including zero. Y: entity rows.

## Relative mode

Each bar normalizes to 100% of its (absolute) total; total labels hide; tooltip shows share + absolute.

## Interaction

- Hover a segment → tooltip (entity, metric, value, share of bar); hover legend/metric → that segment emphasizes in every bar.

## Time behavior

Single target time with tolerance per column; toleranced segments noted in tooltip.

## Faceting

Not faceted in v1.

## Static rendering

Identical; tooltips replaced by the legend + optional segment value labels when space allows.

## Edge cases

- Single metric: degenerate to discrete bar (`13`) styling.
- Long tail of small segments: minimum render width with exact values in tooltip.
- Mixed-sign bars: total = net; total label placed beyond the positive extent.

## Test expectations

- Segment offsets with negatives (fixture from OWID's contract: negative segment has zero offset).
- Sort modes incl. by-metric → exact orders.
- Relative mode normalization per bar.
- Partial-data entities: rendered segments + flagged gaps match fixture.
