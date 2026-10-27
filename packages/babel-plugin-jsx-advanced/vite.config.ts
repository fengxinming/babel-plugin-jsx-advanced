import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import external from 'vite-plugin-external';
import pkg from './package.json' with { type: 'json' };

/**
 * babel-plugin-jsx-advanced 的库构建。
 *
 * 产物: dist/index.js (ESM) + dist/index.cjs (CJS, babel 7 直接 require) + 各入口对应 .d.ts。
 * workspace 依赖运行时 helper 外部化, 由其独立发布; src 内部模块随本包一起打包。
 */
export default defineConfig({
  test: {
    // 首个用例要付 babel 惰性加载 + JIT 冷启动 (空闲实测 ~1.8s), 并发 worker 抢 CPU
    // 时会冲过默认 5s, 产生与逻辑无关的偶发超时
    testTimeout: 15000,
    dir: 'test',
    include: ['**/*.test.ts']
  },
  plugins: [
    dts({
      entryRoot: 'src',
      include: 'src/**/*.ts'
    }),
    external({
      externalizeDeps: [
        ...Object.keys(pkg.peerDependencies),
        ...Object.keys(pkg.devDependencies)
      ]
    })
  ],
  build: {
    minify: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: '[name]'
    }
  }
});
