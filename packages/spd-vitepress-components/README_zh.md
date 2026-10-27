# spd-vitepress-components

[![npm package](https://nodei.co/npm/spd-vitepress-components.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/spd-vitepress-components)

[English](https://github.com/fengxinming/babel-plugin-jsx-advanced/blob/main/packages/spd-vitepress-components/README.md) | 简体中文

VitePress 单页文档主题：把多页 md 聚合到同一页，配左侧区块导航、右侧大纲、本地搜索与通用首屏。

## 安装

```bash
pnpm add -D spd-vitepress-components
```

需要 VitePress 2.0 alpha。

## 使用

主题入口：

```ts
import 'spd-vitepress-components/style.css';
import DefaultTheme from 'vitepress/theme';
import { SPDPage } from 'spd-vitepress-components';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('SPDPage', SPDPage);
  }
};
```

站点配置：

```ts
import { defineConfig } from 'vitepress';
import spd from 'spd-vitepress-components/config';
import type { SPDConfig } from 'spd-vitepress-components';

export default defineConfig<SPDConfig>({
  extends: spd,
  themeConfig: {
    spd: {
      search: { provider: 'local' },
      nav: {
        'my-docs': [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '配置', link: '/guide/configuration' }
        ]
      }
    }
  }
});
```

首页 `index.md`：

```yaml
---
layout: SPDPage
nav: my-docs
cta: true
intro:
  layout: split
  eyebrow: 组件文档
  title:
    lead: 组件名
    rest: 一句话定位
  tagline: 更长的说明，一两行即可。
  actions:
    - text: 快速开始
      link: /guide/getting-started
      theme: brand
    - text: 配置
      link: /guide/configuration
      theme: alt
  media:
    type: code
    title: demo.tsx
    tabs:
      - name: 输入
        code: |
          <div />
      - name: 产物
        code: |
          <div />
  cards:
    - icon: "#"
      title: 能力一
      desc: 卡片说明
  extra:
    - type: install
      label: pnpm
      command: pnpm add my-package
    - type: chips
      items: [零运行时, TypeScript]
---
```

## frontmatter

| 字段 | 说明 |
| --- | --- |
| `layout: SPDPage` | 整页接管内容区：首屏 + 聚合区块 + 右下回顶 |
| `nav` | 指定 `themeConfig.spd.nav` 的 key；不填则只渲染首屏，不聚合正文 |
| `intro` | 通用首屏配置，不填则整块不渲染 |
| `cta` | `true` 或 `{ title }`，右下角浮动回顶按钮 |

## intro

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `layout` | `'split' \| 'centered' \| 'stacked'` | 排布，默认 `split` |
| `eyebrow` | `string` | 标题上方小字 |
| `title` | `{ lead?, rest? }` | `lead` 走品牌渐变 |
| `tagline` | `string` | 副标题 |
| `actions` | `{ text, link, theme? }[]` | 按钮，`theme` 为 `brand` / `alt` |
| `media` | `image` / `code` / `component` | 媒体区；`code` 支持多标签页 |
| `cards` | `{ icon?, title, desc }[]` | 能力卡 |
| `extra` | `chips` / `install` / `stats` / `links` 数组 | 附加带，按顺序渲染 |

`SPDIntro` 可单独引入，用 `intro-media` / `intro-actions` / `intro-extra` / `intro-after` 插槽覆盖对应区域。

## themeConfig.spd

| 字段 | 说明 |
| --- | --- |
| `nav` | `Record<pageKey, NavItem[]>`，每个 key 是一页的区块清单与顺序 |
| `search` | `provider: 'local'` 时启用内置本地搜索，其余参数同 VitePress `search` |

## API

| 导出 | 说明 |
| --- | --- |
| `SPDPage` | 单页布局（页面写 `layout: SPDPage`） |
| `SPDIntro` | 通用首屏，可插槽定制 |
| `SPDNavBarSearch` | 顶栏本地搜索框（`spd.search.provider: 'local'` 时生效） |
| `useSectionData` / `SECTION_DATA_KEY` | 聚合区块内的页面数据（frontmatter / relativePath） |
| `spd-vitepress-components/config` | 预置配置（本地搜索、默认深色） |
| `spd-vitepress-components/style.css` | 样式入口 |

## 样式

配色与尺寸全部走 `--spd-*` CSS 变量（如 `--spd-c-brand-1`、`--spd-doc-max-width`），在站点样式里覆盖同名变量即可换肤。
