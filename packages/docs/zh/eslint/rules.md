---
title: 规则
---

# 规则 {#rules}

| 规则 | 校验内容 | 预设级别 |
| --- | --- | --- |
| `valid-attribute-x-for` | 属性位循环绑定表达式的语法 | error |
| `valid-attribute-x-for-key` | 属性位循环元素必须带 `key` | warn |
| `valid-attribute-x-if` | 属性位分支链的前驱与重名 | error |
| `valid-tag-x-for` | 标签位循环的 `value` 绑定位与表达式 | error |
| `valid-tag-x-if` | 标签位条件的 `value` 必填与分支链 | error |

所有规则的名字都来自 [settings](#settings)，默认属性位为 `x-for` / `x-if` / `x-elif` / `x-else`，标签位为 `for` / `if` / `elif` / `else`。

## valid-attribute-x-for

校验属性位循环的绑定表达式必须写成 `(变量) in 数据源`。

```jsx
<ul>
  {list.map((item) => <li x-for={item in items}>{item.name}</li>)}
</ul>
```

允许的写法：

```jsx
<li x-for={item in items} />
<li x-for={(item, index) in items} />
```

报错项：

- 缺表达式：`x-for={}`
- 缺 `in`：`x-for={item}`
- 缺变量：`x-for={in items}`
- 多变量没加括号：`x-for={item, index in items}`
- `in` 两侧缺空格：`x-for={(item)in items}`、`x-for={item in(items)}`

同一元素上同时写了多个命中的名字（只有配置多名时才会发生）会报“同一指令出现多个名字”，并且不再重复做其它检查。

循环里声明的变量会就地补进作用域，因此元素内部使用 `item` / `index` 不会触发 `no-undef`。

## valid-attribute-x-for-key

属性位循环必须在同一个元素上有 `key`：

```jsx
// 报 warn
<li x-for={item in items}>{item.name}</li>

// 通过
<li x-for={item in items} key={item.id}>{item.name}</li>
```

只检查 `key` 属性是否存在，不看取值。同一元素出现多个命中名字时由 `valid-attribute-x-for` 报重复，这条规则让位。

## valid-attribute-x-if

校验属性位分支链：

```jsx
<>
  <div x-if={a} />
  <div x-elif={b} />
  <div x-else />
</>
```

- `x-elif` / `x-else` 的前一个兄弟必须是带 `x-if` 或 `x-elif` 的 JSX 元素，否则报“上一个 JSX 节点需要包含指令”
- 回溯时只允许跨过空白文本与 JSX 空表达式（注释）；遇到其它文本或表达式即视为断链
- 同一元素上写了同一指令的多个名字时报重复（例如同时配置了 `x-if` 与 `v-if`）

`x-else` 不需要值；`x-if` / `x-elif` 的值要求由 Babel 侧校验，这条规则只查分支关系与重名。

## valid-tag-x-for

标签位循环必须通过 `value` 属性绑定表达式：

```jsx
<for value={(item, index) in items}>
  <span>{item}</span>
</for>
```

- 没有 `value` 属性 → 报缺表达式
- 绑定表达式的检查与 `valid-attribute-x-for` 一致：缺 `in`、缺变量、多变量缺括号、`in` 两侧空格
- 绑定位只看名为 `value` 的属性，属性顺序不影响判定

标签位没有对应的 key 规则。

## valid-tag-x-if

```jsx
<>
  <if value={a}>A</if>
  <elif value={b}>B</elif>
  <else>C</else>
</>
```

- `<if>` 与 `<elif>` 的 `value` 属性必填，且必须绑定表达式
- `<elif>` / `<else>` 的前一个兄弟必须是 `<if>` 或 `<elif>`，遇到非空白文本 / 普通表达式即断链
- `<else>` 不需要 `value`

## 报错语言 {#message-language}

默认英文，settings 里写 `locale: 'zh-CN'` 后所有规则输出中文，例如：

```
x-for 指令的循环变量缺少括号。
```

只认 `zh` 与 `zh-CN`（大小写、下划线不敏感），`zh-TW` 之类不会被当成中文，一律回落英文。
