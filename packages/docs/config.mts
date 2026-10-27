import { defineAdditionalConfig } from 'vitepress';
import type { SPDConfig } from 'spd-vitepress-components';

// 英文 locale (root): 源文件在 docs/en/, 经 index.mts 的 rewrites 映射到根路径。
// spd.nav 的 link 写根路径 (/babel/...), 不要带 /en 前缀, 否则重写后无法命中页面。
export default defineAdditionalConfig<SPDConfig>({
  lang: 'en-US',
  title: 'babel-plugin-jsx-advanced',
  titleTemplate: ':title · JSX directive engine',
  description: 'Vue-style directives for JSX: if / for / show / class / html, configurable order, fully customizable',
  themeConfig: {
    // 顶栏标题关闭: logo 文案由站点 Layout 的 nav-bar-title-before 插槽渲染
    siteTitle: false,
    nav: [
      {
        text: 'Plugins',
        items: [
          { text: 'babel-plugin-jsx-advanced', link: '/babel/' },
          { text: 'eslint-plugin-jsx-advanced', link: '/eslint/' }
        ]
      }
    ],
    spd: {
      nav: {
        'babel-plugin-jsx-advanced': [
          { text: 'Getting started', link: '/babel/getting-started' },
          { text: 'Configuration', link: '/babel/configuration' },
          { text: 'Directives', link: '/babel/directives' },
          { text: 'Errors', link: '/babel/errors' },
          // 独立工具页: 左侧导航整页跳转
          { text: 'Playground', link: '/babel/playground' }
        ],
        'eslint-plugin-jsx-advanced': [
          { text: 'Getting started', link: '/eslint/getting-started' },
          { text: 'Rules', link: '/eslint/rules' },
          { text: 'Settings', link: '/eslint/settings' }
        ]
      }
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/fengxinming' }]
  }
});
