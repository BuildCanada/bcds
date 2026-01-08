/**
 * Type definitions for @buildcanada/charts
 *
 * These types are extracted from @ourworldindata/types and include only
 * the visualization-related types needed for the charts library.
 */

// Domain types
export {
    type Base64String,
    type GitCommit,
    type HexString,
    type Integer,
    JsonError,
    type JsonString,
    type SerializedGridProgram,
    type OwidVariableId,
    type QueryParams,
} from "./domainTypes/Various.js"

export {
    Position,
    type PositionMap,
    AxisAlign,
    VerticalAlign,
    type GridParameters,
    HorizontalAlign,
} from "./domainTypes/Layout.js"

export {
    type TableSlug,
    type ColumnSlugs,
    type TimeTolerance,
    type CoreRow,
    InputType,
    TransformType,
    JsTypes,
    type CsvString,
    type CoreValueType,
    type CoreColumnStore,
    type CoreTableInputOption,
    type CoreQuery,
    type CoreMatrix,
    OwidTableSlugs,
    type EntityName,
    type EntityCode,
    type EntityId,
    type Entity,
    type OwidColumnDef,
    OwidEntityNameColumnDef,
    OwidEntityIdColumnDef,
    OwidEntityCodeColumnDef,
    StandardOwidColumnDefs,
    type OwidRow,
    type OwidVariableRow,
    ColumnTypeNames,
    type ColumnColorScale,
    type CoreColumnDef,
    ErrorValue,
} from "./domainTypes/CoreTableTypes.js"

// Grapher types
export {
    IDEAL_PLOT_ASPECT_RATIO,
    EPOCH_DATE,
    GRAPHER_MAP_TYPE,
    GRAPHER_CHART_TYPES,
    GRAPHER_TAB_NAMES,
    GRAPHER_TAB_CONFIG_OPTIONS,
    GRAPHER_TAB_QUERY_PARAMS,
    ALL_GRAPHER_CHART_TYPES,
} from "./grapherTypes/GrapherConstants.js"

export {
    type Box,
    type BasicChartInformation,
    SortBy,
    type SortConfig,
    SortOrder,
    type ValueRange,
    type Year,
    TimeBoundValue,
    TimeBoundValueStr,
    type TimeRange,
    type Color,
    type ColumnSlug,
    KeyChartLevel,
    type PrimitiveType,
    DimensionProperty,
    type RelatedChart,
    ToleranceStrategy,
    ScaleType,
    type Time,
    type TimeBound,
    type TimeBounds,
    type TickFormattingOptions,
    type ColorScaleConfigInterface,
    ColorSchemeName,
    type GrapherChartOrMapType,
    type GrapherTabConfigOption,
    type GrapherTabName,
    type GrapherTabQueryParam,
    type GrapherChartType,
    StackMode,
    EntitySelectionMode,
    ScatterPointLabelStrategy,
    type RelatedQuestionsConfig,
    FacetStrategy,
    type SeriesColorMap,
    FacetAxisDomain,
    type AnnotationFieldsInTitle,
    MissingDataStrategy,
    SeriesStrategy,
    type GrapherInterface,
    grapherKeysToSerialize,
    type GrapherQueryParams,
    type LegacyGrapherInterface,
    MapRegionName,
    type GlobeRegionName,
    LogoOption,
    type ComparisonLineConfig,
    type VerticalComparisonLineConfig,
    type CustomComparisonLineConfig,
    type AxisConfigInterface,
    type ColorSchemeInterface,
    type Tickmark,
    type SeriesName,
    type LegacyGrapherQueryParams,
    GRAPHER_QUERY_PARAM_KEYS,
    type ChartRedirect,
    type DetailsMarker,
    GrapherWindowType,
    AxisMinMaxValueStr,
    GrapherTooltipAnchor,
    type MapConfigInterface,
    type GlobeConfig,
    type ProjectionColumnInfo,
    GrapherVariant,
    type ChartErrorInfo,
    type ToleranceOptions,
    type AdditionalGrapherDataFetchFn,
    type GrapherTrendArrowDirection,
} from "./grapherTypes/GrapherTypes.js"

export {
    logBinningStrategies,
    equalSizeBinningStrategies,
    automaticBinningStrategies,
    binningStrategiesIncludingManual,
    type LogBinningStrategy,
    type EqualSizeBinningStrategy,
    type ResolvedLogBinningStrategy,
    type BinningStrategyIncludingManual,
    type AutomaticBinningStrategy,
    type ResolvedBinningStrategy,
    type MidpointMode,
} from "./grapherTypes/BinningStrategyTypes.js"

// Variable types
export {
    type OwidVariableWithSource,
    type OwidVariableWithSourceAndDimension,
    type OwidVariableWithSourceAndDimensionWithoutId,
    type OwidVariableMixedData,
    type OwidVariableWithDataAndSource,
    type OwidVariableDimension,
    type OwidVariableDimensions,
    type OwidVariableDataMetadataDimensions,
    type MultipleOwidVariableDataDimensionsMap,
    type OwidVariableDimensionValuePartial,
    type OwidVariableDimensionValueFull,
    type OwidVariablePresentation,
    type OwidEntityKey,
    type OwidLicense,
    type OwidProcessingLevel,
    type IndicatorTitleWithFragments,
    joinTitleFragments,
    type OwidVariableType,
} from "./OwidVariable.js"

export type { OwidSource } from "./OwidSource.js"
export type { OwidOrigin } from "./OwidOrigin.js"

export {
    type OwidVariableDisplayConfigInterface,
    type OwidVariableDataTableConfigInterface,
    OwidVariableRoundingMode,
    type OwidChartDimensionInterface,
    type OwidChartDimensionInterfaceWithMandatorySlug,
} from "./OwidVariableDisplayConfigInterface.js"

export { type Nominal, wrap, unwrap } from "./NominalType.js"

// Archive types (needed for data loading)
export {
    type ArchivalDateString,
    ARCHIVE_DATE_TIME_FORMAT,
    type AssetMap,
    type ArchiveContext,
    type ArchivedPageVersion,
} from "./domainTypes/Archive.js"

// Gdoc types (stubs for type compatibility)
export {
    OwidGdocType,
    type NarrativeChartInfo,
    type DetailDictionary,
    type EnrichedDetail,
    type UserCountryInformation,
    type OwidGdocBaseInterface,
    type OwidGdocContent,
    type OwidGdoc,
    type OwidGdocJSON,
    type OwidGdocPostInterface,
    type OwidGdocPostContent,
    type OwidGdocDataInsightInterface,
    type OwidGdocDataInsightContent,
    type OwidGdocAuthorInterface,
    type OwidGdocAuthorContent,
    type OwidGdocAboutInterface,
    type OwidGdocAboutContent,
    type OwidGdocHomepageInterface,
    type OwidGdocHomepageContent,
    type OwidEnrichedGdocBlock,
    type Span,
    type EnrichedBlockKeyInsightsSlide,
    type EnrichedTopicPageIntroRelatedTopic,
    type EnrichedTopicPageIntroDownloadButton,
    type EnrichedHybridLink,
    type TocHeadingWithTitleSupertitle,
    type DisplaySource,
} from "./gdocTypes/Gdoc.js"

// Database types (stubs)
export { type DbPlainTag } from "./dbTypes/Tags.js"

// Constants for site sections
export const ALL_CHARTS_ID = "all-charts"
export const FEATURED_DATA_INSIGHTS_ID = "featured-data-insights"
export const EXPLORE_DATA_SECTION_DEFAULT_TITLE = "Explore our data"
export const EXPLORE_DATA_SECTION_ID = "explore-data"

// Analytics types
export {
    EventCategory,
    type EntityControlEvent,
    type EntitySelectorEvent,
    type GrapherImageDownloadEvent,
    type GrapherInteractionEvent,
    GrapherErrorAction,
    type GrapherAnalyticsContext,
    type GAEvent,
} from "./analyticsTypes.js"

// Additional stub types
export type SubNavId = string
export const SubNavId = {} as Record<string, SubNavId>

export const gdocUrlRegex = /^https?:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+/

export type BlockSize = "full" | "medium" | "small" | "wide" | "narrow"
export const BlockSize = {
    full: "full" as const,
    medium: "medium" as const,
    small: "small" as const,
    Wide: "wide" as const,
    Narrow: "narrow" as const,
}

export enum ChartConfigType {
    Grapher = "grapher",
    Explorer = "explorer",
    MultiDim = "multi-dim",
}

export interface MultiDimDimensionChoices {
    [key: string]: string
}

export interface ImageMetadata {
    src: string
    width?: number
    height?: number
    alt?: string
    filename?: string
    originalWidth?: number
    originalHeight?: number
    cloudflareId?: string
}

export interface TagGraphNode {
    children: TagGraphNode[]
    id: number
    isTopic: boolean
    name: string
    path: number[]
    slug: string | null
    weight: number
}

export const TagGraphRootName = "tag-graph-root" as const

export type TagGraphRoot = TagGraphNode & {
    children: TagGraphNode[]
    id: number
    isTopic: false
    name: typeof TagGraphRootName
    path: [number]
    slug: null
    weight: 0
}

// Site constants
export const DATAPAGE_ABOUT_THIS_DATA_SECTION_ID = "about-this-data"
export const DATAPAGE_SOURCES_AND_PROCESSING_SECTION_ID = "sources-and-processing"
export const REUSE_THIS_WORK_SECTION_ID = "reuse-this-work"
