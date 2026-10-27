import type { Rule } from 'eslint';
import type { JSXElement } from 'estree-jsx';
import { inspectForBinding } from '../utils/forExpression';
import { addDeclaredVariables, findTagBinding, readSettings, tagNameOf } from '../utils/tools';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description: 'a valid expression for tag-form x-for',
      category: 'Possible Errors',
      recommended: true
    },
    schema: [],
    messages: {
      missingExp: `Missing a expression for {{name}}.

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingExpZh: `{{name}} 指令缺少表达式。

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingIn: `Missing a 'in' syntax for {{name}}.

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingInZh: `{{name}} 指令缺少 in 关键字语法。

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingVars: `Missing variable declarations for {{name}}.

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingVarsZh: `{{name}} 指令缺少变量定义。

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingParens: `Missing parentheses around loop variables for {{name}}.

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingParensZh: `{{name}} 指令的循环变量缺少括号。

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingSpaceBeforeIn: `Missing space before 'in' syntax for {{name}}.

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingSpaceBeforeInZh: `{{name}} 指令在 in 关键字语法前缺少空格。

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingSpaceAfterIn: `Missing space after 'in' syntax for {{name}}.

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`,
      missingSpaceAfterInZh: `{{name}} 指令在 in 关键字语法后缺少空格。

e.g.:
  <{{name}} value={(item, index) in items}>...</{{name}}>
  <{{name}} value={item in items}>...</{{name}}>
`
    }
  },

  create(context) {
    const { locale, tag } = readSettings(context);
    const FOR = tag.for;
    // 中文走带 Zh 后缀的 messageId, 英文走同名
    const suffix = locale === 'zh-CN' ? 'Zh' : '';
    const sourceCode = context.sourceCode;

    return {
      JSXElement(node: JSXElement) {
        const name = tagNameOf(node);
        if (name === undefined || !FOR.includes(name)) {
          return;
        }

        // 绑定位取名为 value 的属性 —— 与 babel 的 getValueFromAttributes('value', ...)
        // 同口径, 属性顺序不影响判定
        const binding = findTagBinding(node.openingElement.attributes);
        if (!binding) {
          context.report({ node, messageId: `missingExp${suffix}`, data: { name } });
          return;
        }

        const { issues, vars } = inspectForBinding(sourceCode, binding);

        if (vars.length) {
          // 就地补作用域: 不能攒到 Program:exit, 否则结果依赖规则注册顺序
          addDeclaredVariables(context, vars);
        }

        for (const issue of issues) {
          const messageId = `${issue.messageId}${suffix}`;
          // 有定位信息的报在具体 token 上, 否则报在整个标签上
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
