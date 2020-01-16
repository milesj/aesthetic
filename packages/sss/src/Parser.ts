/* eslint-disable lines-between-class-members, no-dupe-class-members, @typescript-eslint/unified-signatures */

import { isObject, toArray } from 'aesthetic-utils';
import Block from './Block';
import formatFontFace from './formatFontFace';
import compoundProperties from './compound';
import shorthandProperties from './shorthand';
import {
  DeclarationBlock,
  Keyframes,
  FontFace,
  Properties,
  LocalBlock,
  FallbackProperties,
  NestedBlockParams,
} from './types';

export const SELECTOR = /^((\[[a-z-]+\])|(::?[a-z-]+))$/iu;
export const ASYNC_TIMEOUT = 5000;

export type EnqueueCallback = (cb: () => void | Promise<void>) => void;

// Any is required for method overloading to work
export type Handler = (...args: any[]) => void;

export interface HandlerMap {
  [eventName: string]: Handler;
}

export default abstract class Parser<T extends object> {
  protected handlers: HandlerMap = {};

  constructor(handlers: HandlerMap = {}) {
    Object.entries(handlers).forEach(([key, value]) => {
      this.on(
        key.replace(/([A-Z])/gu, (match, char) => `:${char.toLowerCase()}`) as 'block',
        value,
      );
    });
  }

  parseBlock(builder: Block<T>, object: DeclarationBlock): Block<T> {
    if (__DEV__) {
      if (!isObject(object)) {
        throw new TypeError(`Block "${builder.selector}" must be an object of properties.`);
      }
    }

    Object.entries(object).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }

      // Pseudo and attribute selectors
      if (key.startsWith(':') || key.startsWith('[')) {
        this.parseSelector(builder, key, value as DeclarationBlock);

        // Special case for unique at-rules (@page blocks)
      } else if (key.startsWith('@')) {
        builder.addNested(this.parseBlock(new Block(key), value as DeclarationBlock));

        // Run for each property so it can be customized
      } else {
        this.emit('block:property', builder, key, this.transformProperty(key, value));
      }
    });

    this.emit('block', builder);

    return builder;
  }

  parseConditionalBlock(
    builder: Block<T>,
    object: { [key: string]: LocalBlock },
    type: 'media' | 'supports',
  ) {
    if (__DEV__) {
      if (!isObject(object)) {
        throw new Error(`@${type} must be an object of queries or conditions to declarations.`);
      }
    }

    Object.entries(object).forEach(([query, block]) => {
      this.emit(
        `block:${type}` as 'block:media',
        builder,
        query,
        this.parseLocalBlock(new Block(`@${type} ${query}`), block),
      );
    });
  }

  parseFallbackProperties(builder: Block<T>, fallbacks: FallbackProperties) {
    if (__DEV__) {
      if (!isObject(fallbacks)) {
        throw new Error('@fallbacks must be an object of property names to fallback values.');
      }
    }

    Object.entries(fallbacks).forEach(([prop, value]) => {
      this.emit('block:fallback', builder, prop, toArray(value));
    });
  }

  parseFontFace(fontFamily: string, object: FontFace): string {
    const fontFace = formatFontFace({
      ...object,
      fontFamily,
    }) as Properties;

    this.emit(
      'font-face',
      this.parseBlock(new Block('@font-face'), fontFace),
      fontFamily,
      object.srcPaths,
    );

    return fontFamily;
  }

  parseKeyframesAnimation(animationName: string, object: Keyframes): string {
    const name = object.name || animationName;
    const keyframes = new Block(`@keyframes ${name}`);

    // from, to, and percent keys aren't easily detectable
    Object.entries(object).forEach(([key, value]) => {
      if (key === 'name' || value === undefined) {
        return;
      }

      if (typeof value !== 'string') {
        keyframes.addNested(this.parseBlock(new Block(key), value));
      }
    });

    this.emit('keyframes', keyframes, name);

    return name;
  }

  parseLocalBlock(builder: Block<T>, object: LocalBlock): Block<T> {
    const props = { ...object };

    if (props['@fallbacks']) {
      this.parseFallbackProperties(builder, props['@fallbacks']);

      delete props['@fallbacks'];
    }

    if (props['@media']) {
      this.parseConditionalBlock(builder, props['@media'], 'media');

      delete props['@media'];
    }

    if (props['@selectors']) {
      Object.entries(props['@selectors']).forEach(([key, value]) => {
        this.parseSelector(builder, key, value, true);
      });

      delete props['@selectors'];
    }

    if (props['@supports']) {
      this.parseConditionalBlock(builder, props['@supports'], 'supports');

      delete props['@supports'];
    }

    return this.parseBlock(builder, props);
  }

  parseSelector(
    parent: Block<T>,
    selector: string,
    object: DeclarationBlock,
    inAtRule: boolean = false,
  ) {
    if (__DEV__) {
      if (!isObject(object)) {
        throw new Error(`Selector "${selector}" must be an object of properties.`);
      } else if ((selector.includes(',') || !selector.match(SELECTOR)) && !inAtRule) {
        throw new Error(
          `Advanced selector "${selector}" must be nested within a @selectors block.`,
        );
      }
    }

    const block = this.parseLocalBlock(new Block(selector), object);
    let specificity = 0;

    selector.split(',').forEach(k => {
      let name = k.trim();
      let type = 'block:selector';

      // Capture specificity
      while (name.charAt(0) === '&') {
        specificity += 1;
        name = name.slice(1);
      }

      if (selector.charAt(0) === ':') {
        type = 'block:pseudo';
      } else if (selector.charAt(0) === '[') {
        type = 'block:attribute';
      }

      this.emit(type as 'block:selector', parent, name, block.clone(name), { specificity });
    });
  }

  transformProperty(key: string, value: unknown): unknown {
    switch (key) {
      case 'animation':
        return compoundProperties.animation(value as Properties['animation']);

      case 'animationName':
        return compoundProperties.animationName(
          value as Properties['animationName'],
          (name, frames) => this.parseKeyframesAnimation(name, frames),
        );

      case 'fontFamily':
        return compoundProperties.fontFamily(value as Properties['fontFamily'], (name, face) =>
          this.parseFontFace(name, face),
        );

      case 'transition':
        return compoundProperties.transition(value as Properties['transition']);

      default: {
        if (key in shorthandProperties && isObject(value)) {
          return shorthandProperties[key as keyof typeof shorthandProperties](value);
        }
      }
    }

    return value;
  }

  /**
   * Execute the defined event listener with the arguments.
   */
  emit(
    name: 'block:attribute' | 'block:pseudo' | 'block:selector',
    parent: Block<T>,
    key: string,
    value: Block<T>,
    params: NestedBlockParams,
  ): void;
  emit(
    name: 'block:fallback' | 'block:property',
    parent: Block<T>,
    key: string,
    value: unknown,
  ): void;
  emit(
    name: 'block:media' | 'block:supports',
    parent: Block<T>,
    key: string,
    value: Block<T>,
  ): void;
  emit(name: 'block' | 'global' | 'page' | 'viewport', block: Block<T>): void;
  emit(name: 'charset' | 'class', charset: string): void;
  emit(name: 'css', css: string, className: string): void;
  emit(name: 'font-face', fontFace: Block<T>, fontFamily: string, srcPaths: string[]): void;
  emit(name: 'import', path: string): void;
  emit(name: 'keyframes', keyframes: Block<T>, animationName: string): void;
  emit(name: 'ruleset', selector: string, block: Block<T>): void;
  emit(name: string, ...args: unknown[]): void {
    if (this.handlers[name]) {
      this.handlers[name](...args);
    }
  }

  /**
   * Delete an event listener.
   */
  off(name: string): this {
    delete this.handlers[name];

    return this;
  }

  /**
   * Register an event listener.
   */
  on(
    name: 'block:attribute' | 'block:pseudo' | 'block:selector',
    callback: (parent: Block<T>, name: string, value: Block<T>, params: NestedBlockParams) => void,
  ): this;
  on(
    name: 'block:media' | 'block:supports',
    callback: (parent: Block<T>, name: string, value: Block<T>) => void,
  ): this;
  on(
    name: 'block:fallback' | 'block:property',
    callback: (parent: Block<T>, name: string, value: unknown) => void,
  ): this;
  on(name: 'block' | 'global' | 'page' | 'viewport', callback: (block: Block<T>) => void): this;
  on(name: 'charset' | 'class', callback: (value: string) => void): this;
  on(name: 'css', callback: (css: string, className: string) => void): this;
  on(
    name: 'font-face',
    callback: (fontFace: Block<T>, fontFamily: string, srcPaths: string[]) => void,
  ): this;
  on(name: 'import', callback: (path: string) => void): this;
  on(name: 'keyframes', callback: (keyframes: Block<T>, animationName: string) => void): this;
  on(name: 'ruleset', callback: (selector: string, block: Block<T>) => void): this;
  on(name: string, callback: Handler): this {
    this.handlers[name] = callback;

    return this;
  }

  protected createAsyncQueue(
    size: number,
    factory: (enqueue: EnqueueCallback) => void,
  ): Promise<void> {
    let counter = 0;

    return new Promise((resolve, reject) => {
      const runCheck = () => {
        counter += 1;

        if (counter === size) {
          resolve();
        }
      };

      const enqueue: EnqueueCallback = async cb => {
        if (counter >= size) {
          return;
        }

        await cb();

        runCheck();
      };

      factory(enqueue);

      setTimeout(() => {
        reject(new Error('Failed to parse and compile style sheet.'));
      }, ASYNC_TIMEOUT);
    });
  }
}