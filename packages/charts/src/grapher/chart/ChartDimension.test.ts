import { expect, it } from "vitest"

// todo: remove this when we remove chartDimension

import { ChartDimension } from "./ChartDimension.js"
import { BlankChartsTable } from "../../core-table/index.js"
import { DimensionProperty } from "../../utils/index.js"

it("can serialize for saving", () => {
    expect(
        new ChartDimension(
            { property: DimensionProperty.x, variableId: 1 },
            { table: BlankChartsTable() }
        ).toObject()
    ).toEqual({ property: "x", variableId: 1 })
})
