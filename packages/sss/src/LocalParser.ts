import { isObject } from 'aesthetic-utils';
import Parser, { CommonEvents } from './Parser';
import Block from './Block';
import { LocalStyleSheet, ClassNameListener, CSSListener, RulesetListener } from './types';

export const CLASS_NAME = /^[a-z]{1}[a-z0-9-_]+$/iu;

export type StylisCallback = (selector: string, css: string) => string;

export interface LocalEvents<T extends object> extends CommonEvents<T> {
  onClass?: ClassNameListener;
  onCSS?: CSSListener;
  onRuleset?: RulesetListener<T>;
}

export default class LocalParser<T extends object> extends Parser<T, LocalEvents<T>> {
  stylis?: StylisCallback;

  async parse(styleSheet: LocalStyleSheet): Promise<void> {
    const entries = Object.entries(styleSheet);

    return this.createAsyncQueue(entries.length * 3, enqueue => {
      entries.forEach(([selector, declaration]) => {
        // At-rule
        if (selector.charAt(0) === '@') {
          if (__DEV__) {
            throw new SyntaxError(
              `At-rules may not be defined at the root of a local block, found "${selector}".`,
            );
          }

          // Class name / CSS
        } else if (typeof declaration === 'string') {
          if (declaration.match(CLASS_NAME)) {
            enqueue(() => this.emit('class', declaration));
          } else {
            enqueue(() => this.parseRawCSS(selector, declaration));
          }

          // Declaration
        } else if (isObject(declaration)) {
          enqueue(() => {
            this.emit('ruleset', selector, this.parseLocalBlock(new Block(selector), declaration));
          });

          // Unknown
        } else if (__DEV__) {
          throw new Error(
            `Invalid declaration for "${selector}". Must be an object (style declaration) or string (raw css, class name).`,
          );
        }
      });
    });
  }

  async parseRawCSS(selector: string, raw: string) {
    if (!this.stylis) {
      const Stylis = (await import('stylis')).default;

      this.stylis = new Stylis({
        compress: !__DEV__,
        global: false,
        keyframe: true,
        prefix: true,
      });
    }

    const className = this.hash(selector);

    this.emit('css', this.stylis(`.${className}`, raw.trim()), className);
  }
}
