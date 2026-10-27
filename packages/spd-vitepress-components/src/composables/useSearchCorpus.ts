/**
 * 本地搜索的语料源: 从**渲染后的 DOM** 读取每个聚合区块的正文, 按 h2/h3 切成段。
 *
 * 为什么读 DOM 而不是构建期数据 loader:
 * - 单页站的语料就是页面本身 —— loader 会把同一批 HTML 在页面区块之外再存一份
 *   (实测懒加载 chunk 里那份语料约 43KB), 且那份实现只在本仓 (workspace 软链 → 产物走站点
 *   vite 插件管线) 装配得起来, 站点侧换个包就完不成;
 * - 口径与右侧大纲 (useOutlineFromDom) 同源: 只信页面真实渲染结果, 不再维护 node 端第二渲染。
 *
 * 区块与 url 的对应: 区块 DOM 的 id 是 sectionId(url) (见 SPDSections 的 :id), 而 url 的目录部分
 * (如 /guide/foo) 无法从 id 反推, 故 url 一律由 themeConfig.spd.nav 清单给出 —— DOM 只提供正文与标题。
 *
 * 时机: 区块是异步加载完才渲染的, setup 期 DOM 还不存在, 故在 mounted 后扫描;
 * md 内容热更新时经 VP 的 onContentUpdated 重扫 (dev 下改 md 不必刷页)。
 */
import { nextTick, onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import { onContentUpdated, useData } from 'vitepress';
import type { DefaultTheme } from 'vitepress';
import { normalized, sectionId } from '../utils/nav';
import type { PageSegment, SearchCorpus } from '../_types';

/** h2/h3 整段 (含闭合标签): 只借 m[0] 的长度定切段终点, 标题文本另从 DOM 取 */
const HEADING_RE = /<h([23])\s[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/h\1>/g;

/** 标题文本: 摘掉 VP 注入的 header-anchor 链接 (内含零宽字符, 不摘会污染标题)。
 *  文本走 DOM 而非 HTML 字符串 —— 解析器已解实体, 不必再手工解码。 */
function headingText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelector('.header-anchor')?.remove();
  return (clone.textContent ?? '').trim();
}

/** 单页切片: 前言段 (首个 h2/h3 之前, 含 h1) + 每个 h2/h3 到下一个标题之前的正文 */
function sliceSection(root: HTMLElement, link: string): PageSegment[] {
  const html = root.innerHTML;
  const titleById = new Map<string, string>();
  for (const el of root.querySelectorAll<HTMLElement>('h2[id], h3[id]')) {
    titleById.set(el.id, headingText(el));
  }
  // 前言段标题取区块 h1 (各 md 的 h1 即页面标题); 没有 h1 的极端情况退回 url 末段
  const h1 = root.querySelector('h1');
  const pageTitle = h1 ? headingText(h1) : sectionId(link);

  const hits = [...html.matchAll(HEADING_RE)];
  const segments: PageSegment[] = [];
  if (hits.length === 0) {
    // 无 h2/h3 的区块整块成一条前言文档, 保证可被搜到
    segments.push({ anchorId: null, title: pageTitle, titles: [], html });
    return segments;
  }
  const first = hits[0].index ?? 0;
  if (first > 0) {
    segments.push({ anchorId: null, title: pageTitle, titles: [], html: html.slice(0, first) });
  }
  let lastH2 = '';
  for (let i = 0; i < hits.length; i++) {
    const cur = hits[i];
    const anchorId = cur[2];
    const level = cur[1];
    const start = cur.index ?? 0;
    const title = titleById.get(anchorId) ?? '';
    const next = hits[i + 1];
    if (level === '2') {
      lastH2 = title;
    }
    segments.push({
      anchorId,
      title,
      // 祖先标题链: h3 归到它前面最近的 h2
      titles: level === '3' && lastH2 ? [lastH2] : [],
      html: html.slice(start + cur[0].length, next ? next.index : html.length)
    });
  }
  return segments;
}

/**
 * 递归收集 nav 里的字符串 link, 保持配置顺序 (与 useSections 同口径:
 * 页面渲染哪些区块, 语料就收哪些, 不多不少)。
 * 两处必须过滤: link 允许是函数 (拿不到 payload 无法求值) → 跳过; 分组项的目标在 items 里 → 下钻。
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
 * 扫描全部聚合区块, 产出 `页面 url (带 .html) → 切段` 的语料表。
 * 返回 ref: 语料在挂载后才就绪、且 dev 下热更新会重扫, 消费方 (搜索弹层) 据此重建索引。
 * 键的形状与 minisearch 文档 id ('<url>#<anchor>') 的前半段对齐, 摘要按命中 url 回查。
 */
export function useSearchCorpus(): Ref<SearchCorpus> {
  const corpus = ref<SearchCorpus>(new Map());
  const { frontmatter } = useData();
  const { theme } = useData();

  function scan(): void {
    const links: string[] = [];
    collectLinks(theme.value.spd?.nav?.[frontmatter.value.nav] ?? [], links);
    const next: SearchCorpus = new Map();
    for (const link of links) {
      // 区块未渲染 (独立路由页/非聚合页) 时 getElementById 为 null, 该页不进语料
      const root = document.getElementById(sectionId(link));
      if (!root) {
        continue;
      }
      next.set(`${normalized(link)}.html`, sliceSection(root, link));
    }
    corpus.value = next;
  }

  onMounted(scan);
  // 热更新后正文会重新渲染, 等 DOM 落地再扫
  onContentUpdated(() => {
    void nextTick(scan);
  });

  return corpus;
}
