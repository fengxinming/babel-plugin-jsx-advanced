/**
 * 区块作用域的数据钩子 (语义对齐 VP 的 useData), 供**被聚合进首页的 md 里写的组件**读取
 * 自己所在页的 yaml 配置 (frontmatter)。
 *
 * 为什么必须另开钩子:
 * - 聚合流里被聚合的 md 不是当前路由页 (路由只有 `/` 一个), 所以区块内组件调 VP 的
 *   useData(), 拿到的是**宿主页 (index.md)** 的 frontmatter, 不是自己所在页 (如 playground.md) 的。
 *   VP 的 useData 实现是 `frontmatter: computed(() => route.data.frontmatter)`, 绑死当前路由。
 * - md 的编译产物没有 props 声明 (`_sfc_main = { name: '...' }`), 且其模板里的
 *   `<Playground />` 被编译成零参调用 (`_createVNode(_component_Playground)`), 外部传 prop
 *   既进不了 md 组件 (走 fallthrough 落到根 div 上), 也递不到内层组件 —— md 是无参数入口的封闭组件。
 * 所以唯一通道是 provide/inject: 每个区块各自 provide 一份自己的页面数据。
 *
 * 兜底: 独立路由页 (如直接访问 /guide/playground) 没有区块上下文, 此时回退到 useData,
 * 于是同一份组件代码在"首页聚合"与"独立路由"两种场景下都对。
 */
import { computed, inject, provide } from 'vue';
import { useData } from 'vitepress';
import type { SectionData, SectionScope, SectionScopeKey } from '../_types';

/** provide/inject 键: 用 Symbol 承载, 与站点其他 provide 隔离 (不做字符串约定) */
export const SECTION_DATA_KEY: SectionScopeKey = Symbol('spd:section-data');

/** 区块层调用: 把本区块的页面数据下发给子树 (setup 同步执行期, 每次区块渲染各一次) */
export function provideSectionData(scope: SectionScope): void {
  provide(SECTION_DATA_KEY, scope);
}

/** 消费层调用: 区块内返回本区块数据; 区块外 (独立路由页) 回退当前路由数据 */
export function useSectionData(): SectionData {
  const scope = inject(SECTION_DATA_KEY, null);
  const { frontmatter, page } = useData();
  if (scope) {
    return {
      frontmatter: computed(() => scope.frontmatter),
      relativePath: computed(() => scope.relativePath)
    };
  }
  return {
    frontmatter,
    relativePath: computed(() => page.value.relativePath)
  };
}
