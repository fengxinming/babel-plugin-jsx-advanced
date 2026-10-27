<script setup lang="ts">
// 聚合区块渲染层: 首屏 hero 之后的 md 区块列表。
// 区块在本组件内 await 加载 (组件是 md 的真实编译产物, 所以 md 里写的 Vue 组件标签能挂载
// —— 这是 v-html 做不到的)。本组件因此是**异步组件**, 必须由父级 SPDPage 的 <Suspense>
// 兜住才渲染 (VP 默认主题全链路没有任何 Suspense, 其页面组件都是同步 setup)。
// 左侧竖排导航与右侧大纲同逻辑: 首屏 (hero) 不出现, 滚过首屏进入首个区块后随activeSection 显形。
import { computed, shallowRef } from 'vue';
import { normalized, sectionId } from '../utils/nav';
import { useSections } from '../composables/useSections';
import { useOutlineFromDom } from '../composables/useOutlineFromDom';
import { useScrollSpy } from '../composables/useScrollSpy';
import SPDSideNav from './SPDSideNav.vue';
import SPDOutline from './SPDOutline.vue';
import SPDSectionBody from './SPDSectionBody.vue';
import type { RenderedSection } from '../_types';

const sections = await useSections();

// 聚合结果一次性载入, 组件生命周期内不变, 故用 shallowRef 持有 ——
// 只需让下游 (滚动跟随 / 大纲) 能订阅, 不需要深层响应式 (区块对象不会被就地修改)。
const rendered = shallowRef<RenderedSection[]>(sections);

// 大纲来自渲染后的 DOM: md 编译产物的 __pageData.headers 实测恒为空, 拿不到标题数据。
// 必须先于 useScrollSpy 调用 —— 两者的 onMounted 按注册顺序执行, 大纲先就绪, 首次滚动判定才准。
const outlineBySection = useOutlineFromDom(rendered);

// 滚动跟随: 区块高亮 (左导航) + 标题高亮 (右侧大纲)
const { activeSection, activeHeading } = useScrollSpy(rendered, outlineBySection);

// 右侧大纲 = 当前滚动到的 md 区块的局部目录 (区块未定则取第一个)
const outline = computed(
  () => outlineBySection.value[activeSection.value]
    ?? outlineBySection.value[normalized(rendered.value[0]?.url ?? '')]
    ?? []
);

// 聚合区块 url 清单: 左导航据此区分锚点项与真实路由项 (独立工具页)
const sectionUrls = computed(() => rendered.value.map((s) => normalized(s.url)));
</script>

<template>
  <SPDSideNav v-if="activeSection" :active="activeSection" :sections="sectionUrls" />

  <main class="SPDSections">
    <!-- 每个区块由 SPDSectionBody 建立独立的 provide 作用域: md 内嵌组件 (如 Playground)
         经 inject 取本区块所在页的 frontmatter。必须按区块隔离 —— 各页 frontmatter 不同。 -->
    <section v-for="s in rendered" :id="sectionId(s.url)" :key="s.url" class="SPDSection">
      <SPDSectionBody :section="s" />
    </section>
  </main>

  <SPDOutline v-if="activeSection && outline.length" :items="outline" :active="activeHeading" />
</template>

<style lang="stylus" scoped>
.SPDSections
  max-width var(--spd-doc-max-width)
  margin 0 auto
  padding 40px 32px 0

@media (max-width: 960px)
  .SPDSections
    padding 24px 20px 0

.SPDSection
  padding-bottom 40px
  // 左导航点的是区块锚点 (#sectionId), 目标元素是本section 自身而非内部标题,
  // 必须自己挂避让, 否则落点顶边贴视口 0 被固定顶栏压住 (h1~h4 的避让只对标题锚点生效)
  scroll-margin-top var(--spd-heading-offset)

/* ---------- md 正文排版 (md 组件在 .SPDSection 内, 必须 :deep()) ---------- */
.SPDSection :deep(h1),
.SPDSection :deep(h2),
.SPDSection :deep(h3),
.SPDSection :deep(h4)
  color var(--spd-c-text-1)
  font-weight 700
  letter-spacing -0.01em
  line-height 1.3

// 标题锚点滚动定位时, 给固定导航留出空间
.SPDSection :deep(h1),
.SPDSection :deep(h2),
.SPDSection :deep(h3),
.SPDSection :deep(h4)
  scroll-margin-top var(--spd-heading-offset)

.SPDSection :deep(h1)
  font-size 34px
  padding 16px 0
  // border-bottom 1px solid var(--spd-c-border)
  // margin 0 0 28px

.SPDSection :deep(h2)
  font-size 24px
  margin 48px 0 16px
  padding-top 24px
  border-top 1px solid var(--spd-c-border)

.SPDSection :deep(h3)
  font-size 18px
  margin 30px 0 12px

.SPDSection :deep(p)
  color var(--spd-c-text-4)
  font-size 15px
  line-height 1.8
  margin 0 0 14px

.SPDSection :deep(ul),
.SPDSection :deep(ol)
  padding-left 22px
  margin 0 0 16px

.SPDSection :deep(li)
  color var(--spd-c-text-4)
  font-size 15px
  line-height 1.8
  margin 4px 0

.SPDSection :deep(li::marker)
  color var(--spd-c-brand-1)

.SPDSection :deep(a)
  color var(--spd-c-brand-1)

.SPDSection :deep(a:hover)
  color var(--spd-c-brand-2)

.SPDSection :deep(strong)
  color var(--spd-c-text-1)

.SPDSection :deep(hr)
  border none
  border-top 1px solid var(--spd-c-border)
  margin 32px 0

.SPDSection :deep(.header-anchor)
  color var(--spd-c-brand-1)
  opacity 0.6
  font-weight 400

.SPDSection :deep(.header-anchor:hover)
  opacity 1

.SPDSection :deep(code)
  font-family var(--spd-font-family-mono)
  font-size 0.88em

.SPDSection :deep(:not(pre) > code)
  background rgba(0, 217, 255, 0.1)
  color var(--spd-c-brand-2)
  padding 2px 7px
  border-radius var(--spd-radius-sm)

.SPDSection :deep(pre)
  background var(--spd-c-bg-alt)
  border 1px solid var(--spd-c-border)
  border-radius var(--spd-radius-card)
  padding 16px 18px
  overflow-x auto
  margin 0 0 18px
  line-height 1.65
  font-size 13.5px

.SPDSection :deep(pre code)
  color var(--spd-c-text-1)
  background transparent
  padding 0

.SPDSection :deep(table)
  width 100%
  border-collapse separate
  border-spacing 0
  margin 0 0 20px
  font-size 14px

.SPDSection :deep(th),
.SPDSection :deep(td)
  border 1px solid var(--spd-c-border)
  padding 9px 14px
  color var(--spd-c-text-4)
  text-align left
  line-height 1.6

.SPDSection :deep(thead th)
  background var(--spd-c-bg-alt)
  color var(--spd-c-brand-1)
  font-weight 600

.SPDSection :deep(tbody tr:hover td)
  background rgba(0, 217, 255, 0.05)

.SPDSection :deep(blockquote)
  border-left 3px solid var(--spd-c-brand-1)
  background rgba(17, 34, 64, 0.5)
  border-radius 0 10px 10px 0
  padding 10px 18px
  margin 0 0 16px

.SPDSection :deep(blockquote p)
  color var(--spd-c-text-6)
  margin 0

/* ---------- 提示块 (markdown-it 容器产物, 同样由 md 组件渲染) ---------- */
.SPDSection :deep(.custom-block)
  border-radius var(--spd-radius-card)
  padding 14px 18px
  margin 0 0 18px
  border 1px solid

.SPDSection :deep(.custom-block.tip),
.SPDSection :deep(.custom-block.info)
  background rgba(0, 217, 255, 0.07)
  border-color rgba(0, 217, 255, 0.4)

.SPDSection :deep(.custom-block.warning)
  background rgba(255, 193, 7, 0.07)
  border-color rgba(255, 193, 7, 0.4)

.SPDSection :deep(.custom-block.danger)
  background rgba(255, 82, 82, 0.07)
  border-color rgba(255, 82, 82, 0.4)

.SPDSection :deep(.custom-block .custom-block-title)
  font-weight 700
  font-size 13.5px
  margin-bottom 6px
  color var(--spd-c-text-1)

.SPDSection :deep(.custom-block.tip .custom-block-title),
.SPDSection :deep(.custom-block.info .custom-block-title)
  color var(--spd-c-brand-1)

.SPDSection :deep(.custom-block.warning .custom-block-title)
  color #ffc107

.SPDSection :deep(.custom-block.danger .custom-block-title)
  color #ff5252

.SPDSection :deep(.custom-block p)
  color var(--spd-c-text-4)
  margin 0 0 6px

.SPDSection :deep(.custom-block p:last-child)
  margin-bottom 0
</style>
