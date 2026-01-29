import type { MDXComponents } from "mdx/types";
import { mdTypeComponents } from "./components/md-typography";
import {
  Card,
  CardImage,
  CardAuthor,
  CardContent,
  CardDescription,
  CardIcon,
  CardMeta,
  CardStat,
  CardTitle,
} from "./components/bcds";

const components: MDXComponents = {
  ...mdTypeComponents,
  Card,
  CardImage,
  CardAuthor,
  CardContent,
  CardDescription,
  CardIcon,
  CardMeta,
  CardStat,
  CardTitle,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
