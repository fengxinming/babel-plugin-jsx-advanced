import rule from '../../src/rules/valid-tag-x-if.ts';
import { createRuleTester } from '../_ruleTester.ts';

const ruleTester = createRuleTester();

/** 缺 value 的英文文案 (缺省语言) */
const EN_VALUE = "Missing a 'value' attribute in <if> tag.";
/** 缺 value 的中文文案 */
const ZH_VALUE = 'if 标签缺少 value 属性。';
/** 断链的英文文案 */
const EN_CHAIN = 'Missing a jsx element which has a <if> or <elif> tag as the previous jsx element.';
/** 断链的中文文案 */
const ZH_CHAIN = '上一个JSX节点需要是 <if> 或 <elif> 标签。';

ruleTester.run('valid-tag-x-if', rule, {
  valid: [
    {
      code: `
          <if value={this.state.foo}>
            <div></div>
          </if>
        `
    },
    {
      code: `
          <div>
            <if value={this.state.foo}><div></div></if>
            <elif value={this.state.bar}><div></div></elif>
            <else><div></div></else>
          </div>
        `
    },
    {
      // 分支之间只有空白 / 注释时前驱仍然成立 (babel 折叠前会删除它们)
      code: `
          <div>
            <if value={this.state.foo}>1</if>
            {/* 注释 */}
            <else>2</else>
          </div>
        `
    },
    {
      // settings 改了名字, 规则跟着走
      code: `
          <div>
            <each-if value={this.state.foo}>1</each-if>
            <each-else>2</each-else>
          </div>
        `,
      settings: { 'jsx-advanced': { tag: { if: 'each-if', elif: 'each-elif', else: 'each-else' } } }
    },
    {
      // 名字配成数组, 命中其中任一个都算
      code: `
          <div>
            <v-if value={this.state.foo}>1</v-if>
            <v-else>2</v-else>
          </div>
        `,
      settings: { 'jsx-advanced': { tag: { if: ['x-if', 'v-if'], else: ['x-else', 'v-else'] } } }
    },
    {
      // 绑定位按名字取: value 不在第一个也照样认
      code: '<if cond={this.state.foo} value={this.state.bar}><div /></if>'
    },
    {
      // 展开属性不算绑定位
      code: '<if {...rest} value={this.state.foo}><div /></if>'
    },
    {
      // 名字先 trim 再匹配, 重复项自动去重
      code: '<v-if value={a}>1</v-if>',
      settings: { 'jsx-advanced': { tag: { if: [' v-if ', 'v-if'] } } }
    },
    {
      // 配置全是空白 -> 回落到默认名, 而不是静默失效
      code: '<if value={a}>1</if>',
      settings: { 'jsx-advanced': { tag: { if: ['  ', ''] } } }
    },
    {
      // <else> 不需要绑定位
      code: '<div><if value={a}>1</if><else>2</else></div>'
    }
  ],

  invalid: [
    {
      code: `
        <if>
          <div></div>
        </if>
      `,
      errors: [{ message: EN_VALUE }]
    },

    {
      // 属性名有但没绑值 —— babel 侧报 TAG_VALUE_REQUIRED, 规则不能放过去
      code: '<if value><div /></if>',
      errors: [{ message: EN_VALUE }]
    },

    {
      // 绑定位按名字取: 只写了 cond 等于没写 value
      code: '<if cond={this.state.foo}><div /></if>',
      errors: [{ message: EN_VALUE }]
    },

    {
      code: `
        <div>
          <if></if>
          <elif></elif>
        </div>
      `,
      errors: [
        { message: EN_VALUE },
        { message: "Missing a 'value' attribute in <elif> tag." }
      ]
    },

    {
      // 标签位新增: <elif> 前面必须先是 <if> / <elif>
      code: `
        <div>
          <elif value={this.state.bar}>1</elif>
        </div>
      `,
      errors: [{ message: EN_CHAIN }]
    },

    {
      // <else> 前面是普通标签, 同样算断链
      code: `
        <div>
          <if value={this.state.foo}>1</if>
          <div>1</div>
          <else>2</else>
        </div>
      `,
      errors: [{ message: EN_CHAIN }]
    },

    {
      // 分支之间夹了非空白文本: babel 不会折叠, 链已断
      code: '<div><if value={a}>1</if>hello<else>2</else></div>',
      errors: [{ message: EN_CHAIN }]
    },

    {
      // 多名字配置: 文案并列展示全部候选, 与实际命中的 v-else 一起给出
      code: '<div><v-else>2</v-else></div>',
      settings: {
        'jsx-advanced': {
          tag: { if: ['x-if', 'v-if'], elif: ['x-elif', 'v-elif'], else: ['x-else', 'v-else'] }
        }
      },
      errors: [
        {
          message: 'Missing a jsx element which has a <x-if / v-if> or <x-elif / v-elif> tag'
            + ' as the previous jsx element.'
        }
      ]
    },

    {
      // locale 配中文: 缺 value 与断链都出中文
      code: `
        <div>
          <if>1</if>
          <div>2</div>
          <elif value={this.state.bar}>3</elif>
        </div>
      `,
      settings: { 'jsx-advanced': { locale: 'zh-CN' } },
      errors: [{ message: ZH_VALUE }, { message: ZH_CHAIN }]
    }
  ]
});
