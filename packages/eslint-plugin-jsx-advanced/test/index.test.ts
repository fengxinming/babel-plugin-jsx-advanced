import plugin from '../src/index.ts';

/** recommended 覆盖的规则 id: 只收「写错产物就坏」的语法 / 用法规则 (顺序无关) */
const RECOMMENDED_RULE_IDS = [
  'jsx-advanced/valid-attribute-x-for',
  'jsx-advanced/valid-attribute-x-if',
  'jsx-advanced/valid-tag-x-for',
  'jsx-advanced/valid-tag-x-if'
];

/** all = recommended + 最佳实践类规则 */
const ALL_RULE_IDS = [
  ...RECOMMENDED_RULE_IDS,
  'jsx-advanced/valid-attribute-x-for-key'
];

interface RulesPreset { rules: Record<string, unknown> }

function ruleIds(preset: RulesPreset): string[] {
  return Object.keys(preset.rules).filter((id) => id.startsWith('jsx-advanced/')).sort();
}

describe('configs 键名与形状', () => {
  it('恰好导出四个预设: legacy_recommended / legacy_all / recommended / all', () => {
    expect(Object.keys(plugin.configs).sort()).toEqual(['all', 'legacy_all', 'legacy_recommended', 'recommended']);
  });

  it('legacy_* 是 eslintrc 形状 (顶层 parserOptions + plugins 字符串数组)', () => {
    const presets = [plugin.configs.legacy_recommended, plugin.configs.legacy_all];

    for (const preset of presets) {
      expect(Array.isArray(preset.plugins)).toBe(true);
      expect(preset.plugins).toContain('jsx-advanced');
      expect(preset.parserOptions.ecmaFeatures.jsx).toBe(true);
    }
  });

  it('recommended / all 是 flat 形状 (plugins 对象 + languageOptions)', () => {
    const presets = [plugin.configs.recommended, plugin.configs.all] as Array<{
      plugins: Record<string, unknown>;
      languageOptions: unknown;
    }>;

    for (const preset of presets) {
      expect(Array.isArray(preset.plugins)).toBe(false);
      expect(preset.plugins['jsx-advanced']).toBe(plugin);
      expect(preset.languageOptions).toBeDefined();
    }
  });

  it('recommended 与 all 不是同一份规则: all 多出 key 检查', () => {
    expect(ruleIds(plugin.configs.recommended as RulesPreset)).toEqual(RECOMMENDED_RULE_IDS.slice().sort());
    expect(ruleIds(plugin.configs.legacy_recommended)).toEqual(RECOMMENDED_RULE_IDS.slice().sort());
    expect(ruleIds(plugin.configs.all as RulesPreset)).toEqual(ALL_RULE_IDS.slice().sort());
    expect(ruleIds(plugin.configs.legacy_all)).toEqual(ALL_RULE_IDS.slice().sort());
  });

  it('预设里的规则都已注册', () => {
    const presets = [
      plugin.configs.legacy_recommended,
      plugin.configs.legacy_all,
      plugin.configs.recommended,
      plugin.configs.all
    ] as RulesPreset[];

    for (const preset of presets) {
      for (const id of ruleIds(preset)) {
        expect(plugin.rules).toHaveProperty(id.replace('jsx-advanced/', ''));
      }
    }
  });

  it('预设不碰任何 ESLint 核心规则', () => {
    // x-for 的括号写法在 no-sequences 默认配置下本就被豁免, 无需替使用者关规则
    const presets = [
      plugin.configs.legacy_recommended,
      plugin.configs.legacy_all,
      plugin.configs.recommended,
      plugin.configs.all
    ] as RulesPreset[];

    for (const preset of presets) {
      const core = Object.keys(preset.rules).filter((id) => !id.startsWith('jsx-advanced/'));
      expect(core).toEqual([]);
    }
  });

  it('flat 预设限定作用范围, 且不替使用者决定语言版本', () => {
    const presets = [plugin.configs.recommended, plugin.configs.all] as Array<{
      files: string[];
      languageOptions: { ecmaVersion?: number, sourceType?: string, parserOptions: unknown };
    }>;

    for (const preset of presets) {
      expect(preset.files.length).toBeGreaterThan(0);
      for (const pattern of preset.files) {
        // tsx 必须在内: flat 的 files 不继承, 漏掉就等于 TS 项目零校验
        expect(pattern.includes('jsx')).toBe(true);
        expect(pattern.includes('tsx')).toBe(true);
      }
      expect(preset.languageOptions).not.toHaveProperty('ecmaVersion');
      expect(preset.languageOptions).not.toHaveProperty('sourceType');
      expect(preset.languageOptions.parserOptions).toEqual({ ecmaFeatures: { jsx: true } });
    }
  });
});
