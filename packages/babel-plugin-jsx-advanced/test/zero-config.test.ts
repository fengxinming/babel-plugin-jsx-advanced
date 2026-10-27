import { describe, it, expect } from 'vitest';
import { resolveOptions } from '../src/resolve';
import { transform, expectCompileError, readFixture, readExpected } from './_utils';

/**
 * 零配置回归：两份清单都不配时，全部内置指令可用。
 *
 * 每个用例都给足外壳（宿主元素 + 前后兄弟节点），整段产物用 toBe 精确比对：
 * 分支链少折一层、前后节点被吞掉、属性残留、helper 名写错，都会直接炸。
 *
 * 输入 JSX 在 fixtures/zero-config/*.jsx，期望产物在同名 *.expected.txt。
 */
describe('zero config', () => {
  it('x-for 渲染为 helper 调用，循环回调包住原元素', () => {
    const out = transform(readFixture('zero-config', 'attr-for'));

    expect(out).toBe(readExpected('zero-config', 'attr-for'));
  });

  it('x-if / x-elif / x-else 折叠为三目链，前后兄弟节点原样保留', () => {
    const out = transform(readFixture('zero-config', 'if-chain'));

    expect(out).toBe(readExpected('zero-config', 'if-chain'));
  });

  it('if / elif / else 标签折叠为三目链，外壳丢弃、children 作分支', () => {
    const out = transform(readFixture('zero-config', 'tag-if-chain'));

    expect(out).toBe(readExpected('zero-config', 'tag-if-chain'));
  });

  it('if 标签内行内元素之间的空格：按 babel 规则保留，不被当缩进丢掉', () => {
    const out = transform(readFixture('zero-config', 'tag-if-inline-space'));

    expect(out).toBe(readExpected('zero-config', 'tag-if-inline-space'));
  });

  it('if 标签内 NBSP：是内容而不是空白，trim 误杀后必须保留', () => {
    const out = transform(readFixture('zero-config', 'tag-if-nbsp'));

    expect(out).toBe(readExpected('zero-config', 'tag-if-nbsp'));
  });

  it('if 标签内单个展开子节点：转交 preset-react 报标准文案，不产出非法 AST', () => {
    const code = readFixture('directives', 'tag-spread-child');

    expectCompileError(
      () => transform(code),
      'Spread children are not supported in React.'
    );
  });

  it('x-show 无 style 时内联三目，display:none 作为隐藏态', () => {
    const out = transform(readFixture('zero-config', 'show-inline'));

    expect(out).toBe(readExpected('zero-config', 'show-inline'));
  });

  it('x-show 已有 style 绑定时走 show-helper，合并而非覆盖', () => {
    const out = transform(readFixture('zero-config', 'show-merge'));

    expect(out).toBe(readExpected('zero-config', 'show-merge'));
  });

  it('x-class 已有 className 字符串时走 class-helper，保留原类名', () => {
    const out = transform(readFixture('zero-config', 'class-merge'));

    expect(out).toBe(readExpected('zero-config', 'class-merge'));
  });

  it('x-class 无 className 时新增 className 属性', () => {
    const out = transform(readFixture('zero-config', 'class-add'));

    expect(out).toBe(readExpected('zero-config', 'class-add'));
  });

  it('x-html 转换为 dangerouslySetInnerHTML，指令属性被摘除', () => {
    const out = transform(readFixture('zero-config', 'html'));

    expect(out).toBe(readExpected('zero-config', 'html'));
  });
});

/**
 * 零配置下 resolveOptions 的出口必须与内置缺省表逐字一致。
 *
 * 默认名 / 优先级 / helper 是插件对用户的公开契约，单测直接锁死，避免改缺省表时
 * 只在文档或 eslint 侧悄悄漂移。
 */
describe('resolveOptions 零配置缺省', () => {
  const pick = (list: ReturnType<typeof resolveOptions>['tags']) =>
    list.map(({ kind, name, priority }) => ({ kind, name, priority }));

  it('tags 默认开启 for 与 if 族，优先级 0 / 1 / 1.1 / 1.2', () => {
    expect(pick(resolveOptions().tags)).toEqual([
      { kind: 'for', name: ['for'], priority: 0 },
      { kind: 'if', name: ['if'], priority: 1 },
      { kind: 'elif', name: ['elif'], priority: 1.1 },
      { kind: 'else', name: ['else'], priority: 1.2 }
    ]);
  });

  it('attributes 默认开启全部内置，名字带 x- 前缀', () => {
    expect(pick(resolveOptions().attributes)).toEqual([
      { kind: 'for', name: ['x-for'], priority: 0 },
      { kind: 'if', name: ['x-if'], priority: 1 },
      { kind: 'elif', name: ['x-elif'], priority: 1.1 },
      { kind: 'else', name: ['x-else'], priority: 1.2 },
      { kind: 'show', name: ['x-show'], priority: 2 },
      { kind: 'class', name: ['x-class'], priority: 3 },
      { kind: 'html', name: ['x-html'], priority: 4 }
    ]);
  });

  it('helpers 只给 for / show / class 填默认模块与导入名', () => {
    expect(resolveOptions().helpers).toEqual({
      for: {
        module: 'babel-runtime-jsx-advanced-helper/for-helper',
        imported: '__brja_for_helper__'
      },
      show: {
        module: 'babel-runtime-jsx-advanced-helper/show-helper',
        imported: '__brja_show_helper__'
      },
      class: {
        module: 'babel-runtime-jsx-advanced-helper/class-helper',
        imported: '__brja_class_helper__'
      }
    });
  });

  it('locale 省略时填默认语言 en-US', () => {
    expect(resolveOptions().locale).toBe('en-US');
  });
});

/**
 * 名字配置的规整契约: `string | string[]` 在 resolve 出口统一成去重后的数组。
 *
 * 过滤与回落规则对内置 / elif / else / custom 一视同仁, 单测锁死, 避免运行期
 * 还要再判一次类型。
 */
describe('resolveOptions 名字规整', () => {
  const attributeNames = (kind: string) =>
    resolveOptions({
      attributes: { show: { name: ['', '  ', 'x-show', 'x-show'] } }
    }).attributes
      .filter((entry) => entry.kind === kind)
      .map(({ name }) => name);

  it('单字符串统一成单元素数组', () => {
    const names = resolveOptions({
      attributes: { show: { name: 'v-show' } }
    }).attributes
      .filter(({ kind }) => kind === 'show')
      .map(({ name }) => name);

    expect(names).toEqual([['v-show']]);
  });

  it('数组去重并过滤空白项', () => {
    expect(attributeNames('show')).toEqual([['x-show']]);
  });

  it('全部非法时回落到内置默认名', () => {
    const names = resolveOptions({
      attributes: { show: { name: ['', '   '] } }
    }).attributes
      .filter(({ kind }) => kind === 'show')
      .map(({ name }) => name);

    expect(names).toEqual([['x-show']]);
  });

  it('elif / else 与主名同形，同样支持名字数组', () => {
    const names = resolveOptions({
      tags: {
        if: {
          name: ['if', 'v-if'],
          elif: ['elif', 'v-else-if'],
          else: ['else', 'v-else']
        }
      }
    }).tags
      .filter(({ kind }) => kind === 'if' || kind === 'elif' || kind === 'else')
      .map(({ kind, name }) => ({ kind, name }));

    expect(names).toEqual([
      { kind: 'if', name: ['if', 'v-if'] },
      { kind: 'elif', name: ['elif', 'v-else-if'] },
      { kind: 'else', name: ['else', 'v-else'] }
    ]);
  });

  it('custom 配了 name 用 name；省略时属性位补 prefix，标签位用 key', () => {
    const resolved = resolveOptions({
      prefix: 'v-',
      attributes: {
        custom: {
          hi: { name: ['hi', 'hello'], transform: () => {} },
          bye: { transform: () => {} }
        }
      },
      tags: {
        custom: { hello: { transform: () => {} } }
      }
    });
    const attributeNames = resolved.attributes
      .filter(({ kind }) => kind === 'custom')
      .map(({ name }) => name);
    const tagNames = resolved.tags
      .filter(({ kind }) => kind === 'custom')
      .map(({ name }) => name);

    expect(attributeNames).toEqual([['hi', 'hello'], ['v-bye']]);
    expect(tagNames).toEqual([['hello']]);
  });
});
