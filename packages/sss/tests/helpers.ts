/* eslint-disable no-magic-numbers */

import { objectLoop, isObject } from '@aesthetic/utils';
import Block from '../src/Block';
import { Properties } from '../src/types';

export function createBlock(id: string, properties?: object): Block<Properties> {
  const block = new Block(id);

  if (id.startsWith('@media')) {
    block.media = id.slice(6).trim();
  } else if (id.startsWith('@supports')) {
    block.supports = id.slice(9).trim();
  } else if (id.match(/^[^a-z0-9@]/iu)) {
    block.selector = id;
  }

  if (properties === undefined) {
    return block;
  }

  objectLoop(properties, (value, key) => {
    if (isObject(value)) {
      block.addNested(createBlock(key, value));
    } else {
      block.properties[key] = value;
    }
  });

  return block;
}

export function createExpectedBlock(
  id: string,
  properties?: object,
  { media, selector, supports }: Partial<Pick<Block, 'media' | 'selector' | 'supports'>> = {},
): Block<Properties> {
  const block = createBlock(id, properties);

  if (media) {
    block.media = media;
  }

  if (selector) {
    block.selector = selector;
  }

  if (supports) {
    block.supports = supports;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  block.parent = expect.any(Block);

  return block;
}
