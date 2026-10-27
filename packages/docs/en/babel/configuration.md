# Configuration

The plugin takes five option blocks: `prefix` sets the default prefix for built-in attribute names, the `tags` / `attributes` lists decide which directives are enabled, what they are called and in what order they run, `helpers` decides where runtime dependencies come from, and `locale` decides the error language. Every field is optional; omitted fields fall back to the built-in defaults.

```ts
interface PluginOptions {
  /** Default prefix for attribute-form names; 'x-' when omitted */
  prefix?: string;
  helpers?: HelpersConfig;
  tags?: TagsConfig;
  attributes?: AttributesConfig;
  locale?: 'en-US' | 'zh-CN';
}

interface HelpersConfig {
  for?: { module?: string; imported?: string } | string;
  show?: { module?: string; imported?: string } | string;
  class?: { module?: string; imported?: string } | string;
}

interface TagsConfig {
  for?: { name?: string | string[] } | false;
  if?: {
    name?: string | string[];
    elif?: string | string[];
    else?: string | string[];
  } | false;
  /** key is the default tag name */
  custom?: Record<string, CustomDirectiveConfig>;
}

interface AttributesConfig {
  for?: { name?: string | string[]; priority?: number } | false;
  if?: {
    name?: string | string[];
    priority?: number;
    elif?: string | string[];
    else?: string | string[];
  } | false;
  show?: { name?: string | string[]; priority?: number } | false;
  class?: { name?: string | string[]; priority?: number } | false;
  html?: { name?: string | string[]; priority?: number } | false;
  /** Without name, the default is prefix + key */
  custom?: Record<string, CustomDirectiveConfig>;
}

interface CustomDirectiveConfig {
  /** Omitted: prefix + key in attribute form, key in tag form */
  name?: string | string[];
  /** Omitted: 100 + declaration index under custom */
  priority?: number;
  transform: TransformDirective;
}
```

Types such as `PluginOptions` / `TransformDirective` are exported from the package entry, so TypeScript configs can annotate directly:

```ts
import type { PluginOptions } from 'babel-plugin-jsx-advanced';
```

## Zero-config defaults

With neither `prefix` nor the two lists configured, every built-in directive is enabled in its natural position (the table below assumes the default `x-` prefix):

| Position | Entry | Default registered names | Default `priority` |
| --- | --- | --- | --- |
| `tags` | `for` | `for` | 0 |
| `tags` | `if` | `if` / `elif` / `else` | 1 / 1.1 / 1.2 |
| `attributes` | `for` | `x-for` | 0 |
| `attributes` | `if` | `x-if` / `x-elif` / `x-else` | 1 / 1.1 / 1.2 |
| `attributes` | `show` | `x-show` | 2 |
| `attributes` | `class` | `x-class` | 3 |
| `attributes` | `html` | `x-html` | 4 |

Tag-form built-ins have a fixed `priority`: `for` = 0, `if` = 1; only custom tags can change it. `elif` / `else` have no independent `priority` either — they are always the owning `if` plus `0.1` / `0.2`.

## Name prefix

`prefix` applies to every attribute-form default name: built-ins become `prefix + kind`, custom entries become `prefix + key`. It defaults to `x-`, yielding `x-for` / `x-if` / `x-elif` / `x-else` / `x-show` / `x-class` / `x-html`.

- Tag form is unaffected; default names stay `for` / `if` / `elif` / `else`
- Custom attribute entries follow `prefix`: without `name`, the default is `prefix + key`, so a key of `model` gives `x-model`
- Custom tag entries are unaffected; the default name is still the key
- An explicit `name` is used as-is, regardless of `prefix`
- Passing an empty string `''` removes the prefix: built-in attributes return to `for` / `if` / `show` / `class` / `html`, custom attributes return to their key

```js
// Switch to the v- prefix: v-for / v-if / v-show / v-class / v-html
['babel-plugin-jsx-advanced', { prefix: 'v-' }]
```

## Enabling and disabling

Each built-in key takes one of three values:

| Value | Meaning |
| --- | --- |
| Omitted | Enabled with defaults |
| Object | Enabled, overriding the given fields (`{}` is the same as omitted) |
| `false` | Disabled: the name no longer matches; attributes / tags stay as plain JSX |

To add a single custom directive you do not need to repeat the built-ins — keys you leave out still use defaults.

## Entry fields

**Built-in tag form** (`tags.for` / `tags.if`):

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string \| string[]` | `for` / `if` | Registered name |
| `elif` | `string \| string[]` | `elif` | `if` only; elif branch names |
| `else` | `string \| string[]` | `else` | `if` only; else branch names |

**Built-in attribute form** (`attributes.for` / `if` / `show` / `class` / `html`):

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string \| string[]` | `prefix + kind` | Registered name |
| `priority` | `number` | See table above | Execution order, lower first |
| `elif` | `string \| string[]` | `prefix + elif` | `if` only |
| `else` | `string \| string[]` | `prefix + else` | `if` only |

**Custom entries** (`tags.custom[key]` / `attributes.custom[key]`):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string \| string[]` | | Omitted: `prefix + key` in attribute form, key in tag form |
| `priority` | `number` | | Omitted: `100 + declaration index` |
| `transform` | `Function` | ✅ | Transform logic once matched; see [Custom directives](/babel/directives#custom-directives) |

Custom entries have no `helper` field — register runtime dependencies on `state.directiveHelpers` inside `transform` when needed.

## Naming rules

`name`, `elif` and `else` accept a single string or an array of strings, all parsed by the same rules:

1. `trim` each entry;
2. drop non-strings and blank entries;
3. deduplicate in first-seen order;
4. fall back to the default name when the result is empty — custom entries fall back to their key.

Names in an array are **fully equivalent**; there is no primary name versus alias. Matching any entry means matching the directive.

```js
// Both names match
{ attributes: { for: { name: ['x-for', 'each'] } } }
// With one name configured, the default name no longer participates
{ attributes: { for: { name: 'each' } } }
```

Tag names and attribute names are separate namespaces, so both may be called `x-if` without conflict. There is no cross-entry duplicate check: when two entries match the same name, the one with the earlier `priority` wins.

## Execution order

Lower `priority` runs first, decimals are allowed, and entries are applied in ascending order. Defaults are listed under [Zero-config defaults](#zero-config-defaults); custom entries start at 100 and increase by declaration order, unless they specify their own `priority`.

Execution model:

1. **Tag form**: match by tag name, then run the transform. Built-in `for` / `if` return a new node, replacing the whole element, so attribute directives on that element no longer run; a custom tag returning `void` only mutates in place, and attribute directives continue.
2. **Attribute form**: walk entries in ascending `priority`, looking for a same-named attribute on the element. A match removes that attribute, then runs the transform.
3. **Re-traversal**: as soon as a transform replaces a node, Babel re-traverses the new tree and remaining directives continue there. That is why `for` (0) before `if` (1) lets `if` reference loop variables; swapping them gives Vue 3 semantics.

See [Directives](/babel/directives) for the output of each directive.

## Runtime helpers

Only `for` / `show` / `class` have runtime dependencies. Defaults:

| Kind | Default module | Default import name |
| --- | --- | --- |
| `for` | `babel-runtime-jsx-advanced-helper/for-helper` | `__brja_for_helper__` |
| `show` | `babel-runtime-jsx-advanced-helper/show-helper` | `__brja_show_helper__` |
| `class` | `babel-runtime-jsx-advanced-helper/class-helper` | `__brja_class_helper__` |

`if` compiles to a ternary and `html` inlines `{ __html }`; neither has a helper.

```js
{
  plugins: [
    ['babel-plugin-jsx-advanced', {
      helpers: {
        // A string form only changes the module; the import name stays default
        for: './src/helpers/each',
        // The object form can change both
        class: { module: 'clsx', imported: 'clsx' }
      }
    }]
  ]
}
```

Helpers follow the kind, not the directive name: rename `x-for` to `each` and the import name is still `__brja_for_helper__`. Each helper is injected once at the end of the Program; if the source already has a local import with the same name, it is skipped.

## Locale

Error language, either `en-US` (default) or `zh-CN`. Case and hyphen / underscore are tolerated: `zh` / `zh-CN` / `zh_cn` / `ZH_CN` all normalize to `zh-CN`; a regional variant that does not match (such as `zh-TW`) falls back to the default language rather than the base prefix.

## Validation

`resolve` only fills in defaults and performs no runtime validation: missing fields get defaults, invalid fields are treated as absent (for example, setting `attributes.for` to the string `'each'` is equivalent to not configuring it, so `x-for` still applies).

Field types are constrained by the exported `PluginOptions` type, so a TypeScript config fails at compile time; JS configs (`babel.config.js`) have no such protection, so double-check field names. All compile-time errors are listed under [Errors](/babel/errors).
