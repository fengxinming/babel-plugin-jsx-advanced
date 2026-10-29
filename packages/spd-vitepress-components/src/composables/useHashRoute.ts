/**
 * hash 路由 (职责收敛自散落各处的 scrollTo*, 对齐 VP router 的定位):
 * - 点击导航/大纲/正文锚点: pushState 写地址栏 + 平滑滚动 (后退可逐锚点回放)
 * - 浏览器后退/前进: popstate 按目标 hash 补定位 (pushState 不产生原生滚动)
 * - 刷新/直链进入: scrollRestoration=manual 显式接管, mounted 后平滑定位
 *   (与浏览器原生 fragment 导航同向同终点, 二者叠加无感知; 用 'instant' 会
 *   半路掐断原生平滑动画, 表现为"先在首页闪一下再跳到锚点")
 */
import { nextTick, onBeforeUnmount, onMounted } from 'vue';
import { notifyNavSignal } from '../utils/navSignal';

/** hash → 滚动。'#id'/'id' 滚到元素 (顶栏避让由 CSS scroll-margin-top 负责), 空串滚到顶部。 */
function scrollToHash(hash: string, behavior: ScrollBehavior): void {
  // 先广播: 滚动跟随据此改用 hash 定高亮, 不再依赖落点处的几何判定
  notifyNavSignal();
  const id = hash.replace(/^#/, '');
  if (!id) {
    window.scrollTo({ top: 0, behavior });
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
}

/**
 * 哈希定位入口: 目标区块由 SPDSections 异步渲染, 由 SPDPage 的 <Suspense> 兜底;
 * 在 Suspense resolve 之后调用本函数, 此时 section 已挂载, 可直接定位。
 */
export function scrollToHashNow(hash: string): void {
  if (hash) {
    nextTick(() => scrollToHash(hash, 'smooth'));
  }
}

/**
 * 程序化导航: 写地址栏 + 平滑滚动。入参 '#foo' / 'foo' 均可 (内部归一化,
 * 避免 anchor.hash 自带 '#' 时拼出 ##foo 双 hash); 传空串 = 回顶部并清掉地址栏 hash。
 */
export function navigateTo(hash: string): void {
  if (!hash || hash === '#') {
    history.pushState(null, '', location.pathname);
    scrollToHash('', 'smooth');
    return;
  }
  const target = hash.startsWith('#') ? hash : `#${hash}`;
  history.pushState(null, '', target);
  scrollToHash(target, 'smooth');
}

/**
 * 路由宿主 (只在 Layout 安装一次): document 级锚点点击委托 + popstate + 初始定位。
 * 其余组件不装监听, 程序化跳转直接 import navigateTo。
 */
export function useHashRoute(): void {
  /** 正文 <a href="#..."> (VP header-anchor / transformLinks 产物): 原生 href 语义保留, 点击这里接管 */
  function onDocClick(e: MouseEvent): void {
    const target = e.target instanceof HTMLElement ? e.target : null;
    const anchor = target?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!anchor) {
      return;
    }
    e.preventDefault();
    navigateTo(anchor.hash);
  }

  function onPopState(): void {
    scrollToHash(location.hash, 'smooth');
  }

  onMounted(() => {
    history.scrollRestoration = 'manual';
    document.addEventListener('click', onDocClick);
    window.addEventListener('popstate', onPopState);
    // 刷新/直链进入: 有 nav 的页由 Suspense resolve 兜底定位, 这里覆盖无区块的页。
    // 'smooth' 与原生的 CSS smooth fragment 动画同向叠加, 不会像 'instant'
    // 那样半路掐断动画产生闪跳; 滚动结束由 scrollSpy 防抖 flush 同值短路
    if (location.hash) {
      scrollToHashNow(location.hash);
    }
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocClick);
    window.removeEventListener('popstate', onPopState);
  });
}
