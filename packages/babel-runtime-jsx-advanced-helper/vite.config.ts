import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  test: {
    // 单元测试从 test 目录扫描; benchmark 由 test/*.bench.ts 提供, pnpm bench (vitest bench) 执行
    dir: 'test',
    include: ['**/*.test.ts']
  },
  plugins: [
    dts({
      entryRoot: 'src',
      include: 'src/**/*.ts'
    })
  ],
  build: {
    minify: false,
    lib: {
      entry: [
        'src/index.ts',
        'src/class-helper.ts',
        'src/for-helper.ts',
        'src/show-helper.ts'
      ],
      formats: ['es', 'cjs']
    }
  }
});
