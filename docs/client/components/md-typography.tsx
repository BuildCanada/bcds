import type { MDXComponents } from "mdx/types";

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

export const mdTypeComponents = {
  // Allows customizing built-in components, e.g. to add styling.
  h1: ({ children }) => <h1 id={`${children}`}>{children}</h1>,
  h2: ({ children }) => <h2 id={`${children}`}>{children}</h2>,
  h3: ({ children }) => <h3 id={`${children}`}>{children}</h3>,
} satisfies MDXComponents;

// template
// h2: ({ children }) => <h2 className="">{children}</h2>
