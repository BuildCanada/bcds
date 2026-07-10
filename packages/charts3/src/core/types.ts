export type LocaleCode = "en" | "fr"

export type TimeGrain =
    | "year"
    | "fiscal-year"
    | "quarter"
    | "month"
    | "date"
    | "none"

export type ColumnType =
    | "numeric"
    | "integer"
    | "percentage"
    | "currency"
    | "categorical"
    | "ordinal"

export type TimeValue = string | number

export interface SourceMetadata {
    name: string
    url?: string
    publisher?: string
    retrieved?: string
    citation?: string
    license?: string
}

export interface EntityMetadata {
    name: string
    code?: string
    nameFr?: string
    aliases?: string[]
    group?: string
    colour?: string
}

export interface ColumnMetadata {
    name?: string
    type?: ColumnType
    unit?: string
    shortUnit?: string
    currency?: string
    displayFactor?: number
    decimals?: number
    tolerance?: number
    toleranceDirection?: "both" | "backwards" | "forwards"
    projection?: boolean
    projectionFrom?: TimeValue
    colour?: string | null
    order?: string[]
    description?: string
    source?: number | string
    denominator?: string
    derivedUnit?: string
    derivedShortUnit?: string
}

export interface DatasetManifest {
    name: string
    title?: string
    timeGrain: TimeGrain
    fiscalYearStartMonth?: number
    entity?: {
        label?: string
        labelPlural?: string
        kind?: string
    }
    columns: Record<string, ColumnMetadata>
    sources?: SourceMetadata[]
    entities?: EntityMetadata[]
    dimensions?: string[]
}

export type DatasetCell = string | number | null

export interface DatasetRow {
    entity: string
    time?: TimeValue
    [column: string]: DatasetCell | undefined
}

export interface ChartDataset {
    manifest: DatasetManifest
    rows: DatasetRow[]
}

export type ChartType =
    | "line"
    | "discrete-bar"
    | "table"
    | "stacked-area"
    | "stacked-bar"
    | "stacked-discrete-bar"
    | "slope"
    | "dumbbell"
    | "scatter"
    | "marimekko"
    | "map"
    | "waterfall"
    | "treemap"
    | "sankey"
    | "bullet"

export interface ChartDefinition {
    schemaVersion?: number
    title: string
    subtitle?: string
    note?: string
    sourceText?: string
    slug?: string
    data?: string
    y: string | string[]
    x?: string
    size?: string
    colour?: string
    filter?: Record<string, string | number | boolean>
    types?: ChartType[]
    defaultTab?: ChartType | "chart" | "map" | "table"
    selectedEntities?: string[]
    includedEntities?: string[]
    excludedEntities?: string[]
    entityColours?: Record<string, string>
    selectionMode?: "multi" | "single" | "fixed"
    focusedSeries?: string
    time?: TimeSelection
    timelineRange?: TimeRange
    hideTimeline?: boolean
    theme?: string
    stackMode?: "absolute" | "relative"
    sort?: {
        by: "total" | "name" | "column" | "change" | "custom"
        order?: "asc" | "desc"
        column?: string
        custom?: string[]
    }
    facet?: "none" | "entity" | "metric"
    missingData?: "auto" | "hide" | "show"
    hideLegend?: boolean
    hideSeriesLabels?: boolean
    sankey?: {
        targetColumn?: string
    }
    treemap?: {
        pathSeparator?: string
    }
    bullet?: {
        target?: string
        marker?: string
    }
}

export type TimeToken = "earliest" | "latest"
export type TimeSelection = TimeValue | TimeToken | [TimeValue | TimeToken, TimeValue | TimeToken]
export type TimeRange = [TimeValue | TimeToken, TimeValue | TimeToken]

export interface ChartViewState {
    tab: ChartType | "table"
    time: TimeSelection
    selectedEntities: string[]
    focusedSeries?: string
    stackMode: "absolute" | "relative"
    locale: LocaleCode
    theme: string
}

export interface RenderSize {
    width: number
    height: number
}

export interface ResolvedDatum {
    entity: string
    time?: TimeValue
    value: number | null
    metric: string
    originalValue: number | null
    denominatorValue?: number | null
    toleranced?: boolean
    projected?: boolean
}

export interface SeriesModel {
    id: string
    label: string
    colour: string
    points: ResolvedDatum[]
}

export interface ChartTheme {
    name: string
    background: string
    surface: string
    text: string
    mutedText: string
    accent: string
    border: string
    grid: string
    axis: string
    noData: string
    projectedPattern: string
    categoricalPalette: string[]
    fontFamily: string
    bodyFontFamily: string
    monoFontFamily: string
    titleSize: number
    labelSize: number
    tickSize: number
    attribution: string
    attributionUrl?: string
}

export interface ChartModel {
    definition: Required<Pick<ChartDefinition, "title">> & ChartDefinition
    dataset: ChartDataset
    state: ChartViewState
    theme: ChartTheme
    size: RenderSize
    activeType: ChartType | "table"
    yColumns: string[]
    title: string
    subtitle?: string
    note?: string
    sourceText?: string
    series: SeriesModel[]
    table: TableModel
    warnings: string[]
}

export interface TableCell {
    entity: string
    time?: TimeValue
    metric: string
    value: number | null
    formatted: string
}

export interface TableModel {
    columns: string[]
    rows: TableCell[]
}

export interface ValidationIssue {
    severity: "error" | "warning"
    message: string
    rowIndex?: number
    column?: string
}

export interface ValidationResult {
    ok: boolean
    issues: ValidationIssue[]
}
