import { defineConfig } from 'vitepress';
import type { SPDConfig } from 'spd-vitepress-components';
import  config from 'spd-vitepress-components/config';

// search 是站点级开关, 必须放顶层: localSearchPlugin 的激活判定 (__VP_LOCAL_SEARCH__) 与索引构建参数
// 都只读顶层 themeConfig (node 端 resolveSiteData 不合并 locales.root), 放 locales 下搜索会静默失效。
// tokenize: 英文按词、CJK 按单字切分 — minisearch 默认按空白/标点切, 中文长句会整句成一个 token, 前缀搜索基本失效;
// 函数配置经 VP serializeFunctions 序列化, dev/build 两端都活着到客户端, 与 GlobalSearch 的查询端参数同源。
export default defineConfig<SPDConfig>({
  extends: config,
  base: process.env.BASE_URL || '/',
  rewrites: {
    'en/:rest*': ':rest*'
  },
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  locales: {
    root: { label: 'English', dir: 'ltr' },
    zh: { label: '简体中文', dir: 'ltr' },
  },
})
