import { Theme } from '@aesthetic/system';
import { objectLoop } from '@aesthetic/utils';
import { SheetParams } from './types';

export function createCacheKey(params: SheetParams, type: string): string {
  let key = type;

  // Since all other values are scalars, we can just join the values.
  // This is 3x faster than JSON.stringify(), and 1.5x faster than Object.values()!
  objectLoop(params, (value) => {
    key += value;
  });

  return key;
}

export function createDefaultParams(theme: Theme<{}>, params: SheetParams): Required<SheetParams> {
  return {
    contrast: theme.contrast,
    deterministic: false,
    direction: 'ltr',
    scheme: theme.scheme,
    theme: theme.name,
    unit: 'px',
    vendor: false,
    ...params,
  };
}
