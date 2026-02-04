import { Url, UrlMigration, performUrlMigrations } from "../../utils/index.ts"

import { legacyCovidMigrationSpec } from "./LegacyCovidUrlMigration.ts"
import { co2UrlMigration } from "./CO2UrlMigration.ts"
import { energyUrlMigration } from "./EnergyUrlMigration.ts"
import { covidUrlMigration } from "./CovidUrlMigration.ts"

export enum ExplorerUrlMigrationId {
    legacyToGridCovidExplorer = "legacyToGridCovidExplorer",
}

export interface ExplorerUrlMigrationSpec {
    explorerSlug: string
    migrateUrl: (url: Url, baseQueryStr: string) => Url
}

export const explorerUrlMigrationsById: Record<
    ExplorerUrlMigrationId,
    ExplorerUrlMigrationSpec
> = {
    legacyToGridCovidExplorer: legacyCovidMigrationSpec,
}

const explorerUrlMigrations: UrlMigration[] = [
    // NOTE: The order of migrations matters!
    co2UrlMigration,
    energyUrlMigration,
    covidUrlMigration,
]

export const migrateExplorerUrl: UrlMigration = (url: Url): Url => {
    return performUrlMigrations(explorerUrlMigrations, url)
}
