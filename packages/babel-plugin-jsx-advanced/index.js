'use strict';

const parseClassDirective = require('./parse/x-class');
const parseForDirective = require('./parse/x-for');
const parseHtmlDirective = require('./parse/x-html');
const parseIfDirective = require('./parse/x-if');
const parseShowDirective = require('./parse/x-show');
const parseIfTag = require('./parse/if');

const DEFAULT_IF_TAG = 'if';
const DEFAULT_ELSE_IF_TAG = 'elif';
const DEFAULT_ELSE_TAG = 'else';

function checkDirectiveValue(nodePath, directive) {
  if (directive.value === null) {
    throw nodePath
      .get('openingElement')
      .get(`attributes.${directive.key}`)
      .buildCodeFrameError(`'${directive.name}' 指令需要绑定一个变量或表达式.`);
  }
}

function getDirectiveNames({
  prefix,
  supportFor,
  supportIf,
  supportClass,
  supportShow,
  supportHtml,
  elifAlias
}) {
  const names = Object.create(null);
  if (supportFor !== false) {
    names.forDirective = `${prefix}for`;
  }
  if (supportIf !== false) {
    names.ifDirective = `${prefix}if`;
    names.elifDirective = `${prefix}${elifAlias}`;
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


const jsxMethods = [
  'jsxAttribute',
  'jSXAttribute',

  'jsxExpressionContainer',
  'jSXExpressionContainer',

  'jsxIdentifier',
  'jSXIdentifier'
];

function compat6(types) {
  for (let i = 0, len = jsxMethods.length; i < len; i++) {
    const alias = jsxMethods[i];
    if (!types[alias]) {
      types[alias] = types[jsxMethods[++i]];
    }
  }

  if (!types.jsxFragment) {
    types.jsxFragment = function (openingFragment, closingFragment, children) {
      return types.jSXElement(openingFragment, closingFragment, children);
    };
  }

  if (!types.jsxOpeningFragment) {
    types.jsxOpeningFragment = function () {
      return types.jSXOpeningElement(
        types.jSXMemberExpression(types.jSXIdentifier('React'), types.jSXIdentifier('Fragment')),
        []
      );
    };
  }

  if (!types.jsxClosingFragment) {
    types.jsxClosingFragment = function () {
      return types.jSXClosingElement(
        types.jSXMemberExpression(types.jSXIdentifier('React'), types.jSXIdentifier('Fragment'))
      );
    };
  }
}

module.exports = function ({ version, types }, options) {
  // 兼容babel 6
  if (+version[0] < 7) {
    compat6(types);
  }

  options = options || {};
  if (!options.prefix) {
    options.prefix = 'x-';
  }
  if (!options.elifAlias) {
    options.elifAlias = DEFAULT_ELSE_IF_TAG;
  }
  const directiveNames = getDirectiveNames(options);
  const {
    classHelper = 'fast-classnames',
    showHelper = 'babel-runtime-jsx-advanced-helper/show-helper',
    forHelper = 'babel-runtime-jsx-advanced-helper/for-helper',
    classHelperAlias = '__class_helper__',
    showHelperAlias = '__show_helper__',
    forHelperAlias = '__for_helper__',
    supportIfTag,
    elifAlias
  } = options;
  const IF_TAG = DEFAULT_IF_TAG;
  const ELSE_TAG = DEFAULT_ELSE_TAG;
  const ELSE_IF_TAG = elifAlias;

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
            if (!body.some((node) => node.type === 'ImportDeclaration'
              && node.specifiers.some((specifier) => specifier.local.name === alias))) {
              // 'import alias from helper';
              const importDeclaration = types.importDeclaration(
                [
                  // eslint-disable-next-line @babel/new-cap
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
            case IF_TAG:
              parseIfTag(
                types,
                nodePath,
                ELSE_IF_TAG,
                ELSE_TAG
              );
              return;
            case ELSE_IF_TAG:
              throw nodePath.buildCodeFrameError(`<${ELSE_IF_TAG}> 标签需要上一个JSX节点是 '${IF_TAG}' 标签.`);
            case ELSE_TAG:
              throw nodePath.buildCodeFrameError(`<${ELSE_TAG}> 标签需要上一个JSX节点是 '${IF_TAG}' 或 '${ELSE_IF_TAG}' 标签.`);
          }
        }

        // 匹配需要处理的指令
        const directiveNodes = getDirectiveNodes(types, directiveNames, attributes);
        const {
          forDirective,
          ifDirective,
          elifDirective,
          elseDirective,
          classDirective,
          showDirective,
          htmlDirective
        } = directiveNodes;

        // 处理for指令
        if (forDirective) {
          checkDirectiveValue(nodePath, forDirective);
          parseForDirective(
            types,
            nodePath,
            forDirective,
            forHelperAlias
          );
          state.__directiveHelpers.set(forHelperAlias, forHelper);
          attributes.splice(forDirective.key, 1);
          return;
        }

        // 处理if指令
        if (ifDirective) {
          checkDirectiveValue(nodePath, ifDirective);
          parseIfDirective(
            types,
            nodePath,
            ifDirective,
            directiveNames.elifDirective,
            directiveNames.elseDirective
          );
          attributes.splice(ifDirective.key, 1);
        }
        else if (elifDirective) {
          throw nodePath
            .buildCodeFrameError(`'${elifDirective.name}' 指令需要上一个JSX节点包含 '${directiveNames.ifDirective}' 指令.`);
        }
        else if (elseDirective) {
          throw nodePath
            // eslint-disable-next-line max-len
            .buildCodeFrameError(`'${elseDirective.name}' 指令需要上一个JSX节点包含 '${directiveNames.ifDirective}' 或 '${directiveNames.elifDirective}' 指令.`);
        }

        // 处理class指令
        if (classDirective) {
          checkDirectiveValue(nodePath, classDirective);
          parseClassDirective(
            types,
            attributes,
            classDirective,
            directiveNodes.classNameAttr,
            classHelperAlias
          );
          state.__directiveHelpers.set(classHelperAlias, classHelper);
        }

        // 处理show指令
        if (showDirective) {
          checkDirectiveValue(nodePath, showDirective);
          parseShowDirective(
            types,
            attributes,
            showDirective,
            directiveNodes.styleAttr,
            showHelperAlias
          );
          state.__directiveHelpers.set(showHelperAlias, showHelper);
        }

        // 处理html指令
        if (htmlDirective) {
          checkDirectiveValue(nodePath, htmlDirective);
          parseHtmlDirective(
            types,
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
