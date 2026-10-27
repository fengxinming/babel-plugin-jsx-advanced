# Getting started

`babel-plugin-jsx-advanced` adds Vue-style directives to JSX: conditional rendering, list rendering, show/hide, class merging and HTML injection — all resolved at **compile time**, emitting plain React/Vue JSX with no extra runtime framework.

## Install

```bash
pnpm add -D babel-plugin-jsx-advanced
```

To render lists, install the runtime helper as well (`for` / `show` / `class` have a runtime part; `if` / `html` are pure compile-time transforms):

```bash
pnpm add babel-runtime-jsx-advanced-helper
```

## Enable the plugin

`.babelrc` or your Babel config file:

```json
{
  "plugins": ["babel-plugin-jsx-advanced"]
}
```

Zero configuration enables every built-in directive (see [Configuration](/babel/configuration) for details).

## Your first directive

```jsx
// source
const List = ({ items, visible }) => (
  <ul>
    <li x-for={item in items}>{item}</li>
    <li x-if={visible}>Visible content</li>
    <div x-show={visible}>Toggle visibility</div>
    <div x-class={ { active: visible } }>Merged classes</div>
    <div x-html={richContent}>HTML injection</div>
  </ul>
);
```

`x-for` compiles to an array mapping:

```jsx
const List = ({ items, visible }) => (
  <ul>
    {__brja_for_helper__(items, (item) => <li>{item}</li>)}
    {visible ? <li>Visible content</li> : null}
    {/* x-show / x-class / x-html keep their host element; behavior is injected in place */}
  </ul>
);
```

## Using with other plugins

Directive transforms run before JSX semantics, so the plugin coexists with `@babel/preset-react` (or the preset bundled in `@vitejs/plugin-react`). Put the plugin before the preset:

```json
{
  "presets": ["@babel/preset-react"],
  "plugins": ["babel-plugin-jsx-advanced"]
}
```

## Next steps

- [Configuration](/babel/configuration) — the two directive lists, naming rules, execution order
- [Directives](/babel/directives) — usage and output for the five built-ins, plus how to write a custom `transform`
- [Errors](/babel/errors) — every compile-time error and where it points
