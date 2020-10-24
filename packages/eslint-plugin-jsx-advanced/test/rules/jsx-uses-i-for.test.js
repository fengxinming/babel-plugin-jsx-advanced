'use strict';

const rule = require('../../rules/jsx-uses-i-for');
const RuleTester = require('eslint').RuleTester;

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
});
ruleTester.run('jsx-uses-i-for', rule, {
  valid: [
    {
      code: '<div i-for={(item, key) in foo}>key: {key}, item: {item}</div>'
    },
    {
      code: '<div i-for={item in foo}>item: {item}</div>'
    }
  ],

  invalid: [
    {
      code: '<div i-for></div>',
      errors: [
        {
          message: `Missing a expression for i-for.
缺少表达式对于 i-for 指令。

e.g.: 
  i-for={(item, index) in items}
  i-for={item in items}
`
        }
      ]
    },
    {
      code: '<div i-for={this.state.foo}></div>',
      errors: [
        {
          message: `Missing a 'in' syntax for i-for.
缺少 in 关键字语法对于 i-for 指令。

e.g.: 
  i-for={(item, index) in items}
  i-for={item in items}
`
        }
      ]
    },
    {
      code: '<div i-for={1 in this.state.foo}></div>',
      errors: [
        {
          message: `Missing variable declarations for i-for.
缺少变量定义对于 i-for 指令。

e.g.: 
  i-for={(item, index) in items}
  i-for={item in items}
`
        }
      ]
    },
    {
      code: '<div i-for={(item, key)in foo}>key: {key}, item: {item}</div>',
      errors: [
        {
          message: `Missing space before 'in' syntax for i-for.
在 in 关键字语法前缺少空格对于 i-for 指令。

e.g.: 
  i-for={(item, index) in items}
  i-for={item in items}
`
        }
      ]
    },
    {
      code: '<div i-for={(item, key) in[ 1, 2, 3 ]}>key: {key}, item: {item}</div>',
      errors: [
        {
          message: `Missing space after 'in' syntax for i-for.
在 in 关键字语法后缺少空格对于 i-for 指令。

e.g.: 
  i-for={(item, index) in items}
  i-for={item in items}
`
        }
      ]
    }
  ]
});
