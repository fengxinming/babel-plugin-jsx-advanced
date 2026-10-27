import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import external from 'vite-plugin-external';
import pkg from './package.json' with { type: 'json' };

/**
 * eslint-plugin-jsx-advanced 的库构建。
 *
 * 产物: dist/index.cjs (CJS, eslint 直接 require) + dist/index.js (ESM) + 各入口对应 .d.ts。
 * 运行依赖 eslint / eslint-scope / jsx-ast-utils 全部外部化。
 */
export default defineConfig({
  plugins: [
    external({
      externalizeDeps: [
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.devDependencies),
        ...Object.keys(pkg.peerDependencies)
      ]
    }),
    dts({ tsconfigPath: './tsconfig.app.json', entryRoot: 'src' })
  ],
  build: {
    minify: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: '[name]'
    }
  },
  test: {
    // RuleTester 依赖全局 describe/it
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts']
  }
});
