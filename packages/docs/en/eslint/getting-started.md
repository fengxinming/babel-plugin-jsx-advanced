---
title: Getting started
---

# Getting started

## Install

```bash
pnpm add -D eslint eslint-plugin-jsx-advanced
```

Requires ESLint `^8.57.0 || ^9.0.0 || ^10.0.0`.

## Flat config

```js
// eslint.config.js
import jsxAdvanced from 'eslint-plugin-jsx-advanced';

export default [
  jsxAdvanced.configs.recommended
];
```

The preset is a complete config object with its own `files`, `plugins`, `languageOptions.ecmaFeatures.jsx` and `rules`:

- `files` covers `**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}`. Flat config does not inherit or merge `files`; any extension left out silently disables the rules, so `.tsx` must be included.
- **The preset does not set a `parser`.** TypeScript files are handled by your own `@typescript-eslint/parser`; the two config objects merge per file and do not override each other:

```js
import jsxAdvanced from 'eslint-plugin-jsx-advanced';
import tseslint from 'typescript-eslint';

export default [
  jsxAdvanced.configs.recommended,
  ...tseslint.configs.recommended
];
```

- The preset does not modify any ESLint core rule, nor does it set `ecmaVersion` / `sourceType`; your project's own settings are preserved.

To spell out every rule in one config, use `all`:

```js
export default [jsxAdvanced.configs.all];
```

`recommended` and `all` currently contain the same rule set (5 rules, with `valid-attribute-x-for-key` at `warn`); both entry points are kept.

## eslintrc

```json
{
  "extends": ["plugin:jsx-advanced/recommended"]
}
```

Or `plugin:jsx-advanced/all`. The eslintrc-shaped preset only contains `parserOptions.ecmaFeatures.jsx`, `plugins` and `rules`; it never takes over your parser config.

## Aligning with the Babel plugin

The ESLint plugin has no `prefix` option: rules only recognize the directive names written in settings (or the defaults). If the Babel side changes `prefix` or any directive name, spell it out here item by item, otherwise the rules find no nodes and silently report nothing.

For example, with Babel using `prefix: 'v-'`:

```js
export default [
  {
    settings: {
      'jsx-advanced': {
        attribute: { for: 'v-for', if: 'v-if', elif: 'v-else-if', else: 'v-else' }
      }
    }
  },
  jsxAdvanced.configs.recommended
];
```

See [Settings](/eslint/settings) for details.
