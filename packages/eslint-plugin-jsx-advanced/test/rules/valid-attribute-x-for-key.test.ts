import rule from '../../src/rules/valid-attribute-x-for-key.ts';
import { createRuleTester } from '../_ruleTester.ts';

const ruleTester = createRuleTester();

/** 英文文案 (缺省语言) */
function en(name = 'x-for'): string {
  return `Missing key property for ${name}.

e.g.:
  ${name}={(item, index) in items} key={item.id}
  ${name}={item in items} key={item.id}
`;
}

/** 中文文案 */
function zh(name = 'x-for'): string {
  return `缺少 key 属性关于 ${name} 指令。

e.g.:
  ${name}={(item, index) in items} key={item.id}
  ${name}={item in items} key={item.id}
`;
}

ruleTester.run('valid-attribute-x-for-key', rule, {
  valid: [
    {
      code: '<div x-for={(item, index) in foo} key={item.id}>index: {index}, item: {item}</div>'
    },
    {
      code: '<div x-for={item in foo} key={item.id}>item: {item}</div>'
    },
    {
      // 名字配成数组, 命中其中任一个都算
      code: '<div v-for={item in foo} key={item.id}>item: {item}</div>',
      settings: { 'jsx-advanced': { attribute: { for: ['x-for', 'v-for'] } } }
    }
  ],

  invalid: [
    {
      code: '<div x-for={item in foo}></div>',
      errors: [{ message: en() }]
    },
    {
      // 文案里用实际命中的那个名字, 不是集合里的第一个
      code: '<div v-for={item in foo}></div>',
      settings: { 'jsx-advanced': { attribute: { for: ['x-for', 'v-for'] } } },
      errors: [{ message: en('v-for') }]
    },
    {
      // locale 配中文, 出中文文案
      code: '<div x-for={item in foo}></div>',
      settings: { 'jsx-advanced': { locale: 'zh-CN' } },
      errors: [{ message: zh() }]
    }
  ]
});
