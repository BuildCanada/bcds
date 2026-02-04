export {
    NumericBin,
    CategoricalBin,
    type ColorScaleBin,
} from "./color/ColorScaleBin.js"
export { ChartDimension } from "./chart/ChartDimension.js"
export { FetchingGrapher } from "./core/FetchingGrapher.js"
export {
    fetchInputTableForConfig,
    getCachingInputTableFetcher,
    type FetchInputTableForConfigFn,
} from "./core/loadGrapherTableHelpers.js"
export { loadVariableDataAndMetadata } from "./core/loadVariable.js"
export {
    GRAPHER_ROUTE_FOLDER,
    GRAPHER_EMBEDDED_FIGURE_ATTR,
    GRAPHER_NARRATIVE_CHART_CONFIG_FIGURE_ATTR,
    GRAPHER_PAGE_BODY_CLASS,
    GRAPHER_IS_IN_IFRAME_CLASS,
    DEFAULT_GRAPHER_WIDTH,
    DEFAULT_GRAPHER_HEIGHT,
    GRAPHER_THUMBNAIL_WIDTH,
    GRAPHER_THUMBNAIL_HEIGHT,
    GRAPHER_IMAGE_WIDTH_1X,
    GRAPHER_IMAGE_WIDTH_2X,
    GRAPHER_SQUARE_SIZE,
    STATIC_EXPORT_DETAIL_SPACING,
    DEFAULT_GRAPHER_ENTITY_TYPE,
    GRAPHER_LOADED_EVENT_NAME,
    CookieKey,
    BASE_FONT_SIZE,
    WORLD_ENTITY_NAME,
    Patterns,
    CONTINENTS_INDICATOR_ID,
    POPULATION_INDICATOR_ID_USED_IN_ADMIN,
    latestGrapherConfigSchema,
    DEFAULT_GRAPHER_BOUNDS,
    DEFAULT_GRAPHER_BOUNDS_SQUARE,
} from "./core/GrapherConstants.js"
export {
    getVariableDataRoute,
    getVariableMetadataRoute,
} from "./core/loadVariable.js"
export { ColorScale } from "./color/ColorScale.js"
export { ColorScaleConfig } from "./color/ColorScaleConfig.js"
export { ColorScheme } from "./color/ColorScheme.js"
export {
    getColorNameDistinctAndSemanticPalettes,
    getColorNameDistinctLinesAndSemanticPalettes,
} from "./color/CustomSchemes.js"
export { ColorSchemes } from "./color/ColorSchemes.js"
export { DimensionSlot } from "./chart/DimensionSlot.js"
export { EntityPicker } from "./controls/entityPicker/EntityPicker.js"
export type { EntityPickerManager } from "./controls/entityPicker/EntityPickerConstants.js"
export { getColorSchemeForChartType } from "./color/ColorSchemes.js"
export {
    isCategoricalBin,
    isNumericBin,
    isNoDataBin,
    isProjectedDataBin,
} from "./color/ColorScaleBin.js"
export {
    GLOBAL_ENTITY_SELECTOR_DATA_ATTR,
    GLOBAL_ENTITY_SELECTOR_ELEMENT,
    GLOBAL_ENTITY_SELECTOR_DEFAULT_COUNTRY,
} from "./controls/globalEntitySelector/GlobalEntitySelectorConstants.js"
export { GlobalEntitySelector } from "./controls/globalEntitySelector/GlobalEntitySelector.js"
export {
    Grapher,
    type GrapherProgrammaticInterface,
    type GrapherManager,
} from "./core/Grapher.js"
export { GrapherState } from "./core/GrapherState.js"
export { GrapherAnalytics } from "./core/GrapherAnalytics.js"
export { hydrateGlobalEntitySelectorIfAny } from "./controls/globalEntitySelector/GlobalEntitySelector.js"
export { legacyToCurrentGrapherUrl } from "./core/GrapherUrlMigrations.js"
export {
    legacyToChartsTableAndDimensions,
    legacyToChartsTableAndDimensionsWithMandatorySlug,
} from "./core/LegacyToChartsTable.js"
export { getErrorMessageRelatedQuestionUrl } from "./core/relatedQuestion.js"
export { MapChartState } from "./mapCharts/MapChartState.js"
export { MapConfig } from "./mapCharts/MapConfig.js"
export {
    MAP_REGION_LABELS,
    type GeoFeature,
    type Direction,
    type Ellipse,
    type EllipseCoords,
} from "./mapCharts/MapChartConstants.js"
export { SelectionArray } from "./selection/SelectionArray.js"
export { FocusArray } from "./focus/FocusArray.js"
export {
    setSelectedEntityNamesParam,
    migrateSelectedEntityNamesParam,
    getSelectedEntityNamesParam,
    generateSelectedEntityNamesParam,
    generateFocusedSeriesNamesParam,
    getEntityNamesParam,
} from "./core/EntityUrlBuilder.js"
export { grapherConfigToQueryParams } from "./core/GrapherUrl.js"
export {
    type SlideShowManager,
    SlideShowController,
} from "./slideshowController/SlideShowController.js"
export { defaultGrapherConfig } from "./schema/defaultGrapherConfig.js"
export {
    migrateGrapherConfigToLatestVersion,
    migrateGrapherConfigToLatestVersionAndFailOnError,
} from "./schema/migrations/migrate.js"
export { generateGrapherImageSrcSet } from "./chart/ChartUtils.js"
export {
    useMaybeGlobalGrapherStateRef,
    useGuidedChartLinkHandler,
    GuidedChartContext,
    type GuidedChartContextValue,
    type ArchiveGuidedChartRegistration,
    buildArchiveGuidedChartSrc,
} from "./chart/guidedChartUtils.js"
export {
    isChartTypeName,
    isValidTabQueryParam,
    findPotentialChartTypeSiblings,
    mapGrapherTabNameToQueryParam,
    mapGrapherTabNameToConfigOption,
    makeLabelForGrapherTab,
} from "./chart/ChartTabs.js"
export {
    renderGrapherIntoContainer,
    renderSingleGrapherOnGrapherPage,
} from "./core/GrapherUseHelpers.js"
export { GeoFeatures } from "./mapCharts/GeoFeatures.js"
export { isValidVerticalComparisonLineConfig } from "./comparisonLine/ComparisonLineHelpers.js"
export { hasValidConfigForBinningStrategy } from "./color/BinningStrategies.js"
export { Dropdown } from "./controls/Dropdown.js"

export { makeChartState } from "./chart/ChartTypeMap.js"
export type { ChartState } from "./chart/ChartInterface.js"

export type { ChartSeries } from "./chart/ChartInterface.js"

// Test data helpers (useful for demos and testing)
export {
    fakeEntities,
    createTestDataset,
    type TestData,
    type TestMetadata,
} from "./testData/TestData.js"
export { LifeExpectancyGrapher } from "./testData/TestData.sample.js"
export type { LineChartState } from "./lineCharts/LineChartState.js"
export type { SlopeChartState } from "./slopeCharts/SlopeChartState.js"
export type { DiscreteBarChartState } from "./barCharts/DiscreteBarChartState.js"
export type { StackedAreaChartState } from "./stackedCharts/StackedAreaChartState.js"
export type { StackedBarChartState } from "./stackedCharts/StackedBarChartState.js"
export type { StackedDiscreteBarChartState } from "./stackedCharts/StackedDiscreteBarChartState.js"
export type { ScatterPlotChartState } from "./scatterCharts/ScatterPlotChartState.js"
export type { MarimekkoChartState } from "./stackedCharts/MarimekkoChartState.js"
