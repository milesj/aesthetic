import directionConverter from '@aesthetic/addon-direction';
import { createTestStyleEngine, getRenderedStyles, purgeStyles } from '@aesthetic/style/test';
import { ClassName, Engine } from '@aesthetic/types';
import { Aesthetic, LocalSheet, StyleSheet } from '../src';
import { lightTheme, setupAesthetic, teardownAesthetic } from '../src/test';

describe('LocalSheet', () => {
  let aesthetic: Aesthetic;
  let engine: Engine<string>;
  let sheet: LocalSheet<unknown, object, ClassName>;

  beforeEach(() => {
    aesthetic = new Aesthetic();

    setupAesthetic(aesthetic);

    engine = createTestStyleEngine({ directionConverter });

    // Dont use `createComponentStyles` since we need to pass a custom engine
    sheet = new StyleSheet('local', () => ({
      foo: {
        display: 'block',
        background: 'white',
        color: 'black',
        textAlign: 'left',
        fontSize: 12,
        fontFamily: '"Open Sans", Roboto',
        ':hover': {
          color: 'red',
        },
        '@selectors': {
          ':focus': {
            outline: 'red',
          },
        },
        '@media': {
          '(max-width: 1000px)': {
            display: 'none',
            borderWidth: 1,
          },
        },
      },
      bar: {
        transition: '200ms all',
        animationName: 'fade',
        '@variables': {
          primaryColor: 'red',
        },
      },
      baz: 'class-baz',
      qux: {
        '@variants': {
          'size:sm': { fontSize: 14 },
          'size:md': { fontSize: 16 },
          'size:lg': { fontSize: 18 },
        },
      },
      quxCompound: {
        '@variants': {
          'size:sm': { fontSize: 14 },
          'size:md': { fontSize: 16 },
          'size:lg': { fontSize: 18 },

          'color:red': { color: 'red' },
          'color:green': { color: 'green' },
          'color:blue': { color: 'blue' },

          'size:sm + color:green': { color: 'forestgreen' },
        },
      },
    }));
  });

  afterEach(() => {
    purgeStyles();
    teardownAesthetic(aesthetic);
  });

  it('errors if a non-function factory is passed', () => {
    expect(
      () =>
        new StyleSheet(
          'local',
          // @ts-expect-error
          123,
        ),
    ).toThrow('A style sheet factory function is required, found "number".');
  });

  it('only renders once when cached', () => {
    const spy = jest.spyOn(sheet, 'compose');

    sheet.render(engine, lightTheme, {});
    sheet.render(engine, lightTheme, {});
    sheet.render(engine, lightTheme, {});

    expect(spy).toHaveBeenCalledTimes(1);
    expect(getRenderedStyles('standard')).toMatchSnapshot();
  });

  it('re-renders when params change', () => {
    const spy = jest.spyOn(sheet, 'compose');

    sheet.render(engine, lightTheme, {});
    sheet.render(engine, lightTheme, { direction: 'rtl' });
    sheet.render(engine, lightTheme, {});
    sheet.render(engine, lightTheme, { direction: 'rtl' });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(getRenderedStyles('standard')).toMatchSnapshot();
  });

  it('renders and returns an object of class names and variants', () => {
    const classes = sheet.render(engine, lightTheme, {});

    expect(classes).toEqual({
      foo: { result: 'a b c d e f g h i j' },
      bar: { result: 'k l m' },
      baz: { result: 'class-baz' },
      qux: {
        result: '',
        variants: [
          { types: ['size:sm'], result: 'n' },
          { types: ['size:md'], result: 'o' },
          { types: ['size:lg'], result: 'p' },
        ],
        variantTypes: new Set(['size']),
      },
      quxCompound: {
        result: '',
        variants: [
          { types: ['size:sm'], result: 'q' },
          { types: ['size:md'], result: 'r' },
          { types: ['size:lg'], result: 's' },
          { types: ['color:red'], result: 't' },
          { types: ['color:green'], result: 'u' },
          { types: ['color:blue'], result: 'v' },
          { types: ['size:sm', 'color:green'], result: 'w' },
        ],
        variantTypes: new Set(['size', 'color']),
      },
    });
    expect(getRenderedStyles('standard')).toMatchSnapshot();
  });

  it.only('renders a declaration for each rule property', () => {
    const spy = jest.spyOn(engine, 'renderDeclaration');

    sheet.render(engine, lightTheme, {});

    console.log(engine);

    expect(spy).toHaveBeenCalledWith('display', 'block', expect.any(Object));
    expect(spy).toHaveBeenCalledWith('background', 'white', expect.any(Object));
    expect(spy).toHaveBeenCalledWith('color', 'black', expect.any(Object));
    expect(spy).toHaveBeenCalledWith('fontSize', 12, expect.any(Object));
    expect(spy).toHaveBeenCalledWith('fontFamily', '"Open Sans", Roboto', expect.any(Object));
  });

  it('renders @font-face', () => {
    const spy = jest.spyOn(engine, 'renderFontFace');

    sheet.render(engine, lightTheme, {});

    expect(spy).toHaveBeenCalledWith(
      {
        fontFamily: 'Roboto',
        fontStyle: 'normal',
        fontWeight: 'normal',
        src:
          "url('fonts/Roboto.woff2') format('woff2'), url('fonts/Roboto.ttf') format('truetype')",
      },
      {
        direction: 'ltr',
        unit: 'px',
        vendor: false,
      },
    );
    expect(getRenderedStyles('global')).toMatchSnapshot();
  });

  it('renders @keyframes', () => {
    const spy = jest.spyOn(engine, 'renderKeyframes');

    sheet.render(engine, lightTheme, {});

    expect(spy).toHaveBeenCalledWith(
      {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      '',
      {
        direction: 'ltr',
        unit: 'px',
        vendor: false,
      },
    );
    expect(getRenderedStyles('global')).toMatchSnapshot();
  });

  describe('overrides', () => {
    beforeEach(() => {
      sheet.addColorSchemeOverride('dark', () => ({
        foo: {
          background: 'black',
          color: 'white',
        },
      }));

      sheet.addContrastOverride('high', () => ({
        foo: {
          background: 'pink',
        },
      }));

      sheet.addContrastOverride('low', () => ({
        foo: {
          background: 'yellow',
        },
      }));

      sheet.addThemeOverride('danger', () => ({
        foo: {
          background: 'red',
          color: 'yellow',
        },
      }));
    });

    it('errors for invalid color scheme name', () => {
      expect(() => {
        sheet.addColorSchemeOverride(
          // @ts-expect-error
          'unknown',
          () => ({}),
        );
      }).toThrow('Color scheme override must be one of "light" or "dark".');
    });

    it('errors for invalid contrast name', () => {
      expect(() => {
        sheet.addContrastOverride(
          // @ts-expect-error
          'unknown',
          () => ({}),
        );
      }).toThrow('Contrast level override must be one of "high", "low", or "normal".');
    });

    it('inherits color scheme', () => {
      const spy = jest.spyOn(engine, 'renderDeclaration');

      sheet.render(engine, lightTheme, {
        scheme: 'dark',
      });

      expect(spy).toHaveBeenCalledWith('background', 'black', expect.any(Object));
      expect(spy).toHaveBeenCalledWith('color', 'white', expect.any(Object));
    });

    it('inherits high contrast', () => {
      const spy = jest.spyOn(engine, 'renderDeclaration');

      sheet.render(engine, lightTheme, {
        contrast: 'high',
      });

      expect(spy).toHaveBeenCalledWith('background', 'pink', expect.any(Object));
      expect(spy).toHaveBeenCalledWith('color', 'black', expect.any(Object));
    });

    it('inherits low contrast', () => {
      const spy = jest.spyOn(engine, 'renderDeclaration');

      sheet.render(engine, lightTheme, {
        contrast: 'low',
      });

      expect(spy).toHaveBeenCalledWith('background', 'yellow', expect.any(Object));
      expect(spy).toHaveBeenCalledWith('color', 'black', expect.any(Object));
    });

    it('inherits theme by name', () => {
      const spy = jest.spyOn(engine, 'renderDeclaration');

      sheet.render(engine, lightTheme, {
        theme: 'danger',
      });

      expect(spy).toHaveBeenCalledWith('background', 'red', expect.any(Object));
      expect(spy).toHaveBeenCalledWith('color', 'yellow', expect.any(Object));
    });

    it('contrast overrides scheme', () => {
      const spy = jest.spyOn(engine, 'renderDeclaration');

      sheet.render(engine, lightTheme, {
        scheme: 'dark',
        contrast: 'low',
      });

      expect(spy).toHaveBeenCalledWith('background', 'yellow', expect.any(Object));
      expect(spy).toHaveBeenCalledWith('color', 'white', expect.any(Object));
    });

    it('theme overrides contrast and scheme', () => {
      const spy = jest.spyOn(engine, 'renderDeclaration');

      sheet.render(engine, lightTheme, {
        scheme: 'dark',
        contrast: 'high',
        theme: 'danger',
      });

      expect(spy).toHaveBeenCalledWith('background', 'red', expect.any(Object));
      expect(spy).toHaveBeenCalledWith('color', 'yellow', expect.any(Object));
    });
  });
});
