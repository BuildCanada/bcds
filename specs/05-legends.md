# 05 — Legends

**Status:** Draft
**Covers:** When legends appear, their forms, and their interactivity. Reference behavior: owid-grapher `legend/` and in-chart label systems.

## 1. When a legend appears

Charts prefer **direct labelling** over legends: line/slope/stacked-area series are labelled at the line ends; bars are labelled on the row. A legend appears only when direct labelling can't carry the mapping:

- stacked bars over time, stacked discrete bars (metric → colour)
- maps and value-coloured scatter (value → colour bins)
- faceted charts (shared legend above the grid)
- any chart where the author sets `hideSeriesLabels` but colours still need decoding

`hideLegend` suppresses it entirely (e.g., when an external page renders its own).

## 2. Forms

### Categorical legend

- Horizontal row(s) of swatch + label above the plot; wraps as needed; collapses to fewer columns at small sizes.
- Order matches series order (which matches stacking/sort order, so legend and chart read in the same sequence).

### Numeric (binned) legend

- A horizontal strip of contiguous bins with boundary value labels under the strip; open-ended bins arrow outward.
- Categorical bins (incl. **No data**, **Projected**) append after the numeric strip, visually separated.
- Custom bin labels replace boundary values when provided.

### Continuous legend

- A gradient bar with min/mid/max labels.

## 3. Interactivity

- **Hover a legend item/bin →** the corresponding series/entities highlight; everything else dims (see `07`). On maps, hovering a bin highlights all regions in that bin.
- **Click a legend item →** toggles focus on that series (persistent highlight). On maps/scatter with categorical bins, click selects/deselects the member entities where selection is enabled.
- Hidden categories (author-configured) don't appear; their data is excluded from the view.

## 4. Static rendering

In static exports legends render identically minus interactivity; if space is constrained (thumbnails), the legend is the first chrome element to compress (smaller swatches, tighter labels) and the last to be dropped — never dropped on maps.

## Test expectations

- Legend presence matrix: for each chart type × (series strategy, labels on/off, facet on/off), assert legend appears exactly when specified above.
- Bin legend rendering: boundaries, open ends, custom labels, no-data/projected placement.
- Hover/click behaviors drive the same focus state as hovering the marks themselves (one shared model).
- Wrap/compress behavior at small widths produces no overlapping text.
