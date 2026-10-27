# babel-runtime-jsx-advanced-helper

[![npm package](https://nodei.co/npm/babel-runtime-jsx-advanced-helper.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/babel-runtime-jsx-advanced-helper)

[babel-plugin-jsx-advanced](https://www.npmjs.com/package/babel-plugin-jsx-advanced) 的运行时 helper，编译产物自动 import。

完整文档：**https://fengxinming.github.io/babel-plugin-jsx-advanced/**

| 模块 | 签名 | 行为 |
| --- | --- | --- |
| `babel-runtime-jsx-advanced-helper/for-helper` | `forHelper(value, render)` | 遍历数组 / 数字 / 对象，回调 `(item, keyOrIndex, index, source)`；字符串与函数返回 `null` |
| `babel-runtime-jsx-advanced-helper/show-helper` | `showHelper(styles, value)` | 真值返回原对象，假值返回 `{ ...styles, display: 'none' }` |
| `babel-runtime-jsx-advanced-helper/class-helper` | `classHelper(...values)` | 按顺序串接为空格分隔字符串，不去重，falsy 跳过 |
