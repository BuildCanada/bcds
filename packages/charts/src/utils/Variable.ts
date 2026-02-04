// todo: remove file

import { observable, makeObservable } from "mobx"
import {
    Persistable,
    updatePersistables,
    objectWithPersistablesToObject,
    deleteRuntimeAndUnchangedProps,
} from "./persistable/Persistable.js"
import {
    VariableDataTableConfigInterface,
    VariableDisplayConfigInterface,
    VariableRoundingMode,
} from "../types/index.js"

class VariableDisplayConfigDefaults {
    name: string | undefined = undefined
    unit: string | undefined = undefined
    shortUnit: string | undefined = undefined
    isProjection: boolean | undefined = undefined
    conversionFactor: number | undefined = undefined
    roundingMode: VariableRoundingMode | undefined = undefined
    numDecimalPlaces: number | undefined = undefined
    numSignificantFigures: number | undefined = undefined
    tolerance: number | undefined = undefined
    yearIsDay: boolean | undefined = undefined
    zeroDay: string | undefined = undefined
    entityAnnotationsMap: string | undefined = undefined
    includeInTable: boolean | undefined = true
    tableDisplay: VariableDataTableConfigInterface | undefined = undefined
    color: string | undefined = undefined
    plotMarkersOnlyInLineChart: boolean | undefined = undefined

    constructor() {
        makeObservable(this, {
            name: observable,
            unit: observable,
            shortUnit: observable,
            isProjection: observable,
            conversionFactor: observable,
            roundingMode: observable,
            numDecimalPlaces: observable,
            numSignificantFigures: observable,
            tolerance: observable,
            yearIsDay: observable,
            zeroDay: observable,
            entityAnnotationsMap: observable,
            includeInTable: observable,
            tableDisplay: observable,
            color: observable,
            plotMarkersOnlyInLineChart: observable,
        })
    }
}

export class VariableDisplayConfig
    extends VariableDisplayConfigDefaults
    implements Persistable
{
    updateFromObject(obj?: Partial<VariableDisplayConfigInterface>): void {
        if (obj) updatePersistables(this, obj)
    }

    toObject(): VariableDisplayConfigDefaults {
        return deleteRuntimeAndUnchangedProps(
            objectWithPersistablesToObject(this),
            new VariableDisplayConfigDefaults()
        )
    }

    constructor(obj?: Partial<VariableDisplayConfigInterface>) {
        super()
        if (obj) this.updateFromObject(obj)
    }
}

// export interface VariablesAndEntityKey {
//     variables: {
//         [id: string]: VariableWithDataAndSource
//     }
//     entityKey: EntityKey
// }
