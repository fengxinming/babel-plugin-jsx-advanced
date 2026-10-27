import type { NodePath, PluginObj } from '@babel/core';
import type * as t from '@babel/types';
import type {
  PluginAPI,
  PluginOptions,
  PluginState,
  ResolvedOptions,
  DirectiveState,
  JsxValue
} from './types';
import { resolveOptions } from './resolve';
import { ATTRIBUTE_POSITION, TAG_POSITION } from './constants';
import { getValueFromAttributes, inJsxChildren } from './utils';
import { render } from './i18n';

/** 对外类型: 供 babel 配置与自定义指令 transform 标注参数 */
export type {
  PluginOptions,
  TransformDirective,
  DirectiveState,
  PluginState,
  ResolvedListItem,
  MessageKey
} from './types';

function jsxAdvancedPlugin({ types, assertVersion }: PluginAPI, options: PluginOptions = {}) {
  assertVersion('^7.0.0-0 || ^8.0.0');

  // resolve 一次, 整个编译期不变
  const {
    tags: resolvedTags,
    attributes: resolvedAttributes,
    helpers: resolvedHelpers,
    locale
  }: ResolvedOptions = resolveOptions(options);

  return {
    visitor: {
      Program: {
        enter(_nodePath: NodePath<t.Program>, state: PluginState) {
          state.directiveHelpers = new Map();
          state.types = types;
          state.locale = locale;
          state.formatMessage = (key, params) => render(key, params, locale);
        },
        exit(nodePath: NodePath<t.Program>, state: PluginState) {
          const { body } = nodePath.node;
          const { directiveHelpers } = state;
          for (const [alias, helper] of directiveHelpers) {
            if (!body.some((node) =>
              node.type === 'ImportDeclaration'
              && node.specifiers.some((specifier) =>
                specifier.local.name === alias))) {
              const importDeclaration = types.importDeclaration(
                [types.importDefaultSpecifier(types.identifier(alias))],
                types.stringLiteral(helper)
              );
              nodePath.unshiftContainer('body', importDeclaration);
            }
          }
        }
      },

      JSXElement(nodePath: NodePath<t.JSXElement>, state: PluginState) {
        const el: t.JSXElement = nodePath.node;
        const { name: elName, attributes: elAttrs } = el.openingElement;

        // ===== 1. tags: 标签形式命中 =====
        // 一个 JSXElement 的 openingElement.name 就是标签, 只有 tag name 能命中 tag 指令
        for (const resolvedTag of resolvedTags) {
          if (!types.isJSXIdentifier(elName)) {
            continue;
          }
          const { name: tagName } = elName;
          if (!resolvedTag.name.includes(tagName)) {
            continue;
          }

          const valueRet = getValueFromAttributes('value', elAttrs, types);
          let directiveValue: JsxValue = null;
          let directiveIndex = -1;
          if (valueRet !== null) {
            directiveValue = valueRet.value;
            directiveIndex = valueRet.attributeIndex;
          }

          const ctx: DirectiveState = {
            position: TAG_POSITION,
            resolved: resolvedTag,
            name: tagName,
            value: directiveValue,
            valueAttributeIndex: directiveIndex,
            helper: resolvedHelpers[resolvedTag.kind as keyof typeof resolvedHelpers]
          };
          const replacement = resolvedTag.transform(nodePath, ctx, state);
          if (replacement) {
            nodePath.replaceWith(
              inJsxChildren(nodePath)
                ? types.jsxExpressionContainer(replacement as t.Expression)
                : replacement
            );
            return;
          }
        }

        // ===== 2. attributes: 属性形式命中 =====
        // 遍历 attributes, 每个 JSXAttribute 找匹配的指令名
        for (const resolvedAttribute of resolvedAttributes) {
          for (let attrIdx = 0, l = elAttrs.length; attrIdx < l; attrIdx++) {
            const attr = elAttrs[attrIdx];
            if (!types.isJSXAttribute(attr)) {
              // 跳过 SpreadAttribute
              continue;
            }
            if (!types.isJSXIdentifier(attr.name)) {
              continue;
            }

            const attrName = attr.name.name;
            if (!resolvedAttribute.name.includes(attrName)) {
              continue;
            }

            const ctx: DirectiveState = {
              position: ATTRIBUTE_POSITION,
              resolved: resolvedAttribute,
              name: attrName,
              value: attr.value,
              helper: resolvedHelpers[resolvedAttribute.kind as keyof typeof resolvedHelpers],
              valueAttributeIndex: attrIdx
            };
            const replacement = resolvedAttribute.transform(nodePath, ctx, state);

            // // 先删当前指令属性, 再替换。for / if 的替换节点会复用原元素, 先删保证新树里
            // // 原元素不带指令属性; transform 期间 attrIdx 仍有效, ctx 报错定位准确。
            elAttrs.splice(attrIdx, 1);

            if (replacement) {
              nodePath.replaceWith(
                inJsxChildren(nodePath)
                  ? types.jsxExpressionContainer(replacement as t.Expression)
                  : replacement
              );
              // 节点已替换, 剩余指令交给 babel 重新遍历新树
              return;
            }

            // 未替换, 当前指令处理完, 继续下一个指令
            break;
          }
        }
      }
    }
  } satisfies PluginObj<PluginState>;
}

export default jsxAdvancedPlugin;
