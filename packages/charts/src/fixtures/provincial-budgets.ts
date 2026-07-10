/**
 * Fixture: provincial-budgets (spec 26 §2).
 * Exercises: fiscal years, multi-metric, missing cells, tolerance borrowing.
 * 5 provinces × 6 fiscal years (2019-20 .. 2024-25), values in billion CAD.
 *
 * Missing cells (data-row numbers):
 *   row 12  Quebec 2024-25            program_spending + debt_charges empty
 *   row 18  British Columbia 2024-25  debt_charges empty
 *   row 28  Nova Scotia 2022-23       program_spending empty
 * debt_charges has tolerance 2, so Quebec/BC 2024-25 borrow from 2023-24.
 */

import type { Fixture } from "./types.ts"

const csv = `entity,time,total_spending,program_spending,debt_charges
Ontario,2019-20,165.1,152.3,12.8
Ontario,2020-21,181.3,168.4,12.9
Ontario,2021-22,186.4,173.6,12.8
Ontario,2022-23,192.9,180.4,12.5
Ontario,2023-24,204.3,191.0,13.3
Ontario,2024-25,214.5,200.1,14.4
Quebec,2019-20,118.6,110.4,8.2
Quebec,2020-21,135.2,127.5,7.7
Quebec,2021-22,140.5,132.6,7.9
Quebec,2022-23,147.3,138.9,8.4
Quebec,2023-24,156.1,146.8,9.3
Quebec,2024-25,161.0,,
British Columbia,2019-20,58.5,55.8,2.7
British Columbia,2020-21,64.8,62.1,2.7
British Columbia,2021-22,68.2,65.4,2.8
British Columbia,2022-23,73.6,70.5,3.1
British Columbia,2023-24,79.5,76.1,3.4
British Columbia,2024-25,84.2,80.5,
Alberta,2019-20,58.7,56.5,2.2
Alberta,2020-21,60.1,57.7,2.4
Alberta,2021-22,61.9,59.2,2.7
Alberta,2022-23,64.3,61.6,2.7
Alberta,2023-24,68.3,65.2,3.1
Alberta,2024-25,71.2,68.0,3.2
Nova Scotia,2019-20,11.3,10.4,0.9
Nova Scotia,2020-21,12.2,11.4,0.8
Nova Scotia,2021-22,13.1,12.4,0.7
Nova Scotia,2022-23,14.0,,0.7
Nova Scotia,2023-24,15.4,14.7,0.7
Nova Scotia,2024-25,16.5,15.8,0.7
`

const manifest = {
    name: "provincial-budgets",
    title: "Provincial budget expenditures",
    timeGrain: "fiscal-year",
    entity: {
        label: "province",
        labelPlural: "provinces",
        kind: "province",
    },
    columns: {
        total_spending: {
            name: "Total spending",
            type: "currency",
            unit: "CAD",
            suffix: "B",
            decimals: 1,
            description: "Total budgetary expenditure, public accounts basis",
        },
        program_spending: {
            name: "Program spending",
            type: "currency",
            unit: "CAD",
            suffix: "B",
            decimals: 1,
        },
        debt_charges: {
            name: "Debt charges",
            type: "currency",
            unit: "CAD",
            suffix: "B",
            decimals: 1,
            tolerance: 2,
        },
    },
    sources: [
        {
            name: "Provincial public accounts",
            publisher: "Provincial treasury boards",
            retrieved: "2026-05-01",
        },
    ],
}

export const provincialBudgets: Fixture = {
    name: "provincial-budgets",
    csv,
    manifest,
}
