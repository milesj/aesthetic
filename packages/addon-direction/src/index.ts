/**
 * @copyright   2020, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import { Direction, Value } from '@aesthetic/types';
import { getPropertyDoppelganger, getValueDoppelganger } from 'rtl-css-js/core';

export default {
  convert<T extends Value>(from: Direction, to: Direction, property: string, value: T) {
    if (from === to) {
      return { property, value };
    }

    return {
      property: getPropertyDoppelganger(property),
      value: getValueDoppelganger(property, value),
    };
  },
};
