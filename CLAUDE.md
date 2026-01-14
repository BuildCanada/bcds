# CLAUDE.md

## Project: @buildcanada/charts (Standalone)

A configurable data visualization library for creating interactive charts. Extracted from Our World in Data's Grapher.

## Commands

```bash
bun install              # Install dependencies
bun run storybook        # Run Storybook on port 6006
bun run build            # Build Storybook for production
bun run serve-storybook  # Serve production build on port 6006
bun test                 # Run tests
bun run typecheck        # TypeScript check
```

## Architecture

- **React 19** with **MobX 6** for state management
- Uses TC-39 stage 3 decorators for `@computed` and `@action`
- Observable props are listed in `makeObservable()` calls, not decorated with `@observable`

## File Structure

```
src/
├── components/     # Reusable UI components
├── config/         # ChartsProvider context
├── core-table/     # Data table handling (OwidTable)
├── explorer/       # Explorer component (data explorer UI)
├── grapher/        # Main charting components
├── styles/         # Global SCSS styles
├── types/          # TypeScript types
└── utils/          # Utility functions
```

## Key Components

- **Grapher**: Main charting component with multiple visualization types
- **Explorer**: Data explorer that wraps Grapher and adds additional controls

## Code Style

- Double quotes for string literals
- Use type definitions for function params and return values
- Avoid the `any` type
- BEM conventions for CSS in separate .scss files
- Entry point for styles: `src/styles/charts.scss`

## MobX Pattern

```typescript
class MyComponent {
    someObservable = "value"

    constructor() {
        makeObservable(this, {
            someObservable: observable,
        })
    }

    @computed get derivedValue() {
        return this.someObservable.toUpperCase()
    }
}
```

**Important**: Don't use `@computed` on getters that access `this.props` - props aren't observable in mobx-react.

## Peer Dependencies

This package expects the following to be provided by the consuming application:
- `react` ^19.0.0
- `react-dom` ^19.0.0
- `mobx` ^6.13.0
- `mobx-react` ^7.6.0
