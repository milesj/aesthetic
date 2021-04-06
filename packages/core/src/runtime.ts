import RuntimeStyleSheet from './RuntimeStyleSheet';
import { CompiledRenderResultSheet } from './types';

export function compileComponentStyles(compiled: CompiledRenderResultSheet) {
  return new RuntimeStyleSheet('local', compiled);
}
