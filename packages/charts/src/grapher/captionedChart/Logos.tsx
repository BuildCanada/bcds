import * as React from "react"
import {
    BUILDCANADA_LOGO_SVG,
    BUILDCANADA_WIDE_LOGO_SVG,
    CANADASPENDS_LOGO_SVG,
    CORE_LOGO_SVG,
    GV_LOGO_SVG,
    LEGACY_LOGO_SVG,
    SMALL_LEGACY_LOGO_SVG,
} from "./LogosSVG"
import { LogoOption } from "../../types/index.ts"
import { makeIdForHumanConsumption } from "../../utils/index.ts"

interface LogoAttributes {
    svg: string
    width: number
    height: number
    targetHeight: number
    url?: string
}

const logos: Record<LogoOption, LogoAttributes> = {
    legacy: {
        svg: LEGACY_LOGO_SVG,
        width: 65,
        height: 36,
        targetHeight: 36,
    },
    "core+legacy": {
        svg: CORE_LOGO_SVG,
        width: 102,
        height: 37,
        targetHeight: 36,
    },
    "gv+legacy": {
        svg: GV_LOGO_SVG,
        width: 420,
        height: 350,
        targetHeight: 52,
    },
    buildcanada: {
        svg: BUILDCANADA_LOGO_SVG,
        width: 65,
        height: 65,
        targetHeight: 36,
        url: "https://buildcanada.ca",
    },
    "buildcanada-wide": {
        svg: BUILDCANADA_WIDE_LOGO_SVG,
        width: 107,
        height: 65,
        targetHeight: 36,
        url: "https://buildcanada.ca",
    },
    canadaspends: {
        svg: CANADASPENDS_LOGO_SVG,
        width: 117,
        height: 36,
        targetHeight: 36,
        url: "https://canadaspends.ca",
    },
}

// legacy logo optimized for small sizes
const smallLogo = {
    svg: SMALL_LEGACY_LOGO_SVG,
    width: 51,
    height: 28,
    targetHeight: 28,
}

interface LogoProps {
    logo?: LogoOption
    isLink: boolean
    heightScale?: number
    useSmallVersion?: boolean
}

export class Logo {
    props: LogoProps
    constructor(props: LogoProps) {
        this.props = props
    }

    private get logo(): LogoOption {
        return this.props.logo ?? LogoOption["buildcanada-wide"]
    }

    private get spec(): LogoAttributes {
        if (this.props.useSmallVersion && this.logo === LogoOption.legacy) {
            return smallLogo
        }
        return logos[this.logo]
    }

    private get targetHeight(): number {
        return (this.props.heightScale ?? 1) * this.spec.targetHeight
    }

    private get scale(): number {
        return this.targetHeight / this.spec.height
    }

    get width(): number {
        return this.spec.width * this.scale
    }
    get height(): number {
        return this.spec.height * this.scale
    }

    renderSVG(targetX: number, targetY: number): React.ReactElement {
        const { scale } = this
        const svg =
            (this.spec.svg.match(/<svg>(.*)<\/svg>/) || "")[1] || this.spec.svg
        return (
            <g
                id={makeIdForHumanConsumption("logo")}
                transform={`translate(${Math.round(
                    targetX
                )}, ${targetY}) scale(${parseFloat(scale.toFixed(2))})`}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        )
    }

    renderHTML(): React.ReactElement {
        const { spec } = this
        const props: React.HTMLAttributes<HTMLElement> = {
            className: "logo",
            dangerouslySetInnerHTML: { __html: spec.svg },
            style: { height: `${this.targetHeight}px` },
        }
        if (this.props.isLink && spec.url)
            return (
                <a {...props} href={spec.url} target="_blank" rel="noopener" />
            )
        else return <div {...props} />
    }
}
