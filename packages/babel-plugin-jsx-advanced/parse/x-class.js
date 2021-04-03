'use strict';

module.exports = function (types, attributes, simpleClassNode, simpleClassNameNode, classHelperAlias) {
  const callExp = (args) => {
    return types.callExpression(types.identifier(classHelperAlias), args);
  };

  if (!simpleClassNameNode) { // 没有 className 的情况
    attributes.push(
      types.jsxAttribute(
        types.jsxIdentifier('className'),
        types.jsxExpressionContainer(callExp([simpleClassNode.value]))
      )
    );
  } else {
    simpleClassNameNode.attr.value = types.jsxExpressionContainer(
      callExp([simpleClassNameNode.attr.value, simpleClassNode.value])
    );
  }
};
