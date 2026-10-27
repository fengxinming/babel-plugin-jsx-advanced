import { SUPPORTED_LOCALES } from '../constants';
import type { Locale, MessageKey, MessageParams } from '../types';
import { enUS } from './en-US';
import { zhCN } from './zh-CN';

/**
 * 占位符: `{{name}}`, 名字里不允许出现花括号。
 *
 * 禁止花括号是刻意的 —— 这样字面花括号能与占位符混排。例如
 * `{ {{position}}: 'custom', ... }` 的外层花括号必须原样输出, 只有
 * `{{position}}` 会被替换。
 */
const PLACEHOLDER_PATTERN = /\{\{([^{}]+?)\}\}/g;

/** 全部语言的消息表, key 即语言标识 */
const TABLES: Record<Locale, Record<MessageKey, string>> = {
  'en-US': enUS,
  'zh-CN': zhCN
};

/**
 * 把任意语言标记归一化成受支持的语言。
 *
 * 容错的是大小写、连字符与下划线, 以及**纯语言标记**: `zh` / `zh-CN` / `zh-cn` /
 * `ZH_CN` 都归一到 `zh-CN`。
 *
 * **带地区后缀却不匹配的一律回落默认语言, 不做前缀回退** —— `zh-TW` / `zh-Hant` 不
 * 会静默变成简体: 带地区标记与默认语言不是一回事, 猜错比报错更难查。与 eslint 侧
 * `toLocale` 同一口径, 同一份配置两端报错语言必然一致。
 *
 * @param locale 调用方给的语言标记, 可为空
 */
export function normalizeLocale(locale?: string): Locale {
  const normalized = locale?.trim().replace(/_/g, '-').toLowerCase() ?? '';
  if (!normalized) {
    return SUPPORTED_LOCALES[0];
  }
  return SUPPORTED_LOCALES.find((item) => {
    const value = item.toLowerCase();
    // 完整匹配, 或只写语言不写地区 ('zh' 视为 'zh-CN')
    return value === normalized || value.split('-')[0] === normalized;
  }) ?? SUPPORTED_LOCALES[0];
}

/**
 * 渲染一条消息。
 *
 * 纯函数: 语言每次调用传入, 模块内不保存任何「当前语言」状态 —— 同进程里
 * babel 可能按多份配置、eslint 可能按多个文件并发取不同语言, 存状态必然串味。
 *
 * 两条兜底都是刻意的, 因为本函数跑在错误处理路径上: 缺某条 locale 时回落默认
 * 语言, 缺 key 时回落 key 本身, **绝不抛错** —— 抛错会吃掉调用方真正要报的错误。
 *
 * @param key 消息 key
 * @param params 占位符参数; 省略时占位符原样保留
 * @param locale 语言标记, 省略时用默认语言
 */
export function render(key: MessageKey, params?: MessageParams, locale?: string): string {
  // 运行期可能传来表外的 key (非 TS 调用方), 查表结果按可缺失处理
  const table: Record<string, string | undefined> = TABLES[normalizeLocale(locale)];
  const template = table[key] ?? key;
  if (params === undefined) {
    return template;
  }
  return template.replace(PLACEHOLDER_PATTERN, (placeholder, name: string) => {
    const value = params[name.trim()];
    // 缺参数时保留占位符原文, 便于定位是哪一条没传
    return value === undefined ? placeholder : String(value);
  });
}
