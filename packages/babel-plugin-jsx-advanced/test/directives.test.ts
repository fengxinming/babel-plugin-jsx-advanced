/* eslint-disable max-len */
import { describe, it, expect } from 'vitest';
import type { TransformDirective } from '../src/types';
import { transform, expectCompileError, locate, readFixture, readExpected } from './_utils';

/** custom 属性指令：把指令值搬到 onClick 上，然后不返回替换节点 */
const trackToOnClick: TransformDirective = (nodePath, ctx, state) => {
  const types = state.types;
  const value = ctx.value;
  if (!types.isJSXExpressionContainer(value) || types.isJSXEmptyExpression(value.expression)) {
    return;
  }
  nodePath.node.openingElement.attributes.push(
    types.jsxAttribute(
      types.jsxIdentifier('onClick'),
      types.jsxExpressionContainer(value.expression)
    )
  );
};

/** custom 标签指令：整段替换为一个标识符 */
const greetsToIdentifier: TransformDirective = (_nodePath, _ctx, state) =>
  state.types.identifier('GREET');

/** custom 属性指令：把实际命中的名字写进 data-hit，验证名字数组命中的是哪一项 */
const nameToDataHit: TransformDirective = (nodePath, ctx, state) => {
  nodePath.node.openingElement.attributes.push(
    state.types.jsxAttribute(
      state.types.jsxIdentifier('data-hit'),
      state.types.stringLiteral(ctx.name)
    )
  );
};

/**
 * 配置语义：改名、禁用、custom、helper 覆盖。
 *
 * 每个成功用例都整段比对产物；名字是否真的“换了”、默认名是否真的失效，
 * 都从产物里看，不靠“包含某个片段”糊过去。
 *
 * 输入 JSX 在 fixtures/directives/*.jsx，期望产物在同名 *.expected.txt；
 * 报错用例只存输入，行列由 locate 从夹具源码实时算出。
 */
describe('配置：改名与禁用', () => {
  it('attributes.for 改名为 each 后，默认 x-for 不再匹配、原样保留', () => {
    const out = transform(readFixture('directives', 'attr-for-renamed'), {
      attributes: { for: { name: 'each' } }
    });

    expect(out).toBe(readExpected('directives', 'attr-for-renamed'));
  });

  it('tags.for 改名为 loop 后，默认 for 标签不再匹配、原样保留', () => {
    const out = transform(readFixture('directives', 'tag-for-renamed'), {
      tags: { for: { name: 'loop' } }
    });

    expect(out).toBe(readExpected('directives', 'tag-for-renamed'));
  });

  it('attributes 配 false：指令不解析，属性原样输出', () => {
    const out = transform(readFixture('directives', 'attributes-disabled'), {
      attributes: { if: false, show: false }
    });

    expect(out).toBe(readExpected('directives', 'attributes-disabled'));
  });

  it('tags.if 配 false：if / elif / else 标签全部不解析', () => {
    const out = transform(readFixture('directives', 'tag-if-disabled'), {
      tags: { if: false }
    });

    expect(out).toBe(readExpected('directives', 'tag-if-disabled'));
  });

  it('attributes.if 主名与分支名同时改名', () => {
    const out = transform(readFixture('directives', 'attr-if-renamed'), {
      attributes: { if: { name: 'when', elif: 'also', else: 'otherwise' } }
    });

    expect(out).toBe(readExpected('directives', 'attr-if-renamed'));
  });

  it('tags.if 主名与分支名同时改名', () => {
    const out = transform(readFixture('directives', 'tag-if-renamed'), {
      tags: { if: { name: 'when', elif: 'also', else: 'otherwise' } }
    });

    expect(out).toBe(readExpected('directives', 'tag-if-renamed'));
  });
});

describe('配置：custom 指令', () => {
  it('custom 属性指令：transform 不返回节点，指令属性由管线摘除', () => {
    const out = transform(readFixture('directives', 'custom-attribute'), {
      attributes: { custom: { track: { transform: trackToOnClick } } }
    });

    expect(out).toBe(readExpected('directives', 'custom-attribute'));
  });

  it('custom 标签指令：返回表达式后整段替换原元素', () => {
    const out = transform(readFixture('directives', 'custom-tag'), {
      tags: { custom: { greets: { transform: greetsToIdentifier } } }
    });

    expect(out).toBe(readExpected('directives', 'custom-tag'));
  });
});

describe('配置：helper 覆盖', () => {
  it('helpers.for 配字符串：同时覆盖模块路径，导入名保持默认', () => {
    const out = transform(readFixture('directives', 'helper-string'), {
      helpers: { for: 'my-own-for-helper' }
    });

    expect(out).toBe(readExpected('directives', 'helper-string'));
  });

  it('helpers.for 配对象：模块与导入名都按配置来', () => {
    const out = transform(readFixture('directives', 'helper-object'), {
      helpers: { for: { module: 'my-for-helper', imported: '__mine__' } }
    });

    expect(out).toBe(readExpected('directives', 'helper-object'));
  });

  it('标签位与属性位共用同一个 helper，只插入一条 import', () => {
    const out = transform(readFixture('directives', 'helper-shared'));

    expect(out).toBe(readExpected('directives', 'helper-shared'));
  });

  it('标签 for 取 value 时跳过展开属性', () => {
    const out = transform(readFixture('directives', 'tag-for-spread'));

    expect(out).toBe(readExpected('directives', 'tag-for-spread'));
  });
});

/**
 * 名字配置：`string | string[]` 在 resolve 后统一成数组，命中任意一项即生效。
 *
 * 这里用产物证明名字数组真的能命中，并锁死 `ctx.name` 是实际命中的那一个名字；
 * 去重 / 过滤 / 回落这些规整细节由 zero-config.test.ts 的 resolve 契约覆盖。
 */
describe('配置：名字数组', () => {
  it('标签 if 族配多个名字时，任一名字都能命中并折叠分支', () => {
    const out = transform(readFixture('directives', 'tag-if-alias-chain'), {
      tags: {
        if: {
          name: ['if', 'v-if'],
          elif: ['elif', 'v-else-if'],
          else: ['else', 'v-else']
        }
      }
    });

    expect(out).toBe(readExpected('directives', 'tag-if-alias-chain'));
  });

  it('属性 show 配多个名字时，数组里的名字都能命中', () => {
    const out = transform(readFixture('directives', 'attr-show-alias'), {
      attributes: { show: { name: ['x-show', 'v-show'] } }
    });

    expect(out).toBe(readExpected('directives', 'attr-show-alias'));
  });

  it('custom 配 name 后覆盖 key，ctx.name 是实际命中的名字', () => {
    const out = transform(readFixture('directives', 'custom-name-alias'), {
      attributes: {
        custom: { hi: { name: ['hi', 'hello'], transform: nameToDataHit } }
      }
    });

    expect(out).toBe(readExpected('directives', 'custom-name-alias'));
  });

  it('分支落单时文案用实际命中的名字，前置名并列展示', () => {
    const code = readFixture('directives', 'orphan-v-elif');

    expectCompileError(
      () => transform(code, {
        attributes: {
          if: {
            name: ['x-if', 'v-if'],
            elif: ['x-elif', 'v-elif'],
            else: ['x-else', 'v-else']
          }
        }
      }),
      "the 'v-elif' directive requires the previous JSX node to contain the 'x-if / v-if' directive.",
      locate(code, 'v-elif')
    );
  });
});

describe('运行时报错：文案与定位', () => {
  it('x-show 缺值：报缺值文案，指向该指令属性', () => {
    const code = readFixture('directives', 'x-show-required');

    expectCompileError(
      () => transform(code),
      "'x-show' requires a bound variable or expression.",
      locate(code, 'x-show')
    );
  });

  it('x-for 缺值：报缺值文案，指向该指令属性', () => {
    const code = readFixture('directives', 'x-for-required');

    expectCompileError(
      () => transform(code),
      "'x-for' requires a bound variable or expression.",
      locate(code, 'x-for')
    );
  });

  it('x-for 绑定值不是 in 表达式：报表达式形态错误', () => {
    const code = readFixture('directives', 'x-for-invalid-shape');

    expectCompileError(
      () => transform(code),
      "'x-for' requires a binding expression of the form '(item, index) in list'.",
      locate(code, 'x-for')
    );
  });

  it('x-for 左侧不是标识符 / 序列：报表达式形态错误', () => {
    const code = readFixture('directives', 'x-for-invalid-left');

    expectCompileError(
      () => transform(code),
      "'x-for' requires a binding expression of the form '(item, index) in list'.",
      locate(code, 'x-for')
    );
  });

  it('for 标签缺 value 属性：报标签缺值，指向 <for> 标签', () => {
    const code = readFixture('directives', 'tag-for-required');

    expectCompileError(
      () => transform(code),
      '<for> requires a value attribute bound to a variable or expression.',
      locate(code, '<for')
    );
  });

  it('elif 标签缺 value：报标签缺值，指向 <elif> 标签而不是主 if', () => {
    const code = readFixture('directives', 'tag-elif-required');

    expectCompileError(
      () => transform(code),
      '<elif> requires a value attribute bound to a variable or expression.',
      locate(code, '<elif')
    );
  });

  it('x-elif 属性落单：报需要前置 x-if，指向 x-elif 属性', () => {
    const code = readFixture('directives', 'orphan-x-elif');

    expectCompileError(
      () => transform(code),
      "the 'x-elif' directive requires the previous JSX node to contain the 'x-if' directive.",
      locate(code, 'x-elif')
    );
  });

  it('x-else 属性落单：报需要前置 x-if 或 x-elif，指向 x-else 属性', () => {
    const code = readFixture('directives', 'orphan-x-else');

    expectCompileError(
      () => transform(code),
      "the 'x-else' directive requires the previous JSX node to contain the 'x-if' or 'x-elif' directive.",
      locate(code, 'x-else')
    );
  });

  it('elif 标签落单：报需要前置 <if>，指向 <elif> 标签', () => {
    const code = readFixture('directives', 'orphan-elif-tag');

    expectCompileError(
      () => transform(code),
      '<elif> requires the previous JSX node to be an <if> element.',
      locate(code, '<elif')
    );
  });

  it('else 标签落单：报需要前置 <if> 或 <elif>，指向 <else> 标签', () => {
    const code = readFixture('directives', 'orphan-else-tag');

    expectCompileError(
      () => transform(code),
      '<else> requires the previous JSX node to be an <if> or <elif> element.',
      locate(code, '<else')
    );
  });

  it('x-else 不要求取值：与前置 x-if 正常折叠', () => {
    const out = transform(readFixture('directives', 'x-else-folds'));

    expect(out).toBe(readExpected('directives', 'x-else-folds'));
  });

  it('同元素写 x-if 与 x-elif：分支冲突，指向 x-elif 属性', () => {
    const code = readFixture('directives', 'same-element-if-elif');

    expectCompileError(
      () => transform(code),
      "the 'x-elif' directive requires the previous JSX node to contain the 'x-if' directive.",
      locate(code, 'x-elif')
    );
  });

  it('x-class 遇到非表达式 className（JSX 元素）：报无法合并，指向已有的 className', () => {
    const code = readFixture('directives', 'class-merge-invalid');

    expectCompileError(
      () => transform(code),
      "the 'x-class' directive merges into the className attribute at runtime, but className is not a valid bound expression.",
      locate(code, 'className')
    );
  });

  it('x-show 遇到静态 style：报无法合并，指向已有的 style', () => {
    const code = readFixture('directives', 'show-merge-invalid');

    expectCompileError(
      () => transform(code),
      "the 'x-show' directive merges into the style attribute at runtime, but style is not a valid bound expression.",
      locate(code, 'style')
    );
  });

  it('x-html 遇到已有 dangerouslySetInnerHTML：报重复写入，指向已存在的属性', () => {
    const code = readFixture('directives', 'html-already-set');

    expectCompileError(
      () => transform(code),
      "the 'x-html' directive writes the dangerouslySetInnerHTML attribute, but it is already present on this element; remove the explicit dangerouslySetInnerHTML attribute.",
      locate(code, 'dangerouslySetInnerHTML')
    );
  });
});

/**
 * locale 端到端：插件选项配 zh-CN 时，运行时域报错全部走中文表。
 *
 * 这里刻意覆盖四种定位分支：指令属性自身、兄弟标签、已有宿主属性、孤儿分支。
 */
describe('locale zh-CN：报错文案', () => {
  it('指令缺值报中文', () => {
    const code = readFixture('directives', 'x-show-required');

    expectCompileError(
      () => transform(code, { locale: 'zh-CN' }),
      "'x-show' 指令需要绑定一个变量或表达式.",
      locate(code, 'x-show')
    );
  });

  it('孤儿 x-elif 报中文', () => {
    const code = readFixture('directives', 'orphan-x-elif');

    expectCompileError(
      () => transform(code, { locale: 'zh-CN' }),
      "'x-elif' 指令需要上一个JSX节点包含 'x-if' 指令.",
      locate(code, 'x-elif')
    );
  });

  it('孤儿 else 标签报中文（含 elif 分支名）', () => {
    const code = readFixture('directives', 'orphan-else-tag');

    expectCompileError(
      () => transform(code, { locale: 'zh-CN' }),
      "<else> 标签需要上一个JSX节点是 'if' 或 'elif' 标签.",
      locate(code, '<else')
    );
  });

  it('class 合并失败报中文', () => {
    const code = readFixture('directives', 'class-merge-invalid');

    expectCompileError(
      () => transform(code, { locale: 'zh-CN' }),
      "'x-class' 指令需要与 className 属性的绑定表达式合并, 但 className 不是有效的绑定表达式.",
      locate(code, 'className')
    );
  });

  it('html 重复写入报中文', () => {
    const code = readFixture('directives', 'html-already-set');

    expectCompileError(
      () => transform(code, { locale: 'zh-CN' }),
      "'x-html' 指令需要写入 dangerouslySetInnerHTML 属性, 但该属性已显式写在元素上; 请移除多余的 dangerouslySetInnerHTML.",
      locate(code, 'dangerouslySetInnerHTML')
    );
  });

  it('for 表达式形态错误报中文', () => {
    const code = readFixture('directives', 'x-for-invalid-shape');

    expectCompileError(
      () => transform(code, { locale: 'zh-CN' }),
      "'x-for' 指令需要写成 '(item, index) in list' 形式的绑定表达式.",
      locate(code, 'x-for')
    );
  });
});
