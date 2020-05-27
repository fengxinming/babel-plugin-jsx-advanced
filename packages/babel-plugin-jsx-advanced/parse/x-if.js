'use strict';

const types = require('@babel/types');

function matchDirective(directive, attributes) {
  for (let i = 0, l = attributes.length; i < l; i++) {
    const attr = attributes[i];
    // 有可能存在 JSXSpreadAttribute
    if (types.isJSXAttribute(attr) && directive === attr.name.name) {
      const { value } = attr;
      return {
        key: i,
        value: types.isJSXExpressionContainer(value)
          ? value.expression
          : value
      }; ;
    }
  }
  return null;
}

function createConditionalExpression(args, i) {
  const test = args[i++];
  const consequent = args[i++];
  const nextTest = args[i];
  return types.conditionalExpression(
    test,
    consequent,
    // eslint-disable-next-line no-nested-ternary
    nextTest === null
      ? args[i + 1]
      : nextTest === undefined
        ? types.nullLiteral() : createConditionalExpression(args, i)
  );
}

module.exports = function (nodePath, simpleIfNode, xElif, iElse) {
  let canScan = false;
  let nextNodePath = nodePath;
  // 用于构造三目表达式
  const statementArgs = [simpleIfNode.value, nextNodePath.node];
  do {
    canScan = false;

    // 获取下一个兄弟属性节点
    nextNodePath = nextNodePath.getSibling(nextNodePath.key + 1);

    // 空白节点 换行符等
    if (nextNodePath.isJSXText() && nextNodePath.node.value.trim() === '') {
      canScan = true;
    } else if (nextNodePath.isJSXElement()) {
      // else if 或者 else 情况
      const { node: { openingElement: { attributes } } } = nextNodePath;
      const nextElseIfNode = matchDirective(xElif, attributes);
      if (nextElseIfNode) {
        const { key, value } = nextElseIfNode;
        if (value === null) {
          throw nextNodePath.get('openingElement').get(`attributes.${key}`).buildCodeFrameError(`'${xElif}' 指令需要绑定一个变量或表达式.`);
        }
        attributes.splice(key, 1);
        statementArgs.push(value, nextNodePath.node);
        nextNodePath.remove();
        canScan = true;
      } else { // 可能还有else
        const nextElseNode = matchDirective(iElse, attributes);
        if (nextElseNode) {
          attributes.splice(nextElseNode.key, 1);
          statementArgs.push(null, nextNodePath.node);
          nextNodePath.remove();
        }
      }
    }
  } while (canScan);

  // 创建条件语句
  const ifExp = createConditionalExpression(statementArgs, 0);
  if (nodePath.parentPath.isJSXElement()) {
    nodePath.replaceWith(types.jsxExpressionContainer(ifExp));
  } else {
    nodePath.replaceWith(ifExp);
  }
};
