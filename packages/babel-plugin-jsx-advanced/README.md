# babel-plugin-jsx-advanced

[![npm package](https://nodei.co/npm/babel-plugin-jsx-advanced.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/babel-plugin-jsx-advanced)

编译期把 `x-for` / `x-if` / `x-show` / `x-class` / `x-html` 与 `<for>` / `<if>` / `<elif>` / `<else>` 转换为 React JSX。需要 Babel 7+。

完整文档：**https://fengxinming.github.io/babel-plugin-jsx-advanced/babel/**

## 安装

```bash
npm i -D babel-plugin-jsx-advanced
```

## 配置

```js
module.exports = {
  plugins: [
    ['babel-plugin-jsx-advanced', {
      prefix: 'x-',
      locale: 'zh-CN'
    }]
  ]
};
```

## options

| 字段 | 类型 | 默认值 |
| --- | --- | --- |
| `prefix` | `string` | `'x-'` |
| `locale` | `'zh-CN' \| 'en-US'` | `'zh-CN'` |
| `attributes` | `Record<kind, boolean \| object>` | 全开 |
| `tags` | `Record<kind, boolean \| object>` | 全开 |
| `helpers` | `string \| { module, imported }` | 见下 |
| `attributes.custom` | `Record<string, CustomDirectiveConfig>` | — |
| `tags.custom` | `Record<string, CustomDirectiveConfig>` | — |

| kind | 属性默认名 | 标签默认名 | priority |
| --- | --- | --- | --- |
| `for` | `x-for` | `for` | 0 |
| `if` | `x-if` / `x-elif` / `x-else` | `if` / `elif` / `else` | 1 |
| `show` | `x-show` | — | 2 |
| `class` | `x-class` | — | 3 |
| `html` | `x-html` | — | 4 |

`name`、`elif`、`else` 支持 `string | string[]`，按 trim、去重、过滤、回落默认名处理。标签位无 `priority`。

自定义条目：属性位默认名 `prefix + key`，标签位默认名 `key`，默认 priority 为 `100 + 声明顺序`。

```js
attributes: {
  custom: {
    model: {
      name: ['x-model', 'x-bind'],
      priority: 200,
      transform(node, ctx, state) { /* ... */ }
    }
  }
}
```

helper 默认模块 `babel-runtime-jsx-advanced-helper/{kind}-helper`，默认导入名 `__brja_{kind}_helper__`。

## 指令速查

| 指令 | 写法 | 结果 |
| --- | --- | --- |
| `x-for` | `x-for={(item, i) in items}` | `for` helper 遍历 |
| `x-if` | `x-if={cond}` | 三目，假值展开 `null` |
| `x-elif` / `x-else` | 紧跟 `x-if`，中间只允许空白与注释 | 分支链 |
| `x-show` | `x-show={visible}` | `style` 切换 `display` |
| `x-class` | `x-class={['a', { b: cond }]}` | 合并进 `className` |
| `x-html` | `x-html={html}` | `dangerouslySetInnerHTML` |
| `<for>` | `<for value={(item, i) in items}>` | 同 `x-for`，不产生额外 DOM |
| `<if>` / `<elif>` / `<else>` | 条件写在 `value` 上 | 同 `x-if` 分支链 |

`x-for` 多变量必须加括号，写成 `(item, i) in items`。

```jsx
<li x-for={(item, i) in items} key={i}>{item}</li>
```

```jsx
{__brja_for_helper__(items, (item, i) => <li key={i}>{item}</li>)}
```

## ESLint

```bash
npm i -D eslint-plugin-jsx-advanced
```

详见 [eslint-plugin-jsx-advanced](https://www.npmjs.com/package/eslint-plugin-jsx-advanced)。
