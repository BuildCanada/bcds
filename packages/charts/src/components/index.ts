/**
 * Component exports for @buildcanada/charts
 */

// Text wrapping components
export { TextWrap, shortenWithEllipsis } from "./TextWrap/TextWrap"

export {
    MarkdownTextWrap,
    sumTextWrapHeights,
    toPlaintext,
} from "./MarkdownTextWrap/MarkdownTextWrap"

// Simple markdown text
export {
    SimpleMarkdownText,
    HtmlOrSimpleMarkdownText,
} from "./SimpleMarkdownText"

// Expandable toggle
export { ExpandableToggle } from "./ExpandableToggle/ExpandableToggle"

// Form components
export { LabeledSwitch } from "./LabeledSwitch/LabeledSwitch"
export { Checkbox } from "./Checkbox"
export { RadioButton } from "./RadioButton"
export { TextInput } from "./TextInput"
export { Button } from "./Button/Button"

// Overlay components
export {
    CloseButton,
    CLOSE_BUTTON_HEIGHT,
    CLOSE_BUTTON_WIDTH,
} from "./closeButton/CloseButton"
export { OverlayHeader } from "./OverlayHeader"

// Visual components
export { Halo } from "./Halo/Halo"
export { BodyPortal } from "./BodyPortal/BodyPortal"
export { LoadingIndicator } from "./loadingIndicator/LoadingIndicator"

// React utilities
export { reactRenderToStringClientOnly } from "./reactUtil"

// Grapher-specific components
export { GrapherTabIcon } from "./GrapherTabIcon"
export { GrapherTrendArrow } from "./GrapherTrendArrow"

// Stub components for data page features
export { CodeSnippet } from "./stubs/CodeSnippet"
export {
    makeSource,
    makeLastUpdated,
    makeNextUpdate,
    makeDateRange,
    makeUnit,
    makeUnitConversionFactor,
    makeLinks,
} from "./stubs/IndicatorKeyData"
export { IndicatorSources } from "./stubs/IndicatorSources"
export { IndicatorProcessing } from "./stubs/IndicatorProcessing"
export { DataCitation } from "./stubs/DataCitation"

// Site constants re-exported for convenience
export {
    DATAPAGE_ABOUT_THIS_DATA_SECTION_ID,
    DATAPAGE_SOURCES_AND_PROCESSING_SECTION_ID,
    REUSE_THIS_WORK_SECTION_ID,
} from "../types/index"
