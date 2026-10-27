---
layout: SPDPage
nav: eslint-plugin-jsx-advanced
title: ESLint plugin
logo:
  prefix: jsx-
  accent: advanced
# Hero uses the native VPHero schema (name / text / tagline / actions); eyebrow and code media
# are rendered into VPHome's named slots by SPDHome.
hero:
  layout: split
  eyebrow: ESLint plugin · in-editor checks
  name: ESLint rules
  text: caught as you type
  tagline: Invalid bindings, unbalanced branch chains and missing loop keys are reported in the editor — no compile step required.
  actions:
    - text: Browse rules
      link: '#rules'
      theme: brand
    - text: Get started
      link: '#getting-started'
      theme: alt
  code:
    title: list.jsx
    tabs:
      - name: Problem code
        code: |
          <ul>
            <li x-for={item, index in items}>
              {item.name}
            </li>
          </ul>
      - name: Editor output
        code: |
          list.jsx
            2:9   error  Missing parentheses around loop variables for x-for  jsx-advanced/valid-attribute-x-for
            2:9   warn   Missing key property for x-for  jsx-advanced/valid-attribute-x-for-key
  extra:
    - type: install
      label: pnpm
      command: pnpm add -D eslint eslint-plugin-jsx-advanced
    - type: chips
      items:
        - ESLint 9 flat config
        - Automatic loop-variable scope
        - Editor-time checks
        - zh-CN / en-US
features:
  - icon: "!"
    title: Five rules
    details: Attribute and tag forms of for / if branch chains, loop keys and binding syntax are all covered.
  - icon: "{}"
    title: Scope completion
    details: Loop variables enter scope in place, so using them inside the element no longer trips no-undef.
  - icon: zh
    title: Bilingual messages
    details: Set locale to zh-CN for Chinese messages; English is the default.
cta: true
---
