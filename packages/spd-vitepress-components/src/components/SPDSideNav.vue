<script setup lang="ts">
// 左侧固定竖排导航: 板块列表来自 themeConfig.spd.nav, 搜索入口内嵌顶部 (SPDNavBarSearch)。
// 聚合区块是真实锚点 <a href="#..."> (可中键/可复制), 点击由 useHashRoute 的
// document 级委托接管为平滑滚动 + 地址栏 hash; 高亮由父组件经 props 下发。
// 自定义 layout 页 (如 Playground) 同样在清单里, 经 SPDSections 的动态组件分支渲染。
// 顶栏 logo 由 themeConfig.siteTitle (HTML) 承担; 社交链接走 VPLayout 顶栏, 这里不重复。
import { computed } from 'vue';
import { useData } from 'vitepress';
import { hashFor, normalized } from '../utils/nav';
import SPDNavBarSearch from './SPDNavBarSearch.vue';

const props = defineProps<{ active: string; sections?: string[] }>();

const { frontmatter } = useData();
const { theme } = useData();

// 响应式: theme 是 ref, 不能解构取值
const links = computed(() => theme.value.spd?.nav?.[frontmatter.value.nav] ?? []);

// 父组件下发的聚合区块 url 清单 (loader 产物带 .html 后缀, 统一归一化后比对)
const sectionSet = computed(() => new Set((props.sections ?? []).map(normalized)));

function hrefFor(link: string): string {
  return sectionSet.value.has(normalized(link)) ? hashFor(link) : link;
}
</script>

<template>
  <nav class="SPDSideNav">
    <SPDNavBarSearch class="search" />
    <a v-for="l in links" :key="l.link" :href="hrefFor(l.link)" :class="{ active: active === l.link }">
      {{ l.text }}
    </a>
  </nav>
</template>

<style lang="stylus" scoped>
/* 左侧固定竖排胶囊: top/最大高度统一走 --spd-aside-* 变量 (底部预留带留给 CTA 回顶按钮);
   窄屏隐藏 (VP顶栏汉堡菜单承担导航) */
.SPDSideNav
  position fixed
  top var(--spd-aside-top)
  left s('max(calc((100vw - var(--spd-doc-max-width)) / 2 - var(--spd-sidenav-width)), 0px)')
  width var(--spd-sidenav-width)
  max-height calc(100vh - var(--spd-aside-top))
  overflow-y auto
  z-index 100
  display flex
  flex-direction column
  gap 8px
  padding 32px
  background var(--vp-nav-bg-color)
  backdrop-filter var(--vp-nav-backdrop-filter)
  border 1px solid var(--spd-c-border)
  border-radius var(--spd-radius-pill)

  /* 搜索入口占满一行 (覆盖 SPDNavBarSearch 为顶栏准备的左内边距) */
  .search
    padding-left 0
    width 100%
    margin-bottom 16px

    :deep(button)
      width 100%

  /* 菜单项 = 横向胶囊 (对齐顶导航菜单样式), 文字居中 */
  a
    display flex
    width 100%
    align-items center
    justify-content center
    color var(--spd-c-text-6)
    font-size 16px
    font-weight 500
    white-space nowrap
    padding 8px 16px
    border-radius var(--spd-radius-pill)
    transition color 0.2s ease, background-color 0.2s ease

    &:hover
      color var(--spd-c-brand-1)
      background var(--spd-chip-bg)

    &.active
      color var(--spd-c-brand-1)
      font-weight 600
      background var(--spd-chip-bg-active)

@media (max-width: 960px)
  .SPDSideNav
    display none
</style>
