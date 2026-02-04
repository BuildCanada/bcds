import * as React from "react"

import { Bounds } from "../../utils/index.js"
import { debounce } from "lodash-es"
import { GrapherProgrammaticInterface } from "../index.js"
import { FetchingGrapher } from "./FetchingGrapher.js"
import {
    ArchiveContext,
    VariableDataMetadataDimensions,
    VariableId,
} from "../../types/index.js"
import { loadVariableDataAndMetadata } from "./loadVariable.js"
import { createRoot } from "react-dom/client"

/**
 * Simple error boundary component to catch rendering errors
 */
class ChartErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
        return { hasError: true, error }
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error("Chart rendering error:", error, errorInfo)
    }

    override render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <p>Something went wrong loading this chart.</p>
                    <p style={{ fontSize: "12px", color: "#666" }}>
                        {this.state.error?.message}
                    </p>
                </div>
            )
        }
        return this.props.children
    }
}

export function renderGrapherIntoContainer(
    config: GrapherProgrammaticInterface,
    containerNode: Element,
    dataApiUrl: string,
    {
        archiveContext,
        noCache,
    }: { archiveContext?: ArchiveContext; noCache?: boolean } = {}
): void {
    const reactRoot = createRoot(containerNode)

    const setBoundsFromContainerAndRender = (
        entries: ResizeObserverEntry[]
    ): void => {
        const entry = entries?.[0] // We always observe exactly one element
        if (!entry)
            throw new Error(
                "Couldn't resize grapher, expected exactly one ResizeObserverEntry"
            )

        // Don't bother rendering if the container is hidden
        // see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
        if ((entry.target as HTMLElement).offsetParent === null) return

        const grapherConfigWithBounds = {
            ...config,
            additionalDataLoaderFn: (
                varId: VariableId
            ): Promise<VariableDataMetadataDimensions> =>
                loadVariableDataAndMetadata(varId, dataApiUrl, { noCache }),
        }

        reactRoot.render(
            <ChartErrorBoundary>
                <FetchingGrapher
                    config={grapherConfigWithBounds}
                    dataApiUrl={dataApiUrl}
                    archiveContext={archiveContext}
                    externalBounds={Bounds.fromRect(entry.contentRect)}
                    queryStr={grapherConfigWithBounds.queryStr}
                    noCache={noCache}
                />
            </ChartErrorBoundary>
        )
    }

    if (typeof window !== "undefined" && "ResizeObserver" in window) {
        const resizeObserver = new ResizeObserver(
            // Use a leading debounce to render immediately upon first load, and also immediately upon orientation change on mobile
            debounce(setBoundsFromContainerAndRender, 400, {
                leading: true,
            })
        )
        resizeObserver.observe(containerNode)
    } else if (typeof window === "object" && typeof document === "object") {
        // only show the warning when we're in something that roughly resembles a browser
        console.warn(
            "ResizeObserver not available; grapher will not be able to render"
        )
    }
}

export function renderSingleGrapherOnGrapherPage(
    jsonConfig: GrapherProgrammaticInterface,
    dataApiUrl: string,
    {
        archiveContext,
        noCache,
        queryParams,
    }: {
        archiveContext?: ArchiveContext
        noCache?: boolean
        queryParams?: URLSearchParams
    } = {}
): void {
    const container = document.getElementsByTagName("figure")[0]
    const queryStrValue = queryParams
        ? `?${queryParams.toString()}`
        : window.location.search
    try {
        renderGrapherIntoContainer(
            {
                ...jsonConfig,
                bindUrlToWindow: true,
                enableKeyboardShortcuts: true,
                queryStr: queryStrValue,
                archiveContext,
            },
            container,
            dataApiUrl,
            { archiveContext, noCache }
        )
    } catch (err) {
        container.innerHTML = `<p>Unable to load interactive visualization</p>`
        container.setAttribute("id", "fallback")
        throw err
    }
}
