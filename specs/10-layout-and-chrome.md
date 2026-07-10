# 10 — Layout & Chrome

**Status:** Draft
**Covers:** The frame around the plot: header, footer, tabs, action buttons, settings, responsive behavior, full-screen, embeds, and downloads. Reference behavior: owid-grapher `captionedChart/`, `header/`, `footer/`, `controls/`, `modal/`.

## 1. Frame anatomy

Top to bottom:

1. **Header** — logo (theme), title, subtitle.
2. **Controls row** — tabs (chart types / Map / Table), entity-selector affordance, settings, action buttons.
3. **Plot** — the chart itself (specs 11–21).
4. **Timeline** (when applicable).
5. **Footer** — source attribution ("Source: …" linking out), note, license/“Powered by” (theme), download/share affordances.

## 2. Header

- **Title** auto-annotates with entity and time per `02 §1`; scales down stepwise to fit one–two lines before truncating (never silently clipped in static output).
- **Subtitle** supports light markup and **term definitions**: marked terms show a dotted underline; activating one reveals a definition card (terms defined once in a shared glossary, usable in subtitles, notes, tooltips).
- Logo placement/size from theme; hidden below small widths.

## 3. Tabs

- One tab per entry in `types`, plus **Map** (if configured) and **Table** (always, when data exists).
- Switching tabs preserves selection, time, and focus where meaningful; state is in the URL (`tab=`).

## 4. Settings menu

A single gear menu containing only controls relevant to the current view:

- Relative/absolute toggle (stacked, line, scatter where enabled)
- Linear/log toggle (when `canToggleScale`)
- Facet strategy and "Align axes" (when faceting is available)
- "Hide entities with missing data"
- Chart-specific extras (e.g., scatter "zoom to selection", connected-scatter endpoints-only)

Every setting persists in URL state.

## 5. Action buttons & sharing

- **Download** — opens a panel offering: image (PNG at 1×/2×, SVG; current view exactly as displayed) and data (CSV of the full dataset or of the current view/selection, plus a metadata/README describing columns and sources). Non-redistributable columns (if flagged) block data download with an explanation.
- **Share** — copy canonical URL (with current state), social share, copy embed code.
- **Embed** — iframe snippet; embedded charts render the full interactive frame minus page chrome and link back to the canonical page.
- **Full-screen** — expands to viewport; Escape exits.

## 6. Responsive behavior

Charts are fluid within their container. Named breakpoints (small < ~400px, medium < ~700px, large) gate chrome:

- small: logo hidden, controls collapse to icons, settings into one menu, font scale reduced, timeline compresses, entity selector becomes a drawer;
- medium: full controls, slightly reduced type;
- large: everything.
The plot always gets remaining space; chrome never overlaps marks. There is also a **thumbnail mode** (used by social images and dashboards' mini-charts): title + plot + attribution only, minimal labelling.

## 7. Accessibility

- The frame is keyboard navigable in reading order; tabs, settings, timeline, and selector are operable without a pointer.
- The chart exposes a text alternative: title, subtitle, and a structured summary (the table tab is the canonical accessible representation).
- Focus indicators and contrast follow the theme's validated tokens.

## Test expectations

- Breakpoint matrix: at each named width, assert which chrome elements are present (no pixel overlap, no clipped text).
- Title annotation logic: (selection, time state, relative mode) → exact title string.
- Download outputs: PNG/SVG dimensions and CSV contents match the displayed view byte-for-byte against fixtures.
- URL state: every control documented here round-trips through the URL.
