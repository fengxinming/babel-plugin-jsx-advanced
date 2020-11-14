'use strict';

const jsxUtil = require('jsx-ast-utils');

const { hasProp } = jsxUtil;

module.exports = {
  meta: {
    docs: {
      description: 'enforce valid `if` tags',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null, // or "code" or "whitespace"
    schema: []
  },

  create(context) {
    const config = (context.settings || {})['jsx-advanced'] || {};
    const ELIF = `${config.elifAlias || 'elif'}`;
    const conditionTags = { if: true, [ELIF]: true };

    return {
      JSXElement(node) {
        const { name } = node.openingElement.name;
        if (!conditionTags[name]) {
          return;
        }

        if (!hasProp(node.openingElement.attributes, 'value')) {
          context.report({
            node,
            message: `Missing a 'value' attribute in <${name}> tag.

${name} 标签缺少 value 属性。`,
            loc: node.loc
          });
        }
      }
    };
  }
};
