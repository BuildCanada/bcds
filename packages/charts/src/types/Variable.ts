import { Origin } from "./Origin.js"
import { Source } from "./Source.js"
import { VariableDisplayConfigInterface } from "./VariableDisplayConfigInterface.js"

export interface VariableWithSource {
    id: number
    name?: string
    description?: string
    descriptionShort?: string
    descriptionFromProducer?: string
    descriptionKey?: string[]
    descriptionProcessing?: string
    unit?: string
    display?: VariableDisplayConfigInterface
    shortUnit?: string
    datasetName?: string
    datasetId?: number
    coverage?: string
    nonRedistributable?: boolean
    source?: Source
    origins?: Origin[]
    schemaVersion?: number
    processingLevel?: ProcessingLevel
    presentation?: VariablePresentation
    shortName?: string
    timespan?: string
    catalogPath?: string
    license?: License
    updatePeriodDays?: number
    datasetVersion?: string
    licenses?: License[]
    type?: VariableType

    // omitted:
    // code
    // coverage
    // dataPath
    // metadataPath
}

export interface IndicatorTitleWithFragments {
    title: string
    attributionShort?: string
    titleVariant?: string
}

export function joinTitleFragments(
    attributionShort: string | undefined,
    titleVariant: string | undefined
): string | undefined {
    if (attributionShort && titleVariant && attributionShort !== titleVariant) {
        return `${titleVariant} – ${attributionShort}`
    }
    if (attributionShort) {
        return attributionShort
    }
    if (titleVariant) {
        return titleVariant
    }
    return undefined
}

export interface License {
    name: string
    url: string
}

export interface VariablePresentation {
    titlePublic?: string
    titleVariant?: string
    attributionShort?: string
    attribution?: string
    topicTagsLinks?: string[]
    faqs?: FaqLink[]
}

export type ProcessingLevel = "minor" | "major"

export interface FaqLink {
    gdocId: string
    fragmentId: string
}

export type VariableWithSourceAndDimension = VariableWithSource & {
    dimensions: VariableDimensions
}

export type VariableWithSourceAndDimensionWithoutId = Omit<
    VariableWithSourceAndDimension,
    "id"
>

export interface VariableMixedData {
    years: number[]
    entities: number[]
    values: (string | number)[]
}

export type VariableWithDataAndSource = VariableWithSource &
    VariableMixedData

export interface VariableDimension {
    values: VariableDimensionValuePartial[]
}

export interface VariableDimensions {
    years: VariableDimension
    entities: VariableDimension
    values?: VariableDimension
}

export type VariableDataMetadataDimensions = {
    data: VariableMixedData
    metadata: VariableWithSourceAndDimension
}
export type MultipleVariableDataDimensionsMap = Map<
    number,
    VariableDataMetadataDimensions
>

export interface VariableDimensionValuePartial {
    id: number
    name?: string
    code?: string
}
export type VariableDimensionValueFull =
    Required<VariableDimensionValuePartial>

export interface EntityKey {
    [id: string]: VariableDimensionValuePartial
}

export type VariableType = "string" | "float" | "int" | "mixed" | "ordinal"
