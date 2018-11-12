/**
 * @copyright   2017, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import { ClassName } from 'aesthetic';
import { SimpleStyle } from 'jss/css';

export type NativeBlock = SimpleStyle & {
  fallbacks?: any;
};

export type ParsedBlock = ClassName;
