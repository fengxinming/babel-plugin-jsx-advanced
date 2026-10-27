import validAttributeXFor from './rules/valid-attribute-x-for';
import validAttributeXForKey from './rules/valid-attribute-x-for-key';
import validAttributeXIf from './rules/valid-attribute-x-if';
import validTagXFor from './rules/valid-tag-x-for';
import validTagXIf from './rules/valid-tag-x-if';
import legacyAll from './configs/all';
import legacyRecommended from './configs/recommended';

/**
 * flat 预设的作用范围: 全部可能承载 JSX 的源文件。
 *
 * flat 配置的 files 不继承、不合并: 没写进这里的扩展名, 规则对象整条不会命中,
 * 对应文件会被静默跳过。所以 tsx 必须列上 —— TS 项目的 JSX 都在 .tsx 里。
 *
 * ts / mts / cts 本身不允许写 JSX (TS 只认 .tsx), 列上只为 glob 整齐, 不会误报。
 * 这里**不设 parser**: TypeScript 文件由使用者的 @typescript-eslint/parser 负责,
 * 两个配置对象按文件合并, 我们不会覆盖它; 没配 TS parser 的工程本来就无法 lint 这些文件。
 */
const FLAT_FILES = ['**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}'];

/**
 * flat 预设只保证 JSX 语法能解析。
 *
 * ecmaVersion 与 sourceType 一律不写 —— 它们是使用者工程自己的事; JSX 必须开,
 * 否则带指令的源码连语法树都建不起来。
 */
const flatLanguageOptions = {
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  }
};

/**
 * eslint-plugin-jsx-advanced。
 *
 * 为 babel-plugin-jsx-advanced 提供配套的 eslint 校验规则。
 *
 * 规则名以「位置 + 指令名」命名: `valid-attribute-x-for` / `valid-tag-x-for`
 * —— attribute 位与 tag 位是两套独立校验, 分在两条规则里。
 *
 * configs 同时导出两代形状:
 * - legacy_recommended / legacy_all —— eslintrc 形状 (eslint 8 用, 已停止升级);
 * - recommended / all —— flat config 形状 (eslint 9 起用, v10 只认这个)。
 */
const plugin = {
  rules: {
    'valid-attribute-x-for': validAttributeXFor,
    'valid-attribute-x-for-key': validAttributeXForKey,
    'valid-attribute-x-if': validAttributeXIf,
    'valid-tag-x-for': validTagXFor,
    'valid-tag-x-if': validTagXIf
  },
  processors: {},
  configs: {} as {
    legacy_recommended: typeof legacyRecommended;
    legacy_all: typeof legacyAll;
    recommended: unknown;
    all: unknown;
  }
};

plugin.configs = {
  legacy_recommended: legacyRecommended,
  legacy_all: legacyAll,
  recommended: {
    files: FLAT_FILES,
    plugins: { 'jsx-advanced': plugin },
    languageOptions: flatLanguageOptions,
    rules: legacyRecommended.rules
  },
  all: {
    files: FLAT_FILES,
    plugins: { 'jsx-advanced': plugin },
    languageOptions: flatLanguageOptions,
    rules: legacyAll.rules
  }
};

export default plugin;
