# 02 — Chart Definition

**Status:** Draft
**Covers:** The declarative description of a single chart. One definition drives interactive, static, and animated rendering identically. Functional analogue of owid-grapher's config schema (`grapher-schema.010`), simplified: data is bound by dataset + column slug, never by numeric variable ID.

## 1. Shape

A chart definition is a small document with these groups of fields:

### Identity & text

| Field | Meaning | Default |
|---|---|---|
| `title` | Headline | required |
| `subtitle` | Supporting sentence; supports light markup (links, bold, italic) and term definitions (see `10`) | none |
| `note` | Footnote caveat | none |
| `sourceText` | Override the auto-generated source attribution | from manifest sources |
| `slug` | Stable identifier for URLs/exports | required for published charts |

The rendered title may carry **automatic annotations**: appended entity name (when a single entity is shown and not in the title), appended time ("…, 2010 to 2024" reflecting the current selection), and a "Change in" prefix in relative mode. Each annotation is independently suppressible (`titleAnnotations: {entity, time, changePrefix}`).

### Data binding

| Field | Meaning |
|---|---|
| `data` | Dataset reference (name/path/URL) |
| `y` | One or more metric column slugs (the primary measure) |
| `x` | Metric slug (scatter, marimekko width) |
| `size` | Metric slug (scatter bubble size) |
| `colour` | Metric slug for value-driven colouring (scatter, map, line) |
| `filter` | Dimension filters for multi-dimensional datasets |
| Per-binding overrides | Any column metadata field (name, unit, decimals, tolerance, colour, projection) overridable per chart |

### Chart type & tabs

| Field | Meaning | Default |
|---|---|---|
| `types` | Ordered list of chart types this definition supports (e.g., `["line", "discrete-bar"]`); user can switch among them | `["line", "discrete-bar"]` |
| `map` | Map tab config (geography, region, colour scale — see `20`) | none |
| `defaultTab` | `chart` \| `map` \| `table` or a specific type | first type |

A definition with `types: [line, discrete-bar]` behaves as OWID's does: the line view when a time range is selected, the bar view when the timeline is collapsed to a single time.

### Entities & selection

| Field | Meaning | Default |
|---|---|---|
| `selectedEntities` | Initial selection | top N (≈8) entities by latest `y` value, plus any registry-designated defaults |
| `includedEntities` / `excludedEntities` | Hard limits on the choosable set | none |
| `entityColours` | name → colour token overrides | none |
| `selectionMode` | `multi` \| `single` \| `fixed` | `multi` |
| `focusedSeries` | Series highlighted at load | none |

### Time

| Field | Meaning | Default |
|---|---|---|
| `time` | Selected time or range: value, `[start, end]`, `"earliest"`, `"latest"` | `["earliest","latest"]` |
| `timelineRange` | Bounds of the timeline control itself | full data range |
| `hideTimeline` | Lock the time selection | `false` |

### Presentation

| Field | Meaning | Default |
|---|---|---|
| `xAxis` / `yAxis` | Axis config (see `03`) | per chart type |
| `colourScale` | Binned/continuous colour config (see `04`) | per chart type |
| `theme` | Theme name + palette choice (see `04`) | brand default |
| `stackMode` | `absolute` \| `relative` | `absolute` |
| `sort` | `{by: total\|name\|column\|change\|custom, order, column}` | per chart type |
| `facet` | `none` \| `entity` \| `metric` (+ shared/independent axes) | `none` |
| `missingData` | `auto` \| `hide` \| `show` | `auto` |
| `comparisonLines` | Reference lines: `y = expression` with label, or vertical `x =` lines | none |
| `hide…` toggles | `hideLegend`, `hideSeriesLabels`, `hideRelativeToggle`, `hideTotalLabel`, … | type-specific |

Chart-type-specific blocks (`scatter`, `dumbbell`, `marimekko`, `waterfall`, …) hold options that only apply to that type; they are specified in the per-type specs.

## 2. Defaults philosophy

A minimal definition — `data`, `y`, `title` — must produce a publishable chart: sensible type, theme palette, formatted axes, auto entity selection, full interactivity. Every other field is progressive refinement. (Test: the minimal definition for each bundled example dataset renders without warnings.)

## 3. State vs definition

The definition is the *author's* intent. *User* state (current tab, time selection, selected entities, focus, scale toggles, relative mode) layers on top and:

- round-trips through the URL as query parameters (`tab`, `time`, `entities`, `focus`, `yScale`, `stackMode`, `facet`, `region`, …), so any explored view is shareable;
- never mutates the definition;
- can be captured as a "view" — a definition plus state overrides — which is exactly what CLI rendering consumes (see `24`).

URL parameter semantics follow owid-grapher's (e.g., `time=2010..2024`, `time=latest`), adapted to our time encodings (fiscal years: `time=2014-15..2024-25`).

## 4. Versioning & migration

Definitions carry a `schemaVersion`. Loading an older version migrates it forward deterministically; unknown fields are reported, not ignored silently.

## Test expectations

- Round-trip: definition → URL state → definition yields identical rendering.
- Minimal definitions render for every chart type with bundled fixtures.
- Every field has a documented default; serializing a definition omits defaulted fields.
- Migration: fixture definitions at each historical schema version load to identical rendered output.
