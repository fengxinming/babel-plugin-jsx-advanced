import type { AST } from 'eslint';
import type { JSXAttribute, JSXSpreadAttribute } from 'estree-jsx';

/**
 * 报错语言。
 *
 * 每条规则为两种语言各准备一份 messageId, 由 settings['jsx-advanced'].locale 选。
 */
export type Locale = 'en-US' | 'zh-CN';

/**
 * 单个位置上的指令名配置。
 *
 * 单名写字符串, 多名写数组; 两种写法都是「配了就以配置为准, 不叠加默认名」。
 * 字段名与 babel 插件的指令语义对齐 —— 词即最终名, 配什么就是什么。
 */
export interface DirectiveNames {
  /** 循环指令名, 默认 'x-for' */
  for?: string | string[];
  /** 条件指令名, 默认 'x-if' */
  if?: string | string[];
  /** if 族第一个伴生分支名, 默认 'x-elif' */
  elif?: string | string[];
  /** if 族兜底分支名, 默认 'x-else' */
  else?: string | string[];
}

/** 归一化后的指令名: 每个字段都是名字集合 */
export type ResolvedDirectiveNames = Required<{
  [K in keyof DirectiveNames]: string[];
}>;

/**
 * eslint 配置中 settings['jsx-advanced'] 的形状。
 *
 * 属性名与标签名是两个不相干的命名空间 (与 babel 的 attribute / tag 同构),
 * 故按位置分组配置, 两侧同名互不影响。
 */
export interface JsxAdvancedSettings {
  /** 报错语言, 缺省 'en-US' */
  locale?: string;
  /** 属性位指令名 */
  attribute?: DirectiveNames;
  /** 标签位指令名 */
  tag?: DirectiveNames;
}

/** 归一化后的 settings: 语言 + 两个位置各自的名字集合 */
export interface ResolvedSettings {
  locale: Locale;
  attribute: ResolvedDirectiveNames;
  tag: ResolvedDirectiveNames;
}

/** JSX 元素属性列表里的一项 (展开属性没有名字, 单独成支) */
export type JsxAttributeLike = JSXAttribute | JSXSpreadAttribute;

/** 命中名字集合的属性及其实际名字 */
export interface MatchedAttribute {
  node: JSXAttribute;
  name: string;
}

/**
 * for 绑定表达式的一处问题。
 *
 * messageId 是检查项自身的标识, 规则按语言补后缀后交给 context.report;
 * loc 缺省表示报在整个绑定属性节点上。
 */
export interface ForBindingIssue {
  messageId:
    | 'missingExp'
    | 'missingIn'
    | 'missingVars'
    | 'missingParens'
    | 'missingSpaceBeforeIn'
    | 'missingSpaceAfterIn';
  loc?: AST.Token['loc'];
}

/** for 绑定表达式的检查结果: 问题列表 + 表达式里声明的循环变量 */
export interface ForBindingReport {
  issues: ForBindingIssue[];
  vars: string[];
}
