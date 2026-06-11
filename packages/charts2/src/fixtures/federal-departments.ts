/**
 * Fixture: federal-departments (spec 26 §2).
 * Exercises: many entities (15), long names (incl. quoted CSV fields with
 * commas), alias resolution, group metadata by portfolio.
 *
 * Two departments carry aliases and appear in the CSV under their former
 * names for early years:
 *   "Industry Canada" (2019-20, 2020-21) → Innovation, Science and Economic Development Canada
 *   "DFAIT" (2019-20)                    → Global Affairs Canada
 *
 * 15 departments × 5 fiscal years (2019-20 .. 2023-24), spending in billion CAD.
 * Values follow a hand-checkable pattern: department i (1-based, manifest
 * order) spends i*10 + yearIndex (yearIndex 0 for 2019-20 .. 4 for 2023-24).
 */

import type { Fixture } from "./types.ts"

const csv = `entity,time,spending
National Defence,2019-20,10
National Defence,2020-21,11
National Defence,2021-22,12
National Defence,2022-23,13
National Defence,2023-24,14
Employment and Social Development Canada,2019-20,20
Employment and Social Development Canada,2020-21,21
Employment and Social Development Canada,2021-22,22
Employment and Social Development Canada,2022-23,23
Employment and Social Development Canada,2023-24,24
Indigenous Services Canada,2019-20,30
Indigenous Services Canada,2020-21,31
Indigenous Services Canada,2021-22,32
Indigenous Services Canada,2022-23,33
Indigenous Services Canada,2023-24,34
Health Canada,2019-20,40
Health Canada,2020-21,41
Health Canada,2021-22,42
Health Canada,2022-23,43
Health Canada,2023-24,44
Industry Canada,2019-20,50
Industry Canada,2020-21,51
"Innovation, Science and Economic Development Canada",2021-22,52
"Innovation, Science and Economic Development Canada",2022-23,53
"Innovation, Science and Economic Development Canada",2023-24,54
DFAIT,2019-20,60
Global Affairs Canada,2020-21,61
Global Affairs Canada,2021-22,62
Global Affairs Canada,2022-23,63
Global Affairs Canada,2023-24,64
Public Safety Canada,2019-20,70
Public Safety Canada,2020-21,71
Public Safety Canada,2021-22,72
Public Safety Canada,2022-23,73
Public Safety Canada,2023-24,74
Transport Canada,2019-20,80
Transport Canada,2020-21,81
Transport Canada,2021-22,82
Transport Canada,2022-23,83
Transport Canada,2023-24,84
Environment and Climate Change Canada,2019-20,90
Environment and Climate Change Canada,2020-21,91
Environment and Climate Change Canada,2021-22,92
Environment and Climate Change Canada,2022-23,93
Environment and Climate Change Canada,2023-24,94
Agriculture and Agri-Food Canada,2019-20,100
Agriculture and Agri-Food Canada,2020-21,101
Agriculture and Agri-Food Canada,2021-22,102
Agriculture and Agri-Food Canada,2022-23,103
Agriculture and Agri-Food Canada,2023-24,104
Canada Revenue Agency,2019-20,110
Canada Revenue Agency,2020-21,111
Canada Revenue Agency,2021-22,112
Canada Revenue Agency,2022-23,113
Canada Revenue Agency,2023-24,114
Fisheries and Oceans Canada,2019-20,120
Fisheries and Oceans Canada,2020-21,121
Fisheries and Oceans Canada,2021-22,122
Fisheries and Oceans Canada,2022-23,123
Fisheries and Oceans Canada,2023-24,124
Veterans Affairs Canada,2019-20,130
Veterans Affairs Canada,2020-21,131
Veterans Affairs Canada,2021-22,132
Veterans Affairs Canada,2022-23,133
Veterans Affairs Canada,2023-24,134
Natural Resources Canada,2019-20,140
Natural Resources Canada,2020-21,141
Natural Resources Canada,2021-22,142
Natural Resources Canada,2022-23,143
Natural Resources Canada,2023-24,144
Crown-Indigenous Relations and Northern Affairs Canada,2019-20,150
Crown-Indigenous Relations and Northern Affairs Canada,2020-21,151
Crown-Indigenous Relations and Northern Affairs Canada,2021-22,152
Crown-Indigenous Relations and Northern Affairs Canada,2022-23,153
Crown-Indigenous Relations and Northern Affairs Canada,2023-24,154
`

const manifest = {
    name: "federal-departments",
    title: "Federal departmental spending",
    timeGrain: "fiscal-year",
    entity: {
        label: "department",
        labelPlural: "departments",
    },
    columns: {
        spending: {
            name: "Spending",
            type: "currency",
            unit: "billion CAD",
            shortUnit: "$",
            decimals: 1,
        },
    },
    entities: [
        { name: "National Defence", group: "Defence and Security" },
        { name: "Employment and Social Development Canada", group: "Social" },
        { name: "Indigenous Services Canada", group: "Indigenous" },
        { name: "Health Canada", group: "Social" },
        {
            name: "Innovation, Science and Economic Development Canada",
            aliases: ["Industry Canada", "ISED"],
            group: "Economic",
        },
        {
            name: "Global Affairs Canada",
            aliases: ["Foreign Affairs and International Trade", "DFAIT"],
            group: "International",
        },
        { name: "Public Safety Canada", group: "Defence and Security" },
        { name: "Transport Canada", group: "Economic" },
        { name: "Environment and Climate Change Canada", group: "Environment" },
        { name: "Agriculture and Agri-Food Canada", group: "Economic" },
        { name: "Canada Revenue Agency", group: "Economic" },
        { name: "Fisheries and Oceans Canada", group: "Environment" },
        { name: "Veterans Affairs Canada", group: "Social" },
        { name: "Natural Resources Canada", group: "Economic" },
        { name: "Crown-Indigenous Relations and Northern Affairs Canada", group: "Indigenous" },
    ],
    sources: [
        {
            name: "Public Accounts of Canada",
            publisher: "Receiver General for Canada",
            retrieved: "2026-05-01",
        },
    ],
}

export const federalDepartments: Fixture = {
    name: "federal-departments",
    csv,
    manifest,
}
