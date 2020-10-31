'use strict';

const jsxUtil = require('jsx-ast-utils');

const { hasProp, getProp } = jsxUtil;

const { isJSXText, isJSXElement } = require('../utils/tools');

module.exports = {
  meta: {
    docs: {
      description: 'enforce valid `x-elif` directives',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null, // or "code" or "whitespace"
    schema: []
  },

  create(context) {
    return {
      JSXElement(node) {
        const config = (context.settings || {})['jsx-advanced'] || {};
        const prefix = config.prefix || 'x-';
        const X_ELIF = `${prefix}${config.elifAlias || 'elif'}`;
        const X_ELSE = `${prefix}else`;
        const X_IF = `${prefix}if`;

        if (!hasProp(node.openingElement.attributes, X_ELSE)) {
          return;
        }

        const siblings = node.parent && node.parent.children;
        if (siblings.length < 2) {
          return;
        }

        const attrProp = getProp(node.openingElement.attributes, X_ELSE);

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

'${X_ELSE}' 指令需要上一个JSX节点包含 '${X_IF}' 或 '${X_ELIF}' 指令。`,
            loc: attrProp.loc
          });
        }
      }
    };
  }
};
