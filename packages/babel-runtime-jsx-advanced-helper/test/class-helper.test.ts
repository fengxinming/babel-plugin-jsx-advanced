import { describe, it, expect } from 'vitest';
import classnames from 'classnames';
import classHelper from '../src/class-helper';

describe('classHelper', () => {
  it('没有参数时返回空字符串', () => {
    expect(classHelper()).toBe('');
    expect(classnames()).toBe('');
  });

  it('字符串原样保留, 多个值以单个空格分隔', () => {
    const input = ['btn', 'primary'];
    const actual = classHelper(...input);
    expect(actual).toBe('btn primary');
    expect(actual).toBe(classnames(...input));
  });

  it('空字符串不产生 class', () => {
    const input = ['', 'btn', ''];
    const actual = classHelper(...input);
    expect(actual).toBe('btn');
    expect(actual).toBe(classnames(...input));
  });

  it('非 0 数字转字符串, 0 与 NaN 跳过', () => {
    const input = [1, -2, 0, Number.NaN];
    const actual = classHelper(...input);
    expect(actual).toBe('1 -2');
    expect(actual).toBe(classnames(...input));
  });

  it('布尔、null、undefined 全部跳过', () => {
    const input = [true, false, null, undefined];
    const actual = classHelper(...input);
    expect(actual).toBe('');
    expect(actual).toBe(classnames(...input));
  });

  it('数组递归展开, 支持任意嵌套', () => {
    const input = ['a', ['b', ['c']], null, 0];
    const actual = classHelper(...input);
    expect(actual).toBe('a b c');
    expect(actual).toBe(classnames(...input));
  });

  it('对象取值为真的自有 key', () => {
    const input = [{ active: true, disabled: false, size: 1, empty: 0 }];
    const actual = classHelper(...input);
    expect(actual).toBe('active size');
    expect(actual).toBe(classnames(...input));
  });

  it('对象只认自有属性, 原型链上的 key 不参与', () => {
    const source = Object.create({ inherited: true });
    source.own = true;
    const actual = classHelper(source);
    expect(actual).toBe('own');
    expect(actual).toBe(classnames(source));
  });

  it('混合形态按参数顺序串接', () => {
    const input = ['btn', ['x', { y: true }], { z: false }, 3];
    const actual = classHelper(...input);
    expect(actual).toBe('btn x y 3');
    expect(actual).toBe(classnames(...input));
  });

  it('不做去重, 同名 class 原样重复', () => {
    const input = ['a', 'a'];
    const actual = classHelper(...input);
    expect(actual).toBe('a a');
    expect(actual).toBe(classnames(...input));
  });

  it('空数组与空对象不产生内容', () => {
    const input = [[], {}, ''];
    const actual = classHelper(...input);
    expect(actual).toBe('');
    expect(actual).toBe(classnames(...input));
  });
});
