/**
 * eslintrc 形状的「全量」预设。
 *
 * = recommended 四条语法 / 用法规则 + valid-attribute-x-for-key (循环缺 key 的最佳
 * 实践检查, 默认级别 warn —— 缺 key 不报错但不利于复用节点)。
 */
const all = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['jsx-advanced'],
  rules: {
    'jsx-advanced/valid-attribute-x-for': 'error',
    'jsx-advanced/valid-attribute-x-for-key': 'warn',
    'jsx-advanced/valid-attribute-x-if': 'error',
    'jsx-advanced/valid-tag-x-for': 'error',
    'jsx-advanced/valid-tag-x-if': 'error'
  }
};

export default all;
