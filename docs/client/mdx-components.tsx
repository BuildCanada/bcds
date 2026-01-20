import type { MDXComponents } from "mdx/types";
import { mdTypeComponents } from "./components/md-typography";

const components: MDXComponents = {
  ...mdTypeComponents,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
