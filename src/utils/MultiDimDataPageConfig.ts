/**
 * Stub for MultiDimDataPageConfig.
 * Multi-dimensional data page configurations are specific to OWID's data pages.
 */

export interface MultiDimDataPageConfigRaw {
    views?: unknown[]
    dimensions?: unknown[]
    [key: string]: unknown
}

export class MultiDimDataPageConfig {
    constructor(_config: MultiDimDataPageConfigRaw) {}

    static fromObject(_obj: MultiDimDataPageConfigRaw): MultiDimDataPageConfig {
        return new MultiDimDataPageConfig(_obj)
    }
}

export function extractMultiDimChoicesFromSearchParams(
    _searchParams: URLSearchParams
): Record<string, string> {
    return {}
}

export function searchParamsToMultiDimView(
    _searchParams: URLSearchParams,
    _config: MultiDimDataPageConfig
): unknown {
    return null
}
