---
title: 指令
---

# 指令

`babel-plugin-jsx-advanced` 把类 Vue 的指令写法编译成普通 JSX 表达式，产物不依赖任何运行时框架。

指令只有两种形态：**属性形式**写在元素属性上，如 `<li x-for={item in items}>`；**标签形式**写在专属标签上，如 `<for value={item in items}>…</for>`。标签形式会替换整个元素，属性形式只改当前元素的属性。

内置五个行为：`for` / `if` / `show` / `class` / `html`。`for` 与 `if` 有标签形式，`if` 另外带 `elif` / `else` 两个分支名；`show` / `class` / `html` 只有属性形式。除此之外，两份清单的 `custom` 可以注册任意自定义指令。

## 概览

| 指令 | 属性形式默认名 | 标签形式默认名 | 运行时依赖 | 作用 |
| --- | --- | --- | --- | --- |
| `for` | `x-for` | `for` | `for-helper` | 列表渲染 |
| `if` | `x-if` / `x-elif` / `x-else` | `if` / `elif` / `else` | 无（编译成三目） | 条件渲染 |
| `show` | `x-show` | — | `show-helper` | 显隐切换 |
| `class` | `x-class` | — | `class-helper` | 类名合并 |
| `html` | `x-html` | — | 无（内联对象） | HTML 注入 |
| 自定义 | `prefix + key` 或 `name` | `key` 或 `name` | 由 `transform` 决定 | 任意转换 |

名字、启停、执行顺序都在[配置](/babel/configuration)里改；本文只讲用法与产物。

## 命名与执行顺序

**命名**：每个条目的 `name` 支持 `string` 或 `string[]`，数组里的名字完全等价——没有主名与别名之分。解析时会逐项 `trim`、丢弃空白项、按首次出现顺序去重；全部无效时回落到默认名：内置属性位是 `prefix + kind`，内置标签位是 `kind`，自定义属性位是 `prefix + key`，自定义标签位是 `key`。错误文案里显示的永远是**代码里实际写的那个名字**。

内置属性位的默认名由 `prefix + kind` 拼出（`x-for`、`x-if`、`x-elif`、`x-else`、`x-show`、`x-class`、`x-html`），`prefix` 默认 `x-`，可在[配置](/babel/configuration#名字前缀)里改；标签位默认名不带前缀。

**优先级**：`priority` 数值越小越先执行，可以写小数。属性位默认值：

| 指令 | `priority` |
| --- | --- |
| `for` | 0 |
| `if` | 1 |
| `show` | 2 |
| `class` | 3 |
| `html` | 4 |
| 自定义 | 100 + 声明顺序 |

`elif` / `else` 的名字跟所属 `if` 一起配（`if: { elif, else }`），但没有独立的 `priority`，恒为所属 `if` 的 `priority + 0.1 / +0.2`，保证分支紧跟主链。因为 `for` 是 0、`if` 是 1，所以先循环再判断（与 Vue 2 一致）；把 `if` 配成 0、`for` 配成 1 就能反过来（Vue 3 语义）。

**标签位先于属性位**：内置标签指令（`for` / `if`）命中后整个元素被替换，同一元素上的属性指令不再执行；自定义标签返回 `void` 时只做原地修改，属性指令仍会继续。标签位内置次序固定为 `for`（0）→ `if`（1），没有 `priority` 可配；只有自定义标签可以配（默认 100 + 声明顺序）。

**属性位的执行粒度**：按 `priority` 升序遍历条目，命中一条就摘掉该属性。一旦某条指令替换了节点，Babel 会重新遍历新树，剩余的属性指令在新树上继续执行。

**放在哪里**：处于 JSX 子节点位置时，替换结果会自动包成 `{…}` 表达式容器；处于 `return`、变量初始化等表达式位置时直接替换，不再包容器。

## for —— 列表渲染

**属性形式**

```jsx
const List = ({ items }) => (
  <ul>
    <li x-for={(item, index) in items} key={index}>{item}</li>
  </ul>
);
```

编译为：

```jsx
const List = ({ items }) => (
  <ul>
    {__brja_for_helper__(items, (item, index) => <li key={index}>{item}</li>)}
  </ul>
);
```

**标签形式**

```jsx
<ul>
  <for value={(item, index) in items}>
    <dt>{item.name}</dt>
    <dd>{item.desc}</dd>
  </for>
</ul>
```

编译为：

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

**绑定语法**：只接受 `item in list` 或 `(item, index) in list`。多变量**必须带括号**——JS 会把 `item, index in list` 解析成逗号表达式，循环变量表与数组脱开，编译期直接报 `FOR_EXPRESSION_INVALID`（ESLint 的 `valid-{attribute,tag}-x-for` 也会提前拦）。单变量可以省略括号。

标签形式固定读取 `value` 属性，不是别的属性名。

**可遍历的值**：helper 支持数组 / 类数组、数字、对象。数字按 `1…n` 遍历；对象遍历时第二个参数是 **key**（数组时是下标）；字符串与函数不遍历，直接返回 `null` 让 React 渲染空。回调签名是 `(item, keyOrIndex, index, source)`。

**子节点合并**（标签形式，`if` 的标签形式共用同一套规则）：0 个内容 → `null`；1 个 → 原样返回；多个 → `<>…</>`。只用于缩进的纯空白和注释会被丢弃，行内元素之间的空格保留。

**报错**

| 场景 | key |
| --- | --- |
| 属性形式没有绑定表达式 | `DIRECTIVE_VALUE_REQUIRED` |
| 标签形式缺 `value` 属性或没有绑定表达式 | `TAG_VALUE_REQUIRED` |
| 绑定表达式不是 `… in …` 形式 | `FOR_EXPRESSION_INVALID` |

## if —— 条件渲染

**属性形式**

```jsx
<div>
  <span x-if={status === 'loading'}>加载中</span>
  <span x-elif={status === 'error'}>出错了</span>
  <span x-else>空</span>
</div>
```

编译为：

```jsx
<div>
  {status === 'loading'
    ? <span>加载中</span>
    : status === 'error'
      ? <span>出错了</span>
      : <span>空</span>}
</div>
```

**标签形式**

```jsx
<div>
  <if value={status === 'loading'}>加载中</if>
  <elif value={status === 'error'}>出错了</elif>
  <else>空</else>
</div>
```

编译为：

```jsx
<div>
  {status === 'loading'
    ? <>{'加载中'}</>
    : status === 'error'
      ? <>{'出错了'}</>
      : <>{'空'}</>}
</div>
```

**分支链规则**：分支必须是相邻的兄弟节点。扫描时只允许穿过空白文本和仅含注释的空表达式；遇到其他元素、非空白文本或有意义的表达式就停止。因此 `if` 与 `elif` / `else` 之间不能夹注释以外的内容，也不能跨元素折叠。

**取值规则**：`if` 与 `elif` 必须有绑定表达式；`else` 不需要值，写了也会被忽略。同一个元素上不要同时写 `x-if` 和 `x-elif`——`x-if` 先执行后，残留的 `x-elif` 会被当作孤儿分支。

**报错**

| 场景 | key |
| --- | --- |
| 属性形式缺绑定表达式（`if` / `elif`） | `DIRECTIVE_VALUE_REQUIRED` |
| 标签形式缺 `value` 属性（`if` / `elif`） | `TAG_VALUE_REQUIRED` |
| 落单的 `elif` | `BRANCH_ELIF_TAG_REQUIRES_PRECEDING` / `BRANCH_ELIF_ATTRIBUTE_REQUIRES_PRECEDING` |
| 落单的 `else` | `BRANCH_ELSE_TAG_REQUIRES_PRECEDING` / `BRANCH_ELSE_ATTRIBUTE_REQUIRES_PRECEDING` |

## show —— 显隐切换

```jsx
<div x-show={visible}>内容</div>
```

按元素上是否已有 `style` 决定写法：

| 现有 `style` | 产物 |
| --- | --- |
| 没有 | 追加 `style={visible ? null : { display: 'none' }}` |
| 裸写 `style` | 原地赋成上面的三目 |
| `style={obj}` | `style={__brja_show_helper__(obj, visible)}` |
| 静态字符串 `style="…"` | 报 `ATTRIBUTE_MERGE_INVALID` |
| `style={}`（空容器） | 报 `ATTRIBUTE_MERGE_INVALID` |

值必须是绑定表达式（`DIRECTIVE_VALUE_REQUIRED`），字符串写法不接受。没有 `style` 时直接用三目切换，显示为 `null`、隐藏为 `{ display: 'none' }`；已有绑定 `style` 时交给 helper 浅拷贝后写入 `display`，其它样式不会丢。

## class —— 类名合并

```jsx
<div x-class={{ active: visible }}>内容</div>
```

`x-class` 的值可以是绑定表达式，也可以是字符串字面量。按元素上是否已有 `className` 决定写法：

| 现有 `className` | 产物 |
| --- | --- |
| 没有 | 追加 `className={__brja_class_helper__(value)}` |
| 裸写 `className` | 原地赋成 `className={__brja_class_helper__(value)}` |
| `className={expr}` / `className="…"` | `className={__brja_class_helper__(existing, value)}` |
| 其它值（JSX 元素等） | 报 `ATTRIBUTE_MERGE_INVALID` |

helper 按参数顺序串接，已有 `className` 在前、指令值在后；不做去重，结果始终是空格分隔的字符串。取值规则与 classnames 的常用子集一致：字符串原样、非 0 数字转字符串、数组递归、对象取值为真的 key，其余 falsy 跳过。

## html —— HTML 注入

```jsx
<div x-html={richContent}>占位</div>
```

编译为：

```jsx
<div dangerouslySetInnerHTML={{ __html: richContent }}>占位</div>
```

值可以是绑定表达式或字符串字面量（`x-html="<b>hi</b>"`）。元素上已经有 `dangerouslySetInnerHTML` 时不会静默覆盖，直接报 `ATTRIBUTE_ALREADY_SET`，并把错误定位到已存在的那个属性上。

## 自定义指令

自定义指令同时支持两种形态，配置在 `tags.custom` / `attributes.custom`：**属性位未配 `name` 时默认名 = `prefix + key`**（默认前缀 `x-`，key 写 `model` 就命中 `x-model`），**标签位未配 `name` 时默认名就是 key**。配置了 `name` 就只用 `name`（同样支持 `string | string[]`）。`priority` 可选，默认 100 + 声明顺序。

**示例一：一次绑定生成多个属性（属性位 `x-model`）**

手写双向绑定要在元素上同时写 `value` 和 `onChange`，setter 逻辑还会重复；交给指令只需要一处绑定：

```tsx
<input x-model={[email, setEmail]} />   // → <input value={email} onChange={(event) => setEmail(event.target.value)} />
```

```ts
import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import type { PluginOptions } from 'babel-plugin-jsx-advanced';

/** 写入属性: 同名属性已存在就覆盖, 否则追加 */
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
      // 属性位未配 name 时默认名 = prefix + key, 默认前缀 x- 即 x-model
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
              .buildCodeFrameError(`'${ctx.name}' 需要写成 [getter, setter] 形式的绑定.`);
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

返回 `void`，调度器随后摘掉 `x-model` 属性，元素保留、属性替换完成。

**示例二：整段替换并自动注入 import（标签位 `analytics`）**

标签形式会把整个元素换成另一个节点，适合把「包裹组件 + 导入语句」这类重复劳动固化下来：

```tsx
<analytics value="submit">
  <button>提交</button>
</analytics>
```

编译为：

```tsx
import Analytics from './analytics';

<Analytics event="submit">
  <button>提交</button>
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
            throw nodePath.buildCodeFrameError(`<${ctx.name}> 需要一个 value 属性作为事件名.`);
          }
          // 登记运行时依赖: Program 结束时注入 import Analytics from './analytics'
          state.directiveHelpers.set('Analytics', './analytics');
          return types.jsxElement(
            types.jsxOpeningElement(types.jsxIdentifier('Analytics'), [
              types.jsxAttribute(
                types.jsxIdentifier('event'),
                // 字符串字面量直接作为属性值, 生成 event="submit" 而不是 event={'submit'}
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

标签形式约定用 `value` 承载主要参数（与内置 `<for>` / `<if>` 一致），其它属性可自行从 `nodePath.node.openingElement.attributes` 里读；`children` 原样搬进新节点。

**transform 签名**：`(nodePath, ctx, state) => 节点 | void`。

- 返回节点 → 替换当前元素（子节点位自动包成 `{…}`）；
- 返回 `void` → 原地修改，例如往 `attributes` 里 push 属性；
- 不要在 transform 里自己调用 `nodePath.replaceWith`，替换由调度器统一完成。

**ctx 字段**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `position` | `'tag' \| 'attribute'` | 命中的是标签位还是属性位 |
| `name` | `string` | 代码里实际写的名字 |
| `resolved` | `ResolvedListItem` | 命中的条目：`kind` / `name` / `priority` / `transform` |
| `value` | JSX 值节点 | 属性值；标签形式取 `value` 属性的值；缺失时 `null` |
| `valueAttributeIndex` | `number` | 承载值的属性下标；标签缺 `value` 时为 `-1` |
| `helper` | 仅内置 `for` / `show` / `class` | 自定义条目没有 helper 配置 |

**运行时依赖**：自定义条目不能通过 `helpers` 配置，直接往 `state.directiveHelpers` 登记（见上面的 `Track`）。Program 结束时统一注入默认导入；源码里已有同名局部导入则跳过。

**报错**：直接 `nodePath.buildCodeFrameError('文案')` 即可；想复用内置文案时用 `state.formatMessage(key, params)`，但 key 必须是内置清单里的条目。

**注意**：自定义名字不要和内置重名。重名时谁先命中取决于 `priority`（默认内置在前），不会报错。

## 运行时 helper

`for` / `show` / `class` 有运行时依赖，默认从下面三个模块做默认导入，局部变量名固定 `__brja_{kind}_helper__`：

```ts
for   → 'babel-runtime-jsx-advanced-helper/for-helper'
show  → 'babel-runtime-jsx-advanced-helper/show-helper'
class → 'babel-runtime-jsx-advanced-helper/class-helper'
```

import 语句在 Program 结束时统一注入；如果源码里已经存在同名局部导入，则跳过不重复注入。`if` 编译成三目、`html` 内联 `{ __html }`，都不产生 import。

要换成自己的实现，在插件选项里改：

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

字符串写法等价于只改 `module`；对象的 `imported` 决定导入后的局部变量名，transform 生成的调用会跟着改名。
