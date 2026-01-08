import * as React from "react"
import { createContext, useContext, useMemo } from "react"

import {
    ChartsConfig,
    defaultChartsConfig,
    mergeWithDefaults,
} from "./ChartsConfig"

/**
 * Context for charts configuration
 */
const ChartsContext = createContext<Required<ChartsConfig> | null>(null)

export interface ChartsProviderProps {
    /**
     * Configuration for the charts library
     */
    config: ChartsConfig

    /**
     * Child components that will have access to the configuration
     */
    children: React.ReactNode
}

/**
 * Provider component for charts configuration.
 *
 * Wrap your application or chart components with this provider to configure
 * branding, API endpoints, and error handling.
 *
 * @example
 * ```tsx
 * const config = {
 *   branding: {
 *     poweredByText: 'My Organization',
 *     licenseText: 'CC BY 4.0'
 *   },
 *   dataApi: {
 *     baseUrl: 'https://api.example.com/v1/indicators/'
 *   }
 * }
 *
 * function App() {
 *   return (
 *     <ChartsProvider config={config}>
 *       <Grapher {...chartProps} />
 *     </ChartsProvider>
 *   )
 * }
 * ```
 */
export function ChartsProvider({
    config,
    children,
}: ChartsProviderProps): React.ReactElement {
    const mergedConfig = useMemo(() => mergeWithDefaults(config), [config])

    return (
        <ChartsContext.Provider value={mergedConfig}>
            {children}
        </ChartsContext.Provider>
    )
}

/**
 * Hook to access the charts configuration.
 *
 * Must be used within a ChartsProvider.
 *
 * @throws Error if used outside of ChartsProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const config = useChartsConfig()
 *   return <div>Powered by: {config.branding.poweredByText}</div>
 * }
 * ```
 */
export function useChartsConfig(): Required<ChartsConfig> {
    const config = useContext(ChartsContext)

    if (!config) {
        throw new Error(
            "useChartsConfig must be used within a ChartsProvider. " +
                "Wrap your component tree with <ChartsProvider config={...}>."
        )
    }

    return config
}

/**
 * Hook to access the charts configuration, returning undefined if not in a provider.
 *
 * Use this for optional configuration access where a fallback is acceptable.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const config = useMaybeChartsConfig()
 *   const brandingText = config?.branding.poweredByText ?? 'Default'
 *   return <div>Powered by: {brandingText}</div>
 * }
 * ```
 */
export function useMaybeChartsConfig(): Required<ChartsConfig> | undefined {
    return useContext(ChartsContext) ?? undefined
}

/**
 * Get a fallback configuration for use outside of a provider.
 *
 * This creates a minimal configuration with the provided data API URL.
 * Useful for standalone usage or testing.
 */
export function createFallbackConfig(
    dataApiBaseUrl: string
): Required<ChartsConfig> {
    return mergeWithDefaults({
        dataApi: {
            baseUrl: dataApiBaseUrl,
        },
    })
}

/**
 * Report an error using the configured error handler.
 *
 * Falls back to console.error if no handler is configured.
 */
export function reportError(
    config: Required<ChartsConfig> | undefined,
    error: Error,
    context: Record<string, unknown> = {}
): void {
    if (config?.errorReporting?.enabled && config.errorReporting.handler) {
        config.errorReporting.handler(error, context)
    } else {
        console.error("Chart error:", error, context)
    }
}

/**
 * Track an analytics event using the configured handler.
 */
export function trackEvent(
    config: Required<ChartsConfig> | undefined,
    eventName: string,
    properties: Record<string, unknown> = {}
): void {
    if (config?.analytics?.enabled && config.analytics.trackEvent) {
        config.analytics.trackEvent(eventName, properties)
    }
}
