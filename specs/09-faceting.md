# 09 — Faceting (Small Multiples)

**Status:** Draft
**Covers:** Splitting one chart into a grid of small charts. Reference behavior: owid-grapher `facet/`.

## 1. Strategies

- `entity` — one panel per selected entity (each panel shows all metrics for that entity).
- `metric` — one panel per y-column (each panel shows all selected entities for that metric).
- `none` — single chart (default).
- Authors set the strategy; readers may change it via settings when the author exposes the control. The sensible strategies for the current data (≥2 entities, ≥2 metrics) are offered; impossible ones are hidden.

## 2. Layout

- Panels arrange in a grid balancing rows/columns to the frame's aspect ratio, filling left-to-right in series order.
- Each panel carries a compact title (entity or metric name, themed); panel titles replace per-series labels inside panels.
- A practical maximum (~12–16 panels) guards readability; beyond it, the UI suggests narrowing the selection.
- Minimum panel size triggers dropping in-panel chrome first (tick labels thin, markers shrink) before refusing to facet.

## 3. Axes

- Each axis is `shared` (one domain across all panels — the default for y) or `independent` (per-panel domain).
- Shared value axes: tick labels render only on the leftmost column (compact-abbreviated), gridlines in all panels align.
- Shared time axes: labels only on the bottom row.
- The shared/independent choice is reader-togglable ("Align axes") when exposed, and persists in URL state.

## 4. Colour & legend

- Colours stay consistent across panels (same series = same colour everywhere).
- `entity` faceting of a single metric: panels are monochrome (palette's primary), since the panel title is the identity — no legend.
- Multi-series panels: one shared legend above the grid; hovering it highlights across all panels simultaneously.

## 5. Interaction

- Hover/focus applies across the grid (hover a series in one panel → it emphasizes in all panels and the legend).
- The timeline, entity selector, and settings act on the whole grid at once.
- Tooltips appear in the hovered panel only.

## 6. Chart-type notes

- Line, stacked area, stacked bar, discrete bar, and map all facet. Faceted maps render one mini-map per time point or metric (shared colour scale mandatory).
- Scatter, slope, marimekko, dumbbell don't facet in v1 (matching OWID); the control is hidden for them.

## Test expectations

- Domain math: shared axes equal the union extent across panels; independent axes equal per-panel extents.
- Grid layout: (panel count, frame aspect) → rows×cols snapshot table.
- Colour consistency across panels for fixture selections.
- Legend hover emphasizes in every panel; URL round-trip of facet + align-axes state.
