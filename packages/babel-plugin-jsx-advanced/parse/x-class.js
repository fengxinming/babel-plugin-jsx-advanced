'use strict';

const types = require('@babel/types');

module.exports = function (attributes, simpleClassNode, simpleClassNameNode, classHelperAlias) {
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
