# charts3 design decisions

`charts3` starts as a DOM-free chart engine with adapters on top. The core package can run in Bun/Node, browsers, CLIs, workers, and rendering services without `window`, `document`, canvas measurement, CSS transitions, or React lifecycle.

## Engine boundary

Inputs:

- dataset manifest and rows
- chart definition
- view state
- theme
- output size

Output:

- computed chart model
- deterministic SVG string

React is an adapter that hosts the SVG and will own pointer, keyboard, URL, and control state. It does not own chart computation.

## Video impact

Video is batch static rendering over explicit frame states:

```txt
frame index -> view state -> chart model -> SVG -> raster frame -> encoder
```

That keeps exported video aligned with interactive charts and static SVG/PNG. The final frame can equal a static render of the same end state because both paths call the same renderer.

## Animation rule

Browser animation may use `requestAnimationFrame`, but the animated value is explicit state. Exported video must not depend on DOM timing, CSS transitions, or browser layout.

## Text/layout rule

The first implementation uses deterministic text wrapping heuristics. Later improvements should add theme-provided font metrics rather than DOM measurement, so CI and render services produce stable output.

## Colour rule

Theme palettes and ramps are imported from `@buildcanada/colours/styles`. `charts3` assigns colours deterministically from theme palettes and fixed entity/metric overrides.

## Initial vertical slice

The first implemented chart types are:

- line
- discrete bar
- table

They share the same data parser, definition defaults, view state, theme resolution, formatting, model, and SVG renderer.
