# React 19 compatibility — TODO

This document tracks console warnings / errors that `@buildcanada/charts`
produces when mounted in a React 19 host (`react@19.x`, `react-dom@19.x`).
The chart still renders and is interactive, but each warning is worth
addressing before declaring full React 19 readiness.

Measured against `@buildcanada/charts@0.3.9` mounted on Next.js 16
(Turbopack) with React 19.2.3 and the registry-default peer auto-install
(`mobx@6.15.x`, `mobx-react@7.6.x`).

## 1. mobx-react peer dep doesn't include React 19

**Where:** `packages/charts/package.json` — `peerDependencies.mobx-react: "^7.6.0"`.

mobx-react 7.6 declares its own peer as `react: "^16.8.0 || ^17 || ^18"`,
so consumers on React 19 always see:

```
WARN  Issues with peer dependencies found
└─┬ mobx-react 7.6.0
  ├── ✕ unmet peer react@"^16.8.0 || ^17 || ^18": found 19.2.3
  └─┬ mobx-react-lite 3.4.3
    └── ✕ unmet peer react@"^16.8.0 || ^17 || ^18": found 19.2.3
```

mobx-react 9.x adds React 19 to its peer range and supports TC-39 stage
3 decorators natively (matching what `build.ts` now emits).

**Why this isn't a one-line bump.** Trying `mobx-react ^9.2.0` in this
workspace immediately fails ~95 tests with:

```
Error: [mobx-react] Cannot read "DataTable.props" in a reactive context, as it
isn't observable.
```

mobx-react 9 strictly enforces what `CLAUDE.md` already warns about
("Don't use `@computed` on getters that access `this.props`"). The
codebase has ~170 `@computed get x() { return this.props.x }` sites
that all need to lose either the `@computed` decorator or the
`this.props` read. Failing test files include `DataTable.test.tsx`,
`ScatterPlotChart.test.ts`, and many more.

**Suggested approach:** drop `@computed` from getters that only
forward `this.props.X` (since the memoization isn't doing useful work
when the input isn't observable anyway), then bump the peer dep in a
follow-up.

## 2. `Accessing element.ref was removed in React 19. ref is now a regular prop.`

**Where:** logged on every render of an `@observer`-decorated class.
Originates inside `mobx-react@7.6`'s `makeClassComponentObserver`,
which reads `element.ref` to forward refs through the observer wrapper.
React 19 removed that accessor and treats `ref` as a regular prop.

Fixed transitively by issue 1 — mobx-react 9 doesn't read
`element.ref`.

## 3. `React does not recognize the 'lineHeight' prop on a DOM element.`

**Where:** somewhere along the SVG `<text>` rendering chain in
`packages/charts/src/components/MarkdownTextWrap/MarkdownTextWrap.tsx`
and/or `packages/charts/src/components/TextWrap/TextWrap.tsx`. Both
spread caller-supplied `textProps` directly onto the `<text>` element
(`MarkdownTextWrap.tsx:753`, `TextWrap.tsx:330`), and at least one
caller (`grapher/legend/VerticalColorLegend.tsx:193`) does:

```tsx
textProps: { fill: style.color, ...style },
```

That spreads CSS-shaped fields onto the SVG element as DOM
attributes. `LegendTextStyle` only declares `color | fontWeight |
opacity`, but the chart-level style configs that feed in can extend
that, and at runtime React 19 sees `lineHeight` reach a DOM node and
warns. (React 18 tolerated it.)

**Suggested fix:** keep `textProps` strictly typed as
`React.SVGProps<SVGTextElement>`, and put any CSS-shaped fields
(`color → fill` already, plus `lineHeight`, `fontWeight`, `opacity`,
…) under a nested `style: { … }` rather than spreading them at the
top level.

## 4. `flushSync was called from inside a lifecycle method.`

**Where:** `packages/charts/src/grapher/core/Grapher.tsx:596`, inside
the `IntersectionObserver` callback set up in
`setUpIntersectionObserver`:

```ts
flushSync(action(() => { this.hasBeenVisible = true }))
```

The `flushSync` exists to dodge a Safari bug where the initial render
uses stale bounds; it predates React 19. React 19 logs a warning when
`flushSync` fires while React is still in a render/commit phase, which
this can do if the `IntersectionObserver` entry is delivered in the
same task as the mount commit.

**Why this isn't a quick fix.** Wrapping in `queueMicrotask(() =>
flushSync(...))` silences the warning but breaks
`src/grapher/mapCharts/MapTooltip.test.tsx` (the test depends on the
chart being rendered synchronously after the observer fires, asserting
`'path[data-feature-id="Iceland"]'` is present). The Safari workaround
also depends on this being synchronous. A real fix needs a coordinated
change: either move the test to wait for the deferred render, or
replace `flushSync` with a different mechanism that the Safari bug
also accepts.

The `flushSync` use in
`packages/charts/src/components/reactUtil.ts:16` is fine — it's
outside the render path.

## 5. `Encountered two children with the same key, '0'.`

**Where:** observed during `MapTooltip` render and around `<tspan>`
lists. Index-only keys at `TextWrap.tsx:344` / `MarkdownTextWrap.tsx`
likely collide when multiple list nodes are rendered as siblings of
the same parent.

**Suggested fix:** prefix the index with the surrounding context
(line content hash, parent id, …) so keys don't collide across
sibling lists.

## Out of scope

- The `Image with src "..." has either width or height modified, but
  not the other` warning observed when integrating the charts package
  into TradingPost is from TradingPost's own navbar, not charts.
- The `<line> / <g> / <text> is unrecognized in this browser` stderr
  noise during axis tests is happy-dom's test environment, not React
  19.
