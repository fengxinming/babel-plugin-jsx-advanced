---
title: 快速开始
---

# 快速开始 {#getting-started}

## 安装 {#install}

```bash
pnpm add -D eslint eslint-plugin-jsx-advanced
```

ESLint 版本要求 `^8.57.0 || ^9.0.0 || ^10.0.0`。

## Flat config {#flat-config}

```js
// eslint.config.js
import jsxAdvanced from 'eslint-plugin-jsx-advanced';

export default [
  jsxAdvanced.configs.recommended
];
```

预设是一个完整的配置对象，自带 `files`、`plugins`、`languageOptions.ecmaFeatures.jsx` 与 `rules`：

- `files` 覆盖 `**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}`。flat 配置的 `files` 不继承、不合并，没列进来的扩展名整条规则会静默失效，所以 `.tsx` 必须在内。
- **预设不设置 `parser`**。TypeScript 文件由你自己的 `@typescript-eslint/parser` 负责，两个配置对象按文件合并，不会被覆盖：

```js
import jsxAdvanced from 'eslint-plugin-jsx-advanced';
import tseslint from 'typescript-eslint';

export default [
  jsxAdvanced.configs.recommended,
  ...tseslint.configs.recommended
];
```

- 预设不修改任何 ESLint 核心规则，`ecmaVersion` / `sourceType` 也不写，保持你工程自己的设置。

需要在同一份配置里分别指定规则时，用 `all`：

```js
export default [jsxAdvanced.configs.all];
```

当前 `recommended` 与 `all` 的规则集相同（5 条，`valid-attribute-x-for-key` 为 `warn`），两个入口都保留。

## eslintrc {#eslintrc}

```json
{
  "extends": ["plugin:jsx-advanced/recommended"]
}
```

或 `plugin:jsx-advanced/all`。eslintrc 形状的预设只有 `parserOptions.ecmaFeatures.jsx`、`plugins` 与 `rules`，不接管你的 parser 配置。

## 与 Babel 插件的配置对齐 {#aligning-with-the-babel-plugin}

ESLint 插件没有 `prefix` 选项，规则只认 settings 里写死（或用默认名）的指令名。Babel 侧若改了 `prefix` 或改过指令名，需要在这里逐项写明，否则规则找不到节点、静默零报错。

例如 Babel 用 `prefix: 'v-'`：

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

详见[配置](#settings)。
