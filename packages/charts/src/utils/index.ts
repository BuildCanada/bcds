/**
 * Utility exports for @buildcanada/charts
 */

// Bounds utility
export {
    type GridBounds,
    type SplitBoundsPadding,
    FontFamily,
    Bounds,
} from "./Bounds.ts"

// Browser utilities
export { isAndroid, isIOS } from "./BrowserUtils.ts"

// Dayjs
import dayjs from "./dayjs.ts"
export { dayjs }
export type {
    Dayjs,
    customParseFormatType,
    isTodayType,
    isYesterdayType,
    relativeTimeType,
    utcType,
} from "./dayjs.ts"

// Format value
export { formatValue, checkIsVeryShortUnit } from "./formatValue.ts"

// Fuzzy search
export { FuzzySearch, type FuzzySearchResult } from "./FuzzySearch.ts"

// Grapher config utilities
export {
    diffGrapherConfigs,
    mergeGrapherConfigs,
} from "./grapherConfigUtils.ts"

// Image utilities
export {
    THUMBNAIL_WIDTH,
    LARGE_THUMBNAIL_WIDTH,
    LARGEST_IMAGE_WIDTH,
    appendImageSizeSuffix,
    getSizes,
    generateSrcSet,
    getFilenameWithoutExtension,
    getFilenameAsPng,
    getFilenameExtension,
    getFilenameMIMEType,
    type SourceProps,
    generateSourceProps,
    getFeaturedImageFilename,
} from "./image.ts"

// isPresent utility
export { isPresent } from "./isPresent.ts"

// Metadata helpers
export {
    getOriginAttributionFragments,
    getAttributionFragmentsFromVariable,
    getETLPathComponents,
    formatAuthors,
    formatAuthorsForBibtex,
    getLastUpdatedFromVariable,
    getNextUpdateFromVariable,
    getPhraseForProcessingLevel,
    splitSourceTextIntoFragments,
    prepareSourcesForDisplay,
    formatSourceDate,
    getDateRange,
    getCitationLong,
    getCitationShort,
    getPhraseForArchivalDate,
} from "./metadataHelpers.ts"

// Variable display config
export { VariableDisplayConfig } from "./Variable.ts"

// Persistable
export {
    type Persistable,
    objectWithPersistablesToObject,
    updatePersistables,
    deleteRuntimeAndUnchangedProps,
} from "./persistable/Persistable.ts"

// PointVector
export { PointVector } from "./PointVector.ts"

// PromiseCache
export { PromiseCache } from "./PromiseCache.ts"

// PromiseSwitcher
export { PromiseSwitcher } from "./PromiseSwitcher.ts"

// Regions
export {
    RegionType,
    regions,
    type Region,
    countries,
    listedRegionsNames,
    type Country,
    type IncomeGroup,
    type IncomeGroupName,
    checkIsIncomeGroupName,
    getCountryBySlug,
    getCountryByName,
    getRegionByNameOrVariantName,
    isCountryName,
    getContinents,
    type Continent,
    getAggregates,
    type Aggregate,
    type AggregateSource,
    aggregateSources,
    getOthers,
    countriesByName,
    incomeGroupsByName,
    getRegionAlternativeNames,
    mappableCountries,
    checkIsCountry,
    checkIsContinent,
    checkIsIncomeGroup,
    getIncomeGroups,
    getCountryNamesForRegion,
    checkHasMembers,
    getRegionByName,
    getRegionBySlug,
    getParentRegions,
    getSiblingRegions,
    articulateEntity,
} from "./regions.ts"

// Serializers
export { serializeJSONForHTML, deserializeJSONFromHTML } from "./serializers.ts"

// String utilities
export {
    camelCaseProperties,
    titleCase,
    toAsciiQuotes,
    removeDiacritics,
} from "./string.ts"

// TimeBounds
export {
    timeFromTimebounds,
    minTimeBoundFromJSONOrNegativeInfinity,
    maxTimeBoundFromJSONOrPositiveInfinity,
    minTimeToJSON,
    maxTimeToJSON,
    timeBoundToTimeBoundString,
    getTimeDomainFromQueryString,
} from "./TimeBounds.ts"

// Tippy tooltip component
export { Tippy, TippyIfInteractive, LazyTippy } from "./Tippy.tsx"

// URL utilities
export {
    strToQueryParams,
    queryParamsToStr,
    getWindowQueryStr,
    setWindowQueryStr,
} from "./urls/UrlUtils.ts"

export { Url, setWindowUrl, getWindowUrl } from "./urls/Url.ts"

export { type UrlMigration, performUrlMigrations } from "./urls/UrlMigration.ts"

// Main utility exports (from Util.ts)
export {
    type NoUndefinedValues,
    type AllKeysRequired,
    type PartialBy,
    type RequiredBy,
    type PartialRecord,
    createFormatter,
    getRelativeMouse,
    exposeInstanceOnWindow,
    makeSafeForCSS,
    makeIdForHumanConsumption,
    formatDay,
    formatYear,
    numberMagnitude,
    normaliseToSingleDigitNumber,
    roundSigFig,
    excludeNull,
    excludeNullish,
    excludeUndefined,
    firstOfNonEmptyArray,
    lastOfNonEmptyArray,
    next,
    previous,
    domainExtent,
    cagr,
    makeAnnotationsSlug,
    slugify,
    slugifySameCase,
    guid,
    TESTING_ONLY_disable_guid,
    pointsToPath,
    sortedFindClosestIndex,
    sortedFindClosest,
    isMobile,
    isTouchDevice,
    type Json,
    csvEscape,
    trimObject,
    fetchText,
    fetchJson,
    fetchWithTimeout,
    getUserCountryInformation,
    stripHTML,
    getRandomNumberGenerator,
    sampleFrom,
    getIdealGridParams,
    findClosestTimeIndex,
    findClosestTime,
    es6mapValues,
    type DataValue,
    valuesByEntityAtTimes,
    dateDiffInDays,
    diffDateISOStringInDays,
    getYearFromISOStringAndDayOffset,
    parseIntOrUndefined,
    anyToString,
    scrollIntoViewIfNeeded,
    rollingMap,
    keyMap,
    intersectionOfSets,
    differenceOfSets,
    areSetsEqual,
    isSubsetOf,
    intersection,
    sortByUndefinedLast,
    mapNullToUndefined,
    lowerCaseFirstLetterUnlessAbbreviation,
    sortNumeric,
    getClosestTimePairs,
    omitUndefinedValues,
    isInIFrame,
    differenceObj,
    findDOMParent,
    wrapInDiv,
    textAnchorFromAlign,
    dyFromAlign,
    stringifyUnknownError,
    toRectangularMatrix,
    checkIsStringIndexable,
    checkIsTouchEvent,
    triggerDownloadFromBlob,
    triggerDownloadFromUrl,
    removeAllWhitespace,
    moveArrayItemToIndex,
    getIndexableKeys,
    retryPromise,
    fetchWithRetry,
    formatDate,
    canWriteToClipboard,
    isNegativeInfinity,
    isPositiveInfinity,
    imemo,
    isArrayOfNumbers,
    greatestCommonDivisor,
    findGreatestCommonDivisorOfArray,
    copyToClipboard,
    cartesian,
    removeTrailingParenthetical,
    commafyNumber,
    isFiniteWithGuard,
    formatInlineList,
    lazy,
    getParentVariableIdFromChartConfig,
    isArrayDifferentFromReference,
    readFromAssetMap,
    downloadImage,
    getUserNavigatorLanguages,
    getUserNavigatorLanguagesNonEnglish,
    convertDaysSinceEpochToDate,
    sleep,
    lowercaseObjectKeys,
    detailOnDemandRegex,
    guidedChartRegex,
    extractDetailsFromSyntax,
    parseFloatOrUndefined,
    bind,
    merge,
    calculateTrendDirection,
    getDisplayUnit,
    stripOuterParentheses,
    dimensionsToViewId,
} from "./Util.ts"

// Archival date utilities
export {
    type ArchivalTimestamp,
    type DateInput,
    parseArchivalDate,
    formatAsArchivalDate,
    convertToArchivalDateStringIfNecessary,
    getDateForArchival,
} from "./archival/archivalDate.ts"

// Multi-dimensional data page config (stub)
export {
    MultiDimDataPageConfig,
    extractMultiDimChoicesFromSearchParams,
    searchParamsToMultiDimView,
} from "./MultiDimDataPageConfig.ts"

// Re-export all types from the types package for convenience
// This matches the pattern in @ourworldindata/utils
export * from "../types/index.ts"
