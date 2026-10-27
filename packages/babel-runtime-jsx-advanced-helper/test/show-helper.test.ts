import { describe, it, expect } from 'vitest';
import showHelper from '../src/show-helper';

describe('showHelper', () => {
  it('条件为真时原样返回同一个对象引用', () => {
    const styles = { color: 'red' };
    expect(showHelper(styles, true)).toBe(styles);
  });

  it('条件为假时返回带 display: none 的浅拷贝', () => {
    const styles = { color: 'red' };
    const result = showHelper(styles, false);
    expect(result).toEqual({ color: 'red', display: 'none' });
    expect(result).not.toBe(styles);
  });

  it('条件为假时覆盖样式里已有的 display', () => {
    expect(showHelper({ display: 'flex' }, 0)).toEqual({ display: 'none' });
  });

  it('空对象在条件为假时同样补上 display: none', () => {
    expect(showHelper({}, null)).toEqual({ display: 'none' });
  });
});
