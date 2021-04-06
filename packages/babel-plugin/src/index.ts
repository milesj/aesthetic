/* eslint-disable no-param-reassign */

/**
 * @copyright   2021, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import { ConfigAPI, NodePath, PluginObj, types as t } from '@babel/core';
import {} from '@babel/generator';
import { Path } from '@boost/common';
import { debug } from './helpers';
import { loadAesthetic } from './loadAesthetic';
import { Options, State } from './types';
import callExpression from './visitors/callExpression';

const STYLE_FACTORIES = new Set([
  'createComponentStyles',
  // 'createStyled',
  // 'createThemeStyles',
  // 'useCss',
]);

export default function babelPlugin(
  api: ConfigAPI,
  options: Options,
  root: string,
): PluginObj<State> {
  debug('Instantiating plugin with options');
  debug('%O', options);

  return {
    name: '@aesthetic/babel-plugin',

    visitor: {
      Program: {
        enter(path: NodePath<t.Program>, state: State) {
          debug('\n\n-----> %s', state.filename);
          debug('Initializing program state');

          state.filePath = new Path(state.filename);
          state.integrationModule = '';
          state.styleFactories = {};

          // Determine if a style factory exists within the current file,
          // and if so, extract its imported name in case its been reassigned.
          let importPath: NodePath<t.ImportDeclaration>;

          path.node.body.forEach((node, index) => {
            if (
              !t.isImportDeclaration(node) ||
              !node.source.value.startsWith('@aesthetic') ||
              node.specifiers.length === 0
            ) {
              return;
            }

            let hasFactory = false;

            node.specifiers.forEach((spec) => {
              if (
                t.isImportSpecifier(spec) &&
                t.isIdentifier(spec.imported) &&
                STYLE_FACTORIES.has(spec.imported.name)
              ) {
                state.styleFactories[spec.local.name] = spec.imported.name;
                hasFactory = true;
              }
            });

            if (hasFactory) {
              importPath = path.get(`body.${index}`) as NodePath<t.ImportDeclaration>;
              state.integrationModule = node.source.value;
            }
          });

          debug.invariant(
            !!state.integrationModule,
            'Finding @aesthetic integration and imports',
            `${state.integrationModule} -> ${Object.keys(state.styleFactories).join(', ')}`,
            'None found, aborting plugin',
          );

          if (!state.integrationModule) {
            return;
          }

          // Setup Aesthetic before evaluating factories
          state.aesthetic = loadAesthetic(
            Path.resolve(options.setupPath, root),
            state.integrationModule,
          );

          if (!state.aesthetic) {
            return;
          }

          // Traverse the file and transform
          path.traverse(
            {
              CallExpression(node) {
                callExpression(node, state, importPath);
              },
            },
            state,
          );
        },
      },
    },
  };
}
