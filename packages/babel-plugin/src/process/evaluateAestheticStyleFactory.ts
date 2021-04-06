import vm from 'vm';
import { generateHash } from '@aesthetic/utils';
import { types as t } from '@babel/core';
import generate from '@babel/generator';
import { debug } from '../helpers';
import { State } from '../types';

export function evaluateAestheticStyleFactory<T>(
  state: State,
  factoryName: string,
  exportedNode: t.CallExpression,
): T {
  debug('Evaluating %s style factory with code:', factoryName);

  const destructureAesthetic = t.variableDeclaration('const', [
    t.variableDeclarator(
      t.objectPattern([
        t.objectProperty(t.identifier('createComponentStyles'), t.identifier(factoryName)),
      ]),
      t.identifier('aesthetic'),
    ),
  ]);

  const exportedValue = t.expressionStatement(
    t.assignmentExpression('=', t.identifier('exportedValue'), exportedNode),
  );

  // Convert the AST into code
  const { code } = generate(t.program([destructureAesthetic, exportedValue], []));

  debug('%s', code);

  // Evaluate the code in the current module scope
  const dirPath = state.filePath.parent();
  const fileName = dirPath.append(`${generateHash(code)}.js`).path();

  debug('Using temporary file path: %s', fileName);

  return vm.runInNewContext(
    code,
    {
      __dirname: dirPath.path(),
      __filename: fileName,
      aesthetic: state.aesthetic,
      console,
      global,
      require,
    },
    fileName,
  );
}
