# 快速开始

`babel-plugin-jsx-advanced` 为 JSX 提供类 Vue 的指令能力：条件渲染、列表渲染、显隐切换、类名合并、HTML 注入，全部在**编译期**完成转换，产物是普通 React/Vue JSX 代码，不引入额外运行时框架。

## 安装

```bash
pnpm add -D babel-plugin-jsx-advanced
```

需要循环渲染时一并安装运行时 helper（for / show / class 有运行时部分，if / html 是纯编译期转换）：

```bash
pnpm add babel-runtime-jsx-advanced-helper
```

## 启用插件

`.babelrc` 或 babel 配置文件：

```json
{
  "plugins": ["babel-plugin-jsx-advanced"]
}
```

零配置即可使用，默认启用全部内置指令（详见[配置](/babel/configuration)）。

## 第一个指令

```jsx
// 源码
const List = ({ items, visible }) => (
  <ul>
    <li x-for={item in items}>{item}</li>
    <li x-if={visible}>可见的内容</li>
    <div x-show={visible}>显隐切换</div>
    <div x-class={ { active: visible } }>类名合并</div>
    <div x-html={richContent}>HTML 注入</div>
  </ul>
);
```

`x-for` 编译为对数组的映射：

```jsx
const List = ({ items, visible }) => (
  <ul>
    {__brja_for_helper__(items, (item) => <li>{item}</li>)}
    {visible ? <li>可见的内容</li> : null}
    {/* x-show / x-class / x-html 的宿主元素保留, 行为注入其中 */}
  </ul>
);
```

## 与其他插件一起用

指令转换发生在 JSX 语义之前，与 `@babel/preset-react`（或 `@vitejs/plugin-react` 内置的 preset）直接共存，插件放在 preset 之前即可：

```json
{
  "presets": ["@babel/preset-react"],
  "plugins": ["babel-plugin-jsx-advanced"]
}
```

## 下一步

- [配置](/babel/configuration) —— 两份指令清单、名字规则、执行顺序
- [指令](/babel/directives) —— 五个内置指令的用法与产物，以及自定义指令的 transform 写法
- [错误码](/babel/errors) —— 编译期全部报错及定位
