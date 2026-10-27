import type { Rule } from 'eslint';
import type { JSXAttribute } from 'estree-jsx';
import type { JsxAttributeLike } from '../types';
import { matchAttributes, readSettings } from '../utils/tools';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description: 'a valid key for attribute-form x-for',
      category: 'Possible Errors',
      recommended: true
    },
    schema: [],
    messages: {
      missingKey: `Missing key property for {{name}}.

e.g.:
  {{name}}={(item, index) in items} key={item.id}
  {{name}}={item in items} key={item.id}
`,
      missingKeyZh: `缺少 key 属性关于 {{name}} 指令。

e.g.:
  {{name}}={(item, index) in items} key={item.id}
  {{name}}={item in items} key={item.id}
`
    }
  },

  create(context) {
    const { locale, attribute } = readSettings(context);
    const FOR = attribute.for;
    const suffix = locale === 'zh-CN' ? 'Zh' : '';

    return {
      JSXAttribute(node: JSXAttribute & Rule.NodeParentExtension) {
        if (!node.parent) {
          return;
        }

        // 先按名字快速淘汰: 绝大多数属性不是指令属性, 不必做全量匹配
        if (node.name.type !== 'JSXIdentifier' || !FOR.includes(node.name.name)) {
          return;
        }

        const attributes = (node.parent as unknown as { attributes: JsxAttributeLike[] }).attributes;
        const matched = matchAttributes(attributes, FOR);
        if (matched[0].node !== node) {
          return;
        }

        // 同一元素命中多个名字时由 valid-attribute-x-for 报重复, 这里不再叠加 key 检查
        if (matched.length > 1) {
          return;
        }

        const hasKey = matchAttributes(attributes, ['key']).length > 0;
        if (!hasKey) {
          context.report({
            node,
            messageId: `missingKey${suffix}`,
            data: { name: matched[0].name }
          });
        }
      }
    } as unknown as Rule.RuleListener;
  }
};

export default rule;
