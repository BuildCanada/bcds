# BCDS Charts — Specification Overview

**Status:** Draft
**Scope:** Functional and design specification for rebuilding `@buildcanada/charts`, informed by owid-grapher and owid-explorer. These specs describe *what the system does*, not how it is built. The single exception is `01-data-format.md`, which is a concrete technical spec for input data.

## Why a rebuild

The first-pass extraction in `packages/charts` carried over OWID assumptions that block our uses:

- The entity/region model is hard-coded to world countries, continents, and World Bank income groups. Our data spans provinces, municipalities, ridings, departments, programs, and non-geographic categories.
- OWID URLs, schemas, and branding are embedded throughout.
- `@buildcanada/colours` (14 scales, 28 chart themes) exists but is not connected to chart rendering.
- There is no path to command-line image/video generation.

## Key uses (in priority order)

1. **Dashboards** for Build Canada and Canada Spends — embedded interactive charts with full self-serve exploration (tooltips, timeline, entity selection, tabs, downloads).
2. **Automatic and CLI-based graphic and video generation** — a chart definition plus data renders to SVG/PNG and animated video without a browser session a human is driving.
3. **Exploration of public datasets** — explorer pages where controls switch between many related chart configurations over a dataset.
4. **Brand variations** — every visual constant (colours, type, logo, frame) comes from a swappable theme so a second brand is a theme file, not a fork.

## Design principles

- **Entities are generic.** An entity is any named thing being compared: a province, a department, a program, an age group. Geography is one kind of entity, declared via metadata, not assumed.
- **Time is optional.** Charts must work for categorical snapshots (e.g., spending by department) with no time dimension at all.
- **Canadian data is first-class.** Fiscal years (e.g., 2024–25), French/English labels, CAD formatting, and Canadian geographies are supported natively.
- **One definition, every output.** The same chart definition renders interactively in a page, statically to SVG/PNG, and animated to video. Outputs may differ in chrome, never in the data story.
- **Functional parity with owid-grapher** for chart behavior (the parts that make OWID charts feel polished: tolerance matching, label decluttering, colour persistence, responsive chrome), without its data plumbing.

## Spec index

| Spec | Covers |
|---|---|
| `01-data-format.md` | Input data format (technical): tables, manifests, entities, time |
| `02-chart-definition.md` | The chart definition: fields, defaults, encoding slots |
| `03-axes-and-formatting.md` | Axes, scales, ticks, number/date formatting |
| `04-colour-and-theming.md` | Colour assignment, scales/bins, themes, brand variations |
| `05-legends.md` | Categorical and numeric legends |
| `06-tooltips.md` | Tooltip structure and behavior |
| `07-selection-and-focus.md` | Entity selection, hover/focus/dimming model |
| `08-time-and-timeline.md` | Time selection, timeline control, tolerance |
| `09-faceting.md` | Small multiples |
| `10-layout-and-chrome.md` | Title, subtitle, source, note, tabs, responsive frame |
| `11`–`20` | One spec per chart type (line, slope, discrete bar, stacked area, stacked bar, stacked discrete bar, dumbbell, scatter, marimekko, map) |
| `21-new-chart-types.md` | Types OWID lacks: waterfall, treemap, sankey, bullet/KPI |
| `22-data-table.md` | Table tab |
| `23-explorer.md` | Explorer experience and authoring model |
| `24-cli-rendering.md` | Command-line static rendering |
| `25-motion-and-video.md` | Animation system and CLI video generation |
| `26-testing.md` | Test strategy: functional contracts, visual regression, data fixtures |
| `27-scenarios.md` | Worked end-to-end scenarios used to pressure-test the specs |
| `28-architecture.md` | Technical decisions for the charts2 rebuild (the one technical spec besides 01) |
| `29-component-primitives.md` | Shared `@buildcanada/components` primitives used by chart chrome |

## Glossary

- **Entity** — a named thing being compared (province, department, country, category).
- **Metric** — a measured column of values (e.g., "Total expenditure").
- **Series** — one visual unit on a chart (a line, a set of bars). A series is either an entity or a metric depending on the series strategy (see chart specs).
- **Chart definition** — the declarative description of a chart (data binding + presentation choices). See `02`.
- **Dataset manifest** — metadata describing a data table's columns, entities, and sources. See `01`.
- **Theme** — the full set of brand visual decisions (palettes, type, logo, chrome). See `04`.
