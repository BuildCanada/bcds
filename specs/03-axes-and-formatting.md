# 03 — Axes & Value Formatting

**Status:** Draft
**Covers:** Scales, domains, ticks, gridlines, and how numbers, times, and units are formatted everywhere (axes, tooltips, labels, tables). Reference behavior: owid-grapher `axis/`.

## 1. Scales

- **Linear** (default) and **logarithmic** value scales.
- Log scale: only positive values are plottable; non-positive values are excluded from the view (and surfaced as such in the table tab), never clamped. Log is unavailable for stacked charts.
- Authors may allow the reader to toggle linear/log (`canToggleScale`); the toggle lives on the axis itself and persists in URL state.

## 2. Domains

- Default value domain: data extent, with these rules —
  - Bar-like marks (bars, areas, marimekko) always include zero.
  - Line/slope/scatter include zero by default on the y-axis but may release it (`min: "auto"`).
  - Manual `min`/`max` accepted; `"auto"` means data-driven.
- **Nice bounds:** domains extend to round tick values; the extension never exceeds ~25% beyond the data.
- **Single-value domains** (one time point, one value): the point is positioned by an alignment rule (start/middle/end) rather than producing a degenerate axis.
- Faceting: each axis declares `shared` or `independent` domain across facets (see `09`).

## 3. Ticks & gridlines

- Target tick count adapts to axis pixel length (roughly 6 at default size); ticks are round numbers in the data's display unit.
- Authors may pin specific ticks (with optional "gridline only, no label").
- Time axes tick on natural boundaries (years, fiscal years, quarters, months) and thin labels rather than rotating them; the first and last labels are protected from clipping.
- Horizontal gridlines on value axes; time axes show no vertical gridlines by default.
- Axis labels (the metric name + unit) appear when the chart doesn't already convey them via legend or single-metric title.

## 4. Number formatting

A single formatting service used by every surface, so a value never formats differently between axis, tooltip, label, and table:

- **Abbreviation:** large numbers abbreviate on axes ("1.2 billion", "$24B"; short form on ticks, long form in tooltips). French formatting ("1,2 milliard", non-breaking spaces) when the chart locale is `fr`.
- **Decimals:** from column metadata (`decimals`), with smart defaults — enough significant figures that adjacent ticks differ.
- **Units:** short unit attaches to tick labels (`%`, `$`, `t`); long unit appears in axis label and tooltips. Currency respects the column's currency code.
- **Signs:** relative-change values format with explicit `+`/−; true minus sign (−), not hyphen.
- **Percentages:** `percentage` columns append `%`; "percentage point" change is labelled `pp` where applicable.

## 5. Time formatting

- Years render bare (`2024`); fiscal years as `2024–25`; quarters as `Q3 2024`; dates in locale convention.
- Ranges use an en dash: "2010–2024"; mixed-grain displays are not permitted within one chart.

## Edge cases

- All-negative data: zero line drawn inside the plot; bars extend from zero leftward/downward.
- Data spanning many orders of magnitude on linear scale: chart renders correctly; the log toggle (if enabled) is hinted in the settings.
- Domain `min == max == 0`: a flat zero baseline with one tick.

## Test expectations

- Formatting table-driven tests: (value, column metadata, locale, surface) → exact string, covering abbreviation thresholds, French locale, currency, percentage points, minus signs.
- Tick generation: given (domain, pixel length), ticks are round, non-overlapping, within domain.
- Log scale excludes non-positive values and reports how many were excluded.
- Single-value and degenerate domains render without errors.
