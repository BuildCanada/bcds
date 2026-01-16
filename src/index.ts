/**
 * @buildcanada/charts
 *
 * A configurable data visualization library for creating interactive charts.
 * Extracted from Our World in Data's Grapher library.
 *
 * @example
 * ```tsx
 * import { ChartsProvider, Grapher, GrapherState } from '@buildcanada/charts'
 * import '@buildcanada/charts/styles.css'
 *
 * const config = {
 *   branding: { poweredByText: 'My Organization' },
 *   dataApi: { baseUrl: 'https://api.example.com/v1/indicators/' }
 * }
 *
 * function App() {
 *   return (
 *     <ChartsProvider config={config}>
 *       <Grapher {...chartProps} />
 *     </ChartsProvider>
 *   )
 * }
 * ```
 */

// Configuration
export {
    type ChartsConfig,
    type ChartsBranding,
    type ChartsDataApi,
    type ChartsErrorReporting,
    type ChartsAnalytics,
    type LogoConfig,
    defaultChartsConfig,
    mergeWithDefaults,
    ChartsProvider,
    type ChartsProviderProps,
    useChartsConfig,
    useMaybeChartsConfig,
    createFallbackConfig,
    reportError,
    trackEvent,
} from "./config/index.js"

// Re-export grapher components
export {
    Grapher,
    type GrapherProgrammaticInterface,
    type GrapherManager,
} from "./grapher/core/Grapher.js"

export { GrapherState } from "./grapher/core/GrapherState.js"
export { FetchingGrapher } from "./grapher/core/FetchingGrapher.js"

// Explorer
export { Explorer } from "./explorer/Explorer.js"
export type { ExplorerProps } from "./explorer/Explorer.js"

// Chart State types
export type { ChartState, ChartSeries } from "./grapher/chart/ChartInterface.js"
export type { LineChartState } from "./grapher/lineCharts/LineChartState.js"
export type { SlopeChartState } from "./grapher/slopeCharts/SlopeChartState.js"
export type { DiscreteBarChartState } from "./grapher/barCharts/DiscreteBarChartState.js"
export type { StackedAreaChartState } from "./grapher/stackedCharts/StackedAreaChartState.js"
export type { StackedBarChartState } from "./grapher/stackedCharts/StackedBarChartState.js"
export type { StackedDiscreteBarChartState } from "./grapher/stackedCharts/StackedDiscreteBarChartState.js"
export type { ScatterPlotChartState } from "./grapher/scatterCharts/ScatterPlotChartState.js"
export type { MarimekkoChartState } from "./grapher/stackedCharts/MarimekkoChartState.js"
export { MapChartState } from "./grapher/mapCharts/MapChartState.js"
export { MapConfig } from "./grapher/mapCharts/MapConfig.js"

// Data loading
export {
    fetchInputTableForConfig,
    getCachingInputTableFetcher,
    type FetchInputTableForConfigFn,
} from "./grapher/core/loadGrapherTableHelpers.js"

export { loadVariableDataAndMetadata } from "./grapher/core/loadVariable.js"

// Color system
export { ColorScale } from "./grapher/color/ColorScale.js"
export { ColorScaleConfig } from "./grapher/color/ColorScaleConfig.js"
export { ColorScheme } from "./grapher/color/ColorScheme.js"
export { ColorSchemes, getColorSchemeForChartType } from "./grapher/color/ColorSchemes.js"
export {
    NumericBin,
    CategoricalBin,
    type ColorScaleBin,
    isCategoricalBin,
    isNumericBin,
    isNoDataBin,
    isProjectedDataBin,
} from "./grapher/color/ColorScaleBin.js"

// Selection and Focus
export { SelectionArray } from "./grapher/selection/SelectionArray.js"
export { FocusArray } from "./grapher/focus/FocusArray.js"

// Constants
export {
    DEFAULT_GRAPHER_WIDTH,
    DEFAULT_GRAPHER_HEIGHT,
    GRAPHER_THUMBNAIL_WIDTH,
    GRAPHER_THUMBNAIL_HEIGHT,
    DEFAULT_GRAPHER_BOUNDS,
    BASE_FONT_SIZE,
    Patterns,
    latestGrapherConfigSchema,
} from "./grapher/core/GrapherConstants.js"

// Controls
export { EntityPicker } from "./grapher/controls/entityPicker/EntityPicker.js"
export type { EntityPickerManager } from "./grapher/controls/entityPicker/EntityPickerConstants.js"
export { GlobalEntitySelector } from "./grapher/controls/globalEntitySelector/GlobalEntitySelector.js"
export { Dropdown } from "./grapher/controls/Dropdown.js"

// Schema and migrations
export { defaultGrapherConfig } from "./grapher/schema/defaultGrapherConfig.js"
export {
    migrateGrapherConfigToLatestVersion,
    migrateGrapherConfigToLatestVersionAndFailOnError,
} from "./grapher/schema/migrations/migrate.js"

// URL utilities
export {
    setSelectedEntityNamesParam,
    migrateSelectedEntityNamesParam,
    getSelectedEntityNamesParam,
    generateSelectedEntityNamesParam,
    generateFocusedSeriesNamesParam,
    getEntityNamesParam,
} from "./grapher/core/EntityUrlBuilder.js"

export { grapherConfigToQueryParams } from "./grapher/core/GrapherUrl.js"

// Chart utilities
export { ChartDimension } from "./grapher/chart/ChartDimension.js"
export { DimensionSlot } from "./grapher/chart/DimensionSlot.js"
export { makeChartState } from "./grapher/chart/ChartTypeMap.js"
export { generateGrapherImageSrcSet } from "./grapher/chart/ChartUtils.js"

// Slideshow
export {
    type SlideShowManager,
    SlideShowController,
} from "./grapher/slideshowController/SlideShowController.js"

// Analytics
export { GrapherAnalytics } from "./grapher/core/GrapherAnalytics.js"

// Rendering helpers
export {
    renderGrapherIntoContainer,
    renderSingleGrapherOnGrapherPage,
} from "./grapher/core/GrapherUseHelpers.js"

// Map features
export { GeoFeatures } from "./grapher/mapCharts/GeoFeatures.js"
export {
    MAP_REGION_LABELS,
    type GeoFeature,
    type Direction,
    type Ellipse,
    type EllipseCoords,
} from "./grapher/mapCharts/MapChartConstants.js"

// Comparison lines
export { isValidVerticalComparisonLineConfig } from "./grapher/comparisonLine/ComparisonLineHelpers.js"

// Binning strategies
export { hasValidConfigForBinningStrategy } from "./grapher/color/BinningStrategies.js"

// Chart tabs
export {
    isChartTypeName,
    isValidTabQueryParam,
    findPotentialChartTypeSiblings,
    mapGrapherTabNameToQueryParam,
    mapGrapherTabNameToConfigOption,
    makeLabelForGrapherTab,
} from "./grapher/chart/ChartTabs.js"

// Guided chart utilities
export {
    useMaybeGlobalGrapherStateRef,
    useGuidedChartLinkHandler,
    GuidedChartContext,
    type GuidedChartContextValue,
    type ArchiveGuidedChartRegistration,
    buildArchiveGuidedChartSrc,
} from "./grapher/chart/guidedChartUtils.js"

// Legacy conversion
export {
    legacyToOwidTableAndDimensions,
    legacyToOwidTableAndDimensionsWithMandatorySlug,
} from "./grapher/core/LegacyToOwidTable.js"

export { legacyToCurrentGrapherUrl } from "./grapher/core/GrapherUrlMigrations.js"

// Test data helpers (useful for demos and testing)
export {
    fakeEntities,
    createOwidTestDataset,
    type TestData,
    type TestMetadata,
} from "./grapher/testData/OwidTestData.js"
export { LifeExpectancyGrapher } from "./grapher/testData/OwidTestData.sample.js"

// Types commonly needed for data loading
export {
    DimensionProperty,
    GRAPHER_CHART_TYPES,
    ALL_GRAPHER_CHART_TYPES,
    ColorSchemeName,
    MapRegionName,
    type EntityName,
    type EntityId,
    type EntityCode,
} from "./types/index.js"

// Utilities for data loading
export { Bounds } from "./utils/index.js"
export { parseDelimited, OwidTable, BlankOwidTable } from "./core-table/index.js"
