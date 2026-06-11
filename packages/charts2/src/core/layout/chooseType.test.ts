import { describe, expect, it } from "vitest"

import { activeChartType } from "./chooseType.ts"

describe("activeChartType", () => {
    it("uses the first type for an expanded window", () => {
        expect(activeChartType(["line", "discrete-bar"], undefined, false)).toBe("line")
    })

    it("flips line to discrete-bar exactly when the window collapses", () => {
        expect(activeChartType(["line", "discrete-bar"], undefined, true)).toBe("discrete-bar")
    })

    it("flips back to line when the window expands again", () => {
        expect(activeChartType(["line", "discrete-bar"], { tab: "discrete-bar" }, false)).toBe("line")
    })

    it("keeps a lone line type even when collapsed", () => {
        expect(activeChartType(["line"], undefined, true)).toBe("line")
    })

    it("pairs stacked-area with stacked-discrete-bar", () => {
        expect(activeChartType(["stacked-area", "stacked-discrete-bar"], undefined, true)).toBe("stacked-discrete-bar")
        expect(activeChartType(["stacked-area", "stacked-discrete-bar"], { tab: "stacked-discrete-bar" }, false)).toBe(
            "stacked-area",
        )
    })

    it("honours the reader's tab when it needs no collapse", () => {
        expect(activeChartType(["line", "stacked-area"], { tab: "stacked-area" }, false)).toBe("stacked-area")
    })

    it("honours defaultTab when no tab is in the view", () => {
        expect(activeChartType(["line", "stacked-area"], undefined, false, "stacked-area")).toBe("stacked-area")
    })
})
