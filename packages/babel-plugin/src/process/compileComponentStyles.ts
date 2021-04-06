import { types as t } from '@babel/core';
import { convertResultInputSheetToAST } from '../ast/convertResultInputSheet';
import { State } from '../types';
import { compileStyleSheet } from './compileStyleSheet';
import { evaluateAestheticStyleFactory } from './evaluateAestheticStyleFactory';

export function compileComponentStyles(
  state: State,
  factoryName: string,
  factoryCall: t.CallExpression,
): t.ObjectExpression {
  const resultSheet = compileStyleSheet(
    state,
    evaluateAestheticStyleFactory(state, factoryName, factoryCall),
  );

  // eslint-disable-next-line no-param-reassign
  state.file.metadata.aesthetic = { renderResult: resultSheet };

  return convertResultInputSheetToAST(resultSheet);
}
