# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: @buildcanada/charts

Build Canada charts: a pure-function layout core with a single React SVG renderer, deterministic headless rendering, and a CLI. Functional and architectural specs live in `specs/` (architecture: `specs/28-architecture.md`).

## Commands

```bash
bun install              # Install dependencies
bun run storybook        # Run Storybook on port 6006
bun run build            # Build Storybook for production
bun run build:packages   # Build all workspace packages
bun run serve-storybook  # Serve production build on port 6006
bun test                 # Run all tests
bun test src/path/to/file.test.ts  # Run single test file (from the package dir)
bun run typecheck        # TypeScript check
bun run charts -- <args> # Run the charts CLI from source
```

## Architecture

The charts package (`packages/charts`) is split into a DOM-free core and a thin React layer:

- `src/core/` — pure functions, no DOM or React: data layer, chart definition parsing, formatting, colour/theming, text metrics, layout. `layoutChart({ definition, dataset, size })` produces a `ChartScene`.
- `src/react/` — `SceneSVG` (the only renderer) + `Chart` + interactive chrome (tooltip, timeline, entity selector, tabs, settings, data table).
- `src/cli/` — `charts render|validate|scaffold|install-skill`; renders the exact same SVG as the browser via `renderToStaticMarkup`.
- `src/fixtures/` — committed fixture datasets, loadable by name in tests/stories/CLI.
- `src/corpus/` — golden SVG corpus + bless script (`bun run corpus:bless`).
- `src/stories/` — Storybook stories under `Charts/`.
- `samples/` — CLI-ready chart definitions, tested against included fixtures.

## Workspace Packages

- `packages/charts` — the charting library and CLI (`@buildcanada/charts`)
- `packages/colours` — colour palettes and themes (`@buildcanada/colours`)
- `packages/components` — shared UI primitives and styles (`@buildcanada/components`)

## Code Style

- Double quotes for string literals
- Use type definitions for function params and return values
- Avoid the `any` type
- Core code must stay DOM-free and React-free; rendering happens only in `src/react/`
- BEM conventions for CSS in separate .scss files
- Entry point for styles: `src/react/styles/charts.scss`
- Tests use Vitest with `it()` and `expect()` from `vitest`

## Peer Dependencies

This package expects the following to be provided by the consuming application:
- `react` ^19.0.0
- `react-dom` ^19.0.0
