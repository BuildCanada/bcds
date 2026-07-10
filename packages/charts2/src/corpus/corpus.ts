/**
 * Golden SVG corpus (spec 26 §1.3): a deterministic list of named cases
 * covering every chart type × representative states (default, relative,
 * single-time collapse, missing data, French, thumbnail chrome) × 3 sizes
 * (300×160 thumbnail / 850×600 default / 1200×600 wide).
 *
 * Each case renders EXACTLY as the CLI does (src/cli/render.ts):
 * parseDefinition → resolveDefinitionTimes → layoutChart →
 * renderToStaticMarkup(<SceneSVG/>) with the XML declaration prepended.
 * Committed references live in __golden__/<name>.svg; re-bless with
 * `bun src/corpus/bless.ts` after intentional rendering changes.
 */

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { layoutChart, parseDefinition, resolveDefinitionTimes, type ChromeMode } from "../core/index.ts"
import type { ChartDefinition, ViewState } from "../core/types.ts"
import { loadFixtureDataset, type FixtureName } from "../fixtures/index.ts"
import { SceneSVG } from "../react/SceneSVG.tsx"

export const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'

// ---------------------------------------------------------------------------
// Sizes (spec 26 §1.3: thumbnail / default / wide)
// ---------------------------------------------------------------------------

export interface CorpusSize {
    width: number
    height: number
}

export const THUMBNAIL: CorpusSize = { width: 300, height: 160 }
export const DEFAULT: CorpusSize = { width: 850, height: 600 }
export const WIDE: CorpusSize = { width: 1200, height: 600 }

export interface CorpusCase {
    /** `<type>--<state>--<w>x<h>` — also the golden filename and idPrefix. */
    name: string
    definition: ChartDefinition
    fixture: FixtureName
    view?: ViewState
    size: CorpusSize
    /** Defaults to "thumbnail" for the 300×160 size, "full" otherwise. */
    chrome?: ChromeMode
}

// ---------------------------------------------------------------------------
// Case construction
// ---------------------------------------------------------------------------

/** Corpus definitions are committed literals — a parse error is a bug. */
function defineCorpusDefinition(raw: unknown): ChartDefinition {
    const { definition, diagnostics } = parseDefinition(raw)
    if (definition === null) {
        const messages = diagnostics.map((d) => d.message).join("; ")
        throw new Error(`Corpus definition failed to parse: ${messages}`)
    }
    return definition
}

function sizeSuffix(size: CorpusSize): string {
    return `${size.width}x${size.height}`
}

interface CaseSpec {
    type: string
    state: string
    fixture: FixtureName
    raw: Record<string, unknown>
    size: CorpusSize
    view?: ViewState
}

function makeCase(spec: CaseSpec): CorpusCase {
    return {
        name: `${spec.type}--${spec.state}--${sizeSuffix(spec.size)}`,
        definition: defineCorpusDefinition(spec.raw),
        fixture: spec.fixture,
        ...(spec.view !== undefined ? { view: spec.view } : {}),
        size: spec.size,
        chrome: spec.size === THUMBNAIL ? "thumbnail" : "full",
    }
}

// ---------------------------------------------------------------------------
// Base definitions (literals, one per chart type)
// ---------------------------------------------------------------------------

const lineBudgets = {
    title: "Provincial budget spending",
    subtitle: "Total budgetary expenditure, public accounts basis",
    data: "provincial-budgets",
    y: ["total_spending"],
    selectedEntities: ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"],
    sourceText: "Provincial public accounts",
}

const lineManyEntities = {
    title: "Federal departmental spending",
    data: "federal-departments",
    y: ["spending"],
    sourceText: "Public Accounts of Canada",
}

const discreteBarPopulation = {
    title: "Population by province and territory",
    data: "population-snapshot",
    y: ["population"],
    types: ["discrete-bar"],
    sourceText: "Statistics Canada",
}

const discreteBarNegatives = {
    title: "Net balance by place",
    data: "pathological",
    y: ["negatives"],
    types: ["discrete-bar"],
    selectedEntities: ["Québec", "Î.-P.-É.", "Lonely Station"],
    time: 2021,
}

const stackedAreaDebt = {
    title: "Government debt as a share of GDP",
    subtitle: "Federal, provincial, and municipal debt divided by nominal GDP",
    data: "government-debt",
    y: ["federal_debt", "provincial_debt", "municipal_debt"],
    types: ["stacked-area"],
    sourceText: "Fiscal reference tables",
}

const stackedBarDebt = {
    ...stackedAreaDebt,
    types: ["stacked-bar"],
}

const stackedDiscreteBudgets = {
    title: "Provincial spending composition",
    subtitle: "Program spending and debt charges by province",
    data: "provincial-budgets",
    y: ["program_spending", "debt_charges"],
    types: ["stacked-discrete-bar"],
    selectedEntities: ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"],
    sourceText: "Provincial public accounts",
}

const budgetEntities = ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"]

// Slope: one metric across the window's two endpoints (spec 12).
const slopeBudgets = {
    title: "Provincial spending, first vs latest year",
    subtitle: "Total budgetary expenditure, public accounts basis",
    data: "provincial-budgets",
    y: ["total_spending"],
    types: ["slope"],
    selectedEntities: budgetEntities,
    sourceText: "Provincial public accounts",
}

// Dumbbell: two metrics at one time, one row per entity (spec 17).
const dumbbellBudgets = {
    title: "Program spending vs debt charges",
    subtitle: "By province, 2023-24",
    data: "provincial-budgets",
    y: ["program_spending", "debt_charges"],
    types: ["dumbbell"],
    time: "2023-24",
    selectedEntities: budgetEntities,
    sourceText: "Provincial public accounts",
}

// Scatter: x vs y metric, one point per entity at a target time (spec 18).
const scatterBudgets = {
    title: "Debt charges vs program spending",
    subtitle: "By province, 2023-24",
    data: "provincial-budgets",
    x: "program_spending",
    y: ["debt_charges"],
    types: ["scatter"],
    time: "2023-24",
    selectedEntities: budgetEntities,
    sourceText: "Provincial public accounts",
}

// Marimekko: stacked metrics with column widths from an x metric (spec 19).
const marimekkoBudgets = {
    title: "Spending composition, sized by budget",
    subtitle: "Width = total spending; 2023-24",
    data: "provincial-budgets",
    y: ["program_spending", "debt_charges"],
    x: "total_spending",
    types: ["marimekko"],
    time: "2023-24",
    selectedEntities: budgetEntities,
    sourceText: "Provincial public accounts",
}

// ---------------------------------------------------------------------------
// The corpus
// ---------------------------------------------------------------------------

export const corpusCases: readonly CorpusCase[] = [
    // --- line (provincial-budgets) -----------------------------------------
    makeCase({ type: "line", state: "default", fixture: "provincial-budgets", raw: lineBudgets, size: THUMBNAIL }),
    makeCase({ type: "line", state: "default", fixture: "provincial-budgets", raw: lineBudgets, size: DEFAULT }),
    makeCase({ type: "line", state: "default", fixture: "provincial-budgets", raw: lineBudgets, size: WIDE }),
    makeCase({
        type: "line",
        state: "relative",
        fixture: "provincial-budgets",
        raw: { ...lineBudgets, stackMode: "relative" },
        size: DEFAULT,
    }),
    makeCase({
        type: "line",
        state: "fr",
        fixture: "provincial-budgets",
        raw: { ...lineBudgets, locale: "fr" },
        size: DEFAULT,
    }),
    // Single-time window collapses the line chart to a discrete bar (spec 11).
    makeCase({
        type: "line",
        state: "single-time",
        fixture: "provincial-budgets",
        raw: { ...lineBudgets, time: "2024-25" },
        size: DEFAULT,
    }),
    // program_spending has missing cells without tolerance → visible gaps.
    makeCase({
        type: "line",
        state: "missing-data",
        fixture: "provincial-budgets",
        raw: { ...lineBudgets, title: "Provincial program spending", y: ["program_spending"] },
        size: DEFAULT,
    }),
    makeCase({
        type: "line",
        state: "many-entities",
        fixture: "federal-departments",
        raw: lineManyEntities,
        size: WIDE,
    }),

    // --- discrete-bar (population-snapshot, grain "none") -------------------
    makeCase({
        type: "discrete-bar",
        state: "default",
        fixture: "population-snapshot",
        raw: discreteBarPopulation,
        size: THUMBNAIL,
    }),
    makeCase({
        type: "discrete-bar",
        state: "default",
        fixture: "population-snapshot",
        raw: discreteBarPopulation,
        size: DEFAULT,
    }),
    makeCase({
        type: "discrete-bar",
        state: "default",
        fixture: "population-snapshot",
        raw: discreteBarPopulation,
        size: WIDE,
    }),
    makeCase({
        type: "discrete-bar",
        state: "sort-name",
        fixture: "population-snapshot",
        raw: { ...discreteBarPopulation, sort: { by: "name", order: "asc" } },
        size: DEFAULT,
    }),
    // All-negative values from the pathological fixture.
    makeCase({
        type: "discrete-bar",
        state: "negatives",
        fixture: "pathological",
        raw: discreteBarNegatives,
        size: DEFAULT,
    }),

    // --- stacked-area (government-debt, the flagship demo) ------------------
    makeCase({ type: "stacked-area", state: "default", fixture: "government-debt", raw: stackedAreaDebt, size: THUMBNAIL }),
    makeCase({ type: "stacked-area", state: "default", fixture: "government-debt", raw: stackedAreaDebt, size: DEFAULT }),
    makeCase({ type: "stacked-area", state: "default", fixture: "government-debt", raw: stackedAreaDebt, size: WIDE }),
    makeCase({
        type: "stacked-area",
        state: "relative",
        fixture: "government-debt",
        raw: { ...stackedAreaDebt, stackMode: "relative" },
        size: DEFAULT,
    }),
    makeCase({
        type: "stacked-area",
        state: "fr",
        fixture: "government-debt",
        raw: { ...stackedAreaDebt, locale: "fr" },
        size: DEFAULT,
    }),

    // --- stacked-bar (government-debt) ---------------------------------------
    makeCase({ type: "stacked-bar", state: "default", fixture: "government-debt", raw: stackedBarDebt, size: THUMBNAIL }),
    makeCase({ type: "stacked-bar", state: "default", fixture: "government-debt", raw: stackedBarDebt, size: DEFAULT }),
    makeCase({ type: "stacked-bar", state: "default", fixture: "government-debt", raw: stackedBarDebt, size: WIDE }),
    makeCase({
        type: "stacked-bar",
        state: "relative",
        fixture: "government-debt",
        raw: { ...stackedBarDebt, stackMode: "relative" },
        size: DEFAULT,
    }),

    // --- stacked-discrete-bar (provincial-budgets) ---------------------------
    makeCase({
        type: "stacked-discrete-bar",
        state: "default",
        fixture: "provincial-budgets",
        raw: stackedDiscreteBudgets,
        size: THUMBNAIL,
    }),
    makeCase({
        type: "stacked-discrete-bar",
        state: "default",
        fixture: "provincial-budgets",
        raw: stackedDiscreteBudgets,
        size: DEFAULT,
    }),
    makeCase({
        type: "stacked-discrete-bar",
        state: "default",
        fixture: "provincial-budgets",
        raw: stackedDiscreteBudgets,
        size: WIDE,
    }),
    makeCase({
        type: "stacked-discrete-bar",
        state: "relative",
        fixture: "provincial-budgets",
        raw: { ...stackedDiscreteBudgets, stackMode: "relative" },
        size: DEFAULT,
    }),
    // Nova Scotia 2022-23 is missing program_spending (thinned cells).
    makeCase({
        type: "stacked-discrete-bar",
        state: "missing-data",
        fixture: "provincial-budgets",
        raw: { ...stackedDiscreteBudgets, time: "2022-23" },
        size: DEFAULT,
    }),

    // --- slope (provincial-budgets, two-endpoint window) --------------------
    makeCase({ type: "slope", state: "default", fixture: "provincial-budgets", raw: slopeBudgets, size: THUMBNAIL }),
    makeCase({ type: "slope", state: "default", fixture: "provincial-budgets", raw: slopeBudgets, size: DEFAULT }),
    makeCase({ type: "slope", state: "default", fixture: "provincial-budgets", raw: slopeBudgets, size: WIDE }),
    makeCase({
        type: "slope",
        state: "fr",
        fixture: "provincial-budgets",
        raw: { ...slopeBudgets, locale: "fr" },
        size: DEFAULT,
    }),

    // --- dumbbell (provincial-budgets, two-metric) --------------------------
    makeCase({ type: "dumbbell", state: "default", fixture: "provincial-budgets", raw: dumbbellBudgets, size: THUMBNAIL }),
    makeCase({ type: "dumbbell", state: "default", fixture: "provincial-budgets", raw: dumbbellBudgets, size: DEFAULT }),
    makeCase({ type: "dumbbell", state: "default", fixture: "provincial-budgets", raw: dumbbellBudgets, size: WIDE }),
    makeCase({
        type: "dumbbell",
        state: "change-labels",
        fixture: "provincial-budgets",
        raw: { ...dumbbellBudgets, valueLabelMode: "change", connector: "line" },
        size: DEFAULT,
    }),

    // --- scatter (provincial-budgets, snapshot) -----------------------------
    makeCase({ type: "scatter", state: "default", fixture: "provincial-budgets", raw: scatterBudgets, size: THUMBNAIL }),
    makeCase({ type: "scatter", state: "default", fixture: "provincial-budgets", raw: scatterBudgets, size: DEFAULT }),
    makeCase({ type: "scatter", state: "default", fixture: "provincial-budgets", raw: scatterBudgets, size: WIDE }),

    // --- marimekko (provincial-budgets, width = total spending) -------------
    makeCase({ type: "marimekko", state: "default", fixture: "provincial-budgets", raw: marimekkoBudgets, size: THUMBNAIL }),
    makeCase({ type: "marimekko", state: "default", fixture: "provincial-budgets", raw: marimekkoBudgets, size: DEFAULT }),
    makeCase({ type: "marimekko", state: "default", fixture: "provincial-budgets", raw: marimekkoBudgets, size: WIDE }),
    makeCase({
        type: "marimekko",
        state: "relative",
        fixture: "provincial-budgets",
        raw: { ...marimekkoBudgets, stackMode: "relative" },
        size: DEFAULT,
    }),
]

// ---------------------------------------------------------------------------
// Rendering — the CLI pipeline, minus file I/O (spec 24 §3 determinism)
// ---------------------------------------------------------------------------

/** Render one corpus case to the exact SVG string the CLI would emit. */
export function renderCorpusCase(corpusCase: CorpusCase): string {
    const { dataset } = loadFixtureDataset(corpusCase.fixture)
    const resolved = resolveDefinitionTimes(corpusCase.definition, dataset.manifest.timeGrain)
    const scene = layoutChart({
        definition: resolved.definition,
        dataset,
        ...(corpusCase.view !== undefined ? { view: corpusCase.view } : {}),
        size: corpusCase.size,
        chrome: corpusCase.chrome ?? "full",
    })
    const markup = renderToStaticMarkup(createElement(SceneSVG, { scene, idPrefix: corpusCase.name }))
    return `${XML_DECLARATION}\n${markup}`
}
