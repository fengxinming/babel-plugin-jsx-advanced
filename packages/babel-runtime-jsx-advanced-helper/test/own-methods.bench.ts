import { test } from 'vitest';

/** 同 class-helper.bench.ts 的对象形态输入 */
const OBJECT = { btn: true, 'btn-primary': true, 'btn-lg': true, disabled: false, hidden: 0 };
const hasOwnProperty = Object.prototype.hasOwnProperty;

/** 方案 A1: for...in 枚举, 每 key 用 Object.hasOwn 过滤 */
function forInHasOwn(value: Record<string, unknown>): string {
  let out = '';
  for (const key in value) {
    if (Object.hasOwn(value, key) && value[key]) {
      out = out ? `${out} ${key}` : key;
    }
  }
  return out;
}

/** 方案 A2: for...in 枚举, 每 key 用 hasOwnProperty.call 过滤 */
function forInHopCall(value: Record<string, unknown>): string {
  let out = '';
  for (const key in value) {
    if (hasOwnProperty.call(value, key) && value[key]) {
      out = out ? `${out} ${key}` : key;
    }
  }
  return out;
}

/** 方案 A3: for...in 枚举, 每 key 直接调对象自带的 hasOwnProperty 方法 */
function forInOwnMethod(value: Record<string, unknown>): string {
  let out = '';
  for (const key in value) {
    if (value.hasOwnProperty(key) && value[key]) {
      out = out ? `${out} ${key}` : key;
    }
  }
  return out;
}

/** 方案 B: Object.keys 取自有 key, 索引循环只判真值 */
function keysLoop(value: Record<string, unknown>): string {
  let out = '';
  const keys = Object.keys(value);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    if (value[key]) {
      out = out ? `${out} ${key}` : key;
    }
  }
  return out;
}

/** 串接方式对比: 除拼接写法外逐字符一致, 隔离变量 */
function templateConcat(value: Record<string, unknown>): string {
  let out = '';
  const keys = Object.keys(value);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    if (value[key]) {
      out = out ? `${out} ${key}` : key;
    }
  }
  return out;
}

function plusConcat(value: Record<string, unknown>): string {
  let out = '';
  const keys = Object.keys(value);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    if (value[key]) {
      out && (out += ' ');
      out += key;
    }
  }
  return out;
}

test(
  '扫完一个对象: for-in + Object.hasOwn / for-in + hasOwnProperty.call / for-in + 对象自带方法 / Object.keys',
  async ({ bench }) => {
    await bench.compare(
      bench('for-in + Object.hasOwn', () => {
        forInHasOwn(OBJECT);
      }),
      bench('for-in + hasOwnProperty.call', () => {
        forInHopCall(OBJECT);
      }),
      bench('for-in + 对象自带 hasOwnProperty', () => {
        forInOwnMethod(OBJECT);
      }),
      bench('Object.keys + 索引循环', () => {
        keysLoop(OBJECT);
      })
    );
  });

test('串接方式: 模板字符串 / 加号拼接', async ({ bench }) => {
  await bench.compare(
    bench('模板字符串', () => {
      templateConcat(OBJECT);
    }),
    bench('加号拼接', () => {
      plusConcat(OBJECT);
    })
  );
});
