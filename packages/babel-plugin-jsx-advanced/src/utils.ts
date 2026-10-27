import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import type { JsxValueResult } from './types';

/** 创建一个不含空白的 JSX Fragment */
export function createJsxFragment(types: typeof t, children: t.Node[]): t.JSXFragment {
  return types.jsxFragment(
    types.jsxOpeningFragment(),
    types.jsxClosingFragment(),
    children as t.JSXFragment['children']
  );
}

/**
 * 把 JSX 子节点转换成可放入表达式的节点。
 *
 * 非表达式类子节点 (如 JSXSpreadChild) 不能直接返回, 否则会被塞进三目分支的
 * consequent, 触发 babel 的 AST 校验错误 ("... got JSXSpreadChild")。包成 Fragment
 * 后交给 preset-react, 由它报出标准文案 "Spread children are not supported in React."
 */
function safeNode(types: typeof t, node: t.Node): t.Expression {
  if (types.isJSXText(node)) {
    return createJsxFragment(types, [node]);
  }
  if (types.isJSXExpressionContainer(node)) {
    return node.expression as t.Expression;
  }
  if (types.isJSXElement(node) || types.isJSXFragment(node)) {
    return node;
  }
  return createJsxFragment(types, [node]);
}

/** 纯缩进字符集: 只用空格 / 制表符 / CR / LF, 与 babel 的切分口径一致 */
const ONLY_INDENT = /^[ \t\r\n]*$/;

/** babel 参与换行切分的只有 \r\n / \n / \r, 不含 U+2028 / U+2029 */
const HAS_LINE_BREAK = /[\r\n]/;

/**
 * 子节点是否可以产出内容。
 *
 * 判断规则与 preset-react 的 cleanJSXElementLiteralChild 对齐, 不能用 String#trim():
 * - 含换行的纯空白是缩进, babel 会整段丢弃;
 * - 不含换行的纯空格 / 制表符是真实内容 (行内元素之间的空格), 必须保留;
 * - NBSP、全角空格等 trim() 会误杀, 而 babel 把它们当普通字符。
 *
 * 空表达式容器 (`{/* 注释 *\/}`) 不产出内容, 且若按表达式解包会得到非法的
 * JSXEmptyExpression, 必须提前过滤。
 */
function hasContent(types: typeof t, node: t.Node): boolean {
  if (types.isJSXText(node)) {
    return !(ONLY_INDENT.test(node.value) && HAS_LINE_BREAK.test(node.value));
  }
  return !(types.isJSXExpressionContainer(node) && types.isJSXEmptyExpression(node.expression));
}

/**
 * 合并标签的子节点: 无内容的节点滤掉, 剩下的单个直接取, 多个包成 Fragment
 */
export function combineNodes(types: typeof t, nodes: t.Node[]): t.Expression {
  const newNodes = nodes.filter((node) => hasContent(types, node));
  switch (newNodes.length) {
    case 0:
      return types.nullLiteral();
    case 1:
      return safeNode(types, newNodes[0]);
    default:
      return createJsxFragment(types, newNodes);
  }
}

export function getValueFromAttributes(
  attributeName: string,
  attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute>,
  types: typeof t
): JsxValueResult | null {
  for (let i = 0, l = attributes.length; i < l; i++) {
    const attr = attributes[i];
    if (types.isJSXAttribute(attr)
      && types.isJSXIdentifier(attr.name)
      && attr.name.name === attributeName) {
      return { value: attr.value, attribute: attr, attributeIndex: i };
    }
  }
  return null;
}

/**
 * @param args 条件与结果交替排列的参数
 * @param i 当前处理的起始下标
 */
export function createConditionalExpression(
  types: typeof t,
  args: Array<t.Expression | null>,
  i: number
): t.Expression {
  const test = args[i] as t.Expression;
  const cursor = i + 1;
  const consequent = args[cursor] as t.Expression;
  const nextTest = args[cursor + 1];
  return types.conditionalExpression(
    test,
    consequent,
    // eslint-disable-next-line no-nested-ternary
    nextTest === null
      ? (args[cursor + 2] as t.Expression)
      : nextTest === undefined
        ? types.nullLiteral()
        : createConditionalExpression(types, args, cursor + 1)
  );
}


/** 元素是否处于 JSX 子节点容器中 (决定产物是否需要包表达式容器) */
export function inJsxChildren(nodePath: NodePath<t.JSXElement>): boolean {
  const { parentPath } = nodePath;
  return parentPath.isJSXElement() || parentPath.isJSXFragment();
}
