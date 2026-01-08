import type { Preview } from "@storybook/react"

import { ChartsDecorator } from "./decorators/ChartsDecorator"

import "../src/styles/charts.scss"

const preview: Preview = {
    decorators: [ChartsDecorator],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        backgrounds: {
            default: "light",
            values: [
                { name: "light", value: "#ffffff" },
                { name: "gray", value: "#f5f5f5" },
                { name: "dark", value: "#1a1a1a" },
            ],
        },
    },
}

export default preview
