import Renderer from '../src/client/ClientRenderer';
import getInsertedStyles from '../src/helpers/getInsertedStyles';
import purgeStyles from './purgeStyles';

describe('Styles', () => {
  let renderer: Renderer;
  let spy: jest.SpyInstance;

  beforeEach(() => {
    renderer = new Renderer();

    // Avoid warnings
    spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    spy.mockRestore();

    purgeStyles('global');
    purgeStyles('standard');
    purgeStyles('conditions');
  });

  it('generates a unique class name for a large number of properties', () => {
    for (let i = 0; i < 100; i += 1) {
      renderer.renderDeclaration('padding', i);
    }

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('generates a unique class name for each property', () => {
    const className = renderer.renderRule({
      margin: 0,
      padding: '6px 12px',
      border: '1px solid #2e6da4',
      borderRadius: 4,
      display: 'inline-block',
      cursor: 'pointer',
      fontFamily: 'Roboto',
      fontWeight: 'normal',
      lineHeight: 'normal',
      whiteSpace: 'nowrap',
      textDecoration: 'none',
      textAlign: 'left',
      backgroundColor: '#337ab7',
      verticalAlign: 'middle',
      color: 'rgba(0, 0, 0, 0)',
      animationName: 'fade',
      animationDuration: '.3s',
    });

    expect(className).toBe('a b c d e f g h i j k l m n o p q');
    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('generates a deterministic class name for each property', () => {
    renderer.options.deterministic = true;

    const className = renderer.renderRule({
      margin: 0,
      cursor: 'pointer',
    });
    const cursor = renderer.renderDeclaration('cursor', 'pointer');

    expect(className).toBe('1cpw2zw 1jzt5o3');
    expect(className).toContain(cursor);
    expect(cursor).toBe('1jzt5o3');
    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('generates a unique class name for each selector even if property value pair is the same', () => {
    const className = renderer.renderRule({
      background: '#000',
      ':hover': {
        background: '#000',
      },
      '[disabled]': {
        background: '#000',
      },
    });

    expect(className).toBe('a b c');
    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('uses the same class name for the same property value pair', () => {
    renderer.renderDeclaration('display', 'block');
    renderer.renderDeclaration('display', 'flex');
    renderer.renderDeclaration('display', 'block');
    renderer.renderDeclaration('display', 'flex');
    renderer.renderDeclaration('display', 'inline');
    renderer.renderDeclaration('display', 'block');

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('uses the same class name for dashed and camel cased properties', () => {
    renderer.renderDeclaration('textDecoration', 'none');
    renderer.renderDeclaration('text-decoration', 'none');

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('uses the same class name for numeric and string values', () => {
    renderer.renderDeclaration('width', 100);
    renderer.renderDeclaration('width', '100px');
    renderer.renderDeclaration('width', '100em');

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('applies a px unit to numeric properties that require it', () => {
    renderer.renderDeclaration('width', 300);
    renderer.renderDeclaration('marginTop', 10);

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('doesnt apply a px unit to numeric properties that dont require it', () => {
    renderer.renderDeclaration('lineHeight', 1.5);
    renderer.renderDeclaration('fontWeight', 600);

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('doesnt apply a px unit to properties that are already prefixed', () => {
    renderer.renderDeclaration('paddingLeft', '10px');
    renderer.renderDeclaration('height', '10vh');

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('supports CSS variables within values', () => {
    renderer.renderDeclaration('color', 'var(--primary-color)');
    renderer.renderDeclaration('border', '1px solid var(--border-color)');
    renderer.renderDeclaration('display', 'var(--display, var(--fallback), flex)');

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('can set CSS variables', () => {
    renderer.applyRootVariables({
      someVar: '10px',
      '--already-formatted-var': '10em',
      'missing-prefix': 10,
      mixOfBoth: 10,
    });

    const root = document.documentElement;

    expect(root.style.getPropertyValue('--some-var')).toBe('10px');
    expect(root.style.getPropertyValue('--already-formatted-var')).toBe('10em');
    expect(root.style.getPropertyValue('--missing-prefix')).toBe('10px');
    expect(root.style.getPropertyValue('--mix-of-both')).toBe('10px');
  });

  it('can nest conditionals infinitely', () => {
    renderer.renderRule({
      margin: 0,
      '@media (width: 500px)': {
        margin: 10,
        ':hover': {
          color: 'red',
        },
        '@media (width: 350px)': {
          '@supports (color: blue)': {
            color: 'blue',
          },
        },
      },
    });

    expect(getInsertedStyles('standard')).toMatchSnapshot();
    expect(getInsertedStyles('conditions')).toMatchSnapshot();
  });

  it('ignores invalid values', () => {
    const className = renderer.renderRule({
      // @ts-ignore
      margin: true,
      // @ts-ignore
      padding: null,
      // @ts-ignore
      color: undefined,
    });

    expect(className).toBe('');
    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('inserts into the appropriate style sheets', () => {
    renderer.renderRule({
      background: 'white',
      '@media (prefers-color-scheme: dark)': {
        background: 'black',
      },
    });

    renderer.renderImport('url(test.css)');

    expect(getInsertedStyles('global')).toMatchSnapshot();
    expect(getInsertedStyles('standard')).toMatchSnapshot();
    expect(getInsertedStyles('conditions')).toMatchSnapshot();
  });

  it('logs a warning for unknown property values', () => {
    renderer.renderRule({
      // @ts-ignore
      color: true,
    });

    expect(spy).toHaveBeenCalledWith('Invalid value "true" for property "color".');
    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('logs a warning for unknown nested selector', () => {
    renderer.renderRule({
      background: 'white',
      '$ what is this': {
        background: 'black',
      },
    });

    expect(spy).toHaveBeenCalledWith('Unknown property selector or nested block "$ what is this".');
    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('can insert the same declaration by manually bypassing the cache', () => {
    const a = renderer.renderDeclaration('color', 'red', {});
    const b = renderer.renderDeclaration('color', 'red', {}, { bypassCache: true });
    const c = renderer.renderDeclaration('color', 'red', {}, { bypassCache: true });

    expect(a).not.toBe(b);
    expect(b).not.toBe(c);
    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('can insert the same declaration if using a minimum rank requirement', () => {
    renderer.renderDeclaration('color', 'red'); // 0
    renderer.renderDeclaration('color', 'green'); // 1

    const c = renderer.renderDeclaration('color', 'blue'); // 2
    const d = renderer.renderDeclaration('color', 'blue', {}, { minimumRank: 10 }); // 3

    expect(c).toBe('c');
    expect(d).toBe('d');
    expect(c).not.toBe(d);
    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('generates the same declaration for each type (non-standard)', () => {
    const a = renderer.renderDeclaration('color', 'red', { type: 'global' });
    const b = renderer.renderDeclaration('color', 'red', { type: 'standard' });

    expect(a).toBe('a');
    expect(b).toBe('b');
    expect(a).not.toBe(b);
    expect(getInsertedStyles('global')).toMatchSnapshot();
    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('applies vendor prefixes to a property under a single class name', () => {
    renderer.options.prefix = true;

    renderer.renderDeclaration('display', 'flex'); // Value prefixing (wont show in snapshot)
    renderer.renderDeclaration('transition', '200ms all'); // Property prefixing

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });
});
