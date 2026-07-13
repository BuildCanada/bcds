# 29 — Component Primitives for Chart Chrome

**Status:** Draft
**Covers:** Shared UI primitives from `@buildcanada/components` used by chart chrome. This spec defines the component contracts needed by `charts`; chart behavior, data state, and rendering remain owned by the chart package.

## 1. Goal

`charts` should build its non-plot chrome from the shared Build Canada component package wherever a reusable primitive exists. The component package owns accessible, branded controls. The chart package owns chart state, data semantics, layout decisions, and static export behavior.

Required outcomes:

- Chart chrome looks and behaves consistently with the rest of Build Canada products.
- Components are generic enough for Build Canada and Canada Spends without chart-specific imports.
- Interactive charts, static render previews, Storybook stories, and tests can all use the same primitives.
- Components expose native semantics and ARIA hooks needed by chart controls, rather than forcing charts to wrap or fork them.

## 2. General Requirements

All chart-facing primitives:

- export from `@buildcanada/components`;
- include their package styles through stable component-level SCSS entry points;
- accept `className`, `id`, `disabled`, `aria-*`, and `data-*` attributes;
- forward refs to the interactive DOM element where applicable;
- support controlled usage;
- render without depending on browser-only globals during server/static rendering;
- avoid chart, data, theme, or MobX imports;
- use Build Canada design tokens, with brand differences expressed through tokens or CSS variables.

Component class names use the component package namespace (`bc-*`). Chart-specific layout classes remain in `charts` (`bcds2-*`).

## 3. Button

Use for simple chart commands: select all, clear, sort direction, download, share, settings, play/pause, and full-screen.

Required API:

- `variant`: `primary`, `secondary`, `ghost`, `danger`;
- `size`: `sm`, `md`, `lg`;
- optional `iconLeft` and `iconRight`;
- icon-only mode with a required accessible name;
- pass-through support for `type`, `aria-pressed`, `aria-expanded`, `aria-controls`, and `aria-haspopup`;
- `asChild` or equivalent composition only if native button semantics remain testable.

Behavior:

- Defaults to `type="button"` when rendered as a button.
- Never changes width because loading, pressed, or expanded state changes.
- Keeps a visible focus indicator in all variants and themes.

## 4. Text Field and Search Field

Use for entity selector search and data table search.

Required API:

- `label` for visible labels;
- `aria-label` or visually hidden label support for compact chart chrome;
- `type`, including `text`, `search`, `number`, and `email`;
- `value`, `defaultValue`, `onChange`, `placeholder`, `autoComplete`;
- optional leading/trailing icon slots;
- optional clear action for search fields.

Behavior:

- The input remains the focus target.
- Search fields do not submit forms by default.
- Error/help text is linked with `aria-describedby`.

## 5. Checkbox

Use for binary settings and multi-select lists.

Required API:

- controlled and uncontrolled checked state;
- `indeterminate`;
- visible label and accessible-name-only modes;
- `value`, `name`, `disabled`;
- ref forwarding to the native input.

Behavior:

- The native checkbox remains present for form and accessibility semantics.
- The hit target includes the visual control and label.
- Mixed state sets both the visual state and the DOM indeterminate property.

## 6. Radio Group

Use for mutually exclusive settings such as scale mode, relative/absolute mode, or facet options.

Required API:

- `value`, `defaultValue`, `onValueChange`;
- `name`;
- `options` with label, value, disabled, and optional description;
- visible legend or accessible-name-only legend;
- horizontal and vertical orientation.

Behavior:

- Uses fieldset/legend or equivalent ARIA group semantics.
- Arrow keys move within the group; Tab enters and exits the group predictably.
- URL-backed chart state can fully control the selected value.

## 7. Select

Use for compact option lists such as entity sort order.

Required API:

- `label` or accessible-name-only label;
- `value`, `defaultValue`, `onChange`;
- options and option groups;
- `placeholder`, `disabled`, `required`;
- full native select support unless a custom select is explicitly required.

Behavior:

- Native select behavior is preferred for chart chrome.
- Long labels truncate only visually; the full option text remains available to assistive technology.

## 8. Segmented Control and Tabs

Use for chart type tabs, table scope toggles, and other small mode switches.

Required API:

- controlled `value` and `onValueChange`;
- item labels, values, disabled state, and optional icons;
- `aria-label` or visible label;
- `orientation`;
- `mode`: `tabs` for view switching, `toggle` for toolbar-style options.

Behavior:

- `tabs` mode uses tablist, tab, and tabpanel semantics.
- `toggle` mode uses buttons with `aria-pressed`.
- Arrow keys, Home, and End move focus within the control.
- Selection state is visually clear without relying on colour alone.

## 9. Slider and Range Slider

Use for timeline controls and bounded numeric settings.

Required API:

- single-value and range-value modes;
- `min`, `max`, `step`, `value`, `defaultValue`, `onValueChange`;
- `aria-label`, `aria-labelledby`, and `aria-valuetext`;
- optional tick marks and labels;
- disabled state.

Behavior:

- Keyboard support includes Arrow keys, Page Up/Down, Home, and End.
- Pointer dragging keeps the handle under control until release.
- Range handles cannot cross unless explicitly allowed.
- Layout is stable as labels and current values change.

## 10. Popover and Menu Button

Use for settings, downloads, share panels, entity selector drawers, and compact overflow controls.

Required API:

- trigger element composition with `aria-expanded`, `aria-controls`, and `aria-haspopup`;
- controlled and uncontrolled open state;
- placement and collision handling;
- modal and non-modal modes;
- close on Escape and outside click;
- focus return to trigger on close.

Behavior:

- Menus used for commands follow menu semantics.
- Panels containing form controls use dialog/popover semantics, not command-menu semantics.
- Static export ignores open interactive popovers unless explicitly requested.

## 11. Charts Adoption Map

| Chart chrome surface | Component primitive | Notes |
|---|---|---|
| Entity selector search | TextField/SearchField | Already suitable when compact labels and search type are supported. |
| Entity selector select all / clear / sort direction | Button/IconButton | Needs ARIA pass-through and stable icon-only sizing. |
| Data table search | TextField/SearchField | Shares search behavior with entity selector. |
| Settings toggles | Checkbox, RadioGroup | Checkbox covers binary settings; RadioGroup covers mutually exclusive settings. |
| Chart/Table tabs | SegmentedControl/Tabs | Needs tab semantics for view switching. |
| Table scope switch | SegmentedControl | Toggle mode, not tab mode. |
| Timeline play/pause | IconButton | Requires `aria-pressed` and a required accessible name. |
| Timeline scrubber | Slider/RangeSlider | Needs value text for fiscal years and tolerance-aware time labels. |
| Settings, download, share panels | Popover/MenuButton | Panels may contain controls, not only command items. |

## 12. Test Expectations

Component package tests:

- keyboard operation for Button, RadioGroup, SegmentedControl/Tabs, Slider, and Popover;
- accessible names and ARIA state assertions for icon-only buttons, hidden labels, tabs, toggles, and sliders;
- controlled state tests for every form primitive;
- disabled state tests;
- brand token smoke tests for Build Canada and Canada Spends.

`charts` integration tests:

- chart chrome renders shared component class names for adopted primitives;
- URL-backed state changes still round-trip when controls are replaced by shared components;
- keyboard paths through tabs, settings, entity selector, table search, and timeline remain intact;
- static SVG/PNG rendering is unchanged by component adoption.

## Non-goals

- Component primitives do not format chart data, fiscal years, sources, or metric values.
- Component primitives do not own chart layout breakpoints.
- Component primitives do not choose chart colours, series colours, or theme palettes.
- Component primitives do not import from `charts`.
