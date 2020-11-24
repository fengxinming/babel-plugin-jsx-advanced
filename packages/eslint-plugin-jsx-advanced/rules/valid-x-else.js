'use strict';

const jsxUtil = require('jsx-ast-utils');

const { hasProp, getProp } = jsxUtil;

const { isJSXText, isJSXElement } = require('../utils/tools');

module.exports = {
  meta: {
    docs: {
      description: 'enforce valid `x-if`/`x-elif`/`x-else` directives',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null, // or "code" or "whitespace"
    schema: []
  },

  create(context) {
    const config = (context.settings || {})['jsx-advanced'] || {};
    const prefix = config.prefix || 'x-';
    const X_ELIF = `${prefix}${config.elifAlias || 'elif'}`;
    const X_ELSE = `${prefix}else`;
    const X_IF = `${prefix}if`;

    return {
      JSXElement(node) {
        let currentAttr;

        if (hasProp(node.openingElement.attributes, X_ELIF)) {
          currentAttr = X_ELIF;
        } else if (hasProp(node.openingElement.attributes, X_ELSE)) {
          currentAttr = X_ELSE;
        } else {
          return;
        }

        const siblings = node.parent && node.parent.children;
        // 兼容 babel6，可能 siblings 为 undefined
        if (!siblings || siblings.length < 2) {
          return;
        }

        const attrProp = getProp(node.openingElement.attributes, currentAttr);

        const curIndex = siblings.findIndex((n) => n === node);

        let result;
        for (let i = curIndex - 1; i >= 0; i--) {
          const n = siblings[i];
          if (isJSXText(n) && n.value.trim() === '') {
            continue;
          } else if (isJSXElement(n)) {
            const attrs = n.openingElement.attributes;
            if (hasProp(attrs, X_IF) || hasProp(attrs, X_ELIF)) {
              result = true;
            }
            break;
          }
        }

        if (!result) {
          context.report({
            node: attrProp,
            message: `Missing a jsx element which has a '${X_IF}' or '${X_ELIF}' directive as the previous jsx element.

'上一个JSX节点需要包含 '${X_IF}' 或 '${X_ELIF}' 指令。`,
            loc: attrProp.loc
          });
        }
      }
    };
  }
};
