import { test } from 'vitest';
import classnames from 'classnames';
import classHelper from '../src/class-helper';

/** 字符串形态: 逐个字符串参数, 最常见用法 */
const STRINGS = ['btn', 'btn-primary', 'is-active'];
/** 对象形态: 按条件启用, 含 falsy 值 */
const OBJECT = { btn: true, 'btn-primary': true, 'btn-lg': true, disabled: false, hidden: 0 };
/** 嵌套混合形态: 数组套数组套对象, 附带 falsy 项 */
const NESTED = ['btn', ['btn-primary', { active: true }], false, ['is-inline', ['ellipsis']], null];

test('字符串形态: classHelper / classnames', async ({ bench }) => {
  await bench.compare(
    bench('classHelper', () => {
      classHelper(...STRINGS);
    }),
    bench('classnames', () => {
      classnames(...STRINGS);
    })
  );
});

test('对象形态: classHelper / classnames', async ({ bench }) => {
  await bench.compare(
    bench('classHelper', () => {
      classHelper(OBJECT);
    }),
    bench('classnames', () => {
      classnames(OBJECT);
    })
  );
});

test('嵌套混合形态: classHelper / classnames', async ({ bench }) => {
  await bench.compare(
    bench('classHelper', () => {
      classHelper(...NESTED);
    }),
    bench('classnames', () => {
      classnames(...NESTED);
    })
  );
});
