import { Bounds } from "../../utils/index.js"
import { DetailsMarker } from "../../types/index.js"

export interface HeaderManager {
    currentTitle?: string
    currentSubtitle?: string
    hideLogo?: boolean
    shouldLinkToOwid?: boolean
    logo?: string
    canonicalUrl?: string
    captionedChartBounds?: Bounds
    detailsOrderedByReference?: string[]
    shouldIncludeDetailsInStaticExport?: boolean
    isExportingToSvgOrPng?: boolean
    isNarrow?: boolean
    isSmall?: boolean
    isMedium?: boolean
    isSemiNarrow?: boolean
    isOnCanonicalUrl?: boolean
    isInIFrame?: boolean
    useBaseFontSize?: boolean
    fontSize?: number
    hideTitle?: boolean
    hideSubtitle?: boolean
    isStaticAndSmall?: boolean
    isSocialMediaExport?: boolean
    detailsMarkerInSvg?: DetailsMarker
}
