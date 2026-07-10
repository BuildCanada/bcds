// React renderer + interaction layer (M7). SceneSVG is THE single
// scene→SVG renderer (browser and renderToStaticMarkup — spec 28 §1).

export * from "./chrome/index.ts" // M9: Tooltip, Timeline, EntitySelector, Tabs, SettingsMenu, DataTable
export { Chart, type ChartProps, type RenderTooltipArgs } from "./Chart.tsx"
export {
    emphasisFor,
    emphasisReducer,
    initialEmphasisState,
    type EmphasisEvent,
    type EmphasisModel,
    type EmphasisState,
} from "./interaction/emphasisReducer.ts"
export { useUrlState, type SetViewState, type UseUrlStateOptions } from "./interaction/useUrlState.ts"
export { SceneSVG, type SceneSVGProps } from "./SceneSVG.tsx"
