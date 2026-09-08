/**
 * Frozen shared contracts for @buildcanada/charts.
 *
 * These types are the interfaces between the milestone work packages
 * (data layer, formatting, theme, text, layout, react, cli). Changes here
 * require coordination — implementation modules depend on these shapes.
 *
 * Normative behavior lives in bcds/specs/: 01 (data format), 02 (chart
 * definition), 03 (axes/formatting), 08 (time), 24 (CLI rendering).
 */

// ---------------------------------------------------------------------------
// Scalars
// ---------------------------------------------------------------------------

export type Locale = "en" | "fr"

/** A series identity: entity name, metric slug, or "Entity – Metric". */
export type SeriesKey = string

/** Resolved colour: always a hex string by the time it reaches a scene. */
export type HexColour = string

// ---------------------------------------------------------------------------
// Time (spec 01 §3, spec 08)
// ---------------------------------------------------------------------------

export type TimeGrain = "year" | "fiscal-year" | "quarter" | "month" | "date" | "none"

/**
 * Times are integer ordinals, uniform per grain:
 *   year        → the year (2024)
 *   fiscal-year → the start year (2024 for "2024-25")
 *   quarter     → year * 4 + (q - 1)
 *   month       → year * 12 + (m - 1)
 *   date        → days since 1970-01-01 (UTC, no timezone math)
 *   none        → no time column; ordinals never occur
 * Integer math keeps tolerance, snapping, and playback deterministic.
 * Display strings derive from (ordinal, grain) via core/format/timeLabels.
 */
export type TimeOrdinal = number

export type TimeBound = TimeOrdinal | "earliest" | "latest"

export interface TimeSelection {
    start: TimeBound
    end: TimeBound
}

// ---------------------------------------------------------------------------
// Manifest (spec 01 §4–5)
// ---------------------------------------------------------------------------

export type ColumnType =
    | "numeric"
    | "integer"
    | "percentage"
    | "currency"
    | "categorical"
    | "ordinal"

export type ToleranceDirection = "both" | "backwards" | "forwards"

export interface ColumnMeta {
    name: string
    type: ColumnType
    unit?: string
    shortUnit?: string
    /** Literal text prepended to the formatted number (before sign/symbol). */
    prefix?: string
    /** Literal text appended to the formatted magnitude (e.g. a scale letter
     *  "B"/"M" for pre-scaled data). Applied in every format branch. */
    suffix?: string
    /** ISO currency code when type is "currency". Default "CAD". */
    currency?: string
    /** Multiplier applied for display only. Default 1. Applied AFTER denominator division. */
    displayFactor: number
    decimals?: number
    /** Max distance (grain units) to borrow a value from a neighbouring time. Default 0. */
    tolerance: number
    toleranceDirection: ToleranceDirection
    /** All values in this column are forecasts. */
    projection: boolean
    /** Values at/after this ordinal are forecasts (alternative to `projection`). */
    projectionFrom?: TimeOrdinal
    /** Column slug to divide by, per (entity, time) cell. Spec 01 §7. */
    denominator?: string
    derivedUnit?: string
    derivedShortUnit?: string
    /** Fixed series colour (token or hex). */
    colour?: string
    /** Explicit value ordering for type "ordinal". */
    order?: string[]
    description?: string
    /** Index into Manifest.sources when columns differ in provenance. */
    source?: number
}

export interface EntityMeta {
    name: string
    code?: string
    nameFr?: string
    /** Alternate names resolving to this entity (renames, abbreviations). */
    aliases?: string[]
    /** Grouping for the entity picker. */
    group?: string
    /** Persistent colour token for this entity across all charts. */
    colour?: string
}

export interface SourceMeta {
    name: string
    url?: string
    publisher?: string
    retrieved?: string
    citation?: string
    license?: string
}

export interface Manifest {
    name: string
    title?: string
    timeGrain: TimeGrain
    /** 1–12. Default 4 (April) for Canadian fiscal years. */
    fiscalYearStartMonth: number
    entity: {
        /** Singular noun used in UI copy, e.g. "province". */
        label: string
        labelPlural: string
        /** Optional link to an entity registry kind (future maps pass). */
        kind?: string
    }
    columns: Record<string, ColumnMeta>
    /** Extra dimension columns for long-format data (spec 01 §6). */
    dimensions?: string[]
    entities?: EntityMeta[]
    sources: SourceMeta[]
}

// ---------------------------------------------------------------------------
// Dataset (spec 01 §2) — produced by core/data, consumed by layout and table
// ---------------------------------------------------------------------------

export type CellValue = number | string | null

export interface ColumnData {
    slug: string
    meta: ColumnMeta
    /** Row-aligned with Dataset.rows ordering. null = missing (never zero). */
    values: readonly CellValue[]
}

export interface Dataset {
    manifest: Manifest
    /** Canonical entity order (order of first appearance). */
    entities: readonly string[]
    /** Sorted unique time ordinals. Empty when grain is "none". */
    times: readonly TimeOrdinal[]
    /** Row index lookup: rowIndexOf(entity, time) → row, or -1. */
    rowIndexOf: (entity: string, time: TimeOrdinal | null) => number
    columns: ReadonlyMap<string, ColumnData>
}

export type MissingReason = "no-data" | "zero-denominator" | "non-positive-on-log"

/**
 * THE data-access contract every chart, tooltip, and table cell consumes.
 * "missing ≠ zero" lives here: a missing cell is status "missing", never 0.
 */
export type ResolvedValue =
    | {
          status: "value"
          /** Display value: raw → ÷denominator → ×displayFactor. */
          value: number
          /** The requested time. */
          time: TimeOrdinal
          /** The time the value actually came from. ≠ time ⇒ toleranced. */
          sourceTime: TimeOrdinal
          projected: boolean
          interpolated: boolean
          /** Present for denominator-derived cells (auditability, spec 01 §7). */
          raw?: { numerator: number; denominator: number }
      }
    | { status: "missing"; reason: MissingReason }

// ---------------------------------------------------------------------------
// Chart definition (spec 02)
// ---------------------------------------------------------------------------

export type ChartType =
    | "line"
    | "discrete-bar"
    | "stacked-area"
    | "stacked-bar"
    | "stacked-discrete-bar"
    | "slope"
    | "dumbbell"
    | "scatter"
    | "marimekko"

/** Dumbbell connector style (spec 17). */
export type ConnectorStyle = "arrow" | "line"

/** Value-label mode for two-endpoint charts (spec 17). */
export type ValueLabelMode = "absolute" | "change" | "percentChange" | "none"

export type Tab = ChartType | "table"

export type ScaleType = "linear" | "log"

export interface AxisConfig {
    min?: number | "auto"
    max?: number | "auto"
    scale?: ScaleType
    /** Expose the linear/log toggle to readers. */
    canToggleScale?: boolean
    label?: string
    hideGridlines?: boolean
    hideTickLabels?: boolean
}

export type SortBy = "total" | "name" | "column" | "change" | "custom"
export type SortOrder = "asc" | "desc"

export interface SortConfig {
    by: SortBy
    order: SortOrder
    column?: string
}

export type StackMode = "absolute" | "relative"
export type FacetStrategy = "none" | "entity" | "metric"
export type MissingDataStrategy = "auto" | "hide" | "show"
export type SelectionMode = "multi" | "single" | "fixed"
export type SeriesStrategy = "entity" | "metric"

export interface ComparisonLine {
    /** Horizontal line at this y value. */
    y?: number
    /** Vertical line at this time ordinal. */
    x?: TimeOrdinal
    label?: string
}

export interface TitleAnnotations {
    entity: boolean
    time: boolean
    changePrefix: boolean
}

export interface ChartDefinition {
    schemaVersion: number
    slug?: string
    title: string
    subtitle?: string
    note?: string
    sourceText?: string
    titleAnnotations: TitleAnnotations

    /** Dataset reference: name, path, or URL. */
    data: string
    /** Metric column slugs (≥1). */
    y: string[]
    /** X-axis metric column slug. Required for scatter (spec 18); optional
     *  column-width metric for marimekko (spec 19). Ignored by other types. */
    x?: string
    /** Scatter point-size metric (spec 18). Uniform radius when absent. */
    sizeMetric?: string
    /** Scatter point-colour metric (spec 18). Theme primary when absent. */
    colourMetric?: string
    /** Dumbbell connector style (spec 17). Default "arrow". */
    connector?: ConnectorStyle
    /** Dumbbell endpoint value labels (spec 17). Default "absolute". */
    valueLabelMode?: ValueLabelMode
    /** Colour slope/dumbbell marks by direction (rising/falling/flat), specs 12/17. */
    trendColouring?: boolean
    /** Marimekko: group entities lacking y data into a right-edge area (spec 19). */
    showNoDataArea?: boolean
    /** Dimension filters for long-format datasets. */
    filter?: Record<string, string>
    /** Per-binding overrides of column metadata. */
    bindings?: Record<string, Partial<ColumnMeta>>

    /** Ordered chart types this definition supports. */
    types: ChartType[]
    defaultTab?: Tab

    selectedEntities?: string[]
    includedEntities?: string[]
    excludedEntities?: string[]
    entityColours?: Record<string, string>
    selectionMode: SelectionMode
    focusedSeries?: SeriesKey[]

    time?: TimeSelection
    timelineRange?: TimeSelection
    hideTimeline: boolean

    xAxis?: AxisConfig
    yAxis?: AxisConfig
    stackMode: StackMode
    sort?: SortConfig
    facet: FacetStrategy
    missingData: MissingDataStrategy
    comparisonLines?: ComparisonLine[]
    seriesStrategy?: SeriesStrategy

    /** Stacked discrete bars: insert extra vertical space after these entity rows. */
    rowGroupBreaks?: string[]
    /** Extra space at each row-group break, measured in normal row slots. Default 0.75. */
    rowGroupGap?: number

    hideLegend: boolean
    hideSeriesLabels: boolean
    hideRelativeToggle: boolean
    hideTotalLabel: boolean

    theme?: string
    locale?: Locale
}

// ---------------------------------------------------------------------------
// View state (spec 02 §3) — reader state layered over the definition.
// Round-trips through the URL. NEVER mutates the definition.
// Hover is NOT view state: emphasis styling never relayouts the chart.
// ---------------------------------------------------------------------------

export interface ViewState {
    tab?: Tab
    time?: TimeSelection
    entities?: string[]
    focus?: SeriesKey[]
    yScale?: ScaleType
    stackMode?: StackMode
    facet?: FacetStrategy
    tableSort?: { column: string; order: SortOrder }
    tableScope?: "selected" | "all"
}

// ---------------------------------------------------------------------------
// Layout warnings — non-fatal diagnostics surfaced by layout and validation
// ---------------------------------------------------------------------------

export interface Diagnostic {
    severity: "warning" | "error"
    code: string
    message: string
    /** e.g. row number, entity name, column slug */
    context?: Record<string, string | number>
}
