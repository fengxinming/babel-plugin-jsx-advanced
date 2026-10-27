import { describe, it, expect } from 'vitest';
import { transform, readFixture, readExpected } from './_utils';

/**
 * 执行序语义端到端验证。
 *
 * 同一元素上的多条指令按 priority 升序执行，产物形态的差异就是执行顺序的证据：
 * for 先执行时条件落在回调体内（能引用循环变量），if 先执行时映射整体落在分支内。
 *
 * 输入 JSX 与期望产物都放在 fixtures 目录：.jsx 交给编辑器格式化插件管理缩进，
 * .expected.txt 是 babel 生成的原始产物，逐字比对。
 */
describe('pipeline order', () => {
  it('默认顺序 for → if：映射在外，条件在内，条件可引用循环变量', () => {
    const out = transform(readFixture('order', 'for-and-if'));

    expect(out).toBe(readExpected('order', 'default-for-then-if'));
  });

  it('priority 覆盖后 if → for：条件在外，映射整体落在分支内', () => {
    const out = transform(readFixture('order', 'for-and-if'), {
      attributes: { for: { priority: 1 }, if: { priority: 0 } }
    });

    expect(out).toBe(readExpected('order', 'priority-if-then-for'));
  });

  it('show / class / html 按 2 / 3 / 4 依次叠加，写入属性顺序稳定', () => {
    const out = transform(readFixture('order', 'show-class-html'));

    expect(out).toBe(readExpected('order', 'show-class-html'));
  });

  it('标签 for 包住 x-if：整体替换后内层指令继续生效', () => {
    const out = transform(readFixture('order', 'tag-for-wraps-if'));

    expect(out).toBe(readExpected('order', 'tag-for-wraps-if'));
  });

  it('标签 for 多个子节点：包成 Fragment 作为循环体', () => {
    const out = transform(readFixture('order', 'tag-for-multiple-children'));

    expect(out).toBe(readExpected('order', 'tag-for-multiple-children'));
  });

  it('标签 for 无有效子节点：循环体为 null', () => {
    const out = transform(readFixture('order', 'tag-for-empty-body'));

    expect(out).toBe(readExpected('order', 'tag-for-empty-body'));
  });
});
