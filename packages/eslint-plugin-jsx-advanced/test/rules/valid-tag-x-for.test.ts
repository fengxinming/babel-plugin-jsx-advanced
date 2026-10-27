import rule from '../../src/rules/valid-tag-x-for.ts';
import { createRuleTester } from '../_ruleTester.ts';

const ruleTester = createRuleTester();

/** 英文文案 (缺省语言): 标题 + 标签示例块 */
function en(title: string, name = 'for'): string {
  return `${title} for ${name}.

e.g.:
  <${name} value={(item, index) in items}>...</${name}>
  <${name} value={item in items}>...</${name}>
`;
}

/** 中文文案: 标题自带指令名, 只拼标签示例块 */
function zh(title: string, name = 'for'): string {
  return `${title}

e.g.:
  <${name} value={(item, index) in items}>...</${name}>
  <${name} value={item in items}>...</${name}>
`;
}

ruleTester.run('valid-tag-x-for', rule, {
  valid: [
    {
      code: '<for value={(item, key) in foo}><i key={key} /></for>'
    },
    {
      code: '<for value={item in foo}><i>{item}</i></for>'
    },
    {
      // settings 改了名字, 规则跟着走
      code: '<each value={item in foo}><i>{item}</i></each>',
      settings: { 'jsx-advanced': { tag: { for: 'each' } } }
    },
    {
      // 名字配成数组, 命中其中任一个都算
      code: '<v-for value={item in foo}><i>{item}</i></v-for>',
      settings: { 'jsx-advanced': { tag: { for: ['x-for', 'v-for'] } } }
    },
    {
      // 展开属性不算绑定位
      code: '<for {...rest} value={item in foo}><i>{item}</i></for>'
    },
    {
      // 绑定位按名字取: value 不在第一个也照样认
      code: '<for cond={x} value={item in foo}><i>{item}</i></for>'
    }
  ],

  invalid: [
    {
      code: '<for><i /></for>',
      errors: [{ message: en('Missing a expression') }]
    },
    {
      // 只写了 cond: 等于没写 value
      code: '<for cond={item in foo}><i>{item}</i></for>',
      errors: [{ message: en('Missing a expression') }]
    },
    {
      // 不带 in: 表达式 token 够多但没有 in, 报缺 in
      code: '<for value={this.state.foo}><i /></for>',
      errors: [{ message: en("Missing a 'in' syntax") }]
    },
    {
      // 单个 token 的表达式: 不足 3 个, 报缺表达式
      code: '<for value={foo}><i /></for>',
      errors: [{ message: en('Missing a expression') }]
    },
    {
      code: '<for value={1 in this.state.foo}><i /></for>',
      errors: [{ message: en('Missing variable declarations') }]
    },
    {
      // 漏括号: `item, key in foo` 会被解析成逗号表达式, 变量表与数组脱开
      code: '<for value={item, key in foo}><i /></for>',
      errors: [{ message: en('Missing parentheses around loop variables') }]
    },
    {
      code: '<for value={(item, key)in foo}><i /></for>',
      errors: [{ message: en("Missing space before 'in' syntax") }]
    },
    {
      code: '<for value={(item, key) in[ 1, 2, 3 ]}><i /></for>',
      errors: [{ message: en("Missing space after 'in' syntax") }]
    },
    {
      // 文案里用实际命中的那个名字
      code: '<v-for><i /></v-for>',
      settings: { 'jsx-advanced': { tag: { for: ['x-for', 'v-for'] } } },
      errors: [{ message: en('Missing a expression', 'v-for') }]
    },
    {
      // locale 配中文, 出中文文案
      code: '<for><i /></for>',
      settings: { 'jsx-advanced': { locale: 'zh-CN' } },
      errors: [{ message: zh('for 指令缺少表达式。') }]
    }
  ]
});
