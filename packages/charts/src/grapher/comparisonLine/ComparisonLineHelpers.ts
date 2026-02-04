import {
    ComparisonLineConfig,
    VerticalComparisonLineConfig,
} from "../../types/index.ts"

export function isValidVerticalComparisonLineConfig(
    lineConfig: ComparisonLineConfig
): lineConfig is VerticalComparisonLineConfig {
    return "xEquals" in lineConfig && lineConfig.xEquals !== undefined
}
