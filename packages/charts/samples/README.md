# Charts2 samples

These definition files are ready to use with the CLI from the package root:

```bash
bun src/cli/index.ts render samples/line-provincial-budgets.json --out chart.svg
bun src/cli/index.ts validate samples/stacked-area-government-debt.json
```

Each `samples/*.json` file is covered by `src/samples.test.ts`.
