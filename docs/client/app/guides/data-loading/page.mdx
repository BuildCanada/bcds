# Data Loading Guide

This guide explains how to use `@buildcanada/charts` as a client library with your own CSV or JSON data.

## Installation

```bash
npm install @buildcanada/charts
# or
bun add @buildcanada/charts
```

### Peer Dependencies

Your application must also have these dependencies:

```bash
npm install react react-dom mobx mobx-react
```

## Quick Start

```tsx
import { ChartsProvider, Grapher, GrapherState } from "@buildcanada/charts"
import "@buildcanada/charts/styles.css"

function App() {
  const grapherState = createYourChart()

  return (
    <ChartsProvider>
      <div style={{ width: "800px", height: "600px" }}>
        <Grapher grapherState={grapherState} />
      </div>
    </ChartsProvider>
  )
}
```

## Data Format Requirements

All charts require data with these mandatory columns:
- **Entity Name** (or "entity"): The name of the data series (e.g., country, category)
- **Year** (or time column): The time dimension
- **Value column(s)**: Your numeric data

## Method 1: Using TestData Format (Recommended)

The simplest approach uses the `createTestDataset` helper with a structured array:

```tsx
import {
  Grapher,
  GrapherState,
  createTestDataset,
  fakeEntities,
  legacyToChartsTableAndDimensionsWithMandatorySlug,
  GRAPHER_CHART_TYPES,
  DimensionProperty,
} from "@buildcanada/charts"
import type { TestData, TestMetadata } from "@buildcanada/charts"

// Step 1: Define your data as TestData array
const myData: TestData = [
  { year: 2020, entity: { id: 1, name: "Canada", code: "CAN" }, value: 100 },
  { year: 2021, entity: { id: 1, name: "Canada", code: "CAN" }, value: 120 },
  { year: 2020, entity: { id: 2, name: "USA", code: "USA" }, value: 200 },
  { year: 2021, entity: { id: 2, name: "USA", code: "USA" }, value: 220 },
]

// Step 2: Define metadata for your indicator
const myMetadata: TestMetadata = {
  id: 1, // unique identifier for this variable
  display: {
    name: "GDP Growth",
    unit: "%",
    shortUnit: "%",
    numDecimalPlaces: 1,
  },
}

// Step 3: Create the dataset and table
const variableId = myMetadata.id
const dimensions = [
  { variableId, property: DimensionProperty.y },
]

const dataset = createTestDataset([
  { data: myData, metadata: myMetadata },
])

const table = legacyToChartsTableAndDimensionsWithMandatorySlug(
  dataset,
  dimensions,
  {} // optional: color mapping for entities
)

// Step 4: Create GrapherState
const grapherState = new GrapherState({
  title: "GDP Growth by Country",
  dimensions,
  chartTypes: [GRAPHER_CHART_TYPES.LineChart],
})
grapherState.inputTable = table
```

## Method 2: Loading from JSON

If you have JSON data from an API or file:

```tsx
import {
  Grapher,
  GrapherState,
  createTestDataset,
  legacyToChartsTableAndDimensionsWithMandatorySlug,
  GRAPHER_CHART_TYPES,
  DimensionProperty,
} from "@buildcanada/charts"

// Your JSON data
const jsonData = [
  { country: "Canada", year: 2020, gdp: 1.8 },
  { country: "Canada", year: 2021, gdp: 5.0 },
  { country: "USA", year: 2020, gdp: -3.4 },
  { country: "USA", year: 2021, gdp: 5.7 },
]

// Create entity mapping (id must be unique per entity)
const entityMap = new Map<string, { id: number; name: string }>()
let entityId = 1
jsonData.forEach((row) => {
  if (!entityMap.has(row.country)) {
    entityMap.set(row.country, { id: entityId++, name: row.country })
  }
})

// Transform to TestData format
const testData = jsonData.map((row) => ({
  year: row.year,
  entity: entityMap.get(row.country)!,
  value: row.gdp,
}))

// Create metadata
const metadata = {
  id: 1,
  display: {
    name: "GDP Growth Rate",
    unit: "%",
    numDecimalPlaces: 1,
  },
}

// Build chart
const dimensions = [{ variableId: 1, property: DimensionProperty.y }]
const dataset = createTestDataset([{ data: testData, metadata }])
const table = legacyToChartsTableAndDimensionsWithMandatorySlug(dataset, dimensions, {})

const grapherState = new GrapherState({
  title: "GDP Growth Rate",
  dimensions,
  chartTypes: [GRAPHER_CHART_TYPES.LineChart],
})
grapherState.inputTable = table
```

## Method 3: Loading from CSV

For CSV data, parse it first then convert to the TestData format:

```tsx
import { parseDelimited } from "@buildcanada/charts"

// CSV string (could be from file or fetch)
const csvString = `country,year,value
Canada,2020,100
Canada,2021,120
USA,2020,200
USA,2021,220`

// Parse CSV to rows
const rows = parseDelimited(csvString) as Array<{
  country: string
  year: string
  value: string
}>

// Create entity mapping
const entityMap = new Map<string, { id: number; name: string }>()
let entityId = 1
rows.forEach((row) => {
  if (!entityMap.has(row.country)) {
    entityMap.set(row.country, { id: entityId++, name: row.country })
  }
})

// Convert to TestData format
const testData = rows.map((row) => ({
  year: parseInt(row.year, 10),
  entity: entityMap.get(row.country)!,
  value: parseFloat(row.value),
}))

// Then create the chart as in Method 2...
```

### Loading CSV from a File (Browser)

```tsx
async function loadCSVFile(file: File) {
  const text = await file.text()
  const rows = parseDelimited(text)
  // Transform to TestData format...
}

// Usage with file input
<input type="file" accept=".csv" onChange={(e) => {
  if (e.target.files?.[0]) {
    loadCSVFile(e.target.files[0])
  }
}} />
```

### Loading CSV from URL

```tsx
async function loadCSVFromUrl(url: string) {
  const response = await fetch(url)
  const text = await response.text()
  const rows = parseDelimited(text)
  // Transform to TestData format...
}
```

## Chart Types

Configure the chart type using `chartTypes`:

```tsx
import { GRAPHER_CHART_TYPES } from "@buildcanada/charts"

// Available chart types:
GRAPHER_CHART_TYPES.LineChart      // Time series line chart
GRAPHER_CHART_TYPES.DiscreteBar    // Bar chart (single time point)
GRAPHER_CHART_TYPES.StackedArea    // Stacked area chart
GRAPHER_CHART_TYPES.StackedBar     // Stacked bar chart
GRAPHER_CHART_TYPES.SlopeChart     // Slope chart (two time points)
GRAPHER_CHART_TYPES.ScatterPlot    // Scatter plot (requires x and y)
GRAPHER_CHART_TYPES.Marimekko      // Marimekko chart

// Example: Line chart
const grapherState = new GrapherState({
  chartTypes: [GRAPHER_CHART_TYPES.LineChart],
  // ...
})

// Example: Bar chart
const grapherState = new GrapherState({
  chartTypes: [GRAPHER_CHART_TYPES.DiscreteBar],
  // ...
})
```

## Map Charts

For map visualizations, set `hasMapTab: true` and `tab: "map"`:

```tsx
import { MapRegionName, ColorSchemeName } from "@buildcanada/charts"

const grapherState = new GrapherState({
  dimensions,
  hasMapTab: true,
  tab: "map",
  map: {
    region: MapRegionName.World, // or MapRegionName.Canada for provincial maps
    colorScale: {
      baseColorScheme: ColorSchemeName.Blues,
    },
  },
})
grapherState.inputTable = table
```

**Important for maps**: Entity names must match the geographic regions in the map data. For world maps, use standard country names. For Canada maps, use province/territory names.

## Multiple Variables (Scatter Plots)

Scatter plots require both X and Y variables:

```tsx
// Define two variables
const xData: TestData = [/* x-axis values */]
const yData: TestData = [/* y-axis values */]

const xMetadata = { id: 1, display: { name: "GDP per capita" } }
const yMetadata = { id: 2, display: { name: "Life expectancy" } }

const dimensions = [
  { variableId: 1, property: DimensionProperty.x },
  { variableId: 2, property: DimensionProperty.y },
]

const dataset = createTestDataset([
  { data: xData, metadata: xMetadata },
  { data: yData, metadata: yMetadata },
])

const table = legacyToChartsTableAndDimensionsWithMandatorySlug(dataset, dimensions, {})

const grapherState = new GrapherState({
  chartTypes: [GRAPHER_CHART_TYPES.ScatterPlot],
  dimensions,
})
grapherState.inputTable = table
```

## Pre-selecting Entities

To show specific entities by default:

```tsx
const grapherState = new GrapherState({
  // ...
  selectedEntityNames: ["Canada", "USA", "Germany"],
})
```

## Entity Colors

Assign custom colors to entities:

```tsx
const entityColors = {
  "Canada": "#ff0000",
  "USA": "#0000ff",
  "Germany": "#ffcc00",
}

const table = legacyToChartsTableAndDimensionsWithMandatorySlug(
  dataset,
  dimensions,
  entityColors // Pass colors here
)
```

## Complete Example: CSV to Line Chart

```tsx
import {
  ChartsProvider,
  Grapher,
  GrapherState,
  createTestDataset,
  legacyToChartsTableAndDimensionsWithMandatorySlug,
  parseDelimited,
  GRAPHER_CHART_TYPES,
  DimensionProperty,
  Bounds,
} from "@buildcanada/charts"
import "@buildcanada/charts/styles.css"

function CSVChart({ csvData }: { csvData: string }) {
  // Parse CSV
  const rows = parseDelimited(csvData) as Array<{
    entity: string
    year: string
    value: string
  }>

  // Build entity map
  const entityMap = new Map<string, { id: number; name: string }>()
  let entityId = 1
  rows.forEach((row) => {
    if (!entityMap.has(row.entity)) {
      entityMap.set(row.entity, { id: entityId++, name: row.entity })
    }
  })

  // Convert to TestData
  const testData = rows.map((row) => ({
    year: parseInt(row.year, 10),
    entity: entityMap.get(row.entity)!,
    value: parseFloat(row.value),
  }))

  // Build chart
  const variableId = 1
  const dimensions = [{ variableId, property: DimensionProperty.y }]

  const dataset = createTestDataset([{
    data: testData,
    metadata: {
      id: variableId,
      display: { name: "Value", numDecimalPlaces: 0 },
    },
  }])

  const table = legacyToChartsTableAndDimensionsWithMandatorySlug(
    dataset,
    dimensions,
    {}
  )

  const grapherState = new GrapherState({
    title: "My Chart",
    chartTypes: [GRAPHER_CHART_TYPES.LineChart],
    dimensions,
    bounds: new Bounds(0, 0, 800, 600),
  })
  grapherState.inputTable = table

  return (
    <ChartsProvider>
      <div style={{ width: "800px", height: "600px" }}>
        <Grapher grapherState={grapherState} />
      </div>
    </ChartsProvider>
  )
}

// Usage
const csv = `entity,year,value
Canada,2020,100
Canada,2021,110
Canada,2022,105
USA,2020,200
USA,2021,210
USA,2022,215`

function App() {
  return <CSVChart csvData={csv} />
}
```

## Using fakeEntities for Common Countries

The library provides pre-defined entity mappings for countries and regions:

```tsx
import { fakeEntities } from "@buildcanada/charts"

// fakeEntities contains ~200 countries and regions with pre-assigned IDs
const canadaEntity = fakeEntities["Canada"]    // { id: X, name: "Canada", code: "CAN" }
const usaEntity = fakeEntities["United States"] // { id: Y, name: "United States", code: "USA" }

// Use in your data
const testData = [
  { year: 2020, entity: fakeEntities["Canada"], value: 100 },
  { year: 2020, entity: fakeEntities["United States"], value: 200 },
]
```

## ChartsProvider Configuration

Customize the charts with global configuration:

```tsx
import { ChartsProvider } from "@buildcanada/charts"

const config = {
  branding: {
    poweredByText: "My Organization",
    logo: {
      type: "none", // or "buildCanada", "canadaSpends", "custom"
    },
  },
  dataApi: {
    baseUrl: "https://api.example.com/v1/indicators/",
  },
}

function App() {
  return (
    <ChartsProvider config={config}>
      {/* Your charts */}
    </ChartsProvider>
  )
}
```

## TypeScript Types

Key types for working with data:

```tsx
import type {
  TestData,        // Array of { year, entity, value }
  TestMetadata,    // Variable metadata with display options
  EntityName,      // string
  EntityId,        // number
  EntityCode,      // string
} from "@buildcanada/charts"

// TestData structure
type TestData = Array<{
  year: number
  entity: { id: EntityId; code?: EntityCode; name?: EntityName }
  value: string | number
}>

// TestMetadata structure
type TestMetadata = {
  id: number
  display?: {
    name?: string
    unit?: string
    shortUnit?: string
    numDecimalPlaces?: number
  }
}
```

## Troubleshooting

### Chart shows no data
- Ensure entity names match between your data and the chart
- Verify the year values are numbers, not strings
- Check that `dimensions` includes the correct `variableId`

### Map shows blank regions
- Entity names must exactly match geographic region names
- For world maps, use standard country names (e.g., "United States", not "USA")
- For Canada maps, use full province names (e.g., "British Columbia", not "BC")

### Colors not applying
- Pass the color map to `legacyToChartsTableAndDimensionsWithMandatorySlug`
- Entity names in the color map must exactly match data entity names
