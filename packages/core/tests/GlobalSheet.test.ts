import { createTestStyleEngine } from '@aesthetic/style/test';
import { ClassName, Engine } from '@aesthetic/types';
import { GlobalSheet, StyleSheet } from '../src';
import { lightTheme } from '../src/test';

describe('GlobalSheet', () => {
  let engine: Engine<string>;
  let sheet: GlobalSheet<unknown, object, ClassName>;

  beforeEach(() => {
    engine = createTestStyleEngine({});

    // Dont use `createThemeStyles` since we need to pass a custom renderer
    sheet = new StyleSheet('global', () => ({
      '@font-face': {
        Roboto: {
          fontStyle: 'normal',
          fontWeight: 'normal',
          local: ['Robo'],
          srcPaths: ['fonts/Roboto.woff2', 'fonts/Roboto.ttf'],
        },
      },
      '@root': {
        height: '100%',
        margin: 0,
        fontSize: 16,
        lineHeight: 1.5,
        backgroundColor: 'white',
      },
      '@import': ['url("reset.css")', { path: 'normalize.css', url: true }],
      '@keyframes': {
        fade: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
      '@variables': {
        '--standard-syntax': 'true',
        customSyntax: 123,
      },
    }));
  });

  it('errors if a non-function factory is passed', () => {
    expect(
      () =>
        new StyleSheet(
          'global',
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
  });

  it('re-renders when params change', () => {
    const spy = jest.spyOn(sheet, 'compose');

    sheet.render(engine, lightTheme, {});
    sheet.render(engine, lightTheme, { direction: 'rtl' });
    sheet.render(engine, lightTheme, {});
    sheet.render(engine, lightTheme, { direction: 'rtl' });

    expect(spy).toHaveBeenCalledTimes(2);
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
          "local('Robo'), url('fonts/Roboto.woff2') format('woff2'), url('fonts/Roboto.ttf') format('truetype')",
      },
      {
        contrast: 'normal',
        deterministic: false,
        direction: 'ltr',
        scheme: 'light',
        theme: '',
        unit: 'px',
        vendor: false,
      },
    );
  });

  it('renders @root', () => {
    const spy = jest.spyOn(engine, 'renderRuleGrouped');
    const result = sheet.render(engine, lightTheme, {});

    expect(result).toEqual({ '@root': { result: 'c1fv9z16' } });
    expect(spy).toHaveBeenCalledWith(
      {
        height: '100%',
        margin: 0,
        fontSize: 16,
        lineHeight: 1.5,
        backgroundColor: 'white',
      },
      {
        className: 'c1fv9z16',
        contrast: 'normal',
        deterministic: true,
        direction: 'ltr',
        scheme: 'light',
        theme: '',
        type: 'global',
        unit: 'px',
        vendor: false,
      },
    );
  });

  it('renders @import', () => {
    const spy = jest.spyOn(engine, 'renderImport');

    sheet.render(engine, lightTheme, {});

    expect(spy).toHaveBeenCalledWith('url("reset.css")');
    expect(spy).toHaveBeenCalledWith('url("normalize.css")');
  });

  it('renders @keyframes', () => {
    const spy = jest.spyOn(engine, 'renderKeyframes');

    sheet.render(engine, lightTheme, {});

    expect(spy).toHaveBeenCalledWith(
      {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      'fade',
      {
        contrast: 'normal',
        deterministic: false,
        direction: 'ltr',
        scheme: 'light',
        theme: '',
        unit: 'px',
        vendor: false,
      },
    );
  });

  it('renders @variables', () => {
    const spy = jest.spyOn(engine, 'setRootVariables');

    sheet.render(engine, lightTheme, {});

    expect(spy).toHaveBeenCalledWith({ '--standard-syntax': 'true', '--custom-syntax': 123 });
  });

  describe('variants', () => {
    it('errors when adding color scheme variants', () => {
      expect(() => {
        // @ts-expect-error
        sheet.addColorSchemeVariant('unknown', () => ({}));
      }).toThrow('Color scheme variants are only supported by local style sheets.');
    });

    it('errors when adding contrast level variants', () => {
      expect(() => {
        // @ts-expect-error
        sheet.addContrastVariant('unknown', () => ({}));
      }).toThrow('Contrast level variants are only supported by local style sheets.');
    });

    it('errors when adding theme variants', () => {
      expect(() => {
        // @ts-expect-error
        sheet.addThemeVariant('unknown', () => ({}));
      }).toThrow('Theme variants are only supported by local style sheets.');
    });
  });
});
