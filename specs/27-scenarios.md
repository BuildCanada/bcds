# 27 — Worked Scenarios

**Status:** Draft
**Purpose:** Concrete end-to-end scenarios used to pressure-test the specs. Each shows the dataset shape, the chart definition sketch, which specs carry each requirement, and any gaps found (gaps that led to spec amendments are marked ✦ with the spec they changed). These double as acceptance scenarios for the rebuild.

---

## A. Debt-to-GDP over time, by level of government

Consolidated government debt as a share of GDP, decomposed into federal / provincial / Indigenous governments / municipal debt.

### Dataset (`government-debt`)

Single entity ("Canada"), fiscal-year grain, wide metrics:

```csv
entity,time,federal_debt,provincial_debt,indigenous_debt,municipal_debt,gdp
Canada,2014-15,612.3,571.4,…,…,1983.1
```

Manifest: each `*_debt` column declares `"denominator": "gdp"` (per `01 §7`), making its display value debt÷GDP with a derived unit of "% of GDP".

### Chart definition

- `types: [stacked-area, line]`, `y:` the four debt columns — series strategy resolves to **metric series** (one entity, multiple metrics, per `11`/`14`).
- Stacked area: bands sum to total debt-to-GDP because all components share one denominator (`14` stacking math over derived values).
- Relative mode (`14`) re-reads as *share of total government debt* — a second story for free.
- Line tab: one line per level of government; tooltip lists all four + total (`06`).
- Fiscal-year axis labels/timeline per `01 §3`, `08`.

### Coverage & gaps

| Requirement | Spec |
|---|---|
| Ratio metric from two columns | `01 §7` ✦ (denominator semantics were one line; now specified: alignment, units, missing-data rules) |
| Stacked composition of ratios | `14` |
| Fiscal years | `01 §3`, `08` |
| Switch stacked ↔ line | `02 §1 types`, tabs `10 §3` |

Remaining note (not a spec change): a per-province debt-to-GDP variant makes provinces entities and provincial GDP the denominator — same mechanics, but the dataset must carry per-entity denominators (it does, since the denominator is just a column that varies by entity and time).

**Verdict: supported**, after tightening `01 §7`.

---

## B. Federal department spending over time

All federal departments' spending across fiscal years; line exploration, treemap snapshot, bar-race video.

### Dataset (`federal-departments` — already a named fixture in `26 §2`)

Entities = ~120 departments/agencies (no geography), fiscal-year grain, `y: spending` (+ optional `group` entity metadata: portfolio/ministry for picker grouping and treemap grouping).

### Chart definitions

1. **Explore:** `types: [line, discrete-bar]` — entity series; entity picker with search and **sort by spending** (`07 §2`); default selection = top-N by latest value (`02 §1` ✦, previously "dataset-dependent" — now a defined heuristic).
2. **Snapshot:** treemap, tiles = departments, grouped by portfolio, optional colour-by % change (`21.2`).
3. **Video:** `charts animate --motion timeline` on the discrete-bar view → bar race of department rankings (`25 §3`).

### Coverage & gaps

| Requirement | Spec |
|---|---|
| Non-geographic entities at scale | `01 §5.1`, `07 §2` (picker search/sort/group) |
| >palette series pressure | `04 §2` (repeat-with-shade + facet suggestion) |
| Departments renamed over time | `01 §5.1` ✦ — entity `aliases` added so "Indigenous and Northern Affairs"/"INAC" map to one entity |
| True machinery-of-government splits/mergers (A+B → C) | **Out of scope by design** — a data-prep concern; the dataset must publish a consistent department concept over time. Noted as a boundary in `01 §5.1`. |
| Bar race output | `25 §3`, tests in `25` |

**Verdict: supported**, with the merge/split crosswalk explicitly left to data preparation.

---

## C. Housing starts per capita, by province, over time — map + timeline + video

### Dataset (`housing-starts`)

Provinces registry (`01 §5.2`), yearly grain:

```csv
entity,time,housing_starts,population
Ontario,2024,89500,15996989
```

`housing_starts` declares `"denominator": "population"`, `displayFactor` to taste (per 1,000 people). **The join of CMHC starts with StatCan population happens upstream** — charts consume one dataset; cross-dataset joins are an explicit non-goal (`01 §1` ✦ now states this boundary).

### Chart definition

- `types: [line, discrete-bar]`, `map: {geography: "province", region: "Canada"}`, `defaultTab: map`.
- Map: binned colour scale over the *derived* per-capita values; bins computed over the **full time range** so the legend stays stable while animating (`04 §3` ✦ — previously unspecified).
- Timeline on the map tab per `08`/`20`; province hover shows value + sparkline + per-capita derivation in the tooltip (`06`).
- Line tab gives the same data as per-province trends; selection syncs between tabs (`07 §1`).

### Video

```
charts animate housing-starts-map.json --motion timeline \
  --preset social --duration 12 --hold 2 --state tab=map
```

Map fills cross-fade through years with the time annotation counting (`25 §3`); final frame ≡ the static latest-year map (`25 §5`), which is also the dashboard poster image via the image service (`24 §5`).

### Coverage & gaps

| Requirement | Spec |
|---|---|
| Province choropleth | `20` |
| Per-capita derivation | `01 §7` ✦ |
| Stable bins during animation | `04 §3` ✦ |
| Timeline + play on map | `08`, `20` |
| CLI video with presets | `25 §5`, `24 §2` |

**Verdict: supported**, after the bin-stability and denominator amendments.

---

## Summary of amendments these scenarios forced

1. `01 §1` — explicit boundary: one dataset per chart; multi-source ratios are pre-joined upstream.
2. `01 §5.1` — entity `aliases`; merge/split crosswalks declared out of scope.
3. `01 §7` — full denominator semantics: per-(entity, time) alignment, tolerance interaction, derived units, missing-denominator handling, stacking consistency.
4. `02 §1` — defined default-selection heuristic (top-N by latest value) instead of "dataset-dependent".
5. `04 §3` — automatic bins computed over the view's full time range for animation-stable legends.
