/**
 * 按条件返回样式对象。
 *
 * 为假时必须写 `display: none` —— 只回浅拷贝的话元素上原有的 style 会原样保留,
 * 隐藏根本不生效。放在最后写, 覆盖掉样式里自己写的 display。
 *
 * @param styles 原始样式对象
 * @param value 条件值, 为真时返回原对象, 否则返回带上 display: none 的新对象
 */
export default function showHelper(styles: Record<string, unknown>, value: unknown): Record<string, unknown> {
  return value
    ? styles
    : { ...styles, display: 'none' };
}
