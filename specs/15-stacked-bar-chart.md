# 15 — Stacked Bar Chart

**Status:** Draft
**Purpose:** Composition of a total at each time, as discrete columns — better than stacked area when times are few or irregular. Reference behavior: owid-grapher `stackedCharts/StackedBarChart`.

## Data consumed

- Entities or metrics × time points × numeric values; one vertical column per time point, segmented by series in stack order.
- **No interpolation** (unlike stacked area): a missing value at a time simply contributes nothing to that column, and the tooltip reports it as missing.

## Marks & layout

- Vertical columns, even spacing, width adapting to count; segments stacked from zero.
- Negative values stack downward from the baseline (segments below zero), positive upward — totals are the net.
- Legend (categorical) maps colour → series; time labels under columns thin as needed.

## Axes

- X: time as discrete positions. Y: zero-based value axis covering min stacked-negative to max stacked-positive.

## Relative mode

Share of each column's (absolute) total, 0–100%.

## Interaction

- Hover a column → tooltip with that time's full breakdown + total; hover a segment/legend item → that series emphasizes across all columns.

## Time behavior

Range selection trims which columns appear; the timeline's handles align to column boundaries.

## Faceting

Supported.

## Static rendering

Identical; optional total labels above columns (`showTotalLabels`).

## Edge cases

- One series: plain (unstacked) column chart.
- Sparse/irregular times: columns at actual times with proportional gaps, or equal spacing per `08 §2` rules.
- Mixed-sign series: net total label placement accounts for both extents.

## Test expectations

- Stacking offsets including negative segments (negatives never offset positives).
- Missing values: column totals exclude them; tooltip shows "No data" rows.
- Relative mode sums to 100% per column using absolute weights.
- Column width/spacing snapshots across count extremes (2 columns, 50 columns).
