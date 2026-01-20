# colour-tokens

Canadian colour tokens for design systems. This package provides a curated collection of colour definitions in both CSS and TypeScript formats, designed for use in Canadian government and enterprise applications.

## About

This package contains colour tokens organized into:

- **Colours**: Individual colour scales with 50-950 shades (e.g., auburn, lake, pine, steel)
- **Themes**: Chart-ready colour blends for data visualization

All tokens are generated from CSS variables and compiled to TypeScript with full type definitions.

## Usage

### CSS Imports

Import colour tokens directly in your CSS:

```css
@import "colour-tokens/styles/colours/lake.css";
@import "colour-tokens/styles/themes/charts/twelve-tone/auburn-cool-bend.css";

/* Or import all colours */
@import "colour-tokens/styles/main.css";
```

### TypeScript Imports

Import colour tokens in your TypeScript/JavaScript code:

```typescript
// Import individual colours
import { auburn, lake, pine } from "colour-tokens";

// Access colour scales
console.log(auburn["500"]); // "#d85b5b"

// Import chart themes
import { auburn_cool_bend, pine_lake_blend } from "colour-tokens/styles/themes/charts/twelve-tone";

// Import everything from styles
import * as styles from "colour-tokens/styles";
```

## Downloading

```bash
npm install @buildcanada/colours
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Add or modify colour definitions in `src/styles/`
4. Run the build script (`bun run build`) to generate TypeScript files and barrel exports
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT
