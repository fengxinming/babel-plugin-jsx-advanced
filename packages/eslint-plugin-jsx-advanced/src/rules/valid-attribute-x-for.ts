import type { Rule } from 'eslint';
import type { JSXAttribute } from 'estree-jsx';
import type { JsxAttributeLike } from '../types';
import { inspectForBinding } from '../utils/forExpression';
import { addDeclaredVariables, matchAttributes, readSettings } from '../utils/tools';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description: 'a valid expression for attribute-form x-for',
      category: 'Possible Errors',
      recommended: true
    },
    schema: [],
    messages: {
      missingExp: `Missing a expression for {{name}}.

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingExpZh: `{{name}} 指令缺少表达式。

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingIn: `Missing a 'in' syntax for {{name}}.

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingInZh: `{{name}} 指令缺少 in 关键字语法。

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingVars: `Missing variable declarations for {{name}}.

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingVarsZh: `{{name}} 指令缺少变量定义。

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingParens: `Missing parentheses around loop variables for {{name}}.

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingParensZh: `{{name}} 指令的循环变量缺少括号。

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingSpaceBeforeIn: `Missing space before 'in' syntax for {{name}}.

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingSpaceBeforeInZh: `{{name}} 指令在 in 关键字语法前缺少空格。

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingSpaceAfterIn: `Missing space after 'in' syntax for {{name}}.

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      missingSpaceAfterInZh: `{{name}} 指令在 in 关键字语法后缺少空格。

e.g.:
  {{name}}={(item, index) in items}
  {{name}}={item in items}
`,
      duplicated: 'Found more than one name of the same directive on this element: {{names}}.',
      duplicatedZh: '同一个元素上出现了同一指令的多个名字: {{names}}, 只允许出现一个。'
    }
  },

  create(context) {
    const { locale, attribute } = readSettings(context);
    const FOR = attribute.for;
    // 中文走带 Zh 后缀的 messageId, 英文走同名
    const suffix = locale === 'zh-CN' ? 'Zh' : '';
    const sourceCode = context.sourceCode;

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
        // 同一元素命中多个名字时只在第一个命中属性上处理一次, 避免重复报
        if (matched[0].node !== node) {
          return;
        }

        if (matched.length > 1) {
          context.report({
            node,
            messageId: `duplicated${suffix}`,
            data: { names: matched.map((item) => item.name).join(', ') }
          });
          return;
        }

        const { name } = matched[0];
        const { issues, vars } = inspectForBinding(sourceCode, node);

        if (vars.length) {
          // 就地补作用域: 不能攒到 Program:exit, 否则结果依赖规则注册顺序
          addDeclaredVariables(context, vars);
        }

        for (const issue of issues) {
          const messageId = `${issue.messageId}${suffix}`;
          // 有定位信息的报在具体 token 上, 否则报在整个绑定属性上
          if (issue.loc) {
            context.report({ loc: issue.loc, messageId, data: { name } });
          }
          else {
            context.report({ node, messageId, data: { name } });
          }
        }
      }
    } as unknown as Rule.RuleListener;
  }
};

export default rule;
