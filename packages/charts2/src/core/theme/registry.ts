/**
 * Theme registry (spec 04 §4).
 *
 * Exactly one theme is active per chart; the default comes from context
 * (embedding site or CLI flag) and is overridable per chart definition.
 * Lookup never throws and never logs: an unknown name falls back to the
 * default theme and reports a Diagnostic-style warning string so callers
 * decide how to surface it.
 */

import type { Theme } from "./types.ts"
import { buildCanadaTheme, canadaSpendsTheme } from "./themes.ts"

export const DEFAULT_THEME_NAME = "build-canada"

const registry: ReadonlyMap<string, Theme> = new Map(
    [buildCanadaTheme, canadaSpendsTheme].map((theme) => [theme.name, theme]),
)

export interface ThemeLookup {
    theme: Theme
    /** Present only when `name` was unknown and the default was substituted. */
    warning?: string
}

/** Registered theme names, in registration order. */
export function themeNames(): string[] {
    return [...registry.keys()]
}

export function getTheme(name?: string): ThemeLookup {
    if (name === undefined) return { theme: buildCanadaTheme }
    const theme = registry.get(name)
    if (theme !== undefined) return { theme }
    return {
        theme: buildCanadaTheme,
        warning: `Unknown theme "${name}"; falling back to "${DEFAULT_THEME_NAME}"`,
    }
}
