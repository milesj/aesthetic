import { SheetParams } from '@aesthetic/core';
import { debug } from './helpers';
import { State } from './types';

export function determineRenderParams({ aesthetic }: State) {
  debug('Determining render params');

  const params: SheetParams[] = [];
  // @ts-expect-error Allow access
  const { options } = aesthetic;
  // @ts-expect-error Allow access
  const { themes } = aesthetic.themeRegistry;

  // Support both LTR and RTL?
  const directions = [aesthetic.getActiveDirection()];

  if (options.directionConverter) {
    directions.push(aesthetic.getActiveDirection() === 'ltr' ? 'rtl' : 'ltr');
  }

  debug.invariant(true, 'Using directionality', directions.join(', '), 'No');

  // Should we apply vendor prefixes?
  const vendor = !!options.vendorPrefixer;

  debug.invariant(vendor, 'Using vendor prefixing', 'Yes', 'No');

  // Generate params for each theme and direction combination
  const themeNames = Object.keys(themes);

  debug('Using themes: %s', themeNames.join(', '));

  themeNames.forEach((theme) => {
    directions.forEach((direction) => {
      params.push({
        direction,
        theme,
        vendor,
      });
    });
  });

  debug('Generated %d permutations', params.length);

  return params;
}
