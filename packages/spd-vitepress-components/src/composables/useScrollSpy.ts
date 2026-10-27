/**
 * 滚动跟随 (职责对齐 VP 的 composables/outline.ts useActiveAnchor):
 * 监听滚动 (节流+防抖 100ms, 与 VP 同参), 输出当前区块 (SPDNav 高亮)
 * 与当前标题 (大纲高亮)。与 VP 官方一致: 滚动只改高亮, 不动地址栏 ——
 * hash 只由点击 / 前进后退 / 直链进入写入, 滚动跟随不参与。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import type { OutlineMap, RenderedSection } from '../_types';
import { measureNavHeight, normalized, sectionId } from '../utils/nav';
import { onNavSignal } from '../utils/navSignal';

/** 节流+防抖二合一 (照抄 VP src/client/support/utils.ts) */
function throttleAndDebounce(fn: () => void, delay: number): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastCall = 0;
  return () => {
    const now = Date.now();
    if (now - lastCall < delay) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = now;
        fn();
      }, delay - (now - lastCall));
    }
    else {
      lastCall = now;
      fn();
    }
  };
}

/** 程序化跳转的兜底时长: 目标已在线上 / 浏览器不支持 scrollend 时, 到点强制交还几何判定 */
const NAV_FALLBACK_DELAY = 600;

export function useScrollSpy(
  rendered: Ref<RenderedSection[]>,
  outline: Ref<OutlineMap>
): { activeSection: Ref<string>, activeHeading: Ref<string> } {
  const activeSection = ref('');
  const activeHeading = ref('');

  /**
   * 视口判定线 = 顶栏实测高度。断点切换会改顶栏高度, resize 时重测。
   * 跳转落点由 CSS scroll-margin-top 避让同一高度, 但几何判定只在手动滚动时使用,
   * 跳转期间的高亮由 hash 直接决定, 不依赖这条线。
   */
  const spyOffset = ref(0);

  /**
   * 程序化跳转进行中: 高亮以 location.hash 为准, 期间忽略几何判定 ——
   * 落点正好压在判定线上, 几何结果可能差一个区块, 而点击意图是明确的。
   */
  let navigating = false;
  let navTimer: ReturnType<typeof setTimeout> | undefined;
  let offNavSignal: (() => void) | undefined;

  /** location.hash 的 id (浏览器会把中文等非 ASCII 的标题 id 转成百分号编码) */
  function hashId(): string {
    const raw = location.hash.replace(/^#/, '');
    try {
      return decodeURIComponent(raw);
    }
    catch {
      return raw;
    }
  }

  /** 按 hash 直接定高亮: 区块 id → 该区块; 标题 id → 所属区块 + 该标题 */
  function applyByHash(): void {
    const id = hashId();
    if (!id) {
      activeSection.value = '';
      activeHeading.value = '';
      return;
    }
    const sec = rendered.value.find((s) => sectionId(s.url) === id);
    if (sec) {
      activeSection.value = normalized(sec.url);
      activeHeading.value = '';
      return;
    }
    const host = document.getElementById(id)?.closest('.SPDSection');
    const owner = host ? rendered.value.find((s) => sectionId(s.url) === host.id) : undefined;
    if (owner) {
      activeSection.value = normalized(owner.url);
      activeHeading.value = id;
    }
  }

  /** 交还几何判定: 平滑滚动结束 (scrollend) 或兜底超时 */
  function endNavigate(): void {
    navigating = false;
    clearTimeout(navTimer);
    window.removeEventListener('scrollend', endNavigate);
  }

  /** 收到跳转信号: 立即按 hash 定高亮, 并挂上结束监听 */
  function startNavigate(): void {
    navigating = true;
    applyByHash();
    clearTimeout(navTimer);
    window.removeEventListener('scrollend', endNavigate);
    window.addEventListener('scrollend', endNavigate, { once: true });
    navTimer = setTimeout(endNavigate, NAV_FALLBACK_DELAY);
  }

  function update(): void {
    // 程序化跳转期间以 hash 为准, 几何判定在落点边界上不可靠。
    // 期间收到滚动事件说明平滑滚动还没结束, 把兜底计时器往后推 (scrollend 不可用时的退路)
    if (navigating) {
      clearTimeout(navTimer);
      navTimer = setTimeout(endNavigate, NAV_FALLBACK_DELAY);
      return;
    }
    // 视口顶部已越过的最后一个区块 (SPDNav 高亮), 顺便记下该区块供下方 heading 扫描复用
    let current = '';
    let currentSec = rendered.value[0];
    for (const s of rendered.value) {
      const el = document.getElementById(sectionId(s.url));
      if (el && el.getBoundingClientRect().top <= spyOffset.value) {
        current = normalized(s.url);
        currentSec = s;
      }
    }
    // 已滚到页底时强制取最后一个区块: 末尾区块可能永远滚不到 top<=88, 否则高亮停在上一项
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      const last = rendered.value.at(-1);
      if (last) {
        current = normalized(last.url);
        currentSec = last;
      }
    }
    activeSection.value = current;

    // 当前区块内最后一个越线的标题 (大纲高亮)。
    // 标题清单来自 useOutlineFromDom 对当前区块 DOM 的实测结果, 按区块 url 取。
    const headings = currentSec ? outline.value[normalized(currentSec.url)] ?? [] : [];
    let heading = '';
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el && el.getBoundingClientRect().top <= spyOffset.value) {
        heading = h.id;
      }
    }
    activeHeading.value = heading;
  }

  const onScroll = throttleAndDebounce(update, 100);

  /** 顶栏高度随断点变化, 判定线要跟着重测 (resize 与首测走同一条路径) */
  function syncOffset(): void {
    spyOffset.value = measureNavHeight();
  }

  function onResize(): void {
    syncOffset();
    onScroll();
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    // 子组件先于父组件 mounted: 这里订阅早于 useHashRoute 的直链首次跳转
    offNavSignal = onNavSignal(startNavigate);
    syncOffset();
    update();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    offNavSignal?.();
    endNavigate();
  });

  return { activeSection, activeHeading };
}
