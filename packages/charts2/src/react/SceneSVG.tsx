/**
 * SceneSVG — THE single scene→SVG renderer (spec 28 §1).
 *
 * Pure presentational: (ChartScene, idPrefix, emphasis) → <svg>. Works in the
 * browser and under renderToStaticMarkup — zero hooks, zero environment reads.
 * Determinism (spec 28 §2): no useId, element ids derive from idPrefix +
 * stable node keys, every numeric attribute is formatted through fmt()
 * (round2, plain decimals, no exponents, no -0).
 *
 * Interactivity: when `interactive`, marks render with pointer-events: none
 * and a transparent hit layer built from scene.hover.targets carries ALL
 * pointer handlers — hit logic is purely the precomputed targets, hover
 * never relayouts (spec 07 §3).
 */

import { line as d3Line } from "d3-shape"
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react"

import type {
    ChartScene,
    FillStyle,
    HitTarget,
    Rect,
    SceneNode,
    StrokeStyle,
    Vec2,
} from "../core/scene/nodes.ts"
import { round2 } from "../core/scene/nodes.ts"
import { familyNameFor } from "../core/text/metricsTables.ts"
import type { EmphasisModel } from "./interaction/emphasisReducer.ts"

export interface SceneSVGProps {
    scene: ChartScene
    /** Stable id namespace (chart slug); never random (spec 28 §2). */
    idPrefix: string
    /** Attach the hit layer and disable pointer events on marks. */
    interactive?: boolean
    emphasis?: EmphasisModel
    /** Theme dim factor applied to non-emphasized series. */
    dimOpacity?: number
    /** Pointer entered/moved over a hit target. Point is in scene coordinates. */
    onHover?: (target: HitTarget, point: Vec2) => void
    onLeave?: () => void
    /** Click on a hit target (Chart toggles focus for series targets). */
    onActivate?: (target: HitTarget) => void
}

// ---------------------------------------------------------------------------
// Number formatting — the one place scene numbers become SVG strings
// ---------------------------------------------------------------------------

/**
 * Format a coordinate as a plain decimal string: round2 (which normalizes
 * -0), never exponent notation. round2 output has at most 2 decimals, so
 * Number#toString is exponent-free for any plausible coordinate magnitude.
 */
function fmt(n: number): string {
    const r = round2(n)
    if (!Number.isFinite(r)) return "0"
    return r.toString()
}

// ---------------------------------------------------------------------------
// Path serialization (d3-shape lives HERE only — spec 28 §4)
// ---------------------------------------------------------------------------

const pathLine = d3Line<Vec2>()
    .x((d) => round2(d.x))
    .y((d) => round2(d.y))

/** One d attribute for a polyline series; separate segments encode gaps. */
function lineD(segments: Vec2[][]): string {
    return segments
        .filter((segment) => segment.length > 0)
        .map((segment) => pathLine(segment) ?? "")
        .join("")
}

/** Closed band: upper polyline, then the lower boundary reversed, then Z. */
function areaD(upper: Vec2[], lower: Vec2[]): string {
    const ring = [...upper, ...[...lower].reverse()]
    if (ring.length === 0) return ""
    return `${pathLine(ring) ?? ""}Z`
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function combinedOpacity(base: number | undefined, dim: number): string | undefined {
    const opacity = (base ?? 1) * dim
    return opacity === 1 ? undefined : fmt(opacity)
}

function strokeAttrs(style: StrokeStyle, dim: number) {
    return {
        fill: "none",
        stroke: style.stroke,
        strokeWidth: fmt(style.strokeWidth),
        strokeDasharray: style.dash !== undefined ? style.dash.map(fmt).join(" ") : undefined,
        strokeLinecap: style.lineCap,
        opacity: combinedOpacity(style.opacity, dim),
    }
}

function fillAttrs(style: FillStyle, dim: number) {
    return {
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth !== undefined ? fmt(style.strokeWidth) : undefined,
        opacity: combinedOpacity(style.opacity, dim),
    }
}

function rectAttrs(rect: Rect) {
    return { x: fmt(rect.x), y: fmt(rect.y), width: fmt(rect.width), height: fmt(rect.height) }
}

// ---------------------------------------------------------------------------
// Pattern defs — layout references patterns by id (e.g. projection hatch)
// ---------------------------------------------------------------------------

function collectPatternIds(nodes: SceneNode[], into: Set<string>): void {
    for (const node of nodes) {
        switch (node.kind) {
            case "group":
                collectPatternIds(node.children, into)
                break
            case "area":
            case "rect":
            case "point":
                if (node.style.patternId !== undefined) into.add(node.style.patternId)
                break
            default:
                break
        }
    }
}

/**
 * Diagonal hatch knocked out of the fill in the scene background colour.
 * Marks with a patternId render their solid fill plus this overlay.
 */
function patternDef(patternId: string, idPrefix: string, background: string): ReactNode {
    return (
        <pattern
            key={patternId}
            id={`${idPrefix}-pattern-${patternId}`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
        >
            <line x1="0" y1="0" x2="0" y2="6" stroke={background} strokeWidth="2.5" opacity="0.55" />
        </pattern>
    )
}

// ---------------------------------------------------------------------------
// Node rendering
// ---------------------------------------------------------------------------

interface RenderContext {
    idPrefix: string
    emphasis: EmphasisModel
    dimOpacity: number
}

/** Dim factor for this node; 1 when idle, ancestor-dimmed, or emphasized. */
function dimFor(node: SceneNode, ctx: RenderContext, ancestorDimmed: boolean): number {
    if (ancestorDimmed) return 1
    if (ctx.emphasis.mode !== "emphasis") return 1
    if (node.seriesKey === undefined) return 1
    return ctx.emphasis.keys.has(node.seriesKey) ? 1 : ctx.dimOpacity
}

function renderNode(node: SceneNode, ctx: RenderContext, ancestorDimmed: boolean): ReactNode {
    const dim = dimFor(node, ctx, ancestorDimmed)
    const childDimmed = ancestorDimmed || dim !== 1

    switch (node.kind) {
        case "group": {
            const clipId = `${ctx.idPrefix}-clip-${node.key}`
            return (
                <g
                    key={node.key}
                    opacity={dim !== 1 ? fmt(dim) : undefined}
                    clipPath={node.clip !== undefined ? `url(#${clipId})` : undefined}
                >
                    {node.clip !== undefined ? (
                        <clipPath id={clipId}>
                            <rect {...rectAttrs(node.clip)} />
                        </clipPath>
                    ) : null}
                    {node.children.map((child) => renderNode(child, ctx, childDimmed))}
                </g>
            )
        }
        case "line":
            return <path key={node.key} d={lineD(node.segments)} {...strokeAttrs(node.style, dim)} />
        case "area": {
            const d = areaD(node.upper, node.lower)
            if (node.style.patternId === undefined) {
                return <path key={node.key} d={d} {...fillAttrs(node.style, dim)} />
            }
            return (
                <g key={node.key} opacity={dim !== 1 ? fmt(dim) : undefined}>
                    <path d={d} {...fillAttrs(node.style, 1)} />
                    <path d={d} fill={`url(#${ctx.idPrefix}-pattern-${node.style.patternId})`} />
                </g>
            )
        }
        case "image":
            return (
                <image
                    key={node.key}
                    href={node.href}
                    {...rectAttrs(node.rect)}
                    preserveAspectRatio={node.preserveAspectRatio}
                    opacity={combinedOpacity(node.opacity, dim)}
                />
            )
        case "rect": {
            const base = <rect key={node.key} {...rectAttrs(node.rect)} {...fillAttrs(node.style, dim)} />
            if (node.style.patternId === undefined) return base
            return (
                <g key={node.key} opacity={dim !== 1 ? fmt(dim) : undefined}>
                    <rect {...rectAttrs(node.rect)} {...fillAttrs(node.style, 1)} />
                    <rect
                        {...rectAttrs(node.rect)}
                        fill={`url(#${ctx.idPrefix}-pattern-${node.style.patternId})`}
                    />
                </g>
            )
        }
        case "point":
            return (
                <circle
                    key={node.key}
                    cx={fmt(node.center.x)}
                    cy={fmt(node.center.y)}
                    r={fmt(node.radius)}
                    {...fillAttrs(node.style, dim)}
                />
            )
        case "rule":
            return (
                <line
                    key={node.key}
                    x1={fmt(node.from.x)}
                    y1={fmt(node.from.y)}
                    x2={fmt(node.to.x)}
                    y2={fmt(node.to.y)}
                    {...strokeAttrs(node.style, dim)}
                />
            )
        case "text":
            return (
                <text
                    key={node.key}
                    x={fmt(node.position.x)}
                    y={fmt(node.position.y)}
                    textAnchor={node.anchor}
                    fill={node.colour}
                    fontFamily={familyNameFor(node.font.family)}
                    fontSize={fmt(node.font.sizePx)}
                    fontWeight={node.font.weight}
                    letterSpacing={
                        node.font.letterSpacing !== undefined ? fmt(node.font.letterSpacing) : undefined
                    }
                    opacity={combinedOpacity(node.opacity, dim)}
                    style={{ fontFeatureSettings: "'liga' 0" }}
                >
                    {node.text}
                </text>
            )
    }
}

// ---------------------------------------------------------------------------
// Hit layer — invisible overlay carrying ALL pointer handlers
// ---------------------------------------------------------------------------

function pointFromEvent(event: ReactPointerEvent<Element>): Vec2 {
    const svg = event.currentTarget.closest("svg")
    if (svg === null) return { x: 0, y: 0 }
    const bounds = svg.getBoundingClientRect()
    return { x: event.clientX - bounds.x, y: event.clientY - bounds.y }
}

interface HitHandlers {
    onHover?: (target: HitTarget, point: Vec2) => void
    onActivate?: (target: HitTarget) => void
}

function hitRect(target: HitTarget, rect: Rect, label: string, handlers: HitHandlers): ReactNode {
    const hover =
        handlers.onHover !== undefined
            ? (event: ReactPointerEvent<SVGRectElement>) =>
                  handlers.onHover?.(target, pointFromEvent(event))
            : undefined
    return (
        <rect
            key={label}
            data-bc-hit={label}
            {...rectAttrs(rect)}
            fill="transparent"
            onPointerEnter={hover}
            onPointerMove={hover}
            onClick={handlers.onActivate !== undefined ? () => handlers.onActivate?.(target) : undefined}
        />
    )
}

/**
 * Time targets become vertical strips spanning the plot area between
 * midpoints of adjacent target x positions; series targets cover their
 * precomputed shapes.
 */
function renderHitLayer(scene: ChartScene, handlers: HitHandlers, onLeave?: () => void): ReactNode {
    const plot = scene.plotArea
    const timeTargets = scene.hover.targets
        .filter((target) => target.kind === "time")
        .sort((a, b) => a.x - b.x)
    const strips = timeTargets.map((target, i) => {
        const left = i === 0 ? plot.x : (timeTargets[i - 1].x + target.x) / 2
        const right =
            i === timeTargets.length - 1 ? plot.x + plot.width : (target.x + timeTargets[i + 1].x) / 2
        const rect: Rect = { x: left, y: plot.y, width: Math.max(0, right - left), height: plot.height }
        return hitRect(target, rect, `time:${target.time}`, handlers)
    })
    const shapes = scene.hover.targets
        .filter((target) => target.kind === "series")
        .map((target) => hitRect(target, target.shape, `series:${target.seriesKey}`, handlers))
    return (
        <g onPointerLeave={onLeave !== undefined ? () => onLeave() : undefined}>
            {strips}
            {shapes}
        </g>
    )
}

// ---------------------------------------------------------------------------
// The component
// ---------------------------------------------------------------------------

const IDLE: EmphasisModel = { mode: "idle" }

export function SceneSVG({
    scene,
    idPrefix,
    interactive = false,
    emphasis = IDLE,
    dimOpacity = 0.35,
    onHover,
    onLeave,
    onActivate,
}: SceneSVGProps): ReactNode {
    const ctx: RenderContext = { idPrefix, emphasis, dimOpacity }
    const patternIds = new Set<string>()
    collectPatternIds(scene.nodes, patternIds)
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            width={fmt(scene.width)}
            height={fmt(scene.height)}
            viewBox={`0 0 ${fmt(scene.width)} ${fmt(scene.height)}`}
        >
            {patternIds.size > 0 ? (
                <defs>
                    {[...patternIds].sort().map((patternId) =>
                        patternDef(patternId, idPrefix, scene.background),
                    )}
                </defs>
            ) : null}
            <rect x="0" y="0" width={fmt(scene.width)} height={fmt(scene.height)} fill={scene.background} />
            <g style={interactive ? { pointerEvents: "none" } : undefined}>
                {scene.nodes.map((node) => renderNode(node, ctx, false))}
            </g>
            {interactive ? renderHitLayer(scene, { onHover, onActivate }, onLeave) : null}
        </svg>
    )
}
