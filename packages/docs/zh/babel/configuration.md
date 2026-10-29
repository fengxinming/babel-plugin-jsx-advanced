# 配置 {#configuration}

插件选项只有五块：`prefix` 决定内置属性名的默认前缀，`tags` / `attributes` 两份指令清单决定启用哪些指令、叫什么名字、以什么顺序执行，`helpers` 决定运行时依赖从哪来，`locale` 决定报错语言。全部字段可省略，省略即走内置默认。

```ts
interface PluginOptions {
  /** 属性位默认名前缀, 省略为 'x-' */
  prefix?: string;
  helpers?: HelpersConfig;
  tags?: TagsConfig;
  attributes?: AttributesConfig;
  locale?: 'en-US' | 'zh-CN';
}

interface HelpersConfig {
  for?: { module?: string; imported?: string } | string;
  show?: { module?: string; imported?: string } | string;
  class?: { module?: string; imported?: string } | string;
}

interface TagsConfig {
  for?: { name?: string | string[] } | false;
  if?: {
    name?: string | string[];
    elif?: string | string[];
    else?: string | string[];
  } | false;
  /** key 即默认标签名 */
  custom?: Record<string, CustomDirectiveConfig>;
}

interface AttributesConfig {
  for?: { name?: string | string[]; priority?: number } | false;
  if?: {
    name?: string | string[];
    priority?: number;
    elif?: string | string[];
    else?: string | string[];
  } | false;
  show?: { name?: string | string[]; priority?: number } | false;
  class?: { name?: string | string[]; priority?: number } | false;
  html?: { name?: string | string[]; priority?: number } | false;
  /** 未配 name 时默认名 = prefix + key */
  custom?: Record<string, CustomDirectiveConfig>;
}

interface CustomDirectiveConfig {
  /** 省略时属性位用 prefix + key, 标签位用 key */
  name?: string | string[];
  /** 省略时 100 + 在 custom 里的声明下标 */
  priority?: number;
  transform: TransformDirective;
}
```

`PluginOptions` / `TransformDirective` 等类型都从包入口导出，用 TypeScript 写配置时可以直接标注：

```ts
import type { PluginOptions } from 'babel-plugin-jsx-advanced';
```

## 零配置默认值 {#zero-config-defaults}

`prefix` 与两份清单都不配时，等价于全部内置指令启用并各就各位（下表按默认前缀 `x-` 展示）：

| 位置 | 条目 | 默认注册名 | 默认 `priority` |
| --- | --- | --- | --- |
| `tags` | `for` | `for` | 0 |
| `tags` | `if` | `if` / `elif` / `else` | 1 / 1.1 / 1.2 |
| `attributes` | `for` | `x-for` | 0 |
| `attributes` | `if` | `x-if` / `x-elif` / `x-else` | 1 / 1.1 / 1.2 |
| `attributes` | `show` | `x-show` | 2 |
| `attributes` | `class` | `x-class` | 3 |
| `attributes` | `html` | `x-html` | 4 |

标签位内置条目的 `priority` 不可配，恒为 `for` = 0、`if` = 1；只有自定义标签能改。`elif` / `else` 也没有独立的 `priority`，恒为所属 `if` 加 `0.1` / `0.2`。

## 名字前缀 {#name-prefix}

`prefix` 作用于所有属性位的默认名：内置条目是 `prefix + kind`，自定义条目是 `prefix + key`。省略时为 `x-`，于是内置得到 `x-for` / `x-if` / `x-elif` / `x-else` / `x-show` / `x-class` / `x-html`。

- 标签位不受影响，默认名始终是 `for` / `if` / `elif` / `else`
- 自定义属性条目跟随 `prefix`：未配 `name` 时默认名是 `prefix + key`，key 写 `model` 就得到 `x-model`
- 自定义标签条目不受影响，默认名仍是 key
- 条目显式配了 `name` 就直接用 `name`，与 `prefix` 无关
- 传空字符串 `''` 表示不要前缀，内置属性名回到 `for` / `if` / `show` / `class` / `html`，自定义属性名回到 key

```js
// 换成 v- 前缀：v-for / v-if / v-show / v-class / v-html
['babel-plugin-jsx-advanced', { prefix: 'v-' }]
```

## 启用与禁用 {#enabling-and-disabling}

每个内置键的值三选一：

| 值 | 含义 |
| --- | --- |
| 省略 | 启用并走默认 |
| 配置对象 | 启用并按对象覆盖对应字段（`{}` 等价于省略） |
| `false` | 禁用：名字不再命中，属性 / 标签按普通 JSX 原样保留 |

只想加一条自定义指令时，不必把内置抄一遍——没写出的键仍然走默认。

## 条目字段 {#entry-fields}

**内置标签位**（`tags.for` / `tags.if`）：

| 字段 | 类型 | 缺省 | 说明 |
| --- | --- | --- | --- |
| `name` | `string \| string[]` | `for` / `if` | 注册名 |
| `elif` | `string \| string[]` | `elif` | 仅 `if`，elif 分支名 |
| `else` | `string \| string[]` | `else` | 仅 `if`，else 分支名 |

**内置属性位**（`attributes.for` / `if` / `show` / `class` / `html`）：

| 字段 | 类型 | 缺省 | 说明 |
| --- | --- | --- | --- |
| `name` | `string \| string[]` | `prefix + kind` | 注册名 |
| `priority` | `number` | 见上表 | 执行序，小者先 |
| `elif` | `string \| string[]` | `prefix + elif` | 仅 `if` |
| `else` | `string \| string[]` | `prefix + else` | 仅 `if` |

**自定义条目**（`tags.custom[key]` / `attributes.custom[key]`）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | `string \| string[]` | | 省略时属性位用 `prefix + key`，标签位用 key |
| `priority` | `number` | | 省略时 `100 + 声明下标` |
| `transform` | `Function` | ✅ | 命中后的变换逻辑，见[自定义指令](#custom-directives) |

自定义条目没有 `helper` 字段——需要运行时依赖时在 `transform` 里往 `state.directiveHelpers` 登记。

## 名字规则 {#naming-rules}

`name`、`elif`、`else` 都接受单个字符串或字符串数组，解析时按同一套规则处理：

1. 逐项 `trim`；
2. 丢弃非字符串与空白项；
3. 按首次出现顺序去重；
4. 结果为空时回落到默认名——自定义条目回落到它的 key。

数组里的名字**完全等价**，没有主名与别名之分；命中任意一项即等同于命中该指令。

```js
// 两种名字都能命中
{ attributes: { for: { name: ['x-for', 'each'] } } }
// 只配一个名字时，默认名不再参与匹配
{ attributes: { for: { name: 'each' } } }
```

标签名与属性名是两个独立命名空间，两侧都叫 `x-if` 也不冲突。当前不做跨条目重名检测：两个条目命中同一个名字时，按 `priority` 靠前的那条生效。

## 执行顺序 {#execution-order}

`priority` 数值越小越先执行，允许小数，按升序排序后依次应用。内置默认值见[零配置默认值](#zero-config-defaults)，自定义条目从 100 起按声明顺序递增，配了 `priority` 就用自己的值。

执行模型：

1. **标签位**：先用标签名匹配，命中后执行 transform。内置 `for` / `if` 返回新节点，整个元素被替换，同一元素上的属性指令不再执行；自定义标签返回 `void` 时只做原地修改，属性位继续执行。
2. **属性位**：按 `priority` 升序遍历条目，在元素的属性里找同名属性。命中一条就摘掉该属性，然后执行 transform。
3. **重新遍历**：transform 一旦替换节点，Babel 会重新遍历新树，剩余的指令在新树上继续执行。因此 `for`（0）先于 `if`（1）时，`if` 的条件可以引用循环变量；把两者对调就变成 Vue 3 语义。

各指令具体产物见[指令](#directives)。

## 运行时 helper {#runtime-helpers}

只有 `for` / `show` / `class` 有运行时依赖，默认值：

| kind | 默认模块 | 默认导入名 |
| --- | --- | --- |
| `for` | `babel-runtime-jsx-advanced-helper/for-helper` | `__brja_for_helper__` |
| `show` | `babel-runtime-jsx-advanced-helper/show-helper` | `__brja_show_helper__` |
| `class` | `babel-runtime-jsx-advanced-helper/class-helper` | `__brja_class_helper__` |

`if` 编译成三目、`html` 内联 `{ __html }`，都没有 helper。

```js
{
  plugins: [
    ['babel-plugin-jsx-advanced', {
      helpers: {
        // 字符串写法等价于只改 module，导入名仍是默认值
        for: './src/helpers/each',
        // 对象写法可以同时改导入名
        class: { module: 'clsx', imported: 'clsx' }
      }
    }]
  ]
}
```

helper 按 kind 走，不跟指令名走：把 `x-for` 改名成 `each`，导入名仍是 `__brja_for_helper__`。同一 helper 在 Program 结束时统一注入一次；源码里已有同名局部导入则跳过。

## locale {#locale}

报错语言，取值 `en-US`（默认）与 `zh-CN`。大小写、连字符 / 下划线都容错：`zh` / `zh-CN` / `zh_cn` / `ZH_CN` 都归一到 `zh-CN`；带地区标记却不匹配的（如 `zh-TW`）回落默认语言，不做前缀回退。

## 校验 {#validation}

配置在 `resolve` 阶段只做补齐，不做任何运行时校验：缺省字段填默认值，非法字段按未配置处理（例如把 `attributes.for` 写成字符串 `'each'`，等价于没配，仍然使用 `x-for`）。

字段类型由导出的 `PluginOptions` 类型约束，用 TypeScript 写配置时配错会在编译期报错；用 JS 写配置（`babel.config.js`）没有这层保护，请自行核对字段名。所有编译期报错见[错误码](#errors)。
