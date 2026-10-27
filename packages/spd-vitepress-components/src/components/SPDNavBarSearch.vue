<script setup lang="ts">
// 搜索入口容器 —— 移植 VP 的 VPNavBarSearch, 保留 local 分支:
// - 可复用的直接复用: 触发按钮深引 VP 原件 VPNavBarSearchButton (vitepress exports 通配放行);
// - 弹层懒加载 (defineAsyncComponent) 为 VP 同款, 避免首屏 payload 含整个搜索弹层;
// - algolia 分支剥离: 依赖 @docsearch/js 与 VP 内部 support/reactivity、support/docsearch,
//   本包不引入这些依赖且站点未配置 algolia;
// - __VP_LOCAL_SEARCH__ / __ALGOLIA__ 是 VP 构建期 define, 本包构建没有 → 换成运行时判定
//   spd.search.provider === 'local'; onKeyStroke (@vueuse) 以 window keydown 等价实现。
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useData } from 'vitepress';
import VPNavBarSearchButton from 'vitepress/dist/client/theme-default/components/VPNavBarSearchButton.vue';

const SPDLocalSearchBox = defineAsyncComponent(() => import('./SPDLocalSearchBox.vue'));

// Vue <script setup> 顶层等价于 setup() 函数体, useData 在此调用合法;
// react-hooks/rules-of-hooks 误判为 React Hook, 按规则禁用该行 (不改 .eslintrc)
// eslint-disable-next-line react-hooks/rules-of-hooks
const { theme } = useData();

// VP 的 provider 由编译期 define 决定; 本站固定 local, 由 spd.search.provider 运行时门控
const enabled = computed(() => theme.value.spd?.search?.provider === 'local');

// #region Local Search

const showSearch = ref(false);

/** VP 同款: 输入类控件聚焦时不拦截按键 (供 '/' 唤起守卫) */
function isEditingContent(event: KeyboardEvent): boolean {
  const element = event.target as HTMLElement;
  const tagName = element.tagName;

  return (
    element.isContentEditable
    || tagName === 'INPUT'
    || tagName === 'SELECT'
    || tagName === 'TEXTAREA'
  );
}

function onKey(event: KeyboardEvent): void {
  if (!enabled.value) {
    return;
  }
  // VP local 分支语义: Ctrl/Cmd+K 仅打开 (关闭走 Esc), k 精确匹配; '/' 非输入态唤起
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    showSearch.value = true;
  }
  else if (event.key === '/' && !isEditingContent(event)) {
    event.preventDefault();
    showSearch.value = true;
  }
}

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));

// #endregion

// 按钮文案: VP 从 search.options 的 translations 读, 这里同构改读 spd.search.options
const buttonText = computed(() => {
  if (theme.value.spd?.search?.provider === 'local') {
    return theme.value.spd.search.options?.translations?.button?.buttonText
      || '搜索';
  }
  return '搜索';
});
const buttonAriaLabel = computed(() => {
  if (theme.value.spd?.search?.provider === 'local') {
    return theme.value.spd.search.options?.translations?.button?.buttonAriaLabel
      || '搜索';
  }
  return '搜索';
});
</script>

<template>
  <div class="SPDNavBarSearch">
    <template v-if="enabled">
      <VPNavBarSearchButton
        :text="buttonText"
        :aria-label="buttonAriaLabel"
        :aria-keyshortcuts="'/ control+k meta+k'"
        @click="showSearch = true"
      />
      <SPDLocalSearchBox
        v-if="showSearch"
        @close="showSearch = false"
      />
    </template>
  </div>
</template>

<style lang="stylus" scoped>
/* 容器布局逐行对齐 VP 的 VPNavBarSearch */
.SPDNavBarSearch
  display flex
  align-items center

@media (min-width: 48rem)
  .SPDNavBarSearch
    gap 0.5rem
    padding-left 1.5rem

@media (min-width: 60rem)
  .SPDNavBarSearch
    padding-left 2rem
</style>
