/** 主题包内部共享类型 (类型定义统一收口, 实现文件不得内联 interface/type)。
 *
 * 注: Vue 的组件类型用 Component 而非 VNode / typeof import('vue') 的写法差异 —
 * 这里统一取编译产物 default 的类型, 动态 import 回来的东西按此断言。
 */
import type { SearchResult } from 'minisearch';
import type { Component, InjectionKey, Ref } from 'vue';

/** 搜索单条命中: minisearch 的 score/match + 索引文档字段 (storeFields 与 VP 默认一致: ['title','titles']) */
export interface SearchHit extends SearchResult {
  id: string;
  title: string;
  titles: string[];
}

/** 单条搜索结果: 命中的运行时形状 + 该段摘要 HTML (VP 为动态 import 页面组件渲染出的 HTML) */
export interface ResultItem extends SearchHit {
  text: string;
}

/** minisearch 文档 id 的解析产物: '/guide/foo.html#anchor' → { url: '/guide/foo.html', anchor: 'anchor' } */
export interface HitIdParts {
  url: string;
  anchor: string | null;
}

/** 大纲条目: 从渲染后的 DOM 提取的 h2/h3 标题 */
export interface SectionHeading {
  id: string;
  text: string;
  depth: 2 | 3;
}

/** 大纲表: 区块 url (normalized) → 该区块的 h2/h3 标题, 由 useOutlineFromDom 从 DOM 产出 */
export type OutlineMap = Record<string, SectionHeading[]>;

/** 单个 md 区块的页面数据 (VP __pageData 的子集): 由 SPDSectionBody 按区块 provide,
 *  区块内的组件 (md 里写的 <Playground /> 之类) 经 useSectionData 读取本页 yaml 配置。 */
export interface SectionScope {
  url: string;
  relativePath: string;
  frontmatter: Record<string, unknown>;
}

/** provide/inject 键的类型 (Symbol 承载, 避免与站点其他 provide 撞名) */
export type SectionScopeKey = InjectionKey<SectionScope>;

/** useSectionData 的返回: 字段与 VP 的 useData 同形 (都由 Ref 承载),
 *  使消费方不必区分"区块内 (首页聚合)"与"独立路由页"两种上下文。
 *  用 Ref 而非 ComputedRef: VP 的 VitePressData 把 frontmatter 声明为 Ref (无 ComputedRef 品牌),
 *  回退分支要直接透传它, 故取二者的公共上界。 */
export interface SectionData {
  frontmatter: Ref<Record<string, unknown>>;
  relativePath: Ref<string>;
}

/** 单个聚合区块的渲染产物: 页面数据 + 正文组件。
 *  正文由composables/useSections 动态 import md 的编译产物得到 (真实 Vue 组件,
 *  md 内写的组件标签 (如 <Playground />) 能正常解析 —— v-html 做不到, 组件标签会变成死字符串)。
 *  大纲不在这里: __pageData.headers 实测恒为空, 只能由 useOutlineFromDom 从渲染后的 DOM 取。 */
export interface RenderedSection extends SectionScope {
  component: Component;
}

/** md 编译模块的形态: 组件在 default, 页面元数据在 __pageData。
 *  __pageData 由 VP 的 markdownToVue 注入 (运行时产物, 未走TS 类型, 故在此声明)。 */
export interface MarkdownModule {
  default: Component;
  __pageData?: {
    frontmatter?: Record<string, unknown>;
    relativePath?: string;
  };
}

/** 搜索索引/摘要共用的页面切段: 前言段 anchorId 为 null, 其余每段对应一个 h2/h3 到下一个标题之前 */
export interface PageSegment {
  anchorId: string | null;
  /** 段标题 (heading 文本; 前言段取页面标题) */
  title: string;
  /** 祖先标题链 (h3 → [所属 h2]; 其余为空) */
  titles: string[];
  html: string;
}

/** 搜索语料表: 页面 url (带 .html, 与 minisearch 文档 id 的前半段同形) → 该页的有序切段。
 *  由 useSearchCorpus 从渲染后的区块 DOM 产出 (键来自 themeConfig.spd.nav, 正文与标题来自 DOM)。 */
export type SearchCorpus = Map<string, PageSegment[]>;

/** 首屏排布变体 (与具体文档内容无关, 任意组件文档可复用):
 *  split = 左文案 / 右媒体; centered = 文案居中; stacked = 文案一行 + 媒体通栏。 */
export type SPDHeroLayout = 'split' | 'centered' | 'stacked';

/** 代码窗的单个标签页 */
export interface SPDCodeTab {
  name: string;
  code: string;
}

/** 附加带 - 标签行 */
export interface SPDExtraChips {
  type: 'chips';
  items: string[];
}

/** 附加带 - 安装命令条 */
export interface SPDExtraInstall {
  type: 'install';
  /** 左侧说明 (如 npm / pnpm), 可选 */
  label?: string;
  command: string;
}

/** 附加带 - 统计项 */
export interface SPDExtraStat {
  value: string;
  label: string;
}

/** 附加带 - 数据指标组 */
export interface SPDExtraStats {
  type: 'stats';
  items: SPDExtraStat[];
}

/** 附加带 - 链接项 */
export interface SPDExtraLink {
  text: string;
  link: string;
}

/** 附加带 - 链接组 */
export interface SPDExtraLinks {
  type: 'links';
  items: SPDExtraLink[];
}

export type SPDExtraItem = SPDExtraChips | SPDExtraInstall | SPDExtraStats | SPDExtraLinks;

/** 首屏数据 (frontmatter.hero): 文案/按钮/图片直接走 VPHero 原生字段,
 *  eyebrow 由 SPDHome 的 info-before 插槽渲染, 代码窗与附加带由对应插槽补齐。
 *  name / text 对应 VPHero 的 name / text (两段可只填其一)。 */
export interface SPDHero {
  /** 排布: 默认 split (左文案 / 右媒体), centered 文案居中, stacked 文案一行 + 媒体通栏 */
  layout?: SPDHeroLayout;
  eyebrow?: string;
  name?: string;
  text?: string;
  tagline?: string;
  image?: string | { src: string, alt?: string };
  code?: SPDHeroCode;
  extra?: SPDExtraItem[];
}

/** 代码窗数据 (frontmatter.code): title 为右上角文件名, tabs 为多标签页 */
export interface SPDHeroCode {
  title?: string;
  tabs: SPDCodeTab[];
}
