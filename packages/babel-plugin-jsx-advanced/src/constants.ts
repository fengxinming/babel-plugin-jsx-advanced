/**
 * 内置行为种类清单。
 *
 * kind 只认这五个内置行为 (外加 custom 表示自定义); 校验按这张表判断 ——
 * 配置里的键写的就是 kind 本身, 不再写一个「词」等解析器去猜行为。
 */
export const BUILTIN_ATTRIBUTE_KINDS = ['for', 'if', 'show', 'class', 'html'] as const;

/** 标签位可配的内置行为 (show / class / html 没有标签形式, 写在 tags 下即报错) */
export const BUILTIN_TAG_KINDS = ['for', 'if'] as const;

export const TAG_POSITION = 'tag';

export const ATTRIBUTE_POSITION = 'attribute';

/**
 * 受支持的语言清单。
 *
 * 语言是「能力」, 只有这一份定义; 语言「入口」两端各配各的 —— babel 走插件
 * 选项, eslint 走 settings['jsx-advanced']。
 */
export const SUPPORTED_LOCALES = ['en-US', 'zh-CN'] as const;
