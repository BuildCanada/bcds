# @buildcanada/charts

Part of the [Build Canada Design System](https://github.com/BuildCanada/bcds) monorepo.

Build Canada charts: a pure-function layout core with a single React SVG renderer, deterministic headless rendering, and a CLI. Specs live in `specs/` (architecture: `specs/28-architecture.md`).

## Installation

```bash
npm install @buildcanada/charts
# or
bun add @buildcanada/charts
```

## Peer Dependencies

This library requires the following peer dependencies:

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

## Quick Start

```tsx
import { buildDataset, parseCsv, parseDefinition, parseManifest } from "@buildcanada/charts/core"
import { Chart, Tooltip } from "@buildcanada/charts"
import "@buildcanada/charts/styles.css"

// 1. Dataset: manifest + CSV → Dataset.
const { manifest } = parseManifest(rawManifestJson)
const { rows } = parseCsv(csvText, manifest!)
const { dataset } = buildDataset(manifest!, rows)

// 2. Definition: title + data + y is a publishable chart;
//    everything else is progressive refinement with documented defaults.
const { definition, diagnostics } = parseDefinition({
  title: "Provincial budget spending",
  data: "provincial-budgets",
  y: ["total_spending"],
  selectedEntities: ["Ontario", "Quebec", "British Columbia"],
})
if (definition === null) throw new Error(diagnostics.map((d) => d.message).join("; "))

// 3. Render.
function App() {
  return <Chart definition={definition} dataset={dataset} width={850} height={600} />
}
```

## CLI

The package ships a `charts` binary for validating and rendering chart definitions headlessly:

```bash
npm install -g @buildcanada/charts

charts validate my-chart.json
charts render my-chart.json --out chart.svg
```

See `packages/charts/README.md` for the full CLI reference.

## Documentation

- **[Charts README](packages/charts/README.md)** - Package layout, quick start, and CLI reference
- **[Specs](specs/)** - Functional and architectural specifications
- **[Publishing Guide](docs/PUBLISHING.md)** - How to publish to npm

## Development

```bash
bun install              # Install dependencies
bun run storybook        # Run Storybook on port 6006
bun run build            # Build Storybook for production
bun test                 # Run tests
bun run typecheck        # TypeScript check
```

## Chart Types

- Line charts (with comparison lines and faceting)
- Slope charts
- Discrete bar charts (plain and stacked)
- Stacked area and stacked bar charts
- Dumbbell charts
- Scatter plots
- Marimekko charts

## Architecture

- `src/core/` — DOM-free, React-free: data layer, formatting, themes, text metrics, layout → `ChartScene`
- `src/react/` — `SceneSVG` (the only renderer) + `Chart` + interactive chrome (tooltip, timeline, entity selector, tabs, settings, data table)
- CLI — `charts render|validate` shares the exact same render path via `renderToStaticMarkup`
- TypeScript throughout, SCSS for styling with BEM conventions

## License

MIT
