/**
 * Configuration interface for @buildcanada/charts
 *
 * This allows customization of branding, API endpoints, and error handling
 * to make the library work independently of any specific data provider.
 */

export interface ChartsBranding {
    /**
     * Text displayed for the license (e.g., "CC BY")
     * @default "CC BY"
     */
    licenseText?: string

    /**
     * URL for the license link
     * @default "https://creativecommons.org/licenses/by/4.0/"
     */
    licenseUrl?: string

    /**
     * Text displayed when showing "Powered by" attribution
     * @default "Powered by Charts"
     */
    poweredByText?: string

    /**
     * URL for the "Powered by" link
     */
    poweredByUrl?: string

    /**
     * Support email for error messages
     */
    supportEmail?: string

    /**
     * Custom tooltip text for the license/attribution section
     */
    licenseTooltip?: string

    /**
     * Custom logos to use in charts
     */
    logos?: Record<string, LogoConfig>
}

export interface LogoConfig {
    svg: string
    width: number
    height: number
    url?: string
}

export interface ChartsDataApi {
    /**
     * Base URL for the data API
     * Example: "https://api.example.com/v1/indicators/"
     */
    baseUrl: string

    /**
     * Custom route builder for variable data
     * If not provided, uses default: `${baseUrl}/${variableId}.data.json`
     */
    getVariableDataRoute?: (variableId: number) => string

    /**
     * Custom route builder for variable metadata
     * If not provided, uses default: `${baseUrl}/${variableId}.metadata.json`
     */
    getVariableMetadataRoute?: (variableId: number) => string
}

export interface ChartsErrorReporting {
    /**
     * Whether error reporting is enabled
     */
    enabled: boolean

    /**
     * Custom error handler function
     * Use this to integrate with your error tracking service (e.g., Sentry, LogRocket)
     */
    handler?: (error: Error, context: Record<string, unknown>) => void
}

export interface ChartsAnalytics {
    /**
     * Whether analytics is enabled
     */
    enabled: boolean

    /**
     * Custom analytics handler
     */
    trackEvent?: (
        eventName: string,
        properties: Record<string, unknown>
    ) => void
}

export interface ChartsConfig {
    /**
     * Branding configuration for customizing the appearance
     */
    branding?: ChartsBranding

    /**
     * Data API configuration
     */
    dataApi: ChartsDataApi

    /**
     * Error reporting configuration
     */
    errorReporting?: ChartsErrorReporting

    /**
     * Analytics configuration
     */
    analytics?: ChartsAnalytics
}

/**
 * Default configuration values
 */
export const defaultChartsConfig: Partial<ChartsConfig> = {
    branding: {
        licenseText: "CC BY",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        poweredByText: "Powered by Build Canada Charts",
    },
    errorReporting: {
        enabled: false,
    },
    analytics: {
        enabled: false,
    },
}

/**
 * Merge user config with defaults
 */
export function mergeWithDefaults(
    config: ChartsConfig
): Required<ChartsConfig> {
    return {
        branding: {
            ...defaultChartsConfig.branding,
            ...config.branding,
        },
        dataApi: config.dataApi,
        errorReporting: {
            ...defaultChartsConfig.errorReporting,
            ...config.errorReporting,
        },
        analytics: {
            ...defaultChartsConfig.analytics,
            ...config.analytics,
        },
    } as Required<ChartsConfig>
}
