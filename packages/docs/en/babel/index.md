---
layout: SPDPage
nav: babel-plugin-jsx-advanced
logo:
  prefix: jsx-
  accent: advanced
# Hero uses the native VPHero schema (name / text / tagline / actions); eyebrow and code media
# are rendered into VPHome's named slots by SPDHome.
hero:
  layout: split
  eyebrow: Babel plugin · compile-time transforms
  name: JSX directives
  text: written in your template
  tagline: Vue-style if / for / show / class / html directives, fully compiled away. priority controls execution order; every directive name is yours to define.
  actions:
    - text: View directives
      link: '#directives'
      theme: brand
    - text: Get started
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
        - Compile-time
        - Zero runtime
        - TypeScript
        - JSX / TSX
features:
  - icon: "<>"
    title: Five built-ins
    details: if / for / show / class / html, in both attribute and tag form.
  - icon: "#"
    title: Adjustable priority
    details: priority decides execution order — switch between Vue 2 and Vue 3 semantics anytime.
  - icon: "{}"
    title: Fully named
    details: Directive names, aliases, branch names and prefix are all configurable.
cta: true
---

<!-- This file only carries hero data (hero/features/logo/cta); body sections are aggregated from babel/*.md by layout: SPDPage, following themeConfig.spd.nav order. -->
