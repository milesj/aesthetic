import { types as t } from '@babel/core';
import { createDebugger } from '@boost/debug';

export const debug = createDebugger('aesthetic:babel');

export function isFunction(node: t.Node) {
  return t.isFunctionExpression(node) || t.isArrowFunctionExpression(node);
}
