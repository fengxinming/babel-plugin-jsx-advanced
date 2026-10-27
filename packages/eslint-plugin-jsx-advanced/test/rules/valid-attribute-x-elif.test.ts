import rule from '../../src/rules/valid-attribute-x-if.ts';
import { createRuleTester } from '../_ruleTester.ts';

const ruleTester = createRuleTester();

/** 英文文案 (缺省语言) */
const EN = "Missing a jsx element which has a 'x-if' or 'x-elif' directive as the previous jsx element.";
/** 中文文案 */
const ZH = "上一个JSX节点需要包含 'x-if' 或 'x-elif' 指令。";

ruleTester.run('valid-attribute-x-elif', rule, {
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
      // settings 改了名字, 规则跟着走
      code: `
            <div>
                <div each-if={this.state.foo}>1</div>
                <div each-elif={this.state.bar}>1</div>
            </div>
          `,
      settings: { 'jsx-advanced': { attribute: { if: 'each-if', elif: 'each-elif' } } }
    },
    {
      // 名字配成数组, 命中其中任一个都算
      code: `
            <div>
                <div v-if={this.state.foo}>1</div>
                <div v-elif={this.state.bar}>1</div>
            </div>
          `,
      settings: {
        'jsx-advanced': { attribute: { if: ['x-if', 'v-if'], elif: ['x-elif', 'v-elif'] } }
      }
    }
  ],

  invalid: [
    {
      code: `
        <div>
            <div x-elif={this.state.bar}>1</div>
            <div x-else>1</div>
        </div>
      `,
      errors: [{ message: EN }]
    },

    {
      code: `
          <div>
              <div x-elif={this.state.bar}>1</div>
              <div x-elif={this.state.boo}>1</div>
              <div x-else>1</div>
          </div>
        `,
      errors: [{ message: EN }]
    },

    {
      code: `
          <div>
              <div x-elif={this.state.bar}>1</div>
              <div x-if={this.state.foo}>1</div>
              <div x-else>1</div>
          </div>
        `,
      errors: [{ message: EN }]
    },

    {
      // 分支之间夹了非空白文本: babel 不会折叠, 链已断
      code: '<div><div x-if={a}>1</div>hello<div x-elif={b}>2</div></div>',
      errors: [{ message: EN }]
    },

    {
      // 同一元素命中 if 族的多个名字 -> 报错
      code: '<div x-if v-if>1</div>',
      settings: { 'jsx-advanced': { attribute: { if: ['x-if', 'v-if'] } } },
      errors: [
        { message: 'Found more than one name of the same directive on this element: x-if, v-if.' }
      ]
    },

    {
      // locale 配中文, 出中文文案
      code: `
        <div>
            <div x-elif={this.state.bar}>1</div>
        </div>
      `,
      settings: { 'jsx-advanced': { locale: 'zh-CN' } },
      errors: [{ message: ZH }]
    }
  ]
});
