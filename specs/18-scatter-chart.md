# 18 — Scatter Chart

**Status:** Draft
**Purpose:** Relationship between two metrics across entities, optionally with size and colour encodings and time trails. Reference behavior: owid-grapher `scatterCharts/`.

## Data consumed

- Entities × time × `x` and `y` metrics (both required), optional `size` (numeric) and `colour` (categorical or numeric) bindings.
- x and y values are matched at common times; each column's tolerance may borrow nearby values. Entities lacking a matched (x, y) pair are excluded (listed under "No data").
- `size`/`colour` default to generous tolerance (a stable attribute like population or region shouldn't disappear for one missing year).

## Marks & layout

- One point per entity (snapshot) at the selected time.
- **Connected scatter (trails):** when a time *range* is selected, each entity renders its path over time — points joined in time order, ending in a direction marker; a small time-direction legend appears. An **endpoints-only** toggle keeps just first and last points.
- **Size:** square-root scaling between min/max radii; no size binding → uniform radius.
- **Entity labels** near points for the largest/selected/focused entities, decluttered by priority (selection > focus > size), capped (~20).
- **Comparison lines:** optional `y = x` or arbitrary labelled reference lines; quadrant shading optional.

## Axes

- Both axes value axes; independent linear/log toggles; manual domains; optional "remove points outside domain".

## Colour

- Categorical `colour` (e.g., region): categorical bins + legend; hovering a bin highlights members.
- Numeric `colour`: binned or continuous ramp per `04 §3`.
- No binding: theme primary.

## Interaction

- Hover a point/trail → emphasize entity (full trail), dim others; tooltip with x, y (+ size/colour values), time, tolerance notes; trails show start→end values.
- Click toggles selection (where enabled); legend interactions per `05`.
- **Zoom to selection** (setting): reframes domains around selected entities.

## Relative mode ("average annual change")

Where exposed: each entity collapses to one point of average annual % change in x and y between the window's endpoints; axes force linear, format as %/year.

## Time behavior

Single handle → snapshot; range → trails; play animates the snapshot point positions through time (a core video primitive — see `25`).

## Faceting

Not faceted in v1.

## Static rendering

Identical; labels resolved; trails keep direction markers.

## Edge cases

- Log scale excludes non-positive values per axis (reported).
- Single entity: full trail with start/end time labels.
- Heavy overplot: labels yield first, then point opacity reduces.

## Test expectations

- Time matching: x at 2020, y at 2021 with tolerances → exact pairing fixture.
- Trails: point order, endpoints-only filtering, direction marker at latest time.
- Average annual change math vs hand-computed fixture incl. zero-start guard.
- Label declutter priority (selection > focus > size) deterministic.
- Size scaling: value→radius table at domain extremes.
