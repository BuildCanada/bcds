export { CoreTable, columnDefinitionsFromInput } from "./CoreTable.ts"
export {
    SynthesizeNonCountryTable,
    SampleColumnSlugs,
    SynthesizeGDPTable,
    SynthesizeFruitTable,
    SynthesizeFruitTableWithNonPositives,
    SynthesizeFruitTableWithStringValues,
    SynthesizeProjectedPopulationTable,
} from "./TableSynthesizers.ts"

export {
    type CoreColumn,
    MissingColumn,
    ColumnTypeMap,
    AbstractCoreColumn,
    TimeColumn,
} from "./CoreTableColumns.ts"

export { ChartsTable, BlankChartsTable } from "./ChartsTable.ts"

export {
    DroppedForTesting,
    DivideByZeroError,
    ValueTooLow,
    MissingValuePlaceholder,
    ErrorValueTypes,
    isNotErrorValue,
    isNotErrorValueOrEmptyCell,
    defaultIfErrorValue,
} from "./ErrorValues.ts"

export {
    columnStoreToRows,
    truncate,
    makeAutoTypeFn,
    standardizeSlugs,
    guessColumnDefFromSlugAndRow,
    makeRowFromColumnStore,
    type InterpolationContext,
    type LinearInterpolationContext,
    type ToleranceInterpolationContext,
    type InterpolationProvider,
    linearInterpolation,
    toleranceInterpolation,
    makeKeyFn,
    concatColumnStores,
    rowsToColumnStore,
    autodetectColumnDefs,
    replaceDef,
    renameColumnStore,
    getDropIndexes,
    replaceRandomCellsInColumnStore,
    Timer,
    rowsFromMatrix,
    trimMatrix,
    matrixToDelimited,
    parseDelimited,
    detectDelimiter,
    rowsToMatrix,
    isCellEmpty,
    trimEmptyRows,
    trimArray,
    sortColumnStore,
    emptyColumnsInFirstRowInDelimited,
} from "./CoreTableUtils.ts"

export {
    timeColumnSlugFromColumnDef,
    makeOriginalTimeSlugFromColumnSlug,
    makeOriginalValueSlugFromColumnSlug,
    getOriginalTimeColumnSlug,
    toPercentageColumnDef,
} from "./TableUtil.ts"

export {
    insertMissingValuePlaceholders,
    computeRollingAverage,
    AvailableTransforms,
    applyTransforms,
    extractPotentialDataSlugsFromTransform,
} from "./Transforms.ts"
