---
title: 配置
---

# 配置

所有配置都从 ESLint 的 `settings['jsx-advanced']` 读取，规则本身不接收 options。

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

## 默认名

| 位置 | for | if | elif | else |
| --- | --- | --- | --- | --- |
| `attribute` | `x-for` | `x-if` | `x-elif` | `x-else` |
| `tag` | `for` | `if` | `elif` | `else` |

标签位没有 `x-` 前缀，与 Babel 插件的默认名一致。Babel 侧新增的 `prefix` 选项只作用于属性位与自定义指令，ESLint 侧没有这个选项——名字必须逐个写明。

## 名字规则

每个字段都是 `string | string[]`：写字符串视为单名，写数组视为多名。

- 逐项 `trim`，空白项与非字符串直接丢弃
- 按首次出现顺序去重
- **没配置**才落回默认名；**配了就只认配置的那些名字**，不与默认名叠加
- 配置了但全部无效（空串、空数组、非字符串）时同样回落默认名，避免规则拿到空集合后静默失效

数组形式用于过渡期同时识别新旧两套名字：

```jsx
<div v-if={a} />
<div x-if={b} />
```

`attribute.for` 与 `tag.for` 是两份独立的集合，不能共用一个默认名。展开属性（`{...props}`）没有名字，命名空间属性（`xlink:href`）的名字不是字符串，都不参与匹配。

## locale

```js
settings: { 'jsx-advanced': { locale: 'zh-CN' } }
```

- 默认 `en-US`
- `zh` 与 `zh-CN` 视为中文，大小写与下划线不敏感（`zh_CN`、`ZH-cn` 都算）
- 其它值（包括 `zh-TW`）一律回落英文

## 与 Babel 插件对齐

ESLint 规则只按 settings 的名字找节点，名字对不上时不会报任何错，也不会提示“未找到指令”。改了 Babel 配置就要同步这里：

| Babel 配置 | ESLint 需要写的 |
| --- | --- |
| `prefix: 'v-'` | `attribute.for: 'v-for'` 等四项属性位名字 |
| `attributes.for.name: 'v-for'` | 同上 |
| `tags.for.name: 'For'` | `tag.for: 'For'` |
| 自定义指令 | 暂无对应规则，不需要配置 |

默认配置下两侧开箱即用，无需任何 settings。
