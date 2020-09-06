'use strict';

module.exports = function (types, attributes, simpleShowNode, simpleStyleNode, showHelperAlias) {
  if (!simpleStyleNode) {
    attributes.push(
      types.jsxAttribute(
        types.jsxIdentifier('style'),
        types.jsxExpressionContainer(
          types.conditionalExpression(
            simpleShowNode.value,
            types.nullLiteral(),
            types.objectExpression([
              types.objectProperty(
                types.stringLiteral('display'),
                types.stringLiteral('none')
              )
            ])
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
