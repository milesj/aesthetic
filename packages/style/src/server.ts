import { EngineOptions, VariablesMap } from '@aesthetic/types';
import { objectLoop } from '@aesthetic/utils';
import { renderToStyleMarkup } from './server/markup';
import { TransientSheet, createSheetManager } from './server/sheet';
// Rollup compatibility
import { createCacheManager, createStyleEngine, formatVariable, StyleEngine } from './index';

export { renderToStyleMarkup };

function setRootVariables(vars: VariablesMap, engine: StyleEngine) {
  const sheet = engine.sheetManager.sheets.global;

  objectLoop(vars, (value, key) => {
    sheet.cssVariables[formatVariable(key)] = String(value);
  });
}

export function createServerEngine(options: Partial<EngineOptions> = {}): StyleEngine {
  const engine: StyleEngine = {
    ...createStyleEngine({
      cacheManager: createCacheManager(),
      sheetManager: createSheetManager({
        conditions: new TransientSheet(),
        global: new TransientSheet(),
        standard: new TransientSheet(),
      }),
      ...options,
    }),
    setRootVariables: (vars) => setRootVariables(vars, engine),
  };

  return engine;
}

export function extractStyles<T>(result: T, engine: StyleEngine): T {
  global.AESTHETIC_CUSTOM_ENGINE = engine;
  process.env.AESTHETIC_SSR = 'true';

  return result;
}
