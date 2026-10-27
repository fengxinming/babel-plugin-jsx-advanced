---
title: Rules
---

# Rules

| Rule | Checks | Preset level |
| --- | --- | --- |
| `valid-attribute-x-for` | Syntax of the attribute-form loop binding | error |
| `valid-attribute-x-for-key` | Attribute-form loop elements must have a `key` | warn |
| `valid-attribute-x-if` | Previous siblings and duplicate names in attribute-form branches | error |
| `valid-tag-x-for` | Tag-form loop `value` binding position and expression | error |
| `valid-tag-x-if` | Tag-form conditional `value` requirement and branch chain | error |

Every rule name comes from [settings](/eslint/settings); by default attribute form is `x-for` / `x-if` / `x-elif` / `x-else` and tag form is `for` / `if` / `elif` / `else`.

## valid-attribute-x-for

Requires the attribute-form loop binding to be written as `(variables) in source`.

```jsx
<ul>
  {list.map((item) => <li x-for={item in items}>{item.name}</li>)}
</ul>
```

Accepted forms:

```jsx
<li x-for={item in items} />
<li x-for={(item, index) in items} />
```

Reported cases:

- Missing expression: `x-for={}`
- Missing `in`: `x-for={item}`
- Missing variables: `x-for={in items}`
- Multiple variables without parentheses: `x-for={item, index in items}`
- Missing spaces around `in`: `x-for={(item)in items}`, `x-for={item in(items)}`

Writing several matching names on the same element (possible only with multi-name configuration) reports "multiple names for the same directive" and skips the other checks.

Variables declared by the loop are added to scope in place, so using `item` / `index` inside the element does not trigger `no-undef`.

## valid-attribute-x-for-key

An attribute-form loop must have a `key` on the same element:

```jsx
// warns
<li x-for={item in items}>{item.name}</li>

// passes
<li x-for={item in items} key={item.id}>{item.name}</li>
```

Only the presence of `key` is checked, not its value. When multiple matching names appear on one element, `valid-attribute-x-for` reports the duplicate and this rule steps aside.

## valid-attribute-x-if

Checks attribute-form branch chains:

```jsx
<>
  <div x-if={a} />
  <div x-elif={b} />
  <div x-else />
</>
```

- The previous sibling of `x-elif` / `x-else` must be a JSX element carrying `x-if` or `x-elif`, otherwise it reports "the previous JSX node must contain the directive"
- Backtracking may only cross whitespace text and JSX empty expressions (comments); any other text or expression breaks the chain
- Multiple names of the same directive on one element are reported as duplicates (for example, both `x-if` and `v-if` configured)

`x-else` needs no value; whether `x-if` / `x-elif` have valid values is enforced on the Babel side — this rule only checks relationships and duplicates.

## valid-tag-x-for

Tag-form loops must bind their expression through the `value` attribute:

```jsx
<for value={(item, index) in items}>
  <span>{item}</span>
</for>
```

- No `value` attribute → reports the missing expression
- Expression checks match `valid-attribute-x-for`: missing `in`, missing variables, missing parentheses for multiple variables, spaces around `in`
- Only the attribute named `value` is considered; attribute order does not matter

Tag form has no corresponding key rule.

## valid-tag-x-if

```jsx
<>
  <if value={a}>A</if>
  <elif value={b}>B</elif>
  <else>C</else>
</>
```

- `<if>` and `<elif>` require the `value` attribute, which must be a binding expression
- The previous sibling of `<elif>` / `<else>` must be `<if>` or `<elif>`; non-whitespace text / ordinary expressions break the chain
- `<else>` needs no `value`

## Message language

English by default; setting `locale: 'zh-CN'` in settings makes every rule emit Chinese, for example:

```
Missing parentheses around loop variables for x-for.
```

Only `zh` and `zh-CN` are recognized (case- and underscore-insensitive); `zh-TW` and the like are not treated as Chinese and fall back to English.
