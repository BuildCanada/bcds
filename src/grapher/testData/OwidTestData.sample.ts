import { DimensionProperty } from "../../utils/index.js"
import { GrapherProgrammaticInterface } from "../core/Grapher"
import { GrapherState } from "../core/GrapherState"
import {
    TestData,
    TestMetadata,
    createOwidTestDataset,
    fakeEntities,
} from "../testData/OwidTestData"
import { legacyToOwidTableAndDimensionsWithMandatorySlug } from "../core/LegacyToOwidTable.js"

/**
 * Comprehensive life expectancy test data covering:
 * - ~60 countries across all continents
 * - 7 time periods: 1960, 1970, 1980, 1990, 2000, 2010, 2020
 * - Realistic values based on actual historical trends
 */
function generateLifeExpectancyData(): TestData {
    // Base life expectancy values for 2020, with realistic country differences
    const countryBaseValues: Record<string, number> = {
        // High income countries (78-85 years)
        Japan: 84.6,
        Switzerland: 83.8,
        Australia: 83.4,
        Spain: 83.2,
        Italy: 83.0,
        Iceland: 83.0,
        Norway: 82.8,
        Sweden: 82.4,
        France: 82.2,
        Canada: 82.0,
        "New Zealand": 82.0,
        Ireland: 82.0,
        Netherlands: 81.9,
        Austria: 81.5,
        Germany: 81.3,
        Belgium: 81.3,
        Finland: 81.3,
        "United Kingdom": 81.2,
        Portugal: 81.1,
        Denmark: 81.0,
        Greece: 81.0,
        Slovenia: 81.0,
        Chile: 80.2,
        "Costa Rica": 80.0,
        "United States": 78.9,
        Czechia: 79.1,
        Estonia: 78.6,
        Poland: 77.7,

        // Upper-middle income (70-78 years)
        Cuba: 78.8,
        Panama: 78.5,
        Uruguay: 77.8,
        Argentina: 76.7,
        Thailand: 77.2,
        China: 77.1,
        Mexico: 75.1,
        Brazil: 75.9,
        Colombia: 77.3,
        Turkey: 77.7,
        Malaysia: 76.2,
        Peru: 76.5,
        Ecuador: 77.0,
        Iran: 76.7,
        Vietnam: 75.4,
        "Saudi Arabia": 75.1,

        // Lower-middle income (65-72 years)
        Indonesia: 71.7,
        Philippines: 71.2,
        Egypt: 72.0,
        India: 70.4,
        Bangladesh: 72.6,
        Pakistan: 67.3,
        Kenya: 66.7,
        Ghana: 64.1,
        Morocco: 76.7,
        "South Africa": 64.1,

        // Low income (55-65 years)
        Nigeria: 54.7,
        Ethiopia: 66.6,
        "Democratic Republic of Congo": 60.7,
        Tanzania: 65.5,
        Uganda: 63.4,
        Sudan: 65.3,
        Afghanistan: 64.8,
        Haiti: 64.0,
        "Sierra Leone": 54.7,
        Chad: 54.2,
        "Central African Republic": 53.3,

        // Continents and aggregates
        World: 72.7,
        Europe: 78.1,
        Asia: 74.0,
        Africa: 64.0,
        "North America": 79.0,
        "South America": 75.5,
        Oceania: 78.5,
    }

    // Life expectancy improvement rates per decade (approximate global averages)
    // Going backwards from 2020
    const decadeImprovements: Record<number, number> = {
        2010: 2.0, // 2010-2020: slower improvement
        2000: 2.5, // 2000-2010
        1990: 2.5, // 1990-2000
        1980: 3.0, // 1980-1990
        1970: 3.5, // 1970-1980
        1960: 4.0, // 1960-1970
    }

    const years = [1960, 1970, 1980, 1990, 2000, 2010, 2020]
    const data: TestData = []

    for (const [countryName, baseValue] of Object.entries(countryBaseValues)) {
        const entity = fakeEntities[countryName]
        if (!entity) continue

        for (const year of years) {
            // Calculate value by going backwards from 2020 base
            let value = baseValue
            for (let y = 2020; y > year; y -= 10) {
                const improvement = decadeImprovements[y - 10] || 2.5
                // Add some country-specific variation (poorer countries had larger gains)
                const adjustedImprovement =
                    baseValue < 65 ? improvement * 1.2 : improvement
                value -= adjustedImprovement
            }
            // Ensure minimum reasonable value
            value = Math.max(value, 30)
            // Round to 1 decimal place
            value = Math.round(value * 10) / 10

            data.push({ year, entity, value })
        }
    }

    return data
}

/**
Grapher properties:
- Single y-dimension
- Multiple entities, including World, Continents, and Countries
 */
export const LifeExpectancyGrapher = (
    props: Partial<GrapherProgrammaticInterface> = {}
): GrapherState => {
    const lifeExpectancyId = 815383
    const lifeExpectancyMetadata: TestMetadata = {
        id: lifeExpectancyId,
        display: {
            name: "Life expectancy at birth",
            unit: "years",
            shortUnit: "years",
            numDecimalPlaces: 1,
        },
    }
    const lifeExpectancyData = generateLifeExpectancyData()
    const dimensions = [
        {
            variableId: lifeExpectancyId,
            property: DimensionProperty.y,
        },
    ]
    const grapherState = new GrapherState({
        ...props,
        dimensions,
    })
    const inputTable = legacyToOwidTableAndDimensionsWithMandatorySlug(
        createOwidTestDataset([
            { data: lifeExpectancyData, metadata: lifeExpectancyMetadata },
        ]),
        dimensions,
        {}
    )
    grapherState.inputTable = inputTable
    return grapherState
}

/**
 * Canadian province population data for testing Canada map view.
 * Covers 1971-2023 with realistic historical population trends.
 * Growth rates vary by province to reflect actual demographic patterns.
 */
function generateCanadaProvinceData(): TestData {
    // Population in millions (2023 estimates) and average annual growth rates
    // Growth rates reflect historical patterns: western provinces grew faster
    const provinceData: Record<
        string,
        { pop2023: number; growthRate: number }
    > = {
        Ontario: { pop2023: 15.8, growthRate: 1.4 },
        Quebec: { pop2023: 8.8, growthRate: 0.8 },
        "British Columbia": { pop2023: 5.4, growthRate: 1.8 },
        Alberta: { pop2023: 4.6, growthRate: 2.2 },
        Manitoba: { pop2023: 1.4, growthRate: 0.9 },
        Saskatchewan: { pop2023: 1.2, growthRate: 0.6 },
        "Nova Scotia": { pop2023: 1.0, growthRate: 0.4 },
        "New Brunswick": { pop2023: 0.8, growthRate: 0.3 },
        "Newfoundland and Labrador": { pop2023: 0.5, growthRate: -0.2 },
        "Prince Edward Island": { pop2023: 0.17, growthRate: 0.8 },
        "Northwest Territories": { pop2023: 0.045, growthRate: 1.0 },
        Yukon: { pop2023: 0.044, growthRate: 1.5 },
        Nunavut: { pop2023: 0.04, growthRate: 2.0 },
    }

    // Every 5 years from 1971 to 2023
    const years = [
        1971, 1976, 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021, 2023,
    ]
    const data: TestData = []

    for (const [provinceName, { pop2023, growthRate }] of Object.entries(
        provinceData
    )) {
        const entity = fakeEntities[provinceName]
        if (!entity) continue

        for (const year of years) {
            // Calculate population going backwards from 2023 using compound growth
            const yearsFromBase = 2023 - year
            const growthFactor = Math.pow(1 + growthRate / 100, -yearsFromBase)
            const value = Math.round(pop2023 * growthFactor * 1000) / 1000

            data.push({ year, entity, value })
        }
    }

    return data
}

/**
 * Grapher configured for Canadian province data.
 * Shows population by province/territory.
 */
export const CanadaProvinceGrapher = (
    props: Partial<GrapherProgrammaticInterface> = {}
): GrapherState => {
    const populationId = 815384
    const populationMetadata: TestMetadata = {
        id: populationId,
        display: {
            name: "Population",
            unit: "million",
            shortUnit: "M",
            numDecimalPlaces: 2,
        },
    }
    const provinceData = generateCanadaProvinceData()
    const dimensions = [
        {
            variableId: populationId,
            property: DimensionProperty.y,
        },
    ]
    const grapherState = new GrapherState({
        ...props,
        dimensions,
    })
    const inputTable = legacyToOwidTableAndDimensionsWithMandatorySlug(
        createOwidTestDataset([
            { data: provinceData, metadata: populationMetadata },
        ]),
        dimensions,
        {}
    )
    grapherState.inputTable = inputTable
    return grapherState
}
