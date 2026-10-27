import type { SourceCode } from 'eslint';
import type { JSXAttribute } from 'estree-jsx';
import type { ForBindingIssue, ForBindingReport } from '../types';
import { OPERATOR_IN } from './constants';
import { isVariable } from './tools';

/**
 * 检查 for 的绑定表达式, 如 `{(item, index) in items}`。
 *
 * 属性位 `x-for={...}` 与标签位 `<x-for value={...}>` 的绑定位 token 结构完全一样
 * (都是「名字 = { ... }」), 故两边共用这一份检查; 调用方负责把结果报给 eslint。
 *
 * 写法要求表达式非空且带 `in`, 循环变量声明在 `in` 左边。
 *
 * 只产出问题列表与循环变量, 不直接 report —— 消息文案与节点选择留在各规则里。
 */
export function inspectForBinding(sourceCode: SourceCode, node: JSXAttribute): ForBindingReport {
  const issues: ForBindingIssue[] = [];
  const vars: string[] = [];

  const tokenAttrStart = sourceCode.getFirstToken(node);
  const tokenEqStart = tokenAttrStart ? sourceCode.getTokenAfter(tokenAttrStart) : null;
  const tokenLeftBrace = tokenEqStart ? sourceCode.getTokenAfter(tokenEqStart) : null;
  const tokenRightBrace = sourceCode.getLastToken(node);
  if (!tokenAttrStart || !tokenEqStart || !tokenLeftBrace || !tokenRightBrace) {
    return { issues, vars };
  }

  const tokenExpression = sourceCode.getTokensBetween(tokenLeftBrace, tokenRightBrace);
  const tokenOperatorIn = tokenExpression.find((n) => n.value === OPERATOR_IN);

  // in 左边是声明位置: 取其中的标识符当循环变量, 一个都没有就是漏写变量名
  if (tokenOperatorIn) {
    const tokensVarExpBeforeIn = sourceCode.getTokensBetween(tokenLeftBrace, tokenOperatorIn);
    const tokensLeftVars = tokensVarExpBeforeIn.filter((i) => isVariable(i.value));
    if (tokensLeftVars.length) {
      vars.push(...tokensLeftVars.map((i) => i.value));
    }
    else {
      // 没有定义变量, 就给出警告; 定位到 in 左边的第一个 token (都没有则定位到左花括号)
      const tokenInvalid = tokensVarExpBeforeIn.length ? tokensVarExpBeforeIn[0] : tokenLeftBrace;
      issues.push({ messageId: 'missingVars', loc: tokenInvalid.loc });
    }
  }

  // 后面几条互斥: 表达式不足 -> 缺 in -> in 左右空格, 按优先级只报第一条
  if (tokenExpression.length < 3) {
    issues.push({ messageId: 'missingExp' });
    return { issues, vars };
  }

  if (!tokenOperatorIn) {
    issues.push({ messageId: 'missingIn' });
    return { issues, vars };
  }

  // 括号要求: 多变量的循环变量表必须写成 `(item, i) in list`。
  // 漏括号时 JS 会把 `item, i in list` 解析成 SequenceExpression
  // [item, (i in list)] —— 变量表与数组表达式脱开, babel 侧按
  // `BinaryExpression('in')` 识别时也拿不到, 编译必然失败, 这里提前拦下。
  const expression = node.value;
  if (expression && expression.type === 'JSXExpressionContainer') {
    const inner = expression.expression;
    if (inner.type === 'SequenceExpression' && inner.expressions.length > 1) {
      const last = inner.expressions[inner.expressions.length - 1];
      if (last.type === 'BinaryExpression' && last.operator === OPERATOR_IN) {
        const tokenComma = tokenExpression.find((n) => n.value === ',');
        issues.push({ messageId: 'missingParens', loc: (tokenComma ?? tokenOperatorIn).loc });
        return { issues, vars };
      }
    }
  }

  const tokenBeforeIn = sourceCode.getTokenBefore(tokenOperatorIn);
  const tokenAfterIn = sourceCode.getTokenAfter(tokenOperatorIn);

  if (!tokenBeforeIn || !sourceCode.isSpaceBetween(tokenBeforeIn, tokenOperatorIn)) {
    // in 关键字左边需要有空格
    issues.push({ messageId: 'missingSpaceBeforeIn', loc: tokenOperatorIn.loc });
  }
  else if (!tokenAfterIn || !sourceCode.isSpaceBetween(tokenOperatorIn, tokenAfterIn)) {
    // in 关键字右边需要有空格
    issues.push({ messageId: 'missingSpaceAfterIn', loc: tokenOperatorIn.loc });
  }

  return { issues, vars };
}
