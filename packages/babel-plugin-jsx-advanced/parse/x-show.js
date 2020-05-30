'use strict';

const types = require('@babel/types');

module.exports = function (attributes, simpleShowNode, simpleStyleNode, showHelperAlias) {
  if (!simpleStyleNode) {
    attributes.push(
      types.jsxAttribute(
        types.jsxIdentifier('style'),
        types.jsxExpressionContainer(
          types.callExpression(
            types.identifier(showHelperAlias),
            [types.nullLiteral(), simpleShowNode.value]
          )
        )
      )
    );
  } else {
    simpleStyleNode.attr.value = types.jsxExpressionContainer(
      types.callExpression(
        types.identifier(showHelperAlias),
        [simpleStyleNode.value, simpleShowNode.value]
      )
    );
  }
};
