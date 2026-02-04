import { VariableId } from "./domainTypes/Various.js"
import {
    ColumnSlug,
    DimensionProperty,
    Time,
} from "./grapherTypes/GrapherTypes.js"

export interface VariableDisplayConfigInterface {
    name?: string
    unit?: string
    shortUnit?: string
    isProjection?: boolean
    conversionFactor?: number
    roundingMode?: VariableRoundingMode
    numDecimalPlaces?: number
    numSignificantFigures?: number
    tolerance?: number
    yearIsDay?: boolean
    zeroDay?: string
    entityAnnotationsMap?: string
    includeInTable?: boolean
    tableDisplay?: VariableDataTableConfigInterface
    color?: string
    plotMarkersOnlyInLineChart?: boolean
}

// todo: flatten onto the above
export interface VariableDataTableConfigInterface {
    hideAbsoluteChange?: boolean
    hideRelativeChange?: boolean
}

export enum VariableRoundingMode {
    decimalPlaces = "decimalPlaces",
    significantFigures = "significantFigures",
}

export interface ChartDimensionInterface {
    property: DimensionProperty
    targetYear?: Time
    display?: VariableDisplayConfigInterface
    variableId: VariableId
    slug?: ColumnSlug
}

export interface ChartDimensionInterfaceWithMandatorySlug
    extends ChartDimensionInterface {
    slug: ColumnSlug
}
