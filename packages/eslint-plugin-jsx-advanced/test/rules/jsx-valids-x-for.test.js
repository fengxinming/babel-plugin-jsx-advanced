'use strict';

const rule = require('../../rules/jsx-valids-x-for');
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
ruleTester.run('jsx-valids-x-for', rule, {
  valid: [
    {
      code: '<div x-for={(item, key) in foo}>key: {key}, item: {item}</div>'
    },
    {
      code: '<div x-for={item in foo}>item: {item}</div>'
    }
  ],

  invalid: [
    {
      code: '<div x-for></div>',
      errors: [
        {
          message: `Missing a expression for x-for.
缺少表达式对于 x-for 指令。

e.g.: 
  x-for={(item, index) in items}
  x-for={item in items}
`
        }
      ]
    },
    {
      code: '<div x-for={this.state.foo}></div>',
      errors: [
        {
          message: `Missing a 'in' syntax for x-for.
缺少 in 关键字语法对于 x-for 指令。

e.g.: 
  x-for={(item, index) in items}
  x-for={item in items}
`
        }
      ]
    },
    {
      code: '<div x-for={1 in this.state.foo}></div>',
      errors: [
        {
          message: `Missing variable declarations for x-for.
缺少变量定义对于 x-for 指令。

e.g.: 
  x-for={(item, index) in items}
  x-for={item in items}
`
        }
      ]
    },
    {
      code: '<div x-for={(item, key)in foo}>key: {key}, item: {item}</div>',
      errors: [
        {
          message: `Missing space before 'in' syntax for x-for.
在 in 关键字语法前缺少空格对于 x-for 指令。

e.g.: 
  x-for={(item, index) in items}
  x-for={item in items}
`
        }
      ]
    },
    {
      code: '<div x-for={(item, key) in[ 1, 2, 3 ]}>key: {key}, item: {item}</div>',
      errors: [
        {
          message: `Missing space after 'in' syntax for x-for.
在 in 关键字语法后缺少空格对于 x-for 指令。

e.g.: 
  x-for={(item, index) in items}
  x-for={item in items}
`
        }
      ]
    }
  ]
});
