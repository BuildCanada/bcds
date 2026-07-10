# 21 — New Chart Types (beyond OWID)

**Status:** Draft
**Purpose:** Types OWID lacks that our budget/spending storytelling needs. Each must plug into the shared machinery (axes `03`, colour `04`, tooltips `06`, selection `07`, chrome `10`, static/video rendering `24`/`25`) exactly like the parity types — no special-case chrome.

## 21.1 Waterfall

Bridges a starting value to an ending value through signed contributions (e.g., last year's deficit → this year's: revenue changes, program spending changes, debt charges).

- **Data:** ordered categories × signed values, plus declared start/end anchors; or two times of one metric with category deltas derived.
- **Marks:** floating bars connected by dashed runners; increases/decreases in themed semantic colours; anchors (start/end/subtotals) in neutral; value labels on each bar.
- **Subtotals:** authors can declare intermediate anchor bars.
- **Interaction:** hover → category, value, running total.
- **Edge cases:** values crossing zero mid-bridge; tiny contributions (min width + tooltip).
- **Tests:** running-total math; subtotal placement; sign colouring.

## 21.2 Treemap

Part-of-whole at one time, where there are too many parts for stacked bars (e.g., all federal departments by spending).

- **Data:** entities (optionally one hierarchy level: `group`) × one positive metric at a target time.
- **Marks:** squarified tiles, area ∝ value; group containers with headers when grouped; tile label + value when it fits, tooltip otherwise.
- **Colour:** by group (categorical) or by a second metric (binned ramp, e.g., % change colouring a spending treemap).
- **Interaction:** hover/focus; click a group drills in (breadcrumb to return); drill state in URL.
- **Time:** single time; timeline re-targets and tiles animate area changes (video primitive).
- **Tests:** areas sum to total within rounding; layout determinism; drill round-trip; label fit rules.

## 21.3 Sankey

Flows between two or more stages (e.g., revenue sources → ministries → programs).

- **Data:** long-format links: `from`, `to`, `value` (+ optional stage ordering); cycles rejected with a clear error.
- **Marks:** nodes as bars sized by throughput, ordered to minimize crossings (deterministic); ribbons with gradient between endpoint colours; node labels with value.
- **Interaction:** hover a ribbon → from→to→value tooltip; hover a node → emphasize all its flows upstream/downstream.
- **Scope guard:** single snapshot in v1 (no animated flow over time); ≤ ~3 stages recommended.
- **Tests:** conservation reporting (in vs out per node, surfaced not enforced); deterministic ordering; cycle rejection.

## 21.4 Bullet / KPI

Dashboard primitives: a single value with context.

- **KPI tile:** headline value (formatted per `03`), label, change vs prior period (signed, semantic colour), optional inline sparkline of the series.
- **Bullet bar:** measure bar vs target marker and qualitative bands (e.g., actual vs budgeted spending); horizontal, compact.
- **Data:** one entity × one metric (+ target column for bullet); sparkline uses the full series.
- These render in thumbnail-mode chrome by default (`10 §6`) and are the primary "dashboard mini-chart" form.
- **Tests:** change math incl. fiscal-year prior period; target band rendering; formatting parity with full charts.

## Prioritization

Waterfall and KPI/bullet first (Canada Spends dashboards), then treemap, then sankey.
