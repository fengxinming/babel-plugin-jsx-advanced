import type { Rule } from 'eslint';
import type { JSXElement, Node } from 'estree-jsx';
import {
  findTagBinding,
  hasBoundValue,
  isJSXElement,
  isSkippableBetweenBranches,
  readSettings,
  tagNameOf
} from '../utils/tools';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description: 'enforce valid tag-form conditional directives',
      category: 'Possible Errors',
      recommended: true
    },
    schema: [],
    messages: {
      missingValue: "Missing a 'value' attribute in <{{name}}> tag.",
      missingValueZh: '{{name}} 标签缺少 value 属性。',
      missingChain:
        'Missing a jsx element which has a <{{main}}> or <{{branch}}> tag as the previous jsx element.',
      missingChainZh: '上一个JSX节点需要是 <{{main}}> 或 <{{branch}}> 标签。'
    }
  },

  create(context) {
    const { locale, tag } = readSettings(context);
    const IF = tag.if;
    const ELIF = tag.elif;
    const ELSE = tag.else;
    const suffix = locale === 'zh-CN' ? 'Zh' : '';

    return {
      JSXElement(node: JSXElement & Rule.NodeParentExtension) {
        const name = tagNameOf(node);
        if (name === undefined) {
          return;
        }

        const isIf = IF.includes(name);
        const isElif = ELIF.includes(name);
        const isElse = ELSE.includes(name);

        // <if> / <elif> 需要绑定位: 取名为 value 的属性并要求它绑了表达式,
        // 与 babel 的 getValueFromAttributes('value', ...) 同口径
        if (isIf || isElif) {
          const binding = findTagBinding(node.openingElement.attributes);
          if (!binding || !hasBoundValue(binding)) {
            context.report({ node, messageId: `missingValue${suffix}`, data: { name } });
          }
        }

        if (!isElif && !isElse) {
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
            const prevName = tagNameOf(prev);
            if (prevName !== undefined && (IF.includes(prevName) || ELIF.includes(prevName))) {
              preceded = true;
            }
          }
          break;
        }

        if (!preceded) {
          context.report({
            node,
            messageId: `missingChain${suffix}`,
            data: { main: IF.join(' / '), branch: ELIF.join(' / ') }
          });
        }
      }
    } as unknown as Rule.RuleListener;
  }
};

export default rule;
