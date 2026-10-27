import { defineConfig } from 'tsdown';
import { vueSfcPlugin } from 'vue-sfc-transformer/rolldown';

/**
 * spd-vitepress-components 库构建 (tsdown, vitepress 同款工具链)。
 *
 * - unbundle: 每模块独立产物、目录结构保留, composables/utils 由模块图传递拉出,
 *   raw .vue 的相对导入直接可解析;
 * - .vue 交给 vueSfcPlugin (vitepress 同款) 处理: script 剥 TS 产出半编译 SFC
 *   + X.d.vue.ts 声明 (allowArbitraryExtensions 命名), .vue 导入一律 external;
 * - stylus 为 tsdown 内建预处理器 (stylus devDep), CSS 管线由 @tsdown/css 提供,
 *   index.ts 引入的 style/index.styl 编译抽取为独立 .css 产物。
 */
export default defineConfig({
  entry: [
    'src/**/*.ts',
    '!src/*.d.ts'
  ],
  outDir: 'dist',
  format: ['esm'],
  platform: 'neutral',
  unbundle: true,
  fixedExtension: false,
  minify: false,
  tsconfig: './tsconfig.app.json',
  dts: { vue: true },
  deps: {
    // 自身源码外一切依赖均不打包, 与消费端 (vitepress 站点) 各自解析
    neverBundle: [
      /^vitepress(?:\/|$)/,
      /^vue(?:\/|$)/,
      /^minisearch(?:\/|$)/,
      /^@localSearchIndex$/
    ]
  },
  plugins: [
    vueSfcPlugin({
      // srcDir 必须是 src 而非 src/components: 插件会把解析到 srcDir 之外的导入
      // 外部化, 收窄到 components 会把 index.ts 的 style/index.styl 变成悬空外链
      cwd: import.meta.dirname,
      srcDir: 'src',
      tsconfig: './tsconfig.app.json'
    })
  ]
});
