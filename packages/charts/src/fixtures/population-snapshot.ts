/**
 * Fixture: population-snapshot (spec 26 §2).
 * Exercises: no time dimension (timeGrain "none", no time column).
 * 13 provinces and territories, population + median_age.
 */

import type { Fixture } from "./types.ts"

const csv = `entity,population,median_age
Ontario,15608000,40.1
Quebec,8874000,42.4
British Columbia,5519000,42.0
Alberta,4696000,38.1
Manitoba,1454000,38.5
Saskatchewan,1209000,38.6
Nova Scotia,1058000,43.6
New Brunswick,832000,44.6
Newfoundland and Labrador,533000,46.4
Prince Edward Island,173000,42.4
Northwest Territories,45000,35.7
Yukon,44000,39.6
Nunavut,40000,26.6
`

const manifest = {
    name: "population-snapshot",
    title: "Population snapshot",
    timeGrain: "none",
    entity: {
        label: "province or territory",
        labelPlural: "provinces and territories",
        kind: "province",
    },
    columns: {
        population: {
            name: "Population",
            type: "integer",
            unit: "people",
            decimals: 0,
        },
        median_age: {
            name: "Median age",
            type: "numeric",
            unit: "years",
            decimals: 1,
        },
    },
    sources: [
        {
            name: "Quarterly population estimates",
            publisher: "Statistics Canada",
            retrieved: "2026-05-01",
        },
    ],
}

export const populationSnapshot: Fixture = {
    name: "population-snapshot",
    csv,
    manifest,
}
