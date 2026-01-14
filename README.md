# @buildcanada/charts

A configurable data visualization library for creating interactive charts. Extracted from [Our World in Data's](https://ourworldindata.org) Grapher.

## Installation

```bash
npm install @buildcanada/charts
# or
yarn add @buildcanada/charts
```

## Peer Dependencies

This library requires the following peer dependencies:

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "mobx": "^6.13.0",
  "mobx-react": "^7.6.0"
}
```

## Development

```bash
# Install dependencies
yarn install

# Run Storybook for development
yarn storybook

# Run tests
yarn test

# TypeScript check
yarn typecheck
```

## Components

### Grapher

The main charting component supporting multiple visualization types:
- Line charts
- Bar charts
- Scatter plots
- Maps
- Stacked area charts
- And more...

### Explorer

A data explorer that wraps Grapher and adds additional controls for exploring complex datasets.

## Architecture

- Built with **React 19** and **MobX 6** for state management
- Uses TC-39 stage 3 decorators
- TypeScript throughout
- SCSS for styling with BEM conventions

## License

MIT
