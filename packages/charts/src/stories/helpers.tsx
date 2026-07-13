/**
 * Shared story plumbing: fixture → Dataset, literal → ChartDefinition, and
 * the standard tooltip wiring (the chrome Tooltip plugged into Chart's
 * render prop). Stories are excluded from the published build; this helper
 * keeps each story file down to definitions and render calls.
 */

import { parseDefinition } from "../core/index.ts"
import type { ChartDefinition, Dataset } from "../core/types.ts"
import { loadFixtureDataset, type FixtureName } from "../fixtures/index.ts"
import { Tooltip } from "../react/index.ts"
import type { RenderTooltipArgs } from "../react/index.ts"

/** Story definitions are literals — a parse failure is a story bug. */
export function storyDefinition(raw: unknown): ChartDefinition {
    const { definition, diagnostics } = parseDefinition(raw)
    if (definition === null) {
        throw new Error(`Story definition failed to parse: ${diagnostics.map((d) => d.message).join("; ")}`)
    }
    return definition
}

export function storyDataset(name: FixtureName): Dataset {
    return loadFixtureDataset(name).dataset
}

/** Chart renderTooltip prop: the chrome Tooltip card beside the cursor. */
export function renderStoryTooltip({ tooltip }: RenderTooltipArgs) {
    return <Tooltip model={tooltip} x={0} y={0} bounds={{ width: 360, height: 280 }} />
}
