# 20 — Map Chart (Choropleth)

**Status:** Draft
**Purpose:** Values by geography. Unlike OWID (world countries only), geography is pluggable via entity registries (`01 §5.2`); Canadian geographies are the priority. Reference behavior: owid-grapher `mapCharts/`.

## Geographies

| Geography | Notes |
|---|---|
| **Provinces & territories** | The default for Canadian data. Inset/repositioned territories option for legibility. |
| **Census divisions / subdivisions** | SGC-coded, vintage-tagged boundaries; province-level zoom presets. |
| **Federal electoral ridings** | Representation-order-tagged (e.g., 2023 order). |
| **World countries** | For international comparisons (OWID parity). |

- The map's geography is declared in the chart definition (`map.geography`) and must match the dataset's entity registry; mismatches are validation errors listing unmatched entities.
- **Region presets** (`map.region`): named viewports — e.g., "Canada", "Atlantic", "Prairies", a single province (for sub-provincial data), world continents. Selecting a region recenters/rescales; entities outside it de-emphasize.
- Boundary geometry, naming (EN/FR), and aliases come from the registry — adding a geography never touches chart code.

## Data & time

- One bound metric (numeric or categorical) per map view; target time with per-column tolerance (borrowed values flagged in tooltip: "Data from 2019").
- Projection columns render with the projected pattern fill.
- Entities present in geometry but absent from data render in the **No data** treatment (neutral + hatch); entities in data but not geometry are reported, not dropped silently.

## Colour

Binned colour scale per `04 §3` (numeric strategies, manual bins, diverging midpoints, categorical bins). The numeric bin legend (`05`) is mandatory on maps.

## Marks & rendering

- Filled regions with themed borders; hover thickens the border and raises the region.
- Very small regions (PEI at national zoom; urban ridings) get a minimum hover/touch target and may render leader-line dots at small sizes.
- Optional **annotations**: value or name labels inside large regions, leader-lined outside small ones (static exports especially).

## Interaction

- **Hover region →** tooltip: name, value, time (+ tolerance/projection notes), sparkline of its full series (`06 §2`); legend-bin hover highlights all member regions (bidirectional).
- **Click region →** toggles its selection (where enabled); selected regions get a persistent outline and sync with chart-tab selection.
- **Zoom/pan:** region presets always; free zoom/pan for sub-provincial geographies (wheel/pinch/drag, with reset). No 3D globe in v1 (world maps use a standard equal-area projection).
- Map state (region, selection, zoom) persists in URL.

## Timeline

Maps animate with the timeline play per `08 §3` — colours transition between time steps; the time annotates the title. This is a core video primitive (`25`).

## Faceting

Faceted maps: one mini-map per time point or per metric, mandatory shared colour scale and single legend.

## Static rendering

Identical fills/legend; annotations on; attribution includes the boundary source/vintage.

## Edge cases

- Boundary vintage vs data vintage mismatch (e.g., amalgamated municipalities): joins resolve via registry crosswalks where available; otherwise unmatched lists are reported.
- Bilingual names; accented joins per `01 §5.2`.
- All values in one bin: legend still renders the full configured scale.

## Test expectations

- Join correctness: every dataset fixture → exact matched/unmatched entity lists per geography.
- Bin → fill assignment table-driven per strategy (shared with `04` tests).
- Tolerance flags on borrowed values.
- Legend↔map hover linkage drives one shared highlight state.
- Region presets: viewport snapshots; territory-inset variant.
- Geometry resolution suitable for thumbnail through full-screen (visual regression at 3 sizes).
