/**
 * @copyright   2020, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import { ClientRenderer } from '@aesthetic/style';
import Aesthetic from './Aesthetic';
import GlobalSheet from './GlobalSheet';
import LocalSheet from './LocalSheet';
import Sheet from './Sheet';

export const aesthetic = new Aesthetic();
export const {
  changeTheme,
  configure,
  createComponentStyles,
  createThemeStyles,
  generateClassName,
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

export { GlobalSheet, LocalSheet, Sheet, ClientRenderer };
