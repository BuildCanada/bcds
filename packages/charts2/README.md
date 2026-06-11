# @buildcanada/charts2

Build Canada charts v2: a pure-function layout core with a single React SVG renderer, deterministic headless rendering, and a CLI. Specs: `bcds/specs/` (architecture: `specs/28-architecture.md`).

## Layout

- `src/core/` — DOM-free, React-free: data layer, formatting, themes, text metrics, layout → `ChartScene`
- `src/react/` — `SceneSVG` (the only renderer) + `Chart` + interactive chrome (tooltip, timeline, entity selector, tabs, settings, data table)
- `src/cli/` — `bcds-charts render|validate` (same render path via `renderToStaticMarkup`)
- `src/fixtures/` — committed fixture datasets (spec 26 §2), loadable by name in tests/stories/CLI
- `samples/` — CLI-ready chart definitions, tested against bundled fixtures
- `src/corpus/` — golden SVG corpus + bless script (spec 26 §1.3)
- `src/stories/` — Storybook stories under `Charts2/` (run Storybook from the repo root)

## Quick start

```tsx
import { buildDataset, parseCsv, parseDefinition, parseManifest } from "@buildcanada/charts2/core"
import { Chart, Tooltip } from "@buildcanada/charts2"
import "@buildcanada/charts2/styles.css"

// 1. Dataset: manifest + CSV → Dataset (in-repo code can shortcut with
//    loadFixtureDataset("provincial-budgets") from src/fixtures).
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

`bcds-charts` ships as the package bin (`dist/cli/index.js`; run `bun run build` once before the workspace bin works). From source: `bun run --cwd ../.. charts2 …` or `bun src/cli/index.ts …`.

### `bcds-charts render <definition.json>`

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

The definition's `data` field may reference a dataset directory (`manifest.json` + `data.csv`), a `{manifest, rows}` JSON file, or a bundled fixture name (`provincial-budgets`, `federal-departments`, `population-snapshot`, `government-debt`, `pathological`).

Sample definitions live in `samples/` and can be rendered directly:

```bash
bun src/cli/index.ts render samples/line-provincial-budgets.json --out chart.svg
bun src/cli/index.ts render samples/stacked-area-government-debt.json --preset social
```

### `bcds-charts validate <input>`

Report ALL problems at once (spec 01 §8). Accepts a definition JSON, a dataset directory, a single `manifest.json`, a `{manifest, rows}` JSON file, or a fixture name. Diagnostics print to stderr one per line; a summary line goes to stdout.

### Exit codes

- `0` — success
- `1` — validation/render errors
- `2` — bad usage (unknown flag/preset/format, missing arguments)

## Golden SVG corpus

`src/corpus/corpus.ts` defines 27 named cases (`<type>--<state>--<w>x<h>`) — every chart type × representative states (default, relative, single-time collapse, missing data, French, thumbnail chrome) × 3 sizes (300×160 / 850×600 / 1200×600). `src/corpus/corpus.test.ts` re-renders each case through the CLI pipeline and asserts byte-for-byte equality with the committed reference in `src/corpus/__golden__/`, plus cross-cutting invariants (spec 26 §3): no `NaN`/`Infinity`/exponent coordinates, XML well-formedness, and same-inputs → same-bytes.

After an **intentional** rendering change:

```bash
bun run corpus:bless             # rewrites src/corpus/__golden__/*.svg
git diff src/corpus/__golden__   # review every diff; commit in the same PR
```

## Develop

```bash
bun install
bun run extract-font-metrics   # regenerates metrics JSON + .fonts-cache TTFs
bun run test
bun run build                  # required once before the workspace bin works
bun run --cwd ../.. charts2 render <definition.json>   # CLI from source
bun run --cwd ../.. storybook  # stories under "Charts2/" (repo-root Storybook)
```

Brand font binaries are never committed here or published — only metrics JSON. See `specs/28-architecture.md` §3.

## Deferred (later phases)

Implemented today: line, discrete-bar, stacked-area, stacked-bar, stacked-discrete-bar; themes; en/fr locales; URL state; interactive chrome; CLI render/validate. Per the phased plan, **not yet implemented**:

- Faceting — `facet: entity|metric` parses but small multiples do not lay out yet (spec 09)
- Comparison lines — `comparisonLines` parses but does not render (spec 02)
- Further chart types: maps (spec 20), scatter (spec 18), slope (spec 12), dumbbell (spec 17), marimekko (spec 19)
- Motion/video rendering — `animate`, golden frames (spec 25)
- Explorer — control sweeps over a chart family (spec 23)
