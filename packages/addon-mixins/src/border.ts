import { Rule } from '@aesthetic/sss';
import { Utilities, PALETTE_TYPES, SHADE_RANGES, BORDER_SIZES } from '@aesthetic/system';
import { checkList } from './checks';
import { BorderOptions } from './types';

export function border(
  this: Utilities,
  { palette = 'neutral', radius = true, shade = '40', size = 'df' }: BorderOptions = {},
): Rule {
  if (__DEV__) {
    checkList('palette', palette, PALETTE_TYPES);
    checkList('shade', shade, SHADE_RANGES);
    checkList('size', size, BORDER_SIZES);
  }

  const rule: Rule = {
    borderColor: this.var(`palette-${palette}-color-${shade}` as 'palette-neutral-color-00'),
    borderStyle: 'solid',
    borderWidth: this.var(`border-${size}-width` as 'border-df-width'),
  };

  if (radius) {
    rule.borderRadius = this.var(`border-${size}-radius` as 'border-df-radius');
  }

  return rule;
}
