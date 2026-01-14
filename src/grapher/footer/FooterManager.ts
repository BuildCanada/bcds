import { TooltipManager } from "../tooltip/TooltipProps"
import { DetailsMarker } from "../../types/index.js"
import { ActionButtonsManager } from "../controls/ActionButtons"
import { GrapherModal } from "../core/GrapherConstants"

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
    hasOWIDLogo?: boolean
    originUrlWithProtocol?: string
    detailsOrderedByReference?: string[]
    shouldIncludeDetailsInStaticExport?: boolean
    activeModal?: GrapherModal
    isSmall?: boolean
    isMedium?: boolean
    useBaseFontSize?: boolean
    fontSize?: number
    isInFullScreenMode?: boolean
    isEmbeddedInAnOwidPage?: boolean
    isEmbeddedInADataPage?: boolean
    hideNote?: boolean
    hideOriginUrl?: boolean
    isStaticAndSmall?: boolean
    isSocialMediaExport?: boolean
    detailsMarkerInSvg?: DetailsMarker
    /** Branding configuration for the footer */
    branding?: FooterBranding
}
