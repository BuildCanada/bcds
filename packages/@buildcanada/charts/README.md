# @buildcanada/charts

A configurable data visualization library for creating interactive charts. Extracted from [Our World in Data's Grapher](https://github.com/owid/owid-grapher).

## Features

- **Multiple Chart Types**: Line, Bar, Scatter, Slope, Stacked Area, Stacked Bar, Marimekko, and Choropleth Maps
- **Interactive**: Tooltips, entity selection, time sliders, and more
- **Configurable Branding**: Customize footer text, logos, and attribution
- **Data Explorer**: Multi-dimensional data exploration with dropdowns
- **MobX State Management**: Reactive state updates for smooth interactions
- **TypeScript**: Full type definitions included

## Installation

```bash
npm install @buildcanada/charts
# or
yarn add @buildcanada/charts
```

### Peer Dependencies

This library requires the following peer dependencies:

```bash
npm install react react-dom mobx mobx-react
```

## Quick Start

```tsx
import { ChartsProvider, Grapher } from '@buildcanada/charts'
import '@buildcanada/charts/styles.css'

const config = {
  branding: {
    poweredByText: 'My Organization',
    poweredByUrl: 'https://example.com',
    licenseText: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  dataApi: {
    baseUrl: 'https://api.example.com/v1/indicators/',
  },
}

const chartConfig = {
  title: 'Population Growth',
  type: 'LineChart',
  dimensions: [
    { variableId: 123, property: 'y' },
  ],
}

function App() {
  return (
    <ChartsProvider config={config}>
      <div style={{ width: 850, height: 600 }}>
        <Grapher {...chartConfig} />
      </div>
    </ChartsProvider>
  )
}
```

## Configuration

### ChartsConfig

The `ChartsProvider` accepts a configuration object with the following options:

```typescript
interface ChartsConfig {
  branding?: {
    // License text (e.g., "CC BY")
    licenseText?: string
    // License URL
    licenseUrl?: string
    // "Powered by" text
    poweredByText?: string
    // "Powered by" URL
    poweredByUrl?: string
    // Support email for error messages
    supportEmail?: string
    // Tooltip text for license
    licenseTooltip?: string
  }

  dataApi: {
    // Base URL for data API (required)
    baseUrl: string
    // Custom route builder for variable data
    getVariableDataRoute?: (variableId: number) => string
    // Custom route builder for variable metadata
    getVariableMetadataRoute?: (variableId: number) => string
  }

  errorReporting?: {
    enabled: boolean
    handler?: (error: Error, context: Record<string, unknown>) => void
  }

  analytics?: {
    enabled: boolean
    trackEvent?: (eventName: string, properties: Record<string, unknown>) => void
  }
}
```

## Chart Types

### Line Chart

```tsx
<Grapher
  type="LineChart"
  title="GDP per capita over time"
  dimensions={[{ variableId: 123, property: 'y' }]}
/>
```

### Bar Chart

```tsx
<Grapher
  type="DiscreteBar"
  title="GDP by country"
  dimensions={[{ variableId: 123, property: 'y' }]}
/>
```

### Scatter Plot

```tsx
<Grapher
  type="ScatterPlot"
  title="Life expectancy vs GDP"
  dimensions={[
    { variableId: 123, property: 'x' },
    { variableId: 456, property: 'y' },
  ]}
/>
```

### Map (Choropleth)

```tsx
<Grapher
  type="WorldMap"
  title="Population by country"
  dimensions={[{ variableId: 123, property: 'y' }]}
/>
```

## Data Explorer

The Explorer component allows multi-dimensional data exploration:

```tsx
import { Explorer } from '@buildcanada/charts'

<Explorer
  slug="my-explorer"
  program={explorerProgram}
  grapherConfigs={grapherConfigs}
/>
```

## Advanced Usage

### Using GrapherState directly

For more control, you can manage the GrapherState yourself:

```tsx
import { GrapherState, Grapher } from '@buildcanada/charts'

const grapherState = new GrapherState({
  title: 'My Chart',
  type: 'LineChart',
  // ... other config
})

// Programmatically update state
grapherState.updateFromObject({ selectedEntityNames: ['Canada', 'USA'] })

<Grapher grapherState={grapherState} />
```

### Custom Data Loading

```tsx
import {
  Grapher,
  fetchInputTableForConfig,
  loadVariableDataAndMetadata
} from '@buildcanada/charts'

// Load data from your own API
const data = await loadVariableDataAndMetadata(
  variableId,
  'https://your-api.com/v1/indicators/'
)
```

### Selection Management

```tsx
import { SelectionArray } from '@buildcanada/charts'

const selection = new SelectionArray(['Canada', 'USA', 'Mexico'])

// Listen to changes
reaction(
  () => selection.selectedEntityNames,
  (names) => console.log('Selected:', names)
)
```

## Styling

Import the default styles:

```tsx
import '@buildcanada/charts/styles.css'
```

Or customize with your own CSS. The main CSS classes follow BEM conventions:

- `.GrapherComponent` - Main container
- `.Grapher__header` - Chart header
- `.Grapher__footer` - Chart footer
- `.SourcesFooter` - Sources attribution
- `.Timeline` - Time slider
- `.EntityPicker` - Entity selection UI

## API Reference

### Core Components

| Component | Description |
|-----------|-------------|
| `ChartsProvider` | Configuration context provider |
| `Grapher` | Main chart component |
| `Explorer` | Data exploration component |
| `EntityPicker` | Entity selection UI |
| `GlobalEntitySelector` | Global entity selection |

### State Classes

| Class | Description |
|-------|-------------|
| `GrapherState` | Main chart state manager |
| `SelectionArray` | Entity selection state |
| `FocusArray` | Series focus state |
| `ColorScale` | Color scale configuration |

### Utilities

| Function | Description |
|----------|-------------|
| `loadVariableDataAndMetadata` | Load variable data from API |
| `fetchInputTableForConfig` | Fetch data table for chart config |
| `migrateGrapherConfigToLatestVersion` | Migrate old config format |

## License

MIT

## Credits

This library is based on the [Our World in Data Grapher](https://github.com/owid/owid-grapher), which is also MIT licensed.
