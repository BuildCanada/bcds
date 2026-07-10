# 06 — Tooltips

**Status:** Draft
**Covers:** Structure, content rules, and behavior of hover tooltips across all chart types. Reference behavior: owid-grapher `tooltip/`.

## 1. Structure

A tooltip is a card with up to four zones:

1. **Title** — the hovered thing (entity name, or time for whole-chart hovers), with optional muted annotation (e.g., region).
2. **Subtitle** — the metric name + unit when not obvious from context.
3. **Value block** — one of:
   - single value (+ swatch)
   - value table: one row per series at the hovered time — swatch, label, formatted value; a **Total** row appears when ≥2 rows and the total is meaningful (not ~100% relative mode, not mostly-missing).
   - value range: start → end values with a trend arrow and the change (absolute and %), for two-point charts (slope, dumbbell) and time-range hovers.
4. **Footer notices** — small icon + text lines, shown only when applicable:
   - "Data from 2019" when tolerance borrowed a neighbouring time
   - "Projected data" (with the projection pattern swatch)
   - data-quality or rounding notes from column metadata

Missing values render as a muted "No data" — never omitted silently when the series is on the chart, and never zero.

## 2. Content rules

- All values format via the shared formatting service (`03`) at tooltip (long) verbosity: full numbers with units, not axis abbreviations, unless the number is very large (then both: "24.1 billion").
- Rows order by value at the hovered time (descending) in multi-series tooltips, except stacked charts which preserve stack order.
- The hovered series row is emphasized; others are regular weight.
- Map tooltips append a **sparkline** of the hovered region's full time series with the current time marked, when the dataset has ≥3 time points.

## 3. Behavior

- Tooltips follow the cursor with smart flipping to stay inside the chart frame; on touch, they anchor to the bottom of the plot and persist until dismissed (tap elsewhere).
- Appear immediately on hover; linger briefly on mouse-out (so the cursor can travel); a click pins/unpins where the chart supports pinning.
- Only one tooltip is visible at a time, across facets too.
- Tooltips never appear in static or video output. Equivalent information must be available through labels or the table tab.

## Test expectations

- Per chart type, snapshot the tooltip content model (not pixels) for: normal point, toleranced point, projected point, missing value, total-row inclusion/exclusion cases.
- Format parity: value shown in tooltip equals table-tab value for the same cell.
- Positioning: tooltip remains within frame bounds at all four chart corners.
