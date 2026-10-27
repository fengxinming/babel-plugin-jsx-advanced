# Errors

The plugin throws while traversing the AST, positioned at the offending node. Every error goes through `buildCodeFrameError`: the terminal prints a code frame around the failure, and the error points at the node that actually caused it, not at the whole element.

Message language follows [locale](/babel/configuration#locale) and defaults to `en-US`.

## Compile stage

| Key | Trigger | Points at |
| --- | --- | --- |
| `DIRECTIVE_VALUE_REQUIRED` | An attribute-form directive has no binding expression: bare attribute, or a value that is not `{…}`. `x-class` / `x-html` also accept a string literal | The directive attribute |
| `TAG_VALUE_REQUIRED` | A tag-form directive (`for` / `if` / `elif`) is missing its `value` attribute, or `value` is not a `{…}` expression | The tag element |
| `FOR_EXPRESSION_INVALID` | The `for` binding is not `… in …`, or the left side of `in` is not an identifier / parenthesized identifier list | The directive attribute or tag element |
| `BRANCH_ELIF_TAG_REQUIRES_PRECEDING` | The previous sibling of `<elif>` is not an `<if>` tag | That `<elif>` |
| `BRANCH_ELIF_ATTRIBUTE_REQUIRES_PRECEDING` | The previous sibling of the element carrying `x-elif` has no `x-if` | That `x-elif` attribute |
| `BRANCH_ELSE_TAG_REQUIRES_PRECEDING` | The previous sibling of `<else>` is not an `<if>` / `<elif>` tag | That `<else>` |
| `BRANCH_ELSE_ATTRIBUTE_REQUIRES_PRECEDING` | The previous sibling of the element carrying `x-else` has no `x-if` / `x-elif` | That `x-else` attribute |
| `ATTRIBUTE_ALREADY_SET` | `html` needs to write `dangerouslySetInnerHTML`, but the element already declares it explicitly | The existing `dangerouslySetInnerHTML` |
| `ATTRIBUTE_MERGE_INVALID` | `show` / `class` must merge with an existing `style` / `className`, but that attribute is not a mergeable binding (static string, empty container, JSX element, etc.) | The host attribute |

Branch scanning may only cross whitespace-only text and empty expressions that contain comments; any other element, non-whitespace text or ordinary expression stops the scan, and the later branches are reported as orphaned.

```jsx
// Anything other than comments in between → the following x-else is orphaned
<div>
  <span x-if={a}>A</span>
  <p>Description</p>
  <span x-else>B</span>
</div>
```

## Placeholders

<code v-pre>{{…}}</code> in a message is replaced with the actual value:

| Placeholder | Meaning |
| --- | --- |
| <code v-pre>{{name}}</code> | The directive name actually written in code, possibly an alias such as `x-if` / `each` |
| <code v-pre>{{main}}</code> | The main branch name of the enclosing `if`; multiple names are joined with ` / ` |
| <code v-pre>{{elif}}</code> | The elif branch name of the enclosing `if`; multiple names are joined with ` / ` |
| <code v-pre>{{tag}}</code> | The tag name matched in tag form |
| <code v-pre>{{attribute}}</code> | The host attribute the directive merges or writes, such as `style` / `className` / `dangerouslySetInnerHTML` |

## Configuration stage

There are no configuration errors. `resolve` only fills in defaults and performs no validation; invalid fields are treated as absent. Field types are constrained by the `PluginOptions` type, so a TypeScript config fails at compile time. See [Configuration](/babel/configuration#validation).
