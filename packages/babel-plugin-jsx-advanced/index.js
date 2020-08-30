'use strict';

const parseIfTag = require('./parse/if');
const parseIfDirective = require('./parse/x-if');
const parseClassDirective = require('./parse/x-class');
const parseShowDirective = require('./parse/x-show');
const parseHtmlDirective = require('./parse/x-html');

const { TAG_IF, TAG_ELSE_IF, TAG_ELSE } = parseIfTag;

function getDirectiveNames({
  prefix,
  supportIf,
  supportClass,
  supportShow,
  supportHtml
}) {
  const names = Object.create(null);
  if (supportIf !== false) {
    names.ifDirective = `${prefix}if`;
    names.elifDirective = `${prefix}elif`;
    names.elseDirective = `${prefix}else`;
  }
  if (supportClass !== false) {
    names.classDirective = `${prefix}class`;
    names.classNameAttr = 'className';
  }
  if (supportShow !== false) {
    names.showDirective = `${prefix}show`;
    names.styleAttr = 'style';
  }
  if (supportHtml !== false) {
    names.htmlDirective = `${prefix}html`;
    names.dangerouslySetInnerHTMLAttr = 'dangerouslySetInnerHTML';
  }
  return names;
}

function getDirectiveNodes(types, directives, attributes) {
  const directiveNodes = Object.create(null);
  for (let i = 0, l = attributes.length; i < l; i++) {
    const attr = attributes[i];
    // 有可能存在 JSXSpreadAttribute
    if (types.isJSXAttribute(attr)) {
      const { name: { name }, value } = attr;
      for (const alias in directives) {
        if (name === directives[alias]) {
          directiveNodes[alias] = {
            attr,
            name,
            key: i,
            value: types.isJSXExpressionContainer(value)
              ? value.expression
              : value
          };
          break;
        }
      }
    }
  }
  return directiveNodes;
}

module.exports = function ({ types }, options) {
  options = options || {};
  if (!options.prefix) {
    options.prefix = 'x-';
  }
  const directiveNames = getDirectiveNames(options);
  const {
    classHelper = 'celia.classnames',
    showHelper = 'babel-plugin-jsx-advanced-helper/show-helper',
    classHelperAlias = '__classHelper__',
    showHelperAlias = '__showHelper__',
    supportIfTag
  } = options;

  return {
    visitor: {
      Program: {
        enter(nodePath, state) {
          // 指令辅助函数, key为声明变量名，value为模块名
          state.__directiveHelpers = new Map();
        },
        exit(nodePath, state) {
          const { body } = nodePath.node;
          const { __directiveHelpers } = state;
          for (const [alias, helper] of __directiveHelpers) {
            if (!body.some(node => node.type === 'ImportDeclaration' && node.specifiers.some(specifier => specifier.local.name === alias))) {
              // 'import alias from helper';
              const importDeclaration = types.importDeclaration(
                [
                  types.ImportDefaultSpecifier(types.identifier(alias))
                ],
                types.stringLiteral(helper)
              );
              nodePath.unshiftContainer('body', importDeclaration);
            }
          }
        }
      },
      JSXElement(nodePath, state) {
        const { node: { openingElement: { attributes, name: { name: tagName } } } } = nodePath;

        // 匹配if标签
        if (supportIfTag !== false) {
          switch (tagName) {
            case TAG_IF:
              parseIfTag(nodePath);
              return;
            case TAG_ELSE_IF:
              throw nodePath.buildCodeFrameError(`<${TAG_ELSE_IF}> 标签需要上一个JSX节点是 '${TAG_IF}' 标签.`);
            case TAG_ELSE:
              throw nodePath.buildCodeFrameError(`<${TAG_ELSE}> 标签需要上一个JSX节点是 '${TAG_IF}' 或 '${TAG_ELSE_IF}' 标签.`);
          }
        }

        // 匹配需要处理的指令
        const directiveNodes = getDirectiveNodes(types, directiveNames, attributes);
        const {
          ifDirective,
          elifDirective,
          elseDirective,
          classDirective,
          showDirective,
          htmlDirective
        } = directiveNodes;

        // 处理if指令
        if (ifDirective) {
          if (ifDirective.value === null) {
            throw nodePath.get('openingElement').get(`attributes.${ifDirective.key}`).buildCodeFrameError(`'${ifDirective.name}' 指令需要绑定一个变量或表达式.`);
          }
          parseIfDirective(
            nodePath,
            ifDirective,
            directiveNames.elifDirective,
            directiveNames.elseDirective
          );
          attributes.splice(ifDirective.key, 1);
        } else if (elifDirective) {
          throw nodePath.buildCodeFrameError(`'${elifDirective.name}' 指令需要上一个JSX节点包含 '${directiveNames.ifDirective}' 指令.`);
        } else if (elseDirective) {
          throw nodePath.buildCodeFrameError(`'${elseDirective.name}' 指令需要上一个JSX节点包含 '${directiveNames.ifDirective}' 或 '${directiveNames.elifDirective}' 指令.`);
        }

        // 处理class指令
        if (classDirective) {
          if (classDirective.value === null) {
            throw nodePath.get('openingElement').get(`attributes.${classDirective.key}`).buildCodeFrameError(`'${classDirective.name}' 指令需要绑定一个变量或表达式.`);
          }
          parseClassDirective(
            attributes,
            classDirective,
            directiveNodes.classNameAttr,
            classHelperAlias
          );
          state.__directiveHelpers.set(classHelperAlias, classHelper);
        }

        // 处理show指令
        if (showDirective) {
          if (showDirective.value === null) {
            throw nodePath.get('openingElement').get(`attributes.${showDirective.key}`).buildCodeFrameError(`'${showDirective.name}' 指令需要绑定一个变量或表达式.`);
          }
          parseShowDirective(
            attributes,
            showDirective,
            directiveNodes.styleAttr,
            showHelperAlias
          );
          state.__directiveHelpers.set(showHelperAlias, showHelper);
        }

        // 处理html指令
        if (htmlDirective) {
          if (htmlDirective.value === null) {
            throw nodePath.get('openingElement').get(`attributes.${htmlDirective.key}`).buildCodeFrameError(`'${htmlDirective.name}' 指令需要绑定一个变量或表达式.`);
          }
          parseHtmlDirective(
            attributes,
            htmlDirective,
            directiveNodes.dangerouslySetInnerHTMLAttr
          );
        }

        // 删除扩展属性
        const { prefix } = options;
        for (let i = 0, l = attributes.length; i < l; i++) {
          const attr = attributes[i];
          // 有可能存在 JSXSpreadAttribute
          if (types.isJSXAttribute(attr)) {
            const { name } = attr.name;
            if (name.startsWith(prefix)) {
              for (const n in directiveNames) {
                if (name === directiveNames[n]) {
                  attributes.splice(i, 1);
                  i -= 1;
                  l -= 1;
                  break;
                }
              }
            }
          }
        }
      }
    }
  };
};
