'use strict';

const { propName } = require('jsx-ast-utils');
const { isVariable, addDeclaredVariables } = require('../utils/tools');
const { OPERATOR_IN } = require('../utils/constants');

module.exports = {
  meta: {
    docs: {
      description: 'enforce valid `x-for` directives in jsx',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null, // or "code" or "whitespace"
    schema: []
  },

  create(context) {
    const config = (context.settings || {})['jsx-advanced'] || {};
    const prefix = config.prefix || 'x-';
    const X_FOR = `${prefix}for`;

    let xForVars = null;
    return {
      'Program:exit': function () {
        if (xForVars) {
          xForVars.length && addDeclaredVariables(context, xForVars);
          xForVars = null;
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
            xForVars = [
              ...new Set([
                ...(xForVars || []),
                ...tokensLeftVars.map(i => i.value)
              ])
            ];
          } else {
            // 如果没有定义变量，就给出警告
            const tokenInvalid =
              (tokensVarExpBeforeIn.length && tokensVarExpBeforeIn[0]) || tokenLeftBrace;
            context.report({
              node: tokenInvalid,
              message: `Missing variable declarations for ${X_FOR}.
缺少变量定义对于 ${X_FOR} 指令。

e.g.: 
  ${X_FOR}={(item, index) in items}
  ${X_FOR}={item in items}
`,
              loc: tokenInvalid.loc
            });
          }
        }

        if (expLength < 3) {
          // 没有表达式的情况
          context.report({
            node,
            message: `Missing a expression for ${X_FOR}.
缺少表达式对于 ${X_FOR} 指令。

e.g.: 
  ${X_FOR}={(item, index) in items}
  ${X_FOR}={item in items}
`,
            loc: node.loc
          });
        } else if (!tokenOperatorIn) {
          // 没有 in 关键字
          context.report({
            node,
            message: `Missing a 'in' syntax for ${X_FOR}.
缺少 in 关键字语法对于 ${X_FOR} 指令。

e.g.: 
  ${X_FOR}={(item, index) in items}
  ${X_FOR}={item in items}
`,
            loc: node.loc
          });
        } else if (!sourceCode.isSpaceBetweenTokens(tokenBeforeIn, tokenOperatorIn)) {
          // in 关键字左边需要有空格
          context.report({
            tokenOperatorIn,
            loc: tokenOperatorIn.loc,
            message: `Missing space before 'in' syntax for ${X_FOR}.
在 in 关键字语法前缺少空格对于 ${X_FOR} 指令。

e.g.: 
  ${X_FOR}={(item, index) in items}
  ${X_FOR}={item in items}
`
          });
        } else if (!sourceCode.isSpaceBetweenTokens(tokenOperatorIn, tokenAfterIn)) {
          // in 关键字右边边需要有空格
          context.report({
            tokenOperatorIn,
            loc: tokenOperatorIn.loc,
            message: `Missing space after 'in' syntax for ${X_FOR}.
在 in 关键字语法后缺少空格对于 ${X_FOR} 指令。

e.g.: 
  ${X_FOR}={(item, index) in items}
  ${X_FOR}={item in items}
`
          });
        }
      }
    };
  }
};
