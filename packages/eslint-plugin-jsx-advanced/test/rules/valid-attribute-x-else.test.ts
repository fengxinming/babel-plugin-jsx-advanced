import rule from '../../src/rules/valid-attribute-x-if.ts';
import { createRuleTester } from '../_ruleTester.ts';

const ruleTester = createRuleTester();

/** 英文文案 (缺省语言) */
const EN = "Missing a jsx element which has a 'x-if' or 'x-elif' directive as the previous jsx element.";
/** 中文文案 */
const ZH = "上一个JSX节点需要包含 'x-if' 或 'x-elif' 指令。";

ruleTester.run('valid-attribute-x-else', rule, {
  valid: [
    {
      code: `
          <div>
              <div x-if={this.state.foo}>1</div>
              <div x-elif={this.state.bar}>1</div>
              <div x-elif={this.state.boo}>1</div>
              <div x-else>1</div>
          </div>
        `
    },
    {
      code: `
            <div>
                <div x-if={this.state.foo}>1</div>
                <div x-elif={this.state.bar}>1</div>
  
                <div x-else>1</div>
            </div>
          `
    },
    {
      // 名字配成数组, 前驱同样按集合找
      code: `
            <div>
                <div v-if={this.state.foo}>1</div>
                <div v-else>1</div>
            </div>
          `,
      settings: { 'jsx-advanced': { attribute: { if: ['x-if', 'v-if'], else: ['x-else', 'v-else'] } } }
    }
  ],

  invalid: [
    {
      code: `
        <div>
            <div x-else>1</div>
        </div>
      `,
      errors: [{ message: EN }]
    },
    {
      code: `
          <div>
              <div x-if={this.state.foo}>1</div>
              <div x-else>1</div>
              <div x-else>2</div>
          </div>
        `,
      errors: [{ message: EN }]
    },
    {
      code: `
            <div>
                <div x-if={this.state.foo}>1</div>
                <div>1</div>
                <div x-else>2</div>
            </div>
          `,
      errors: [{ message: EN }]
    },
    {
      // 同一元素命中 else 的多个名字 -> 报错
      code: '<div x-else v-else>1</div>',
      settings: { 'jsx-advanced': { attribute: { else: ['x-else', 'v-else'] } } },
      errors: [
        { message: 'Found more than one name of the same directive on this element: x-else, v-else.' }
      ]
    },
    {
      // locale 配中文, 出中文文案
      code: `
        <div>
            <div x-else>1</div>
        </div>
      `,
      settings: { 'jsx-advanced': { locale: 'zh-CN' } },
      errors: [{ message: ZH }]
    }
  ]
});
