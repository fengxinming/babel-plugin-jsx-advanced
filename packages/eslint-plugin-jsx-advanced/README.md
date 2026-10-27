# eslint-plugin-jsx-advanced

[![npm package](https://nodei.co/npm/eslint-plugin-jsx-advanced.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/eslint-plugin-jsx-advanced)

[babel-plugin-jsx-advanced](https://www.npmjs.com/package/babel-plugin-jsx-advanced) 的配套 ESLint 规则。

完整文档：**https://fengxinming.github.io/babel-plugin-jsx-advanced/eslint/**

## 安装

```bash
npm i -D eslint-plugin-jsx-advanced
```

## 使用

```js
import jsxAdvanced from 'eslint-plugin-jsx-advanced';

export default [
  jsxAdvanced.configs.recommended
];
```

`files` 覆盖 `js / mjs / cjs / jsx / ts / tsx / mts / cts`，不设置 parser，TypeScript 项目需自行配置 `@typescript-eslint/parser`。

ESLint 8：

```js
{
  "extends": ["plugin:jsx-advanced/legacy_recommended"]
}
```

## 规则

| 规则 | 级别 | 说明 |
| --- | --- | --- |
| `valid-attribute-x-for` | error | 属性形式 for 的表达式、循环变量与括号 |
| `valid-attribute-x-for-key` | warn | 循环元素缺少 `key` |
| `valid-attribute-x-if` | error | 属性形式 if / elif / else 的分支链与取值 |
| `valid-tag-x-for` | error | 标签形式 for 的 `value`、表达式与括号 |
| `valid-tag-x-if` | error | 标签形式 if / elif / else 的 `value` 与分支链 |

## settings

```js
{
  settings: {
    'jsx-advanced': {
      locale: 'zh-CN',
      attribute: {
        for: ['x-for'],
        if: ['x-if'],
        elif: ['x-elif'],
        else: ['x-else']
      },
      tag: {
        for: ['for'],
        if: ['if'],
        elif: ['elif'],
        else: ['else']
      }
    }
  }
}
```

名字支持 `string | string[]`，无效值回落默认名。babel 侧修改 `prefix` 或指令名后需同步此处。
