---
layout: SPDPage
nav: eslint-plugin-jsx-advanced
title: ESLint 插件
logo:
  prefix: jsx-
  accent: advanced
# 首屏走 VPHero 原生字段 (name / text / tagline / actions); eyebrow 与代码窗由 SPDHome 的具名插槽渲染
hero:
  layout: split
  eyebrow: ESLint 插件 · 编辑器校验
  name: ESLint 校验
  text: 写错即报
  tagline: 绑定表达式非法、循环变量缺括号、分支链断开、循环缺 key —— 在编辑器里就拦下，不用等编译。
  actions:
    - text: 查看规则
      link: '#rules'
      theme: brand
    - text: 快速开始
      link: '#getting-started'
      theme: alt
  code:
    title: list.jsx
    tabs:
      - name: 问题写法
        code: |
          <ul>
            <li x-for={item, index in items}>
              {item.name}
            </li>
          </ul>
      - name: 编辑器提示
        code: |
          list.jsx
            2:9   error  x-for 指令的循环变量缺少括号  jsx-advanced/valid-attribute-x-for
            2:9   warn   缺少 key 属性关于 x-for 指令  jsx-advanced/valid-attribute-x-for-key
  extra:
    - type: install
      label: pnpm
      command: pnpm add -D eslint eslint-plugin-jsx-advanced
    - type: chips
      items:
        - ESLint 9 flat config
        - 自动补全循环变量作用域
        - 编辑期拦截
        - 中英双语
features:
  - icon: "!"
    title: 五条规则
    details: 属性位与标签位的 for / if 分支链、循环 key、绑定语法全覆盖。
  - icon: "{}"
    title: 作用域自动补全
    details: 循环变量就地进入作用域，元素内部使用不再触发 no-undef。
  - icon: zh
    title: 中英双语文案
    details: locale 写 zh-CN 即输出中文提示，默认英文。
cta: true
---
