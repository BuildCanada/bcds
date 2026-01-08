# Follow-up Prompt for Completing @buildcanada/charts Extraction

Copy and paste this prompt to continue the work:

---

## Context

I've been extracting a standalone data visualization library from OWID's grapher/explorer packages into `@buildcanada/charts`. The package structure is created at `packages/@buildcanada/charts/` with:

- Configuration system (`src/config/`) - ChartsProvider, ChartsConfig for customizable branding
- Source files copied from grapher, explorer, core-table, types, utils, components
- OWID branding made configurable in Footer.tsx
- Sentry removed from 4 files (replaced with console.warn)
- Main exports in `src/index.ts`
- README documentation
- Example app at `examples/buildcanada-charts-demo/`

## Remaining Work

**The main task: Update all internal imports throughout the package.**

All copied source files still import from `@ourworldindata/*` packages. These need to be changed to relative imports pointing to our internal copies:

| Old Import | New Import (relative path varies by file depth) |
|------------|------------------------------------------------|
| `@ourworldindata/types` | `../types` or `../../types` etc. |
| `@ourworldindata/utils` | `../utils` or `../../utils` etc. |
| `@ourworldindata/components` | `../components` or `../../components` etc. |
| `@ourworldindata/core-table` | `../core-table` or `../../core-table` etc. |
| `@ourworldindata/grapher` | Should import from local grapher files |
| `@ourworldindata/explorer` | Should import from local explorer files |

## Instructions

1. **Update imports in all files under `packages/@buildcanada/charts/src/`**
   - Use find/replace or scripted approach to update imports
   - Calculate correct relative paths based on file location
   - For files in `src/grapher/`, imports to types should be `../../types`
   - For files in `src/grapher/core/`, imports to types should be `../../../types`

2. **Create index.ts files for each module** if missing:
   - `src/utils/index.ts` - export all utilities
   - `src/components/index.ts` - export all components
   - `src/core-table/index.ts` - should already exist

3. **Run typecheck and fix errors**:
   ```bash
   cd packages/@buildcanada/charts
   yarn typecheck
   ```

4. **Fix any missing exports** - Some files may import things we didn't copy (like database types). Either:
   - Add stub types
   - Remove the import if unused
   - Copy the missing file

5. **Test the example app**:
   ```bash
   cd examples/buildcanada-charts-demo
   yarn install
   yarn dev
   ```

## Key Files to Reference

- `packages/@buildcanada/charts/src/index.ts` - Main exports
- `packages/@buildcanada/charts/src/types/index.ts` - Type exports
- `packages/@buildcanada/charts/src/config/ChartsConfig.ts` - Configuration interface
- `packages/@buildcanada/charts/README.md` - Documentation

## Approach Suggestion

Use a script to do bulk replacement:
```bash
# From packages/@buildcanada/charts/src/
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/@ourworldindata\/types/..\/types/g'
```

But be careful - the relative path depth varies. A smarter approach:
1. Process files by directory depth
2. Or use a node script that calculates correct relative paths

---
