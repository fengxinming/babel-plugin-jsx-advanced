/**
 * 右侧大纲的数据源: 从**渲染后的 DOM** 读取每个聚合区块的 h2/h3。
 *
 * 为什么读 DOM 而不是读数据:
 * - md 编译产物的 `__pageData.headers` 实测恒为空 (headersPlugin 写的是 md.renderAsync 内部的
 *   env 副本, 外层拿不到), 拿不到标题数据;
 * - 正文既然已作为真组件渲染进 DOM, 直接量真实结果比再开一份 node 端数据源更可靠
 *   (省掉"构建期再渲染一遍全站 md 出 HTML"那条链路; 搜索语料走同一口径, 见 useSearchCorpus)。
 * 标题 id 由 markdown-it-anchor 生成 (编译产物里 h1 已带 header-anchor 链接与 href="#..."), DOM 里必然存在。
 *
 * 时机: 区块是异步加载完才渲染的, setup 期 DOM 还不存在, 故在 mounted 后扫描;
 * md 内容热更新时经 VP 的 onContentUpdated 重扫 (dev 下改标题不必刷页)。
 */
import { nextTick, onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import { onContentUpdated } from 'vitepress';
import { normalized, sectionId } from '../utils/nav';
import type { OutlineMap, RenderedSection, SectionHeading } from '../_types';

/** 取区块根元素内的 h2/h3 (只认带 id 的, 与 VP 大纲口径一致)。
 *  文本先摘掉 VP 的 header-anchor 链接 —— 它内含零宽字符, 不摘会污染大纲文字。 */
function readHeadings(root: HTMLElement): SectionHeading[] {
  return [...root.querySelectorAll<HTMLElement>('h2[id], h3[id]')].map((el) => {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelector('.header-anchor')?.remove();
    return {
      id: el.id,
      depth: el.tagName === 'H2' ? 2 : 3,
      text: (clone.textContent ?? '').trim()
    };
  });
}

/**
 * 扫描全部区块, 产出 `区块 url → 标题清单` 的映射。
 * 返回整个映射而非按区块拆分: 右侧大纲要随 activeSection 切换, 需要一次拿到所有区块的大纲。
 */
export function useOutlineFromDom(rendered: Ref<RenderedSection[]>): Ref<OutlineMap> {
  const outline = ref<OutlineMap>({});

  function scan(): void {
    const next: OutlineMap = {};
    for (const s of rendered.value) {
      const root = document.getElementById(sectionId(s.url));
      next[normalized(s.url)] = root ? readHeadings(root) : [];
    }
    outline.value = next;
  }

  onMounted(scan);
  // 热更新后正文会重新渲染, 标题可能增删改, 等 DOM 落地再扫
  onContentUpdated(() => {
    void nextTick(scan);
  });

  return outline;
}
