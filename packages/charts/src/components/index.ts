/**
 * Component exports for @buildcanada/charts
 */

// Text wrapping components
export { TextWrap, shortenWithEllipsis } from "./TextWrap/TextWrap.tsx"

export {
    MarkdownTextWrap,
    sumTextWrapHeights,
    toPlaintext,
} from "./MarkdownTextWrap/MarkdownTextWrap.tsx"

// Simple markdown text
export {
    SimpleMarkdownText,
    HtmlOrSimpleMarkdownText,
} from "./SimpleMarkdownText.tsx"

// Expandable toggle
export { ExpandableToggle } from "./ExpandableToggle/ExpandableToggle.tsx"

// Form components
export { LabeledSwitch } from "./LabeledSwitch/LabeledSwitch.tsx"
export { Checkbox } from "./Checkbox.tsx"
export { RadioButton } from "./RadioButton.tsx"
export { TextInput } from "./TextInput.tsx"
export { Button } from "./Button/Button.tsx"

// Overlay components
export {
    CloseButton,
    CLOSE_BUTTON_HEIGHT,
    CLOSE_BUTTON_WIDTH,
} from "./closeButton/CloseButton.tsx"
export { OverlayHeader } from "./OverlayHeader.tsx"

// Visual components
export { Halo } from "./Halo/Halo.tsx"
export { BodyPortal } from "./BodyPortal/BodyPortal.tsx"
export { LoadingIndicator } from "./loadingIndicator/LoadingIndicator.tsx"

// React utilities
export { reactRenderToStringClientOnly } from "./reactUtil.ts"

// Grapher-specific components
export { GrapherTabIcon } from "./GrapherTabIcon.tsx"
export { GrapherTrendArrow } from "./GrapherTrendArrow.tsx"

// Stub components for data page features
export { CodeSnippet } from "./stubs/CodeSnippet.tsx"
export {
    makeSource,
    makeLastUpdated,
    makeNextUpdate,
    makeDateRange,
    makeUnit,
    makeUnitConversionFactor,
    makeLinks,
} from "./stubs/IndicatorKeyData.tsx"
export { IndicatorSources } from "./stubs/IndicatorSources.tsx"
export { IndicatorProcessing } from "./stubs/IndicatorProcessing.tsx"
export { DataCitation } from "./stubs/DataCitation.tsx"

// Site constants re-exported for convenience
export {
    DATAPAGE_ABOUT_THIS_DATA_SECTION_ID,
    DATAPAGE_SOURCES_AND_PROCESSING_SECTION_ID,
    REUSE_THIS_WORK_SECTION_ID,
} from "../types/index.ts"
