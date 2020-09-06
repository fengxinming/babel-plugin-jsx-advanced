'use strict';

module.exports = function (
  types, attributes, simpleClassNode, simpleClassNameNode, classHelperAlias
) {
  // 调用函数处理
  const callExp = types.callExpression(
    types.identifier(classHelperAlias),
    [simpleClassNode.value]
  );

  if (!simpleClassNameNode) {
    attributes.push(
      types.jsxAttribute(
        types.jsxIdentifier('className'),
        types.jsxExpressionContainer(callExp)
      )
    );
  } else {
    simpleClassNameNode.attr.value = types.jsxExpressionContainer(callExp);
  }
};
