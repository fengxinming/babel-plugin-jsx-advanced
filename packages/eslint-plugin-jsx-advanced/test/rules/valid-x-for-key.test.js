'use strict';

const rule = require('../../rules/valid-x-for-key');
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

const missingKey = `Missing key property for x-for.
缺少 key 属性关于 x-for 指令。

e.g.: 
  x-for={(item, index) in items} key={item.id}
  x-for={item in items} key={item.id}
`;

describe('测试 x-for 指令', () => {
  ruleTester.run('valid-x-for', rule, {
    valid: [
      {
        code: '<div x-for={(item, index) in foo} key={item.id}>index: {index}, item: {item}</div>'
      },
      {
        code: '<div x-for={item in foo} key={item.id}>item: {item}</div>'
      }
    ],

    invalid: [
      {
        code: '<div x-for={item in foo}></div>',
        errors: [
          {
            message: missingKey
          }
        ]
      }
    ]
  });
});
