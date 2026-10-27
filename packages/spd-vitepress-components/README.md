# spd-vitepress-components

[![npm package](https://nodei.co/npm/spd-vitepress-components.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/spd-vitepress-components)

English | [简体中文](https://github.com/fengxinming/babel-plugin-jsx-advanced/blob/main/packages/spd-vitepress-components/README_zh.md)

A VitePress single-page docs theme: it aggregates multiple markdown pages into one page, with a left section nav, a right outline, local search, and a generic hero.

## Installation

```bash
pnpm add -D spd-vitepress-components
```

Requires VitePress 2.0 alpha.

## Usage

Theme entry:

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

Site config:

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
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Configuration', link: '/guide/configuration' }
        ]
      }
    }
  }
});
```

Home page `index.md`:

```yaml
---
layout: SPDPage
nav: my-docs
cta: true
intro:
  layout: split
  eyebrow: Component docs
  title:
    lead: Component name
    rest: one-line positioning
  tagline: A longer description, one or two lines is enough.
  actions:
    - text: Getting Started
      link: /guide/getting-started
      theme: brand
    - text: Configuration
      link: /guide/configuration
      theme: alt
  media:
    type: code
    title: demo.tsx
    tabs:
      - name: Input
        code: |
          <div />
      - name: Output
        code: |
          <div />
  cards:
    - icon: "#"
      title: Capability one
      desc: Card description
  extra:
    - type: install
      label: pnpm
      command: pnpm add my-package
    - type: chips
      items: [Zero runtime, TypeScript]
---
```

## Frontmatter

| Field | Description |
| --- | --- |
| `layout: SPDPage` | Takes over the whole content area: hero + aggregated sections + back-to-top button at the bottom right |
| `nav` | Key of `themeConfig.spd.nav`; when omitted, only the hero is rendered and no content is aggregated |
| `intro` | Generic hero config; when omitted, the whole block is not rendered |
| `cta` | `true` or `{ title }`, floating back-to-top button at the bottom right |

## intro

| Field | Type | Description |
| --- | --- | --- |
| `layout` | `'split' \| 'centered' \| 'stacked'` | Layout, `split` by default |
| `eyebrow` | `string` | Small text above the title |
| `title` | `{ lead?, rest? }` | `lead` uses the brand gradient |
| `tagline` | `string` | Subtitle |
| `actions` | `{ text, link, theme? }[]` | Buttons, `theme` is `brand` / `alt` |
| `media` | `image` / `code` / `component` | Media area; `code` supports multiple tabs |
| `cards` | `{ icon?, title, desc }[]` | Capability cards |
| `extra` | arrays of `chips` / `install` / `stats` / `links` | Extra strips, rendered in order |

`SPDIntro` can be imported on its own and customized through the `intro-media` / `intro-actions` / `intro-extra` / `intro-after` slots.

## themeConfig.spd

| Field | Description |
| --- | --- |
| `nav` | `Record<pageKey, NavItem[]>`, each key is one page's section list and order |
| `search` | When `provider: 'local'`, the built-in local search is enabled; other options are the same as VitePress `search` |

## API

| Export | Description |
| --- | --- |
| `SPDPage` | Single-page layout (write `layout: SPDPage` in the page) |
| `SPDIntro` | Generic hero, customizable through slots |
| `SPDNavBarSearch` | Local search box in the navbar (active when `spd.search.provider: 'local'`) |
| `useSectionData` / `SECTION_DATA_KEY` | Data of the pages in aggregated sections (frontmatter / relativePath) |
| `spd-vitepress-components/config` | Preset config (local search, dark by default) |
| `spd-vitepress-components/style.css` | Style entry |

## Styles

Colors and sizes all go through `--spd-*` CSS variables (such as `--spd-c-brand-1`, `--spd-doc-max-width`); override the variables with the same names in your site styles to re-theme.
