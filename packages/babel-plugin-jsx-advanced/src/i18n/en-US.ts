import type { MessageKey } from '../types';

/**
 * 英文消息表。
 *
 * key 集由 types.ts 的 `MessageKey` 联合经 `Record<MessageKey, string>` 强制
 * 一致, 每个 key 的占位符集与 zh-CN.ts 必须一致 (占位符名写错由单测拦下)。
 * 这是默认语言。
 */
export const enUS: Record<MessageKey, string> = {
  // 运行时域
  // eslint-disable-next-line max-len
  BRANCH_ELIF_TAG_REQUIRES_PRECEDING: '<{{name}}> requires the previous JSX node to be an <{{main}}> element.',
  // eslint-disable-next-line max-len
  BRANCH_ELIF_ATTRIBUTE_REQUIRES_PRECEDING: "the '{{name}}' directive requires the previous JSX node to contain the '{{main}}' directive.",
  // eslint-disable-next-line max-len
  BRANCH_ELSE_TAG_REQUIRES_PRECEDING: '<{{name}}> requires the previous JSX node to be an <{{main}}> or <{{elif}}> element.',
  // eslint-disable-next-line max-len
  BRANCH_ELSE_ATTRIBUTE_REQUIRES_PRECEDING: "the '{{name}}' directive requires the previous JSX node to contain the '{{main}}' or '{{elif}}' directive.",
  DIRECTIVE_VALUE_REQUIRED: "'{{name}}' requires a bound variable or expression.",
  TAG_VALUE_REQUIRED: '<{{tag}}> requires a value attribute bound to a variable or expression.',
  // eslint-disable-next-line max-len
  ATTRIBUTE_ALREADY_SET: "the '{{name}}' directive writes the {{attribute}} attribute, but it is already present on this element; remove the explicit {{attribute}} attribute.",
  // eslint-disable-next-line max-len
  ATTRIBUTE_MERGE_INVALID: "the '{{name}}' directive merges into the {{attribute}} attribute at runtime, but {{attribute}} is not a valid bound expression.",
  FOR_EXPRESSION_INVALID: "'{{name}}' requires a binding expression of the form '(item, index) in list'."
};
