---
title: Directives
---

# Directives

`babel-plugin-jsx-advanced` compiles Vue-style directive syntax into plain JSX expressions; the output depends on no runtime framework.

A directive takes two forms: **attribute form**, written on an element's attributes such as `<li x-for={item in items}>`; and **tag form**, written as a dedicated tag such as `<for value={item in items}>…</for>`. Tag form replaces the whole element; attribute form only changes the current element's attributes.

Five built-in behaviors: `for` / `if` / `show` / `class` / `html`. `for` and `if` have tag forms, and `if` also has `elif` / `else` branch names; `show` / `class` / `html` only exist in attribute form. Beyond that, the `custom` slot of both lists can register any custom directive.

## Overview

| Directive | Attribute default name | Tag default name | Runtime dependency | Purpose |
| --- | --- | --- | --- | --- |
| `for` | `x-for` | `for` | `for-helper` | List rendering |
| `if` | `x-if` / `x-elif` / `x-else` | `if` / `elif` / `else` | None (compiles to a ternary) | Conditional rendering |
| `show` | `x-show` | — | `show-helper` | Toggle visibility |
| `class` | `x-class` | — | `class-helper` | Class merging |
| `html` | `x-html` | — | None (inline object) | HTML injection |
| Custom | `prefix + key` or `name` | `key` or `name` | Decided by `transform` | Any transform |

Naming, enablement and execution order are configured in [Configuration](/babel/configuration); this page covers usage and output only.

## Naming and execution order

**Naming**: each entry's `name` accepts `string` or `string[]`; names in an array are fully equivalent — there is no primary name versus alias. Parsing trims each entry, drops blank entries and deduplicates in first-seen order; when nothing valid remains it falls back to the default: `prefix + kind` for built-in attributes, `kind` for built-in tags, `prefix + key` for custom attributes, `key` for custom tags. Error messages always show **the name actually written in code**.

Built-in attribute defaults are built from `prefix + kind` (`x-for`, `x-if`, `x-elif`, `x-else`, `x-show`, `x-class`, `x-html`); `prefix` defaults to `x-` and can be changed in [Configuration](/babel/configuration#name-prefix). Tag-form defaults carry no prefix.

**Priority**: lower `priority` runs first, decimals are allowed. Attribute defaults:

| Directive | `priority` |
| --- | --- |
| `for` | 0 |
| `if` | 1 |
| `show` | 2 |
| `class` | 3 |
| `html` | 4 |
| Custom | 100 + declaration order |

`elif` / `else` names are configured together with their `if` (`if: { elif, else }`) but have no independent `priority`: they are always the owning `if`'s `priority + 0.1 / +0.2`, keeping branches directly behind the main chain. Since `for` is 0 and `if` is 1, loops run before conditions (Vue 2 behavior); setting `if` to 0 and `for` to 1 reverses that (Vue 3 semantics).

**Tag form before attribute form**: a built-in tag directive (`for` / `if`) replaces the whole element on match, so attribute directives on that element no longer run; a custom tag returning `void` only mutates in place and attribute directives continue. Built-in tag order is fixed at `for` (0) → `if` (1) with no configurable `priority`; only custom tags can set one (100 + declaration order by default).

**Attribute granularity**: entries are walked in ascending `priority` and each match removes that attribute. Once a directive replaces the node, Babel re-traverses the new tree and remaining attribute directives continue there.

**Where it applies**: in a JSX child position, the replacement result is automatically wrapped in a `{…}` expression container; in expression positions such as `return` or variable initialization it replaces directly without a container.

## for — list rendering

**Attribute form**

```jsx
const List = ({ items }) => (
  <ul>
    <li x-for={(item, index) in items} key={index}>{item}</li>
  </ul>
);
```

Compiles to:

```jsx
const List = ({ items }) => (
  <ul>
    {__brja_for_helper__(items, (item, index) => <li key={index}>{item}</li>)}
  </ul>
);
```

**Tag form**

```jsx
<ul>
  <for value={(item, index) in items}>
    <dt>{item.name}</dt>
    <dd>{item.desc}</dd>
  </for>
</ul>
```

Compiles to:

```jsx
<ul>
  {__brja_for_helper__(items, (item, index) => (
    <>
      <dt>{item.name}</dt>
      <dd>{item.desc}</dd>
    </>
  ))}
</ul>
```

**Binding syntax**: only `item in list` or `(item, index) in list` is accepted. Multiple variables **must be parenthesized** — JS parses `item, index in list` as a comma expression, detaching the loop variables from the array, and the compile fails with `FOR_EXPRESSION_INVALID` (ESLint's `valid-{attribute,tag}-x-for` catches it earlier too). A single variable may omit the parentheses.

Tag form always reads the `value` attribute, no other name.

**Iterable values**: the helper supports arrays / array-likes, numbers and objects. Numbers iterate `1…n`; for objects the second argument is the **key** (the index for arrays); strings and functions are not iterated and return `null` so React renders nothing. Callback signature: `(item, keyOrIndex, index, source)`.

**Child merging** (tag form; the tag form of `if` shares the same rules): 0 children → `null`; 1 → returned as-is; multiple → `<>…</>`. Whitespace-only text used purely for indentation and comments are dropped; spaces between inline elements are preserved.

**Errors**

| Scenario | Key |
| --- | --- |
| Attribute form without a binding expression | `DIRECTIVE_VALUE_REQUIRED` |
| Tag form missing the `value` attribute or its binding expression | `TAG_VALUE_REQUIRED` |
| Binding is not in `… in …` form | `FOR_EXPRESSION_INVALID` |

## if — conditional rendering

**Attribute form**

```jsx
<div>
  <span x-if={status === 'loading'}>Loading</span>
  <span x-elif={status === 'error'}>Failed</span>
  <span x-else>Empty</span>
</div>
```

Compiles to:

```jsx
<div>
  {status === 'loading'
    ? <span>Loading</span>
    : status === 'error'
      ? <span>Failed</span>
      : <span>Empty</span>}
</div>
```

**Tag form**

```jsx
<div>
  <if value={status === 'loading'}>Loading</if>
  <elif value={status === 'error'}>Failed</elif>
  <else>Empty</else>
</div>
```

Compiles to:

```jsx
<div>
  {status === 'loading'
    ? <>{'Loading'}</>
    : status === 'error'
      ? <>{'Failed'}</>
      : <>{'Empty'}</>}
</div>
```

**Branch chain rules**: branches must be adjacent siblings. Scanning may only cross whitespace text and empty expressions containing comments; any other element, non-whitespace text or meaningful expression stops it. So nothing except comments may sit between `if` and `elif` / `else`, and the chain cannot fold across elements.

**Value rules**: `if` and `elif` require a binding expression; `else` takes no value, and one is ignored if written. Do not put `x-if` and `x-elif` on the same element — after `x-if` runs, the leftover `x-elif` is treated as an orphaned branch.

**Errors**

| Scenario | Key |
| --- | --- |
| Attribute form missing a binding expression (`if` / `elif`) | `DIRECTIVE_VALUE_REQUIRED` |
| Tag form missing the `value` attribute (`if` / `elif`) | `TAG_VALUE_REQUIRED` |
| Orphaned `elif` | `BRANCH_ELIF_TAG_REQUIRES_PRECEDING` / `BRANCH_ELIF_ATTRIBUTE_REQUIRES_PRECEDING` |
| Orphaned `else` | `BRANCH_ELSE_TAG_REQUIRES_PRECEDING` / `BRANCH_ELSE_ATTRIBUTE_REQUIRES_PRECEDING` |

## show — toggle visibility

```jsx
<div x-show={visible}>Content</div>
```

The output depends on whether the element already has `style`:

| Existing `style` | Output |
| --- | --- |
| None | Appends `style={visible ? null : { display: 'none' }}` |
| Bare `style` | Assigns the ternary above in place |
| `style={obj}` | `style={__brja_show_helper__(obj, visible)}` |
| Static string `style="…"` | Throws `ATTRIBUTE_MERGE_INVALID` |
| `style={}` (empty container) | Throws `ATTRIBUTE_MERGE_INVALID` |

The value must be a binding expression (`DIRECTIVE_VALUE_REQUIRED`); the string form is not accepted. Without `style`, the ternary switches directly — `null` when shown, `{ display: 'none' }` when hidden; with an existing bound `style`, the helper shallow-copies it and writes `display`, so other declarations are preserved.

## class — class merging

```jsx
<div x-class={{ active: visible }}>Content</div>
```

`x-class` accepts a binding expression or a string literal. The output depends on whether the element already has `className`:

| Existing `className` | Output |
| --- | --- |
| None | Appends `className={__brja_class_helper__(value)}` |
| Bare `className` | Assigns `className={__brja_class_helper__(value)}` in place |
| `className={expr}` / `className="…"` | `className={__brja_class_helper__(existing, value)}` |
| Other values (JSX element, etc.) | Throws `ATTRIBUTE_MERGE_INVALID` |

The helper concatenates arguments in order, existing `className` first and the directive value after; it does no deduplication, and the result is always a space-separated string. Value rules match the common subset of classnames: strings pass through, non-zero numbers are stringified, arrays recurse, object keys with truthy values are kept, and other falsy values are skipped.

## html — HTML injection

```jsx
<div x-html={richContent}>Placeholder</div>
```

Compiles to:

```jsx
<div dangerouslySetInnerHTML={{ __html: richContent }}>Placeholder</div>
```

The value may be a binding expression or a string literal (`x-html="<b>hi</b>"`). If the element already has `dangerouslySetInnerHTML`, it is never silently overwritten — the compile throws `ATTRIBUTE_ALREADY_SET` and points at the existing attribute.

## Custom directives

Custom directives support both forms and are configured under `tags.custom` / `attributes.custom`: **without `name`, an attribute's default is `prefix + key`** (default prefix `x-`, so key `model` matches `x-model`), and **without `name`, a tag's default is the key**. When `name` is configured only `name` is used (also `string | string[]`). `priority` is optional and defaults to 100 + declaration order.

**Example 1: one binding generates multiple attributes (attribute form, `x-model`)**

Hand-written two-way binding needs both `value` and `onChange` on the element, and duplicates setter logic; a directive reduces it to one binding:

```tsx
<input x-model={[email, setEmail]} />   // → <input value={email} onChange={(event) => setEmail(event.target.value)} />
```

```ts
import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import type { PluginOptions } from 'babel-plugin-jsx-advanced';

/** Write an attribute: overwrite when a same-named one exists, otherwise append */
function upsertAttribute(
  types: typeof t,
  nodePath: NodePath<t.JSXElement>,
  name: string,
  value: t.Expression
): void {
  const attributes = nodePath.node.openingElement.attributes;
  for (const attr of attributes) {
    if (types.isJSXAttribute(attr)
      && types.isJSXIdentifier(attr.name)
      && attr.name.name === name) {
      attr.value = types.jsxExpressionContainer(value);
      return;
    }
  }
  attributes.push(
    types.jsxAttribute(types.jsxIdentifier(name), types.jsxExpressionContainer(value))
  );
}

export default {
  attributes: {
    custom: {
      // Without name in attribute form, the default is prefix + key: x-model with the default x- prefix
      model: {
        transform(nodePath, ctx, state) {
          const { types } = state;
          const raw = ctx.value;
          const elements = types.isJSXExpressionContainer(raw)
            && types.isArrayExpression(raw.expression)
            ? raw.expression.elements
            : [];
          const [getter, setter] = elements;
          if (!types.isExpression(getter) || !types.isExpression(setter)) {
            throw nodePath
              .get(`openingElement.attributes.${ctx.valueAttributeIndex}`)
              .buildCodeFrameError(`'${ctx.name}' expects a [getter, setter] binding.`);
          }
          upsertAttribute(types, nodePath, 'value', getter);
          upsertAttribute(
            types,
            nodePath,
            'onChange',
            types.arrowFunctionExpression(
              [types.identifier('event')],
              types.callExpression(setter, [
                types.memberExpression(
                  types.memberExpression(
                    types.identifier('event'),
                    types.identifier('target')
                  ),
                  types.identifier('value')
                )
              ])
            )
          );
        }
      }
    }
  }
} satisfies PluginOptions;
```

Returning `void` lets the scheduler remove the `x-model` attribute afterwards, keeping the element while the attributes are replaced.

**Example 2: replace the whole element and inject an import (tag form, `analytics`)**

Tag form swaps the entire element for another node, which is a good fit for locking down repetitive work such as "wrapper component + import statement":

```tsx
<analytics value="submit">
  <button>Submit</button>
</analytics>
```

Compiles to:

```tsx
import Analytics from './analytics';

<Analytics event="submit">
  <button>Submit</button>
</Analytics>
```

```ts
import type * as t from '@babel/types';
import type { PluginOptions } from 'babel-plugin-jsx-advanced';

export default {
  tags: {
    custom: {
      analytics: {
        transform(nodePath, ctx, state) {
          const { types } = state;
          const raw = ctx.value;
          let event: t.Expression;
          if (types.isJSXExpressionContainer(raw) && types.isExpression(raw.expression)) {
            event = raw.expression;
          }
          else if (types.isStringLiteral(raw)) {
            event = raw;
          }
          else {
            throw nodePath.buildCodeFrameError(`<${ctx.name}> expects a value attribute as the event name.`);
          }
          // Register the runtime dependency: Program end injects import Analytics from './analytics'
          state.directiveHelpers.set('Analytics', './analytics');
          return types.jsxElement(
            types.jsxOpeningElement(types.jsxIdentifier('Analytics'), [
              types.jsxAttribute(
                types.jsxIdentifier('event'),
                // A string literal becomes the attribute value directly, producing event="submit" instead of event={'submit'}
                types.isStringLiteral(event) ? event : types.jsxExpressionContainer(event)
              )
            ]),
            types.jsxClosingElement(types.jsxIdentifier('Analytics')),
            nodePath.node.children
          );
        }
      }
    }
  }
} satisfies PluginOptions;
```

Tag form conventionally carries its main argument in `value` (matching the built-in `<for>` / `<if>`); other attributes can be read from `nodePath.node.openingElement.attributes` as needed, and `children` move into the new node unchanged.

**transform signature**: `(nodePath, ctx, state) => node | void`.

- Return a node → replace the current element (a child position is wrapped in `{…}` automatically);
- Return `void` → mutate in place, for example pushing attributes into `attributes`;
- Do not call `nodePath.replaceWith` yourself inside transform; the scheduler performs the replacement.

**ctx fields**

| Field | Type | Description |
| --- | --- | --- |
| `position` | `'tag' \| 'attribute'` | Whether the tag form or attribute form matched |
| `name` | `string` | The name actually written in code |
| `resolved` | `ResolvedListItem` | The matched entry: `kind` / `name` / `priority` / `transform` |
| `value` | JSX value node | Attribute value; tag form reads the `value` attribute; `null` when missing |
| `valueAttributeIndex` | `number` | Index of the attribute carrying the value; `-1` when a tag lacks `value` |
| `helper` | Built-in `for` / `show` / `class` only | Custom entries have no helper config |

**Runtime dependencies**: custom entries cannot use the `helpers` option; register directly on `state.directiveHelpers` (see `Analytics` above). A default import is injected once at the end of the Program; if the source already has a local import with the same name, it is skipped.

**Errors**: call `nodePath.buildCodeFrameError('message')` directly; to reuse built-in messages use `state.formatMessage(key, params)`, but the key must exist in the built-in list.

**Note**: do not reuse a built-in name for a custom directive. When names collide, whichever has the earlier `priority` matches first (built-ins by default); no error is raised.

## Runtime helpers

`for` / `show` / `class` have runtime dependencies, imported by default from the three modules below with fixed local names `__brja_{kind}_helper__`:

```ts
for   → 'babel-runtime-jsx-advanced-helper/for-helper'
show  → 'babel-runtime-jsx-advanced-helper/show-helper'
class → 'babel-runtime-jsx-advanced-helper/class-helper'
```

Imports are injected once at the end of the Program; if the source already has a local import with the same name, injection is skipped. `if` compiles to a ternary and `html` inlines `{ __html }`, so neither produces an import.

To use your own implementation, change it in the plugin options:

```js
{
  "plugins": [
    ["babel-plugin-jsx-advanced", {
      "helpers": {
        "for": "./src/helpers/each",
        "class": { "module": "clsx", "imported": "clsx" }
      }
    }]
  ]
}
```

The string form only changes `module`; an object's `imported` sets the local name after import, and calls generated by the transform are renamed accordingly.
