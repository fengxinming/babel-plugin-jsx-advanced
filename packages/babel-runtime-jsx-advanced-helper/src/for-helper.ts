import type { RenderItem } from './types';

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * 判断值是否可按索引遍历。
 *
 * 字符串虽然具备 length 与索引, 但语义上不应被逐字符渲染, 故显式排除。
 *
 * @param value 待判断的值
 */
function isArrayLike(value: unknown): value is ArrayLike<unknown> {
  return !!value
    && typeof value !== 'function'
    && typeof value !== 'string'
    && typeof (value as ArrayLike<unknown>).length === 'number';
}

/**
 * 遍历数组 / 数字 / 对象并渲染每一项。
 *
 * @param val 待遍历的值
 * @param render 渲染回调
 */
export default function forHelper<T>(val: unknown, render: RenderItem<T>): T[] | null {
  let ret: T[] | null = null;
  let i = 0;
  if (val) {
    if (isArrayLike(val)) {
      const len = val.length;
      const list: T[] = new Array(len);
      for (i = 0; i < len; i++) {
        list[i] = render(val[i], i, i, val);
      }
      ret = list;
    }
    else if (typeof val === 'number' && val > 0) {
      // 取整后再分配: new Array 收到负数或小数会直接抛 RangeError
      const len = Math.floor(val);
      const list: T[] = new Array(len);
      for (i = 0; i < len; i++) {
        list[i] = render(i + 1, i, i, val);
      }
      ret = list;
    }
    else if (typeof val === 'object') {
      const source = val as Record<string, unknown>;
      const list: T[] = [];
      for (const key in source) {
        if (hasOwn.call(source, key)) {
          list[i] = render(source[key], key, i, source);
          i += 1;
        }
      }
      ret = list;
    }
  }
  return ret;
}
