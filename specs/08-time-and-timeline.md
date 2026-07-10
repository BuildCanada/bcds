# 08 — Time & the Timeline

**Status:** Draft
**Covers:** Time selection semantics, the timeline control, playback, and tolerance matching. Reference behavior: owid-grapher `timeline/` and core-table time transforms.

## 1. Time selection semantics

- A chart's time state is a **range** `[start, end]`; a **single time** is the degenerate range `start == end`.
- Chart types declare which they use:
  - range: line, stacked area, stacked bar, scatter (trails), map (animated)
  - two endpoints: slope, dumbbell (time-range mode)
  - single: discrete bar, stacked discrete bar, marimekko, map (static), scatter (snapshot)
- Symbols `earliest`/`latest` resolve against the data at render time, so "latest" charts update when data updates.
- Selection always **snaps to times present in the data** — never an interpolated in-between time.
- Collapsing a range to a single time switches multi-type definitions to their single-time type (line → discrete bar) and back.

## 2. The timeline control

- A slider across the chart bottom showing the available time span, with:
  - **two handles** for range charts (draggable independently or together), **one handle** for single-time charts;
  - tick marks at available times;
  - a **play button**;
  - the current selection rendered as text ("2014–15 to 2024–25").
- **Spacing:** proportional to time by default; switches to equal spacing when the data is sparse/irregular enough that proportional spacing would crush most points into a corner (many points, long span, few large gaps dominating).
- **Keyboard:** arrows step one time; Home/End jump to extremes; handles cannot cross.
- `timelineRange` can bound the explorable span tighter than the data; `hideTimeline` removes the control and locks time.

## 3. Playback

- Play advances the **end handle** through available times (start handle fixed in range mode; both move in single-time mode), then stops; replay restarts from the beginning.
- Total sweep targets ~4 seconds regardless of point count (per-step duration clamped ~100–200 ms), so dense and sparse datasets feel equally paced.
- During play, the chart re-renders each step exactly as if the user had dragged there (same title annotation, same marks). This same engine drives video generation (`25`).

## 4. Tolerance (borrowed values)

- A column's `tolerance` allows a missing value at time T to be filled from the nearest time within ±tolerance (direction configurable). Used by maps, scatter axes, bars at a target time, and the table.
- Borrowed values are always **marked**: tooltip notice ("Data from 2019"), table annotation, and never extrapolated beyond the data extent.
- Multi-column charts (scatter) match x and y at the nearest common times within tolerance.

## Edge cases

- One time point in data: timeline hides; chart renders the single-time form.
- Non-contiguous series (gaps): line charts break the line unless the column opts into interpolation; playback steps only on existing times.
- Fiscal-year and quarterly grains: stepping, snapping, labels and play all operate on the grain's natural ordering.

## Test expectations

- Snapping: arbitrary requested times resolve to nearest available, table-driven per grain.
- Range/single switching: `types: [line, discrete-bar]` flips exactly at `start == end` and restores on expand.
- Playback determinism: the sequence of rendered times for a dataset is a pure function of the data (drives video tests).
- Tolerance: (series with gaps, tolerance n, direction) → exact filled/missing pattern; all borrowed cells flagged.
