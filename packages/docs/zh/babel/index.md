---
layout: SPDPage
nav: babel-plugin-jsx-advanced
logo:
  prefix: jsx-
  accent: advanced
# 首屏走 VPHero 原生字段 (name / text / tagline / actions); eyebrow 与代码窗由 SPDHome 的具名插槽渲染
hero:
  layout: split
  eyebrow: Babel 插件 · 编译期转换
  name: JSX 指令
  text: 写进模板里
  tagline: 类 Vue 的 if / for / show / class / html 指令，编译期完成全部转换。priority 决定执行顺序，指令名完全由你定义。
  actions:
    - text: 查看指令
      link: '#directives'
      theme: brand
    - text: 快速开始
      link: '#getting-started'
      theme: alt
  code:
    title: list.jsx
    tabs:
      - name: JSX
        code: |
          <section>
            <ul>
              <li x-for={(item, i) in list} key={i}>
                {item.name}
              </li>
            </ul>
            <if value={condition}>
              <for value={item in list}>
                <span key={item.key}>{item.name}</span>
              </for>
            </if>
          </section>
      - name: Output
        code: |
          <section>
            <ul>
              {__brja_for_helper__(list, (item, i) => (
                <li key={i}>{item.name}</li>
              ))}
            </ul>
            {condition
              ? __brja_for_helper__(list, (item) => (
                  <span key={item.key}>{item.name}</span>
                ))
              : null}
          </section>
  extra:
    - type: install
      label: pnpm
      command: add -D babel-plugin-jsx-advanced
    - type: chips
      items:
        - 编译期转换
        - 零运行时依赖
        - TypeScript
        - JSX / TSX
features:
  - icon: "<>"
    title: 五个内置指令
    details: if / for / show / class / html，属性位与标签位双形态。
  - icon: "#"
    title: 优先级可调
    details: priority 决定执行顺序，Vue 2 / Vue 3 语义随时切换。
  - icon: "{}"
    title: 名字完全定义
    details: 指令名、别名、分支名与 prefix 全部可配，写法不受限。
cta: true
---

<!-- 本文件只承载首屏数据 (hero/features/logo/cta); 正文区块由 layout: SPDPage 按 themeConfig.spd.nav 顺序从 babel/*.md 聚合。 -->
