<script setup lang="ts">
// 站点侧 Layout: 继承默认主题, 只往顶栏插槽里注入站点自定义内容。
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';

const { Layout } = DefaultTheme;

// 顶栏 logo 文案沿用 index.md frontmatter.logo (prefix + accent 双色),
// 经 VPNavBarTitle 的原生插槽渲染; 默认站点标题由 siteTitle: false 关掉。
const { frontmatter } = useData();
</script>

<template>
  <Layout>
    <template #nav-bar-title-before>
      <span class="spd-top-logo">
        {{ frontmatter.logo?.prefix }}<span class="accent">
          {{ frontmatter.logo?.accent }}
        </span>
      </span>
    </template>
  </Layout>
</template>

<style scoped>
.spd-top-logo {
  font-size: 19px;
  font-weight: 800;
  color: var(--spd-c-text-1);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.spd-top-logo .accent {
  color: var(--spd-c-brand-1);
}
</style>
