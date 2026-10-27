/**
 * 遍历渲染回调。
 *
 * @param value 当前项的值
 * @param key 当前项的键 (数组为下标, 对象为属性名)
 * @param index 当前项的序号
 * @param source 正在遍历的源数据
 */
export type RenderItem<T> = (
  value: unknown,
  key: string | number,
  index: number,
  source: unknown
) => T;
