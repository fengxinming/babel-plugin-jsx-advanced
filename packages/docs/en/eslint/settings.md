---
title: Settings
---

# Settings

All configuration is read from ESLint's `settings['jsx-advanced']`; the rules themselves take no options.

```js
// eslint.config.js
export default [
  {
    settings: {
      'jsx-advanced': {
        locale: 'zh-CN',
        attribute: {
          for: 'x-for',
          if: ['x-if', 'v-if'],
          elif: 'x-elif',
          else: 'x-else'
        },
        tag: {
          for: ['for', 'For'],
          if: 'if',
          elif: 'elif',
          else: 'else'
        }
      }
    }
  },
  jsxAdvanced.configs.recommended
];
```

## Default names

| Position | for | if | elif | else |
| --- | --- | --- | --- | --- |
| `attribute` | `x-for` | `x-if` | `x-elif` | `x-else` |
| `tag` | `for` | `if` | `elif` | `else` |

Tag form has no `x-` prefix, matching the Babel plugin's defaults. The `prefix` option added on the Babel side only affects attribute form and custom directives; ESLint has no such option — names must be written out one by one.

## Naming rules

Every field is `string | string[]`: a string is a single name, an array means multiple names.

- `trim` each entry; blank entries and non-strings are dropped
- Deduplicate in first-seen order
- **Only when unconfigured** does the default name apply; **once configured, only the configured names match**, with no fallback to the default added on top
- If configured but entirely invalid (empty string, empty array, non-strings), the default name applies again, so rules never receive an empty set and silently stop working

Arrays are useful for recognizing old and new names during a migration:

```jsx
<div v-if={a} />
<div x-if={b} />
```

`attribute.for` and `tag.for` are independent sets and cannot share one default name. Spread attributes (`{...props}`) have no name, and namespaced attributes (`xlink:href`) have a non-string name; neither participates in matching.

## locale

```js
settings: { 'jsx-advanced': { locale: 'zh-CN' } }
```

- Defaults to `en-US`
- `zh` and `zh-CN` count as Chinese; case and underscores are ignored (`zh_CN`, `ZH-cn` both work)
- Any other value (including `zh-TW`) falls back to English

## Aligning with the Babel plugin

ESLint rules find nodes by the names in settings; a mismatch reports nothing at all — not even "directive not found". Any Babel config change must be mirrored here:

| Babel config | What ESLint needs |
| --- | --- |
| `prefix: 'v-'` | All four attribute names, e.g. `attribute.for: 'v-for'` |
| `attributes.for.name: 'v-for'` | Same as above |
| `tags.for.name: 'For'` | `tag.for: 'For'` |
| Custom directives | No corresponding rule yet; nothing to configure |

With the default config both sides work out of the box; no settings needed.
