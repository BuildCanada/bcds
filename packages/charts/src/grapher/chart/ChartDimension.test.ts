import { expect, it } from "vitest"

// todo: remove this when we remove chartDimension

import { ChartDimension } from "./ChartDimension"
import { BlankChartsTable } from "../../core-table/index"
import { DimensionProperty } from "../../utils/index"

it("can serialize for saving", () => {
    expect(
        new ChartDimension(
            { property: DimensionProperty.x, variableId: 1 },
            { table: BlankChartsTable() }
        ).toObject()
    ).toEqual({ property: "x", variableId: 1 })
})
