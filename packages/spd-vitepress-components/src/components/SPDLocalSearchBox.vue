<script setup lang="ts">
// 全量移植 VP 的 VPLocalSearchBox (结构/模板/样式/键盘交互逐行对齐, 仅根类名加 SPD 前缀,
// 供 SPDNavBarSearch 的 defineAsyncComponent 引用),
// 数据层换成本站实现 —— VP 原件硬绑 @localSearchIndex (构建期索引) 与 VP router (多页跳转),
// 无法直接复用, 不可复用之处逐条注明:
// - 索引: spd.search 下 VP localSearchPlugin 不激活 (@localSearchIndex 为空), 语料由 useSearchCorpus
//   从渲染后的区块 DOM 切段 (单页站的语料就是页面本身), 挂载后同步建 MiniSearch (毫秒级);
//   建索引与查询同端同参 → 无加载态 (VP 为异步 loadJSON);
// - 导航: 单页聚合站走 hash 路由 —— 结果 <a href="#锚点"> 交给 useHashRoute 的 document 级
//   委托平滑滚动, 键盘 Enter 走 navigateTo; 不用 router.go 多页跳转;
// - 摘要: 直接用切段 HTML (VP 为动态 import 页面组件渲染), 包 .vp-doc 复用 VP 的文档排版;
// - 不引 mark.js / focus-trap (@vueuse/integrations) 依赖: 高亮用等价的 markRegExp 注入
//   (仅文本节点, 不碰标签), 焦点管理为挂载聚焦输入框。
import MiniSearch from 'minisearch';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import { useData } from 'vitepress';
import { useSearchCorpus } from '../composables/useSearchCorpus';
import { navigateTo } from '../composables/useHashRoute';
import { hashFor } from '../utils/nav';
import type { HitIdParts, ResultItem, SearchHit } from '../_types';

const emit = defineEmits<{ close: [] }>();

const searchInput = ref<HTMLInputElement | null>(null);
const ms = ref<MiniSearch<SearchHit> | null>(null);

// Vue <script setup> 顶层等价于 setup() 函数体, useData 在此调用合法;
// react-hooks/rules-of-hooks 误判为 React Hook, 按规则禁用该行 (不改 .eslintrc)
// eslint-disable-next-line react-hooks/rules-of-hooks
const { theme, localeIndex } = useData();

// ── 索引参数 (建索引与查询共用同一份 computed) ──────────────────────────
// minisearch 构造/查询参数: 硬编码默认 (fields/storeFields + fuzzy/prefix/boost, 与 VP 一致)
// 叠加 spd.search.options 里的用户配置; 建索引与查询共用同一份 computed, 参数必然一致。
const miniSearchOptions = computed(() => ({
  fields: ['title', 'titles', 'text'],
  storeFields: ['title', 'titles'],
  ...(theme.value.spd?.search?.provider === 'local' ? theme.value.spd.search.options?.miniSearch?.options : {})
}));

const searchOptions = computed(() => ({
  fuzzy: 0.2,
  prefix: true,
  boost: { title: 4, text: 2, titles: 1 },
  ...(theme.value.spd?.search?.provider === 'local' ? theme.value.spd.search.options?.miniSearch?.searchOptions : {})
}));

/** 解析 minisearch id ('/guide/foo.html#anchor' 或 '/guide/foo.html') */
function splitUrl(id: string): HitIdParts {
  const i = id.indexOf('#');
  return i < 0 ? { url: id, anchor: null } : { url: id.slice(0, i), anchor: id.slice(i + 1) };
}

/** html → 纯文本 (索引正文用) */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── 语料 + 索引 ────────────────────────────────────────────────────────
// 语料表 (page url → 有序切段) 由 useSearchCorpus 从渲染后的区块 DOM 扫描而来,
// 索引构建与命中摘要回查共用同一份切片, 二者必然一致。
// react-hooks/rules-of-hooks 误判为 React Hook, 按规则禁用该行 (不改 .eslintrc)
// eslint-disable-next-line react-hooks/rules-of-hooks
const corpus = useSearchCorpus();

/** 客户端建索引: 语料在挂载后才就绪 (区块是异步组件), 故随语料变化各建一次;
 *  provider 非 local 时不建 (与配置语义一致, 搜索入口本身也不渲染) */
function buildIndex(): void {
  if (theme.value.spd?.search?.provider !== 'local') {
    return;
  }
  const docs = [...corpus.value].flatMap(([url, segments]) =>
    segments.map((seg) => ({
      id: seg.anchorId ? `${url}#${seg.anchorId}` : url,
      title: seg.title,
      titles: seg.titles,
      text: stripHtml(seg.html)
    }))
  );
  const instance = new MiniSearch<SearchHit>(miniSearchOptions.value);
  // 文档的运行时形状即 SearchHit (score/terms/match 由 minisearch 查询时产出), 仅补一次类型收窄
  instance.addAll(docs as unknown as SearchHit[]);
  ms.value = instance;
}

// ── 查询输入 (VP: filterText, sessionStorage 持久化) ─────────────────────
const disableQueryPersistence = computed(() => {
  return theme.value.spd?.search?.provider === 'local'
    && theme.value.spd.search.options?.disableQueryPersistence === true;
});

const FILTER_KEY = 'vitepress:local-search-filter';

function readFilter(): string {
  try {
    return disableQueryPersistence.value ? '' : sessionStorage.getItem(FILTER_KEY) ?? '';
  }
  catch {
    return '';
  }
}

const filterText = ref(readFilter());

watch(filterText, (v) => {
  try {
    if (!disableQueryPersistence.value) {
      sessionStorage.setItem(FILTER_KEY, v);
    }
  }
  catch {
    /* storage 不可用时静默 */
  }
});

// ── 详细视图 (VP: detailedView, localStorage 持久化) ─────────────────────
const DETAIL_KEY = 'vitepress:local-search-detailed-list';

const showDetailedList = ref((() => {
  try {
    const saved = localStorage.getItem(DETAIL_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
  }
  catch {
    /* ignore */
  }
  return theme.value.spd?.search?.provider === 'local' && theme.value.spd.search.options?.detailedView === true;
})());

const disableDetailedView = computed(() => {
  return theme.value.spd?.search?.provider === 'local' && theme.value.spd.search.options?.detailedView === false;
});

watch(showDetailedList, (v) => {
  try {
    localStorage.setItem(DETAIL_KEY, String(v));
  }
  catch {
    /* ignore */
  }
});

watchEffect(() => {
  if (disableDetailedView.value) {
    showDetailedList.value = false;
  }
});

// ── 查询 (VP: watchDebounced 200ms 是为异步索引; 本站索引同步, 直接 watch) ──
const results = ref<ResultItem[]>([]);
const enableNoResults = ref(false);
/** 命中词集合 → 高亮正则 (VP: mark.js 的 markRegExp 输入) */
const markRe = ref<RegExp>(/(?!x)x/);

const showSearchSpinner = ref(false); // 索引为同步构建, 无加载态; 保留 VP 的 spinner 结构位

/** 跑一次查询: filterText 变化与"索引刚重建"两处都要跑, 故抽成具名函数 */
function runSearch(): void {
  enableNoResults.value = false;
  const q = filterText.value;
  if (!ms.value || !q) {
    results.value = [];
    return;
  }
  const terms = new Set<string>();
  // minisearch 的 SearchResult 泛型不带文档字段 (id 为 any), 映射后收窄为 ResultItem
  results.value = ms.value
    .search(q, searchOptions.value)
    .slice(0, 16)
    .map((r) => {
      for (const term of Object.keys(r.match)) {
        terms.add(term);
      }
      const { url, anchor } = splitUrl(r.id);
      const segments = corpus.value.get(url);
      const seg = segments?.find((p) => p.anchorId === anchor)
        ?? segments?.find((p) => p.anchorId === null);
      return { ...r, text: seg?.html ?? '' };
    }) as ResultItem[];
  markRe.value = formMarkRegex(terms);
  enableNoResults.value = true;
}

watch(filterText, runSearch, { immediate: true }); // VP 同款 immediate: 恢复的持久化 filterText 首渲染即出结果

// 语料在挂载后才从区块 DOM 就绪 (区块是异步组件), dev 下热更新还会重扫:
// 每次语料变化重建索引并补跑查询 —— 上面 immediate 首跑时索引尚未建成 (结果为空, 不闪无结果提示)
watch(corpus, () => {
  buildIndex();
  runSearch();
});

// ── 高亮 (等价 VP mark.js markRegExp: 仅文本节点注入 <mark>, 不碰标签/属性) ──
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** VP 同款: 命中词按长度降序拼接为单个小写不敏感正则 */
function formMarkRegex(terms: Set<string>): RegExp {
  const pattern = [...terms]
    .sort((a, b) => b.length - a.length)
    .map((term) => `(${escapeRegExp(term)})`)
    .join('|');
  return new RegExp(pattern, 'gi');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

/** 逐 token 扫描: 标签原样保留, 仅文本段命中时包 <mark> (excerpt 为真实 HTML, 防止误伤标签) */
function markHtml(html: string, re: RegExp): string {
  return html.replace(/<[^>]*>|[^<]+/g, (m) => (m.startsWith('<') ? m : m.replace(re, (t) => `<mark>${t}</mark>`)));
}

/** 纯文本 (标题链/标题): 先转义再标记 */
function markPlain(text: string, re: RegExp): string {
  return markHtml(escapeHtml(text), re);
}

// ── 文案 (VP: createSearchTranslate, 结构同款; 默认中文对齐站内语言) ────────
const defaultTranslations = {
  button: { buttonText: '搜索文档' },
  modal: {
    displayDetails: '显示详细列表',
    resetButtonTitle: '清空搜索',
    backButtonTitle: '关闭搜索',
    noResultsText: '没有找到',
    footer: {
      selectText: '选择',
      selectKeyAriaLabel: '回车',
      navigateText: '切换',
      navigateUpKeyAriaLabel: '上箭头',
      navigateDownKeyAriaLabel: '下箭头',
      closeText: '关闭',
      closeKeyAriaLabel: 'esc'
    }
  }
};

/** VP createSearchTranslate 同款三级回退: spd.search.options.locales[localeIndex] → translations → 默认 */
function translate(key: string): string {
  const keyPath = key.split('.');
  const options = theme.value.spd?.search?.provider === 'local' ? theme.value.spd.search.options : undefined;
  const locales = options?.locales?.[localeIndex.value]?.translations ?? null;
  const translations = options?.translations ?? null;
  let localeResult = locales;
  let translationResult = translations;
  let defaultResult: Record<string, unknown> | null = defaultTranslations;
  const lastKey = keyPath.pop() as string;
  for (const k of keyPath) {
    const inDefault = defaultResult?.[k] as Record<string, unknown> | undefined;
    const inTranslation = translationResult?.[k] as Record<string, unknown> | undefined;
    const inLocale = localeResult?.[k] as Record<string, unknown> | undefined;
    // 三棵树逐级下钻: 有子级走子级, 没有则整棵置到本层最深命中 (locale > translation > default, VP 同款可为 null)
    const fallback = inLocale ?? inTranslation ?? inDefault ?? null;
    defaultResult = inDefault ?? fallback;
    translationResult = inTranslation ?? fallback;
    localeResult = inLocale ?? fallback;
  }
  return (localeResult?.[lastKey] ?? translationResult?.[lastKey] ?? defaultResult?.[lastKey] ?? '') as string;
}

// ── 键盘选择 (VP 同款: ↑↓ 循环, mac 上 Ctrl+P/N, Enter 带 IME/按钮守卫) ────
const selectedIndex = ref(-1);
const disableMouseOver = ref(true);

watch(results, (r) => {
  selectedIndex.value = r.length ? 0 : -1;
  scrollToSelectedResult();
});

function scrollToSelectedResult(): void {
  nextTick(() => {
    const selectedEl = document.querySelector('.result.selected');
    selectedEl?.scrollIntoView({ block: 'nearest' });
  });
}

function selectPreviousResult(event: Event): void {
  event.preventDefault();
  selectedIndex.value--;
  if (selectedIndex.value < 0) {
    selectedIndex.value = results.value.length - 1;
  }
  disableMouseOver.value = true;
  scrollToSelectedResult();
}

function selectNextResult(event: Event): void {
  event.preventDefault();
  selectedIndex.value++;
  if (selectedIndex.value >= results.value.length) {
    selectedIndex.value = 0;
  }
  disableMouseOver.value = true;
  scrollToSelectedResult();
}

/** VP 同款: 仅 mac 且纯 Ctrl (非 Cmd) 时 P/N 生效 */
function isMacCtrlShortcut(event: KeyboardEvent): boolean {
  return event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey
    && document.documentElement.classList.contains('mac');
}

/** 单页跳转: 锚点段 → '#anchor', 页面级 → hashFor(url); 滚动由 useHashRoute 委托/navigateTo 承担 */
function resultHref(id: string): string {
  const { url, anchor } = splitUrl(id);
  return anchor ? `#${anchor}` : hashFor(url);
}

function go(hit: ResultItem): void {
  const { url, anchor } = splitUrl(hit.id);
  navigateTo(anchor ?? hashFor(url));
  emit('close');
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    emit('close');
    return;
  }
  if (e.key === 'ArrowUp') {
    selectPreviousResult(e);
    return;
  }
  if (e.key === 'ArrowDown') {
    selectNextResult(e);
    return;
  }
  if ((e.key === 'p' || e.key === 'P') && isMacCtrlShortcut(e)) {
    selectPreviousResult(e);
    return;
  }
  if ((e.key === 'n' || e.key === 'N') && isMacCtrlShortcut(e)) {
    selectNextResult(e);
    return;
  }
  if (e.key === 'Enter') {
    if (e.isComposing) {
      return;
    }
    if (e.target instanceof HTMLButtonElement && e.target.type !== 'submit') {
      return;
    }
    const selected = results.value[selectedIndex.value];
    if (e.target instanceof HTMLInputElement && !selected) {
      e.preventDefault();
      return;
    }
    if (selected) {
      e.preventDefault();
      go(selected);
    }
  }
}

// ── 输入焦点 / 重置 (VP 同款) ────────────────────────────────────────────
const disableReset = computed(() => filterText.value.length <= 0);

function focusSearchInput(select = true): void {
  searchInput.value?.focus();
  if (select) {
    searchInput.value?.select();
  }
}

function resetSearch(): void {
  filterText.value = '';
  nextTick().then(() => focusSearchInput(false));
}

function onSearchBarClick(event: PointerEvent): void {
  if (event.pointerType === 'mouse') {
    focusSearchInput();
  }
}

function onMouseMove(e: MouseEvent): void {
  if (!disableMouseOver.value) {
    return;
  }
  const el = e.target instanceof Element ? e.target.closest('.result') : null;
  const index = Number.parseInt(el?.getAttribute('data-index') ?? '', 10);
  if (index >= 0 && index !== selectedIndex.value) {
    selectedIndex.value = index;
  }
  disableMouseOver.value = false;
}

// ── 挂载 (VP 同款; focus trap 不引依赖, 简化为聚焦输入框) ───────────────────
let prevBodyOverflow = '';

function onPopState(): void {
  emit('close');
}

onMounted(() => {
  window.addEventListener('keydown', onKey);
  focusSearchInput();
  // VP 同款: 压入历史占位, 让浏览器后退=关闭弹层
  window.history.pushState(null, '', null);
  window.addEventListener('popstate', onPopState);
  // VP 的 useBodyScrollLock: 单弹层简化为直接锁 body 滚动
  prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('popstate', onPopState);
  document.body.style.overflow = prevBodyOverflow;
});
</script>

<template>
  <Teleport to="body">
    <div role="button" :aria-owns="results.length ? 'localsearch-list' : undefined" aria-expanded="true"
      aria-haspopup="listbox" aria-labelledby="localsearch-label" class="SPDLocalSearchBox">
      <div class="backdrop" @click="emit('close')" />

      <div class="shell">
        <form class="search-bar" @pointerup="onSearchBarClick($event)" @submit.prevent="">
          <label id="localsearch-label" for="localsearch-input" :title="translate('button.buttonText')">
            <span aria-hidden="true" class="vpi-search search-icon local-search-icon" />
          </label>
          <div class="search-actions before">
            <button class="back-button" type="button" :title="translate('modal.backButtonTitle')"
              @click="emit('close')">
              <span class="vpi-arrow-left local-search-icon" />
            </button>
          </div>
          <input id="localsearch-input" ref="searchInput" v-model="filterText"
            :aria-activedescendant="selectedIndex > -1 ? 'localsearch-item-' + selectedIndex : undefined"
            aria-autocomplete="both" :aria-controls="results.length ? 'localsearch-list' : undefined"
            aria-labelledby="localsearch-label" autocapitalize="off" autocomplete="off" autocorrect="off"
            class="search-input" enterkeyhint="go" maxlength="64" :placeholder="translate('button.buttonText')"
            spellcheck="false" type="search">
          <div class="search-actions">
            <span class="search-loading" :class="{ active: showSearchSpinner }"
              :role="showSearchSpinner ? 'status' : undefined" aria-live="polite"
              :aria-label="showSearchSpinner ? 'Loading search results' : undefined" />

            <button v-if="!disableDetailedView" class="toggle-layout-button" type="button"
              :class="{ 'detailed-list': showDetailedList }" :title="translate('modal.displayDetails')"
              @click="selectedIndex > -1 && (showDetailedList = !showDetailedList)">
              <span class="vpi-layout-list local-search-icon" />
            </button>

            <button class="clear-button" type="reset" :disabled="disableReset"
              :title="translate('modal.resetButtonTitle')" @click="resetSearch">
              <span class="vpi-delete local-search-icon" />
            </button>
          </div>
        </form>

        <ul :id="results.length ? 'localsearch-list' : undefined" :role="results.length ? 'listbox' : undefined"
          :aria-busy="showSearchSpinner ? 'true' : 'false'"
          :aria-labelledby="results.length ? 'localsearch-label' : undefined" class="results" @mousemove="onMouseMove">
          <li v-for="(p, index) in results" :id="'localsearch-item-' + index" :key="p.id"
            :aria-selected="selectedIndex === index ? 'true' : 'false'" role="option">
            <a :href="resultHref(p.id)" class="result" :class="{ selected: selectedIndex === index }"
              :aria-label="[...p.titles, p.title].join(' > ')" :data-index="index" @click="emit('close')"
              @focusin="selectedIndex = index" @mouseenter="!disableMouseOver && (selectedIndex = index)">
              <div>
                <div class="titles">
                  <span class="title-icon">#</span>
                  <span v-for="(t, tIndex) in p.titles" :key="tIndex" class="title">
                    <span class="text" v-html="markPlain(t, markRe)" />
                    <span class="vpi-chevron-right local-search-icon" />
                  </span>
                  <span class="title main">
                    <span class="text" v-html="markPlain(p.title, markRe)" />
                  </span>
                </div>

                <div v-if="showDetailedList" class="excerpt-wrapper">
                  <div v-if="p.text" class="excerpt" inert>
                    <div class="vp-doc" v-html="markHtml(p.text, markRe)" />
                  </div>
                  <div class="excerpt-gradient-bottom" />
                  <div class="excerpt-gradient-top" />
                </div>
              </div>
            </a>
          </li>
          <li v-if="filterText && !results.length && enableNoResults" class="no-results">
            {{ translate('modal.noResultsText') }} "<strong>{{ filterText }}</strong>"
          </li>
        </ul>

        <div class="search-keyboard-shortcuts">
          <span>
            <kbd :aria-label="translate('modal.footer.navigateUpKeyAriaLabel')">
              <span class="vpi-arrow-up navigate-icon" />
            </kbd>
            <kbd :aria-label="translate('modal.footer.navigateDownKeyAriaLabel')">
              <span class="vpi-arrow-down navigate-icon" />
            </kbd>
            {{ translate('modal.footer.navigateText') }}
          </span>
          <span>
            <kbd :aria-label="translate('modal.footer.selectKeyAriaLabel')">
              <span class="vpi-corner-down-left navigate-icon" />
            </kbd>
            {{ translate('modal.footer.selectText') }}
          </span>
          <span>
            <kbd :aria-label="translate('modal.footer.closeKeyAriaLabel')">esc</kbd>
            {{ translate('modal.footer.closeText') }}
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="stylus" scoped>
/* 样式逐行移植 VP 的 VPLocalSearchBox, 颜色全部走 VP 全局变量 (默认主题 vars.css 提供) */

.SPDLocalSearchBox
  position fixed
  z-index 100
  inset 0
  display flex

.backdrop
  position absolute
  inset 0
  background var(--vp-backdrop-bg-color)
  transition opacity 0.5s

.shell
  position relative
  padding 0.75rem
  margin 4rem auto
  display flex
  flex-direction column
  gap 1rem
  background var(--vp-local-search-bg)
  width min(100vw - 3.75rem, 56.25rem)
  // height min-content
  max-height min(100vh - 8rem, 56.25rem)
  border-radius 0.375rem

@media not all and (min-width: 48rem)
  .shell
    margin 0
    width 100vw
    height 100vh
    max-height none
    border-radius 0

.search-bar
  border 1px solid var(--vp-c-divider)
  border-radius 0.25rem
  display flex
  align-items center
  padding 0 0.75rem
  cursor text

@media not all and (min-width: 48rem)
  .search-bar
    padding 0 0.5rem

.search-bar:focus-within
  border-color var(--vp-c-brand-1)

.local-search-icon
  display block
  font-size 1.125rem

.navigate-icon
  display block
  font-size 0.875rem

.search-icon
  margin 0.5rem

@media not all and (min-width: 48rem)
  .search-icon
    display none

.search-input
  padding 0.375rem 0.75rem
  font-size inherit
  width 100%

.search-input::-webkit-search-cancel-button
  display none

@media not all and (min-width: 48rem)
  .search-input
    padding 0.375rem 0.25rem

.search-actions
  display flex
  gap 0.25rem

@media (any-pointer: coarse)
  .search-actions
    gap 0.5rem

@media (min-width: 48rem)
  .search-actions.before
    display none

.search-actions button
  padding 0.5rem

.search-actions button:not([disabled]):hover,
.toggle-layout-button.detailed-list
  color var(--vp-c-brand-1)

.search-actions button.clear-button:disabled
  opacity 0.37

.search-loading
  visibility hidden
  margin 0.5rem
  width 1.125rem
  height 1.125rem
  flex none
  border 2px solid var(--vp-c-divider)
  border-top-color var(--vp-c-brand-1)
  border-radius 50%

.search-loading.active
  visibility visible
  animation local-search-loading 0.8s linear infinite

@media (prefers-reduced-motion: reduce)
  .search-loading.active
    animation none

@keyframes local-search-loading
  to
    transform rotate(360deg)

.search-keyboard-shortcuts
  font-size 0.8rem
  opacity 75%
  display flex
  flex-wrap wrap
  gap 1rem
  line-height 1.09375

.search-keyboard-shortcuts span
  display flex
  align-items center
  gap 0.25rem

@media not all and (min-width: 48rem)
  .search-keyboard-shortcuts
    display none

.search-keyboard-shortcuts kbd
  background rgba(128, 128, 128, 0.1)
  border-radius 0.25rem
  padding 0.1875rem 0.375rem
  min-width 1.5rem
  display inline-block
  text-align center
  vertical-align middle
  border 1px solid rgba(128, 128, 128, 0.15)
  box-shadow 0 2px 2px 0 rgba(0, 0, 0, 0.1)

.results
  display flex
  flex-direction column
  gap 0.375rem
  overflow-x hidden
  overflow-y auto
  overscroll-behavior contain

.result
  display flex
  align-items center
  gap 0.5rem
  border-radius 0.25rem
  transition none
  line-height 1
  border solid 2px var(--vp-local-search-result-border)
  outline none

.result > div
  margin 0.75rem
  width 100%
  overflow hidden

@media not all and (min-width: 48rem)
  .result > div
    margin 0.5rem

.titles
  display flex
  flex-wrap wrap
  gap 0.25rem
  position relative
  z-index 1001
  padding 0.125rem 0

.title
  display flex
  align-items center
  gap 0.25rem

.title.main
  font-weight 500

.title-icon
  opacity 0.5
  font-weight 500
  color var(--vp-c-brand-1)

.title svg
  opacity 0.5

.result.selected
  --vp-local-search-result-bg var(--vp-local-search-result-selected-bg)
  border-color var(--vp-local-search-result-selected-border)

.excerpt-wrapper
  position relative

.excerpt
  opacity 50%
  pointer-events none
  max-height 8.75rem
  overflow hidden
  position relative
  margin-top 0.25rem

.result.selected .excerpt
  opacity 1

.excerpt :deep(*)
  font-size 0.8rem !important
  line-height 1.3 !important

.titles :deep(mark),
.excerpt :deep(mark)
  background-color var(--vp-local-search-highlight-bg)
  color var(--vp-local-search-highlight-text)
  border-radius 0.125rem
  padding 0 0.125rem

.excerpt :deep(.vp-code-group) .tabs
  display none

.excerpt :deep(.vp-code-group) div[class*='language-']
  border-radius 0.5rem !important

.excerpt-gradient-bottom
  position absolute
  bottom -1px
  left 0
  width 100%
  height 0.5rem
  background linear-gradient(transparent, var(--vp-local-search-result-bg))
  z-index 1000

.excerpt-gradient-top
  position absolute
  top -1px
  left 0
  width 100%
  height 0.5rem
  background linear-gradient(var(--vp-local-search-result-bg), transparent)
  z-index 1000

.result.selected .titles,
.result.selected .title-icon
  color var(--vp-c-brand-1) !important

.no-results
  font-size 0.9rem
  text-align center
  padding 0.75rem

svg
  flex none
</style>
