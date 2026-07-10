import { describe, expect, it } from "vitest"
import { createChartModel, createDataset, tableToCsv } from ".."

describe("table downloads", () => {
    it("serializes displayed table values to CSV", () => {
        const dataset = createDataset({
            manifest: {
                name: "csv-fixture",
                timeGrain: "none",
                columns: {
                    value: { name: "Value", type: "numeric", decimals: 1 },
                },
            },
            rows: [
                { entity: "A", value: 1.25 },
                { entity: "B", value: null },
            ],
        })
        const model = createChartModel({
            title: "CSV fixture",
            y: "value",
            types: ["table"],
            selectedEntities: ["A", "B"],
        }, dataset)
        const csv = tableToCsv(model.table)

        expect(csv).toContain("entity,time,metric,value,formatted")
        expect(csv).toContain("A,,value,1.25,1.3")
        expect(csv).toContain("B,,value,,No data")
    })
})
