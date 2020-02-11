import { ColorShade } from '@aesthetic/system';
import { PlatformType } from './types';
import { FONT_FAMILIES } from './constants';

export function font(platform: PlatformType, type: 'monospace' | 'system') {
  return FONT_FAMILIES[`${platform}-${type}` as 'web-system'];
}

export function formatShade(value: number): ColorShade {
  return String(value ?? 0)
    .padStart(2, '0')
    .slice(0, 2) as ColorShade;
}

export function formatUnit(value: number): string {
  return value.toFixed(2).replace('.00', '');
}
