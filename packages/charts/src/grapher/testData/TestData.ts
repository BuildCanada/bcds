import * as _ from "lodash-es"
import { Region, regions } from "../../utils/index.js"
import {
    MultipleVariableDataDimensionsMap,
    VariableWithSource,
    EntityCode,
    EntityId,
    EntityName,
} from "../../types/index.js"

type Entity = { id: EntityId; code?: EntityCode; name?: EntityName }
type TestDatum = { year: number; entity: Entity; value: string | number }

export type TestData = TestDatum[]
export type TestMetadata = VariableWithSource

const fakeRegions = regions.map((region: Region, index: number) => ({
    ...region,
    id: index + 1,
}))

export const fakeEntities = Object.fromEntries(
    fakeRegions.map((entity: Region & { id: number }) => [
        entity.name,
        { id: entity.id, code: entity.code, name: entity.name },
    ])
)

export function createTestDataset(
    indicators: {
        data: TestData
        metadata: TestMetadata
    }[]
): MultipleVariableDataDimensionsMap {
    return new Map(
        indicators.map(({ data, metadata }) => [
            metadata.id,
            {
                data: {
                    years: data.map((d) => d.year),
                    entities: data.map((d) => d.entity.id),
                    values: data.map((d) => d.value),
                },
                metadata: {
                    ...metadata,
                    dimensions: {
                        entities: {
                            values: _.uniqBy(
                                data.map((d) => d.entity),
                                "id"
                            ),
                        },
                        years: {
                            values: _.uniqBy(
                                data.map((d) => ({ id: d.year })),
                                "id"
                            ),
                        },
                    },
                },
            },
        ])
    )
}
