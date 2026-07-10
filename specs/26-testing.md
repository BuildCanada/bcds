# 26 — Testing Strategy

**Status:** Draft
**Covers:** How the rebuild is verified. Each spec carries its own "Test expectations"; this spec defines the shared machinery, fixtures, and gates. Reference: owid-grapher's per-chart `*.test.ts` contracts and `devTools/svgTester` visual regression — both patterns we adopt; the first extraction's gap (no rendering tests at all) is what this prevents.

## 1. Layers

1. **Data-layer contracts** — parsing, validation, time grains, tolerance, derived values (`01`, `08`). Pure-function, table-driven tests; the bulk of the suite.
2. **Chart-state contracts** — per chart type: series building, filtering, stacking/offset math, sort, label/declutter decisions, colour assignment — asserted on the chart's *computed model*, not pixels (`11`–`21`).
3. **Visual regression** — deterministic SVG rendering (`24 §3`) makes this cheap: render a fixture corpus to SVG, diff against committed references; any intentional change re-blesses references in the same PR. Corpus covers every chart type × representative states (default, relative, log, faceted, single-time, missing-data, French, each theme) × 3 sizes (thumbnail/default/wide).
4. **Interaction tests** — browser-driven: hover/focus/selection state machines, tooltip content, URL round-trips, keyboard operability, explorer control sweeps (`07`, `10`, `23`).
5. **Motion tests** — golden frames + frame-hash determinism (`25`).
6. **CLI tests** — flag matrix, determinism, batch semantics, CLI/interactive equivalence goldens (`24`).

## 2. Fixture datasets

A small, committed set of realistic fixtures exercises every behavior; specs reference them by name:

| Fixture | Exercises |
|---|---|
| `provincial-budgets` | fiscal years, multi-metric, provinces registry, missing cells |
| `federal-departments` | no geography, many entities (treemap/bar scale), long names |
| `population-snapshot` | no time dimension |
| `quarterly-gdp` | quarterly grain, revisions/projections |
| `riding-results` | electoral riding geography, categorical metric |
| `world-comparison` | country registry, OWID-parity behaviors |
| `government-debt` | shared-denominator ratios (debt ÷ GDP), stacked derived values, single-entity metric series (scenario `27 A`) |
| `housing-starts` | per-capita denominator on a province map, animation-stable bins, map video (scenario `27 C`) |
| `pathological` | duplicates, gaps, all-negative, single point, huge magnitudes, unicode/French names, zero/missing denominators |

Fixtures are real-shaped but tiny (fast tests) with hand-computable expected values.

## 3. Cross-cutting invariants (property tests)

Run against all fixtures × chart types:

- No missing value ever renders as zero.
- Tooltip value ≡ table value ≡ CSV value for the same cell.
- Same inputs → same output (colour assignment, layout, SVG bytes, video frames).
- URL state round-trips losslessly for every interactive control.
- Theme swap changes only themed properties.
- Every rendered text element fits its bounds (no clipping/overlap) at all corpus sizes.

## 4. Gates

- PR gate: layers 1–2 + changed-area visual diffs + lint.
- Merge gate: full visual corpus, interaction suite, CLI determinism.
- Data-release gate (separate from code): `charts validate` + batch re-render of published charts with diff review.

## 5. Accessibility checks

Automated: contrast (themed tokens), keyboard reachability of all controls, presence of text alternatives/table parity. Manual audit per release for screen-reader flows.
