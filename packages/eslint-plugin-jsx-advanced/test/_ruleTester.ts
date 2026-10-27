import { Linter, RuleTester } from 'eslint';

/** 运行中的 ESLint 主版本 */
const MAJOR = Number(Linter.version.split('.')[0]);

/**
 * 建 RuleTester。
 *
 * 两代 RuleTester 的配置形状互斥: 8.57 的完全不认 languageOptions, 9/10 的只认 languageOptions
 * (顶层 parserOptions 已不受支持)。故按运行中的主版本二选一, 让同一批用例同时跑在 8.57 / 9 / 10 上。
 */
export function createRuleTester(): RuleTester {
  const jsx = { ecmaFeatures: { jsx: true } };
  const config = MAJOR >= 9
    ? { languageOptions: { ecmaVersion: 2018, sourceType: 'module', parserOptions: jsx } }
    : { parserOptions: { ecmaVersion: 2018, sourceType: 'module', ...jsx } };

  return new RuleTester(config as ConstructorParameters<typeof RuleTester>[0]);
}
