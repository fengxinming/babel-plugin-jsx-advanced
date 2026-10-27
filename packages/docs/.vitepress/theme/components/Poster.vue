<template>
  <svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g-orb" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#00d9ff" />
        <stop offset="1" stop-color="#7c5cff" />
      </linearGradient>
      <radialGradient id="g-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#00d9ff" stop-opacity="0.55" />
        <stop offset="1" stop-color="#00d9ff" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- 底层半透明卡片 -->
    <rect x="6" y="6" width="348" height="248" rx="20" fill="#0a192f" stroke="#2c3e50" stroke-width="1" />

    <!-- 顶部浮动粒子 -->
    <circle cx="60" cy="48" r="2.4" fill="#00d9ff" opacity="0.7">
      <animate attributeName="cy" values="48;36;48" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="150" cy="38" r="2" fill="#64ffda" opacity="0.6">
      <animate attributeName="cy" values="38;52;38" dur="4s" repeatCount="indefinite" />
    </circle>
    <circle cx="240" cy="46" r="2.6" fill="#7c5cff" opacity="0.6">
      <animate attributeName="cy" values="46;32;46" dur="3.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="310" cy="50" r="2.2" fill="#00d9ff" opacity="0.5">
      <animate attributeName="cy" values="50;40;50" dur="2.8s" repeatCount="indefinite" />
    </circle>

    <!-- 左侧输入节点 (呼吸) -->
    <g transform="translate(70, 130)">
      <circle r="30" fill="#112240" stroke="#2c3e50" stroke-width="1.5">
        <animate attributeName="r" values="28;32;28" dur="4s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.4;0.9;0.4" dur="4s" repeatCount="indefinite" />
      </circle>
      <text text-anchor="middle" y="5" fill="#8892b0" font-family="ui-monospace,monospace" font-size="12">{{
        '⊘' }}</text>
    </g>

    <!-- 中间流向线 + 流动光点 -->
    <line x1="100" y1="130" x2="260" y2="130" stroke="url(#g-orb)" stroke-width="1.5" opacity="0.5" />
    <circle r="3.2" fill="#00d9ff">
      <animate attributeName="cx" values="100;260;100" dur="3.6s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;1;0" dur="3.6s" repeatCount="indefinite" />
    </circle>
    <circle r="2.4" fill="#7c5cff">
      <animate attributeName="cx" values="260;100;260" dur="4.4s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.9;0" dur="4.4s" repeatCount="indefinite" />
    </circle>

    <!-- 右侧输出节点 (呼吸, 错相) -->
    <g transform="translate(290, 130)">
      <circle r="30" fill="#112240" stroke="#00d9ff" stroke-width="1.5">
        <animate attributeName="r" values="32;28;32" dur="4s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.9;0.4;0.9" dur="4s" repeatCount="indefinite" />
      </circle>
      <text text-anchor="middle" y="5" fill="#00d9ff" font-family="ui-monospace,monospace"
        font-size="12">&lt;/&gt;</text>
    </g>

    <!-- 中央: 旋转环 + 中心 JSX 标识 -->
    <g transform="translate(180, 130)">
      <!-- 外环 (顺时针旋转) -->
      <circle r="48" fill="none" stroke="url(#g-orb)" stroke-width="2" stroke-dasharray="60 50" opacity="0.85">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite" />
      </circle>
      <!-- 中环 (逆时针旋转, 错相) -->
      <circle r="36" fill="none" stroke="#64ffda" stroke-width="1.5" stroke-dasharray="36 38" opacity="0.6">
        <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="6.5s"
          repeatCount="indefinite" />
      </circle>
      <!-- 中心 glow (呼吸) -->
      <circle r="20" fill="url(#g-glow)">
        <animate attributeName="r" values="18;26;18" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;1;0.7" dur="3.2s" repeatCount="indefinite" />
      </circle>
      <!-- 中心字 -->
      <text y="5" text-anchor="middle" fill="#e6f1ff" font-family="ui-monospace,monospace" font-size="13"
        font-weight="700">JSX</text>
    </g>

    <!-- 底部流动弧线 -->
    <path d="M 80 215 Q 180 235 280 215" fill="none" stroke="url(#g-orb)" stroke-width="1.5" stroke-linecap="round"
      opacity="0.45">
      <animate attributeName="opacity" values="0.2;0.7;0.2" dur="3s" repeatCount="indefinite" />
    </path>
    <circle r="2.4" fill="#64ffda">
      <animate attributeName="cx" values="80;280;80" dur="5s" repeatCount="indefinite" />
      <animate attributeName="cy" values="215;215;215" dur="5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.9;0" dur="5s" repeatCount="indefinite" />
    </circle>
  </svg>
</template>
<style lang="stylus" scoped>
  .poster
    display block
    width 100%
    max-width var(--spd-hero-svg-width)
    height auto
</style>