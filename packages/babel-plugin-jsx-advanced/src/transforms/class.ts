import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import { getValueFromAttributes } from '../utils';
import type { DirectiveState, PluginState } from '../types';


/**
 * 类名指令的属性形式, 如 `x-class={cls}`。
 *
 * 无 className → 新增 `className={helper(value)}`;
 * 有 className → 合并 `className={helper(existing, value)}`。
 */
export function transformClassAttribute(
  nodePath: NodePath<t.JSXElement>,
  ctx: DirectiveState,
  state: PluginState
) {
  const types = state.types;
  const attributes = nodePath.node.openingElement.attributes;
  const helper = ctx.helper!;

  // 解包 ctx.value
  const rawValue = ctx.value;
  const valueAttributeIndex = ctx.valueAttributeIndex;
  let value: t.Expression | t.StringLiteral;
  // babel 解析器保证属性值不会出现空表达式, 这里合并为一次类型收窄
  if (types.isJSXExpressionContainer(rawValue) && types.isExpression(rawValue.expression)) {
    value = rawValue.expression;
  }
  else if (types.isStringLiteral(rawValue)) {
    value = rawValue;
  }
  else {
    throw nodePath.get(`openingElement.attributes.${valueAttributeIndex}`).buildCodeFrameError(
      state.formatMessage('DIRECTIVE_VALUE_REQUIRED', { name: ctx.name })
    );
  }

  const callExp = (args: Array<t.Expression | t.SpreadElement | t.ArgumentPlaceholder>) =>
    types.callExpression(types.identifier(helper.imported), args);

  const classNameRet = getValueFromAttributes('className', attributes, types);

  if (!classNameRet) {
    // 没有 className → 新增
    attributes.push(
      types.jsxAttribute(
        types.jsxIdentifier('className'),
        types.jsxExpressionContainer(callExp([value]))
      )
    );
  }
  else {
    const { attribute: classNameAttr, value: oldClassNameValue, attributeIndex: oldClassNameIndex } = classNameRet;
    if (!oldClassNameValue) {
      // 裸写 className → 直接注入 helper
      classNameAttr.value = types.jsxExpressionContainer(callExp([value]));
    }
    else {
      let existingValue: t.Expression | t.StringLiteral;
      if (types.isJSXExpressionContainer(oldClassNameValue) && types.isExpression(oldClassNameValue.expression)) {
        existingValue = oldClassNameValue.expression;
      }
      else if (types.isStringLiteral(oldClassNameValue)) {
        existingValue = oldClassNameValue;
      }
      else {
        // 类型不是表达式，也不是字符串: 指令值本身合法, 是 className 拿不出可合并的值
        throw nodePath.get(`openingElement.attributes.${oldClassNameIndex}`).buildCodeFrameError(
          state.formatMessage('ATTRIBUTE_MERGE_INVALID', { name: ctx.name, attribute: 'className' })
        );
      }
      classNameAttr.value = types.jsxExpressionContainer(callExp([existingValue, value]));
    }
  }

  state.directiveHelpers.set(helper.imported, helper.module);
}
