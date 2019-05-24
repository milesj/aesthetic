import React from 'react';
import { shallow, mount } from 'enzyme';
import { TestAesthetic, registerTestTheme, TEST_STATEMENT } from 'aesthetic/lib/testUtils';
import withStylesFactory from '../src/withStylesFactory';

describe('withStylesFactory()', () => {
  let aesthetic: TestAesthetic;
  let withStyles: ReturnType<typeof withStylesFactory>;

  beforeEach(() => {
    aesthetic = new TestAesthetic();
    withStyles = withStylesFactory(aesthetic);

    registerTestTheme(aesthetic);
  });

  function BaseComponent() {
    return null;
  }

  function StylesComponent(props: { [key: string]: any }) {
    return <div />;
  }

  it('returns an HOC component', () => {
    const hoc = withStyles(() => ({}));

    expect(hoc).toBeInstanceOf(Function);
  });

  it('extends `React.PureComponent` by default', () => {
    const Wrapped = withStyles(() => ({}))(BaseComponent);

    expect(Object.getPrototypeOf(Wrapped)).toBe(React.PureComponent);
  });

  it('extends `React.Component` when `pure` is false', () => {
    const Wrapped = withStyles(() => ({}), { pure: false })(BaseComponent);

    expect(Object.getPrototypeOf(Wrapped)).toBe(React.Component);
  });

  it('extends `React.PureComponent` when Aesthetic option `pure` is true', () => {
    aesthetic.options.pure = true;

    const Wrapped = withStyles(() => ({}))(BaseComponent);

    expect(Object.getPrototypeOf(Wrapped)).toBe(React.PureComponent);
  });

  it('doesnt extend `React.PureComponent` when Aesthetic option `pure` is true but local is false', () => {
    aesthetic.options.pure = true;

    const Wrapped = withStyles(() => ({}), { pure: false })(BaseComponent);

    expect(Object.getPrototypeOf(Wrapped)).not.toBe(React.PureComponent);
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

    expect(aesthetic.getStyleSheet(Wrapped.styleName)).toEqual({
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

    expect(aesthetic.getStyleSheet(Extended.styleName)).toEqual({
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

  it('inherits theme from Aesthetic options', () => {
    function ThemeComponent() {
      return <div />;
    }

    const Wrapped = withStyles(() => ({}), { passThemeProp: true })(ThemeComponent);
    const wrapper = shallow(<Wrapped />);

    expect(wrapper.prop('theme')).toEqual({ unit: 8 });
  });

  it('creates a style sheet', () => {
    const spy = jest.spyOn(aesthetic, 'createStyleSheet');
    const Wrapped = withStyles(() => TEST_STATEMENT)(StylesComponent);
    const wrapper = shallow(<Wrapped foo="abc" />);

    expect(spy).toHaveBeenCalledWith(Wrapped.styleName);
    expect(wrapper.state('styles')).toEqual({
      header: {},
      footer: {},
    });
  });

  it('can customize props with the withStyles options', () => {
    aesthetic.options.passThemeProp = true;

    const Wrapped = withStyles(() => TEST_STATEMENT, {
      stylesPropName: 'styleSheet',
      themePropName: 'someThemeNameHere',
    })(StylesComponent);
    const wrapper = shallow(<Wrapped />);

    expect(wrapper.prop('styleSheet')).toBeDefined();
    expect(wrapper.prop('someThemeNameHere')).toBeDefined();
  });

  it('can customize props with the options through the `Aesthetic` instance', () => {
    aesthetic.options.stylesPropName = 'styleSheet';
    aesthetic.options.themePropName = 'someThemeNameHere';
    aesthetic.options.passThemeProp = true;

    const Wrapped = withStyles(() => TEST_STATEMENT)(StylesComponent);
    const wrapper = shallow(<Wrapped />);

    expect(wrapper.prop('styleSheet')).toBeDefined();
    expect(wrapper.prop('someThemeNameHere')).toBeDefined();
  });

  it('doesnt pass theme prop if `options.passThemeProp` is false', () => {
    const Wrapped = withStyles(() => TEST_STATEMENT, { passThemeProp: false })(StylesComponent);
    const wrapper = shallow(<Wrapped />);

    expect(wrapper.prop('theme')).toBeUndefined();
  });

  it('can bubble up the ref with `wrappedRef`', () => {
    class RefComponent extends React.Component<any> {
      render() {
        return <div />;
      }
    }

    let refInstance: any = null;
    const Wrapped = withStyles(() => ({}))(RefComponent);

    mount(
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
});
