import { TooltipManager } from "../tooltip/TooltipProps.js"
import { DetailsMarker } from "../../types/index.js"
import { ActionButtonsManager } from "../controls/ActionButtons.js"
import { GrapherModal } from "../core/GrapherConstants.js"

/**
 * Branding configuration for the footer
 */
export interface FooterBranding {
    /** License text to display (e.g., "CC BY") */
    licenseText?: string
    /** URL for the license link */
    licenseUrl?: string
    /** Text for "Powered by" attribution */
    poweredByText?: string
    /** URL for "Powered by" link */
    poweredByUrl?: string
    /** Tooltip text explaining the license */
    licenseTooltip?: string
}

export interface FooterManager extends TooltipManager, ActionButtonsManager {
    sourcesLine?: string
    note?: string
    hasLegacyLogo?: boolean
    originUrlWithProtocol?: string
    detailsOrderedByReference?: string[]
    shouldIncludeDetailsInStaticExport?: boolean
    activeModal?: GrapherModal
    isSmall?: boolean
    isMedium?: boolean
    useBaseFontSize?: boolean
    fontSize?: number
    isInFullScreenMode?: boolean
    isEmbeddedInPage?: boolean
    isEmbeddedInADataPage?: boolean
    hideNote?: boolean
    hideOriginUrl?: boolean
    isStaticAndSmall?: boolean
    isSocialMediaExport?: boolean
    detailsMarkerInSvg?: DetailsMarker
    /** Branding configuration for the footer */
    branding?: FooterBranding
}
