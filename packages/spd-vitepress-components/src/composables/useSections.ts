/**
 * 聚合区块的数据源: 把 themeConfig.spd.nav 指向的每个 md 页面, 经 VitePress 内部的
 * pathToFile 定位到"当前环境下可import 的模块 URL", 再动态 import 拿到编译产物。
 *
 * 为什么走这条通道 (以及为什么不走 data loader):
 * md 的编译产物是真实的 Vue SFC 模块 (dev 走 Vite 转换, prod 走带 hash 的页面 chunk,
 * SSR 走 .temp 下的 entry)。`mod.default` 即组件, md 里写的 `<Playground />` 等标签靠
 * resolveComponent 正常解析 —— 这是 v-html 做不到的 (v-html 只设 innerHTML, 不编译模板,
 * 组件标签只会变成死字符串)。而 `createContentLoader` 的出口被 staticDataPlugin 双重 JSON
 * 序列化, 物理上装不了组件 —— 组件只能来自客户端 import。
 * 大纲同理不走数据: __pageData.headers 恒为空, 改由 useOutlineFromDom 从渲染后的 DOM 取;
 * 搜索语料同一口径 (useSearchCorpus 扫区块 DOM), 全站已无构建期数据 loader。
 *
 * SSR 说明: 三个分支返回的路径在对应环境下都实测命中 (vitepress 2.0.0-alpha.20):
 * - dev浏览器: `/guide/foo.md?t=<13位时间戳>` (vite 只剥离 13 位 t=, 少位数会失配落到静态服务)
 * - SSR: `./guide_foo.md.js` (与 bundle 阶段的 entryFileNames 同源, 见 dist/node/chunk 的 input key)
 * - prod 浏览器: `/assets/guide_foo.md.<hash>.js` (查 hashmap.json, 即 __VP_HASH_MAP__)
 * 其中 SSR/prod 的算法与 VP 客户端 newRouter 里的 loadPageModule 完全一致 (index.js:85-108),
 * 我们等于复刻它; 唯一区别是 VP 首屏会把路径替换成 .lean.js, 我们不能 (lean 版没有 __pageData)。
 *
 * 放在 composables/ 而非 utils/nav.ts: nav.ts 装的是 hash 推导这类同步纯函数,
 * 本模块是异步的模块加载, 职责不同层。
 */
import { useData, type DefaultTheme } from 'vitepress';
import { pathToFile } from 'vitepress/dist/client/app/utils.js';
import { normalized } from '../utils/nav';
import type { MarkdownModule, RenderedSection } from '../_types';

/**
 * 单个 link → 区块。nav 里无 link 的项、以及 link 指向非 md 页面
 * (pathToFile 查表失败返回 null) 的项返回 null, 由调用方过滤掉。
 *
 * 注: 动态 import 的参数必须是运行时值, Vite 无法静态分析, 故必须加 @vite-ignore,
 * 否则构建期会尝试解析并报错。代价是 dev 下每次调用都会真发一次请求 (无预构建产物复用)。
 */
async function loadSection(link: string): Promise<RenderedSection | null> {
  const file = pathToFile(link);
  // pathToFile 查不到对应 hash 时返回 null 而非抛错 (见 vitepress utils.js prod 分支),
  // 直接 import(null) 会抛出难懂的语法错误, 故先挡掉。
  if (!file) {
    return null;
  }
  const mod = (await import(/* @vite-ignore */ file)) as MarkdownModule;
  return {
    url: `${normalized(link)}.html`,
    relativePath: mod.__pageData?.relativePath ?? '',
    component: mod.default,
    // 区块所在页的 yaml 配置: 经 SPDSectionBody 按区块 provide 下发给 md 内嵌组件
    frontmatter: mod.__pageData?.frontmatter ?? {}
  };
}

/**
 * 递归收集 nav 里的字符串link, 保持配置顺序。
 * 两处必须过滤:
 * - `link` 允许是函数 (签名 `(payload: PageData) => string`), 拿不到 payload 无法求值 → 跳过;
 * - 分组项 (NavItemWithChildren / NavItemChildren) 的目标在 `items` 里, 需下钻。
 * 其余项 (NavItemComponent 只有 component) 天然没有 link, 不匹配即被跳过。
 */
function collectLinks(items: DefaultTheme.NavItem[], links: string[]): void {
  for (const item of items) {
    if ('link' in item && typeof item.link === 'string') {
      links.push(item.link);
    }
    if ('items' in item && Array.isArray(item.items)) {
      collectLinks(item.items, links);
    }
  }
}

/**
 * 聚合入口。返回裸数组而非 ref: 区块是一次性载入的静态数据(load 全部 await 完才返回),
 * 之后不再变化; 且 ref 跨组件传值会被模板自动解包, 反而要在消费侧重新包回去。
 * 需要响应式引用的地方(滚动跟随)由消费方自行 shallowRef 一份。
 */
export async function useSections(): Promise<RenderedSection[]> {
  const { frontmatter } = useData();
  const { theme } = useData();
  const links: string[] = [];
  collectLinks(theme.value.spd?.nav?.[frontmatter.value.nav] ?? [], links);
  const sections = await Promise.all(links.map((link) => loadSection(link)));
  return sections.filter((s): s is RenderedSection => s !== null);
}
