# 22 — Data Table Tab

**Status:** Draft
**Covers:** The table view available on every chart. Reference behavior: owid-grapher `dataTable/`.

## 1. Structure

- One row per entity; entity name column pinned left.
- Per metric:
  - **Single time selected:** one value column (header: metric name + unit + time).
  - **Time range selected:** start value, end value, **absolute change**, **relative change** columns (change columns suppressible per column metadata). Percentage metrics show absolute change in **pp**.
- Values format via the shared service (`03`) exactly as tooltips do.
- A compact **sparkline** column per metric (full series per entity) when the dataset has ≥3 time points.

## 2. Annotations

- Toleranced values carry an info marker with the actual time.
- Missing values render as an em-dash, never blank or zero.
- Projected values are marked.

## 3. Behavior

- **Scope toggle:** "Selected entities" (default when a selection exists) ↔ "All entities".
- **Sort** by any column (default: first metric, descending); **search** filters rows by entity name (alias-tolerant). Sort/search persist in URL.
- Row hover syncs emphasis with the chart where visible (focus model `07`).
- Long tables virtualize/scroll inside the frame; static export renders the top rows with a "full data in download" note.

## 4. Downloads

The table is the canonical accessible representation and matches the CSV download of the current view byte-for-byte (post display formatting differences: CSV carries raw values + a formatted-values option).

## Test expectations

- Column set: (time state, column metadata) → exact columns, table-driven.
- Change math (absolute, relative, pp) vs fixtures; zero-start guard.
- Tolerance/missing/projected markers exactly where flagged upstream.
- Sort + search + scope round-trip via URL.
- CSV parity with displayed table.
