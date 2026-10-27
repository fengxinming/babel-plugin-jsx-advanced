<script setup lang="ts">
// 首屏代码窗: 单标签页时标签名当标题, 多标签页时可切换。
import { computed, ref, watch } from 'vue';
import type { SPDCodeTab } from '../_types';

// 数组默认值交给 withDefaults, 保证未传 tabs 时引用稳定, 不在 computed 里用 ?? [] 造新数组
const props = withDefaults(defineProps<{ title?: string; tabs?: SPDCodeTab[] }>(), {
  tabs: () => [],
});

const tabs = computed(() => props.tabs);
const activeTab = ref(0);
const currentTab = computed<SPDCodeTab | null>(() => tabs.value[activeTab.value] ?? null);

// 换页或数据变化后重置到第一页, 避免下标越界
watch(
  () => props.tabs,
  () => {
    activeTab.value = 0;
  }
);
</script>

<template>
  <div class="SPDCode">
    <div class="code-bar">
      <div v-if="tabs.length > 1" class="code-tabs">
        <button v-for="(tab, index) in tabs" :key="tab.name" type="button" class="code-tab"
          :class="{ active: index === activeTab }" @click="activeTab = index">
          {{ tab.name }}
        </button>
      </div>
      <span v-else class="code-title">{{ tabs[0]?.name ?? '' }}</span>
      <span v-if="title" class="code-file">{{ title }}</span>
    </div>
    <pre v-if="currentTab" class="code-body"><code>{{ currentTab.code }}</code></pre>
  </div>
</template>

<style lang="stylus" scoped>
.SPDCode
  width 100%
  border 1px solid var(--spd-c-border)
  border-radius var(--spd-radius-md)
  background var(--spd-c-bg-elv)
  overflow hidden

.code-bar
  display flex
  align-items center
  gap 0.75rem
  padding 0.5rem 0.75rem
  border-bottom 1px solid var(--spd-c-border)
  background var(--spd-c-bg-alt)

.code-tabs
  display flex
  flex 1
  gap 0.25rem

.code-tab
  padding 0.25rem 0.625rem
  border none
  border-radius var(--spd-radius-sm)
  background transparent
  color var(--spd-c-text-5)
  font-family var(--spd-font-family-mono)
  font-size 0.75rem
  line-height 1.6
  cursor pointer
  transition color 0.15s ease, background-color 0.15s ease

  &:hover
    color var(--spd-c-text-2)

  &.active
    background var(--spd-chip-bg-active)
    color var(--spd-c-text-1)

.code-title
  flex 1
  color var(--spd-c-text-2)
  font-family var(--spd-font-family-mono)
  font-size 0.75rem

.code-file
  margin-left auto
  color var(--spd-c-text-6)
  font-family var(--spd-font-family-mono)
  font-size 0.75rem

.code-body
  margin 0
  padding 1rem
  overflow-x auto
  color var(--spd-c-text-1)
  font-family var(--spd-font-family-mono)
  font-size 0.8125rem
  line-height 1.7
  text-align left

  code
    padding 0
    background none
    font-size inherit
</style>
