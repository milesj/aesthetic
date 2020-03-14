import { isObject } from '@aesthetic/utils';
import { Transformer, TransformerHandler, Properties, TransformerUtils, Value } from './types';

export default function createTransformer<T>(
  property: keyof Properties,
  transformer?: Transformer<T>,
  unique?: boolean,
): TransformerHandler<T> {
  return (prop, wrap, customTransformer) => {
    if (typeof prop === 'string') {
      return prop;
    }

    if (typeof prop === 'number') {
      return wrap(property, prop);
    }

    const utils: TransformerUtils = {
      join(...values) {
        return values.filter(Boolean).join(' ');
      },
      separate(...values) {
        return values.filter(Boolean).join(' / ');
      },
      wrap(value) {
        return wrap(property, value);
      },
    };

    const handler = (item: T) => {
      if (isObject(item)) {
        if (customTransformer) {
          return customTransformer(item, utils);
        }

        if (transformer) {
          return transformer(prop, utils);
        }
      }

      return (item as unknown) as Value;
    };

    if (Array.isArray(prop)) {
      const result = prop.map(handler);

      return (unique ? Array.from(new Set(result)) : result).join(', ');
    }

    return handler(prop);
  };
}
