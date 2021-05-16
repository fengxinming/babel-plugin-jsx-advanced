'use strict';

const jsxTypesMethods = [
  'jsxAttribute',
  'jSXAttribute',

  'jsxExpressionContainer',
  'jSXExpressionContainer',

  'jsxIdentifier',
  'jSXIdentifier'
];

/**
 * 兼容babel6的types定义
 *
 * @param {object} types @babel/types
 */
exports.compatTypes = function (types) {
  for (let i = 0, len = jsxTypesMethods.length; i < len; i++) {
    const alias = jsxTypesMethods[i];
    if (!types[alias]) {
      types[alias] = types[jsxTypesMethods[++i]];
    }
  }

  if (!types.jsxFragment) {
    types.jsxFragment = function (openingFragment, closingFragment, children) {
      return types.jSXElement(openingFragment, closingFragment, children);
    };
  }

  if (!types.jsxOpeningFragment) {
    types.jsxOpeningFragment = function () {
      return types.jSXOpeningElement(
        types.jSXMemberExpression(types.jSXIdentifier('React'), types.jSXIdentifier('Fragment')),
        []
      );
    };
  }

  if (!types.jsxClosingFragment) {
    types.jsxClosingFragment = function () {
      return types.jSXClosingElement(
        types.jSXMemberExpression(types.jSXIdentifier('React'), types.jSXIdentifier('Fragment'))
      );
    };
  }
};
