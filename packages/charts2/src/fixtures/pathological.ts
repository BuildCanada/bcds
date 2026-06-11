/**
 * Fixture: pathological (spec 26 §2).
 * Exercises, by data-row number:
 *   rows 2+3  duplicate (Québec, 2021) — validate error
 *   row 4     gap: Québec has no 2022 row
 *   row 4     zero denominator: population 0 (spending ÷ population missing)
 *   row 6     non-numeric cell: spending "n/a" — validate error
 *   all rows  "negatives" column is all-negative
 *   all rows  "huge" column has huge magnitudes (~9e14)
 *   row 8     single-time entity ("Lonely Station" only at 2021)
 *   names     French/unicode entities: "Québec", "Î.-P.-É."
 */

import type { Fixture } from "./types.ts"

const csv = `entity,time,spending,population,negatives,huge
Québec,2020,100,50,-5,910000000000000
Québec,2021,110,55,-6,920000000000000
Québec,2021,111,55,-6,920000000000000
Québec,2023,130,0,-7,940000000000000
Î.-P.-É.,2020,10,5,-1,900000000000000
Î.-P.-É.,2021,n/a,5,-1,905000000000000
Î.-P.-É.,2022,12,6,-2,910000000000000
Lonely Station,2021,7,3,-9,900000000000000
`

const manifest = {
    name: "pathological",
    title: "Pathological dataset",
    timeGrain: "year",
    entity: {
        label: "place",
        labelPlural: "places",
    },
    columns: {
        spending: {
            name: "Spending",
            type: "numeric",
            unit: "million CAD",
            shortUnit: "$",
            denominator: "population",
            derivedUnit: "per person",
        },
        population: {
            name: "Population",
            type: "integer",
            unit: "thousand people",
        },
        negatives: {
            name: "Net balance",
            type: "numeric",
            unit: "million CAD",
        },
        huge: {
            name: "Huge magnitude",
            type: "numeric",
            unit: "units",
        },
    },
    sources: [
        {
            name: "Synthetic test data",
        },
    ],
}

export const pathological: Fixture = {
    name: "pathological",
    csv,
    manifest,
}
