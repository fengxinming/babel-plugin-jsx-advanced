import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from '@babel/core';
import presetReact from '@babel/preset-react';
import { expect } from 'vitest';
import plugin from '../dist/index.js';
import type { PluginOptions } from '../src/types';

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

/**
 * 读取输入夹具：JSX 写在真实的 .jsx 文件里，编辑器格式化插件能正常接管缩进，
 * 不用再像字符串数组那样人工对齐。
 */
export function readFixture(suite: string, name: string): string {
  return readFileSync(path.join(FIXTURES_DIR, suite, `${name}.jsx`), 'utf8');
}

/**
 * 读取期望产物：babel 生成的代码原样落盘，末尾换行只是文件习惯，比对前去掉。
 */
export function readExpected(suite: string, name: string): string {
  return readFileSync(path.join(FIXTURES_DIR, suite, `${name}.expected.txt`), 'utf8').trimEnd();
}

/**
 * 以固定 classic runtime 编译一段 JSX，返回完整产物源码。
 *
 * 固定 runtime 是刻意的：preset-react 默认走 automatic runtime，并按 NODE_ENV
 * 在 `jsx` / `jsxDEV` 之间切换，产物会随运行环境漂移，无法逐字比对。
 * classic 产物稳定为 `React.createElement`，期望值可以精确到每个字符。
 *
 * 直接消费 dist 发布产物，保证测的就是用户拿到的包。
 */
export function transform(code: string, options: PluginOptions = {}): string {
  const result = transformSync(code, {
    filename: 'demo.jsx',
    presets: [[presetReact, { runtime: 'classic' }]],
    plugins: [[plugin, options]],
    babelrc: false,
    configFile: false
  });
  // 正常编译必有产物：拿不到就明确失败，别把空值当成空字符串去比对
  if (result?.code == null) {
    throw new Error('babel transformSync 没有产出代码');
  }
  return result.code;
}

/** 报错期望位置：行号 1 起、列号 0 起，与 babel code frame 口径一致 */
export interface ErrorLocation {
  line: number;
  column: number;
}

/** 去掉 ANSI 颜色转义：babel 的 code frame 可能带高亮，直接数下标会错位 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001B\[[0-9;]*m/g, '');
}

/**
 * 在待编译源码里定位一段唯一片段，用于声明报错应指向的位置。
 *
 * 由测试自己从源码算行列，避免手写列号时与缩进对不上。
 */
export function locate(code: string, needle: string): ErrorLocation {
  const lines = code.split('\n');
  const index = lines.findIndex((line) => line.includes(needle));
  if (index === -1) {
    throw new Error(`源码里找不到定位片段: ${needle}`);
  }
  return { line: index + 1, column: lines[index].indexOf(needle) };
}

/**
 * 断言编译抛错：首行文案逐字相等，并校验 code frame 的 ^ 指向指定行列。
 *
 * 只断言“抛了错”会把错位问题漏过去（例如 elif 的错报在主 if 元素上），
 * 所以定位与文案一起卡死。
 */
export function expectCompileError(
  run: () => unknown,
  message: string,
  location?: ErrorLocation
): void {
  let thrown: unknown;
  try {
    run();
  }
  catch (error) {
    thrown = error;
  }
  expect(thrown).toBeTruthy();

  const lines = stripAnsi(String((thrown as Error).message)).split('\n');
  // babel 可能给首行加 `demo.jsx: ` 前缀，只比对文案本体
  expect(lines[0].endsWith(message), `实际报错首行: ${lines[0]}`).toBe(true);

  if (location === undefined) {
    return;
  }

  const frame = lines
    .map((line) => /^\s*>?\s*(\d+) \| /.exec(line))
    .find((match) => match !== null && Number(match[1]) === location.line);
  expect(frame, `code frame 缺少第 ${location.line} 行`).toBeTruthy();

  const caretLine = lines.find((line) => /^\s*\|/.test(line) && line.includes('^'));
  expect(caretLine, 'code frame 缺少 ^ 定位行').toBeTruthy();
  // 列号 = ^ 相对源码行首的偏移：caret 行里 | 与源码行对齐，| 后空一格才是第 0 列
  const column = caretLine!.indexOf('^') - (caretLine!.indexOf('|') + 2);
  expect(column).toBe(location.column);
}
