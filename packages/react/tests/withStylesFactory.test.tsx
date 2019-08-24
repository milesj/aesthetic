import React from 'react';
import { render } from 'rut';
import {
  TestAesthetic,
  registerTestTheme,
  TEST_STATEMENT,
  TestTheme,
} from 'aesthetic/lib/testUtils';
import DirectionProvider from '../src/DirectionProvider';
import ThemeProvider from '../src/ThemeProvider';
import withStylesFactory from '../src/withStylesFactory';
import { ThemeProviderProps, DirectionProviderProps } from '../lib/types';

describe('withStylesFactory()', () => {
  let aesthetic: TestAesthetic<TestTheme>;
  let withStyles: ReturnType<typeof withStylesFactory>;

  beforeEach(() => {
    aesthetic = new TestAesthetic();
    registerTestTheme(aesthetic);

    withStyles = withStylesFactory(aesthetic);
  });

  function BaseComponent(props: any) {
    return null;
  }

  function StyledComponent({ styles, cx }: any) {
    return <div className={cx(styles.header, styles.footer)} />;
  }

  function WrappingComponent({ children }: { children?: React.ReactNode }) {
    return (
      <DirectionProvider aesthetic={aesthetic} dir="ltr">
        <ThemeProvider aesthetic={aesthetic} name="light">
          {children || <div />}
        </ThemeProvider>
      </DirectionProvider>
    );
  }

  function renderWithWrapper(element: React.ReactElement) {
    return render(element, { wrapper: <WrappingComponent /> });
  }

  it('returns an HOC component', () => {
    const hoc = withStyles(() => ({}));

    expect(hoc).toBeInstanceOf(Function);
  });

  it('inherits name from component `constructor.name`', () => {
    const Wrapped = withStyles(() => ({}))(BaseComponent);

    expect(Wrapped.displayName).toBe('withStyles(BaseComponent)');
    expect(Wrapped.styleName).toEqual(expect.stringMatching(/^BaseComponent/u));
  });

  it('inherits name from component `displayName`', () => {
    class DisplayComponent extends React.Component<any> {
      static displayName = 'CustomDisplayName';

      render() {
        return null;
      }
    }

    const Wrapped = withStyles(() => ({}))(DisplayComponent);

    expect(Wrapped.displayName).toBe('withStyles(CustomDisplayName)');
    expect(Wrapped.styleName).toEqual(expect.stringMatching(/^CustomDisplayName/u));
  });

  it('stores the original component as a static property', () => {
    const Wrapped = withStyles(() => ({}))(BaseComponent);

    expect(Wrapped.WrappedComponent).toBe(BaseComponent);
  });

  it('defines static method for extending styles', () => {
    const Wrapped = withStyles(() => ({}))(BaseComponent);

    expect(Wrapped.extendStyles).toBeInstanceOf(Function);
  });

  it('sets styles on the `Aesthetic` instance', () => {
    const styles = () => ({
      button: {
        display: 'inline-block',
        padding: 5,
      },
    });
    const Wrapped = withStyles(styles)(BaseComponent);

    renderWithWrapper(<Wrapped />);

    expect(aesthetic.styles[Wrapped.styleName]).toBe(styles);
  });

  it('can set styles using `extendStyles`', () => {
    const Wrapped = withStyles(
      () => ({
        button: {
          display: 'inline-block',
          padding: 5,
        },
      }),
      {
        extendable: true,
      },
    )(BaseComponent);

    expect(aesthetic.getStyleSheet(Wrapped.styleName, 'default')).toEqual({
      button: {
        display: 'inline-block',
        padding: 5,
      },
    });

    const Extended = Wrapped.extendStyles(() => ({
      notButton: {
        color: 'red',
      },
    }));

    expect(aesthetic.getStyleSheet(Extended.styleName, 'default')).toEqual({
      button: {
        display: 'inline-block',
        padding: 5,
      },
      notButton: {
        color: 'red',
      },
    });
  });

  it('can set extended components as non-extendable', () => {
    const Wrapped = withStyles(() => ({}), {
      extendable: true,
    })(BaseComponent);

    const Extended = Wrapped.extendStyles(() => ({}), {
      extendable: false,
    });

    expect(() => {
      Extended.extendStyles(() => ({}));
    }).toThrowErrorMatchingSnapshot();
  });

  it('inherits a function to generate CSS class names', () => {
    const Wrapped = withStyles(() => ({}))(BaseComponent);
    const { root } = renderWithWrapper(<Wrapped />);

    expect(typeof root.findOne(BaseComponent).prop('cx')).toBe('function');
  });

  it('inherits theme from Aesthetic options', () => {
    function ThemeComponent(props: { theme?: {} }) {
      return <div />;
    }

    const Wrapped = withStyles(() => ({}), { passThemeProp: true })(ThemeComponent);
    const { root } = renderWithWrapper(<Wrapped />);

    expect(root.findOne(ThemeComponent).prop('theme')).toEqual({ color: 'black', unit: 8 });
  });

  it('creates a style sheet', () => {
    const spy = jest.spyOn(aesthetic, 'createStyleSheet');
    const Wrapped = withStyles(() => TEST_STATEMENT)(StyledComponent);

    renderWithWrapper(<Wrapped foo="abc" />);

    expect(spy).toHaveBeenCalledWith(Wrapped.styleName, {
      dir: 'ltr',
      name: Wrapped.styleName,
      theme: 'light',
    });
  });

  it.skip('can customize props with options', () => {
    aesthetic.options.passThemeProp = true;

    function CustomStyledComponent({ styleSheet, css }: any) {
      return <div className={css(styleSheet.header, styleSheet.footer)} />;
    }

    const Wrapped = withStyles(() => TEST_STATEMENT, {
      cxPropName: 'css',
      stylesPropName: 'styleSheet',
      themePropName: 'someThemeNameHere',
    })(CustomStyledComponent);
    const { root } = renderWithWrapper(<Wrapped />);
    const found = root.findOne(CustomStyledComponent);

    expect(found.prop('css')).toBeDefined();
    expect(found.prop('styleSheet')).toBeDefined();
    expect(found.prop('someThemeNameHere')).toBeDefined();
  });

  it('can customize props with the options through the `Aesthetic` instance', () => {
    aesthetic.options.cxPropName = 'css';
    aesthetic.options.stylesPropName = 'styleSheet';
    aesthetic.options.themePropName = 'someThemeNameHere';
    aesthetic.options.passThemeProp = true;

    function CustomStyledComponent({ styleSheet, css }: any) {
      return <div className={css(styleSheet.header, styleSheet.footer)} />;
    }

    const Wrapped = withStyles(() => TEST_STATEMENT)(CustomStyledComponent);
    const { root } = renderWithWrapper(<Wrapped />);
    const found = root.findOne(CustomStyledComponent);

    expect(found.prop('css')).toBeDefined();
    expect(found.prop('styleSheet')).toBeDefined();
    expect(found.prop('someThemeNameHere')).toBeDefined();
  });

  it('doesnt pass theme prop if `options.passThemeProp` is false', () => {
    const Wrapped = withStyles(() => TEST_STATEMENT, { passThemeProp: false })(StyledComponent);
    const { root } = renderWithWrapper(<Wrapped />);

    expect(root.findOne(StyledComponent).prop('theme')).toBeUndefined();
  });

  it('can bubble up the ref with `wrappedRef`', () => {
    class RefComponent extends React.Component<any> {
      render() {
        return <div />;
      }
    }

    let refInstance: any = null;
    const Wrapped = withStyles(() => ({}))(RefComponent);

    render(
      <Wrapped
        themeName="classic"
        wrappedRef={(ref: any) => {
          refInstance = ref;
        }}
      />,
    );

    expect(refInstance).not.toBeNull();
    expect(refInstance!.constructor.name).toBe('RefComponent');
  });

  it('can transform class names', () => {
    function Component({ cx, styles }: any) {
      return <section className={cx(styles.header, styles.footer)} />;
    }

    const Wrapped = withStyles(() => TEST_STATEMENT)(Component);
    const { root } = renderWithWrapper(<Wrapped />);

    expect(root.findOne('section').prop('className')).toBe('header footer');
  });

  it('re-creates style sheet if theme context changes', () => {
    const createSpy = jest.spyOn(aesthetic, 'createStyleSheet');
    const Wrapped = withStyles(() => TEST_STATEMENT)(StyledComponent);
    const { update } = render<ThemeProviderProps>(
      <ThemeProvider aesthetic={aesthetic}>
        <Wrapped />
      </ThemeProvider>,
    );

    expect(createSpy).toHaveBeenCalledWith(Wrapped.styleName, {
      dir: 'ltr',
      name: Wrapped.styleName,
      theme: 'default',
    });

    update({ name: 'dark' });

    expect(createSpy).toHaveBeenCalledWith(Wrapped.styleName, {
      dir: 'ltr',
      name: Wrapped.styleName,
      theme: 'dark',
    });
  });

  it('re-creates style sheet if direction context changes', () => {
    const createSpy = jest.spyOn(aesthetic, 'createStyleSheet');
    const Wrapped = withStyles(() => TEST_STATEMENT)(StyledComponent);
    const { update } = render<DirectionProviderProps>(
      <DirectionProvider aesthetic={aesthetic} dir="rtl">
        <Wrapped />
      </DirectionProvider>,
    );

    expect(createSpy).toHaveBeenCalledWith(Wrapped.styleName, {
      dir: 'rtl',
      name: Wrapped.styleName,
      theme: '',
    });

    update({ dir: 'ltr' });

    expect(createSpy).toHaveBeenCalledWith(Wrapped.styleName, {
      dir: 'ltr',
      name: Wrapped.styleName,
      theme: '',
    });
  });

  it('re-creates style sheet when both contexts change', () => {
    const createSpy = jest.spyOn(aesthetic, 'createStyleSheet');
    const Wrapped = withStyles(() => TEST_STATEMENT)(StyledComponent);
    const { update } = render<DirectionProviderProps>(
      <DirectionProvider aesthetic={aesthetic} dir="ltr">
        <ThemeProvider aesthetic={aesthetic}>
          <Wrapped />
        </ThemeProvider>
      </DirectionProvider>,
    );

    expect(createSpy).toHaveBeenCalledWith(Wrapped.styleName, {
      dir: 'ltr',
      name: Wrapped.styleName,
      theme: 'default',
    });

    update(
      <DirectionProvider aesthetic={aesthetic} dir="rtl">
        <ThemeProvider aesthetic={aesthetic} name="light">
          <Wrapped />
        </ThemeProvider>
      </DirectionProvider>,
    );

    expect(createSpy).toHaveBeenCalledWith(Wrapped.styleName, {
      dir: 'rtl',
      name: Wrapped.styleName,
      theme: 'light',
    });
  });

  describe('RTL', () => {
    it('inherits `rtl` from explicit `DirectionProvider`', () => {
      const createSpy = jest.spyOn(aesthetic, 'createStyleSheet');
      const transformSpy = jest.spyOn(aesthetic, 'transformStyles');
      const Wrapped = withStyles(() => TEST_STATEMENT)(StyledComponent);

      render(
        <DirectionProvider aesthetic={aesthetic} dir="rtl">
          <Wrapped />
        </DirectionProvider>,
      );

      expect(createSpy).toHaveBeenCalledWith(Wrapped.styleName, {
        dir: 'rtl',
        name: Wrapped.styleName,
        theme: '',
      });
      expect(transformSpy).toHaveBeenCalledWith(['header', 'footer'], {
        dir: 'rtl',
        name: Wrapped.styleName,
        theme: '',
      });
    });

    it('inherits `rtl` from inferred `DirectionProvider` value', () => {
      const createSpy = jest.spyOn(aesthetic, 'createStyleSheet');
      const transformSpy = jest.spyOn(aesthetic, 'transformStyles');
      const Wrapped = withStyles(() => TEST_STATEMENT)(StyledComponent);

      render(
        <DirectionProvider aesthetic={aesthetic} value="بسيطة">
          <Wrapped />
        </DirectionProvider>,
      );

      expect(createSpy).toHaveBeenCalledWith(Wrapped.styleName, {
        dir: 'rtl',
        name: Wrapped.styleName,
        theme: '',
      });
      expect(transformSpy).toHaveBeenCalledWith(['header', 'footer'], {
        dir: 'rtl',
        name: Wrapped.styleName,
        theme: '',
      });
    });
  });
});
