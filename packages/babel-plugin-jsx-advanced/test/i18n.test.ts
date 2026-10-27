import { describe, it, expect } from 'vitest';
import { normalizeLocale, render } from '../src/i18n';

/**
 * 只测行为，不测静态数据。
 *
 * 消息表本身是静态文案，逐条比对 key / 文案 / 占位符没有信息量；这里只锁
 * normalizeLocale 的归一规则，以及 render 在错误路径上的兜底不抛错行为。
 */
describe('normalizeLocale', () => {
  it('容错大小写、连字符与下划线', () => {
    expect(normalizeLocale('zh')).toBe('zh-CN');
    expect(normalizeLocale('zh-CN')).toBe('zh-CN');
    expect(normalizeLocale('zh-cn')).toBe('zh-CN');
    expect(normalizeLocale('ZH_CN')).toBe('zh-CN');
    expect(normalizeLocale('  zh-CN  ')).toBe('zh-CN');
    expect(normalizeLocale('en')).toBe('en-US');
    expect(normalizeLocale('en-US')).toBe('en-US');
  });

  it('未知或空语言回落默认语言', () => {
    expect(normalizeLocale('fr')).toBe('en-US');
    expect(normalizeLocale('')).toBe('en-US');
    expect(normalizeLocale()).toBe('en-US');
  });

  it('带地区的标记不做前缀回退', () => {
    // 与 eslint 侧 toLocale 同一口径：zh-TW / zh-Hant 不静默变简体
    expect(normalizeLocale('zh-TW')).toBe('en-US');
    expect(normalizeLocale('zh-Hant')).toBe('en-US');
    expect(normalizeLocale('zh-Hans')).toBe('en-US');
  });
});

describe('render', () => {
  it('省略语言时用默认语言 en-US', () => {
    const params = { tag: 'for' };
    expect(render('TAG_VALUE_REQUIRED', params))
      .toBe(render('TAG_VALUE_REQUIRED', params, 'en-US'));
  });

  it('显式语言覆盖默认语言', () => {
    const params = { tag: 'for' };
    expect(render('TAG_VALUE_REQUIRED', params, 'zh-CN'))
      .not.toBe(render('TAG_VALUE_REQUIRED', params, 'en-US'));
  });

  it('else 文案的 {{elif}} 参数会被替换', () => {
    expect(render(
      'BRANCH_ELSE_ATTRIBUTE_REQUIRES_PRECEDING',
      { name: 'x-else', main: 'x-if', elif: 'x-elif' },
      'en-US'
    )).toBe("the 'x-else' directive requires the previous JSX node to contain the 'x-if' or 'x-elif' directive.");
  });

  it('缺 elif 参数时只保留该占位符', () => {
    expect(render(
      'BRANCH_ELSE_ATTRIBUTE_REQUIRES_PRECEDING',
      { name: 'x-else', main: 'x-if' },
      'en-US'
    )).toBe("the 'x-else' directive requires the previous JSX node to contain the 'x-if' or '{{elif}}' directive.");
  });

  it('未知语言回落默认语言', () => {
    const params = { tag: 'for' };
    expect(render('TAG_VALUE_REQUIRED', params, 'fr'))
      .toBe(render('TAG_VALUE_REQUIRED', params, 'en-US'));
  });

  it('缺 key 时回落 key 本身，不抛错', () => {
    expect(render('UNKNOWN_KEY' as never)).toBe('UNKNOWN_KEY');
  });

  it('不传参数时占位符原样保留', () => {
    expect(render('TAG_VALUE_REQUIRED', undefined, 'en-US'))
      .toBe('<{{tag}}> requires a value attribute bound to a variable or expression.');
  });
});
