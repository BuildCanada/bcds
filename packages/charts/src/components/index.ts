/**
 * Component exports for @buildcanada/charts
 */

// Text wrapping components
export { TextWrap, shortenWithEllipsis } from "./TextWrap/TextWrap.js"

export {
    MarkdownTextWrap,
    sumTextWrapHeights,
    toPlaintext,
} from "./MarkdownTextWrap/MarkdownTextWrap.js"

// Simple markdown text
export {
    SimpleMarkdownText,
    HtmlOrSimpleMarkdownText,
} from "./SimpleMarkdownText.js"

// Expandable toggle
export { ExpandableToggle } from "./ExpandableToggle/ExpandableToggle.js"

// Form components
export { LabeledSwitch } from "./LabeledSwitch/LabeledSwitch.js"
export { Checkbox } from "./Checkbox.js"
export { RadioButton } from "./RadioButton.js"
export { TextInput } from "./TextInput.js"
export { Button } from "./Button/Button.js"

// Overlay components
export {
    CloseButton,
    CLOSE_BUTTON_HEIGHT,
    CLOSE_BUTTON_WIDTH,
} from "./closeButton/CloseButton.js"
export { OverlayHeader } from "./OverlayHeader.js"

// Visual components
export { Halo } from "./Halo/Halo.js"
export { BodyPortal } from "./BodyPortal/BodyPortal.js"
export { LoadingIndicator } from "./loadingIndicator/LoadingIndicator.js"

// React utilities
export { reactRenderToStringClientOnly } from "./reactUtil.js"

// Grapher-specific components
export { GrapherTabIcon } from "./GrapherTabIcon.js"
export { GrapherTrendArrow } from "./GrapherTrendArrow.js"

// Stub components for data page features
export { CodeSnippet } from "./stubs/CodeSnippet.js"
export {
    makeSource,
    makeLastUpdated,
    makeNextUpdate,
    makeDateRange,
    makeUnit,
    makeUnitConversionFactor,
    makeLinks,
} from "./stubs/IndicatorKeyData.js"
export { IndicatorSources } from "./stubs/IndicatorSources.js"
export { IndicatorProcessing } from "./stubs/IndicatorProcessing.js"
export { DataCitation } from "./stubs/DataCitation.js"

// Site constants re-exported for convenience
export {
    DATAPAGE_ABOUT_THIS_DATA_SECTION_ID,
    DATAPAGE_SOURCES_AND_PROCESSING_SECTION_ID,
    REUSE_THIS_WORK_SECTION_ID,
} from "../types/index.js"
