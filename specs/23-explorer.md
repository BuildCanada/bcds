# 23 — Explorer

**Status:** Draft
**Covers:** The dataset-exploration experience: one chart, a control panel whose choices switch between many chart configurations, and an entity picker. Reference behavior: owid-explorer (packages/@ourworldindata/explorer), reauthored without the TSV/spreadsheet DSL.

## 1. The experience

- A page with: explorer title + subtitle, a **control panel** (dropdowns, radios, checkboxes), the **entity picker**, and the chart frame (full `10` chrome including tabs and table).
- Changing a control switches the displayed chart definition *in place*, preserving entity selection, time selection, and active tab whenever the new view supports them (else: nearest supported tab, time clamped to the new data range).
- The full state — control choices, entities, time, tab — lives in the URL; any explored view is shareable and CLI-renderable (`24`).
- Responsive: below tablet width, controls collapse into a "Customize" drawer; the entity picker becomes a dropdown.

## 2. Authoring model

An explorer is authored as a **declarative document** (not a TSV grid):

- **Header:** title, subtitle, default entity selection, entity noun, theme.
- **Controls:** ordered list; each has a name, a type (`dropdown` | `radio` | `checkbox`), an option list, and a default.
- **Views:** a matrix mapping control-choice combinations → a chart definition (or a patch over a shared base definition). Each view row may set any `02` field: dataset/columns, types, title, subtitle, colour scale, map config, etc.
- **Base definition:** shared fields stated once; views are sparse patches over it.
- Datasets are referenced per `01` (named datasets / URLs); per-view column overrides (rename, unit, tolerance) are allowed inline.

## 3. Choice resolution

The control panel is a constraint system over the view matrix:

- An option is **available** if at least one view matches it together with the currently chosen earlier controls (controls constrain left-to-right in declared order).
- Choosing a combination with no exact view falls back: keep current values where still valid → control's default → first available option. Unavailable options render disabled, not hidden; controls with only one possible value hide their chrome.
- Exactly one view must resolve for any reachable combination; authoring-time validation enumerates unreachable views and ambiguous combinations.

## 4. Entity picker

Per `07 §2`, plus explorer extras:

- **Sort by metric:** the picker can sort entities by any declared picker column (e.g., "sort provinces by population"), showing values inline; sort metric/direction persist in URL.
- The picker's entity set is the union across views, so switching views never silently drops a picked entity (entities without data in the current view show the no-data tag).

## 5. Relationship to single charts

Every explorer view *is* a chart definition: it can be extracted, published standalone, embedded, or rendered via CLI unchanged. The explorer adds only the control/view layer.

## Test expectations

- Constraint solver: fixture matrix → availability per combination; fallback order (current → default → first); single-view resolution; validation catches ambiguity/unreachability.
- State preservation across view switches (tab, entities, time) incl. unsupported-tab fallback.
- URL round-trip of the complete explorer state.
- Picker sort-by-metric ordering and persistence.
- A fixture explorer with all three control types and ≥2 datasets renders every reachable combination without error (exhaustive sweep — also the CLI smoke test).
