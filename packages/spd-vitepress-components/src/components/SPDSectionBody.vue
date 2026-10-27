<script setup lang="ts">
/**
 * 单个聚合区块的正文渲染: 在自己的作用域内 provide 本区块的页面数据 (frontmatter 等),
 * 再渲染 md 的编译产物。
 *
 * 为什么独立成组件而不在 SPDSections 的 v-for 里直接写:
 * `provide()` 只能在 setup 同步执行期调用, 而 v-for 内的多项共享同一个 setup。
 * 要让每个区块各自成为独立作用域 (各自一份 frontmatter), 必须把这层壳抽成组件 ——
 * 每个组件实例各自执行一次 setup, provide 天然隔离。
 *
 * 为什么用 provide/inject 而不是 prop:
 * 区块组件是 md 的编译产物 (`_sfc_main = { name: '...' }`), 它**没有 props 声明**,
 * 传进去的值会成为 fallthrough attr 落到它渲染的根 div 上; 且其模板里的 `<Playground />`
 * 被编译成零参调用 (`_createVNode(_component_Playground)`), 值也递不到内层。
 * 而 md 内嵌组件自身调 VP 的 useData() 拿到的是宿主页 (index.md) 的 frontmatter ——
 * VP 的 useData 绑死当前路由, 聚合流里被聚合的页从来不是当前路由。
 * 所以 inject 是唯一能把正确数据送达的通道, 由 useSectionData 统一消费。
 */
import { provideSectionData } from '../composables/useSectionData';
import type { RenderedSection } from '../_types';

const props = defineProps<{ section: RenderedSection }>();

// 只下发页面数据 (url / relativePath / frontmatter), 不把 component 一起 provide 出去
provideSectionData({
  url: props.section.url,
  relativePath: props.section.relativePath,
  frontmatter: props.section.frontmatter
});
</script>

<template>
  <component :is="props.section.component" />
</template>
