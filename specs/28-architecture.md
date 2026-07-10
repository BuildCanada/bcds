# 28 — Architecture & Technical Decisions (charts2)

**Status:** Ready
**Covers:** The technical decisions behind `@buildcanada/charts2`, the v2 rebuild executing specs 01–27. Unlike specs 01–27 (functional), this spec is deliberately technical. Decisions here were validated by spikes on 2026-06-11.

## 1. Shape

**Pure layout core + React as the single renderer.**

```
(definition, dataset, viewState, theme, size, measurer)
   → layoutChart()            pure TypeScript, no DOM, no framework
   → ChartScene               numeric geometry + computed models
   → <SceneSVG/>              React JSX — the ONLY scene→SVG renderer
   → browser (interactive)  |  renderToStaticMarkup (CLI/static)
   → resvg (PNG)            |  ffmpeg (video, later pass)
```

- `src/core/` must not import React or DOM APIs (enforced by review + lint).
- `src/react/` renders scenes and owns interactivity (pointer/keyboard/URL state). Hover/focus apply styling via `seriesKey`; they never trigger relayout.
- `src/cli/` calls the same `SceneSVG` via `renderToStaticMarkup` — one render path, zero drift between interactive and exported output.
- Alternatives considered and rejected: OWID-style MobX/React engine (determinism patched not designed; layout untestable without DOM); fully framework-agnostic core emitting SVG strings (two render paths to keep in sync); Vega-Lite/Plot base (spec-defining chrome layer is custom anyway; polish ceiling capped).

## 2. Determinism rules (hard requirements)

Same inputs → byte-identical SVG. Enables golden-corpus testing (spec 26) and frame-exact video (spec 25).

1. No `Date.now`, `Math.random`, `useId`, or environment-derived values anywhere in core or SceneSVG. Element ids derive from slug + stable mark keys.
2. All coordinates route through one `round2()` (no float noise, no `1e-7`, no `-0`).
3. No `Intl` in core — number formatting uses static d3-format locale objects (en-CA, fr-CA). ICU version drift is a determinism bug.
4. No canvas/DOM text measurement — see §3.
5. Scene node keys are stable across re-layouts (entity/metric-derived, never array indices).
6. React/react-dom are pinned for the golden-corpus CI job; version bumps re-bless goldens in a dedicated PR.

## 3. Fonts

Brand fonts: **Söhne Kräftig** (headings/UI), **Financier Text** (long-form), **Founders Grotesk Mono** (tabular numerals). Sources: `packages/components/src/assets/fonts/*.woff2`.

- **Measurement:** `scripts/extract-font-metrics.ts` (fontkit, build-time) extracts per-glyph advances and GPOS pair kerning for a fixed charset (printable Latin-1 + French accents + typographic set incl. NBSP/narrow-NBSP/true-minus) into **committed JSON tables** (`src/fonts/metrics/*.json`). Layout measures all text from these tables — identical in browser, CLI, CI.
- **Spike findings (2026-06-11):**
  - resvg's fontdb **cannot read WOFF2** ("malformed font"). The script therefore also decompresses WOFF2→TTF (wawoff2) into a **gitignored** `.fonts-cache/` used only for rasterization. Regenerable on demand.
  - Exact family names matter: the font reports **"Söhne Kräftig"** (umlaut), not "Söhne Kraftig". Themes take family names from the metrics tables' `familyName`, never hand-typed strings.
  - Monospace sanity check: Founders Grotesk Mono extracts 0 kern pairs (correct for a mono font); Söhne 5,343; Financier 5,018.
- **Licensing (Klim):** the published npm package ships only metrics JSON — never WOFF2/TTF binaries. CLI rasterization takes a font directory (default: the monorepo cache; consumers point `--fonts` at their licensed copies). Static SVG defaults to font-family references (no embedding); outlining is the publish-safe option (later pass).
- **Ligatures:** SVG text renders with `liga`/`calt` disabled so the additive advance+kerning width model is exact.

## 4. Dependencies (final, validated)

| Concern | Choice | Note |
|---|---|---|
| Font metrics | fontkit (devDep, build-time only) | reads WOFF2 natively; GPOS via `layout()` |
| WOFF2→TTF | wawoff2 (devDep, build-time only) | for the resvg cache |
| Raster | @resvg/resvg-js | `loadSystemFonts: false` + explicit `fontFiles`; deterministic (spiked under Bun) |
| CSV | d3-dsv | no type-inference magic; manifest owns typing |
| CLI | citty | ESM-first, tiny |
| Schemas | zod v4 | manifest + definition parsing, actionable errors |
| d3 | d3-scale, d3-array, d3-shape, d3-format **only** | d3-time excluded: time grains are integer ordinals (fiscal-year = start year; quarter = y×4+(q−1); date = epoch days). d3-shape used only inside SceneSVG to serialize `Vec2[]`→path strings |
| State | none (no MobX) | plain React state over pure functions |

## 5. Package & monorepo

- `packages/charts2`, name `@buildcanada/charts2@0.x` while incubating; cutover to `@buildcanada/charts@2.0.0` later. Side-by-side with the legacy package (TradingPost pins `^0.3.9`) and with the independent `packages/charts3` slice (kept untouched by decision 2026-06-11).
- Exports: `.` (core + react), `./core` (headless), `./styles.css`; bin `bcds-charts` → `dist/cli/index.js` (shebang `#!/usr/bin/env node`, added by build.ts).
- Conventions cloned from `packages/components`: bun build.ts (tsc emit + asset copy), tsconfig bundler-mode, vitest happy-dom, stories aggregated by root Storybook.
- Workspace bin is dangling until first build — run `bun run build:charts2` after clone.

## 6. Frozen contracts

`src/core/types.ts` (Manifest/ColumnMeta/Dataset/ResolvedValue/ChartDefinition/ViewState), `src/core/scene/nodes.ts` (SceneNode/ChartScene/HoverModel/round2), `src/core/text/measurer.ts` (TextMeasurer/FontMetricsTable), `src/core/theme/types.ts` (Theme). Implementation milestones code against these; changes require cross-milestone coordination.

ResolvedValue is where **missing ≠ zero** lives: every chart, tooltip, and table cell consumes `{status: "value"|"missing"}`, never a bare number.

## 7. Testing layers (per spec 26)

1. Pure-function contracts (data, format, colour, text, layout) — vitest, no DOM.
2. SVG golden corpus — `renderToStaticMarkup` output diffed as strings against committed goldens (byte determinism makes this exact, no normalization regexes).
3. Interaction tests — happy-dom over the React layer (emphasis reducer property tests, URL round-trips).
4. CLI determinism — render twice, `cmp`.
