/**
 * Minimal analytics type stubs for chart functionality.
 * These are simplified versions - actual analytics implementation
 * should be provided by the consuming application.
 */

export enum EventCategory {
    GrapherView = "grapher_view",
    GrapherClick = "grapher_click",
    GrapherHover = "grapher_hover",
    GrapherError = "grapher_error",
    GrapherEntitySelector = "grapher_entity_selector",
    ExplorerView = "explorer_view",
    ExplorerCountrySelector = "explorer_country_selector",
    GlobalEntitySelectorUsage = "global_entity_selector_usage",
    SiteClick = "site_click",
    SiteFormSubmit = "site_form_submit",
    KeyboardShortcut = "keyboard_shortcut",
}

export type EntityControlEvent = "open" | "change" | "close"

export type EntitySelectorEvent =
    | "enter"
    | "select"
    | "deselect"
    | "sortBy"
    | "sortOrder"
    | "filterBy"
    | "clear"

export type GrapherImageDownloadEvent =
    | "chart_download_png"
    | "chart_download_svg"

export type GrapherInteractionEvent =
    | "map_country_hover"
    | "map_legend_hover"

export enum GrapherErrorAction {
    GrapherViewError = "grapher_view_error",
    EntitiesNotFound = "entities_not_found",
}

export interface GrapherAnalyticsContext {
    slug?: string
    viewConfigId?: string
    narrativeChartName?: string
}

export interface GAEvent {
    event: string
    [key: string]: unknown
}
