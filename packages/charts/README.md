# @buildcanada/charts

Build Canada charts: a pure-function layout core with a single React SVG renderer, deterministic headless rendering, and a CLI. Specs: `bcds/specs/` (architecture: `specs/28-architecture.md`).

## Layout

- `src/core/` — DOM-free, React-free: data layer, formatting, themes, text metrics, layout → `ChartScene`
- `src/react/` — `SceneSVG` (the only renderer) + `Chart` + interactive chrome (tooltip, timeline, entity selector, tabs, settings, data table)
- CLI — `charts render|validate` (same render path via `renderToStaticMarkup`)
- `src/fixtures/` — committed fixture datasets (spec 26 §2), loadable by name in tests/stories/CLI
- `samples/` — CLI-ready chart definitions, tested against included fixtures
- `src/corpus/` — golden SVG corpus + bless script (spec 26 §1.3)
- `src/stories/` — Storybook stories under `Charts/`

## Quick start

```tsx
import { buildDataset, parseCsv, parseDefinition, parseManifest } from "@buildcanada/charts/core"
import { Chart, Tooltip } from "@buildcanada/charts"
import "@buildcanada/charts/styles.css"

// 1. Dataset: manifest + CSV → Dataset.
const { manifest } = parseManifest(rawManifestJson)
const { rows } = parseCsv(csvText, manifest!)
const { dataset } = buildDataset(manifest!, rows)

// 2. Definition: title + data + y is a publishable chart (spec 02 §2);
//    everything else is progressive refinement with documented defaults.
const { definition, diagnostics } = parseDefinition({
    title: "Provincial budget spending",
    data: "provincial-budgets",
    y: ["total_spending"],
    selectedEntities: ["Ontario", "Quebec", "British Columbia"],
})
if (definition === null) throw new Error(diagnostics.map((d) => d.message).join("; "))

// 3. Render.
export function Demo() {
    return (
        <Chart
            definition={definition}
            dataset={dataset}
            width={850}
            height={600}
            renderTooltip={({ tooltip }) => (
                <Tooltip model={tooltip} x={0} y={0} bounds={{ width: 360, height: 280 }} />
            )}
        />
    )
}
```

Headless (no React state, no DOM): `layoutChart({ definition, dataset, size })` → `ChartScene` → `renderToStaticMarkup(<SceneSVG scene idPrefix=… />)` — exactly what the CLI does.

## CLI

Install the CLI globally:

```bash
npm install -g @buildcanada/charts
```

Then call it with `charts`:

```bash
charts --help
```

### `charts render <definition.json>`

Render one chart definition to SVG/PNG. The SVG string is a pure function of definition + dataset + flags (spec 24 §3) — same inputs, same bytes. On any error diagnostic, nothing is written.

| Flag | Meaning |
|---|---|
| `--out <path>` | Output path; `-` writes SVG to stdout (default `<slug>.<format>`) |
| `--format svg\|png` | Repeatable or comma-separated, e.g. `--format svg,png` (default `svg`) |
| `--width <px>` / `--height <px>` | Size (default 850×600); aspect clamped to [0.5, 2] with a warning |
| `--preset <name>` | `social` (1200×628) \| `square` (1080×1080) \| `thumbnail` (300×160, minimal chrome) \| `slide` (1920×1080) |
| `--scale <n>` | PNG raster scale (default 2) |
| `--theme <name>` | Theme name (default from definition) |
| `--locale en\|fr` | Locale override (default from definition) |
| `--state <qs>` | URL-style view state, e.g. `"tab=line&time=2014-15..2024-25&entities=ON~QC"` |
| `--transparent` | No background fill |
| `--no-chrome` | Plot only (no header/footer) |
| `--fonts <dir>` | TTF directory for PNG rasterization (default: the package `.fonts-cache`) |

The definition's `data` field may reference a dataset directory (`manifest.json` + `data.csv`), a `{manifest, rows}` JSON file, or an included fixture name (`provincial-budgets`, `federal-departments`, `population-snapshot`, `government-debt`, `pathological`).

Sample definitions can be rendered directly:

```bash
charts render samples/line-provincial-budgets.json --out chart.svg
charts render samples/stacked-area-government-debt.json --preset social
```

### `charts validate <input>`

Report ALL problems at once (spec 01 §8). Accepts a definition JSON, a dataset directory, a single `manifest.json`, a `{manifest, rows}` JSON file, or a fixture name. Diagnostics print to stderr one per line; a summary line goes to stdout.

### `charts scaffold <chart-type> <name>`

Create a starter chart directory containing `definition.json`, `manifest.json`, and `data.csv`.

```bash
charts scaffold line "provincial spending"
charts scaffold discrete-bar "population by province"
charts scaffold stacked-area "government debt"
charts scaffold stacked-bar "annual spending composition"
charts scaffold stacked-discrete-bar "program spending by province"
```

The generated `definition.json` uses `"data": "."`, so it resolves the colocated `manifest.json` and `data.csv`. Pass `--force` to replace an existing scaffold directory.

### `charts install-skill`

Install the included `charts-cli` agent skill, which teaches coding agents how to validate and render charts with this CLI.

```bash
charts install-skill
charts install-skill --agent claude
charts install-skill --agent codex --force
charts install-skill --path ~/.codex/skills
```

`--agent auto` is the default and installs into detected Codex and Claude skill directories. Use `--agent all` to install into both conventional locations, or `--path <skills-dir>` for any agent that reads Agent Skills-style folders containing `SKILL.md`.

### Exit codes

- `0` — success
- `1` — validation/render errors
- `2` — bad usage (unknown flag/preset/format, missing arguments)

## Golden SVG corpus

`src/corpus/corpus.ts` defines 27 named cases (`<type>--<state>--<w>x<h>`) — every chart type × representative states (default, relative, single-time collapse, missing data, French, thumbnail chrome) × 3 sizes (300×160 / 850×600 / 1200×600). `src/corpus/corpus.test.ts` re-renders each case through the CLI pipeline and asserts byte-for-byte equality with the committed reference in `src/corpus/__golden__/`, plus cross-cutting invariants (spec 26 §3): no `NaN`/`Infinity`/exponent coordinates, XML well-formedness, and same-inputs → same-bytes.

After an **intentional** rendering change:

Run the corpus bless script, then review every golden SVG diff before publishing the change.

## Develop

Use the package scripts for dependency installation, font metrics, tests, build, and Storybook. For CLI usage, install globally and call `charts`.

Brand font binaries are never committed here or published — only metrics JSON. See `specs/28-architecture.md` §3.

## Deferred (later phases)

Implemented today: line, discrete-bar, stacked-area, stacked-bar, stacked-discrete-bar; themes; en/fr locales; URL state; interactive chrome; CLI render/validate; faceting (small multiples); comparison lines. Per the phased plan, **not yet implemented**:

- Further chart types: maps (spec 20), scatter (spec 18), slope (spec 12), dumbbell (spec 17), marimekko (spec 19)
- Motion/video rendering — `animate`, golden frames (spec 25)
- Explorer — control sweeps over a chart family (spec 23)

Partial (spec 09/02, with documented gaps):

- Faceting — `facet: entity|metric` lays out a grid of small multiples with a shared value domain, per-panel titles, a shared legend, and a 16-panel cap. Not yet: the reader-togglable independent-axis mode, leftmost-column/bottom-row tick thinning, monochrome single-metric entity facets, and faceted maps.
- Comparison lines — `comparisonLines` render on line and stacked-area charts (horizontal `y` and vertical `x` reference lines with labels). Other chart types emit a `comparison-lines-unsupported` warning.
