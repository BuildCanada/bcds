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
} from "./config/index.ts"

// Re-export grapher components
export {
    Grapher,
    type GrapherProgrammaticInterface,
    type GrapherManager,
} from "./grapher/core/Grapher.tsx"

export { GrapherState } from "./grapher/core/GrapherState.ts"
export { FetchingGrapher } from "./grapher/core/FetchingGrapher.tsx"

// Explorer
export { Explorer } from "./explorer/Explorer.tsx"
export type { ExplorerProps } from "./explorer/Explorer.tsx"

// Chart State types
export type { ChartState, ChartSeries } from "./grapher/chart/ChartInterface.ts"
export type { LineChartState } from "./grapher/lineCharts/LineChartState.ts"
export type { SlopeChartState } from "./grapher/slopeCharts/SlopeChartState.ts"
export type { DiscreteBarChartState } from "./grapher/barCharts/DiscreteBarChartState.ts"
export type { StackedAreaChartState } from "./grapher/stackedCharts/StackedAreaChartState.ts"
export type { StackedBarChartState } from "./grapher/stackedCharts/StackedBarChartState.ts"
export type { StackedDiscreteBarChartState } from "./grapher/stackedCharts/StackedDiscreteBarChartState.ts"
export type { ScatterPlotChartState } from "./grapher/scatterCharts/ScatterPlotChartState.ts"
export type { MarimekkoChartState } from "./grapher/stackedCharts/MarimekkoChartState.ts"
export { MapChartState } from "./grapher/mapCharts/MapChartState.ts"
export { MapConfig } from "./grapher/mapCharts/MapConfig.ts"

// Data loading
export {
    fetchInputTableForConfig,
    getCachingInputTableFetcher,
    type FetchInputTableForConfigFn,
} from "./grapher/core/loadGrapherTableHelpers.ts"

export { loadVariableDataAndMetadata } from "./grapher/core/loadVariable.ts"

// Color system
export { ColorScale } from "./grapher/color/ColorScale.ts"
export { ColorScaleConfig } from "./grapher/color/ColorScaleConfig.ts"
export { ColorScheme } from "./grapher/color/ColorScheme.ts"
export { ColorSchemes, getColorSchemeForChartType } from "./grapher/color/ColorSchemes.ts"
export {
    NumericBin,
    CategoricalBin,
    type ColorScaleBin,
    isCategoricalBin,
    isNumericBin,
    isNoDataBin,
    isProjectedDataBin,
} from "./grapher/color/ColorScaleBin.ts"

// Selection and Focus
export { SelectionArray } from "./grapher/selection/SelectionArray.ts"
export { FocusArray } from "./grapher/focus/FocusArray.ts"

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
} from "./grapher/core/GrapherConstants.ts"

// Controls
export { EntityPicker } from "./grapher/controls/entityPicker/EntityPicker.tsx"
export type { EntityPickerManager } from "./grapher/controls/entityPicker/EntityPickerConstants.ts"
export { GlobalEntitySelector } from "./grapher/controls/globalEntitySelector/GlobalEntitySelector.tsx"
export { Dropdown } from "./grapher/controls/Dropdown.tsx"

// Schema and migrations
export { defaultGrapherConfig } from "./grapher/schema/defaultGrapherConfig.ts"
export {
    migrateGrapherConfigToLatestVersion,
    migrateGrapherConfigToLatestVersionAndFailOnError,
} from "./grapher/schema/migrations/migrate.ts"

// URL utilities
export {
    setSelectedEntityNamesParam,
    migrateSelectedEntityNamesParam,
    getSelectedEntityNamesParam,
    generateSelectedEntityNamesParam,
    generateFocusedSeriesNamesParam,
    getEntityNamesParam,
} from "./grapher/core/EntityUrlBuilder.ts"

export { grapherConfigToQueryParams } from "./grapher/core/GrapherUrl.ts"

// Chart utilities
export { ChartDimension } from "./grapher/chart/ChartDimension.ts"
export { DimensionSlot } from "./grapher/chart/DimensionSlot.ts"
export { makeChartState } from "./grapher/chart/ChartTypeMap.tsx"
export { generateGrapherImageSrcSet } from "./grapher/chart/ChartUtils.tsx"

// Slideshow
export {
    type SlideShowManager,
    SlideShowController,
} from "./grapher/slideshowController/SlideShowController.tsx"

// Analytics
export { GrapherAnalytics } from "./grapher/core/GrapherAnalytics.ts"

// Rendering helpers
export {
    renderGrapherIntoContainer,
    renderSingleGrapherOnGrapherPage,
} from "./grapher/core/GrapherUseHelpers.tsx"

// Map features
export { GeoFeatures } from "./grapher/mapCharts/GeoFeatures.ts"
export {
    MAP_REGION_LABELS,
    type GeoFeature,
    type Direction,
    type Ellipse,
    type EllipseCoords,
} from "./grapher/mapCharts/MapChartConstants.ts"

// Comparison lines
export { isValidVerticalComparisonLineConfig } from "./grapher/comparisonLine/ComparisonLineHelpers.ts"

// Binning strategies
export { hasValidConfigForBinningStrategy } from "./grapher/color/BinningStrategies.ts"

// Chart tabs
export {
    isChartTypeName,
    isValidTabQueryParam,
    findPotentialChartTypeSiblings,
    mapGrapherTabNameToQueryParam,
    mapGrapherTabNameToConfigOption,
    makeLabelForGrapherTab,
} from "./grapher/chart/ChartTabs.ts"

// Guided chart utilities
export {
    useMaybeGlobalGrapherStateRef,
    useGuidedChartLinkHandler,
    GuidedChartContext,
    type GuidedChartContextValue,
    type ArchiveGuidedChartRegistration,
    buildArchiveGuidedChartSrc,
} from "./grapher/chart/guidedChartUtils.ts"

// Legacy conversion
export {
    legacyToChartsTableAndDimensions,
    legacyToChartsTableAndDimensionsWithMandatorySlug,
} from "./grapher/core/LegacyToChartsTable.ts"

export { legacyToCurrentGrapherUrl } from "./grapher/core/GrapherUrlMigrations.ts"

// Test data helpers (useful for demos and testing)
export {
    fakeEntities,
    createTestDataset,
    type TestData,
    type TestMetadata,
} from "./grapher/testData/TestData.ts"
export { LifeExpectancyGrapher } from "./grapher/testData/TestData.sample.ts"

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
} from "./types/index.ts"

// Utilities for data loading
export { Bounds } from "./utils/index.ts"
export { parseDelimited, ChartsTable, BlankChartsTable } from "./core-table/index.ts"
