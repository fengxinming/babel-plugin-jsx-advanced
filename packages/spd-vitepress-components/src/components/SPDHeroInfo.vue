<script setup lang="ts">
// Hero 文案区: 结构与 VPHero 默认内容一致 (渐变 name + 正文 text + 副标题 tagline)。
// 作为插槽内容不会命中 VPHero 的 scoped 样式, 因此字号/行高/渐变在此按 VPHero 原值复刻。
defineProps<{ name?: string; text?: string; tagline?: string }>();
</script>

<template>
  <h1 v-if="name || text" class="heading">
    <span v-if="name" class="name clip" v-html="name" />
    <span v-if="text" class="text" v-html="text" />
  </h1>
  <p v-if="tagline" class="tagline" v-html="tagline" />
</template>

<style lang="stylus" scoped>
.heading
  display flex
  flex-direction column

.name,
.text
  width fit-content
  max-width 24.5rem
  letter-spacing -0.025rem
  line-height 1.25
  font-size 2rem
  font-weight 700
  white-space pre-wrap

.name
  color var(--vp-home-hero-name-color)

.clip
  background var(--vp-home-hero-name-background)
  -webkit-background-clip text
  background-clip text
  -webkit-text-fill-color var(--vp-home-hero-name-color)

@media (min-width: 40rem)
  .name,
  .text
    max-width 36rem
    line-height 1.1666667
    font-size 3rem

@media (min-width: 60rem)
  .name,
  .text
    line-height 1.1428571
    font-size 3.5rem

.tagline
  padding-top 0.5rem
  max-width 24.5rem
  line-height 1.5555556
  font-size 1.125rem
  font-weight 500
  white-space pre-wrap
  color var(--vp-c-text-2)

@media (min-width: 40rem)
  .tagline
    padding-top 0.75rem
    max-width 36rem
    line-height 1.6
    font-size 1.25rem

@media (min-width: 60rem)
  .tagline
    line-height 1.5
    font-size 1.5rem
</style>
