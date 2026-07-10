# 25 — Motion & Video

**Status:** Draft
**Covers:** (a) in-page micro-motion, (b) timeline animation, (c) reveal/entrance animation, and (d) CLI video generation. OWID has only (a) and a timeline play button; (c) and (d) are novel. Scripted multi-scene "data stories" are explicitly out of scope for v1.

## 1. Principles

- Motion always serves the data story: things move because the *data* changed (time advanced, sort changed, value revealed) — never decorative drift.
- Every animation is a deterministic function of (definition, data, motion settings): the same inputs produce the same frames. Easing/durations come from the theme's motion tokens.
- Reduced-motion preference disables in-page animation (state changes snap); exports ignore the preference (they're authored artifacts).

## 2. In-page micro-motion

- Bars/rows animate length and re-sort position on time or sort changes (discrete bar, stacked discrete bar, dumbbell, slope).
- Map fills cross-fade between time steps.
- Hover/focus emphasis transitions are near-instant (~100–150 ms).
- Timeline play per `08 §3` (~4 s sweep, 100–200 ms/step).

## 3. Timeline animation (data evolving over time)

The first export motion type. Per chart type:

| Chart | Animated form |
|---|---|
| Line / stacked area | progressive draw left→right along time; end-labels track the frontier; y-domain either fixed to final (default, steady axes) or adaptive |
| Discrete bar | **bar race**: lengths grow and rows re-rank per time step, labels tracking |
| Map | fills stepping/cross-fading through time, time annotation counting |
| Scatter | points gliding along trajectories (trail optionally accruing) |
| Stacked bar / marimekko / treemap | segments/tiles resizing per step |

Settings: total duration (default ~12 s for video vs 4 s in-page), per-step hold, start/end times, optional end-card hold (final frame lingers N seconds).

## 4. Reveal / entrance animation (social clips)

A polished entrance for a *static* view — for charts with or without a time dimension:

1. Chrome fades in (title, axes, frame) —
2. Marks reveal: lines draw, bars grow from baseline (staggered ~30–60 ms per series, in sort order), map fills sweep by bin, points pop in by size —
3. Annotations land last (value labels, comparison lines, end-card note).

Authors choose `reveal`, `timeline`, or `reveal+timeline` (entrance, then time sweep). Each chart-type spec's marks define its reveal primitive; no per-chart custom choreography in v1.

## 5. CLI video generation

```
charts animate <definition> [--motion timeline|reveal|reveal+timeline] [flags]
```

- Inherits all `24` flags (theme, locale, state, presets) plus:

| Flag | Meaning | Default |
|---|---|---|
| `--duration` | total seconds | motion-type default |
| `--fps` | frames per second | 30 (60 available) |
| `--format` | `mp4` \| `webm` \| `gif` \| `frames` (PNG sequence for external compositing) | `mp4` |
| `--preset` | `social` (1080×1080), `story` (1080×1920), `landscape` (1920×1080) | landscape |
| `--hold` | end-card seconds | 2 |
| `--loop` | for gif/webm | off |

- Output is rendered frame-exact from the same engine as static rendering: frame N is a pure function of inputs — re-running yields identical video. Audio is out of scope.
- The final frame equals the static render of the end state (so a video and its poster image always match).
- Batch mode (`24 §4`) supports animate entries; the image service exposes the same presets for automated social clips.

## Edge cases

- Sparse/irregular time steps: animation interpolates *position/size* between real data states but never fabricates intermediate data values; step pacing follows the timeline spacing rules (`08 §2`).
- Series entering/exiting mid-sweep (new program appears): enters with the reveal primitive at its first time, exits by fading.
- Single-time datasets: `timeline` is unavailable (validation error suggests `reveal`).

## Test expectations

- Frame determinism: hash of frames stable across runs; golden-frame comparisons at t=0, mid, end.
- Final frame ≡ static render of end state, per chart type.
- Bar-race re-ranking: rank trajectory fixture (entities swapping places) → exact rank-per-frame table.
- Duration/fps math: frame counts exact; hold frames appended.
- Reveal stagger order matches sort order; reduced-motion snaps in-page only.
