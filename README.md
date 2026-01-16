# @buildcanada/charts

Part of the [Build Canada Design System](https://github.com/BuildCanada/bcds) monorepo.

A configurable data visualization library for creating interactive charts. Extracted from [Our World in Data's](https://ourworldindata.org) Grapher.

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
  "react-dom": "^19.0.0",
  "mobx": "^6.13.0",
  "mobx-react": "^7.6.0"
}
```

## Quick Start

```tsx
import {
  ChartsProvider,
  Grapher,
  GrapherState,
  GRAPHER_CHART_TYPES,
  DimensionProperty,
  createOwidTestDataset,
  legacyToOwidTableAndDimensionsWithMandatorySlug,
} from "@buildcanada/charts"
import "@buildcanada/charts/styles.css"

// Define your data
const myData = [
  { year: 2020, entity: { id: 1, name: "Canada" }, value: 100 },
  { year: 2021, entity: { id: 1, name: "Canada" }, value: 120 },
]

const metadata = { id: 1, display: { name: "My Metric" } }
const dimensions = [{ variableId: 1, property: DimensionProperty.y }]

const dataset = createOwidTestDataset([{ data: myData, metadata }])
const table = legacyToOwidTableAndDimensionsWithMandatorySlug(dataset, dimensions, {})

const grapherState = new GrapherState({
  title: "My Chart",
  chartTypes: [GRAPHER_CHART_TYPES.LineChart],
  dimensions,
})
grapherState.inputTable = table

function App() {
  return (
    <ChartsProvider>
      <div style={{ width: "800px", height: "600px" }}>
        <Grapher grapherState={grapherState} />
      </div>
    </ChartsProvider>
  )
}
```

## Documentation

- **[Data Loading Guide](docs/DATA_LOADING_GUIDE.md)** - Complete guide on loading CSV/JSON data
- **[Publishing Guide](docs/PUBLISHING.md)** - How to publish to npm

## Development

```bash
bun install              # Install dependencies
bun run storybook        # Run Storybook on port 6006
bun run build            # Build Storybook for production
bun test                 # Run tests
bun run typecheck        # TypeScript check
```

## Components

### Grapher

The main charting component supporting multiple visualization types:
- Line charts
- Bar charts (discrete and stacked)
- Scatter plots
- World and regional maps
- Stacked area charts
- Slope charts
- Marimekko charts

### Explorer

A data explorer that wraps Grapher and adds additional controls for exploring complex datasets.

## Architecture

- Built with **React 19** and **MobX 6** for state management
- Uses TC-39 stage 3 decorators
- TypeScript throughout
- SCSS for styling with BEM conventions

## License

MIT
