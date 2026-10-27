# 错误码

插件在遍历 AST 时按节点位置抛错，全部走 `buildCodeFrameError`：终端里会输出出错位置的代码帧，错误指向真正出问题的节点，而不是整个元素。

文案语言由 [locale](/babel/configuration#locale) 决定，默认 `en-US`。

## 运行时域

| key | 触发条件 | 定位 |
| --- | --- | --- |
| `DIRECTIVE_VALUE_REQUIRED` | 属性形式的指令缺少绑定表达式：属性裸写，或值不是 `{…}`。`x-class` / `x-html` 额外接受字符串字面量 | 该指令属性 |
| `TAG_VALUE_REQUIRED` | 标签形式（`for` / `if` / `elif`）缺少 `value` 属性，或 `value` 不是 `{…}` 表达式 | 该标签元素 |
| `FOR_EXPRESSION_INVALID` | `for` 的绑定表达式不是 `… in …`，或 `in` 左侧不是标识符 / 括号包起来的标识符列表 | 指令属性或标签元素 |
| `BRANCH_ELIF_TAG_REQUIRES_PRECEDING` | `<elif>` 的前一个兄弟不是 `<if>` 标签 | 该 `<elif>` |
| `BRANCH_ELIF_ATTRIBUTE_REQUIRES_PRECEDING` | `x-elif` 所在元素的前一个兄弟不含 `x-if` | 该 `x-elif` 属性 |
| `BRANCH_ELSE_TAG_REQUIRES_PRECEDING` | `<else>` 的前一个兄弟不是 `<if>` / `<elif>` 标签 | 该 `<else>` |
| `BRANCH_ELSE_ATTRIBUTE_REQUIRES_PRECEDING` | `x-else` 所在元素的前一个兄弟不含 `x-if` / `x-elif` | 该 `x-else` 属性 |
| `ATTRIBUTE_ALREADY_SET` | `html` 要写入 `dangerouslySetInnerHTML`，但元素上已经显式写了该属性 | 已存在的 `dangerouslySetInnerHTML` |
| `ATTRIBUTE_MERGE_INVALID` | `show` / `class` 要与已有的 `style` / `className` 合并，但该属性不是可合并的绑定表达式（静态字符串、空容器、JSX 元素等） | 该宿主属性 |

分支扫描只允许穿过纯空白文本与仅含注释的空表达式；遇到其他元素、非空白文本或普通表达式就停止，后面的分支按「落单」报错。

```jsx
// 中间夹了注释以外的内容 → 后面的 x-else 落单
<div>
  <span x-if={a}>A</span>
  <p>说明</p>
  <span x-else>B</span>
</div>
```

## 占位符

文案里的 <code v-pre>{{…}}</code> 会替换成实际值：

| 占位符 | 含义 |
| --- | --- |
| <code v-pre>{{name}}</code> | 代码里实际写的指令名，可能是 `x-if` / `each` 等别名 |
| <code v-pre>{{main}}</code> | 所属 `if` 的主分支名，多名字时用 ` / ` 并列 |
| <code v-pre>{{elif}}</code> | 所属 `if` 的 elif 分支名，多名字时用 ` / ` 并列 |
| <code v-pre>{{tag}}</code> | 标签形式命中的标签名 |
| <code v-pre>{{attribute}}</code> | 指令要合并或写入的宿主属性名，如 `style` / `className` / `dangerouslySetInnerHTML` |

## 配置域

没有配置域错误。`resolve` 只补齐默认值、不校验配置，非法字段按未配置处理；字段类型由 `PluginOptions` 类型约束，用 TypeScript 写配置时配错会在编译期报错。详见[配置](/babel/configuration#校验)。
