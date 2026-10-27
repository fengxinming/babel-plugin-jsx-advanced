import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import { combineNodes } from '../utils';
import type { DirectiveState, PluginState } from '../types';
import { ATTRIBUTE_POSITION, TAG_POSITION } from '../constants';

/**
 * 解析 for 绑定表达式: 只接受 `(item, key) in list` / `item in list`
 * 没有 `in` 就没有循环变量, 循环体写不出来。
 */
function splitForExpression(
  types: typeof t,
  ctx: DirectiveState,
  state: PluginState,
  errorPath: NodePath,
  expression: t.Expression
): { arr: t.Expression, params: t.FunctionParameter[] } {
  if (!types.isBinaryExpression(expression, { operator: 'in' })) {
    throw errorPath.buildCodeFrameError(
      state.formatMessage('FOR_EXPRESSION_INVALID', { name: ctx.name })
    );
  }

  const { left, right } = expression;
  if (types.isSequenceExpression(left)) {
    const params: t.FunctionParameter[] = [];
    for (const expr of left.expressions) {
      if (types.isIdentifier(expr) || types.isAssignmentPattern(expr)) {
        params.push(expr);
      }
      else {
        throw errorPath.buildCodeFrameError(
          state.formatMessage('FOR_EXPRESSION_INVALID', { name: ctx.name })
        );
      }
    }
    return { arr: right, params };
  }
  if (types.isIdentifier(left)) {
    return { arr: right, params: [left] };
  }

  throw errorPath.buildCodeFrameError(
    state.formatMessage('FOR_EXPRESSION_INVALID', { name: ctx.name })
  );
}

/**
 * for 指令的公共管线: 解包 ctx.value → 解析 `in` 表达式 → 取 helper →
 * 生成 `helper(list, (params) => body)` → 按所处位置决定是否包表达式容器。
 *
 * 属性形式和标签形式只有 body 来源不同, 由 getBody 决定。
 */
function transformFor(
  nodePath: NodePath<t.JSXElement>,
  ctx: DirectiveState,
  state: PluginState,
  getBody: () => t.Expression
) {
  const types = state.types;
  const valueAttributeIndex = ctx.valueAttributeIndex;
  const errorPath = ctx.position === ATTRIBUTE_POSITION
    ? nodePath.get(`openingElement.attributes.${valueAttributeIndex}`)
    : nodePath;

  const rawValue = ctx.value;
  // babel 解析器保证属性值不会出现空表达式, 这里合并为一次类型收窄
  if (!types.isJSXExpressionContainer(rawValue) || !types.isExpression(rawValue.expression)) {
    throw errorPath.buildCodeFrameError(
      ctx.position === TAG_POSITION
        ? state.formatMessage('TAG_VALUE_REQUIRED', { tag: ctx.name })
        : state.formatMessage('DIRECTIVE_VALUE_REQUIRED', { name: ctx.name })
    );
  }

  const expression = rawValue.expression;

  const { arr, params } = splitForExpression(types, ctx, state, errorPath, expression);

  const helper = ctx.helper!;

  const body = getBody();
  const mapExp = types.callExpression(
    types.identifier(helper.imported),
    [arr, types.arrowFunctionExpression(params, body)]
  );

  state.directiveHelpers.set(helper.imported, helper.module);
  return mapExp;
}

/**
 * 循环指令的属性形式, 如 `x-for={(item, i) in list}`。
 *
 * 原元素节点被复用为回调函数体, 生成 `helper(list, (item, key) => 原元素)`;
 * 替换后 babel 会遍历新树, 复用进回调体的原节点再次进入指令管线, 排在
 * 后面的指令在那里生效。
 */
export function transformForAttribute(
  nodePath: NodePath<t.JSXElement>,
  ctx: DirectiveState,
  state: PluginState
): t.Expression | void {
  return transformFor(nodePath, ctx, state, () => nodePath.node);
}

/**
 * 循环指令的标签形式, 如 `<for value={(item, i) in list}>children</for>`。
 *
 * 标签的子节点作为回调产物, 多个子节点包成 Fragment, 循环变量在子节点内可用。
 */
export function transformForTag(
  nodePath: NodePath<t.JSXElement>,
  ctx: DirectiveState,
  state: PluginState
): t.Expression | void {
  return transformFor(nodePath, ctx, state, () => combineNodes(state.types, nodePath.node.children));
}
