import { useMemo } from "react"
import {
    ChartsProvider,
    ChartsConfig,
    Grapher,
    GrapherState,
    LifeExpectancyGrapher,
} from "@buildcanada/charts"
// Import chart styles (SCSS file processed by Vite)
import "@buildcanada/charts/src/styles/charts.scss"

/**
 * Example configuration for @buildcanada/charts
 *
 * This demonstrates how to configure the charts library with custom branding
 * and a data API endpoint.
 */
const chartsConfig: ChartsConfig = {
    branding: {
        poweredByText: "Build Canada Charts",
        poweredByUrl: "https://buildcanada.org",
        licenseText: "CC BY 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        licenseTooltip:
            "These charts are licensed under Creative Commons. You are free to use, share, and adapt this material.",
    },
    dataApi: {
        // Replace with your actual data API URL
        baseUrl: "https://api.example.com/v1/indicators/",
    },
    errorReporting: {
        enabled: true,
        handler: (error, context) => {
            console.error("Chart error:", error, context)
        },
    },
}

/**
 * Demo chart showing life expectancy data
 */
function LifeExpectancyChart() {
    const grapherState = useMemo(() => {
        const state = LifeExpectancyGrapher({
            title: "Life Expectancy at Birth",
            subtitle: "Years expected to live at birth, by country",
            selectedEntityNames: ["World", "France", "China", "India"],
            // Don't treat as embedded so the entity selector panel shows
            isEmbeddedInAnOwidPage: false,
        })
        return state
    }, [])

    return (
        <div style={{ width: "100%", minWidth: "1000px", height: "600px" }}>
            <Grapher grapherState={grapherState} />
        </div>
    )
}

/**
 * Demo chart showing a bar chart view
 */
function BarChartDemo() {
    const grapherState = useMemo(() => {
        const state = LifeExpectancyGrapher({
            title: "Life Expectancy by Region (2020)",
            subtitle: "Discrete bar chart showing latest values",
            selectedEntityNames: [
                "World",
                "Europe",
                "Asia",
                "Africa",
                "France",
                "China",
                "India",
            ],
            tab: "DiscreteBar",
            isEmbeddedInAnOwidPage: false,
        })
        return state
    }, [])

    return (
        <div style={{ width: "100%", minWidth: "1000px", height: "600px" }}>
            <Grapher grapherState={grapherState} />
        </div>
    )
}

/**
 * Demo chart showing a map view
 */
function MapChartDemo() {
    const grapherState = useMemo(() => {
        const state = LifeExpectancyGrapher({
            title: "Life Expectancy World Map",
            subtitle: "Geographic distribution of life expectancy",
            hasMapTab: true,
            tab: "WorldMap",
            isEmbeddedInAnOwidPage: false,
        })
        return state
    }, [])

    return (
        <div style={{ width: "100%", minWidth: "1000px", height: "600px" }}>
            <Grapher grapherState={grapherState} />
        </div>
    )
}

/**
 * Example App demonstrating @buildcanada/charts usage
 */
function App() {
    return (
        <ChartsProvider config={chartsConfig}>
            <div className="app-container">
                <header className="app-header">
                    <h1>@buildcanada/charts Demo</h1>
                    <p>
                        A configurable data visualization library extracted from
                        Our World in Data's Grapher
                    </p>
                </header>

                <section className="config-panel">
                    <h3>Current Configuration</h3>
                    <pre>{JSON.stringify(chartsConfig, null, 2)}</pre>
                </section>

                <section className="chart-section">
                    <h2>Line Chart Example</h2>
                    <p>
                        Shows life expectancy trends over time for selected
                        countries
                    </p>
                    <div className="chart-container">
                        <LifeExpectancyChart />
                    </div>
                </section>

                <section className="chart-section">
                    <h2>Bar Chart Example</h2>
                    <p>
                        Displays the latest life expectancy values as discrete
                        bars
                    </p>
                    <div className="chart-container">
                        <BarChartDemo />
                    </div>
                </section>

                <section className="chart-section">
                    <h2>Map Example</h2>
                    <p>
                        Geographic visualization of life expectancy across
                        regions
                    </p>
                    <div className="chart-container">
                        <MapChartDemo />
                    </div>
                </section>

                <section className="chart-section">
                    <h2>Usage Example</h2>
                    <pre
                        style={{
                            background: "#f3f4f6",
                            padding: "1rem",
                            borderRadius: "4px",
                            overflow: "auto",
                        }}
                    >
                        {`import { ChartsProvider, Grapher, LifeExpectancyGrapher } from '@buildcanada/charts'
import '@buildcanada/charts/styles.css'

const config = {
  branding: { poweredByText: 'My Organization' },
  dataApi: { baseUrl: 'https://api.example.com/v1/indicators/' }
}

function App() {
  const grapherState = LifeExpectancyGrapher({
    title: 'Life Expectancy',
    selectedEntityNames: ['World', 'France', 'China']
  })

  return (
    <ChartsProvider config={config}>
      <Grapher grapherState={grapherState} />
    </ChartsProvider>
  )
}`}
                    </pre>
                </section>
            </div>
        </ChartsProvider>
    )
}

export default App
