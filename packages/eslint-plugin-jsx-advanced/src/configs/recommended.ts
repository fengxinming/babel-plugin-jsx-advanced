/**
 * eslintrc 形状的「推荐」预设。
 *
 * 只收「写错了编译产物就坏」的四条语法 / 用法规则, 一条不多; 最佳实践类规则
 * (valid-attribute-x-for-key) 留给 all —— 想要全量校验的人自己开 all。
 *
 * 这里也刻意不碰任何 ESLint 核心规则: 关掉 no-sequences 之类的事交给使用者决定。
 */
const recommended = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['jsx-advanced'],
  rules: {
    'jsx-advanced/valid-attribute-x-for': 'error',
    'jsx-advanced/valid-attribute-x-if': 'error',
    'jsx-advanced/valid-tag-x-for': 'error',
    'jsx-advanced/valid-tag-x-if': 'error'
  }
};

export default recommended;
