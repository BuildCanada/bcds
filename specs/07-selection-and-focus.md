# 07 — Entity Selection & Focus

**Status:** Draft
**Covers:** The entity selector, selection semantics, and the hover/focus/dimming interaction model. Reference behavior: owid-grapher `selection/`, `entitySelector/`, `focus/`, `interaction/`.

## 1. Selection model

- **Selection** = the set of entities currently shown on the chart. Modes:
  - `multi` (default): any number; add/remove freely.
  - `single`: choosing an entity replaces the previous one.
  - `fixed`: the author's selection cannot be changed.
- Selection persists in URL state (`entities=`) and survives tab and chart-type switches; the map tab maintains its own highlight selection that syncs with chart selection where sensible.
- Authors may bound the choosable set (`includedEntities`/`excludedEntities`).

## 2. The entity selector

- Opens from an "Edit {entities}" affordance (label uses the dataset's entity noun: "Edit provinces").
- Contents:
  - **Search** with alias- and accent-tolerant matching ("quebec" finds "Québec").
  - **Grouping** from entity metadata (e.g., regions; "Territories") with group-level select.
  - **Sort** by name or by any numeric column ("sort by Total spending"), ascending/descending, showing the sort value beside each entity.
  - Select all / clear.
- Entities with no data in the current view appear greyed with a "no data" tag, still selectable.
- At small sizes the selector becomes a full-height drawer.

## 3. Hover / focus / dimming

Three interaction states drive every chart type uniformly:

| State | Trigger | Visual |
|---|---|---|
| **Idle** | nothing hovered/focused | all series full opacity |
| **Hover** | pointer over a mark, series label, or legend item | hovered series emphasized; all others dimmed (reduced opacity, lighter labels) |
| **Focus** | click a series/label/legend item (toggle); `focusedSeries` at load | focused set stays emphasized regardless of hover; persists in URL (`focus=`) |

Rules:

- Hover is transient and never alters focus.
- Dimmed series remain visible and hoverable (dimming ≈ 0.2–0.5 opacity by role, themed).
- Focus and selection are independent: focus highlights *within* the selected set.
- Keyboard: series are focusable via keyboard with the same emphasis behavior; Escape clears focus.

## 4. Empty and degenerate states

- Empty selection → a friendly prompt with the entity selector opened ("Select provinces to compare").
- Selection with no data in the current time window → "No data for the current selection" panel with a one-click reset to the full data range.

## Test expectations

- Selection survives: tab switch, chart-type switch, time change, URL round-trip.
- Search matches aliases, accents, codes ("ON" finds Ontario when codes exist).
- Hover/focus state transitions: property-based tests over event sequences ensure the state machine never strands a dimmed chart with nothing emphasized.
- Single mode replaces; fixed mode renders no selection affordances.
