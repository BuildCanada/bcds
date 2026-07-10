# 24 — CLI & Programmatic Rendering (Static)

**Status:** Draft
**Covers:** Producing chart images from the command line and from services, with no human-driven browser. Video is `25`. Reference behavior: owid-grapher's static SVG pipeline, thumbnail image API, and svgTester — unified here into one first-class interface rather than three internal tools.

## 1. Capabilities

```
charts render <definition> [--data <dataset>] [flags]   # one chart → image(s)
charts validate <definition|dataset>                    # all errors at once (per 01 §8)
charts preview <definition>                             # local interactive preview
charts batch <manifest>                                 # many renders, one invocation
```

- `<definition>` is a chart definition file (`02`), a published chart URL/slug, or an explorer URL (whose state pins one view).
- Output formats: **SVG** (canonical), **PNG** (rasterized at requested scale). One invocation may emit multiple sizes.
- Everything the interactive chart honours, the CLI honours: theme, locale, state overrides.

## 2. Flags / parameters

| Flag | Meaning | Default |
|---|---|---|
| `--out` | output path(s); `-` for stdout | `<slug>.<fmt>` |
| `--format` | `svg` \| `png` (repeatable) | `svg` |
| `--width` / `--height` | pixel dimensions (aspect clamped to sane bounds) | theme default (e.g., 850×600) |
| `--preset` | named size/chrome presets: `social` (1200×628), `square` (1080×1080), `thumbnail` (minimal chrome), `slide` (1920×1080) | none |
| `--scale` | raster scale for PNG (1, 2, …) | 2 |
| `--theme` | theme name (`04`) | brand default |
| `--locale` | `en` \| `fr` | `en` |
| `--state` | URL-style state overrides (`tab=map&time=2014-15..2024-25&entities=ON~QC`) | definition defaults |
| `--transparent` | no background fill | off |
| `--no-chrome` | plot only (no header/footer) for compositing | off |

## 3. Static rendering rules

- Output is the **same view a reader would see** with that definition + state: identical marks, colours, labels (per-spec "static rendering" sections apply — labels resolved, no hover affordances, time in title).
- Deterministic: same inputs → byte-identical SVG (no timestamps, random IDs, or environment-dependent text measurement). This is what makes visual regression testing (`26`) possible.
- Fonts embed or outline in SVG so output renders identically everywhere.
- Attribution/watermark per theme is always present except under `--no-chrome`.

## 4. Batch mode

A batch manifest lists renders (definition + state + outputs each); used for:

- dashboard pre-rendering and social-card generation on data updates,
- nightly regeneration of all published charts,
- the visual-regression corpus.
Failures report per-item and exit non-zero; successes aren't blocked by one failure.

## 5. Image service parity

The same engine exposes an HTTP surface (`/charts/<slug>.png?width=…&state…`) so social cards and dashboard thumbnails are URLs. CLI and service must be the same code path — one renderer, two entry points.

## Test expectations

- Determinism: repeated renders byte-identical; corpus hash check.
- Preset dimensions and aspect clamping table.
- `--state` equivalence: CLI state output ≡ interactive screenshot of same URL state (golden comparisons).
- Locale/theme flags alter only the expected properties.
- Batch: partial-failure semantics; exit codes.
