<script setup lang="ts">
// 右侧大纲 (纯展示, 职责对齐 VPDocAsideOutline): 条目与高亮由父组件下发。
// 条目是真实锚点 <a href="#id">, 点击由 useHashRoute 的 document 级委托接管为平滑滚动。
import type { SectionHeading } from '../_types';

defineProps<{ items: SectionHeading[]; active: string }>();
</script>

<template>
  <aside class="SPDOutline">
    <a v-for="h in items" :key="h.id" :href="`#${h.id}`"
      :class="['link', h.depth === 3 && 'sub', h.id === active && 'active']">
      {{ h.text }}
    </a>
  </aside>
</template>

<style lang="stylus" scoped>
/* 滚过 Hero 进入 md 区块后才由父组件挂载, 首屏不显示 */
.SPDOutline
  position fixed
  right s('max(calc((100vw - var(--spd-doc-max-width)) / 2 - var(--spd-sidenav-width)), 0px)')
  top var(--spd-aside-top)
  width var(--spd-outline-width)
  max-height calc(100vh - var(--spd-aside-top) - var(--spd-aside-bottom))
  overflow-y auto
  display flex
  flex-direction column
  gap 2px
  padding-left 14px
  border-left 1px solid var(--spd-c-border)

.link
  display block
  text-decoration none
  padding 4px 0
  font inherit
  font-size 13px
  line-height 1.5
  color var(--spd-c-text-6)
  transition color 0.2s ease

.link:hover
  color var(--spd-c-text-1)

.link.sub
  padding-left 14px
  font-size 12.5px

.link.active
  color var(--spd-c-brand-1)

/* 窄屏隐藏右侧大纲, 避免与正文重叠 */
@media (max-width: 1280px)
  .SPDOutline
    display none
</style>
