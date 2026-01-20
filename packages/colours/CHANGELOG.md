# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- `/src/styles/colours/*-alpha.css` - new CSS Theme files with transparency.
- `/src/styles/colours/*-alpha.ts` - new JS Colour Tones with transparency.
- `/src/styles/themes/tw-prose/prose-*.css` - new CSS Theme files for use with tailwind's typography plugin.
- `/src/styles/themes/tw-prose/prose-*.css` - new TS Colour Tones aliased to tailwind's styles. 

#### Transparency usage

Tailwind typically uses a `/n` syntax where `n` is an alpha stage. Here, we use `-n`.
In TS, use an import like `colours.aurora["100-50"]` to get the `aurora-100` swatch at 50% transparency.

#### Prose usage

**In CSS**
First, `@import` the main.css file from @buildcanada/colours.
Then, simply `@import` the desired theme for prose and let tailwind typography do the rest. 

Or, for custom components, here is a list of available keys:

```ts
export const keys = [
	"body"",
	"headings",
	"lead",
	"links",
	"bold",
	"counters",
	"bullets",
	"hr",
	"quotes",
	"quote-borders",
	"captions",
	"code",
	"pre-code",
	"pre-bg",
	"th-borders",
	"td-borders",
	"invert-body",
	"invert-headings",
	"invert-lead",
	"invert-links",
	"invert-bold",
	"invert-counters",
	"invert-bullets",
	"invert-hr",
	"invert-quotes",
	"invert-quote-borders",
	"invert-captions",
	"invert-code",
	"invert-pre-code",
	"invert-pre-bg",
	"invert-th-borders",
	"invert-td-borders",
];
```
