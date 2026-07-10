import { getTimesForDataset } from "../data"
import { decodeViewState } from "../state"
import type { ChartDataset, ChartDefinition, ChartViewState, RenderSize, TimeValue } from "../types"

export interface FramePlanOptions {
    state?: Partial<ChartViewState> | string
    fps?: number
    seconds?: number
    size?: Partial<RenderSize>
}

export interface FrameState {
    index: number
    time?: TimeValue
    state: Partial<ChartViewState>
}

export interface FramePlan {
    fps: number
    totalFrames: number
    frames: FrameState[]
}

export const createTimelineFramePlan = (
    definition: ChartDefinition,
    dataset: ChartDataset,
    options: FramePlanOptions = {}
): FramePlan => {
    const fps = options.fps ?? 30
    const times = getTimesForDataset(dataset)
    const state = typeof options.state === "string" ? decodeViewState(options.state) : options.state ?? {}

    if (dataset.manifest.timeGrain === "none" || times.length === 0) {
        return {
            fps,
            totalFrames: 1,
            frames: [{ index: 0, state }],
        }
    }

    const seconds = options.seconds ?? Math.max(2, times.length)
    const totalFrames = Math.max(times.length, Math.round(fps * seconds))
    const frames = Array.from({ length: totalFrames }, (_, index) => {
        const timeIndex = Math.min(
            times.length - 1,
            Math.floor((index / Math.max(1, totalFrames - 1)) * times.length)
        )
        const time = times[timeIndex]
        return {
            index,
            time,
            state: {
                ...state,
                tab: state.tab ?? definition.types?.[0] ?? "line",
                time,
            },
        }
    })

    frames[frames.length - 1] = {
        ...frames[frames.length - 1],
        time: times[times.length - 1],
        state: {
            ...frames[frames.length - 1].state,
            time: times[times.length - 1],
        },
    }

    return { fps, totalFrames, frames }
}
