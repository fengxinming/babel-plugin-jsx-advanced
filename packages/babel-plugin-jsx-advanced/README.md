# babel-plugin-jsx-advanced

[![npm package](https://nodei.co/npm/babel-plugin-jsx-advanced.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/babel-plugin-jsx-advanced)

> jsx指令扩展和标签扩展，兼容babel 6.x 和 7.x

## 安装

```bash
$ npm i --save-dev babel-plugin-jsx-advanced
```
## 修改babel配置

### 常见React项目配置

**babel.config.js**

```js
module.exports = {
  plugins: [
    [
      'babel-plugin-jsx-advanced', 
      {
        // ... 可选配置参数
      }
    ]
  ]
};
```

**config-overrides.js**

```js
const {
  override,
  addBabelPlugins
} = require('customize-cra');

module.exports = override(
  ...addBabelPlugins(
    [
      'babel-plugin-jsx-advanced',
      {
        // ... 可选配置参数
      }
    ]
  )
)
```

**ice.config.js**

```js
module.exports = {
  chainWebpack(chainedConfig) {
    chainedConfig.module
      .rule('jsx')
      .use('babel-loader')
      .tap((options) => {
        options.plugins.push(
          [
            'babel-plugin-jsx-advanced', 
            {
              // ... 可选配置参数
            }
          ]
        );
        return options;
      });
  }
}
```

### 修改eslint配置

**.eslintrc**

```js
{
  "extends": [
    "plugin:jsx-advanced/recommended"
  ]
}
```

### 配置参数详情

* `prefix` - 指令前缀，默认为`'x-'`；

* `elifAlias` - elif标签或者指令别名，如：修改为`else-if`，默认为`elif`；

* `classHelper` - `${prefix}class`指令的辅助函数路径，默认为`'celia.classnames'`；

* `forHelper` - `${prefix}for`指令的辅助函数路径，默认为`'babel-plugin-jsx-advanced/for-helper'`；

* `showHelper` - `${prefix}show`指令的辅助函数路径，默认为`'babel-plugin-jsx-advanced/show-helper'`；

* `supportIfTag` - 是否支持`<if>/<elif>/<else>`标签，默认开启；

* `supportFor` - 是否支持`${prefix}for`指令，默认开启；

* `supportIf` - 是否支持`${prefix}if`指令，默认开启；

* `supportClass` - 是否支持`${prefix}class`指令，默认开启；

* `supportShow` - 是否支持`${prefix}show`指令，默认开启；

* `supportHtml` - 是否支持`${prefix}html`指令，默认开启；

* `classHelperAlias` - `${prefix}class`指令的辅助函数变量名，默认为`'__class_helper__'`；

* `forHelperAlias` - `${prefix}for`指令的辅助函数变量名，默认为`'__for_helper__'`；

* `showHelperAlias` - `${prefix}show`指令的辅助函数变量名，默认为`'__show_helper__'`。

## 使用

### x-for 指令

**基于源数据多次渲染元素或模板块，在使用该指令之值，必须使用特定语法 alias in expression，为当前遍历的元素提供别名**

```jsx
function MyComponent({ items }) {
  return (
    <ul>
      <li x-for={(item, index) in items} key={index}>
        {item}
      </li>
    </ul>
  );
}
```

### x-if 指令

**根据表达式的值的 [truthiness](https://developer.mozilla.org/zh-CN/docs/Glossary/Truthy) 来有条件地渲染元素**

```jsx
function MyComponent({ role }) {
  return (
    <>
      <button type="button">新增</button>
      <button type="button">编辑</button>
      <button x-if={role === 'admin'} type="button">删除</button>
    </>
  );
}
```

### x-else 指令

**前一个兄弟元素必须包含 `x-if` 或者 `x-elif`**

```jsx
function MyComponent({ role, items }) {
  return (
    <>
      <table x-if={role === 'admin'}>
        <thead />
        <tbody>
          <tr x-for={(item, index) in items} key={index}>
            <td>{item}</td>
          </tr>
        </tbody>
      </table>
      <p x-else>
        无权限访问
      </p>
    </>
  );
}
```

### x-elif 指令

**前一个兄弟元素必须包含 `x-if` 或者 `x-elif`**

```jsx
function MyComponent({ status }) {
  return (
    <>
      <span x-if={status === 0}>初始化</span>
      <span x-elif={status === 1}>准备中</span>
      <span x-elif={status === 2}>发送中</span>
      <span x-elif={status === 3}>接收中</span>
      <span x-elif={status === 3}>完成</span>
      <span x-else>
        异常&nbsp;&nbsp;
        <a href>重试</a>
      </span>
    </>
  );
}
```

### x-class 指令

**用于条件渲染 `className`，不能跟 `className` 属性共存**

```jsx
function MyComponent({ status, text }) {
  return (
    <>
      <p
        x-class={{
          default: !status,
          success: status === 1,
          error: status === 2,
          warning: status === 3
        }}
      >
        {text}
      </p>
      <p
        x-class={['info', {
          default: !status,
          success: status === 1,
          error: status === 2,
          warning: status === 3
        }]}
      >
        {text}
      </p>
    </>
  );
}
```

### x-show 指令

**根据表达式之真假值，切换元素的 `display` CSS property**

```jsx
function MyComponent({ isShown }) {
  return (
    <p x-show={isShown}>
      内容1
    </p>
  );
}
```

### x-html 指令

**更新元素的 `innerHTML`**

```jsx
function MyComponent({ html }) {
  if (!html) {
    html = '<span>hello</span>';
  }
  return (
    <p x-html={html} />
  );
}
```

### if 标签

**根据表达式的值的 [truthiness](https://developer.mozilla.org/zh-CN/docs/Glossary/Truthy) 来有条件地渲染元素，并且不会创建额外的真实DOM**

```jsx
function MyComponent({ role }) {
  return (
    <>
      <button type="button">查看</button>
      <if value={role === 'admin'}>
        <button type="button">新增</button>
        <button type="button">编辑</button>
        <button type="button">删除</button>
      </if>
    </>
  );
}
```

### elif 标签

**前一个兄弟元素必须包含 `if` 或者 `elif` 标签**

```jsx
function MyComponent({ type }) {
  return (
    <form>
      <if value={type === 1}>
        <input placeholder="用户名" />
        <input placeholder="密码" />
      </if>
      <elif value={type === 2}>
        <input placeholder="用户名" />
        <input placeholder="验证码" />
        <a href>获取验证码</a>
      </elif>
      <elif value={type === 3}>
        <img src="" alt="扫码登录" />
      </elif>
    </form>
  );
}
```

### else 标签

**前一个兄弟元素必须包含 `if` 或者 `elif` 标签**

```jsx
function MyComponent({ role, items }) {
  return (
    <>
      <if value={role === 'admin'}>
        <div>
          <input />
          <button type="button">查询</button>
          <table>
            <thead />
            <tbody>
              <tr x-for={(item, index) in items} key={index}>
                <td>{item}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </if>
      <else>
        无权限访问
      </else>
    </>
  );
}
```
