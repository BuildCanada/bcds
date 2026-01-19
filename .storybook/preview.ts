import type { Preview } from "@storybook/react"

import { ChartsDecorator } from "./decorators/ChartsDecorator"

import "../packages/charts/src/styles/charts.scss"
import "../packages/components/src/styles/main.scss"

const preview: Preview = {
    decorators: [ChartsDecorator],
    tags: ["autodocs"],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        backgrounds: {
            default: "linen",
            values: [
                { name: "linen", value: "#F6ECE3" },
                { name: "white", value: "#ffffff" },
                { name: "gray", value: "#f5f5f5" },
                { name: "charcoal", value: "#272727" },
                { name: "dark", value: "#1a1a1a" },
            ],
        },
        docs: {
            source: {
                type: "code",
            },
            toc: true,
        },
    },
}

export default preview
