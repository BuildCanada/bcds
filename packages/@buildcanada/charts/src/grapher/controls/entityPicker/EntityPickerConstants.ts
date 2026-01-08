import { ColumnSlug } from "../../../utils/index.js"
import { GrapherAnalytics } from "../../core/GrapherAnalytics"
import { OwidTable } from "../../../core-table/index.js"
import { CoreColumnDef, EntityName, SortOrder } from "../../../types/index.js"
import { MapConfig } from "../../mapCharts/MapConfig"

export interface EntityPickerManager {
    entityPickerMetric?: ColumnSlug
    entityPickerSort?: SortOrder
    setEntityPicker?: (options: {
        metric: string | undefined
        sort?: SortOrder
    }) => void
    requiredColumnSlugs?: ColumnSlug[] // If this param is provided, and an entity does not have a value for 1+, it will show as unavailable.
    entityPickerColumnDefs?: CoreColumnDef[]
    entityPickerTable?: OwidTable
    entityPickerTableIsLoading?: boolean
    grapherTable?: OwidTable
    entityType?: string
    analytics?: GrapherAnalytics
    availableEntityNames?: EntityName[]
    mapConfig?: MapConfig
}
