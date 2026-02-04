// Todo: remove this.
// Any display changes really can be computed columns. And then charts just need xColumnSlug, sizeColumnSlug, yColumnSlug (or yColumnSlugs) et cetera

import { observable, computed, makeObservable } from "mobx"
import {
    trimObject,
    ColumnSlug,
    DimensionProperty,
    VariableId,
    Persistable,
    deleteRuntimeAndUnchangedProps,
    updatePersistables,
    VariableDisplayConfig,
    ChartDimensionInterface,
    Time,
    ChartDimensionInterfaceWithMandatorySlug,
} from "../../utils/index.js"
import { ChartsTable, CoreColumn } from "../../core-table/index.js"

// A chart "dimension" represents a binding between a chart
// and a particular variable that it requests as data
class ChartDimensionDefaults implements ChartDimensionInterface {
    property!: DimensionProperty
    variableId!: VariableId

    // check on: malaria-deaths-comparisons and computing-efficiency

    display = new VariableDisplayConfig() // todo: make persistable

    // XXX move this somewhere else, it's only used for scatter x override and Marimekko override
    targetYear: Time | undefined = undefined

    constructor() {
        makeObservable(this, {
            property: observable,
            variableId: observable,
            display: observable,
            targetYear: observable,
        })
    }
}

// todo: remove when we remove dimensions
export interface LegacyDimensionsManager {
    table: ChartsTable
}

export function getDimensionColumnSlug(
    variableId: VariableId,
    targetYear: Time | undefined
): ColumnSlug {
    if (targetYear) return `${variableId}-${targetYear}`
    return variableId.toString()
}

export class ChartDimension
    extends ChartDimensionDefaults
    implements Persistable, ChartDimensionInterfaceWithMandatorySlug
{
    private manager: LegacyDimensionsManager

    constructor(
        obj: ChartDimensionInterface,
        manager: LegacyDimensionsManager
    ) {
        super()

        makeObservable(this, {
            _slug: observable,
        })
        this.manager = manager
        if (obj) this.updateFromObject(obj)
    }

    @computed private get table(): ChartsTable {
        return this.manager.table
    }

    updateFromObject(obj: ChartDimensionInterface): void {
        if (obj.display) updatePersistables(this, { display: obj.display })

        this.targetYear = obj.targetYear
        this.variableId = obj.variableId
        this.property = obj.property
        this.slug = obj.slug
    }

    toObject(): ChartDimensionInterface {
        return trimObject(
            deleteRuntimeAndUnchangedProps(
                {
                    property: this.property,
                    variableId: this.variableId,
                    display: this.display,
                    targetYear: this.targetYear,
                },
                new ChartDimensionDefaults()
            )
        )
    }

    // Do not persist yet, until we migrate off VariableIds
    _slug: ColumnSlug | undefined = undefined

    @computed get slug(): ColumnSlug {
        if (this._slug) return this._slug
        return getDimensionColumnSlug(this.variableId, this.targetYear)
    }

    set slug(value: ColumnSlug | undefined) {
        this._slug = value
    }

    @computed get column(): CoreColumn {
        return this.table.get(this.columnSlug)
    }

    @computed get columnSlug(): string {
        return this.slug ?? this.variableId.toString()
    }
}
