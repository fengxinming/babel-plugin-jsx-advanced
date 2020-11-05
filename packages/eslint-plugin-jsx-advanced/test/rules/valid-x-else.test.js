'use strict';

const rule = require('../../rules/valid-x-else');
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
ruleTester.run('valid-x-else', rule, {
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
    }
  ],

  invalid: [
    {
      code: `
        <div>
            <div x-else>1</div>
        </div>
      `,
      errors: [
        {
          message: `Missing a jsx element which has a 'x-if' or 'x-elif' directive as the previous jsx element.

'x-else' 指令需要上一个JSX节点包含 'x-if' 或 'x-elif' 指令。`
        }
      ]
    },
    {
      code: `
          <div>
              <div x-if={this.state.foo}>1</div>
              <div x-else>1</div>
              <div x-else>2</div>
          </div>
        `,
      errors: [
        {
          message: `Missing a jsx element which has a 'x-if' or 'x-elif' directive as the previous jsx element.

'x-else' 指令需要上一个JSX节点包含 'x-if' 或 'x-elif' 指令。`
        }
      ]
    },
    {
      code: `
            <div>
                <div x-if={this.state.foo}>1</div>
                <div>1</div>
                <div x-else>2</div>
            </div>
          `,
      errors: [
        {
          message: `Missing a jsx element which has a 'x-if' or 'x-elif' directive as the previous jsx element.

'x-else' 指令需要上一个JSX节点包含 'x-if' 或 'x-elif' 指令。`
        }
      ]
    }
  ]
});
