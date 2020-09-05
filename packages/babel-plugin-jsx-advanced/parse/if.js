'use strict';

const types = require('@babel/types');

function jsxFragment(children) {
  return types.jsxFragment(
    types.jsxOpeningFragment(),
    types.jsxClosingFragment(),
    children
  );
}

function safeNode(node) {
  return types.isJSXText(node)
    ? jsxFragment([node])
    : types.isJSXExpressionContainer(node)
      ? node.expression
      : node;
}

function combineNodes(nodes) {
  let jsxElement;
  const newNodes = nodes.filter((n) => !(types.isJSXText(n) && n.value.trim() === ''));
  switch (newNodes.length) {
    case 0:
      jsxElement = types.nullLiteral();
      break;
    case 1:
      jsxElement = safeNode(newNodes[0]);
      break;
    default:
      jsxElement = jsxFragment(newNodes);
  }
  return jsxElement;
}

function getTagNode(nodePath) {
  const { node: { openingElement: { attributes, name }, children } } = nodePath;
  if (!attributes.length) {
    throw nodePath.buildCodeFrameError(`<${name.name}> 标签需要一个 value 属性并绑定一个变量或表达式.`);
  }
  let { value } = attributes[0];
  value = types.isJSXExpressionContainer(value)
    ? value.expression
    : value;
  if (value === null) {
    throw nodePath.get('openingElement').get('attributes.0')
      .buildCodeFrameError(`<${name.name}> 标签需要 ${attributes[0].name.name} 属性绑定一个变量或表达式.`);
  }
  return {
    statement: value,
    node: combineNodes(children)
  };
}

function createConditionalExpression(args, i) {
  // eslint-disable-next-line no-plusplus
  const test = args[i++];
  // eslint-disable-next-line no-plusplus
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

function parseIfTag(nodePath, ELSE_IF_TAG, ELSE_TAG) {
  let canScan = false;
  let nextNodePath = nodePath;
  // 用于构造三目表达式
  const ifTag = getTagNode(nextNodePath);
  const statementArgs = [ifTag.statement, ifTag.node];
  do {
    canScan = false;

    // 获取下一个兄弟属性节点
    nextNodePath = nextNodePath.getSibling(nextNodePath.key + 1);

    if (nextNodePath.isJSXElement()) {
      // else if 或者 else 情况
      switch (nextNodePath.node.openingElement.name.name) {
        case ELSE_IF_TAG: {
          const elifTag = getTagNode(nextNodePath);
          canScan = true;
          statementArgs.push(elifTag.statement, elifTag.node);
          nextNodePath.remove();
          break;
        }
        case ELSE_TAG: {
          statementArgs.push(null, combineNodes(nextNodePath.node.children));
          nextNodePath.remove();
          break;
        }
      }
    } else if (nextNodePath.isJSXText() && nextNodePath.node.value.trim() === '') {
      // 空白节点 换行符
      canScan = true;
    } else if (nextNodePath.isJSXExpressionContainer() && types.isJSXEmptyExpression(nextNodePath.node.expression)) {
      // 空表达式
      nextNodePath.remove();
      canScan = true;
    }
  } while (canScan);

  // 创建条件语句
  const ifExp = createConditionalExpression(statementArgs, 0);
  if (nodePath.parentPath.isJSXElement()) {
    nodePath.replaceWith(types.jsxExpressionContainer(ifExp));
  } else {
    nodePath.replaceWith(ifExp);
  }
}

module.exports = parseIfTag;
