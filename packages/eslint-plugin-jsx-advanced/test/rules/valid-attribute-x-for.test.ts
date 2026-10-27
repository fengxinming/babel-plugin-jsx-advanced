import rule from '../../src/rules/valid-attribute-x-for.ts';
import { createRuleTester } from '../_ruleTester.ts';

const ruleTester = createRuleTester();

/** 英文文案 (缺省语言): 标题 + 示例块 */
function en(title: string, name = 'x-for'): string {
  return `${title} for ${name}.

e.g.:
  ${name}={(item, index) in items}
  ${name}={item in items}
`;
}

/** 中文文案: 标题自带指令名, 只拼示例块 */
function zh(title: string, name = 'x-for'): string {
  return `${title}

e.g.:
  ${name}={(item, index) in items}
  ${name}={item in items}
`;
}

ruleTester.run('valid-attribute-x-for', rule, {
  valid: [
    {
      code: '<div x-for={(item, key) in foo}>key: {key}, item: {item}</div>'
    },
    {
      code: '<div x-for={item in foo}>item: {item}</div>'
    },
    {
      // settings 改了名字, 规则跟着走 (词即最终名)
      code: '<div each={(item, key) in foo}>item: {item}</div>',
      settings: { 'jsx-advanced': { attribute: { for: 'each' } } }
    },
    {
      // 名字配成数组, 命中其中任一个都算
      code: '<div v-for={item in foo}>item: {item}</div>',
      settings: { 'jsx-advanced': { attribute: { for: ['x-for', 'v-for'] } } }
    },
    {
      // 配了就以配置为准, 不再叠加默认名 —— x-for 不在集合里, 规则不认它
      code: '<div x-for={item in foo}>item: {item}</div>',
      settings: { 'jsx-advanced': { attribute: { for: ['v-for'] } } }
    }
  ],

  invalid: [
    {
      code: '<div x-for></div>',
      errors: [{ message: en('Missing a expression') }]
    },
    {
      // 不带 in: 表达式 token 够多但没有 in, 报缺 in
      code: '<div x-for={this.state.foo}>x</div>',
      errors: [{ message: en("Missing a 'in' syntax") }]
    },
    {
      // 单个 token 的表达式: 不足 3 个, 报缺表达式
      code: '<div x-for={foo}>x</div>',
      errors: [{ message: en('Missing a expression') }]
    },
    {
      code: '<div x-for={1 in this.state.foo}></div>',
      errors: [{ message: en('Missing variable declarations') }]
    },
    {
      // 漏括号: `item, key in foo` 会被解析成逗号表达式, 变量表与数组脱开
      code: '<div x-for={item, key in foo}>key: {key}, item: {item}</div>',
      errors: [{ message: en('Missing parentheses around loop variables') }]
    },
    {
      code: '<div x-for={(item, key)in foo}>key: {key}, item: {item}</div>',
      errors: [{ message: en("Missing space before 'in' syntax") }]
    },
    {
      code: '<div x-for={(item, key) in[ 1, 2, 3 ]}>key: {key}, item: {item}</div>',
      errors: [{ message: en("Missing space after 'in' syntax") }]
    },
    {
      // 名字改了以后, 报错文案跟着走
      code: '<div each></div>',
      settings: { 'jsx-advanced': { attribute: { for: 'each' } } },
      errors: [{ message: en('Missing a expression', 'each') }]
    },
    {
      // 同一元素命中同一条指令的多个名字 -> 报错
      code: '<div x-for v-for></div>',
      settings: { 'jsx-advanced': { attribute: { for: ['x-for', 'v-for'] } } },
      errors: [
        { message: 'Found more than one name of the same directive on this element: x-for, v-for.' }
      ]
    },
    {
      // locale 配中文, 出中文文案
      code: '<div x-for></div>',
      settings: { 'jsx-advanced': { locale: 'zh-CN' } },
      errors: [{ message: zh('x-for 指令缺少表达式。') }]
    }
  ]
});
