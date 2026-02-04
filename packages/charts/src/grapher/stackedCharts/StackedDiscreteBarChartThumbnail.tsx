import React from "react"
import { computed, makeObservable } from "mobx"
import { observer } from "mobx-react"
import { ChartInterface } from "../chart/ChartInterface.js"
import { StackedDiscreteBarChartState } from "./StackedDiscreteBarChartState.js"
import { ChartComponentProps } from "../chart/ChartTypeMap.js"
import { StackedDiscreteBars } from "./StackedDiscreteBars.js"

@observer
export class StackedDiscreteBarChartThumbnail
    extends React.Component<ChartComponentProps<StackedDiscreteBarChartState>>
    implements ChartInterface
{
    constructor(props: ChartComponentProps<StackedDiscreteBarChartState>) {
        super(props)
        // Ensure that the component is observable
        makeObservable(this)
    }

    @computed get chartState(): StackedDiscreteBarChartState {
        return this.props.chartState
    }

    override render(): React.ReactElement {
        return <StackedDiscreteBars {...this.props} />
    }
}
