'use strict';

const { propName } = require('jsx-ast-utils');

module.exports = {
  meta: {
    docs: {
      description: 'a valid key for x-for',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null, // or "code" or "whitespace"
    schema: [],
    messages: {
      missingKey: `Missing key property for x-for.
缺少 key 属性关于 x-for 指令。

e.g.: 
  x-for={(item, index) in items} key={item.id}
  x-for={item in items} key={item.id}
`
    }
  },

  create(context) {
    const directiveConfig = (context.settings || {})['jsx-advanced'] || {};
    const prefix = directiveConfig.prefix || 'x-';
    const X_FOR = `${prefix}for`;

    return {
      JSXAttribute(node) {
        const attrName = propName(node);

        if (attrName !== X_FOR) {
          return;
        }

        let posKey = -1;
        const { attributes } = node.parent;
        for (let i = 0, l = attributes.length; i < l; i++) {
          const attr = attributes[i];
          if (propName(attr) === 'key') {
            posKey = i;
            break;
          }
        }
        if (posKey === -1) {
          context.report({
            node: node,
            messageId: 'missingKey',
            loc: node.loc
          });
        }
      }
    };
  }
};
