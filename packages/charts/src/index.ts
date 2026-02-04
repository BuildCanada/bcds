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
} from "./config/index"

// Re-export grapher components
export {
    Grapher,
    type GrapherProgrammaticInterface,
    type GrapherManager,
} from "./grapher/core/Grapher"

export { GrapherState } from "./grapher/core/GrapherState"
export { FetchingGrapher } from "./grapher/core/FetchingGrapher"

// Explorer
export { Explorer } from "./explorer/Explorer"
export type { ExplorerProps } from "./explorer/Explorer"

// Chart State types
export type { ChartState, ChartSeries } from "./grapher/chart/ChartInterface"
export type { LineChartState } from "./grapher/lineCharts/LineChartState"
export type { SlopeChartState } from "./grapher/slopeCharts/SlopeChartState"
export type { DiscreteBarChartState } from "./grapher/barCharts/DiscreteBarChartState"
export type { StackedAreaChartState } from "./grapher/stackedCharts/StackedAreaChartState"
export type { StackedBarChartState } from "./grapher/stackedCharts/StackedBarChartState"
export type { StackedDiscreteBarChartState } from "./grapher/stackedCharts/StackedDiscreteBarChartState"
export type { ScatterPlotChartState } from "./grapher/scatterCharts/ScatterPlotChartState"
export type { MarimekkoChartState } from "./grapher/stackedCharts/MarimekkoChartState"
export { MapChartState } from "./grapher/mapCharts/MapChartState"
export { MapConfig } from "./grapher/mapCharts/MapConfig"

// Data loading
export {
    fetchInputTableForConfig,
    getCachingInputTableFetcher,
    type FetchInputTableForConfigFn,
} from "./grapher/core/loadGrapherTableHelpers"

export { loadVariableDataAndMetadata } from "./grapher/core/loadVariable"

// Color system
export { ColorScale } from "./grapher/color/ColorScale"
export { ColorScaleConfig } from "./grapher/color/ColorScaleConfig"
export { ColorScheme } from "./grapher/color/ColorScheme"
export { ColorSchemes, getColorSchemeForChartType } from "./grapher/color/ColorSchemes"
export {
    NumericBin,
    CategoricalBin,
    type ColorScaleBin,
    isCategoricalBin,
    isNumericBin,
    isNoDataBin,
    isProjectedDataBin,
} from "./grapher/color/ColorScaleBin"

// Selection and Focus
export { SelectionArray } from "./grapher/selection/SelectionArray"
export { FocusArray } from "./grapher/focus/FocusArray"

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
} from "./grapher/core/GrapherConstants"

// Controls
export { EntityPicker } from "./grapher/controls/entityPicker/EntityPicker"
export type { EntityPickerManager } from "./grapher/controls/entityPicker/EntityPickerConstants"
export { GlobalEntitySelector } from "./grapher/controls/globalEntitySelector/GlobalEntitySelector"
export { Dropdown } from "./grapher/controls/Dropdown"

// Schema and migrations
export { defaultGrapherConfig } from "./grapher/schema/defaultGrapherConfig"
export {
    migrateGrapherConfigToLatestVersion,
    migrateGrapherConfigToLatestVersionAndFailOnError,
} from "./grapher/schema/migrations/migrate"

// URL utilities
export {
    setSelectedEntityNamesParam,
    migrateSelectedEntityNamesParam,
    getSelectedEntityNamesParam,
    generateSelectedEntityNamesParam,
    generateFocusedSeriesNamesParam,
    getEntityNamesParam,
} from "./grapher/core/EntityUrlBuilder"

export { grapherConfigToQueryParams } from "./grapher/core/GrapherUrl"

// Chart utilities
export { ChartDimension } from "./grapher/chart/ChartDimension"
export { DimensionSlot } from "./grapher/chart/DimensionSlot"
export { makeChartState } from "./grapher/chart/ChartTypeMap"
export { generateGrapherImageSrcSet } from "./grapher/chart/ChartUtils"

// Slideshow
export {
    type SlideShowManager,
    SlideShowController,
} from "./grapher/slideshowController/SlideShowController"

// Analytics
export { GrapherAnalytics } from "./grapher/core/GrapherAnalytics"

// Rendering helpers
export {
    renderGrapherIntoContainer,
    renderSingleGrapherOnGrapherPage,
} from "./grapher/core/GrapherUseHelpers"

// Map features
export { GeoFeatures } from "./grapher/mapCharts/GeoFeatures"
export {
    MAP_REGION_LABELS,
    type GeoFeature,
    type Direction,
    type Ellipse,
    type EllipseCoords,
} from "./grapher/mapCharts/MapChartConstants"

// Comparison lines
export { isValidVerticalComparisonLineConfig } from "./grapher/comparisonLine/ComparisonLineHelpers"

// Binning strategies
export { hasValidConfigForBinningStrategy } from "./grapher/color/BinningStrategies"

// Chart tabs
export {
    isChartTypeName,
    isValidTabQueryParam,
    findPotentialChartTypeSiblings,
    mapGrapherTabNameToQueryParam,
    mapGrapherTabNameToConfigOption,
    makeLabelForGrapherTab,
} from "./grapher/chart/ChartTabs"

// Guided chart utilities
export {
    useMaybeGlobalGrapherStateRef,
    useGuidedChartLinkHandler,
    GuidedChartContext,
    type GuidedChartContextValue,
    type ArchiveGuidedChartRegistration,
    buildArchiveGuidedChartSrc,
} from "./grapher/chart/guidedChartUtils"

// Legacy conversion
export {
    legacyToChartsTableAndDimensions,
    legacyToChartsTableAndDimensionsWithMandatorySlug,
} from "./grapher/core/LegacyToChartsTable"

export { legacyToCurrentGrapherUrl } from "./grapher/core/GrapherUrlMigrations"

// Test data helpers (useful for demos and testing)
export {
    fakeEntities,
    createTestDataset,
    type TestData,
    type TestMetadata,
} from "./grapher/testData/TestData"
export { LifeExpectancyGrapher } from "./grapher/testData/TestData.sample"

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
} from "./types/index"

// Utilities for data loading
export { Bounds } from "./utils/index"
export { parseDelimited, ChartsTable, BlankChartsTable } from "./core-table/index"
