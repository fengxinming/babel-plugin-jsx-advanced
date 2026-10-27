import { Variable } from 'eslint-scope';
import type { Rule, Scope } from 'eslint';
import type { JSXAttribute, JSXElement } from 'estree-jsx';
import type {
  DirectiveNames,
  JsxAdvancedSettings,
  JsxAttributeLike,
  Locale,
  MatchedAttribute,
  ResolvedDirectiveNames,
  ResolvedSettings
} from '../types';
import { DEFAULT_ATTRIBUTE_NAMES, DEFAULT_TAG_NAMES, TAG_VALUE_ATTRIBUTE } from './constants';


/**
 * 只认显式的中文标识, 其余一律英文。
 *
 * 不做前缀回退: zh-TW / zh-Hant / en-GB 这类带地区的标记不会被静默当成
 * 第一个同前缀语言。
 */
function toLocale(value?: string): Locale {
  const normalized = String(value ?? '').trim().replace(/_/g, '-').toLowerCase();
  return normalized === 'zh' || normalized === 'zh-cn' ? 'zh-CN' : 'en-US';
}


/**
 * 单名写字符串, 多名写数组; 未配置才落回默认。
 *
 * 与 babel 侧 resolve 的 `toNames` 同口径: 逐项 trim、过滤非字符串 / 空白项、
 * 按首次出现顺序去重; 全部无效时回落到默认名 —— 不能留一个空集合让规则静默失效。
 */
function toNameSet(value: string | string[] | undefined, fallback: string[]): string[] {
  if (value === undefined) {
    return fallback;
  }
  // settings 来自用户配置, 运行时可能是任意值, 先按 unknown 处理再逐项收窄
  const list: unknown[] = Array.isArray(value) ? value : [value];
  const names: string[] = [];
  for (const item of list) {
    if (typeof item !== 'string') {
      continue;
    }
    const name = item.trim();
    if (name === '' || names.includes(name)) {
      continue;
    }
    names.push(name);
  }
  return names.length > 0 ? names : fallback;
}

/** 单个位置的名字归一化: 属性位与标签位各有一份默认名, 不能共用 */
function resolveNames(raw: DirectiveNames | undefined, fallback: ResolvedDirectiveNames): ResolvedDirectiveNames {
  return {
    for: toNameSet(raw?.for, fallback.for),
    if: toNameSet(raw?.if, fallback.if),
    elif: toNameSet(raw?.elif, fallback.elif),
    else: toNameSet(raw?.else, fallback.else)
  };
}


/**
 * 读取 settings['jsx-advanced'], 给出报错语言与两个位置各自的名字集合。
 *
 * 每个名字字段: 没配落回默认名, 配了就只认配的那些 (不叠加默认名)。
 */
export function readSettings(context: Rule.RuleContext): ResolvedSettings {
  const settings = (context.settings || {}) as Record<string, JsxAdvancedSettings | undefined>;
  const raw = settings['jsx-advanced'];
  return {
    locale: toLocale(raw?.locale),
    attribute: resolveNames(raw?.attribute, DEFAULT_ATTRIBUTE_NAMES),
    tag: resolveNames(raw?.tag, DEFAULT_TAG_NAMES)
  };
}


/**
 * 在属性列表里按顺序找出命中名字集合的属性。
 *
 * 展开属性没有名字, 命名空间属性 (如 xlink:href) 的名字不是字符串, 都取不到
 * —— 与「词即最终名」的口径一致, 视为不匹配。
 */
export function matchAttributes(attributes: JsxAttributeLike[], names: string[]): MatchedAttribute[] {
  const matched: MatchedAttribute[] = [];
  for (const attr of attributes) {
    if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') {
      continue;
    }
    const { name } = attr.name;
    if (names.includes(name)) {
      matched.push({ node: attr, name });
    }
  }
  return matched;
}

/**
 * 取标签形式的绑定位: 名为 `value` 的普通属性。
 *
 * babel 侧按名字取值 (`getValueFromAttributes('value', ...)`), 这里必须同口径:
 * 不按名字找会把 `<if className="x" value={a}>` 判成缺值, 属于假阳性。
 * 展开属性没有名字, 命名空间属性的名字不是平铺字符串, 都视为不匹配。
 *
 * @param attributes 标签的属性列表
 * @returns 名为 value 的属性; 没写或只写了展开属性时返回 undefined
 */
export function findTagBinding(attributes: JsxAttributeLike[]): JSXAttribute | undefined {
  return attributes.find(
    (attr): attr is JSXAttribute =>
      attr.type === 'JSXAttribute'
      && attr.name.type === 'JSXIdentifier'
      && attr.name.name === TAG_VALUE_ATTRIBUTE
  );
}

/**
 * 绑定位是否绑了表达式。
 *
 * `<x-if value>` 这种只写属性名没绑值的情况返回 false —— babel 侧按
 * TAG_ATTRIBUTE_VALUE_REQUIRED 报错, 规则不能放过去。
 *
 * @param attribute 绑定位属性
 */
export function hasBoundValue(attribute: JSXAttribute): boolean {
  const { value } = attribute;
  return value !== null && value.type === 'JSXExpressionContainer';
}

/**
 * 取标签的平铺字符串名。
 *
 * JSXMemberExpression 没有平铺的 name 字段, JSXNamespacedName 的 name 是节点,
 * 两者都取不到字符串名 —— 与属性位的口径一致, 视为不匹配。
 */
export function tagNameOf(node: JSXElement): string | undefined {
  const nameNode = node.openingElement.name;
  const flat = 'name' in nameNode ? nameNode.name : undefined;
  return typeof flat === 'string' ? flat : undefined;
}

/** 判断字符串是否能作为标识符名 (沿用历史实现, 保证判定口径不变) */
export function isVariable(str: unknown): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  if (str.trim() !== str) {
    return false;
  }

  try {
    // eslint-disable-next-line no-new-func, no-new
    new Function(str, `var ${str}`);
  }
  catch {
    return false;
  }

  return true;
}

/** 节点是否为 JSXText */
export function isJSXText(node: unknown): boolean {
  return Boolean(node) && (node as { type?: string }).type === 'JSXText';
}

/** 节点是否为 JSXElement (类型守卫, 收窄后可直接读 openingElement) */
export function isJSXElement(node: unknown): node is JSXElement {
  return typeof node === 'object' && node !== null && 'type' in node && node.type === 'JSXElement';
}

/**
 * 分支链扫描时允许跨过的节点: 纯空白文本、空表达式容器 (只写了注释的容器)。
 *
 * 与 babel 的 scanSiblings 同口径: 这两种节点跳过继续扫, 其余节点 (非空白文本、
 * 普通表达式、非分支元素) 一律视为分支链断点。
 */
export function isSkippableBetweenBranches(node: unknown): boolean {
  if (typeof node !== 'object' || node === null || !('type' in node)) {
    return false;
  }
  if (node.type === 'JSXText') {
    return 'value' in node && typeof node.value === 'string' && node.value.trim() === '';
  }
  return node.type === 'JSXExpressionContainer'
    && 'expression' in node
    && typeof node.expression === 'object'
    && node.expression !== null
    && 'type' in node.expression
    && node.expression.type === 'JSXEmptyExpression';
}

/**
 * 把指令生成的循环变量补进全局作用域, 避免 no-undef 误报。
 *
 * 作用域取自 sourceCode.getScope(Program) —— ESLint 对 Program 取最外层作用域, 与
 * 已被 v9 移除的 context.getScope() 在 Program 下语义一致, 故统一走新 API。
 *
 * 必须在读到变量时立即调用, 不能攒到 Program:exit: no-undef 也在 Program:exit 检查,
 * 两者谁先注册谁先跑, 攒到 exit 会让结果依赖规则顺序。
 *
 * 做法: 未声明的变量在 globalScope 上补一个标记 eslintUsed 的 Variable,
 * 并把 through 里指向它的引用改为 resolved。
 */
export function addDeclaredVariables(context: Rule.RuleContext, vars: string[]): void {
  const globalScope = context.sourceCode.getScope(context.sourceCode.ast);
  vars.forEach((id) => {
    const existed = globalScope.set.get(id);

    if (!existed) {
      // eslint-scope 的 Scope 比 @types/eslint 的 Scope 接口多出 taints / dynamic 等字段,
      // 但运行时取到的就是前者, 故按构造器签名收窄
      const variable = new Variable(
        id,
        globalScope as unknown as ConstructorParameters<typeof Variable>[1]
      ) as Scope.Variable & { eslintUsed?: boolean };
      variable.eslintUsed = true;

      globalScope.variables.push(variable);
      globalScope.set.set(id, variable);
    }
  });

  globalScope.through = globalScope.through.filter((reference) => {
    const { name } = reference.identifier;
    const variable = globalScope.set.get(name);

    if (variable) {
      reference.resolved = variable;
      variable.references.push(reference);

      return false;
    }

    return true;
  });
}
