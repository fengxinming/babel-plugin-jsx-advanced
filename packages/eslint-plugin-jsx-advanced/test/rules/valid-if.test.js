'use strict';

const rule = require('../../rules/valid-if');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
});
ruleTester.run('valid-if', rule, {
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
          </div>
        `
    }
  ],

  invalid: [
    {
      code: `
        <if>
          <div></div>
        </if>
      `,
      errors: [
        {
          message: `Missing a 'value' attribute in <if> tag.

if 标签缺少 value 属性。`
        }
      ]
    },

    {
      code: `
        <div>
          <if></if>
          <elif></elif>
        </div>
      `,
      errors: [
        {
          message: `Missing a 'value' attribute in <if> tag.

if 标签缺少 value 属性。`
        },
        {
          message: `Missing a 'value' attribute in <elif> tag.

elif 标签缺少 value 属性。`
        }
      ]
    }
  ]
});
