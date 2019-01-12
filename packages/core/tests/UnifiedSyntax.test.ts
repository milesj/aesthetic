/* eslint-disable no-param-reassign */

import UnifiedSyntax from '../src/UnifiedSyntax';
import Ruleset from '../src/Ruleset';
import Sheet from '../src/Sheet';
import { Properties } from '../src/types';
import {
  FONT_CIRCULAR_MULTIPLE_FLAT_SRC,
  FONT_CIRCULAR_MULTIPLE,
  FONT_ROBOTO_FLAT_SRC,
  FONT_ROBOTO,
  KEYFRAME_FADE,
  KEYFRAME_SLIDE_PERCENT,
  SYNTAX_CHARSET,
  SYNTAX_FALLBACKS,
  SYNTAX_FONT_FACE_MIXED,
  SYNTAX_FONT_FACE_MULTIPLE,
  SYNTAX_FONT_FACE,
  SYNTAX_FONT_FACES_INLINE,
  SYNTAX_GLOBAL,
  SYNTAX_IMPORT_MULTIPLE,
  SYNTAX_IMPORT,
  SYNTAX_KEYFRAMES_MIXED,
  SYNTAX_KEYFRAMES_PERCENT,
  SYNTAX_KEYFRAMES,
  SYNTAX_MEDIA_QUERY,
  SYNTAX_PAGE,
  SYNTAX_SUPPORTS,
  SYNTAX_VIEWPORT,
  SYNTAX_MULTI_SELECTOR,
  SYNTAX_KEYFRAMES_INLINE,
} from '../../../tests/mocks';
import { createTestRulesets, createTestKeyframes } from '../../../tests/helpers';

describe('UnifiedSyntax', () => {
  let syntax: UnifiedSyntax<Properties>;
  let sheet: Sheet<Properties>;
  let ruleset: Ruleset<Properties>;

  beforeEach(() => {
    syntax = new UnifiedSyntax();
    sheet = new Sheet();
    ruleset = new Ruleset('test', sheet);
  });

  it('can add, remove, and emit an event handler', () => {
    const spy = jest.fn();

    syntax.on('property', spy);

    expect(syntax.handlers.property).toBe(spy);

    syntax.emit('property', [ruleset, 'display', 'block']);

    expect(spy).toHaveBeenCalledWith(ruleset, 'display', 'block');

    syntax.off('property');

    expect(syntax.handlers.property).toBeUndefined();
  });

  describe('convertGlobalSheet()', () => {
    it('errors for unknown properties (not at-rules)', () => {
      expect(() => {
        syntax.convertGlobalSheet({
          // @ts-ignore Allow unknown
          unknown: 'property',
        });
      }).toThrowErrorMatchingSnapshot();
    });

    it('returns a sheet object', () => {
      expect(syntax.convertGlobalSheet({})).toBeInstanceOf(Sheet);
    });

    describe('@charset', () => {
      it('emits event', () => {
        const spy = jest.fn();

        syntax.on('charset', spy);
        syntax.convertGlobalSheet(SYNTAX_CHARSET);

        expect(spy).toHaveBeenCalledWith(sheet, 'utf8');
      });

      it('errors if not a string', () => {
        expect(() => {
          syntax.convertGlobalSheet({
            // @ts-ignore Allow invalid type
            '@charset': 123,
          });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('@font-face', () => {
      beforeEach(() => {
        syntax.on('property', (parent: Ruleset<Properties>, key: keyof Properties, value: any) => {
          parent.addProperty(key, value);
        });
      });

      it('emits event for a single font', () => {
        const spy = jest.fn();

        syntax.on('font-face', spy);
        syntax.convertGlobalSheet(SYNTAX_FONT_FACE);

        expect(spy).toHaveBeenCalledWith(
          sheet,
          createTestRulesets('Roboto', [FONT_ROBOTO_FLAT_SRC]),
          'Roboto',
          [FONT_ROBOTO.srcPaths],
        );
      });

      it('emits event for a single font with multiple faces', () => {
        const spy = jest.fn();

        syntax.on('font-face', spy);
        syntax.convertGlobalSheet(SYNTAX_FONT_FACE_MULTIPLE);

        expect(spy).toHaveBeenCalledWith(
          sheet,
          createTestRulesets('Circular', FONT_CIRCULAR_MULTIPLE_FLAT_SRC),
          'Circular',
          FONT_CIRCULAR_MULTIPLE.map(font => font.srcPaths),
        );
      });

      it('emits event for multiple fonts', () => {
        const spy = jest.fn();

        syntax.on('font-face', spy);
        syntax.convertGlobalSheet(SYNTAX_FONT_FACE_MIXED);

        expect(spy).toHaveBeenCalledWith(
          sheet,
          createTestRulesets('Roboto', [FONT_ROBOTO_FLAT_SRC]),
          'Roboto',
          [FONT_ROBOTO.srcPaths],
        );

        expect(spy).toHaveBeenCalledWith(
          sheet,
          createTestRulesets('Circular', FONT_CIRCULAR_MULTIPLE_FLAT_SRC),
          'Circular',
          FONT_CIRCULAR_MULTIPLE.map(font => font.srcPaths),
        );
      });

      it('errors if not an object', () => {
        expect(() => {
          syntax.convertGlobalSheet({
            // @ts-ignore Allow invalid type
            '@font-face': 123,
          });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('@global', () => {
      it('emits event per selector', () => {
        const spy = jest.fn();

        syntax.on('global', spy);
        syntax.convertGlobalSheet(SYNTAX_GLOBAL);

        expect(spy).toHaveBeenCalledWith(sheet, 'body', sheet.createRuleset('body'));
        expect(spy).toHaveBeenCalledWith(sheet, 'html', sheet.createRuleset('html'));
        expect(spy).toHaveBeenCalledWith(sheet, 'a', sheet.createRuleset('a'));
      });

      it('errors if not an object', () => {
        expect(() => {
          syntax.convertGlobalSheet({
            // @ts-ignore Allow invalid type
            '@global': 123,
          });
        }).toThrowErrorMatchingSnapshot();
      });

      it('errors if select value is not an object', () => {
        expect(() => {
          syntax.convertGlobalSheet({
            // @ts-ignore Allow invalid type
            '@global': {
              foo: 123,
            },
          });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('@import', () => {
      it('emits event for a string', () => {
        const spy = jest.fn();

        syntax.on('import', spy);
        syntax.convertGlobalSheet(SYNTAX_IMPORT);

        expect(spy).toHaveBeenCalledWith(sheet, ['./some/path.css']);
      });

      it('emits event for an array of strings', () => {
        const spy = jest.fn();

        syntax.on('import', spy);
        syntax.convertGlobalSheet(SYNTAX_IMPORT_MULTIPLE);

        expect(spy).toHaveBeenCalledWith(sheet, ['./some/path.css', './another/path.css']);
      });

      it('errors if not a string', () => {
        expect(() => {
          syntax.convertGlobalSheet({
            // @ts-ignore Allow invalid type
            '@import': 123,
          });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('@keyframes', () => {
      beforeEach(() => {
        syntax.on('property', (parent: Ruleset<Properties>, key: keyof Properties, value: any) => {
          parent.addProperty(key, value);
        });
      });

      it('emits event', () => {
        const spy = jest.fn();

        syntax.on('keyframe', spy);
        syntax.convertGlobalSheet(SYNTAX_KEYFRAMES);

        expect(spy).toHaveBeenCalledWith(sheet, createTestKeyframes('fade', KEYFRAME_FADE), 'fade');
      });

      it('emits event with percentage based keyframes', () => {
        const spy = jest.fn();

        syntax.on('keyframe', spy);
        syntax.convertGlobalSheet(SYNTAX_KEYFRAMES_PERCENT);

        expect(spy).toHaveBeenCalledWith(
          sheet,
          createTestKeyframes('slide', KEYFRAME_SLIDE_PERCENT),
          'slide',
        );
      });

      it('emits event for multiple keyframes', () => {
        const spy = jest.fn();

        syntax.on('keyframe', spy);
        syntax.convertGlobalSheet(SYNTAX_KEYFRAMES_MIXED);

        expect(spy).toHaveBeenCalledWith(sheet, createTestKeyframes('fade', KEYFRAME_FADE), 'fade');
        expect(spy).toHaveBeenCalledWith(
          sheet,
          createTestKeyframes('slide', KEYFRAME_SLIDE_PERCENT),
          'slide',
        );
      });

      it('errors if not a string', () => {
        expect(() => {
          syntax.convertGlobalSheet({
            // @ts-ignore Allow invalid type
            '@keyframes': 123,
          });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('@page', () => {
      it('emits event', () => {
        const spy = jest.fn();

        syntax.on('page', spy);
        syntax.convertGlobalSheet(SYNTAX_PAGE);

        expect(spy).toHaveBeenCalledWith(sheet, sheet.createRuleset('@page'));
      });

      it('errors if not an object', () => {
        expect(() => {
          syntax.convertGlobalSheet({
            // @ts-ignore Allow invalid type
            '@page': 123,
          });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('@viewport', () => {
      it('emits event', () => {
        const spy = jest.fn();

        syntax.on('viewport', spy);
        syntax.convertGlobalSheet(SYNTAX_VIEWPORT);

        expect(spy).toHaveBeenCalledWith(sheet, sheet.createRuleset('@viewport'));
      });

      it('errors if not an object', () => {
        expect(() => {
          syntax.convertGlobalSheet({
            // @ts-ignore Allow invalid type
            '@viewport': 123,
          });
        }).toThrowErrorMatchingSnapshot();
      });
    });
  });

  describe('convertStyleSheet()', () => {
    it('errors for an at-rule', () => {
      expect(() => {
        syntax.convertStyleSheet({
          '@rule': {},
        });
      }).toThrowErrorMatchingSnapshot();
    });

    it('errors for invalid value type', () => {
      expect(() => {
        syntax.convertStyleSheet({
          // @ts-ignore Allow invalid type
          el: 123,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    it('skips over falsy values', () => {
      const stylesheet = syntax.convertStyleSheet({
        string: '',
        // @ts-ignore Allow undefined
        object: undefined,
      });

      expect(stylesheet).toEqual(sheet);
    });

    it('sets string as class name on sheet', () => {
      const stylesheet = syntax.convertStyleSheet({
        foo: 'foo',
        bar: 'bar',
        baz: {},
      });

      expect(stylesheet.classNames).toEqual({
        foo: 'foo',
        bar: 'bar',
      });
    });

    it('converts ruleset and adds to sheet', () => {
      const spy = jest.spyOn(syntax, 'convertRuleset');
      const stylesheet = syntax.convertStyleSheet({
        el: { display: 'block' },
      });

      expect(spy).toHaveBeenCalledWith({ display: 'block' }, expect.anything());
      expect(stylesheet).toEqual(sheet.addRuleset(sheet.createRuleset('el')));
    });
  });

  describe('convertRuleset()', () => {
    it('errors for a non-object', () => {
      expect(() => {
        // @ts-ignore Allow invalid type
        syntax.convertRuleset(123, ruleset);
      }).toThrowErrorMatchingSnapshot();
    });

    it('errors for unknown at-rule', () => {
      expect(() => {
        syntax.convertRuleset(
          {
            // @ts-ignore Allow
            '@unknown': {},
          },
          ruleset,
        );
      }).toThrowErrorMatchingSnapshot();
    });

    it('doesnt emit for undefined values', () => {
      const spy = jest.spyOn(syntax, 'emit');

      syntax.convertRuleset(
        {
          // @ts-ignore Allow undefined
          undef: undefined,
        },
        ruleset,
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits for falsy values', () => {
      const spy = jest.spyOn(syntax, 'emit');

      syntax.convertRuleset(
        {
          padding: 0,
          margin: 0.0,
          display: '',
        },
        ruleset,
      );

      expect(spy).toHaveBeenCalledTimes(6);
    });

    it('calls `convertSelector` for pseudos and attributes', () => {
      const spy = jest.spyOn(syntax, 'convertSelector');

      syntax.convertRuleset(
        {
          ':hover': {},
          '::after': {},
          '[disabled]': {},
        },
        ruleset,
      );

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('calls at-rules after properties', () => {
      function handleProperty(parent: Ruleset<Properties>, name: keyof Properties, value: any) {
        parent.addProperty(name, value);
      }

      function handleMedia(parent: Ruleset<Properties>, query: string, value: Ruleset<Properties>) {
        // @ts-ignore
        parent.properties.padding *= 3;
        parent.addNested(`@media ${query}`, value);
      }

      syntax.on('media', handleMedia);
      syntax.on('property', handleProperty);
      syntax.convertRuleset(
        {
          '@media': {
            '(max-width: 100px)': {
              padding: 10,
            },
          },
          padding: 5,
        },
        ruleset,
      );

      expect(ruleset.toObject()).toEqual({
        padding: 15,
        '@media (max-width: 100px)': {
          padding: 10,
        },
      });
    });

    describe('property', () => {
      it('emits event for each property', () => {
        const spy = jest.fn();

        syntax.on('property', spy);
        syntax.convertRuleset(
          {
            display: 'block',
            color: 'red',
            padding: 0,
          },
          ruleset,
        );

        expect(spy).toHaveBeenCalledWith(ruleset, 'display', 'block');
        expect(spy).toHaveBeenCalledWith(ruleset, 'color', 'red');
        expect(spy).toHaveBeenCalledWith(ruleset, 'padding', 0);
      });

      it('emits event for each individual property', () => {
        const spy = jest.fn();

        // @ts-ignore
        syntax.on('property:display', spy);
        syntax.convertRuleset(
          {
            display: 'block',
            color: 'red',
            padding: 0,
          },
          ruleset,
        );

        expect(spy).toHaveBeenCalledWith(ruleset, 'block');
        expect(spy).toHaveBeenCalledTimes(1);
      });

      describe('animationName', () => {
        it('converts single keyframe', () => {
          const spy = jest.fn();

          syntax.on('keyframe', spy);
          syntax.convertRuleset(SYNTAX_KEYFRAMES_INLINE.single, ruleset);

          expect(spy).toHaveBeenCalledTimes(1);
        });

        it('converts multiple keyframes', () => {
          const spy = jest.fn();

          syntax.on('keyframe', spy);
          syntax.convertRuleset(SYNTAX_KEYFRAMES_INLINE.multiple, ruleset);

          expect(spy).toHaveBeenCalledTimes(2);
        });
      });

      describe('fontFamily', () => {
        it('converts single font face', () => {
          const spy = jest.fn();

          syntax.on('font-face', spy);
          syntax.convertRuleset(SYNTAX_FONT_FACES_INLINE.single, ruleset);

          expect(spy).toHaveBeenCalledTimes(1);
        });

        it('converts multiple font face', () => {
          const spy = jest.fn();

          syntax.on('font-face', spy);
          syntax.convertRuleset(SYNTAX_FONT_FACES_INLINE.multiple, ruleset);

          expect(spy).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe('@fallbacks', () => {
      it('emits event for each fallback', () => {
        const spy = jest.fn();

        syntax.on('fallback', spy);
        syntax.convertRuleset(SYNTAX_FALLBACKS.fallback, ruleset);

        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy).toHaveBeenCalledWith(ruleset, 'background', ['red']);
        expect(spy).toHaveBeenCalledWith(ruleset, 'display', ['block', 'inline-block']);
        expect(spy).toHaveBeenCalledWith(ruleset, 'color', ['blue']);
      });

      it('errors if not an object', () => {
        expect(() => {
          syntax.convertRuleset(
            {
              // @ts-ignore Allow invalid type
              '@fallbacks': 123,
            },
            ruleset,
          );
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('@media', () => {
      it('emits event for each query', () => {
        const spy = jest.fn();

        syntax.on('media', spy);
        syntax.convertRuleset(SYNTAX_MEDIA_QUERY.media, ruleset);

        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(
          ruleset,
          '(min-width: 300px)',
          ruleset.createRuleset('@media (min-width: 300px)'),
        );
        expect(spy).toHaveBeenCalledWith(
          ruleset,
          '(max-width: 1000px)',
          ruleset.createRuleset('@media (max-width: 1000px)'),
        );
      });

      it('errors if not an object', () => {
        expect(() => {
          syntax.convertRuleset(
            {
              // @ts-ignore Allow invalid type
              '@media': 123,
            },
            ruleset,
          );
        }).toThrowErrorMatchingSnapshot();
      });

      it('errors if query not an object', () => {
        expect(() => {
          syntax.convertRuleset(
            {
              // @ts-ignore Allow invalid type
              '@media': {
                '(max-width: 100px)': 123,
              },
            },
            ruleset,
          );
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('@supports', () => {
      it('emits event for each query', () => {
        const spy = jest.fn();

        syntax.on('support', spy);
        syntax.convertRuleset(SYNTAX_SUPPORTS.sup, ruleset);

        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(
          ruleset,
          '(display: flex)',
          ruleset.createRuleset('@supports (display: flex)'),
        );
        expect(spy).toHaveBeenCalledWith(
          ruleset,
          'not (display: flex)',
          ruleset.createRuleset('@supports not (display: flex)'),
        );
      });

      it('errors if not an object', () => {
        expect(() => {
          syntax.convertRuleset(
            {
              // @ts-ignore Allow invalid type
              '@supports': 123,
            },
            ruleset,
          );
        }).toThrowErrorMatchingSnapshot();
      });

      it('errors if query not an object', () => {
        expect(() => {
          syntax.convertRuleset(
            {
              // @ts-ignore Allow invalid type
              '@supports': {
                '(display: flex)': 123,
              },
            },
            ruleset,
          );
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('@selectors', () => {
      it('emits event for a multi selector', () => {
        const spy = jest.fn();

        syntax.on('attribute', spy);
        syntax.on('pseudo', spy);
        syntax.on('selector', spy);
        syntax.convertRuleset(SYNTAX_MULTI_SELECTOR.multi, ruleset);

        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy).toHaveBeenCalledWith(ruleset, ':disabled', ruleset.createRuleset(':disabled'));
        expect(spy).toHaveBeenCalledWith(
          ruleset,
          '[disabled]',
          ruleset.createRuleset('[disabled]'),
        );
        expect(spy).toHaveBeenCalledWith(ruleset, '> span', ruleset.createRuleset('> span'));
      });

      it('emits event for descendent selectors', () => {
        const spy = jest.fn();

        syntax.on('selector', spy);
        syntax.convertRuleset(
          {
            '@selectors': {
              '> div': { display: 'block' },
            },
          },
          ruleset,
        );

        expect(spy).toHaveBeenCalledWith(ruleset, '> div', ruleset.createRuleset('> div'));
      });

      it('emits event for attribute selectors', () => {
        const spy = jest.fn();

        syntax.on('attribute', spy);
        syntax.convertRuleset(
          {
            '@selectors': {
              '[name="*foo"]': { display: 'block' },
            },
          },
          ruleset,
        );

        expect(spy).toHaveBeenCalledWith(
          ruleset,
          '[name="*foo"]',
          ruleset.createRuleset('[name="*foo"]'),
        );
      });

      it('emits event for pseudo selectors', () => {
        const spy = jest.fn();

        syntax.on('pseudo', spy);
        syntax.convertRuleset(
          {
            '@selectors': {
              ':not(:nth-child(2))': { display: 'block' },
            },
          },
          ruleset,
        );

        expect(spy).toHaveBeenCalledWith(
          ruleset,
          ':not(:nth-child(2))',
          ruleset.createRuleset(':not(:nth-child(2))'),
        );
      });

      it('errors if not an object', () => {
        expect(() => {
          syntax.convertRuleset(
            {
              // @ts-ignore Allow invalid type
              '@selectors': 123,
            },
            ruleset,
          );
        }).toThrowErrorMatchingSnapshot();
      });

      it('calls `convertSelector` with each rulset', () => {
        const spy = jest.spyOn(syntax, 'convertSelector');

        syntax.convertRuleset(
          {
            '@selectors': {
              '> li': {},
              '[attr]': {},
            },
          },
          ruleset,
        );

        expect(spy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('convertSelector()', () => {
    it('errors for a non-object', () => {
      expect(() => {
        // @ts-ignore Allow invalid type
        syntax.convertSelector(':hover', 123, ruleset);
      }).toThrowErrorMatchingSnapshot();
    });

    it('emits for a comma separate list', () => {
      const spy = jest.spyOn(syntax, 'emit');

      syntax.convertSelector(':disabled, [disabled], > span', {}, ruleset);

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith('attribute', [
        ruleset,
        '[disabled]',
        ruleset.createRuleset('[disabled]'),
      ]);
      expect(spy).toHaveBeenCalledWith('pseudo', [
        ruleset,
        ':disabled',
        ruleset.createRuleset(':disabled'),
      ]);
      expect(spy).toHaveBeenCalledWith('selector', [
        ruleset,
        '> span',
        ruleset.createRuleset('> span'),
      ]);
    });
  });

  describe('handleAnimationName', () => {
    it('returns undefined if falsy', () => {
      expect(syntax.handleAnimationName(ruleset, '')).toBeUndefined();
    });

    it('returns string as is', () => {
      expect(syntax.handleAnimationName(ruleset, 'foo, bar')).toBe('foo, bar');
    });

    it('converts single keyframe', () => {
      const spy = jest.fn();

      syntax.on('keyframe', spy);

      const name = syntax.handleAnimationName(
        ruleset,
        SYNTAX_KEYFRAMES_INLINE.single.animationName,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(name).toBe('slide');
    });

    it('converts multiple keyframes', () => {
      const spy = jest.fn();

      syntax.on('keyframe', spy);

      const name = syntax.handleAnimationName(
        ruleset,
        SYNTAX_KEYFRAMES_INLINE.multiple.animationName,
      );

      expect(spy).toHaveBeenCalledTimes(2);
      expect(name).toBe('slide, unknown, keyframe-1');
    });
  });

  describe('handleFontFamily', () => {
    it('returns undefined if falsy', () => {
      expect(syntax.handleFontFamily(ruleset, '')).toBeUndefined();
    });

    it('returns string as is', () => {
      expect(syntax.handleFontFamily(ruleset, 'foo, bar')).toBe('foo, bar');
    });

    it('converts single font face', () => {
      const spy = jest.fn();

      syntax.on('font-face', spy);

      const name = syntax.handleFontFamily(ruleset, SYNTAX_FONT_FACES_INLINE.single.fontFamily);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(name).toBe('Roboto');
    });

    it('converts multiple font face', () => {
      const spy = jest.fn();

      syntax.on('font-face', spy);

      const name = syntax.handleFontFamily(ruleset, SYNTAX_FONT_FACES_INLINE.multiple.fontFamily);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(name).toBe('Circular, OtherFont, Roboto');
    });

    it('calls `convertFontFaces` with correct values', () => {
      const spy = jest.spyOn(syntax, 'convertFontFaces');

      syntax.handleFontFamily(ruleset, SYNTAX_FONT_FACES_INLINE.multiple.fontFamily);

      expect(spy).toHaveBeenCalledWith('Circular', FONT_CIRCULAR_MULTIPLE, expect.anything());
      expect(spy).toHaveBeenCalledWith('Roboto', [FONT_ROBOTO], expect.anything());
    });
  });

  describe('injectFontFaces()', () => {
    it('converts to an array', () => {
      expect(syntax.injectFontFaces('Roboto, Verdana, sans-serif', {})).toEqual([
        'Roboto',
        'Verdana',
        'sans-serif',
      ]);
    });

    it('replaces font family with font face object', () => {
      expect(
        syntax.injectFontFaces('Roboto, Verdana, sans-serif', {
          Roboto: [FONT_ROBOTO],
        }),
      ).toEqual([FONT_ROBOTO, 'Verdana', 'sans-serif']);
    });
  });

  describe('injectKeyframes()', () => {
    it('converts to an array', () => {
      expect(syntax.injectKeyframes('fade, twist', {})).toEqual(['fade', 'twist']);
    });

    it('replaces animation name with keyframes object', () => {
      expect(
        syntax.injectKeyframes('fade, twist', {
          fade: KEYFRAME_FADE,
        }),
      ).toEqual([KEYFRAME_FADE, 'twist']);
    });
  });
});