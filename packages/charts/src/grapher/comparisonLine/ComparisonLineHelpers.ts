import {
    ComparisonLineConfig,
    VerticalComparisonLineConfig,
} from "../../types/index"

export function isValidVerticalComparisonLineConfig(
    lineConfig: ComparisonLineConfig
): lineConfig is VerticalComparisonLineConfig {
    return "xEquals" in lineConfig && lineConfig.xEquals !== undefined
}
