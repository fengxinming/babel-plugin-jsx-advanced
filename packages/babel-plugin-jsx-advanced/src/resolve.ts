import { normalizeLocale } from './i18n';
import { BUILTIN_ATTRIBUTE_KINDS, BUILTIN_TAG_KINDS } from './constants';
import type {
  AttributesConfig,
  CustomDirectiveConfig,
  HelperConfig,
  HelpersConfig,
  IfAttributeConfig,
  IfTagConfig,
  PluginOptions,
  ResolvedListItem,
  ResolvedOptions,
  TagsConfig,
  TransformDirective
} from './types';
import { transformForAttribute, transformForTag } from './transforms/for';
import { transformIfAttribute, transformIfTag } from './transforms/if';
import { transformShowAttribute } from './transforms/show';
import { transformHtmlAttribute } from './transforms/html';
import { transformClassAttribute } from './transforms/class';

// ============================================================
// 缺省表: 每个可省字段的默认值集中在此, resolve 只查表 + 用户覆盖
// ============================================================

/** 属性位默认名前缀: 未配置时补齐为 x-, 默认名即 prefix + kind */
const DEFAULT_PREFIX = 'x-';

/** 属性位默认执行序: 小者先 (与 vue2 codegen 一致, for 包 if) */
const DEFAULT_ATTRIBUTE_PRIORITY = {
  for: 0,
  if: 1,
  show: 2,
  class: 3,
  html: 4
} as const;

/** helper 默认模块: 只给带运行时依赖的 kind; if 三目 / html 内联均无 helper */
const DEFAULT_HELPER_MODULE = {
  for: 'babel-runtime-jsx-advanced-helper/for-helper',
  show: 'babel-runtime-jsx-advanced-helper/show-helper',
  class: 'babel-runtime-jsx-advanced-helper/class-helper'
} as const;

/** 有运行时 helper 的内置 kind (resolve 只给这些填平 helper) */
const HELPER_KINDS = ['for', 'show', 'class'] as const;

/** helper 默认导入局部变量名: __brja_{kind}_helper__ */
function defaultHelperImported(kind: string): string {
  return `__brja_${kind}_helper__`;
}

/** 自定义属性指令默认 priority 起点: 无内置先后可依, 从内置之后接着排 */
const CUSTOM_PRIORITY_BASE = 100;

/** 标签位 transform 映射: kind → 函数 */
const TAG_TRANSFORM: Record<string, TransformDirective> = {
  for: transformForTag,
  if: transformIfTag
};

/** 属性位 transform 映射: kind → 函数 */
const ATTRIBUTE_TRANSFORM: Record<string, TransformDirective> = {
  for: transformForAttribute,
  if: transformIfAttribute,
  show: transformShowAttribute,
  class: transformClassAttribute,
  html: transformHtmlAttribute
};

// ============================================================
// 分项补齐 (只填缺省, 不做任何校验: 配置形态由 TS 类型约束)
// ============================================================

/**
 * 名字规整: 把 `string | string[]` 统一成去重后的 `string[]`。
 *
 * 非法项 (非字符串 / 空白) 直接过滤; 去重保留首次出现的顺序;
 * 结果为空 (未配置或全部非法) 时回落到 fallback。
 */
function toNames(value: string | string[] | undefined, fallback: string): string[] {
  const list = typeof value === 'string' ? [value] : value;
  const names: string[] = [];
  if (Array.isArray(list)) {
    for (const item of list) {
      if (typeof item !== 'string') {
        continue;
      }
      const name = item.trim();
      if (name !== '' && !names.includes(name)) {
        names.push(name);
      }
    }
  }
  return names.length > 0 ? names : [fallback];
}

/** 单个 kind 的 helper 填平: 没写的字段取缺省表 */
function fillHelper(conf: HelperConfig | string | undefined, kind: (typeof HELPER_KINDS)[number]) {
  if (typeof conf === 'string') {
    return { module: conf, imported: defaultHelperImported(kind) };
  }
  return {
    module: conf?.module ?? DEFAULT_HELPER_MODULE[kind],
    imported: conf?.imported ?? defaultHelperImported(kind)
  };
}

/** helpers 填平: 只给带运行时依赖的 kind 落 module + imported */
function resolveHelpers(helpers: HelpersConfig = {}) {
  return HELPER_KINDS.reduce((prev, cur) => {
    prev[cur] = fillHelper(helpers[cur], cur);
    return prev;
  }, {} as ResolvedOptions['helpers']);
}

/** custom 拍平: 未配 name 时回落 prefix + key (标签位传空串), 原样带 priority 与 transform */
function pushCustom(
  custom: Record<string, CustomDirectiveConfig> | undefined,
  items: ResolvedListItem[],
  priorityOf: (conf: CustomDirectiveConfig, index: number) => number,
  fallbackPrefix = ''
): void {
  if (!custom) {
    return;
  }
  Object.entries(custom).forEach(([key, conf], index) => {
    items.push({
      kind: 'custom',
      name: toNames(conf.name, `${fallbackPrefix}${key}`),
      priority: priorityOf(conf, index),
      transform: conf.transform
    });
  });
}

/** tags 填平: 按 TAG_KINDS 循环, 省略即开、false 即禁; if 展开伴生名 */
function resolveTags(tagsConf: TagsConfig = {}): ResolvedListItem[] {
  const items: ResolvedListItem[] = [];

  for (const kind of BUILTIN_TAG_KINDS) {
    const conf = tagsConf[kind];
    if (conf === false) {
      continue;
    }

    const names = toNames(conf?.name, kind);
    const priority = DEFAULT_ATTRIBUTE_PRIORITY[kind];
    const transform = TAG_TRANSFORM[kind];

    if (kind === 'if') {
      const elif = toNames((conf as IfTagConfig)?.elif, 'elif');
      const else_ = toNames((conf as IfTagConfig)?.else, 'else');
      // 多个等价名时在文案里并列展示; 单名时与原来完全一致
      const mainLabel = names.join(' / ');
      const elifLabel = elif.join(' / ');
      items.push({
        kind,
        name: names,
        elif,
        else: else_,
        priority,
        transform
      }, {
        kind: 'elif',
        name: elif,
        priority: priority + 0.1,
        transform(_node, ctx, state) {
          throw _node.buildCodeFrameError(
            state.formatMessage('BRANCH_ELIF_TAG_REQUIRES_PRECEDING', {
              name: ctx.name,
              main: mainLabel
            })
          );
        }
      }, {
        kind: 'else',
        name: else_,
        priority: priority + 0.2,
        transform(_node, ctx, state) {
          throw _node.buildCodeFrameError(
            state.formatMessage('BRANCH_ELSE_TAG_REQUIRES_PRECEDING', {
              name: ctx.name,
              main: mainLabel,
              elif: elifLabel
            })
          );
        }
      });
    }
    else {
      items.push({ kind, name: names, priority, transform });
    }
  }

  pushCustom(tagsConf.custom, items, (conf, index) => conf.priority ?? CUSTOM_PRIORITY_BASE + index);
  return items.sort((a, b) => a.priority - b.priority);
}

/** attributes 填平: 按 BUILTIN_ATTRIBUTE_KINDS 循环, 省略即开、false 即禁; if 展开伴生名 */
function resolveAttributes(prefix: string, attrConf: AttributesConfig = {}): ResolvedListItem[] {
  const items: ResolvedListItem[] = [];

  for (const kind of BUILTIN_ATTRIBUTE_KINDS) {
    const conf = attrConf[kind];
    if (conf === false) {
      continue;
    }

    const names = toNames(conf?.name, `${prefix}${kind}`);
    const priority = conf?.priority ?? DEFAULT_ATTRIBUTE_PRIORITY[kind];
    const transform = ATTRIBUTE_TRANSFORM[kind];

    if (kind === 'if') {
      const elif = toNames((conf as IfAttributeConfig)?.elif, `${prefix}elif`);
      const else_ = toNames((conf as IfAttributeConfig)?.else, `${prefix}else`);
      // 多个等价名时在文案里并列展示; 单名时与原来完全一致
      const mainLabel = names.join(' / ');
      const elifLabel = elif.join(' / ');
      items.push({
        kind,
        name: names,
        elif,
        else: else_,
        priority,
        transform
      }, {
        kind: 'elif',
        name: elif,
        priority: priority + 0.1,
        transform(_node, ctx, state) {
          const errorPath = _node.get(
            `openingElement.attributes.${ctx.valueAttributeIndex}`
          );
          throw errorPath.buildCodeFrameError(
            state.formatMessage('BRANCH_ELIF_ATTRIBUTE_REQUIRES_PRECEDING', {
              name: ctx.name,
              main: mainLabel
            })
          );
        }
      }, {
        kind: 'else',
        name: else_,
        priority: priority + 0.2,
        transform(_node, ctx, state) {
          const errorPath = _node.get(
            `openingElement.attributes.${ctx.valueAttributeIndex}`
          );
          throw errorPath.buildCodeFrameError(
            state.formatMessage('BRANCH_ELSE_ATTRIBUTE_REQUIRES_PRECEDING', {
              name: ctx.name,
              main: mainLabel,
              elif: elifLabel
            })
          );
        }
      });
    }
    else {
      items.push({ kind, name: names, priority, transform });
    }
  }

  pushCustom(attrConf.custom, items, (conf, index) => conf.priority ?? CUSTOM_PRIORITY_BASE + index, prefix);
  return items.sort((a, b) => a.priority - b.priority);
}

// ============================================================
// 主入口
// ============================================================

/** resolveOptions: 用户配置 → 全部补齐的 ResolvedOptions (只补齐, 不换装, 不校验) */
export function resolveOptions(opts: PluginOptions = {}): ResolvedOptions {
  const prefix = opts.prefix ?? DEFAULT_PREFIX;
  return {
    prefix,
    helpers: resolveHelpers(opts.helpers),
    tags: resolveTags(opts.tags),
    attributes: resolveAttributes(prefix, opts.attributes),
    locale: normalizeLocale(opts.locale)
  };
}
