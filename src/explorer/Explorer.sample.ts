import { DimensionProperty } from "../utils/index.js"
import { GRAPHER_TAB_CONFIG_OPTIONS } from "../types/index.js"
import {
    GrapherProgrammaticInterface,
    legacyToOwidTableAndDimensionsWithMandatorySlug,
} from "../grapher/index.js"
import { Explorer, ExplorerProps } from "./Explorer.js"

const SampleExplorerOfGraphersProgram = `explorerTitle	CO₂ Data Explorer
isPublished	false
explorerSubtitle	Download the complete <i>Our World in Data</i> <a href="https://github.com/owid/co2-data">CO₂ and GHG Emissions Dataset</a>.
subNavId	co2
time	earliest..latest
selection	China	United States	India	United Kingdom	World
Gas Radio	CO₂
Accounting Radio	Production-based
subNavCurrentId	co2-data-explorer
graphers
	grapherId	Gas Radio	Accounting Radio	Fuel Dropdown	Count Dropdown	Relative to world total Checkbox	hasMapTab
	488	CO₂	Production-based	Total	Per country	false	true
	3219	CO₂	Production-based	Total	Per country	Share of global emissions	false
	486	CO₂	Production-based	Total	Per capita	false
	485	CO₂	Production-based	Total	Cumulative	false	false
	3218	CO₂	Production-based	Total	Cumulative	Share of global emissions	false
	4267	CO₂	Production-based	Total	Per MWh of energy	false
	530	CO₂	Production-based	Total	Per $ of GDP	false
	3621	CO₂	Consumption-based		Per country	false
	3488	CO₂	Consumption-based		Per capita	false
	4331	CO₂	Consumption-based		Per $ of GDP	false
	696	CO₂	Consumption-based		Share of emissions embedded in trade	false
	4250	CO₂	Production-based	Coal	Per country	false
	4251	CO₂	Production-based	Oil	Per country	false
	4253	CO₂	Production-based	Gas	Per country	false
	4255	CO₂	Production-based	Cement	Per country	false
	4332	CO₂	Production-based	Flaring	Per country	false
	4249	CO₂	Production-based	Coal	Per capita	false
	4252	CO₂	Production-based	Oil	Per capita	false
	4254	CO₂	Production-based	Gas	Per capita	false
	4256	CO₂	Production-based	Cement	Per capita	false
	4333	CO₂	Production-based	Flaring	Per capita	false
	4147	All GHGs (CO₂eq)	Production-based		Per country	false
	4239	All GHGs (CO₂eq)	Production-based		Per capita	false
	4222	Methane	Production-based		Per country	false
	4243	Methane	Production-based		Per capita	false
	4224	Nitrous oxide	Production-based		Per country	false
	4244	Nitrous oxide	Production-based		Per capita	false`

// Generate realistic CO2 per capita emissions data (tonnes per person)
// Based on approximate real-world trends from OWID CO2 data
function generateCO2PerCapitaData() {
    const startYear = 1990
    const endYear = 2024
    const years: number[] = []
    const entities: number[] = []
    const values: number[] = []

    // Entity IDs matching the selection: China, United States, India, United Kingdom, World
    const entityData = [
        {
            id: 1,
            name: "China",
            code: "CHN",
            // CO2 per capita rose from ~2 to ~8 tonnes
            baseValue: 2.1,
            trend: (year: number) => 2.1 + (year - 1990) * 0.18,
        },
        {
            id: 2,
            name: "United States",
            code: "USA",
            // CO2 per capita declined from ~20 to ~14 tonnes
            baseValue: 19.5,
            trend: (year: number) =>
                19.5 - (year - 1990) * 0.15 + Math.sin(year * 0.5) * 0.3,
        },
        {
            id: 3,
            name: "India",
            code: "IND",
            // CO2 per capita rose from ~0.7 to ~2 tonnes
            baseValue: 0.7,
            trend: (year: number) => 0.7 + (year - 1990) * 0.04,
        },
        {
            id: 4,
            name: "United Kingdom",
            code: "GBR",
            // CO2 per capita declined from ~10 to ~5 tonnes
            baseValue: 10.2,
            trend: (year: number) =>
                10.2 - (year - 1990) * 0.15 + Math.sin(year * 0.3) * 0.2,
        },
        {
            id: 5,
            name: "World",
            code: "OWID_WRL",
            // Global average rose from ~4 to ~4.7 tonnes
            baseValue: 4.0,
            trend: (year: number) =>
                4.0 + (year - 1990) * 0.02 + Math.sin(year * 0.2) * 0.1,
        },
    ]

    // Generate data for each year and entity
    for (let year = startYear; year <= endYear; year++) {
        for (const entity of entityData) {
            years.push(year)
            entities.push(entity.id)
            // Add some realistic variation
            const baseValue = entity.trend(year)
            const noise = (Math.sin(year * entity.id) * 0.1 + 1) * baseValue
            values.push(Math.round(noise * 100) / 100)
        }
    }

    const yearValues: { id: number }[] = []
    for (let year = startYear; year <= endYear; year++) {
        yearValues.push({ id: year })
    }

    return {
        data: { years, entities, values },
        metadata: {
            id: 142609,
            display: { yearIsDay: false },
            dimensions: {
                entities: {
                    values: entityData.map((e) => ({
                        name: e.name,
                        code: e.code,
                        id: e.id,
                    })),
                },
                years: { values: yearValues },
            },
        },
    }
}

export const SampleExplorerOfGraphers = (props?: Partial<ExplorerProps>) => {
    const title = "CO₂ emissions per capita"
    const co2Data = generateCO2PerCapitaData()
    const owidDataset = new Map([[142609, co2Data]])
    const dimensions = [
        {
            variableId: 142609,
            property: DimensionProperty.y,
        },
    ]
    const first: GrapherProgrammaticInterface = {
        id: 488,
        title,
        dimensions,
        tab: GRAPHER_TAB_CONFIG_OPTIONS.chart,
    }
    first.table = legacyToOwidTableAndDimensionsWithMandatorySlug(
        owidDataset,
        dimensions,
        {}
    )
    const grapherConfigs: GrapherProgrammaticInterface[] = [
        first,
        {
            ...first,
            id: 4147,
            title: "All GHGs per capita",
        },
    ]
    return new Explorer({
        slug: "test-slug",
        program: SampleExplorerOfGraphersProgram,
        grapherConfigs,
        adminBaseUrl: "",
        bakedBaseUrl: "",
        bakedGrapherUrl: "",
        dataApiUrl: "",
        ...props,
    })
}

const SampleInlineDataExplorerProgram = `explorerTitle	Sample Explorer
selection	Argentina
graphers
	Test Radio	xSlug	ySlugs	colorSlug	sizeSlug	type
	Scatter	x	y	color	size	ScatterPlot
	Line		y			LineChart

columns
	slug	type	name
	Country	EntityName	Country
	Quarter	Quarter	Quarter
	x	Numeric	x
	y	Numeric	y
	color	Numeric	color
	size	Numeric	size

table
	Country	Year	x	y	color	size
	Argentina	2020	1	1	1	1
	Argentina	2021	1	1	1	1`

export const SampleInlineDataExplorer = (props?: Partial<ExplorerProps>) => {
    return new Explorer({
        slug: "test-slug-inline-data",
        program: SampleInlineDataExplorerProgram,
        adminBaseUrl: "",
        bakedBaseUrl: "",
        bakedGrapherUrl: "",
        dataApiUrl: "",
        ...props,
    })
}
