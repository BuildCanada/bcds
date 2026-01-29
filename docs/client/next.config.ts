import type { NextConfig } from "next";

import createMDX from "@next/mdx";

const build_canada_theme = {
  displayName: "Build Canada Dark",
  name: "build-canada-dark",
  semanticHighlighting: true,
  colors: {
    "editor.background": "#272727", // charcoal-1000
  },
  tokenColors: [
    {
      scope: ["comment"],
      settings: {
        foreground: "#ead2beD0", // linen-300, ~80% alpha
      },
    },
    {
      scope: ["constant"], // eg value in key-value pairs
      settings: {
        foreground: "#e7e7e7", // charcoal-100
      },
    },
    {
      scope: ["variable"],
      settings: {
        foreground: "#91c3cf", // lake-300
      },
    },
    {
      scope: ["entity"], // eg functions
      settings: {
        foreground: "#e68383F0", // auburn-400, ~90%  alpha
      },
    },
    {
      scope: ["entity.name.type", "entity.other.attribute-name"],
      settings: {
        foreground: "#bedce3F0", // lake-200, 90% alpha
      },
    },
    {
      scope: ["invalid"],
      settings: {
        foreground: "#BB9999", // nickel-300
      },
    },
    {
      scope: ["keyword"], // eg import / from, for, if, * / + - = etc
      settings: {
        foreground: "#f1f2f180", // steel-100, 50% alpha
      },
    },
    {
      scope: ["markup"], // used in md
      settings: {
        foreground: "#fbf6f1F0", // linen-50, ~90% alpha
      },
    },
    {
      scope: ["storage"], // const, let
      settings: {
        foreground: "#f1b0b0E0", // auburn-300, ~85% alpha
      },
    },
    {
      scope: ["string"], // strings... duh
      settings: {
        foreground: "#86b58fF0", // pine-300
      },
    },
    {
      scope: ["meta"], // [], {}, :, keys in key value pairs
      settings: {
        foreground: "#f6ece3C0", // linen-100, 75% alpha
      },
    },
    {
      scope: ["support"], // TSX component names, other special things
      settings: {
        foreground: "#debcdf", // aurora-300
      },
    },
  ],
  type: "dark",
};

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    deviceSizes: [480, 1024, 1600], // Only generate these specific widths
    imageSizes: [16, 64, 128], // For tiny thumbnails
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [["rehype-pretty-code", { theme: build_canada_theme }]],
  },
});

export default withMDX(nextConfig);
