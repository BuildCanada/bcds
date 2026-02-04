import { expect, it } from "vitest"

import { PointVector } from "./PointVector.ts"

it("can report the center", () => {
    const point = new PointVector(6, 8)
    expect(point.magnitude).toEqual(10)
})
