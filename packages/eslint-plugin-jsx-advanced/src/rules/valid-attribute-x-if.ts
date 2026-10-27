import type { Rule } from 'eslint';
import type { JSXElement, Node } from 'estree-jsx';
import type { MatchedAttribute } from '../types';
import { isJSXElement, isSkippableBetweenBranches, matchAttributes, readSettings } from '../utils/tools';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description: 'enforce valid attribute-form conditional directives',
      category: 'Possible Errors',
      recommended: true
    },
    schema: [],
    messages: {
      missingPrevious:
        "Missing a jsx element which has a '{{main}}' or '{{branch}}' directive as the previous jsx element.",
      missingPreviousZh: "上一个JSX节点需要包含 '{{main}}' 或 '{{branch}}' 指令。",
      duplicated: 'Found more than one name of the same directive on this element: {{names}}.',
      duplicatedZh: '同一个元素上出现了同一指令的多个名字: {{names}}, 只允许出现一个。'
    }
  },

  create(context) {
    const { locale, attribute } = readSettings(context);
    const { if: IF, elif: ELIF, else: ELSE } = attribute;
    const suffix = locale === 'zh-CN' ? 'Zh' : '';

    return {
      JSXElement(node: JSXElement & Rule.NodeParentExtension) {
        const { attributes } = node.openingElement;

        // 单次遍历收集三组命中: 组下标 0=if, 1=elif, 2=else
        const groups: MatchedAttribute[][] = [[], [], []];
        for (const attr of attributes) {
          if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') {
            continue;
          }
          const { name } = attr.name;
          if (IF.includes(name)) {
            groups[0].push({ node: attr, name });
          }
          else if (ELIF.includes(name)) {
            groups[1].push({ node: attr, name });
          }
          else if (ELSE.includes(name)) {
            groups[2].push({ node: attr, name });
          }
        }

        // 同一元素上同一指令命中多个名字 -> 报错并停止, 语义已有歧义
        const duplicated = groups.find((group) => group.length > 1);
        if (duplicated) {
          context.report({
            node,
            messageId: `duplicated${suffix}`,
            data: { names: duplicated.map((item) => item.name).join(', ') }
          });
          return;
        }

        // 先把分支 (elif / else) 找出来, 只有分支才需要前驱
        const branch = groups[1][0] ?? groups[2][0];
        if (!branch) {
          return;
        }

        const siblings = node.parent && (node.parent as unknown as { children?: Node[] }).children;
        // 兼容极端情况, siblings 为 undefined 时没有兄弟语义
        if (!siblings) {
          return;
        }

        const curIndex = siblings.findIndex((n) => n === node);
        // 回溯找前驱: 空白文本与空表达式可以跨过 (babel 折叠时会删掉它们),
        // 一旦遇到非空白文本 / 普通表达式, 分支链断开, 直接停止
        let preceded = false;
        for (let i = curIndex - 1; i >= 0; i--) {
          const prev = siblings[i];
          if (isSkippableBetweenBranches(prev)) {
            continue;
          }
          if (isJSXElement(prev)) {
            const prevAttributes = prev.openingElement.attributes;
            if (matchAttributes(prevAttributes, IF).length
              || matchAttributes(prevAttributes, ELIF).length) {
              preceded = true;
            }
          }
          break;
        }

        if (!preceded) {
          context.report({
            node: branch.node,
            messageId: `missingPrevious${suffix}`,
            data: { main: IF.join(' / '), branch: ELIF.join(' / ') }
          });
        }
      }
    } as unknown as Rule.RuleListener;
  }
};

export default rule;
