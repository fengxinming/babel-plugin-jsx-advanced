# babel-plugin-jsx-advanced

> jsx指令扩展和标签扩展

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
    'babel-plugin-jsx-advanced'
  ]
};
```
> 自定义配置参数
```js
module.exports = {
  plugins: [
    ['babel-plugin-jsx-advanced', {
      // ... 配置参数
    }]
  ]
};
```

> 自定义配置参数
```js
module.exports = {
  chainWebpack(chainedConfig) {
    chainedConfig.module
      .rule('jsx')
      .use('babel-loader')
      .tap((options) => {
        options.plugins.push(
          ['babel-plugin-jsx-advanced', {
            // ... 配置参数
          }]
        );
        return options;
      });
  },
```

### 配置参数
* `prefix` - 指令前缀，默认为`'x-'`；
* `supportIfTag` - 是否支持`<if>/<elif>/<else>`标签，默认开启；
* `supportItextTag` - 是否支持`<itext>`标签，默认关闭；
* `supportIf` - 是否支持`${prefix}if`指令，默认开启；
* `supportClass` - 是否支持`${prefix}class`指令，默认开启；
* `supportShow` - 是否支持`${prefix}show`指令，默认开启；
* `supportHtml` - 是否支持`${prefix}html`指令，默认开启；
* `classHelper` - `${prefix}class`指令的辅助函数路径，默认为`'babel-plugin-jsx-advanced/es/class-helper'`；
* `classHelperAlias` - `${prefix}class`指令的辅助函数变量名，默认为`'__classHelper__'`；
* `showHelper` - `${prefix}show`指令的辅助函数路径，默认为`'babel-plugin-jsx-advanced/es/show-helper'`；
* `showHelperAlias` - `${prefix}show`指令的辅助函数变量名，默认为`'__showHelper__'`；

## 使用

### if/elif/else 标签
**单个if标签情况**
```jsx
function render() {
  return (
    <div>
      <if value={state === 1}>
        <input name="num" />
        <button>购买</button>
      </if>
    </div>
  );
}
```
> 等价于
```jsx
function render() {
	return <div>
      {state === 1 ? <><input name="num" /><button>购买</button></> : null}
    </div>;
}
```

**if和else标签结合使用情况**
```jsx
function render() {
  return (
    <div>
      <if value={state === 1}>
        <input name="num" />
        <button>购买</button>
      </if>
      <elif value={state === 2}>
        <div>内容1</div>
        <div>内容2</div>
        <div>内容3</div>
      </elif>
      <else>
        警告
      </else>
    </div>
  );
}
```
> 等价于
```jsx
function render() {
	return (
		<div>
		  {state === 1 ? <><input name="num" /><button>购买</button></> : state === 2 ? <><div>内容1</div><div>内容2</div><div>内容3</div></> : <>
        警告
      </>}
		</div>
	);
}
```

### i-if/i-elif/i-else 指令
**单个i-if指令情况**
```jsx
function render() {
	return (
	  <div>
		<button i-if={state === 1}>新增</button>
	  </div>
	);
}
```
> 等价于
```jsx
function render() {
	return <div>
      {state === 1 ? <button>新增</button> : null}
    </div>;
}
```

**i-if和i-else指令结合使用情况**
```jsx
function render() {
  return (
    <div>
      <span i-if={state === 1}>处理中</span>
      <span i-elif={state === 2}>处理完成</span>
      <span i-else>状态异常</span>
    </div>
  );
}
```
> 等价于
```jsx
function render() {
	return (
		<div>
		  {state === 1 ? <span>处理中</span> : state === 2 ? <span>处理完成</span> : <span>状态异常</span>}
		</div>
	);
}
```

**if标签和i-if指令混合使用情况**
```jsx
function render() {
  return (
    <div>
      <if value={statement}>
        <div>if tag</div>
      </if>
      <elif value={another}>
        <div>else if tag</div>
        <div i-if={statement}>nest if</div>
        <div i-elif={another}>nest else if</div>
      </elif>
    </div>
  );
}
```
> 等价于
```jsx
function render() {
	return (
		<div>
		  {statement ? <div>if tag</div> : another ? <><div>else if tag</div>statement ? <div>nest if</div> : another ? <div>nest else if</div> : null</> : null}
		</div>
	);
}
```

### i-class 指令
```jsx
function render() {
  return (
    <div>
      <div i-class={{
        red: state === 1,
        green: state === 2,
        blue: state === 3
      }}></div>
      <div i-class={['red', 'green', 'blue']} />
    </div>
  );
}
```
> 等价于
```jsx
import __classHelper__ from "babel-plugin-jsx-advanced/es/class-helper";

function render() {
	return <div>
      <div className={__classHelper__({
      red: state === 1,
      green: state === 2,
      blue: state === 3
    })}></div>
      <div className={__classHelper__(['red', 'green', 'blue'])} />
    </div>;
}
```

### i-show 指令
```jsx
function render() {
  return (
    <div>
      <p i-show={state === 1}>
        内容1
      </p>
    </div>
  );
}
```
> 等价于
```jsx
import __showHelper__ from "babel-plugin-jsx-advanced/es/show-helper";

function render() {
	return <div>
      <p style={__showHelper__(null, state === 1)}>
        内容1
      </p>
    </div>;
}
```

### i-html 指令
```jsx
function render() {
  return (
    <div i-html={html} />
  );
}
```
> 等价于
```jsx
function render() {
	return <div dangerouslySetInnerHTML={{
    "__html": html
  }} />;
}
```
