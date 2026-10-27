<script setup lang="ts">
// 首屏附加带: 安装命令 / 标签行 / 指标 / 链接, 按 extra 顺序渲染。
import { computed } from 'vue';
import { withBase } from 'vitepress';
import type { SPDExtraItem } from '../_types';

// 数组默认值交给 withDefaults, 保证未传 extras 时引用稳定, 不在 computed 里用 ?? [] 造新数组
const props = withDefaults(defineProps<{ extras?: SPDExtraItem[] }>(), {
  extras: () => [],
});

const list = computed(() => props.extras);

// 站内链接补 base, 外链与 hash 原样输出
const resolveLink = (link: string) => (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('#') ? link : withBase(link));
</script>

<template>
  <template v-for="(extra, index) in list" :key="index">
    <div v-if="extra.type === 'install'" class="extra-install">
      <span v-if="extra.label" class="install-label">{{ extra.label }}</span>
      <code class="install-cmd">{{ extra.command }}</code>
    </div>
    <div v-else-if="extra.type === 'chips'" class="extra-chips">
      <span v-for="item in extra.items" :key="item" class="chip">{{ item }}</span>
    </div>
    <div v-else-if="extra.type === 'stats'" class="extra-stats">
      <div v-for="stat in extra.items" :key="stat.label" class="stat">
        <span class="stat-value">{{ stat.value }}</span>
        <span class="stat-label">{{ stat.label }}</span>
      </div>
    </div>
    <div v-else-if="extra.type === 'links'" class="extra-links">
      <a v-for="item in extra.items" :key="`${item.text}-${item.link}`" class="extra-link"
        :href="resolveLink(item.link)">
        {{ item.text }}<span class="arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </template>
</template>

<style lang="stylus" scoped>
.extra-install
  display inline-flex
  align-items center
  gap 0.625rem
  margin-top 1.25rem
  padding 0.5rem 0.75rem
  border 1px solid var(--spd-c-border)
  border-radius var(--spd-radius-sm)
  background var(--spd-c-bg-elv)

.install-label
  color var(--spd-c-text-6)
  font-family var(--spd-font-family-mono)
  font-size 0.75rem

.install-cmd
  color var(--spd-c-text-1)
  font-family var(--spd-font-family-mono)
  font-size 0.8125rem
  background none

.extra-chips
  display flex
  flex-wrap wrap
  gap 0.5rem
  margin-top 1rem

.chip
  padding 0.25rem 0.625rem
  border-radius var(--spd-radius-pill)
  background var(--spd-chip-bg)
  color var(--spd-c-text-3)
  font-size 0.75rem
  line-height 1.5

.extra-stats
  display flex
  flex-wrap wrap
  gap 2rem
  margin-top 1.5rem

.stat
  display flex
  flex-direction column

.stat-value
  color var(--spd-c-text-1)
  font-size 1.5rem
  font-weight 600
  line-height 1.2

.stat-label
  margin-top 0.125rem
  color var(--spd-c-text-5)
  font-size 0.8125rem

.extra-links
  display flex
  flex-wrap wrap
  gap 1.25rem
  margin-top 1rem

.extra-link
  display inline-flex
  align-items center
  gap 0.25rem
  color var(--spd-c-brand-1)
  font-size 0.875rem
  font-weight 500

  .arrow
    transition transform 0.15s ease

  &:hover .arrow
    transform translateX(2px)
</style>
