# 01 — Input Data Format

**Status:** Draft
**Type:** Technical specification (the one spec that prescribes concrete formats). The goal is a format that makes adding new data and data sources easy, without inheriting OWID's variable-ID plumbing.

## 1. Model

A chart consumes a **dataset**: one tidy table plus one manifest.

```
dataset/
  data.csv          # or .json / .parquet — the values
  manifest.json     # metadata: columns, entities, time, sources
```

Datasets may also be supplied inline (a JSON object containing both rows and manifest) or by URL. The chart layer never fetches by opaque numeric variable ID; every reference is by **column slug** within a named dataset.

**One dataset per chart.** A chart never joins across datasets at render time. Ratios or comparisons that span sources (e.g., CMHC housing starts ÷ StatCan population) are joined upstream during data preparation so the chart consumes one coherent table. This keeps render-time behavior simple and auditable; the data pipeline owns identity resolution between sources.

## 2. The data table

Wide, tidy format: **one row per entity per time point** (or one row per entity when there is no time dimension).

```csv
entity,time,total_spending,program_spending,debt_charges
Ontario,2021,189.1,171.3,12.6
Ontario,2022,198.4,180.0,13.1
Quebec,2021,127.0,118.5,8.0
```

### Required columns

| Column | Requirement |
|---|---|
| `entity` | Required. Human-readable display name. Unique per (entity, time) pair. |
| `time` | Required for time-series datasets; omitted entirely for categorical snapshots. |

All other columns are **metric columns** (or auxiliary dimension columns declared in the manifest).

### Value cells

- Numeric metrics: plain numbers, no thousands separators, `.` decimal. Empty cell = missing.
- Categorical metrics: strings.
- Missing data is an empty cell — never `0`, `N/A`, or sentinel numbers. The system distinguishes "missing" from "zero" everywhere downstream (tooltips, maps, interpolation).

## 3. Time encoding

The manifest declares the time grain; the `time` column uses one canonical encoding per grain:

| Grain | Encoding | Examples |
|---|---|---|
| `year` | integer | `2024` |
| `fiscal-year` | string `YYYY-YY` | `2024-25` (display) — ordered by start year |
| `quarter` | string `YYYY-Qn` | `2024-Q3` |
| `month` | string `YYYY-MM` | `2024-07` |
| `date` | ISO 8601 | `2024-07-01` |
| `none` | column absent | snapshot datasets |

Fiscal years are first-class: they sort, animate, and display as fiscal labels ("2024–25"), with the fiscal-year start month declared in the manifest (default April for Canadian federal/provincial data).

## 4. The manifest

JSON (or YAML) document describing the table. Everything needed for correct display lives here, so a chart definition can be terse.

```jsonc
{
  "name": "provincial-budgets",
  "title": "Provincial budget expenditures",
  "timeGrain": "fiscal-year",
  "entity": {
    "label": "province",            // singular noun used in UI copy
    "labelPlural": "provinces",
    "kind": "province"              // optional: links to an entity registry (see §5)
  },
  "columns": {
    "total_spending": {
      "name": "Total spending",
      "type": "numeric",
      "unit": "billion CAD",
      "shortUnit": "$",
      "displayFactor": 1,            // multiply raw values for display
      "decimals": 1,
      "tolerance": 2,                // time-matching tolerance (grain units)
      "description": "Total budgetary expenditure…",
      "colour": null                 // optional fixed series colour token
    }
  },
  "sources": [
    {
      "name": "Public Accounts of Ontario",
      "url": "https://…",
      "publisher": "Treasury Board Secretariat",
      "retrieved": "2026-05-01",
      "citation": "…",
      "license": "Open Government Licence – Ontario"
    }
  ]
}
```

### Column metadata fields

| Field | Meaning | Default |
|---|---|---|
| `name` | Display name (axis, legend, tooltip) | slug, title-cased |
| `type` | `numeric` \| `integer` \| `percentage` \| `currency` \| `categorical` \| `ordinal` | `numeric` |
| `unit` / `shortUnit` | Long unit for tooltips/axis label; short unit for tick labels (`%`, `$`, `t`) | none |
| `currency` | ISO code when `type: currency` | `CAD` |
| `displayFactor` | Multiplier applied for display only | `1` |
| `decimals` | Decimal places for display | `2` (or smart) |
| `tolerance` | Max distance (in time-grain units) to borrow a value from a neighbouring time | `0` |
| `toleranceDirection` | `both` \| `backwards` \| `forwards` | `both` |
| `projection` | Boolean: values are forecasts (rendered distinctly — dashing/pattern) | `false` |
| `projectionFrom` | Time after which values in this column are projections (alternative to a separate column) | none |
| `colour` | Fixed colour token/hex for this metric's series | theme-assigned |
| `order` | For `ordinal` type: explicit value ordering | none |
| `description` | Shown in tooltips/info and data downloads | none |
| `source` | Index/key into `sources` when columns differ in provenance | all sources |

### Source metadata

Sources drive the attribution line, the download README, and the "about this data" surface. Multiple sources are allowed; attribution concatenates `name` values unless the chart definition overrides `sourceText`.

## 5. Entities

### 5.1 Generic entities

By default an entity is just a name. No registry is required — a dataset about federal departments works with zero entity setup.

Optional per-dataset entity metadata (an `entities` array in the manifest or a sibling `entities.csv`) can add:

| Field | Use |
|---|---|
| `name` | Canonical display name (matches `entity` column) |
| `code` | Stable short code (e.g., `ON`, `QC`, `35` SGC code) |
| `nameFr` | French display name |
| `aliases` | Alternate names that resolve to this entity (former names, abbreviations — e.g., "INAC" → "Indigenous and Northern Affairs") |
| `group` | Grouping for the entity picker (e.g., "Atlantic", "Territories") |
| `colour` | Persistent colour token for this entity across all charts |

Aliases handle *renames*. True splits and mergers over time (department A + B → C) are **out of scope for the chart layer**: the dataset must publish one consistent entity concept across its time span; crosswalking historical entities is a data-preparation responsibility.

### 5.2 Entity registries (geography)

Named registries map entity kinds to geometry and canonical naming, enabling map charts and consistent cross-dataset identity:

- `province` — provinces and territories (codes: postal abbreviations and SGC).
- `census-division`, `census-subdivision` — StatCan SGC codes, vintage-tagged.
- `federal-riding` — FED codes, representation-order-tagged (e.g., 2023 order).
- `country` — ISO 3166 (for international comparisons).

A registry provides: canonical names (EN/FR), codes, aliases ("Québec"/"Quebec"), geometry references for map rendering, and membership groupings (regions). Datasets join to registries by `code` first, falling back to alias-tolerant name matching; unmatched entities are reported, never silently dropped.

Registries are data, not code: adding a new geography (health regions, school boards) means adding a registry package, not modifying the chart system.

## 6. Multi-dimensional data

Some datasets have a dimension beyond entity and time (e.g., spending by province × year × category). Two supported shapes:

1. **Wide:** one metric column per category (`spending_health`, `spending_education`). Suits a fixed, small category set; categories become metrics.
2. **Long with a dimension column:** a `dimension` column declared in the manifest (`"dimensions": ["category"]`). The chart definition then binds either by filtering (`category = "Health"`) or by pivoting the dimension into series.

## 7. Derived values

The system computes derived presentations from raw values; manifests never pre-bake them:

- relative change since the selected start time (line charts' relative mode)
- share-of-total per entity or per time (stacked charts' relative mode)
- average annual change between two times (scatter's relative mode)
- absolute and percentage change between two times (table, dumbbell, tooltips)
- ratio metrics via a declared **denominator** column (below)

### Denominators

A column may declare `"denominator": "<column slug>"` (in the manifest, or overridden per chart binding per `02`). Semantics:

- **Alignment:** division happens per (entity, time) cell — the denominator varies by entity and time like any column (provincial population by year, national GDP by fiscal year for a single-entity dataset). Each side resolves with its own `tolerance` first; a cell whose denominator is missing (after tolerance) or zero is **missing**, never infinity or zero, and is flagged like any toleranced/missing value.
- **Units:** the derived display unit is declared, not guessed: `"derivedUnit"` / `"derivedShortUnit"` accompany `denominator` (e.g., `"per 1,000 people"`, `"% of GDP"`). When both columns share a unit (CAD ÷ CAD) and `derivedUnit` is a percentage, values format per `03` percentage rules. `displayFactor` applies after division (e.g., ×1,000 for per-1,000 rates).
- **Consistency:** every surface — axis, tooltip, table, CSV download (formatted variant), map bins, video frames — shows the derived value; the raw numerator/denominator appear in the tooltip's detail line and the table's download for auditability.
- **Stacking:** multiple columns sharing one denominator stack coherently (component ÷ D sums to total ÷ D); stacking columns with *different* denominators is a validation error.

## 8. Validation

A dataset is rejected with actionable errors (not silently coerced) when:

- duplicate (entity, time) rows exist
- the `time` column doesn't parse uniformly under the declared grain
- a declared column is absent from the table, or an undeclared column is present (warning)
- numeric columns contain non-numeric, non-empty cells
- declared registry codes don't resolve

A `validate` operation (also exposed via CLI, see `24`) reports all problems at once with row references.

## Test expectations

- Round-trip: dataset in → table tab and CSV download out reproduce values exactly (post `displayFactor`).
- Fiscal-year datasets sort, format, and animate correctly, including across the year boundary.
- A dataset with no time column renders every non-time chart type without errors.
- Missing cells never render as zero in any chart, tooltip, or table.
- Name/alias resolution: "Québec" and "Quebec" resolve to the same registry entity; unknown entities surface in validation output.
