<script setup lang="ts">
// 首屏: 复用 VPHome 原生 hero 排版 (标题/副标题/按钮/图片), 只通过具名插槽补充
// eyebrow、代码窗和附加带 —— 不再自己复刻一套 hero 布局。
import { computed, provide } from 'vue';
import { useData } from 'vitepress';
import VPHome from 'vitepress/dist/client/theme-default/components/VPHome.vue';
import { layoutInfoInjectionKey } from 'vitepress/dist/client/theme-default/composables/layout.js';
import SPDCode from './SPDCode.vue';
import SPDExtra from './SPDExtra.vue';
import SPDHeroInfo from './SPDHeroInfo.vue';

const { frontmatter } = useData();

// 首屏排布: 默认 split; centered / stacked 不在右栏放媒体
const layout = computed(() => frontmatter.value.hero?.layout || 'split');
// 代码窗只有 split 时才覆盖右栏插槽, 否则落到 hero 下方通栏
const codeInline = computed(() => layout.value === 'split' && !!frontmatter.value.hero?.code);

const heroImageSlotExists = computed(() => true);
provide(layoutInfoInjectionKey, { heroImageSlotExists });
</script>

<template>
  <div class="SPDHome" :class="[`layout-${layout}`, { 'has-code': codeInline }]">
    <VPHome>
      <template #home-hero-before>
        <slot name="home-hero-before" />
      </template>
      <template #home-hero-info-before>
        <p v-if="frontmatter.hero?.eyebrow" class="eyebrow">{{ frontmatter.hero.eyebrow }}</p>
        <slot name="home-hero-info-before" />
      </template>
      <template #home-hero-info>
        <slot name="home-hero-info">
          <SPDHeroInfo :name="frontmatter.hero?.name" :text="frontmatter.hero?.text"
            :tagline="frontmatter.hero?.tagline" />
        </slot>
      </template>
      <template #home-hero-info-after>
        <slot name="home-hero-info-after" />
      </template>
      <template #home-hero-actions-after>
        <slot name="home-hero-actions-after">
          <SPDExtra v-if="frontmatter.hero?.extra?.length" :extras="frontmatter.hero.extra" />
        </slot>
      </template>
      <template #home-hero-actions-before-actions>
        <slot name="home-hero-actions-before-actions" />
      </template>
      <!-- 只有 split + 存在代码窗时才接管右栏; 配了 image 的页面保持 VPHero 内置默认渲染 -->
      <template v-if="codeInline" #home-hero-image>
        <slot name="home-hero-image">
          <SPDCode :title="frontmatter.hero.code.title" :tabs="frontmatter.hero.code.tabs" />
        </slot>
      </template>
      <template #home-hero-after>
        <slot name="home-hero-after" />
      </template>
      <template #home-features-before>
        <slot name="home-features-before" />
        <!-- centered / stacked: 代码窗通栏落在 hero 下方、能力卡之前 -->
        <div v-if="!codeInline && frontmatter.hero?.code" class="hero-code">
          <SPDCode :title="frontmatter.hero.code.title" :tabs="frontmatter.hero.code.tabs" />
        </div>
      </template>
      <template #home-features-after>
        <slot name="home-features-after" />
      </template>
    </VPHome>
  </div>
</template>

<style lang="stylus" scoped>
/* eyebrow 落在 hero 文案区上方, 与标题共用对齐方式 (移动端 has-image 时居中) */
.eyebrow
  margin 0 0 0.5rem
  color var(--spd-c-brand-1)
  font-size 0.75rem
  font-weight 600
  letter-spacing 0.14em
  text-transform uppercase

/* 有右侧媒体时与 VPHero 的对齐规则保持一致: 移动端居中, 桌面端左对齐 */
.SPDHome
  :deep(.VPHero.has-image .name),
  :deep(.VPHero.has-image .text),
  :deep(.VPHero.has-image .tagline)
    margin 0 auto

@media (min-width: 60rem)
  .SPDHome
    :deep(.VPHero.has-image .name),
    :deep(.VPHero.has-image .text),
    :deep(.VPHero.has-image .tagline)
      margin 0

/* ---------- 代码窗替代 hero 右栏图片 ----------
   VPHero 的右栏按 20rem 圆形图片位设计 (含光斑背景与负边距), 放代码面板时改成常规容器。 */
// .SPDHome.has-code
//   :deep(.VPHero .image)
//     flex-grow 0
//     width 100%
//     min-height 0
//     margin 0  

//   :deep(.VPHero .image-container)
//     display block
//     width 100%
//     height auto
//     transform none

  :deep(.VPHero .image-bg)
    pointer-events none
    // display none

@media (min-width: 60rem)
  .SPDHome.has-code
    :deep(.VPHero .image)
      // width 50%
      padding-left 2rem

/* ---------- centered: 文案 / 按钮整体居中 (覆盖上面 has-image 的桌面左对齐) ---------- */
.SPDHome.layout-centered
  :deep(.VPHero .main)
    text-align center

  :deep(.VPHero .name),
  :deep(.VPHero .text),
  :deep(.VPHero .tagline)
    margin-left auto
    margin-right auto

  :deep(.VPHero .actions)
    justify-content center

/* ---------- 通栏代码窗 (centered / stacked): 与文档内容同宽 ---------- */
.hero-code
  max-width var(--spd-doc-max-width)
  margin 0 auto
  padding 0 24px

@media (min-width: 48rem)
  .hero-code
    padding 0 48px
</style>
