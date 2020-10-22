'use strict';

module.exports = function (types, nodePath, simpleForNode, forHelperAlias) {
  const expression = simpleForNode.value;
  let arr; // 待遍历的数组或者对象
  let params = []; // 构造回调函数的参数
  if (types.isBinaryExpression(expression, { operator: 'in' })) {
    const { left, right } = expression;
    arr = right;

    if (types.isSequenceExpression(left)) { // x-for={(item, key) in value}
      params = left.expressions;
    } else if (types.isIdentifier(left)) { // x-for={item in value}
      params[params.length] = left;
    } else {
      throw nodePath.get('openingElement').get(`attributes.${simpleForNode.key}`).buildCodeFrameError(`'${simpleForNode.name}' 指令需要绑定一个正确的表达式.`);
    }
  } else {
    // x-for={value}, x-for={callExp()}, ...
    arr = expression;
  }

  // 创建循环语句
  const mapExp = types.callExpression(
    types.identifier(forHelperAlias),
    [arr, types.arrowFunctionExpression(params, nodePath.node)]
  );
  if (nodePath.parentPath.isJSXElement()) {
    nodePath.replaceWith(types.jsxExpressionContainer(mapExp));
  } else {
    nodePath.replaceWith(mapExp);
  }
};
