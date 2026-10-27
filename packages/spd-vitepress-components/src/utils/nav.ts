/**
 * 单页站导航的纯函数集合 (职责对齐 VP 的 support/utils):
 * hash 推导与 HTML 实体解码。无响应式状态, 不碰history。
 * 不在这里的两件事:
 * - 区块组装 (把 nav 指向的 md 加载成组件) 在 composables/useSections —— 异步模块加载;
 * - 大纲提取在 composables/useOutlineFromDom —— 读 DOM 的副作用。
 * 两者都不同层, 故不放进本文件。
 * 滚动执行统一由 composables/useHashRoute 接管。
 */

/** 顶栏高度兜底值 (VP --vp-nav-height 默认 4rem; 拿不到 DOM 时用) */
const NAV_HEIGHT_FALLBACK = 64;

/**
 * 实测顶栏高度: .VPNavBar 的样式就是 height: var(--vp-nav-height) (VP 源码实证),
 * 是断点变量 (:root 4rem / .hide-nav 0px), 所以只能运行时量, 不能写死。
 * 必须在 onMounted 后调 (挂载前 DOM 尚未渲染); 量不到 (SSR/非常规结构) 时兜底 64。
 * 注意: getComputedStyle 读自定义属性拿到的是声明 token (如 '4rem'), 不是 px, 故走 DOM 实测。
 */
export function measureNavHeight(): number {
  const bar = document.querySelector('.VPNavBar');
  return bar?.getBoundingClientRect().height || NAV_HEIGHT_FALLBACK;
}

/**
 * '/guide/getting-started' → 'getting-started'
 * 与渲染出的 <section id="..."> 一致。
 */
export function sectionId(link: string): string {
  return link.replace(/\.html$/, '').split('/').pop() || link;
}

/** loader 产物的 url 带 .html 后缀, 与 config nav 的 link 对齐比较时用 */
export function normalized(url: string): string {
  return url.replace(/\.html$/, '');
}

/**
 * nav link → 页内锚点 hash: '/' → '#top' (Hero 顶屏); '/guide/foo' → '#foo'; '#a' → '#a'。
 * 产出真实 href (可中键/可复制), 点击由 useHashRoute 的 document 级委托接管为平滑滚动。
 */
export function hashFor(link: string): string {
  if (!link || link === '/') {
    return '#top';
  }
  return `#${link.startsWith('#') ? link.slice(1) : sectionId(link)}`;
}

/** HTML 实体解码 + 剥零宽字符: VP 渲染产物里含 &#8203; 等数值实体, 不解码会在大纲里显示成字面乱码 */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);|&#(\d+);/g, (_, hex: string, dec: string) => {
      const code = parseInt(hex ?? dec, hex ? 16 : 10);
      return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, e: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[e] ?? `&${e};`)
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}
