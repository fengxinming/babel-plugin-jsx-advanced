import type { NodePath, PluginPass } from '@babel/core';
import type * as t from '@babel/types';
import type {
  BUILTIN_ATTRIBUTE_KINDS,
  ATTRIBUTE_POSITION,
  SUPPORTED_LOCALES,
  BUILTIN_TAG_KINDS,
  TAG_POSITION
} from './constants';

/** 受支持的语言标识: 连字符分段 (语言-地区) */
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * 消息表 key: 字符串字面量联合, 这里是唯一清单。
 *
 * 各语言表按 `Record<MessageKey, string>` 声明 —— 少一条 / 多一条 / 改名都在
 * 编译期报错; 新增报错时先在此追加字面量。
 */
export type MessageKey =
  // 运行时域: 编译期按节点定位的报错
  /** elif / else 分支必须紧跟前置分支, 落单的分支无法折叠成三目表达式 */
  | 'BRANCH_ELIF_TAG_REQUIRES_PRECEDING'
  | 'BRANCH_ELIF_ATTRIBUTE_REQUIRES_PRECEDING'
  | 'BRANCH_ELSE_TAG_REQUIRES_PRECEDING'
  | 'BRANCH_ELSE_ATTRIBUTE_REQUIRES_PRECEDING'
  | 'DIRECTIVE_VALUE_REQUIRED'
  | 'TAG_VALUE_REQUIRED'
  /** 指令要写入的属性已被用户显式书写, 禁止静默覆盖, 必须让用户二选一 */
  | 'ATTRIBUTE_ALREADY_SET'
  /** 已有属性拿不出可与指令运行时合并的绑定值 (静态字符串或 JSX 元素等非表达式值) */
  | 'ATTRIBUTE_MERGE_INVALID'
  | 'FOR_EXPRESSION_INVALID';

/**
 * 消息参数: 占位符名 → 替换值。
 *
 * 只允许放**不需要翻译**的值 (指令名、kind、下标等); 需要翻译的片段一律拆成独立
 * key, 不许当成参数传进来。
 */
export type MessageParams = Record<string, string | number>;

/** 容器型内置 kind: 有标签形式的两个 (show / class / html 只能挂属性) */
export type ContainerKind = (typeof BUILTIN_TAG_KINDS)[number];

/** 内置属性位 kind 全集 */
export type BuiltinKind = (typeof BUILTIN_ATTRIBUTE_KINDS)[number];

/** 装饰型内置 kind: 只有属性位, 无标签形式 */
export type DecorationKind = Exclude<BuiltinKind, ContainerKind>;

/** 条目 kind: 内置五行为 + elif + else + custom */
export type EntryKind = BuiltinKind | 'custom' | 'elif' | 'else';

// ============================================================
// 配置侧: 用户书写形态 (tags / attributes 两份清单, 内置默认全开)
// ============================================================

/** 名字片段: 主名。缺省走内置默认名 (标签位 = kind 名, 属性位 = x-kind) */
interface EntryNameConfig {
  /**
   * 注册名: 单个字符串或一组等价名字, resolve 后统一为去重后的数组。
   * 命中任意一项即等同于命中该指令。
   */
  name?: string | string[];
}

/** 执行序片段: 只属于属性位。小者先执行 (与 vue2 codegen 一致: for 包 if) */
interface EntryPriorityConfig {
  priority?: number;
}

/** if 伴生分支名片段: 标签位无 x- 前缀, 属性位带; 与主名同形, 支持一组等价名字 */
interface IfBranchConfig {
  elif?: string | string[];
  else?: string | string[];
}

/** helper 片段: kind 级, tag / attribute 两位共用一份 */
export interface HelperConfig {
  /** helper 模块路径 */
  module?: string;
  /** helper import 局部变量名 */
  imported?: string;
}

/** if 标签位: 主名 + 伴生名 */
export type IfTagConfig = EntryNameConfig & IfBranchConfig;

/** 普通属性位 (for / show / class / html 同形): 主名 + 执行序 */
export type AttributeNameConfig = EntryNameConfig & EntryPriorityConfig;

/** if 属性位: 主名 + 执行序 + 伴生名 */
export type IfAttributeConfig = AttributeNameConfig & IfBranchConfig;

/** 自定义属性指令: priority 必填 (无内置先后可依) */
export interface CustomDirectiveConfig {
  /**
   * 注册名: 省略时取 custom 的 key; 支持的形态与内置指令一致
   * (字符串或字符串数组, resolve 后统一为去重后的数组)
   */
  name?: string | string[];
  /** 属性位执行序, 小者先执行 */
  priority?: number;
  /** 变换: exit 时调用 */
  transform: TransformDirective;
}

/**
 * 标签位清单: 内置只有容器型 for / if。
 *
 * 省略 = 默认开启; false = 禁用; 对象 = 定制字段, 其余走默认; custom 的 key
 * 即标签名, 省略 = 无自定义标签。
 */
export interface TagsConfig {
  for?: EntryNameConfig | false;
  if?: IfTagConfig | false;
  custom?: Record<string, CustomDirectiveConfig>;
}

/**
 * 属性位清单: 内置 for / if / show / class / html。
 *
 * 省略 = 默认开启; false = 禁用; 对象 = 定制字段, 其余走默认; custom 的 key
 * 即属性名, 省略 = 无自定义属性。
 */
export interface AttributesConfig {
  for?: AttributeNameConfig | false;
  if?: IfAttributeConfig | false;
  show?: AttributeNameConfig | false;
  class?: AttributeNameConfig | false;
  html?: AttributeNameConfig | false;
  custom?: Record<string, CustomDirectiveConfig>;
}

/**
 * 运行时 helper 清单: kind 级, tag / attribute 两位共用一条 import。
 *
 * 只有有运行时依赖的 kind 出现 (if 三目编译无 helper; custom 由用户 handler
 * 自管)。全省略 = 走内置默认模块与默认导入名 (__brja_{kind}_helper__)。
 */
export interface HelpersConfig {
  for?: HelperConfig | string;
  show?: HelperConfig | string;
  class?: HelperConfig | string;
}

/** 插件选项: 两份清单 + helper 清单 + 语言, 全部可省略 (省略 = 内置默认全开) */
export interface PluginOptions {
  /**
   * 内置属性指令的默认名前缀: 缺省 'x-', 默认名即 prefix + kind。
   * 只影响属性位 (含 if 的 elif / else); 标签位默认名仍是 kind 本身。
   */
  prefix?: string;
  helpers?: HelpersConfig;
  tags?: TagsConfig;
  attributes?: AttributesConfig;
  locale?: Locale;
}

export type TransformDirective<R = t.Node | NodePath> = (
  node: NodePath<t.JSXElement>,
  ctx: DirectiveState,
  state: PluginState
) => R | t.Expression | void;

// ============================================================
// 产物侧: resolve 出口 (与配置态同构, 只做补齐)
// ============================================================

/**
 * 通用补齐条目: 注册名 / 执行序 / 回调全部填实 (内置取 handlers 默认实现,
 * custom 取用户配置)。禁用的位不出现在清单里 (resolve 阶段已过滤)。
 */
export interface ResolvedEntry {
  /** 条目 kind: 内置五行为之一; custom 条目填 'custom' */
  kind: EntryKind;
  /** 实际注册名集合: 命中任意一项即生效; 至少一项, 已去重 */
  name: string[];
  /** 实际执行序, 小者先; 标签位不参与排序, 由调度器忽略 */
  priority: number;
  transform: TransformDirective;
}

/**
 * if 伴生补齐条目: 在通用条目上带齐三个注册名 (主链 + elif + else)。
 * 只有 if 两位是这种形态; 消费方用 'else' in entry 收窄。
 */
export interface ResolvedBranchEntry extends ResolvedEntry {
  /** elif 实际注册名集合 */
  elif: string[];
  /** else 实际注册名集合 */
  else: string[];
}

/** 清单元素: 普通条目或 if 伴生条目 */
export type ResolvedListItem = ResolvedEntry | ResolvedBranchEntry;

/**
 * resolve 唯一出口: 与 PluginOptions 同构 (清单 / 键位一一对应), 所有键必填,
 * 禁用位不出现在清单里, 启用位的缺省值 / 注册名 / 回调全部填实。
 */
export interface ResolvedOptions {
  /** 属性位默认名前缀: 未配置时补齐为 'x-' */
  prefix: string;
  /** helper 填平: 内置默认模块 + __brja_{kind}_helper__ */
  helpers: {
    for: Required<HelperConfig>;
    show: Required<HelperConfig>;
    class: Required<HelperConfig>;
  };
  /** 标签位填平 */
  tags: ResolvedListItem[];
  /** 属性位填平 */
  attributes: ResolvedListItem[];
  /** 省略配置时已填默认语言 */
  locale: Locale;
}

// ============================================================
// 指令上下文
// ============================================================

export interface DirectiveState {
  position: typeof TAG_POSITION | typeof ATTRIBUTE_POSITION;
  /** 实际命中名: 可能是 if 伴生名 */
  name: string;
  /** 匹配到的填平条目: 伴生名 / 顺序都在里面, 不再平铺到 ctx */
  resolved: ResolvedListItem;
  /** 指令原始值: 属性值节点或标签 value 属性的值, transform 内部自行解包 */
  value: t.JSXElement | t.JSXFragment | t.StringLiteral | t.JSXExpressionContainer | null | undefined;
  /**
   * 承载指令值的属性下标: 属性位为命中的指令属性自身;
   * 标签位为 value 属性, 缺少 value 属性时为 -1 (报错统一指向标签元素)。
   */
  valueAttributeIndex: number;
  /** 运行时 helper 配置: 调度器命中后挂上; 无运行时依赖的指令 (if / html) 不挂 */
  helper?: Required<HelperConfig>;
}

// ============================================================
// JSX 取值工具类型
// ============================================================

/** JSX 属性节点 (普通属性或展开属性) */
export type JsxAttributeLike = t.JSXAttribute | t.JSXSpreadAttribute;

/** JSX 属性原始值: 未解包, 可能是裸写属性 (null) 或容器 */
export type JsxValue = t.JSXAttribute['value'];

/** 取值结果: 原始值 + 该属性在 attributes 中的下标 */
export interface JsxValueResult {
  value: JsxValue;
  attribute: t.JSXAttribute;
  attributeIndex: number;
}

// ============================================================
// 插件基建
// ============================================================

/**
 * 插件工厂收到的 API (@babel/core 传入的第一个参数的子集)。
 *
 * Babel 7 与 8 均提供 assertVersion; Babel 6 不提供, 已不再兼容。
 */
export interface PluginAPI {
  /** @babel/types 命名空间 */
  types: typeof t;
  /** 断言当前 Babel 版本满足给定的 semver 范围, 不满足时直接报错 */
  assertVersion: (range: string) => void;
}

/**
 * 插件状态。
 *
 * 通过接口合并扩展 @babel/core 的 PluginPass, 使 visitor 内部可直接访问
 * directiveHelpers 而不需要类型断言。
 */
export interface PluginState extends PluginPass {
  /** 指令运行时 helper: key 为生成的局部变量名, value 为模块路径 */
  directiveHelpers: Map<string, string>;
  types: typeof t;
  locale: Locale;
  /** 按当前 locale 格式化消息 key, 供 transform 组装错误文案 */
  formatMessage: (key: MessageKey, params?: MessageParams) => string;
}
