import type { ResolvedDirectiveNames } from '../types';

/** for 绑定表达式的 in 关键字 */
export const OPERATOR_IN = 'in';

/**
 * 标签形式的绑定位名。
 *
 * babel 侧写死按这个名字取值 (`getValueFromAttributes('value', ...)`), 这里必须同口径,
 * 否则 `<if className="x" value={a}>` 会被误判成缺值。
 */
export const TAG_VALUE_ATTRIBUTE = 'value';

/**
 * 属性位默认名: 与 babel 的 `attributes` 默认名一致 (带 x- 前缀)。
 *
 * 属性位与标签位是两个独立命名空间, 但**默认值并不相同** —— 标签位没有前缀。
 * 两边的默认名必须与 babel 的 resolve 出口逐字一致, 否则 lint 会找不到节点、静默零报错。
 */
export const DEFAULT_ATTRIBUTE_NAMES: ResolvedDirectiveNames = {
  for: ['x-for'],
  if: ['x-if'],
  elif: ['x-elif'],
  else: ['x-else']
};

/** 标签位默认名: 与 babel 的 `tags` 默认名一致 (无前缀) */
export const DEFAULT_TAG_NAMES: ResolvedDirectiveNames = {
  for: ['for'],
  if: ['if'],
  elif: ['elif'],
  else: ['else']
};
