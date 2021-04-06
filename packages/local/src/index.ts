/**
 * @copyright   2021, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import { Aesthetic, ClassName, ElementStyles } from '@aesthetic/core';
import { createClientEngine } from '@aesthetic/style';

export const internalAestheticRuntime = new Aesthetic<ClassName, ElementStyles>();

internalAestheticRuntime.configureEngine(createClientEngine());

export const {
  changeDirection,
  changeTheme,
  configure,
  createComponentStyles,
  createThemeStyles,
  generateClassName,
  getActiveDirection,
  getActiveTheme,
  getEngine,
  getTheme,
  registerDefaultTheme,
  registerTheme,
  renderComponentStyles,
  renderFontFace,
  renderImport,
  renderKeyframes,
  renderThemeStyles,
  subscribe,
  unsubscribe,
} = internalAestheticRuntime;
