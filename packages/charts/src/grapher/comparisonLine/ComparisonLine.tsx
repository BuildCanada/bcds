import { DualAxis } from "../axis/Axis.js"
import {
    Color,
    ComparisonLineConfig,
    VerticalComparisonLineConfig,
} from "../../types/index.js"
import { VerticalComparisonLine } from "./VerticalComparisonLine.js"
import { CustomComparisonLine } from "./CustomComparisonLine.js"
import { isValidVerticalComparisonLineConfig } from "./ComparisonLineHelpers.js"

export interface ComparisonLineProps<LineConfig extends ComparisonLineConfig> {
    dualAxis: DualAxis
    comparisonLine: LineConfig
    backgroundColor?: Color
}

export const ComparisonLine = <LineConfig extends ComparisonLineConfig>(
    props: ComparisonLineProps<LineConfig>
) => {
    if (isVerticalComparisonLineProps(props)) {
        return <VerticalComparisonLine {...props} />
    } else {
        return <CustomComparisonLine {...props} />
    }
}

function isVerticalComparisonLineProps(
    props: ComparisonLineProps<ComparisonLineConfig>
): props is ComparisonLineProps<VerticalComparisonLineConfig> {
    return isValidVerticalComparisonLineConfig(props.comparisonLine)
}
