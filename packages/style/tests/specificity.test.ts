import Renderer from '../src/client/ClientRenderer';
import getInsertedStyles from '../src/helpers/getInsertedStyles';
import purgeStyles from './purgeStyles';

describe('Specificity', () => {
  let renderer: Renderer;

  beforeEach(() => {
    renderer = new Renderer();
  });

  afterEach(() => {
    purgeStyles('global');
    purgeStyles('standard');
    purgeStyles('conditions');
  });

  it('inserts declarations in the order they are defined', () => {
    renderer.renderRule({
      margin: 0,
      padding: 1,
      width: 50,
    });

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('inserts declarations in the order they are defined (reversed)', () => {
    renderer.renderRule({
      width: 50,
      padding: 1,
      margin: 0,
    });

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('inserts selectors in the order they are defined', () => {
    renderer.renderRule({
      color: 'white',
      ':active': {
        color: 'red',
      },
      ':hover': {
        color: 'blue',
      },
    });

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  it('inserts selectors in the order they are defined (reversed)', () => {
    renderer.renderRule({
      color: 'white',
      ':hover': {
        color: 'blue',
      },
      ':active': {
        color: 'red',
      },
    });

    expect(getInsertedStyles('standard')).toMatchSnapshot();
  });

  describe('rule sets', () => {
    const ruleSet = {
      button: {
        padding: 8,
        display: 'inline-block',
        color: 'red',

        ':hover': {
          color: 'darkred',
        },
      },
      buttonActive: {
        color: 'darkred',
      },
      buttonDisabled: {
        color: 'gray',
      },
    };

    it('renders in defined order if no explicit order provided', () => {
      const className = renderer.renderRuleSets(ruleSet);

      expect(className).toBe('a b c d e f');
      expect(getInsertedStyles('standard')).toMatchSnapshot();
    });

    it('renders in a explicit order', () => {
      const className = renderer.renderRuleSets(ruleSet, [
        'buttonActive',
        'buttonDisabled',
        'button',
      ]);

      expect(className).toBe('a b c d e f');
      expect(getInsertedStyles('standard')).toMatchSnapshot();
    });

    it('renders the same class names from previous render', () => {
      const classNameA = renderer.renderRuleSets(ruleSet, ['buttonActive']);
      const classNameB = renderer.renderRuleSets(ruleSet, ['buttonActive']);

      expect(classNameA).toBe('a');
      expect(classNameA).toBe(classNameB);
      expect(getInsertedStyles('standard')).toMatchSnapshot();
    });

    it('can omit sets', () => {
      const className = renderer.renderRuleSets(ruleSet, ['buttonActive']);

      expect(className).toBe('a');
      expect(getInsertedStyles('standard')).toMatchSnapshot();
    });

    it('can render set by set', () => {
      const a = renderer.renderRuleSets(ruleSet, ['buttonActive']);

      expect(a).toBe('a');
      expect(getInsertedStyles('standard')).toMatchSnapshot();

      const b = renderer.renderRuleSets(ruleSet, ['button']);

      expect(b).toBe('b c d e');
      expect(getInsertedStyles('standard')).toMatchSnapshot();

      const c = renderer.renderRuleSets(ruleSet, ['buttonDisabled']);

      expect(c).toBe('f');
      expect(getInsertedStyles('standard')).toMatchSnapshot();
    });
  });
});