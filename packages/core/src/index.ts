/**
 * @copyright   2020, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import { ClientRenderer } from '@aesthetic/style';
import Aesthetic from './Aesthetic';
import StyleSheet from './StyleSheet';

export const aesthetic = new Aesthetic();
export const {
  changeDirection,
  changeTheme,
  configure,
  createComponentStyles,
  createThemeStyles,
  generateClassName,
  getActiveDirection,
  getActiveTheme,
  getTheme,
  hydrate,
  registerDefaultTheme,
  registerTheme,
  renderComponentStyles,
  renderFontFace,
  renderImport,
  renderKeyframes,
  renderThemeStyles,
  subscribe,
  unsubscribe,
} = aesthetic;

export * from '@aesthetic/sss';
export * from '@aesthetic/system';
export * from './types';

export { StyleSheet, ClientRenderer };
