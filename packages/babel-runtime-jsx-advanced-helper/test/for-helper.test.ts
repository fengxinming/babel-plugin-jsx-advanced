import { describe, it, expect } from 'vitest';
import forHelper from '../src/for-helper';

describe('forHelper', () => {
  it('数组按顺序渲染, 回调收到值、键、序号与源数据', () => {
    const source = ['a', 'b'];
    const calls: unknown[][] = [];
    const result = forHelper(source, (value, key, index, origin) => {
      calls.push([value, key, index, origin]);
      return `${key}:${value}`;
    });
    expect(result).toEqual(['0:a', '1:b']);
    expect(calls).toEqual([
      ['a', 0, 0, source],
      ['b', 1, 1, source]
    ]);
  });

  it('空数组返回空数组而不是 null', () => {
    expect(forHelper([], () => 1)).toEqual([]);
  });

  it('数字按 1 起始生成对应个数, 序号从 0 开始', () => {
    expect(forHelper(3, (value, key, index) => `${key}/${value}/${index}`)).toEqual([
      '0/1/0',
      '1/2/1',
      '2/3/2'
    ]);
  });

  it('0 与负数不渲染', () => {
    expect(forHelper(0, () => 1)).toBeNull();
    expect(forHelper(-1, () => 1)).toBeNull();
  });

  it('小数向下取整后渲染对应个数', () => {
    expect(forHelper(2.9, (value) => value)).toEqual([1, 2]);
  });

  it('对象遍历自有可枚举属性, 键为属性名', () => {
    const source = { a: 1, b: 2 };
    expect(forHelper(source, (value, key, index) => `${key}${value}${index}`)).toEqual(['a10', 'b21']);
  });

  it('对象跳过原型链上的属性', () => {
    const source = Object.create({ inherited: 1 });
    source.own = 2;
    expect(forHelper(source, (value, key) => `${key}:${value}`)).toEqual(['own:2']);
  });

  it('类数组对象按 length 遍历', () => {
    const source = { 0: 'a', 1: 'b', length: 2 };
    expect(forHelper(source, (value) => value)).toEqual(['a', 'b']);
  });

  it('字符串不被逐字符渲染', () => {
    expect(forHelper('abc', () => 1)).toBeNull();
  });

  it('函数不会被当作类数组遍历', () => {
    const source = () => 1;
    expect(forHelper(source, () => 1)).toBeNull();
  });

  it('falsy 输入统一返回 null', () => {
    expect(forHelper(null, () => 1)).toBeNull();
    expect(forHelper(undefined, () => 1)).toBeNull();
    expect(forHelper(false, () => 1)).toBeNull();
    expect(forHelper('', () => 1)).toBeNull();
  });
});
