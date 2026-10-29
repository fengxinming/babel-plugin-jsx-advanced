<script setup lang="ts">
// 在线调试: 一份覆盖全部指令形态的综合示例 → 调本地 babel-plugin-jsx-advanced 真 transform → 右侧看 JSX 产物。
// 上方「配置」面板可改 prefix / locale / 各指令的启停与名字; 改完点「转换」才重新编译, 指令改名后需自行同步示例里的旧名字。
// transform 异常时把错误信息直接填到下方输出框 (替换正常输出), 输入区继续可编辑。
// 用 @babel/standalone (浏览器版 babel, 不依赖 Node 内置) + 接本地插件源码 (vite alias).
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, type ViewUpdate } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { transform as babelTransform } from '@babel/standalone';
import jsxAdvancedPlugin from 'babel-plugin-jsx-advanced';
import type { PluginOptions } from 'babel-plugin-jsx-advanced';
import prettier from 'prettier/standalone';
import babelPlugin from 'prettier/plugins/babel';
import estreePlugin from 'prettier/plugins/estree';
import { VPButton } from 'vitepress/theme';

/**
 * 初始示例: 一份代码覆盖属性位与标签位的全部内置指令, 并包含 if / for 互相嵌套。
 * 属性位: x-for / x-if / x-elif / x-else / x-show / x-class / x-html;
 * 标签位: <for> / <if> / <elif> / <else>。
 * 嵌套: for 里套 if 再套 for、if 里套 for、标签位 if 套 for 与 for 套 if。
 * 编辑或改配置后, 可通过「重置示例」回到这里。
 */
const INITIAL_CODE = `const Demo = ({ list, groups, visible, isActive, disabled, richContent, a, b }) => (
  <section className="panel" x-class={{ active: isActive, disabled }}>
    <section key={gi} x-for={(group, gi) in groups}>
      <h3>{group.title}</h3>
      <ul x-if={group.active}>
        <li key={i} x-for={(item, i) in group.items}>{item}</li>
      </ul>
      <p x-else>empty</p>
    </section>
    <div x-if={a}>
      <span key={i} x-for={(item, i) in list}>{item}</span>
    </div>
    <if value={b}>
      <for value={(item, i) in list}>
        <span key={i}>{item}</span>
      </for>
    </if>
    <for value={(group, gi) in groups}>
      <if value={group.active}>
        <b>{group.title}</b>
      </if>
    </for>
    <p x-show={visible}>visible</p>
    <div x-html={richContent} />
    <p x-if={a}>A</p>
    <p x-elif={b}>B</p>
    <p x-else>C</p>
  </section>
);
`;

type EntryKind = 'for' | 'if' | 'elif' | 'else' | 'show' | 'class' | 'html';

/** 面板里的一行: 一个内置指令 + 属性位 / 标签位 */
interface EntryForm {
  key: string;
  position: 'tag' | 'attribute';
  kind: EntryKind;
  enabled: boolean;
  /** 逗号或空格分隔; 留空 = 用默认名 */
  names: string;
  /** 仅属性位使用; 留空 = 用内置默认序 */
  priority: string;
}

/** 内置清单: 属性位 7 个 + 标签位 4 个, 与文档的顺序一致 */
const rows = reactive<EntryForm[]>([
  { key: 'attribute-for', position: 'attribute', kind: 'for', enabled: true, names: '', priority: '' },
  { key: 'attribute-if', position: 'attribute', kind: 'if', enabled: true, names: '', priority: '' },
  { key: 'attribute-elif', position: 'attribute', kind: 'elif', enabled: true, names: '', priority: '' },
  { key: 'attribute-else', position: 'attribute', kind: 'else', enabled: true, names: '', priority: '' },
  { key: 'attribute-show', position: 'attribute', kind: 'show', enabled: true, names: '', priority: '' },
  { key: 'attribute-class', position: 'attribute', kind: 'class', enabled: true, names: '', priority: '' },
  { key: 'attribute-html', position: 'attribute', kind: 'html', enabled: true, names: '', priority: '' },
  { key: 'tag-for', position: 'tag', kind: 'for', enabled: true, names: '', priority: '' },
  { key: 'tag-if', position: 'tag', kind: 'if', enabled: true, names: '', priority: '' },
  { key: 'tag-elif', position: 'tag', kind: 'elif', enabled: true, names: '', priority: '' },
  { key: 'tag-else', position: 'tag', kind: 'else', enabled: true, names: '', priority: '' }
]);

const prefix = ref('x-');
const locale = ref<NonNullable<PluginOptions['locale']>>('zh-CN');

/** 逗号 / 空格分隔的名字输入; 空输入 = 用默认名 */
function parseNames(raw: string): string[] {
  return raw.split(/[,，\s]+/).map((item) => item.trim()).filter(Boolean);
}

/** 某一行在给定前缀下的默认主名: 标签位不带前缀 */
function defaultMain(row: EntryForm, prefixValue = prefix.value): string {
  return row.position === 'tag' ? row.kind : `${prefixValue}${row.kind}`;
}

/** if 分支 (elif / else): 名字独立, 启用状态跟随同位置的 if 行 */
function isBranch(row: EntryForm): boolean {
  return row.kind === 'elif' || row.kind === 'else';
}

/** 取同位置、同 kind 的面板行 (elif / else 跟着 if 走) */
function findRow(position: EntryForm['position'], kind: EntryKind): EntryForm | undefined {
  return rows.find((row) => row.position === position && row.kind === kind);
}

/** 内置默认优先级: 数值越小越先执行, 标签位与属性位同表 */
function defaultPriority(row: EntryForm): string {
  const priorities: Partial<Record<EntryKind, number>> = { for: 0, if: 1, show: 2, class: 3, html: 4 };
  const priority = priorities[row.kind];
  return priority === undefined ? '' : String(priority);
}

/** 面板一行 → 标签位条目: 只认 name */
function buildTagEntry(row: EntryForm): false | { name?: string[] } {
  if (!row.enabled) return false;
  const names = parseNames(row.names);
  return names.length ? { name: names } : {};
}

/** 面板一行 → 普通属性位条目: name + priority */
function buildAttributeEntry(row: EntryForm): false | { name?: string[]; priority?: number } {
  if (!row.enabled) return false;
  const entry: { name?: string[]; priority?: number } = {};
  const names = parseNames(row.names);
  if (names.length) entry.name = names;
  const priority = Number(row.priority);
  if (row.priority.trim() && Number.isFinite(priority)) entry.priority = priority;
  return entry;
}

/** 面板一行 → if 条目: name + elif + else, 属性位再带 priority */
function buildIfEntry(row: EntryForm): false | { name?: string[]; priority?: number; elif?: string[]; else?: string[] } {
  if (!row.enabled) return false;
  const entry: { name?: string[]; priority?: number; elif?: string[]; else?: string[] } = {};
  const names = parseNames(row.names);
  if (names.length) entry.name = names;
  if (row.position === 'attribute' && row.priority.trim()) {
    const priority = Number(row.priority);
    if (Number.isFinite(priority)) entry.priority = priority;
  }
  const elif = parseNames(findRow(row.position, 'elif')?.names ?? '');
  const elseNames = parseNames(findRow(row.position, 'else')?.names ?? '');
  if (elif.length) entry.elif = elif;
  if (elseNames.length) entry.else = elseNames;
  return entry;
}

/** 面板 → PluginOptions: 未填的字段不写, 让插件用自己的默认值 */
function buildOptions(): PluginOptions {
  const tags: NonNullable<PluginOptions['tags']> = {};
  const attributes: NonNullable<PluginOptions['attributes']> = {};
  for (const row of rows) {
    // elif / else 是 if 的分支, 名字并进 if 条目, 不单独出条目
    if (isBranch(row)) continue;
    if (row.position === 'tag') {
      if (row.kind === 'for') tags.for = buildTagEntry(row);
      else if (row.kind === 'if') tags.if = buildIfEntry(row);
    }
    else if (row.kind === 'for') attributes.for = buildAttributeEntry(row);
    else if (row.kind === 'if') attributes.if = buildIfEntry(row);
    else if (row.kind === 'show') attributes.show = buildAttributeEntry(row);
    else if (row.kind === 'class') attributes.class = buildAttributeEntry(row);
    else attributes.html = buildAttributeEntry(row);
  }
  return { prefix: prefix.value, tags, attributes, locale: locale.value };
}

/** 面板里的指令显示名: 标签位加尖括号, 属性位直接显示 kind */
function rowLabel(row: EntryForm): string {
  return row.position === 'tag' ? `<${row.kind}>` : row.kind;
}

const inputRef = ref<HTMLDivElement | null>(null);
const outputRef = ref<HTMLDivElement | null>(null);

let inputView: EditorView | null = null;
let outputView: EditorView | null = null;
let debounceTimer: number | null = null;

function makeState(doc: string, readOnly: boolean, onUpdate?: (u: ViewUpdate) => void): EditorState {
  return EditorState.create({
    doc,
    extensions: [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      javascript({ jsx: true }),
      oneDark,
      EditorView.editable.of(!readOnly),
      EditorState.readOnly.of(readOnly),
      EditorView.theme({
        '&': { fontSize: '13px', height: '100%' },
        '.cm-scroller': { fontFamily: "'JetBrains Mono', ui-monospace, monospace" }
      }),
      // 输入编辑器: 监听 docChanged 触发 debounce 后的 transform; 输出编辑器不需要
      ...(onUpdate ? [EditorView.updateListener.of(onUpdate)] : [])
    ]
  });
}

async function runTransform(code: string): Promise<string> {
  try {
    // 面板配置每次实时构造成 PluginOptions, 以 [plugin, options] 元组交给 babel
    const options = buildOptions();
    // 对齐 packages/demo/scripts/transform.js: parserOpts 让 babel parser 识别 JSX 字面量;
    // babel generator 默认输出未格式化, 用 prettier 格式化; 输出仍是 JSX 字面量 (jsx→jsx)
    const out = babelTransform(code, {
      filename: 'playground.jsx',
      babelrc: false,
      configFile: false,
      // 直接传插件函数: babel 会把元组里的 options 作为第二个参数交给插件,
      // 不能再套一层只声明 api 的箭头函数, 否则配置会被丢掉
      plugins: [[jsxAdvancedPlugin, options]],
      parserOpts: { plugins: ['jsx'] }
    });
    return await prettier.format(out?.code ?? '', {
      parser: 'babel',
      plugins: [babelPlugin, estreePlugin]
    });
  } catch (e) {
    // 错误直接抛回调用方, 由 refreshOutput 塞到下方输出框 (替换正常输出)
    throw e instanceof Error ? e : new Error(String(e));
  }
}

function replaceDoc(view: EditorView, text: string): void {
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
}

/** 回到覆盖全部指令形态的初始示例 */
function resetCode(): void {
  if (!inputView) return;
  replaceDoc(inputView, INITIAL_CODE);
  void refreshOutput();
}

async function refreshOutput(): Promise<void> {
  if (!inputView || !outputView) return;
  try {
    const out = await runTransform(inputView.state.doc.toString());
    outputWrap.value?.classList.remove('has-error');
    replaceDoc(outputView, out);
  } catch (e) {
    // 错误直接填到下方输出框, 让用户一眼看到
    outputWrap.value?.classList.add('has-error');
    replaceDoc(outputView, `/* Transform failed:\n${e instanceof Error ? e.message : String(e)}\n*/`);
  }
}

function scheduleRefresh(): void {
  if (debounceTimer !== null) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(refreshOutput, 200);
}

const outputWrap = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (!inputRef.value || !outputRef.value) return;
  inputView = new EditorView({
    state: makeState(INITIAL_CODE, false, (u) => {
      // 输入变化时 debounce 200ms 再 transform, 避免每次按键都跑 babel
      if (u.docChanged) scheduleRefresh();
    }),
    parent: inputRef.value
  });
  outputView = new EditorView({
    state: makeState('', true),
    parent: outputRef.value
  });
  refreshOutput().catch(() => { });
});

onBeforeUnmount(() => {
  if (debounceTimer !== null) window.clearTimeout(debounceTimer);
  inputView?.destroy();
  outputView?.destroy();
});
</script>

<template>
  <div class="playground">
    <div class="toolbar">
      <span class="toolbar-hint">综合示例覆盖属性位与标签位全部指令，改配置后点「转换」观察产物</span>
      <button type="button" class="reset-btn" @click="resetCode">重置示例</button>
    </div>
    <details class="settings" open>
      <summary>配置（prefix / locale / 指令名）</summary>
      <div class="settings-body">
        <label class="field">
          <span class="field-label">prefix</span>
          <input v-model="prefix" class="field-input" placeholder="x-">
        </label>
        <label class="field">
          <span class="field-label">locale</span>
          <select v-model="locale" class="field-input">
            <option value="zh-CN">zh-CN</option>
            <option value="en-US">en-US</option>
          </select>
        </label>
        <table class="settings-table">
          <thead>
            <tr>
              <th>启用</th>
              <th>指令</th>
              <th>名字（逗号分隔）</th>
              <th>priority</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <td>
                <!-- elif / else 没有独立开关, 勾选状态跟随所属 if -->
                <input v-if="!isBranch(row)" v-model="row.enabled" type="checkbox">
              </td>
              <td class="directive-cell">{{ rowLabel(row) }}</td>
              <td>
                <input v-model="row.names" class="field-input" :placeholder="defaultMain(row)">
              </td>
              <td>
                <input v-model="row.priority" class="field-input priority-input"
                  :disabled="row.position !== 'attribute' || isBranch(row)" :placeholder="defaultPriority(row)">
              </td>
            </tr>
          </tbody>
        </table>
        <VPButton @click="refreshOutput()">转换</VPButton>
      </div>
    </details>
    <div class="editors">
      <div class="pane">
        <div class="pane-label">JSX (输入)</div>
        <div ref="inputRef" class="editor" />
      </div>
      <div ref="outputWrap" class="pane output-wrap">
        <div class="pane-label">JSX (输出)</div>
        <div ref="outputRef" class="editor" />
      </div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>

.playground
  background var(--spd-c-bg-playground)
  border 1px solid var(--spd-c-border-playground)
  border-radius var(--spd-radius-md)
  overflow hidden
  font-family var(--spd-font-family-mono)

.toolbar
  display flex
  align-items center
  justify-content space-between
  gap 12px
  padding 8px 12px
  border-bottom 1px solid var(--spd-c-border-playground)

.toolbar-hint
  font-size 12px
  color var(--spd-c-text-5)

.reset-btn
  padding 4px 12px
  border-radius var(--spd-radius-pill)
  background var(--spd-chip-bg)
  border 1px solid transparent
  color var(--spd-c-text-6)
  font inherit
  font-size 12px
  cursor pointer
  transition all 0.15s ease

.reset-btn:hover
  color var(--spd-c-brand-1)

.settings
  border-bottom 1px solid var(--spd-c-border-playground)

.settings summary
  padding 8px 12px
  font-size 12px
  color var(--spd-c-text-5)
  cursor pointer
  user-select none

.settings-body
  display flex
  flex-wrap wrap
  align-items center
  gap 10px
  padding 0 12px 12px

.field
  display flex
  align-items center
  gap 6px

.field-label
  font-size 12px
  color var(--spd-c-text-5)

.field-input
  padding 4px 8px
  border 1px solid var(--spd-c-border-playground)
  border-radius var(--spd-radius-md)
  background var(--spd-c-bg-elv)
  color var(--spd-c-text-6)
  font inherit
  font-size 12px

.field-input:disabled
  opacity 0.45

.settings-table
  width 100%
  border-collapse collapse
  font-size 12px

.settings-table th,
.settings-table td
  padding 4px 6px
  text-align left
  border-bottom 1px solid var(--spd-c-border-playground)
  color var(--spd-c-text-5)

.settings-table th
  font-weight normal
  text-transform uppercase
  letter-spacing 0.06em

.settings-table .field-input
  width 100%
  min-width 84px

.priority-input
  max-width 70px

.directive-cell
  white-space nowrap
  font-family var(--spd-font-family-mono)

.editors
  display grid
  grid-template-columns 1fr 1fr
  grid-template-rows 1fr
  min-height 360px

.pane
  display flex
  flex-direction column
  min-width 0
  min-height 0

.pane + .pane
  border-top none
  border-left 1px solid var(--spd-c-border-playground)

.output-wrap
  /* transform 失败时由 JS 加 .has-error, 给边框 + 背景换红色提示 */
  transition background-color 0.15s ease, border-color 0.15s ease

.output-wrap:deep(.cm-editor.has-error),
.output-wrap.has-error
  background var(--spd-err-bg)

.pane-label
  padding 6px 12px
  font-size 11px
  letter-spacing 0.08em
  color var(--spd-c-text-5)
  text-transform uppercase
  border-bottom 1px solid var(--spd-c-border-playground)
  background var(--spd-c-bg-elv)

.editor
  flex 1
  min-height 0
  overflow hidden

.editor :deep(.cm-editor)
  height 100%

.editor :deep(.cm-scroller)
  overflow auto
</style>