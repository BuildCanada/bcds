import { expect, it } from "vitest"

import { VariableDisplayConfig } from "./Variable.js"

it("can create and save display settings", () => {
    const settings = new VariableDisplayConfig()
    expect(settings.toObject()).toEqual({})

    settings.shortUnit = "kwh"
    expect(settings.toObject()).toEqual({ shortUnit: "kwh" })
})
