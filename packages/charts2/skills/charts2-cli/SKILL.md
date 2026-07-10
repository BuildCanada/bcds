---
name: charts2-cli
description: Use when Codex or another coding agent needs to generate, validate, debug, or automate Build Canada charts from the command line with the @buildcanada/charts2 `charts` binary. Trigger for chart definition JSON files, fixture rendering, SVG/PNG chart export, CLI chart validation, render flag selection, shell workflows around `charts render`, or troubleshooting `charts` diagnostics.
---

# Charts CLI

Use the `charts` binary from `@buildcanada/charts2` to validate chart inputs and render deterministic SVG/PNG chart outputs. Prefer this CLI path when the task is to produce chart files rather than embed a React component.

## Install

Install the package globally when `charts` is not already available:

```bash
npm install -g @buildcanada/charts2
```

Confirm the binary is available:

```bash
charts --help
```

## Workflow

1. For a new chart, scaffold first instead of guessing file shapes:

```bash
charts scaffold line "provincial spending"
charts scaffold discrete-bar "population by province"
charts scaffold stacked-area "government debt"
charts scaffold stacked-bar "annual spending composition"
charts scaffold stacked-discrete-bar "program spending by province"
```

2. Inspect the generated or provided `definition.json`. Confirm it has `title`, `data`, and `y`; note whether `data` points at a dataset directory with `manifest.json` and `data.csv`, a single dataset JSON file, or an included fixture name.
3. Run validation before rendering when the definition or data is new:

```bash
charts validate path/to/definition.json
```

4. Render to SVG first for deterministic, inspectable output:

```bash
charts render path/to/definition.json --out path/to/chart.svg
```

5. Render PNG only when the user needs raster output:

```bash
charts render path/to/definition.json --format png --out path/to/chart.png
```

6. For visual changes, inspect generated SVG diffs instead of judging from a PNG alone.

## Scaffold Output

`charts scaffold <chart-type> <name>` creates a directory named from `<name>` and writes:

- `definition.json`: chart configuration
- `manifest.json`: dataset schema and metadata
- `data.csv`: starter table matching the manifest

Supported chart types:

- `line`
- `discrete-bar`
- `stacked-area`
- `stacked-bar`
- `stacked-discrete-bar`

Use `--force` only when replacing an existing scaffold directory is intended.

## Input Formats

### definition.json

The chart definition selects the dataset, chart type, and displayed columns. A minimal file:

```json
{
  "slug": "provincial-spending",
  "title": "Provincial spending",
  "subtitle": "Replace this subtitle with the chart takeaway",
  "data": ".",
  "y": ["value"],
  "types": ["line"],
  "sourceText": "Source name"
}
```

Required fields:

- `title`: display title
- `data`: dataset reference; `"."` means the same directory as `definition.json`
- `y`: one or more metric column slugs declared in `manifest.json`

Common optional fields:

- `slug`: output filename stem when `--out` is omitted
- `subtitle`, `note`, `sourceText`: chart text
- `types`: one or more supported chart types
- `selectedEntities`: initial entity selection
- `time`: a single time, `[start, end]`, `{ "start": "...", "end": "..." }`, `"earliest"`, or `"latest"`
- `sort`: `{ "by": "total" | "name" | "column" | "change" | "custom", "order": "asc" | "desc" }`
- `stackMode`: `"absolute"` or `"relative"`
- `theme`, `locale`: output overrides

### manifest.json

The manifest describes how to parse and format `data.csv`.

```json
{
  "name": "provincial-spending",
  "title": "Provincial spending dataset",
  "timeGrain": "year",
  "entity": {
    "label": "province",
    "labelPlural": "provinces"
  },
  "columns": {
    "value": {
      "name": "Value",
      "type": "numeric",
      "unit": "dollars",
      "shortUnit": "$",
      "decimals": 0
    }
  },
  "sources": [
    {
      "name": "Source name",
      "url": "https://example.com"
    }
  ]
}
```

Required fields:

- `name`: dataset identifier
- `timeGrain`: `"year"`, `"fiscal-year"`, `"quarter"`, `"month"`, `"date"`, or `"none"`
- `columns`: object keyed by CSV metric column slug

Common column fields:

- `name`: display label
- `type`: `"numeric"`, `"integer"`, `"percentage"`, `"currency"`, `"categorical"`, or `"ordinal"`
- `unit`, `shortUnit`, `currency`, `decimals`, `displayFactor`: formatting
- `denominator`: divide this column by another column in the same row
- `projection` or `projectionFrom`: mark forecast values
- `colour`: fixed series colour
- `description`, `source`: metadata

Use `dimensions` for long-format categorical dimensions. Use `entities` when aliases, groups, French names, or stable entity colours are needed.

### data.csv

CSV headers must include:

- `entity`
- `time`, unless `timeGrain` is `"none"`
- every metric slug declared under `manifest.json` `columns`
- any dimension columns listed in `manifest.json` `dimensions`

Example for a single-metric line or discrete-bar chart:

```csv
entity,time,value
Canada,2021,100
Canada,2022,110
Ontario,2021,40
Ontario,2022,46
```

Example for stacked charts:

```csv
entity,time,category_a,category_b,category_c
Canada,2021,40,35,25
Canada,2022,44,38,30
Canada,2023,52,41,34
```

Rules:

- Empty cells are missing values, never zero.
- Numeric columns must contain plain finite numbers, with no commas or unit text.
- Each `(entity, time)` pair must appear at most once.
- Time values must match `timeGrain`: `2024`, `2024-25`, `2024-Q3`, `2024-03`, or `2024-03-31` depending on grain.

### Single-file dataset JSON

Instead of a directory with `manifest.json` and `data.csv`, `data` can point at one JSON file shaped as:

```json
{
  "manifest": {
    "name": "dataset-name",
    "timeGrain": "year",
    "columns": {
      "value": { "name": "Value", "type": "numeric" }
    }
  },
  "rows": [
    { "entity": "Canada", "time": "2023", "value": 125 }
  ]
}
```

## Render Flags

Use `--preset` for common target sizes:

```bash
charts render chart.json --preset social --out social.svg
charts render chart.json --preset thumbnail --out thumb.svg
charts render chart.json --preset slide --format svg,png --out slide.svg
```

Use explicit geometry when the target dimensions are fixed:

```bash
charts render chart.json --width 1200 --height 600 --out chart.svg
```

Use URL-style state to render a specific tab/time/entity selection:

```bash
charts render chart.json --state "tab=line&time=2014-15..2024-25&entities=ON~QC" --out selected.svg
```

Use locale/theme overrides only when the user asks for them or the output target requires them:

```bash
charts render chart.json --locale fr --theme build-canada --out chart-fr.svg
```

Use `--no-chrome` for plot-only output, and `--transparent` when the chart will be composited elsewhere.

## PNG Fonts

PNG rendering needs licensed TTF font files. If PNG rendering fails with a fonts error, pass a licensed font directory:

```bash
charts render chart.json --format png --fonts /path/to/ttf-dir --out chart.png
```

Do not add font binaries to generated output unless the user explicitly asks for them and has the rights to use them.

## Diagnostics

`charts validate` and `charts render` print one diagnostic per stderr line. Treat any `error` diagnostic as blocking output; render intentionally writes nothing when errors are present.

Exit codes:

- `0`: success
- `1`: validation or render failure
- `2`: bad CLI usage, such as an unknown flag, format, preset, missing argument, or invalid positive integer

For failures, fix inputs in this order: malformed JSON, definition schema, dataset loading, unknown `y` columns, bad time bounds, then render/layout diagnostics.

## Useful Fixtures

Included fixture names can be used in chart definitions and validation:

- `provincial-budgets`
- `federal-departments`
- `population-snapshot`
- `government-debt`
- `pathological`

Use `pathological` only for validation/error-path tests.
