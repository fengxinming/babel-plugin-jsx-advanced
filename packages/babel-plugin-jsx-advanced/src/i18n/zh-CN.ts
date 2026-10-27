import type { MessageKey } from '../types';

/**
 * 简体中文消息表。
 *
 * 文案对得上 i18n 改造前的硬编码内容; 配置形状重写后新增 / 改名的条目按新语义
 * 重写。占位符只放不需要翻译的值 (指令名 / kind / 下标); 需要翻译的片段一律拆成
 * 独立 key。
 *
 * key 集由 types.ts 的 `MessageKey` 联合经 `Record<MessageKey, string>` 强制
 * 一致: 少一条、多一条、改名都在编译期报错。
 */
export const zhCN: Record<MessageKey, string> = {
  // 运行时域
  // eslint-disable-next-line max-len
  BRANCH_ELIF_TAG_REQUIRES_PRECEDING: "<{{name}}> 标签需要上一个JSX节点是 '{{main}}' 标签.",
  // eslint-disable-next-line max-len
  BRANCH_ELIF_ATTRIBUTE_REQUIRES_PRECEDING: "'{{name}}' 指令需要上一个JSX节点包含 '{{main}}' 指令.",
  // eslint-disable-next-line max-len
  BRANCH_ELSE_TAG_REQUIRES_PRECEDING: "<{{name}}> 标签需要上一个JSX节点是 '{{main}}' 或 '{{elif}}' 标签.",
  // eslint-disable-next-line max-len
  BRANCH_ELSE_ATTRIBUTE_REQUIRES_PRECEDING: "'{{name}}' 指令需要上一个JSX节点包含 '{{main}}' 或 '{{elif}}' 指令.",
  DIRECTIVE_VALUE_REQUIRED: "'{{name}}' 指令需要绑定一个变量或表达式.",
  TAG_VALUE_REQUIRED: '<{{tag}}> 标签需要一个 value 属性并绑定一个变量或表达式.',
  // eslint-disable-next-line max-len
  ATTRIBUTE_ALREADY_SET: "'{{name}}' 指令需要写入 {{attribute}} 属性, 但该属性已显式写在元素上; 请移除多余的 {{attribute}}.",
  ATTRIBUTE_MERGE_INVALID: "'{{name}}' 指令需要与 {{attribute}} 属性的绑定表达式合并, 但 {{attribute}} 不是有效的绑定表达式.",
  FOR_EXPRESSION_INVALID: "'{{name}}' 指令需要写成 '(item, index) in list' 形式的绑定表达式."
};
