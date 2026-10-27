// 站点主题入口: 继承默认主题 (顶栏/ 搜索 / 移动端菜单 / dark 模式全部由它承担),
// 只做两件事:
// 1. 把搜索框 (SPDSearch) 插进顶栏的 nav-bar-content-before 插槽;
// 2. 全局注册 SPDPage —— index.md 写 `layout: SPDPage` 后, VP 的 VPContent 兜底分支
//    (<component :is="frontmatter.layout" />) 会把整个内容区交给它渲染,
//    因此不需要自定义 Layout, 顶栏也不会被替换。
import 'spd-vitepress-components/style.css';
import DefaultTheme from 'vitepress/theme';
import Layout from './components/Layout.vue';
import Playground from './components/Playground.vue';
import { SPDPage } from 'spd-vitepress-components';
import type { Theme } from 'vitepress';

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('SPDPage', SPDPage);
    // md 文档里直接写 <Playground /> (playground.md), 全局注册后无需在各页 import
    app.component('Playground', Playground);
  }
} satisfies Theme;