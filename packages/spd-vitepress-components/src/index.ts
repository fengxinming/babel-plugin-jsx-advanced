import './style/index.styl';

export { default as SPDPage } from './components/SPDPage.vue';
// 首屏: 复用 VPHome 原生 hero, 插槽补齐 eyebrow / 代码窗 / 附加带
export { default as SPDHome } from './components/SPDHome.vue';
// 对外名称沿用 SPDNavBarSearch (doc 站 theme 里 <SPDNavBarSearch /> 用法不变),
// 实现按 VP 结构拆为 SPDNavBarSearch (容器) + SPDNavBarSearchButton + SPDSearchBox (弹层)。
export { default as SPDNavBarSearch } from './components/SPDNavBarSearch.vue';
// 区块作用域的数据钩子: 聚合流里被聚合的 md 不是当前路由页, 区块内组件调 VP 的 useData()
// 只能拿到宿主页数据, 故本包按区块 provide, 消费方经 useSectionData 取 (无区块上下文时
// 自动回退到 useData)。SECTION_DATA_KEY 供需要自行 inject 的场景使用。
export { SECTION_DATA_KEY, useSectionData } from './composables/useSectionData';
export * from './types';
