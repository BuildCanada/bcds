import * as React from "react"
import { Bounds } from "../../utils/index.ts"
import { GRAPHER_SIDE_PANEL_CLASS } from "../core/GrapherConstants.ts"

export const SidePanel = ({
    bounds,
    children,
}: {
    bounds: Bounds
    children: React.ReactNode
}) => {
    return (
        <div
            className={GRAPHER_SIDE_PANEL_CLASS}
            style={{
                width: bounds.width,
                height: bounds.height,
            }}
        >
            {children}
        </div>
    )
}
