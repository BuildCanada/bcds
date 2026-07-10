/**
 * Fixture: government-debt (spec 26 §2, scenario 27 A).
 * Exercises: shared-denominator ratios (debt ÷ GDP), stacked derived values,
 * single-entity metric series.
 *
 * All debt columns divide by gdp with displayFactor 100 ("% of GDP").
 * Hand-computable expected display values (clean numbers):
 *
 *   fiscal year | federal | provincial | municipal
 *   2019-20     |   50    |     30     |    5
 *   2020-21     |   60    |     35     |    5
 *   2021-22     |   51    |     30     |    5
 *   2022-23     |   50    |     30     |    5
 *   2023-24     |   48    |     30     |    5
 *
 * e.g. federal 2019-20: 1100 / 2200 × 100 = 50.
 */

import type { Fixture } from "./types.ts"

const csv = `entity,time,federal_debt,provincial_debt,municipal_debt,gdp
Canada,2019-20,1100,660,110,2200
Canada,2020-21,1200,700,100,2000
Canada,2021-22,1224,720,120,2400
Canada,2022-23,1250,750,125,2500
Canada,2023-24,1248,780,130,2600
`

const manifest = {
    name: "government-debt",
    title: "Government debt as a share of GDP",
    timeGrain: "fiscal-year",
    entity: {
        label: "country",
        labelPlural: "countries",
    },
    columns: {
        federal_debt: {
            name: "Federal debt",
            type: "currency",
            unit: "billion CAD",
            shortUnit: "$",
            denominator: "gdp",
            derivedUnit: "% of GDP",
            derivedShortUnit: "%",
            displayFactor: 100,
            decimals: 1,
        },
        provincial_debt: {
            name: "Provincial debt",
            type: "currency",
            unit: "billion CAD",
            shortUnit: "$",
            denominator: "gdp",
            derivedUnit: "% of GDP",
            derivedShortUnit: "%",
            displayFactor: 100,
            decimals: 1,
        },
        municipal_debt: {
            name: "Municipal debt",
            type: "currency",
            unit: "billion CAD",
            shortUnit: "$",
            denominator: "gdp",
            derivedUnit: "% of GDP",
            derivedShortUnit: "%",
            displayFactor: 100,
            decimals: 1,
        },
        gdp: {
            name: "GDP",
            type: "currency",
            unit: "CAD",
            suffix: "B",
            decimals: 0,
        },
    },
    sources: [
        {
            name: "Fiscal reference tables",
            publisher: "Department of Finance Canada",
            retrieved: "2026-05-01",
        },
    ],
}

export const governmentDebt: Fixture = {
    name: "government-debt",
    csv,
    manifest,
}
