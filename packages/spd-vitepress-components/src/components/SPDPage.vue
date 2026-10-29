<script setup lang="ts">
// 单页内容页 (整页接管 VP 的内容区): 首屏 Hero + md 区块聚合 + 右下 CTA。
// 顶栏/搜索由站点侧的 VPLayout 渲染 (默认主题), 本组件只负责内容区与左导航。
// 板块清单来自 themeConfig.spd.nav (自建命名空间, VP 默认主题不消费);
// 顺序与"哪些页参与聚合"完全由该 nav 决定, 不额外引入配置。
import { computed } from 'vue';
import { useData } from 'vitepress';
import { scrollToHashNow, useHashRoute } from '../composables/useHashRoute';
import SPDHome from './SPDHome.vue';
import SPDSections from './SPDSections.vue';

// hash 路由宿主 (只装一次): 刷新/直链带 hash 的初始定位 + 平滑滚动
useHashRoute();

const { frontmatter, page } = useData();

// CTA 数据来自 frontmatter.cta (约定 true 或 { title })
const cta = computed(() => frontmatter.value.cta ?? {});

// 回顶: 直接滚动到页面顶部, 不写 hash, 避免污染地址栏与历史记录
function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 区块渲染完成后按当前 hash 定位 (刷新/直链/切换语言都会重新 resolve)
function onSectionsReady() {
  scrollToHashNow(location.hash);
}
</script>

<template>
  <div class="SPDPage" :class="{ 'no-hero': !frontmatter.hero && !frontmatter.features }">
    <!-- 整屏 Hero (数据来自 index.md frontmatter.hero) -->
    <SPDHome />

    <!-- md 内容区块: config.mts nav 顺序, 每个 md 一个 section。
         SPDSections 内部 await md 编译产物 (异步组件), 客户端必须有 Suspense 边界才渲染
         —— VP 默认主题全链路没有任何 Suspense (其页面组件都是同步 setup), 所以边界加在这里。
         SSR 侧 Suspense 是透明的 (server-renderer 的 ssrRenderSuspense 只渲染 default slot),
         首屏 HTML 仍是完整的全部区块。边界只包内容区, 不影响顶栏/搜索等 VP 自身组件。 -->
    <Suspense v-if="frontmatter.nav" :key="page.relativePath" @resolve="onSectionsReady">
      <SPDSections />
    </Suspense>

    <!-- CTA (数据来自 index.md frontmatter.cta.title):
         右下角浮动圆形回顶按钮, 落在 --spd-aside-bottom 预留带内, 不与右大纲最大高度重叠 -->
    <button v-if="cta" type="button" class="cta-fab" :title="cta.title" :aria-label="cta.title" @click="backToTop">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  </div>
</template>

<style lang="stylus" scoped>
/* 左侧固定导航留出的内容区左内边距; VP 顶栏的 padding-top 由 .VPContent 自己负责 */
.SPDPage
  background var(--spd-c-bg-soft)
  color var(--spd-c-text-2)
  font-family var(--spd-font-family-base)

@media (max-width: 960px)
  .SPDPage
    padding-left 0

.no-hero
  :deep(.VPHome)
    margin-bottom 0

@media (min-width: 48rem)
  .no-hero
    :deep(.VPHome) 
      margin-bottom 0

/* ---------- CTA: 右下角浮动圆形回顶按钮 (视觉沿用原胶囊按钮的品牌底 + glow) ---------- */
.cta-fab
  position fixed
  right 32px
  bottom 32px
  z-index 100
  display flex
  align-items center
  justify-content center
  width 48px
  height 48px
  border-radius 50%
  border none
  padding 0
  cursor pointer
  background var(--spd-c-brand-1)
  color var(--spd-on-brand)
  box-shadow 0 6px 26px var(--spd-shadow-glow)
  transition background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease

  &:hover
    background var(--spd-c-brand-2)
    transform translateY(-2px)
    box-shadow 0 10px 32px var(--spd-shadow-glow-strong)

  svg
    width 20px
    height 20px
</style>
