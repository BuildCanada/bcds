import { getEntities, resolveNumericValue } from "../data"
import { formatValue } from "../format"
import { createChartModel, getNumericExtent, type CreateChartModelOptions } from "../model"
import { node, renderSvgNode, textNode, type SvgNode } from "../scene"
import { formatTime, getAvailableTimes } from "../time"
import type { ChartDataset, ChartDefinition, ChartModel, RenderSize, SeriesModel, TimeValue } from "../types"

interface PlotBox {
    x: number
    y: number
    width: number
    height: number
}

export interface RenderChartSvgOptions {
    state?: CreateChartModelOptions["state"]
    size?: Partial<RenderSize>
}

export const renderChartSvg = (
    definition: ChartDefinition,
    dataset: ChartDataset,
    options: RenderChartSvgOptions = {}
): string => renderModelToSvg(createChartModel(definition, dataset, options))

export const renderModelToSvg = (model: ChartModel): string => {
    const { width, height } = model.size
    const plot: PlotBox = {
        x: 142,
        y: model.subtitle ? 138 : 118,
        width: Math.max(120, width - 190),
        height: Math.max(120, height - 230),
    }

    const children: SvgNode[] = [
        node("rect", { x: 0, y: 0, width, height, fill: model.theme.background }),
        node("rect", {
            x: 16,
            y: 16,
            width: width - 32,
            height: height - 32,
            fill: model.theme.surface,
            stroke: model.theme.border,
            "stroke-width": 1,
        }),
        node("rect", { x: 16, y: 16, width: width - 32, height: 5, fill: model.theme.accent }),
        ...renderHeader(model),
    ]

    switch (model.activeType) {
        case "line":
            children.push(...renderLineChart(model, plot))
            break
        case "discrete-bar":
            children.push(...renderDiscreteBarChart(model, plot))
            break
        case "stacked-area":
            children.push(...renderStackedAreaChart(model, plot))
            break
        case "stacked-bar":
        case "stacked-discrete-bar":
            children.push(...renderStackedBarChart(model, plot))
            break
        case "slope":
            children.push(...renderSlopeChart(model, plot))
            break
        case "dumbbell":
            children.push(...renderDumbbellChart(model, plot))
            break
        case "scatter":
            children.push(...renderScatterChart(model, plot))
            break
        case "marimekko":
            children.push(...renderMarimekkoChart(model, plot))
            break
        case "map":
            children.push(...renderMapChart(model, plot))
            break
        case "waterfall":
            children.push(...renderWaterfallChart(model, plot))
            break
        case "treemap":
            children.push(...renderTreemapChart(model, plot))
            break
        case "sankey":
            children.push(...renderSankeyChart(model, plot))
            break
        case "bullet":
            children.push(...renderBulletChart(model, plot))
            break
        case "table":
        default:
            children.push(...renderTable(model, plot))
    }

    children.push(...renderFooter(model, height))

    return renderSvgNode(
        node("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: `0 0 ${width} ${height}`,
            width,
            height,
            role: "img",
            "aria-label": model.title,
        }, [
            node("title", {}, [model.title]),
            ...children,
        ])
    )
}

const renderHeader = (model: ChartModel): SvgNode[] => {
    const titleLines = wrapText(model.title, 54)
    const eyebrowY = 42
    const titleY = 70
    const title = titleLines.map((line, index) =>
        textNode(36, titleY + index * 28, line, {
            fill: model.theme.text,
            "font-family": model.theme.fontFamily,
            "font-size": model.theme.titleSize,
            "font-weight": 500,
        })
    )
    const subtitle = model.subtitle
        ? wrapText(model.subtitle, 80).map((line, index) =>
              textNode(36, titleY + titleLines.length * 28 + 10 + index * 18, line, {
                  fill: model.theme.mutedText,
                  "font-family": model.theme.bodyFontFamily,
                  "font-size": 15,
              })
          )
        : []
    return [
        textNode(36, eyebrowY, "BUILD CANADA DATA", {
            fill: model.theme.accent,
            "font-family": model.theme.monoFontFamily,
            "font-size": 10,
            "font-weight": 700,
            "letter-spacing": 1.2,
        }),
        node("line", {
            x1: 36,
            x2: 168,
            y1: eyebrowY + 8,
            y2: eyebrowY + 8,
            stroke: model.theme.accent,
            "stroke-width": 1.5,
        }),
        node("rect", {
            x: model.size.width - 148,
            y: 36,
            width: 12,
            height: 12,
            fill: model.theme.accent,
        }),
        textNode(model.size.width - 128, 47, model.theme.attribution.toUpperCase(), {
            fill: model.theme.text,
            "font-family": model.theme.monoFontFamily,
            "font-size": 10,
            "letter-spacing": 0.8,
        }),
        ...title,
        ...subtitle,
    ]
}

const renderFooter = (model: ChartModel, height: number): SvgNode[] => {
    const source = model.sourceText ? `Source: ${model.sourceText}` : model.theme.attribution
    const note = model.note ? `Note: ${model.note}` : undefined
    return [
        node("line", {
            x1: 36,
            x2: model.size.width - 36,
            y1: height - 64,
            y2: height - 64,
            stroke: model.theme.border,
            "stroke-width": 1,
        }),
        ...(note
            ? [
                  textNode(36, height - 42, note, {
                      fill: model.theme.mutedText,
                      "font-family": model.theme.bodyFontFamily,
                      "font-size": 11,
                  }),
              ]
            : []),
        textNode(36, height - 26, source, {
            fill: model.theme.mutedText,
            "font-family": model.theme.monoFontFamily,
            "font-size": 10,
        }),
        node("rect", {
            x: model.size.width - 168,
            y: height - 36,
            width: 8,
            height: 8,
            fill: model.theme.accent,
        }),
        textNode(model.size.width - 36, height - 26, model.theme.attributionUrl ?? model.theme.attribution, {
            fill: model.theme.text,
            "font-family": model.theme.monoFontFamily,
            "font-size": 10,
            "text-anchor": "end",
        }),
    ]
}

const renderLineChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const [minY, maxY] = getNumericExtent(model)
    const times = getRenderableTimes(model)
    const xFor = (time: TimeValue | undefined): number => {
        if (!time || times.length <= 1) return plot.x
        const index = times.findIndex((candidate) => candidate === time)
        return plot.x + (index / (times.length - 1)) * plot.width
    }
    const yFor = (value: number): number =>
        plot.y + plot.height - ((value - minY) / (maxY - minY)) * plot.height

    const nodes: SvgNode[] = [...renderAxes(model, plot, minY, maxY, times)]

    for (const series of model.series) {
        const definedPoints = series.points.filter(
            (point) => point.value !== null && point.time !== undefined
        )
        const path = definedPoints
            .map((point, index) => {
                const command = index === 0 ? "M" : "L"
                return `${command}${round(xFor(point.time))},${round(yFor(point.value!))}`
            })
            .join("")

        if (path) {
            nodes.push(
                node("path", {
                    d: path,
                    fill: "none",
                    stroke: series.colour,
                    "stroke-width": 2.4,
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                })
            )
        }

        for (const point of definedPoints) {
            nodes.push(
                node("circle", {
                    cx: xFor(point.time),
                    cy: yFor(point.value!),
                    r: point.projected ? 3 : 2.4,
                    fill: model.theme.surface,
                    stroke: series.colour,
                    "stroke-width": 1.5,
                })
            )
        }

        const last = definedPoints[definedPoints.length - 1]
        if (last && !model.definition.hideSeriesLabels) {
            nodes.push(
                textNode(xFor(last.time) + 6, yFor(last.value!) + 4, series.label, {
                    fill: series.colour,
                    "font-family": model.theme.fontFamily,
                    "font-size": model.theme.labelSize,
                })
            )
        }
    }

    return nodes
}

const renderDiscreteBarChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const [minY, maxY] = getNumericExtent(model)
    const baseline = minY < 0 ? scaleX(0, minY, maxY, plot) : plot.x
    const visible = model.series
        .map((series) => ({ series, point: series.points[series.points.length - 1] }))
        .sort((a, b) => {
            const av = a.point?.value ?? Number.NEGATIVE_INFINITY
            const bv = b.point?.value ?? Number.NEGATIVE_INFINITY
            return bv - av
        })
    const gap = 8
    const barHeight = Math.max(8, (plot.height - gap * (visible.length - 1)) / Math.max(1, visible.length))
    const nodes: SvgNode[] = [...renderValueAxis(model, plot, minY, maxY)]

    visible.forEach(({ series, point }, index) => {
        const y = plot.y + index * (barHeight + gap)
        const value = point?.value
        const x1 = value === null || value === undefined ? plot.x : scaleX(value, minY, maxY, plot)
        const width = Math.abs(x1 - baseline)

        nodes.push(
            textNode(plot.x - 8, y + barHeight * 0.65, series.label, {
                fill: model.theme.text,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.labelSize,
                "text-anchor": "end",
            })
        )

        if (value === null || value === undefined) {
            nodes.push(
                textNode(plot.x + 4, y + barHeight * 0.65, "No data", {
                    fill: model.theme.mutedText,
                    "font-family": model.theme.fontFamily,
                    "font-size": model.theme.labelSize,
                })
            )
            return
        }

        nodes.push(
            node("rect", {
                x: Math.min(baseline, x1),
                y,
                width,
                height: barHeight,
                fill: series.colour,
            })
        )
        nodes.push(
            textNode(Math.max(baseline, x1) + 6, y + barHeight * 0.65, formatValue(value, model.dataset.manifest.columns[point.metric], model.state.locale), {
                fill: model.theme.text,
                "font-family": model.theme.monoFontFamily,
                "font-size": model.theme.tickSize,
            })
        )
    })

    return nodes
}

const renderStackedAreaChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const times = getRenderableTimes(model)
    const totals = times.map((time) =>
        model.series.reduce((sum, series) => {
            const point = series.points.find((item) => item.time === time)
            return sum + Math.max(0, point?.value ?? 0)
        }, 0)
    )
    const maxY = Math.max(1, ...totals)
    const xFor = (time: TimeValue | undefined): number => {
        const index = times.findIndex((candidate) => candidate === time)
        return plot.x + (times.length <= 1 ? 0 : (index / (times.length - 1)) * plot.width)
    }
    const yFor = (value: number): number => plot.y + plot.height - (value / maxY) * plot.height
    const cumulative = new Map<string, number>()
    const nodes: SvgNode[] = [...renderAxes(model, plot, 0, maxY, times)]

    for (const series of model.series) {
        const upper: string[] = []
        const lower: string[] = []

        for (const point of series.points) {
            if (point.time === undefined) continue
            const key = String(point.time)
            const base = cumulative.get(key) ?? 0
            const value = Math.max(0, point.value ?? 0)
            const top = base + value
            cumulative.set(key, top)
            upper.push(`${upper.length === 0 ? "M" : "L"}${round(xFor(point.time))},${round(yFor(top))}`)
            lower.unshift(`L${round(xFor(point.time))},${round(yFor(base))}`)
        }

        if (upper.length) {
            nodes.push(
                node("path", {
                    d: `${upper.join("")}${lower.join("")}Z`,
                    fill: series.colour,
                    opacity: 0.82,
                    stroke: model.theme.surface,
                    "stroke-width": 1,
                })
            )
        }
    }

    return [...nodes, ...renderLegend(model, plot)]
}

const renderStackedBarChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const times = uniqueTimesFromSeries(model)
    const isDiscreteStack = model.activeType === "stacked-discrete-bar"
    const categories = isDiscreteStack ? [selectedEntities(model)[0] ?? "Total"] : times.map(String)
    const stacks = categories.map((category, categoryIndex) => {
        const time = isDiscreteStack ? model.series[0]?.points[0]?.time : times[categoryIndex]
        const parts = model.series.map((series) => ({
            label: series.label,
            colour: series.colour,
            value: isDiscreteStack
                ? series.points[0]?.value ?? 0
                : series.points.find((point) => point.time === time)?.value ?? 0,
        }))
        return { category, parts }
    })
    const maxTotal = Math.max(1, ...stacks.map((stack) => stack.parts.reduce((sum, part) => sum + Math.max(0, part.value), 0)))
    const gap = 14
    const barWidth = Math.max(16, (plot.width - gap * (stacks.length - 1)) / Math.max(1, stacks.length))
    const nodes: SvgNode[] = [...renderValueAxis(model, plot, 0, maxTotal)]

    stacks.forEach((stack, index) => {
        const x = plot.x + index * (barWidth + gap)
        let top = plot.y + plot.height
        for (const part of stack.parts) {
            const height = (Math.max(0, part.value) / maxTotal) * plot.height
            top -= height
            nodes.push(node("rect", { x, y: top, width: barWidth, height, fill: part.colour }))
        }
        nodes.push(
            textNode(x + barWidth / 2, plot.y + plot.height + 22, stack.category, {
                fill: model.theme.mutedText,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.tickSize,
                "text-anchor": "middle",
            })
        )
    })

    return [...nodes, ...renderLegend(model, plot)]
}

const renderSlopeChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const endpoints = model.series
        .map((series) => ({
            series,
            first: series.points[0],
            last: series.points[series.points.length - 1],
        }))
        .filter((item) => item.first?.value !== null && item.last?.value !== null)
    const values = endpoints.flatMap((item) => [item.first.value!, item.last.value!])
    const [minY, maxY] = extentOrDefault(values)
    const yFor = (value: number): number => scaleY(value, minY, maxY, plot)
    const leftX = plot.x + 32
    const rightX = plot.x + plot.width - 32
    const nodes: SvgNode[] = [...renderValueAxis(model, plot, minY, maxY)]

    for (const { series, first, last } of endpoints) {
        nodes.push(
            node("line", {
                x1: leftX,
                y1: yFor(first.value!),
                x2: rightX,
                y2: yFor(last.value!),
                stroke: series.colour,
                "stroke-width": 2,
            }),
            node("circle", { cx: leftX, cy: yFor(first.value!), r: 4, fill: series.colour }),
            node("circle", { cx: rightX, cy: yFor(last.value!), r: 4, fill: series.colour }),
            textNode(leftX - 8, yFor(first.value!) + 4, `${series.label} ${formatValue(first.value, model.dataset.manifest.columns[first.metric], model.state.locale)}`, {
                fill: model.theme.text,
                "font-family": model.theme.monoFontFamily,
                "font-size": model.theme.tickSize,
                "text-anchor": "end",
            }),
            textNode(rightX + 8, yFor(last.value!) + 4, formatValue(last.value, model.dataset.manifest.columns[last.metric], model.state.locale), {
                fill: series.colour,
                "font-family": model.theme.monoFontFamily,
                "font-size": model.theme.tickSize,
            })
        )
    }

    const times = uniqueTimesFromSeries(model)
    if (times.length >= 2) {
        nodes.push(
            textNode(leftX, plot.y + plot.height + 24, formatTime(times[0], model.dataset.manifest.timeGrain), axisLabelAttrs(model, "middle")),
            textNode(rightX, plot.y + plot.height + 24, formatTime(times[times.length - 1], model.dataset.manifest.timeGrain), axisLabelAttrs(model, "middle"))
        )
    }

    return nodes
}

const renderDumbbellChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const endpoints = model.series
        .map((series) => ({
            series,
            first: series.points[0],
            last: series.points[series.points.length - 1],
        }))
        .filter((item) => item.first?.value !== null && item.last?.value !== null)
    const values = endpoints.flatMap((item) => [item.first.value!, item.last.value!])
    const [minX, maxX] = extentOrDefault(values)
    const rowHeight = Math.max(22, plot.height / Math.max(1, endpoints.length))
    const nodes: SvgNode[] = [...renderValueAxis(model, plot, minX, maxX)]

    endpoints.forEach(({ series, first, last }, index) => {
        const y = plot.y + rowHeight * index + rowHeight / 2
        const x1 = scaleX(first.value!, minX, maxX, plot)
        const x2 = scaleX(last.value!, minX, maxX, plot)
        nodes.push(
            textNode(plot.x - 8, y + 4, series.label, {
                fill: model.theme.text,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.labelSize,
                "text-anchor": "end",
            }),
            node("line", {
                x1,
                y1: y,
                x2,
                y2: y,
                stroke: model.theme.axis,
                "stroke-width": 2,
            }),
            node("circle", { cx: x1, cy: y, r: 4, fill: model.theme.surface, stroke: series.colour, "stroke-width": 2 }),
            node("circle", { cx: x2, cy: y, r: 5, fill: series.colour }),
            textNode(Math.max(x1, x2) + 7, y + 4, formatValue(last.value, model.dataset.manifest.columns[last.metric], model.state.locale), {
                fill: model.theme.text,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.labelSize,
            })
        )
    })

    return nodes
}

const renderScatterChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const xMetric = model.definition.x ?? model.yColumns[0]
    const yMetric = model.yColumns[0]
    const sizeMetric = model.definition.size
    const time = currentTime(model)
    const points = selectedEntities(model).map((entity, index) => {
        const x = valueFor(model, entity, xMetric, time)
        const y = valueFor(model, entity, yMetric, time)
        const size = sizeMetric ? valueFor(model, entity, sizeMetric, time) : null
        return { entity, x, y, size, colour: model.theme.categoricalPalette[index % model.theme.categoricalPalette.length] }
    }).filter((point) => point.x !== null && point.y !== null)
    const [minX, maxX] = extentOrDefault(points.map((point) => point.x!))
    const [minY, maxY] = extentOrDefault(points.map((point) => point.y!))
    const [minSize, maxSize] = extentOrDefault(points.map((point) => point.size ?? 1))
    const nodes: SvgNode[] = [...renderValueAxis(model, plot, minY, maxY)]

    nodes.push(
        node("line", { x1: plot.x, x2: plot.x + plot.width, y1: plot.y + plot.height, y2: plot.y + plot.height, stroke: model.theme.axis }),
        textNode(plot.x + plot.width, plot.y + plot.height + 34, model.dataset.manifest.columns[xMetric]?.name ?? xMetric, axisLabelAttrs(model, "end"))
    )

    for (const point of points) {
        const r = 5 + (((point.size ?? 1) - minSize) / Math.max(1, maxSize - minSize)) * 12
        const cx = scaleX(point.x!, minX, maxX, plot)
        const cy = scaleY(point.y!, minY, maxY, plot)
        const labelFitsRight = cx + r + 72 < plot.x + plot.width
        nodes.push(
            node("circle", { cx, cy, r, fill: point.colour, opacity: 0.86, stroke: model.theme.surface, "stroke-width": 1.5 }),
            textNode(labelFitsRight ? cx + r + 4 : cx - r - 4, cy + 4, point.entity, {
                fill: model.theme.text,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.labelSize,
                "text-anchor": labelFitsRight ? "start" : "end",
            })
        )
    }

    return nodes
}

const renderMarimekkoChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const widthMetric = model.definition.x ?? model.yColumns[0]
    const heightMetric = model.yColumns[0]
    const time = currentTime(model)
    const parts = selectedEntities(model)
        .map((entity, index) => ({
            entity,
            widthValue: Math.max(0, valueFor(model, entity, widthMetric, time) ?? 0),
            heightValue: Math.max(0, valueFor(model, entity, heightMetric, time) ?? 0),
            colour: model.theme.categoricalPalette[index % model.theme.categoricalPalette.length],
        }))
        .filter((part) => part.widthValue > 0 && part.heightValue > 0)
    const totalWidth = Math.max(1, parts.reduce((sum, part) => sum + part.widthValue, 0))
    const maxHeight = Math.max(1, ...parts.map((part) => part.heightValue))
    const nodes: SvgNode[] = [...renderValueAxis(model, plot, 0, maxHeight)]
    let x = plot.x

    for (const part of parts) {
        const width = (part.widthValue / totalWidth) * plot.width
        const height = (part.heightValue / maxHeight) * plot.height
        const y = plot.y + plot.height - height
        nodes.push(
            node("rect", { x, y, width, height, fill: part.colour, opacity: 0.88, stroke: model.theme.surface }),
            textNode(x + width / 2, y + 18, part.entity, {
                fill: model.theme.text,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.tickSize,
                "text-anchor": "middle",
            })
        )
        x += width
    }

    return nodes
}

const renderMapChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const metric = model.yColumns[0]
    const time = currentTime(model)
    const entities = selectedEntities(model)
    const values = entities.map((entity) => valueFor(model, entity, metric, time))
    const [min, max] = extentOrDefault(values.flatMap((value) => value === null ? [] : [value]))
    const cols = Math.ceil(Math.sqrt(entities.length))
    const rows = Math.ceil(entities.length / cols)
    const gap = 8
    const cellWidth = (plot.width - gap * (cols - 1)) / cols
    const cellHeight = (plot.height - gap * (rows - 1)) / rows
    const nodes: SvgNode[] = []

    entities.forEach((entity, index) => {
        const value = values[index]
        const col = index % cols
        const row = Math.floor(index / cols)
        const x = plot.x + col * (cellWidth + gap)
        const y = plot.y + row * (cellHeight + gap)
        nodes.push(
            node("rect", {
                x,
                y,
                width: cellWidth,
                height: cellHeight,
                rx: 2,
                fill: value === null ? model.theme.noData : rampColour(model, value, min, max),
                stroke: model.theme.surface,
                "stroke-width": 1.5,
            }),
            textNode(x + 8, y + 18, entity, {
                fill: model.theme.text,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.labelSize,
            }),
            textNode(x + 8, y + cellHeight - 10, formatValue(value, model.dataset.manifest.columns[metric], model.state.locale), {
                fill: model.theme.text,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.tickSize,
            })
        )
    })

    return [...nodes, ...renderContinuousLegend(model, plot, min, max)]
}

const renderWaterfallChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const steps = categoryValues(model)
    const cumulativeValues: number[] = [0]
    for (const step of steps) cumulativeValues.push(cumulativeValues[cumulativeValues.length - 1] + step.value)
    const [minY, maxY] = extentOrDefault(cumulativeValues)
    const baseline = scaleY(0, minY, maxY, plot)
    const gap = 10
    const barWidth = Math.max(18, (plot.width - gap * steps.length) / Math.max(1, steps.length + 1))
    const nodes: SvgNode[] = [...renderValueAxis(model, plot, minY, maxY)]
    let running = 0

    steps.forEach((step, index) => {
        const next = running + step.value
        const x = plot.x + index * (barWidth + gap)
        const y1 = scaleY(running, minY, maxY, plot)
        const y2 = scaleY(next, minY, maxY, plot)
        nodes.push(
            node("rect", {
                x,
                y: Math.min(y1, y2),
                width: barWidth,
                height: Math.max(2, Math.abs(y2 - y1)),
                fill: step.value >= 0 ? model.theme.categoricalPalette[5] : model.theme.categoricalPalette[10],
            }),
            node("line", { x1: x, x2: x + barWidth, y1: baseline, y2: baseline, stroke: model.theme.axis }),
            textNode(x + barWidth / 2, plot.y + plot.height + 22, step.label, axisLabelAttrs(model, "middle"))
        )
        running = next
    })

    const totalX = plot.x + steps.length * (barWidth + gap)
    const totalY = scaleY(running, minY, maxY, plot)
    nodes.push(
        node("rect", {
            x: totalX,
            y: Math.min(totalY, baseline),
            width: barWidth,
            height: Math.max(2, Math.abs(baseline - totalY)),
            fill: model.theme.text,
        }),
        textNode(totalX + barWidth / 2, plot.y + plot.height + 22, "Total", axisLabelAttrs(model, "middle"))
    )

    return nodes
}

const renderTreemapChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const parts = categoryValues(model).filter((part) => part.value > 0)
    const total = Math.max(1, parts.reduce((sum, part) => sum + part.value, 0))
    const nodes: SvgNode[] = []
    let cursor = plot.x

    parts.forEach((part, index) => {
        const width = (part.value / total) * plot.width
        nodes.push(
            node("rect", {
                x: cursor,
                y: plot.y,
                width,
                height: plot.height,
                fill: model.theme.categoricalPalette[index % model.theme.categoricalPalette.length],
                stroke: model.theme.surface,
                "stroke-width": 2,
            }),
            textNode(cursor + 8, plot.y + 20, part.label, {
                fill: model.theme.text,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.labelSize,
            }),
            textNode(cursor + 8, plot.y + 38, formatValue(part.value, model.dataset.manifest.columns[part.metric], model.state.locale), {
                fill: model.theme.text,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.tickSize,
            })
        )
        cursor += width
    })

    return nodes
}

const renderSankeyChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const targetColumn = model.definition.sankey?.targetColumn ?? "target"
    const metric = model.yColumns[0]
    const time = currentTime(model)
    const rows = model.dataset.rows.filter((row) => {
        if (model.dataset.manifest.timeGrain !== "none" && row.time !== time) return false
        return selectedEntities(model).includes(row.entity) && typeof row[targetColumn] === "string"
    })
    const flows = rows.map((row, index) => ({
        source: row.entity,
        target: String(row[targetColumn]),
        value: Math.max(0, Number(row[metric] ?? 0)),
        colour: model.theme.categoricalPalette[index % model.theme.categoricalPalette.length],
    })).filter((flow) => flow.value > 0)
    const sources = [...new Set(flows.map((flow) => flow.source))]
    const targets = [...new Set(flows.map((flow) => flow.target))]
    const maxFlow = Math.max(1, ...flows.map((flow) => flow.value))
    const sourceY = bandPositions(sources, plot.y, plot.height)
    const targetY = bandPositions(targets, plot.y, plot.height)
    const nodes: SvgNode[] = []

    for (const flow of flows) {
        const y1 = sourceY.get(flow.source) ?? plot.y
        const y2 = targetY.get(flow.target) ?? plot.y
        const strokeWidth = 4 + (flow.value / maxFlow) * 18
        nodes.push(
            node("path", {
                d: `M${plot.x + 120},${y1}C${plot.x + plot.width * 0.45},${y1} ${plot.x + plot.width * 0.55},${y2} ${plot.x + plot.width - 120},${y2}`,
                fill: "none",
                stroke: flow.colour,
                "stroke-width": strokeWidth,
                opacity: 0.58,
            })
        )
    }

    for (const source of sources) {
        const y = sourceY.get(source) ?? plot.y
        nodes.push(node("rect", { x: plot.x, y: y - 12, width: 112, height: 24, fill: model.theme.grid }), textNode(plot.x + 8, y + 4, source, tableCellAttrs(model)))
    }
    for (const target of targets) {
        const y = targetY.get(target) ?? plot.y
        nodes.push(node("rect", { x: plot.x + plot.width - 112, y: y - 12, width: 112, height: 24, fill: model.theme.grid }), textNode(plot.x + plot.width - 104, y + 4, target, tableCellAttrs(model)))
    }

    return nodes
}

const renderBulletChart = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const metric = model.yColumns[0]
    const targetMetric = model.definition.bullet?.target ?? model.definition.x
    const markerMetric = model.definition.bullet?.marker
    const time = currentTime(model)
    const rows = selectedEntities(model).map((entity) => ({
        entity,
        actual: valueFor(model, entity, metric, time) ?? 0,
        target: targetMetric ? valueFor(model, entity, targetMetric, time) ?? 0 : 0,
        marker: markerMetric ? valueFor(model, entity, markerMetric, time) : null,
    }))
    const maxValue = Math.max(1, ...rows.flatMap((row) => [row.actual, row.target, row.marker ?? 0]))
    const rowHeight = Math.max(30, plot.height / Math.max(1, rows.length))
    const nodes: SvgNode[] = []

    rows.forEach((row, index) => {
        const y = plot.y + index * rowHeight + rowHeight / 2
        nodes.push(
            textNode(plot.x - 8, y + 4, row.entity, { ...tableCellAttrs(model), "text-anchor": "end" }),
            node("rect", { x: plot.x, y: y - 11, width: plot.width, height: 22, fill: model.theme.grid }),
            node("rect", { x: plot.x, y: y - 7, width: (row.actual / maxValue) * plot.width, height: 14, fill: model.theme.categoricalPalette[index % model.theme.categoricalPalette.length] })
        )
        if (targetMetric) {
            const targetX = plot.x + (row.target / maxValue) * plot.width
            nodes.push(node("line", { x1: targetX, x2: targetX, y1: y - 14, y2: y + 14, stroke: model.theme.text, "stroke-width": 2 }))
        }
        if (row.marker !== null) {
            const markerX = plot.x + (row.marker / maxValue) * plot.width
            nodes.push(node("circle", { cx: markerX, cy: y, r: 4, fill: model.theme.surface, stroke: model.theme.text, "stroke-width": 2 }))
        }
    })

    return nodes
}

const renderTable = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    const rows = model.table.rows.slice(0, 14)
    const rowHeight = 24
    const headerY = plot.y
    const nodes: SvgNode[] = [
        textNode(plot.x, headerY, "Entity", tableHeaderAttrs(model)),
        textNode(plot.x + 230, headerY, "Time", tableHeaderAttrs(model)),
        textNode(plot.x + 360, headerY, "Metric", tableHeaderAttrs(model)),
        textNode(plot.x + plot.width, headerY, "Value", {
            ...tableHeaderAttrs(model),
            "text-anchor": "end",
        }),
        node("line", {
            x1: plot.x,
            x2: plot.x + plot.width,
            y1: headerY + 8,
            y2: headerY + 8,
            stroke: model.theme.axis,
        }),
    ]

    rows.forEach((row, index) => {
        const y = headerY + 34 + index * rowHeight
        nodes.push(textNode(plot.x, y, row.entity, tableCellAttrs(model)))
        nodes.push(
            textNode(plot.x + 230, y, formatTime(row.time, model.dataset.manifest.timeGrain), tableCellAttrs(model))
        )
        nodes.push(
            textNode(
                plot.x + 360,
                y,
                model.dataset.manifest.columns[row.metric]?.name ?? row.metric,
                tableCellAttrs(model)
            )
        )
        nodes.push(
            textNode(plot.x + plot.width, y, row.formatted, {
                ...tableCellAttrs(model),
                "text-anchor": "end",
            })
        )
    })

    if (model.table.rows.length > rows.length) {
        nodes.push(
            textNode(plot.x, headerY + 42 + rows.length * rowHeight, "More rows available in download.", {
                fill: model.theme.mutedText,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.labelSize,
            })
        )
    }

    return nodes
}

const renderAxes = (
    model: ChartModel,
    plot: PlotBox,
    minY: number,
    maxY: number,
    times: TimeValue[]
): SvgNode[] => [
    ...renderValueAxis(model, plot, minY, maxY),
    ...times.map((time, index) => {
        if (times.length > 6 && index % Math.ceil(times.length / 6) !== 0 && index !== times.length - 1) {
            return undefined
        }
        const x = plot.x + (times.length <= 1 ? 0 : (index / (times.length - 1)) * plot.width)
        return textNode(x, plot.y + plot.height + 22, formatTime(time, model.dataset.manifest.timeGrain), {
            fill: model.theme.mutedText,
            "font-family": model.theme.fontFamily,
            "font-size": model.theme.tickSize,
            "text-anchor": "middle",
        })
    }).filter((item): item is SvgNode => Boolean(item)),
]

const renderValueAxis = (
    model: ChartModel,
    plot: PlotBox,
    minY: number,
    maxY: number
): SvgNode[] => {
    const tickCount = 5
    const nodes: SvgNode[] = []
    for (let index = 0; index < tickCount; index += 1) {
        const value = minY + ((maxY - minY) / (tickCount - 1)) * index
        const y = scaleY(value, minY, maxY, plot)
        nodes.push(
            node("line", {
                x1: plot.x,
                x2: plot.x + plot.width,
                y1: y,
                y2: y,
                stroke: model.theme.grid,
                "stroke-width": 1,
            })
        )
        nodes.push(
            textNode(plot.x - 8, y + 4, formatValue(value, model.dataset.manifest.columns[model.yColumns[0]], model.state.locale), {
                fill: model.theme.mutedText,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.tickSize,
                "text-anchor": "end",
            })
        )
    }
    nodes.push(
        node("line", {
            x1: plot.x,
            x2: plot.x,
            y1: plot.y,
            y2: plot.y + plot.height,
            stroke: model.theme.axis,
        })
    )
    return nodes
}

const getRenderableTimes = (model: ChartModel): TimeValue[] => {
    const times = getAvailableTimes(model.dataset.manifest, model.dataset.rows)
    return times.filter((time) => model.series.some((series) => series.points.some((point) => point.time === time)))
}

const uniqueTimesFromSeries = (model: ChartModel): TimeValue[] => {
    const seen = new Map<string, TimeValue>()
    for (const series of model.series) {
        for (const point of series.points) {
            if (point.time !== undefined) seen.set(String(point.time), point.time)
        }
    }
    return [...seen.values()]
}

const selectedEntities = (model: ChartModel): string[] =>
    model.state.selectedEntities.length ? model.state.selectedEntities : getEntities(model.dataset)

const currentTime = (model: ChartModel): TimeValue | undefined => {
    const firstSeriesTime = model.series[0]?.points[model.series[0].points.length - 1]?.time
    if (firstSeriesTime !== undefined) return firstSeriesTime
    const times = getAvailableTimes(model.dataset.manifest, model.dataset.rows)
    return times[times.length - 1]
}

const valueFor = (
    model: ChartModel,
    entity: string,
    metric: string,
    time?: TimeValue
): number | null => resolveNumericValue(model.dataset, entity, metric, time).value

const extentOrDefault = (values: number[]): [number, number] => {
    const finite = values.filter((value) => Number.isFinite(value))
    if (!finite.length) return [0, 1]
    const min = Math.min(...finite)
    const max = Math.max(...finite)
    if (min === max) return [Math.min(0, min), max + 1]
    return [Math.min(0, min), max]
}

const categoryValues = (
    model: ChartModel
): Array<{ label: string; value: number; metric: string; colour: string }> => {
    return model.series.map((series, index) => {
        const point = series.points[series.points.length - 1]
        return {
            label: series.label,
            value: point?.value ?? 0,
            metric: point?.metric ?? model.yColumns[0],
            colour: series.colour ?? model.theme.categoricalPalette[index % model.theme.categoricalPalette.length],
        }
    })
}

const renderLegend = (model: ChartModel, plot: PlotBox): SvgNode[] => {
    if (model.definition.hideLegend) return []
    return model.series.slice(0, 8).map((series, index) => {
        const x = plot.x + index * 120
        const y = plot.y + plot.height + 46
        return node("g", {}, [
            node("rect", { x, y: y - 10, width: 10, height: 10, fill: series.colour }),
            textNode(x + 14, y, series.label, {
                fill: model.theme.mutedText,
                "font-family": model.theme.fontFamily,
                "font-size": model.theme.tickSize,
            }),
        ])
    })
}

const renderContinuousLegend = (
    model: ChartModel,
    plot: PlotBox,
    min: number,
    max: number
): SvgNode[] => {
    const width = 180
    const height = 10
    const x = plot.x + plot.width - width
    const y = plot.y + plot.height + 38
    const segments = 6
    const nodes: SvgNode[] = []
    for (let index = 0; index < segments; index += 1) {
        nodes.push(
            node("rect", {
                x: x + (width / segments) * index,
                y,
                width: width / segments,
                height,
                fill: rampColour(model, min + ((max - min) * index) / Math.max(1, segments - 1), min, max),
            })
        )
    }
    nodes.push(
        textNode(x, y + 24, formatValue(min, model.dataset.manifest.columns[model.yColumns[0]], model.state.locale), axisLabelAttrs(model, "start")),
        textNode(x + width, y + 24, formatValue(max, model.dataset.manifest.columns[model.yColumns[0]], model.state.locale), axisLabelAttrs(model, "end"))
    )
    return nodes
}

const rampColour = (
    model: ChartModel,
    value: number | null,
    min: number,
    max: number
): string => {
    if (value === null) return model.theme.noData
    const palette = model.theme.categoricalPalette
    const index = Math.max(
        0,
        Math.min(
            palette.length - 1,
            Math.round(((value - min) / Math.max(1, max - min)) * (palette.length - 1))
        )
    )
    return palette[index]
}

const bandPositions = (
    labels: string[],
    start: number,
    height: number
): Map<string, number> => {
    const rowHeight = height / Math.max(1, labels.length)
    return new Map(labels.map((label, index) => [label, start + index * rowHeight + rowHeight / 2]))
}

const axisLabelAttrs = (model: ChartModel, anchor: "start" | "middle" | "end") => ({
    fill: model.theme.mutedText,
    "font-family": model.theme.fontFamily,
    "font-size": model.theme.tickSize,
    "text-anchor": anchor,
})

const scaleY = (value: number, min: number, max: number, plot: PlotBox): number =>
    plot.y + plot.height - ((value - min) / (max - min)) * plot.height

const scaleX = (value: number, min: number, max: number, plot: PlotBox): number =>
    plot.x + ((value - min) / (max - min)) * plot.width

const tableHeaderAttrs = (model: ChartModel) => ({
    fill: model.theme.text,
    "font-family": model.theme.monoFontFamily,
    "font-size": model.theme.labelSize,
    "font-weight": 700,
})

const tableCellAttrs = (model: ChartModel) => ({
    fill: model.theme.text,
    "font-family": model.theme.monoFontFamily,
    "font-size": model.theme.labelSize,
})

const wrapText = (text: string, maxChars: number): string[] => {
    const words = text.split(/\s+/)
    const lines: string[] = []
    let line = ""
    for (const word of words) {
        const next = line ? `${line} ${word}` : word
        if (next.length > maxChars && line) {
            lines.push(line)
            line = word
        } else {
            line = next
        }
    }
    if (line) lines.push(line)
    return lines
}

const round = (value: number): number => Math.round(value * 1000) / 1000
