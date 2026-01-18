import type { StorybookConfig } from "@storybook/react-vite"
import pluginReact from "@vitejs/plugin-react"

const config: StorybookConfig = {
    stories: [
        "./docs/**/*.mdx",
        "../packages/charts/src/**/*.stories.@(ts|tsx)",
        "../packages/colours/src/**/*.stories.@(ts|tsx)",
        "../packages/components/src/**/*.stories.@(ts|tsx)",
    ],
    addons: ["@storybook/addon-docs", "@storybook/addon-interactions"],
    framework: {
        name: "@storybook/react-vite",
        options: {},
    },
    staticDirs: [
        {
            from: "../packages/components/src/assets",
            to: "/assets",
        },
    ],
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
            resolve: {
                ...config.resolve,
                // Ensure workspace packages can resolve their dependencies
                preserveSymlinks: true,
            },
            optimizeDeps: {
                ...config.optimizeDeps,
                // Include d3 packages to ensure they're properly bundled
                include: [
                    ...(config.optimizeDeps?.include || []),
                    "d3",
                    "d3-array",
                    "d3-color",
                    "d3-ease",
                    "d3-force",
                    "d3-format",
                    "d3-geo",
                    "d3-interpolate",
                    "d3-quadtree",
                    "d3-scale",
                    "d3-selection",
                    "d3-shape",
                    "d3-transition",
                    "d3-zoom",
                ],
            },
            esbuild: {
                ...config.esbuild,
                // Support TC-39 Stage 3 decorators used with MobX
                target: "es2024",
            },
            css: {
                preprocessorOptions: {
                    scss: {
                        includePaths: [
                            "./packages/charts/src",
                            "./packages/components/src",
                        ],
                        silenceDeprecations: ["import"],
                    },
                },
            },
        }
    },
}

export default config
