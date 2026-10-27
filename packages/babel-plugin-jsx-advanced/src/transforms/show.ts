import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import { getValueFromAttributes } from '../utils';
import type { DirectiveState, PluginState } from '../types';

/** 生成 `{ display: 'none' }` 对象表达式 */
function hiddenStyle(types: typeof t): t.ObjectExpression {
  return types.objectExpression([
    types.objectProperty(
      types.stringLiteral('display'),
      types.stringLiteral('none')
    )
  ]);
}

/** 生成 `value ? null : { display: 'none' }` 三目 */
function toggleExpression(types: typeof t, value: t.Expression): t.ConditionalExpression {
  return types.conditionalExpression(value, types.nullLiteral(), hiddenStyle(types));
}

/**
 * 显示控制指令的属性形式, 如 `x-show={v}`。
 *
 * 无 style / 裸写 style → 新增或原地赋 `style={value ? null : {display:'none'}}`;
 * style 是静态字符串或空容器 → 报错, 拿不出可与 show helper 合并的绑定值;
 * style 已绑定 → 用 show helper 合并: `style={showHelper(existing, value)}`。
 */
export function transformShowAttribute(
  nodePath: NodePath<t.JSXElement>,
  ctx: DirectiveState,
  state: PluginState
): void {
  const types = state.types;
  const attributes = nodePath.node.openingElement.attributes;
  const rawValue = ctx.value;
  const valueAttributeIndex = ctx.valueAttributeIndex;

  // babel 解析器保证属性值不会出现空表达式, 这里合并为一次类型收窄
  if (!types.isJSXExpressionContainer(rawValue) || !types.isExpression(rawValue.expression)) {
    throw nodePath.get(`openingElement.attributes.${valueAttributeIndex}`).buildCodeFrameError(
      state.formatMessage('DIRECTIVE_VALUE_REQUIRED', { name: ctx.name })
    );
  }
  const condition = rawValue.expression;


  const styleRet = getValueFromAttributes('style', attributes, types);

  if (!styleRet) {
    // 无 style → 新增内联三目
    attributes.push(
      types.jsxAttribute(
        types.jsxIdentifier('style'),
        types.jsxExpressionContainer(toggleExpression(types, condition))
      )
    );
    return;
  }

  const { value: oldStyleValue, attribute: styleAttr, attributeIndex: oldStyleIndex } = styleRet;
  if (!oldStyleValue) {
    // style 存在但无值 → 原地赋三目 (必须包容器)
    styleAttr.value = types.jsxExpressionContainer(toggleExpression(types, condition));
    return;
  }

  if (!types.isJSXExpressionContainer(oldStyleValue)) {
    // 静态字符串拿不出可与 show helper 合并的绑定值
    throw nodePath.get(`openingElement.attributes.${oldStyleIndex}`).buildCodeFrameError(
      state.formatMessage('ATTRIBUTE_MERGE_INVALID', { name: ctx.name, attribute: 'style' })
    );
  }
  const existing = oldStyleValue.expression;
  if (types.isJSXEmptyExpression(existing)) {
    // 空容器 (style={}) 拿不出可与 show helper 合并的绑定值
    throw nodePath.get(`openingElement.attributes.${oldStyleIndex}`).buildCodeFrameError(
      state.formatMessage('ATTRIBUTE_MERGE_INVALID', { name: ctx.name, attribute: 'style' })
    );
  }

  const helper = ctx.helper!;

  styleAttr.value = types.jsxExpressionContainer(
    types.callExpression(types.identifier(helper.imported), [existing, condition])
  );
  state.directiveHelpers.set(helper.imported, helper.module);
}
