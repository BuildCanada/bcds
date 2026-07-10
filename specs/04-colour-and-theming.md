# 04 — Colour & Theming

**Status:** Draft
**Covers:** How series and values get colours, binned/continuous colour scales, and the theme system that delivers brand variations. Colour primitives come from `@buildcanada/colours`; this spec defines how charts consume them. Reference behavior: owid-grapher `color/`.

## 1. Colour sources (from `@buildcanada/colours`)

- **Scales:** 14 named colour scales (auburn, aurora, amethyst, cerulean, charcoal, copper, emerald, lake, linen, maritime, nickel, pine, sienna, steel), each with 11 shades (50–950). These supply sequential ramps, UI chrome, and single-hue needs.
- **Chart themes:** 28 twelve-tone palettes (e.g., `linen-pine-blend`, `auburn-cool-bend`) — ordered 12-colour lists designed for categorical series.

The rebuild must consume these directly: chart palettes are *references into the colours package*, not copied hex lists. Adding a palette to the colours package makes it available to charts with no chart-side change.

## 2. Categorical colour assignment

- Series take colours from the active categorical palette **in series order**, skipping colours already claimed by fixed assignments.
- **Fixed assignments** (highest precedence first): per-chart `entityColours` / column `colour` → entity registry colour (e.g., a standing palette for provinces so Ontario is always the same colour across all Build Canada charts) → palette order.
- **Persistence:** once a series has a colour in a session, it keeps it as entities are added/removed; colours are not reshuffled by reordering.
- More series than palette colours: colours repeat with a varied shade rather than exact duplicates; charts at this density should prompt faceting instead.
- "No data" is a reserved neutral (from the nickel/charcoal scale) and is never assigned to a real series.

## 3. Value-driven colour scales (maps, scatter colour, line colour)

### Binned (default for maps)

- **Automatic strategies:** equal-width, quantile, log-spaced, natural-breaks clustering; chosen automatically from the value distribution unless specified.
- **Stability over time:** automatic bins are computed from the view's **full time range**, not the currently displayed time — so the legend and a region's colour-for-a-value stay fixed while the timeline scrubs, plays, or renders to video.
- **Manual bins:** explicit boundaries, with optional per-bin labels and colour overrides; open-ended first/last bins ("< 0", "10+").
- **Diverging:** a declared midpoint (default 0) splits the ramp; modes for symmetric ranges or equal bin counts each side; optional dedicated midpoint bin.
- **Categorical values:** one bin per category with custom labels/colours/hidden categories.
- Always-available special bins: **No data** (neutral + hatch pattern on maps) and **Projected** (pattern fill).

### Continuous

- A smooth ramp between scale shades for dense scatter colouring; legends render the gradient with min/mid/max labels.

### Ramps from brand scales

Sequential ramps derive from the 50→950 shades of one named scale; diverging ramps pair two scales through a neutral (e.g., auburn ↔ lake through linen). The set of blessed ramp pairings is defined in the colours package so all brands stay coherent. Ramps are reversible (`invert`).

## 4. Themes (brand variations)

A **theme** is a named bundle of every visual decision:

| Group | Contents |
|---|---|
| Palettes | default categorical palette (one of the 28), default sequential/diverging ramps, no-data colour, focus/dim treatment |
| Typography | font family/stack, base size, weight scale for title/subtitle/labels/ticks |
| Chrome | logo asset + placement, frame padding, background, gridline/axis colours, border radius |
| Attribution | "Powered by…" text, license text/URL, watermark for exports |
| Locale defaults | language, number formatting conventions |

Rules:

- Exactly one theme is active per chart; default comes from context (the embedding site or CLI flag), overridable per chart definition.
- **Build Canada** and **Canada Spends** ship as the first two themes; a new brand is a new theme document plus (optionally) new palettes in the colours package — zero chart-code changes.
- Every rendering mode (interactive, static, video) honours the theme identically.
- Charts must remain legible in any theme: contrast minimums (WCAG AA for text, distinguishable series colours) are validated at theme definition time, not per chart.

## 5. Colour accessibility

- Series differentiation never relies on colour alone where avoidable: line charts support end-of-line labels, maps have patterns for no-data/projected, focused series gain weight as well as opacity.
- Tooltips and legends echo the series swatch so colour-impaired readers can cross-match by position/label.

## Test expectations

- Determinism: same definition + data + theme → identical colour assignment across renders and render modes.
- Persistence: add/remove entities in sequence; surviving series never change colour.
- Binning: table-driven tests per strategy — (values, strategy, options) → exact bin boundaries and labels, including open ends, midpoint modes, and degenerate inputs (all-equal values, n < bins).
- Theme swap: rendering fixture charts under each theme changes only themed properties (snapshot diff shows no geometry changes).
- Contrast: automated check that every theme's palette pairs pass differentiation thresholds against the theme background.
