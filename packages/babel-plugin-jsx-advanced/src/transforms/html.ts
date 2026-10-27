import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import { getValueFromAttributes } from '../utils';
import type { DirectiveState, PluginState } from '../types';

/**
 * innerHTML 指令的属性形式, 如 `x-html={html}`。
 *
 * 把绑定值包装成 `{ __html: value }` 写入 dangerouslySetInnerHTML 属性;
 * 已存在 dangerouslySetInnerHTML 时报错, 不做静默覆盖。
 */
export function transformHtmlAttribute(
  nodePath: NodePath<t.JSXElement>,
  ctx: DirectiveState,
  state: PluginState
): void {
  const types = state.types;
  const attributes = nodePath.node.openingElement.attributes;

  const rawValue = ctx.value;
  let htmlValue: t.Expression | t.StringLiteral;
  // babel 解析器保证属性值不会出现空表达式, 这里合并为一次类型收窄
  if (types.isJSXExpressionContainer(rawValue) && types.isExpression(rawValue.expression)) {
    htmlValue = rawValue.expression;
  }
  else if (types.isStringLiteral(rawValue)) {
    htmlValue = rawValue;
  }
  else {
    // 缺值 / 裸写: 指向 x-html 属性自身
    throw nodePath.get(`openingElement.attributes.${ctx.valueAttributeIndex}`).buildCodeFrameError(
      state.formatMessage('DIRECTIVE_VALUE_REQUIRED', { name: ctx.name })
    );
  }

  const existingRet = getValueFromAttributes('dangerouslySetInnerHTML', attributes, types);
  if (existingRet !== null) {
    // 定位到已存在的 dangerouslySetInnerHTML 属性
    throw nodePath.get(`openingElement.attributes.${existingRet.attributeIndex}`).buildCodeFrameError(
      state.formatMessage('ATTRIBUTE_ALREADY_SET', {
        name: ctx.name,
        attribute: 'dangerouslySetInnerHTML'
      })
    );
  }

  attributes.push(
    types.jsxAttribute(
      types.jsxIdentifier('dangerouslySetInnerHTML'),
      types.jsxExpressionContainer(
        types.objectExpression([
          types.objectProperty(
            types.stringLiteral('__html'),
            htmlValue
          )
        ])
      )
    )
  );
}
