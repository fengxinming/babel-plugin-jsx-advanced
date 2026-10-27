import { defineAdditionalConfig } from 'vitepress';
import type { SPDConfig } from 'spd-vitepress-components';

// 单页站: themeConfig.spd.nav 即页面区块清单与顺序 (自建命名空间, VP 默认主题不消费,
// 所以顶栏不会出现第二份菜单; 左侧竖排导航由 SPDPage 渲染)。
export default defineAdditionalConfig<SPDConfig>({
  lang: 'zh-CN',
  title: 'babel-plugin-jsx-advanced',
  titleTemplate: ':title · JSX 指令引擎',
  description: '为 JSX 提供类 Vue 指令能力的 Babel 插件: if / for / show / class / html, 顺序可配, 完全可定制',
  themeConfig: {
    // 顶栏标题关闭: logo (jsx- + accent 双色) 由 Layout 的 nav-bar-title-before
    // 插槽渲染, siteTitle: false 时 VPNavBarTitle 不再输出默认站点标题文本
    siteTitle: false,
    nav: [
      {
        text: '插件',
        items: [
          { text: 'babel-plugin-jsx-advanced', link: '/zh/babel/' },
          { text: 'eslint-plugin-jsx-advanced', link: '/zh/eslint/' }
        ]
      }
    ],
    spd: {
      nav: {
        'babel-plugin-jsx-advanced': [
          { text: '快速开始', link: '/zh/babel/getting-started' },
          { text: '配置', link: '/zh/babel/configuration' },
          { text: '指令', link: '/zh/babel/directives' },
          { text: '错误码', link: '/zh/babel/errors' },
          // 独立工具页: frontmatter.spd.section = false, 不聚合进首页, 左导航整页跳转
          { text: '在线调试', link: '/zh/babel/playground' }
        ],
        'eslint-plugin-jsx-advanced': [
          { text: '快速开始', link: '/zh/eslint/getting-started' },
          { text: '规则', link: '/zh/eslint/rules' },
          { text: '配置', link: '/zh/eslint/settings' }
        ]
      }
    },
    // search 是站点级开关, 顶层与 spd 下各挂一份 (原因见 index.mts 注释), 这里不放;
    // socialLinks / appearance 等原生字段直接摆顶层, 由默认主题消费。
    socialLinks: [{ icon: 'github', link: 'https://github.com/fengxinming' }]
  }
});
