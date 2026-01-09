import { Bounds } from "../../src/utils/index.js"
import { GrapherState } from "../../src/grapher/core/GrapherState.js"
import { LifeExpectancyGrapher } from "../../src/grapher/testData/OwidTestData.sample.js"
import type { GrapherProgrammaticInterface } from "../../src/grapher/core/Grapher.js"
import { ColorSchemeName, GRAPHER_CHART_TYPES } from "../../src/types/index.js"

/**
 * Create a GrapherState configured for Storybook stories.
 * Uses the LifeExpectancyGrapher sample data.
 */
export function createStorybookGrapherState(
    overrides: Partial<GrapherProgrammaticInterface> = {}
): GrapherState {
    return LifeExpectancyGrapher({
        bounds: new Bounds(0, 0, 1100, 660),
        ...overrides,
    })
}

/**
 * Create a GrapherState for a LineChart story
 */
export function createLineChartState(
    overrides: Partial<GrapherProgrammaticInterface> = {}
): GrapherState {
    return LifeExpectancyGrapher({
        bounds: new Bounds(0, 0, 1100, 660),
        chartTypes: [GRAPHER_CHART_TYPES.LineChart],
        ...overrides,
    })
}

/**
 * Create a GrapherState for a DiscreteBarChart story
 */
export function createDiscreteBarChartState(
    overrides: Partial<GrapherProgrammaticInterface> = {}
): GrapherState {
    return LifeExpectancyGrapher({
        bounds: new Bounds(0, 0, 1100, 660),
        chartTypes: [GRAPHER_CHART_TYPES.DiscreteBar],
        ...overrides,
    })
}

/**
 * Create a GrapherState for a StackedArea chart story
 */
export function createStackedAreaChartState(
    overrides: Partial<GrapherProgrammaticInterface> = {}
): GrapherState {
    return LifeExpectancyGrapher({
        bounds: new Bounds(0, 0, 1100, 660),
        chartTypes: [GRAPHER_CHART_TYPES.StackedArea],
        ...overrides,
    })
}

/**
 * Create a GrapherState for a StackedBar chart story
 */
export function createStackedBarChartState(
    overrides: Partial<GrapherProgrammaticInterface> = {}
): GrapherState {
    return LifeExpectancyGrapher({
        bounds: new Bounds(0, 0, 1100, 660),
        chartTypes: [GRAPHER_CHART_TYPES.StackedBar],
        ...overrides,
    })
}

/**
 * Create a GrapherState for a SlopeChart story
 */
export function createSlopeChartState(
    overrides: Partial<GrapherProgrammaticInterface> = {}
): GrapherState {
    return LifeExpectancyGrapher({
        bounds: new Bounds(0, 0, 1100, 660),
        chartTypes: [GRAPHER_CHART_TYPES.SlopeChart],
        ...overrides,
    })
}

/**
 * Create a GrapherState for a ScatterPlot story
 */
export function createScatterPlotState(
    overrides: Partial<GrapherProgrammaticInterface> = {}
): GrapherState {
    return LifeExpectancyGrapher({
        bounds: new Bounds(0, 0, 1100, 660),
        chartTypes: [GRAPHER_CHART_TYPES.ScatterPlot],
        ...overrides,
    })
}

/**
 * Create a GrapherState for a WorldMap story
 * Uses Blues color scheme to match OWID production styling
 */
export function createMapChartState(
    overrides: Partial<GrapherProgrammaticInterface> = {}
): GrapherState {
    return LifeExpectancyGrapher({
        bounds: new Bounds(0, 0, 1100, 660),
        hasMapTab: true,
        tab: "map",
        map: {
            colorScale: {
                baseColorScheme: ColorSchemeName.Blues,
            },
        },
        ...overrides,
    })
}
