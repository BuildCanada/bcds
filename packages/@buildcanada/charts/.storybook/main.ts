import type { StorybookConfig } from "@storybook/react-vite"
import pluginReact from "@vitejs/plugin-react"

const config: StorybookConfig = {
    stories: ["../src/**/*.stories.@(ts|tsx)"],
    framework: {
        name: "@storybook/react-vite",
        options: {},
    },
    typescript: {
        // Disable react-docgen because the codebase uses MobX decorators
        // (@observer before export) which aren't compatible with react-docgen
        reactDocgen: false,
    },
    viteFinal: async (config) => {
        // Remove the default react plugin and add our own with decorator support
        const plugins = (config.plugins || []).filter(
            (plugin) =>
                !(
                    plugin &&
                    "name" in plugin &&
                    typeof plugin.name === "string" &&
                    plugin.name.includes("vite:react")
                )
        )

        return {
            ...config,
            plugins: [
                ...plugins,
                pluginReact({
                    babel: {
                        parserOpts: {
                            plugins: ["decorators"], // needed for MobX decorators
                        },
                    },
                }),
            ],
            esbuild: {
                ...config.esbuild,
                // Support TC-39 Stage 3 decorators used with MobX
                target: "es2024",
            },
            css: {
                preprocessorOptions: {
                    scss: {
                        includePaths: ["./src"],
                        silenceDeprecations: ["import"],
                    },
                },
            },
        }
    },
}

export default config
