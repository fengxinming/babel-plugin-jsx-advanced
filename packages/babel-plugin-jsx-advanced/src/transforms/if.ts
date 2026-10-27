import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import { combineNodes, createConditionalExpression, getValueFromAttributes } from '../utils';
import type { DirectiveState, JsxValue, PluginState, ResolvedBranchEntry } from '../types';
import { TAG_POSITION } from '../constants';

/**
 * 解包条件值: 非容器 / 非表达式一律按缺值报错 (标签位用标签文案, 属性位用指令文案).
 *
 * label 用于错误消息的指令名: 取实际命中的那一个名字, 而不是配置里的名字集合。
 *
 * getErrorPath 惰性求值: 正常编译不创建 NodePath, 只在真正抛错时定位到
 * 具体节点 (elif 分支位于兄弟节点上, 不能用主 if 的 path 代替)。
 */
function readCondition(
  types: typeof t,
  value: JsxValue,
  label: string,
  position: DirectiveState['position'],
  formatMessage: PluginState['formatMessage'],
  getErrorPath: () => NodePath
): t.Expression {
  // babel 解析器保证属性值不会出现空表达式, 这里合并为一次类型收窄
  if (!types.isJSXExpressionContainer(value) || !types.isExpression(value.expression)) {
    throw getErrorPath().buildCodeFrameError(
      position === TAG_POSITION
        ? formatMessage('TAG_VALUE_REQUIRED', { tag: label })
        : formatMessage('DIRECTIVE_VALUE_REQUIRED', { name: label })
    );
  }
  return value.expression;
}

function matchDirective(
  types: typeof t,
  attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute>,
  elifNames: string[],
  elseNames: string[]
): {
  value: JsxValue;
  name: string;
  attribute: t.JSXAttribute;
  attributeIndex: number;
  kind: 'elif' | 'else';
} | null {
  for (let i = 0, l = attributes.length; i < l; i++) {
    const attr = attributes[i];
    // 有可能存在 JSXSpreadAttribute
    if (types.isJSXAttribute(attr)
      && types.isJSXIdentifier(attr.name)) {
      const name = attr.name.name;
      if (elifNames.includes(name)) {
        return { value: attr.value, name, attribute: attr, attributeIndex: i, kind: 'elif' };
      }
      if (elseNames.includes(name)) {
        return { value: attr.value, name, attribute: attr, attributeIndex: i, kind: 'else' };
      }
    }
  }
  return null;
}

/**
 * 向后扫描 if 元素的兄弟节点, 把连续的 elif / else 折叠进 statementArgs。
 *
 * 兄弟节点直接从 nodePath.container 按绝对下标读取, 删除用 splice; 不创建
 * NodePath, 不依赖 remove() 的 sibling key 更新 —— 当前元素最终会被 index.ts
 * 整体 replaceWith, 旧父容器的局部结构随之废弃。
 *
 * offset 规则: splice 删除后不变 (后面节点补位), 用 continue 重读同一下标。
 * 循环出口: elif 继续; else / 非分支节点一律 break, 防死循环。
 */
function scanSiblings(
  nodePath: NodePath<t.JSXElement>,
  types: typeof t,
  statementArgs: Array<t.Expression | null>,
  match: (
    sibling: t.JSXElement,
    offset: number
  ) => [t.Expression | null, t.Expression | t.JSXElement] | null
): void {
  const container = nodePath.container;
  const startKey = nodePath.key;

  // 不在数组容器里 (例如 return <if>...</if>), 没有兄弟可扫
  if (!Array.isArray(container) || typeof startKey !== 'number') {
    return;
  }

  const offset = startKey + 1;

  while (offset < container.length) {
    const sibling = container[offset];

    if (types.isJSXElement(sibling)) {
      const result = match(sibling, offset);
      if (result === null) {
        // 非 elif / else 元素: 分支链到此结束
        break;
      }

      statementArgs.push(result[0], result[1]);
      container.splice(offset, 1);

      if (result[0] === null) {
        // else: 最后一条分支, push 后停止扫描
        break;
      }
      // elif: 后面的节点已补位到当前下标, 不递增下标
      continue;
    }

    if (types.isJSXText(sibling) && sibling.value.trim() === '') {
      // 空白节点 换行符: 删除后补位, 不递增下标
      container.splice(offset, 1);
      continue;
    }

    if (types.isJSXExpressionContainer(sibling) && types.isJSXEmptyExpression(sibling.expression)) {
      // 空表达式: 删除后补位, 不递增下标
      container.splice(offset, 1);
      continue;
    }

    // 非空白文本 / 其他表达式: 分支链到此结束
    break;
  }
}

/**
 * 条件指令的属性形式, 如 `x-if={a}`。
 *
 * 向后扫描兄弟节点, 把连续的 elif / else 分支折叠成嵌套三目表达式。
 *
 * 原元素节点被复用为三目表达式的 consequent, 替换后 babel 会遍历新树,
 * 复用进 consequent 的原节点再次进入指令管线, 排在后面的指令在那里生效。
 */
export function transformIfAttribute(
  nodePath: NodePath<t.JSXElement>,
  ctx: DirectiveState,
  { types, formatMessage }: PluginState
) {
  const valueAttributeIndex = ctx.valueAttributeIndex;

  const { elif: elifNames, else: elseNames } = ctx.resolved as ResolvedBranchEntry;

  const statementArgs: Array<t.Expression | null> = [
    readCondition(
      types,
      ctx.value,
      ctx.name,
      ctx.position,
      formatMessage,
      () => nodePath.get(`openingElement.attributes.${valueAttributeIndex}`)
    ),
    nodePath.node
  ];

  scanSiblings(
    nodePath,
    types,
    statementArgs,
    (sibling, offset) => {
      const attributes = sibling.openingElement.attributes;
      const ret = matchDirective(types, attributes, elifNames, elseNames);
      if (ret === null) {
        return ret;
      }

      const { value: directiveValue, name: directiveName, attributeIndex, kind } = ret;
      if (kind === 'elif') {
        const condition = readCondition(
          types,
          directiveValue,
          directiveName,
          ctx.position,
          formatMessage,
          // 定位到兄弟节点自身的 elif 属性, 不能用主 if 的 path
          () => nodePath
            .getSibling(offset)
            .get(`openingElement.attributes.${attributeIndex}`)
        );
        attributes.splice(attributeIndex, 1);
        return [condition, sibling];
      }

      attributes.splice(attributeIndex, 1);
      return [null, sibling];
    }
  );

  return createConditionalExpression(types, statementArgs, 0);
}

/**
 * 条件标签 `<if value={cond}>...</if>` / `<elif>` / `<else>`。
 *
 * 从 if 标签开始向后扫描兄弟节点, 把连续的 elif / else 标签折叠成嵌套三目表达式。
 * 标签替换整个元素, 外壳连同属性一起丢弃, 只有 children 保留作为三目表达式分支。
 *
 */
export function transformIfTag(
  nodePath: NodePath<t.JSXElement>,
  ctx: DirectiveState,
  { types, formatMessage }: PluginState
) {
  const { elif: elifNames, else: elseNames } = ctx.resolved as ResolvedBranchEntry;

  const statementArgs: Array<t.Expression | null> = [
    readCondition(
      types,
      ctx.value,
      ctx.name,
      ctx.position,
      formatMessage,
      // 标签位统一指向整个标签
      () => nodePath
    ),
    combineNodes(types, nodePath.node.children)
  ];

  scanSiblings(
    nodePath,
    types,
    statementArgs,
    (sibling, offset) => {
      const name = sibling.openingElement.name;
      if (!types.isJSXIdentifier(name)) {
        return null;
      }

      const tagName = name.name;
      if (elifNames.includes(tagName)) {
        const valueRet = getValueFromAttributes('value', sibling.openingElement.attributes, types);
        if (valueRet === null) {
          throw nodePath.getSibling(offset).buildCodeFrameError(
            formatMessage('TAG_VALUE_REQUIRED', { tag: tagName })
          );
        }
        const condition = readCondition(
          types,
          valueRet.value,
          tagName,
          ctx.position,
          formatMessage,
          // 定位到 elif 标签自身
          () => nodePath.getSibling(offset)
        );
        return [condition, combineNodes(types, sibling.children)];
      }
      else if (elseNames.includes(tagName)) {
        return [null, combineNodes(types, sibling.children)];
      }

      return null;
    }
  );

  return createConditionalExpression(types, statementArgs, 0);
}
