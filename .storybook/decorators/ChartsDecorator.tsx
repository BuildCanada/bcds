import * as React from "react"

import { ChartsProvider } from "../../src/config/ChartsProvider"
import type { ChartsConfig } from "../../src/config/ChartsConfig"

const storybookChartsConfig: ChartsConfig = {
    branding: {
        poweredByText: "Build Canada Charts",
        licenseText: "CC BY 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    },
    dataApi: {
        baseUrl: "https://api.example.com/v1/indicators/",
    },
    errorReporting: {
        enabled: false,
    },
    analytics: {
        enabled: false,
    },
}

export const ChartsDecorator = (Story: React.ComponentType) => (
    <ChartsProvider config={storybookChartsConfig}>
        <div style={{ padding: "20px" }}>
            <Story />
        </div>
    </ChartsProvider>
)
