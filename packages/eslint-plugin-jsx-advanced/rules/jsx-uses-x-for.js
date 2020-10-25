'use strict';

const { propName } = require('jsx-ast-utils');
const { isVariable, addDeclaredVariables } = require('../utils/tools');
const { OPERATOR_IN, X_FOR } = require('../utils/constants');

module.exports = {
  meta: {
    docs: {
      description: 'a valid expression for x-for',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null, // or "code" or "whitespace"
    schema: [],
    messages: {
      missingExp: `Missing a expression for x-for.
缺少表达式对于 x-for 指令。

e.g.: 
  x-for={(item, index) in items}
  x-for={item in items}
`,
      missingIn: `Missing a 'in' syntax for x-for.
缺少 in 关键字语法对于 x-for 指令。

e.g.: 
  x-for={(item, index) in items}
  x-for={item in items}
`,
      missingVars: `Missing variable declarations for x-for.
缺少变量定义对于 x-for 指令。

e.g.: 
  x-for={(item, index) in items}
  x-for={item in items}
`,
      missingSpaceBeforeIn: `Missing space before 'in' syntax for x-for.
在 in 关键字语法前缺少空格对于 x-for 指令。

e.g.: 
  x-for={(item, index) in items}
  x-for={item in items}
`,
      missingSpaceAfterIn: `Missing space after 'in' syntax for x-for.
在 in 关键字语法后缺少空格对于 x-for 指令。

e.g.: 
  x-for={(item, index) in items}
  x-for={item in items}
`
    }
  },

  create(context) {
    let iForVars = null;
    return {
      'Program:exit': function () {
        if (iForVars) {
          iForVars.length && addDeclaredVariables(context, iForVars);
          iForVars = null;
        }
      },
      JSXAttribute(node) {
        const attrName = propName(node);

        if (attrName !== X_FOR) {
          return;
        }

        const sourceCode = context.getSourceCode();
        const tokenAttrStart = sourceCode.getFirstToken(node);
        const tokenEqStart = sourceCode.getTokenAfter(tokenAttrStart);
        const tokenLeftBrace = sourceCode.getTokenAfter(tokenEqStart);
        const tokenRightBrace = sourceCode.getLastToken(node);
        const tokenExpression = sourceCode.getTokensBetween(tokenLeftBrace, tokenRightBrace);
        const expLength = tokenExpression.length;
        const tokenOperatorIn = tokenExpression.find((n) => n.value === OPERATOR_IN);

        let tokenBeforeIn;
        let tokenAfterIn;
        // in 关键字存在的情况
        if (tokenOperatorIn) {
          tokenBeforeIn = sourceCode.getTokenBefore(tokenOperatorIn);
          tokenAfterIn = sourceCode.getTokenAfter(tokenOperatorIn);

          // 在表达式中获取定义的变量
          const tokensVarExpBeforeIn =
            sourceCode.getTokensBetween(tokenLeftBrace, tokenOperatorIn) || [];
          const tokensLeftVars = tokensVarExpBeforeIn.filter(i => {
            return isVariable(i.value);
          });

          if (tokensLeftVars.length) {
            // 暂存变量用于放入当前作用域
            iForVars = [
              ...new Set([
                ...(iForVars || []),
                ...tokensLeftVars.map(i => i.value)
              ])
            ];
          } else {
            // 如果没有定义变量，就给出警告
            const tokenInvalid =
              (tokensVarExpBeforeIn.length && tokensVarExpBeforeIn[0]) || tokenLeftBrace;
            context.report({
              node: tokenInvalid,
              messageId: 'missingVars',
              loc: tokenInvalid.loc
            });
          }
        }

        if (expLength < 3) {
          // 没有表达式的情况
          context.report({
            node,
            messageId: 'missingExp',
            loc: node.loc
          });
        } else if (!tokenOperatorIn) {
          // 没有 in 关键字
          context.report({
            node,
            messageId: 'missingIn',
            loc: node.loc
          });
        } else if (!sourceCode.isSpaceBetweenTokens(tokenBeforeIn, tokenOperatorIn)) {
          // in 关键字左边需要有空格
          context.report({
            tokenOperatorIn,
            messageId: 'missingSpaceBeforeIn',
            loc: tokenOperatorIn.loc
          });
        } else if (!sourceCode.isSpaceBetweenTokens(tokenOperatorIn, tokenAfterIn)) {
          // in 关键字右边边需要有空格
          context.report({
            tokenOperatorIn,
            messageId: 'missingSpaceAfterIn',
            loc: tokenOperatorIn.loc
          });
        }
      }
    };
  }
};
