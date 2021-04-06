/**
 * @copyright   2020, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import { Direction, EngineOptions, VariablesMap } from '@aesthetic/types';
import { objectLoop } from '@aesthetic/utils';
import { createStyleElements, getStyleElement } from './client/dom';
import { hydrateStyles } from './client/hydration';
import { createCacheManager } from './common/cache';
import { createStyleEngine } from './common/engine';
import { createSheetManager } from './common/sheet';
import { formatVariable } from './common/syntax';
import { StyleEngine } from './types';

export * from './common/cache';
export * from './common/constants';
export * from './common/engine';
export * from './common/helpers';
export * from './common/sheet';
export * from './common/syntax';
export * from './types';

export { createStyleElements, getStyleElement };

// Set active direction on the document `dir` attribute
function setDirection(direction: Direction) {
  document.documentElement.setAttribute('dir', direction);
}

// Set CSS variables to :root
function setRootVariables(vars: VariablesMap) {
  objectLoop(vars, (value, key) => {
    document.documentElement.style.setProperty(formatVariable(key), String(value));
  });
}

// Set active theme class names on the `body`
function setTheme(classNames: string[]) {
  document.body.className = classNames.join(' ');
}

export function createClientEngine(options: Partial<EngineOptions> = {}): StyleEngine {
  if (global.AESTHETIC_CUSTOM_ENGINE) {
    return global.AESTHETIC_CUSTOM_ENGINE as StyleEngine;
  }

  const direction = (document.documentElement.getAttribute('dir') ||
    document.body.getAttribute('dir') ||
    'ltr') as Direction;

  const engine: StyleEngine = createStyleEngine({
    cacheManager: createCacheManager(),
    direction,
    sheetManager: createSheetManager(createStyleElements()),
    ...options,
  });

  // Match against browser preferences
  engine.prefersColorScheme = (scheme) => matchMedia(`(prefers-color-scheme: ${scheme})`).matches;
  engine.prefersContrastLevel = (level) => matchMedia(`(prefers-contrast: ${level})`).matches;

  // Handle DOM specific logic
  engine.setDirection = setDirection;
  engine.setRootVariables = setRootVariables;
  engine.setTheme = setTheme;

  // Attempt to hydrate styles immediately
  hydrateStyles(engine);

  return engine;
}
