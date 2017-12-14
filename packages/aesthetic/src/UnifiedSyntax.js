/**
 * @copyright   2017, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 * @flow
 */

/* eslint-disable no-param-reassign */

import formatFontFace from './helpers/formatFontFace';
import isObject from './helpers/isObject';
import toArray from './helpers/toArray';

import type {
  AtRule,
  EventCallback,
  Statement,
  StatementUnified,
  Style,
  StyleBlock,
  StyleDeclaration,
  StyleDeclarationUnified,
} from '../../types';

export const GLOBAL_RULES: AtRule[] = [
  '@charset',
  '@document',
  '@font-face',
  '@import',
  '@keyframes',
  '@namespace',
  '@page',
  '@viewport',
];

export const LOCAL_RULES: AtRule[] = ['@fallbacks', '@media', '@supports'];

export default class UnifiedSyntax {
  events: { [eventName: string]: EventCallback } = {};

  fontFaces: { [fontFamily: string]: StyleBlock[] } = {};

  keyframes: { [animationName: string]: StyleBlock } = {};

  keyframesCache: { [animationName: string]: string } = {};

  constructor() {
    this
      .on('property', this.handleProperty)
      .on('@charset', this.handleCharset)
      .on('@document', this.handleDocument)
      .on('@fallbacks', this.handleFallbacks)
      .on('@font-face', this.handleFontFace)
      .on('@import', this.handleImport)
      .on('@keyframes', this.handleKeyframes)
      .on('@media', this.handleMedia)
      .on('@namespace', this.handleNamespace)
      .on('@page', this.handlePage)
      .on('@supports', this.handleSupports)
      .on('@viewport', this.handleViewport);
  }

  /**
   * Convert a mapping of style declarations to their native syntax.
   */
  convert(statement: StatementUnified): Statement {
    const prevStatement = { ...statement };
    const nextStatement = {};

    // Extract global at-rules first
    // eslint-disable-next-line complexity
    GLOBAL_RULES.forEach((rule) => {
      if (!prevStatement[rule]) {
        return;
      }

      switch (rule) {
        case '@charset':
        case '@import':
        case '@namespace': {
          const path = prevStatement[rule];

          if (typeof path === 'string') {
            this.emit(rule, [nextStatement, path]);
          } else if (__DEV__) {
            throw new Error(`${rule} value must be a string.`);
          }

          break;
        }

        case '@document': {
          const doc = prevStatement['@document'];

          Object.keys(doc).forEach((url) => {
            if (isObject(doc[url])) {
              this.emit(rule, [nextStatement, doc[url], url]);
            } else if (__DEV__) {
              throw new Error(`${rule} must be a mapping of URLs to style objects.`);
            }
          });

          break;
        }

        case '@font-face': {
          const faces = prevStatement['@font-face'];

          Object.keys(faces).forEach((fontFamily) => {
            const fontFaces = toArray(faces[fontFamily]).map(font => ({
              ...font,
              fontFamily,
            }));

            this.emit(rule, [nextStatement, fontFaces, fontFamily]);

            if (__DEV__ && this.fontFaces[fontFamily]) {
              throw new Error(`@font-face "${fontFamily}" already exists.`);
            }

            this.fontFaces[fontFamily] = fontFaces;
          });

          break;
        }

        case '@keyframes': {
          const frames = prevStatement['@keyframes'];

          Object.keys(frames).forEach((animationName) => {
            const keyframes = frames[animationName];

            if (isObject(keyframes)) {
              this.emit(rule, [nextStatement, keyframes, animationName]);
            } else if (__DEV__) {
              throw new Error(`${rule} must be a mapping of animation names to style objects.`);
            }

            if (__DEV__ && this.keyframes[animationName]) {
              throw new Error(`@keyframes "${animationName}" already exists.`);
            }

            // $FlowIgnore TODO
            this.keyframes[animationName] = keyframes;
          });

          break;
        }

        case '@page':
        case '@viewport': {
          const style = prevStatement[rule];

          if (isObject(style)) {
            this.emit(rule, [nextStatement, style]);
          } else if (__DEV__) {
            throw new Error(`${rule} must be a style object.`);
          }

          break;
        }

        default:
          break;
      }

      delete prevStatement[rule];
    });

    // Convert declarations last
    Object.keys(prevStatement).forEach((selector) => {
      const declaration = prevStatement[selector];

      if (!declaration) {
        return;
      }

      // At-rule
      if (selector.charAt(0) === '@') {
        if (__DEV__) {
          throw new SyntaxError(`Unsupported global at-rule "${selector}".`);
        }

      // Class name
      } else if (typeof declaration === 'string') {
        nextStatement[selector] = declaration;

      // Style object
      } else if (isObject(declaration)) {
        nextStatement[selector] = this.convertDeclaration(selector, declaration);

      } else if (__DEV__) {
        throw new Error(`Invalid style declaration for "${selector}".`);
      }
    });

    return nextStatement;
  }

  /**
   * Convert a style declaration including local at-rules and properties.
   */
  convertDeclaration(selector: string, declaration: StyleDeclarationUnified): StyleDeclaration {
    const prevDeclaration = { ...declaration };
    const nextDeclaration = {};

    // Convert properties first
    Object.keys(prevDeclaration).forEach((key) => {
      if (key.charAt(0) !== '@') {
        this.emit('property', [nextDeclaration, prevDeclaration[key], key]);
      }
    });

    // Extract local at-rules first
    LOCAL_RULES.forEach((rule) => {
      const style = prevDeclaration[rule];

      if (!style || !isObject(style)) {
        return;
      }

      if (rule === '@fallbacks') {
        Object.keys(style).forEach((property) => {
          this.emit(rule, [nextDeclaration, toArray(style[property]), property]);
        });

      } else if (rule === '@media' || rule === '@supports') {
        Object.keys(style).forEach((condition) => {
          if (isObject(style[condition])) {
            this.emit(rule, [nextDeclaration, style[condition], condition]);
          } else if (__DEV__) {
            throw new Error(`${selector} must be a mapping of conditions to style objects.`);
          }
        });
      }

      delete prevDeclaration[rule];
    });

    return nextDeclaration;
  }

  /**
   * Create a noop function that throws an error for unsupported features.
   */
  createUnsupportedHandler(rule: AtRule): () => void {
    return () => {
      throw new Error(`Adapter does not support ${rule}.`);
    };
  }

  /**
   * Execute the defined event listener with the arguments.
   */
  emit(eventName: string, args: *[] = []): this {
    if (this.events[eventName]) {
      this.events[eventName](...args);
    }

    return this;
  }

  /**
   * Handle @charset.
   */
  handleCharset(statement: Statement, style: string) {
    statement['@charset'] = style;
  }

  /**
   * Handle @document.
   */
  handleDocument(statement: Statement, style: StyleBlock, url: string) {
    statement[`@document ${url}`] = style;
  }

  /**
   * Handle fallback properties.
   */
  handleFallbacks(declaration: StyleDeclaration, style: Style[], property: string) {
    const value = declaration[property];

    if (typeof value === 'undefined') {
      return;
    }

    declaration[property] = [...style, value];
  }

  /**
   * Handle @font-face.
   */
  handleFontFace(statement: Statement, style: StyleBlock[], fontFamily: string) {
    statement['@font-face'] = style;
  }

  /**
   * Handle @namespace.
   */
  handleImport(statement: Statement, style: string) {
    statement['@namespace'] = style;
  }

  /**
   * Handle @keyframes.
   */
  handleKeyframes(statement: Statement, style: StyleBlock, animationName: string) {
    statement[`@keyframes ${animationName}`] = style;
  }

  /**
   * Handle @media.
   */
  handleMedia(declaration: StyleDeclaration, style: StyleBlock, condition: string) {
    declaration[`@media ${condition}`] = style;
  }

  /**
   * Handle @namespace.
   */
  handleNamespace(statement: Statement, style: string) {
    statement['@namespace'] = style;
  }

  /**
   * Handle @page.
   */
  handlePage(statement: Statement, style: StyleBlock) {
    statement['@page'] = style;
  }

  /**
   * Handle CSS properties.
   */
  handleProperty = (declaration: StyleDeclaration, style: Style, property: string) => {
    let value = style;

    if (property === 'animationName') {
      value = this.injectKeyframes(style, this.keyframes);

    } else if (property === 'fontFamily') {
      value = this.injectFontFaces(style, this.fontFaces);
    }

    declaration[property] = value;
  };

  /**
   * Handle @supports.
   */
  handleSupports(declaration: StyleDeclaration, style: StyleBlock, condition: string) {
    declaration[`@supports ${condition}`] = style;
  }

  /**
   * Handle @viewport.
   */
  handleViewport(statement: Statement, style: StyleBlock) {
    statement['@viewport'] = style;
  }

  /**
   * Replace a `fontFamily` property with font face objects of the same name.
   */
  injectFontFaces(value: Style, cache: Object): Style[] {
    const fontFaces = [];

    String(value).split(',').forEach((name) => {
      const familyName = name.trim();
      const fonts = cache[familyName];

      if (Array.isArray(fonts)) {
        fonts.forEach((font) => {
          fontFaces.push(formatFontFace(font));
        });
      } else {
        fontFaces.push(familyName);
      }
    });

    return fontFaces;
  }

  /**
   * Replace a `animationName` property with keyframe objects of the same name.
   */
  injectKeyframes(value: Style, cache: Object): Style[] {
    return String(value).split(',').map((name) => {
      const animationName = name.trim();

      return cache[animationName] || animationName;
    });
  }

  /**
   * Delete an event listener.
   */
  off(eventName: string): this {
    delete this.events[eventName];

    return this;
  }

  /**
   * Register an event listener.
   */
  on(eventName: string, callback: EventCallback): this {
    this.events[eventName] = callback;

    return this;
  }
}
