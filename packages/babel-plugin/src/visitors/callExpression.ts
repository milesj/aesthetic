/* eslint-disable no-param-reassign */

import { NodePath, types as t } from '@babel/core';
import { isFunction } from '../helpers';
import { compileComponentStyles } from '../process/compileComponentStyles';
import { State } from '../types';

// Find the parent variable declarator so that we include any chained methods
function findParentVariable(path: NodePath<t.CallExpression>, localName: string) {
  const parent = path.findParent((p) => t.isVariableDeclarator(p));

  if (!parent) {
    throw new Error(`"${localName}" must be assigned to a variable.`);
  }

  return parent as NodePath<t.VariableDeclarator>;
}

export default function callExpression(
  path: NodePath<t.CallExpression>,
  state: State,
  importPath: NodePath<t.ImportDeclaration>,
) {
  const { node } = path;
  const { styleFactories } = state;

  if (!t.isIdentifier(node.callee) || !(node.callee.name in styleFactories)) {
    return;
  }

  const localName = node.callee.name;
  const originalName = styleFactories[localName];
  let runtimeName = '';

  switch (originalName) {
    case 'createComponentStyles': {
      if (node.arguments.length !== 1 || !isFunction(node.arguments[0])) {
        throw new Error(`Expected a factory function for ${localName} in ${state.filename}.`);
      }

      const varPath = findParentVariable(path, localName);
      const compiledResult = compileComponentStyles(
        state,
        localName,
        varPath.node.init as t.CallExpression,
      );

      runtimeName = 'compileComponentStyles';
      varPath
        .get('init')
        .replaceWith(t.callExpression(t.identifier(runtimeName), [compiledResult]));

      break;
    }

    default:
      throw new Error(`Unknown style factory "${localName}".`);
  }

  // Inject runtime import
  if (!state.hasRuntimeImport) {
    state.hasRuntimeImport = true;

    importPath.insertAfter(
      t.importDeclaration(
        [t.importSpecifier(t.identifier(runtimeName), t.identifier(runtimeName))],
        t.stringLiteral('@aesthetic/core/runtime'),
      ),
    );
  }

  // Remove old named import
  importPath.node.specifiers = importPath.node.specifiers.filter(
    (spec) =>
      !(
        t.isImportSpecifier(spec) &&
        t.isIdentifier(spec.imported) &&
        spec.imported.name === originalName
      ),
  );

  // Remove import if all named imports have been removed
  if (importPath.node.specifiers.length === 0) {
    state.hasRemovedIntegration = true;
    importPath.remove();
  }
}
