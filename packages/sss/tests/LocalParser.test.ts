import Block from '../src/Block';
import parse from '../src/parseLocalStyleSheet';
import { createBlock } from './helpers';
import {
  SYNTAX_FALLBACKS,
  SYNTAX_PROPERTIES,
  SYNTAX_SELECTOR_ATTRIBUTES,
  SYNTAX_SELECTOR_PSEUDOS,
  SYNTAX_SELECTORS_SPECIFICITY,
  SYNTAX_SELECTORS_COMBINATORS,
  SYNTAX_SELECTORS_MULTIPLE,
  SYNTAX_SUPPORTS,
  SYNTAX_MEDIA,
  SYNTAX_MEDIA_NESTED,
  SYNTAX_LOCAL_BLOCK,
  SYNTAX_VARIABLES,
  SYNTAX_VARIANTS,
} from './__mocks__/local';

describe('LocalParser', () => {
  let spy: jest.Mock;

  beforeEach(() => {
    spy = jest.fn();
  });

  it('errors for an at-rule', () => {
    expect(() => {
      parse(
        {
          '@rule': {},
        },
        {},
      );
    }).toThrow('At-rules may not be defined at the root of a local block, found "@rule".');
  });

  it('errors for invalid value type', () => {
    expect(() => {
      parse(
        {
          // @ts-expect-error
          el: 123,
        },
        {},
      );
    }).toThrow(
      'Invalid declaration for "el". Must be an object (style declaration) or string (class name).',
    );
  });

  it('renders a full block', () => {
    parse(
      {
        selector: SYNTAX_LOCAL_BLOCK,
      },
      {
        onRule: spy,
      },
    );

    expect(spy).toHaveBeenCalledWith('selector', createBlock('selector', SYNTAX_LOCAL_BLOCK));
  });

  describe('class names', () => {
    it('emits for each class name', () => {
      parse(
        {
          foo: 'foo',
          bar: {},
          baz: 'baz',
        },
        {
          onClass: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith('foo', 'foo');
      expect(spy).toHaveBeenCalledWith('baz', 'baz');
    });
  });

  describe('properties', () => {
    it('emits each property and value', () => {
      parse(
        {
          props: SYNTAX_PROPERTIES,
        },
        {
          onBlockProperty: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(4);
      expect(spy).toHaveBeenCalledWith(expect.any(Block), 'color', 'black');
      expect(spy).toHaveBeenCalledWith(expect.any(Block), 'display', 'inline');
      expect(spy).toHaveBeenCalledWith(expect.any(Block), 'marginRight', 10);
      expect(spy).toHaveBeenCalledWith(expect.any(Block), 'padding', 0);
    });

    it('doesnt emit for undefined values', () => {
      parse(
        {
          props: {
            color: undefined,
          },
        },
        {
          onBlockProperty: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('attributes', () => {
    it('emits each attribute with value and params', () => {
      parse(
        {
          attrs: SYNTAX_SELECTOR_ATTRIBUTES,
        },
        {
          onBlockAttribute: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(2);

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '[disabled]',
        createBlock('[disabled]', SYNTAX_SELECTOR_ATTRIBUTES['[disabled]']),
        { specificity: 0 },
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '[href]',
        createBlock('[href]', SYNTAX_SELECTOR_ATTRIBUTES['[href]']),
        { specificity: 0 },
      );
    });
  });

  describe('pseudos', () => {
    it('emits each pseudo (class and element) with value and params', () => {
      parse(
        {
          attrs: SYNTAX_SELECTOR_PSEUDOS,
        },
        {
          onBlockPseudo: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(2);

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        ':hover',
        createBlock(':hover', SYNTAX_SELECTOR_PSEUDOS[':hover']),
        { specificity: 0 },
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '::before',
        createBlock('::before', SYNTAX_SELECTOR_PSEUDOS['::before']),
        { specificity: 0 },
      );
    });
  });

  describe('selectors', () => {
    it('errors if selector is not an object', () => {
      expect(() => {
        parse(
          {
            selector: {
              // @ts-expect-error
              ':hover': 123,
            },
          },
          {},
        );
      }).toThrow('":hover" must be a declaration object of CSS properties.');
    });

    it('errors if a comma separated list is passed', () => {
      expect(() => {
        parse(
          {
            selector: {
              // @ts-expect-error
              ':hover, :focus': {},
            },
          },
          {},
        );
      }).toThrow('Advanced selector ":hover, :focus" must be nested within a @selectors block.');
    });
  });

  describe('@fallbacks', () => {
    it('errors if fallbacks are not an object', () => {
      expect(() => {
        parse(
          {
            fb: {
              // @ts-expect-error
              '@fallbacks': 123,
            },
          },
          {},
        );
      }).toThrow('"@fallbacks" must be a declaration object of CSS properties.');
    });

    it('does not emit if no fallbacks', () => {
      parse(
        {
          fb: {},
        },
        {
          onBlockFallback: spy,
        },
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits for each fallback declaration', () => {
      parse(
        {
          fb: SYNTAX_FALLBACKS,
        },
        {
          onBlockFallback: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith(expect.any(Block), 'background', ['red']);
      expect(spy).toHaveBeenCalledWith(expect.any(Block), 'display', ['block', 'inline-block']);
      expect(spy).toHaveBeenCalledWith(expect.any(Block), 'color', ['blue']);
    });
  });

  describe('@media', () => {
    it('errors if media is not an object', () => {
      expect(() => {
        parse(
          {
            fb: {
              // @ts-expect-error
              '@media': 123,
            },
          },
          {},
        );
      }).toThrow('@media must be a mapping of CSS declarations.');
    });

    it('does not emit if no media', () => {
      parse(
        {
          media: {},
        },
        {
          onBlockMedia: spy,
        },
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits for each condition', () => {
      parse(
        {
          media: SYNTAX_MEDIA,
        },
        {
          onBlockMedia: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(2);

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '(min-width: 300px)',
        createBlock('@media (min-width: 300px)', {
          color: 'blue',
          paddingLeft: 15,
        }),
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '(max-width: 1000px)',
        createBlock('@media (max-width: 1000px)', {
          color: 'green',
          paddingLeft: 20,
        }),
      );
    });

    it('supports nested media conditions', () => {
      parse(
        {
          media: SYNTAX_MEDIA_NESTED,
        },
        {
          onBlockMedia: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(2);

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '(min-width: 300px)',
        createBlock('@media (min-width: 300px)', {
          color: 'blue',
          '@media (max-width: 1000px)': {
            color: 'green',
          },
        }),
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '(max-width: 1000px)',
        createBlock('@media (max-width: 1000px)', {
          color: 'green',
        }),
      );
    });
  });

  describe('@selectors', () => {
    it('errors if selectors are not an object', () => {
      expect(() => {
        parse(
          {
            fb: {
              // @ts-expect-error
              '@selectors': 123,
            },
          },
          {},
        );
      }).toThrow('@selectors must be a mapping of CSS declarations.');
    });

    it('does not emit if no selectors', () => {
      parse(
        {
          selectors: {},
        },
        {
          onBlockSelector: spy,
        },
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits selector with defined specificity', () => {
      const attrSpy = jest.fn();
      const pseudoSpy = jest.fn();

      parse(
        {
          selectors: SYNTAX_SELECTORS_SPECIFICITY,
        },
        {
          onBlockAttribute: attrSpy,
          onBlockPseudo: pseudoSpy,
        },
      );

      expect(pseudoSpy).toHaveBeenCalledTimes(2);

      expect(pseudoSpy).toHaveBeenCalledWith(
        expect.any(Block),
        ':hover',
        createBlock(':hover', { position: 'static' }),
        { specificity: 2 },
      );

      expect(pseudoSpy).toHaveBeenCalledWith(
        expect.any(Block),
        ':active',
        createBlock(':active', { position: 'absolute' }),
        { specificity: 1 },
      );

      expect(attrSpy).toHaveBeenCalledTimes(1);

      expect(attrSpy).toHaveBeenCalledWith(
        expect.any(Block),
        '[hidden]',
        createBlock('[hidden]', { position: 'relative' }),
        { specificity: 3 },
      );
    });

    it('emits universal and combinator selectors', () => {
      parse(
        {
          selectors: SYNTAX_SELECTORS_COMBINATORS,
        },
        {
          onBlockSelector: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(4);

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '> li',
        createBlock('> li', { listStyle: 'bullet' }),
        { specificity: 0 },
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '+ div',
        createBlock('+ div', { display: 'none' }),
        { specificity: 0 },
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '~ span',
        createBlock('~ span', { color: 'black' }),
        { specificity: 0 },
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '*',
        createBlock('*', { backgroundColor: 'inherit' }),
        { specificity: 0 },
      );
    });

    it('emits each selector in a comma separated list', () => {
      const attrSpy = jest.fn();
      const pseudoSpy = jest.fn();

      parse(
        {
          selectors: SYNTAX_SELECTORS_MULTIPLE,
        },
        {
          onBlockAttribute: attrSpy,
          onBlockPseudo: pseudoSpy,
          onBlockSelector: spy,
        },
      );

      expect(pseudoSpy).toHaveBeenCalledWith(
        expect.any(Block),
        ':disabled',
        createBlock(':disabled', { cursor: 'default' }),
        { specificity: 0 },
      );

      expect(attrSpy).toHaveBeenCalledWith(
        expect.any(Block),
        '[disabled]',
        createBlock('[disabled]', { cursor: 'default' }),
        { specificity: 2 },
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '> span',
        createBlock('> span', { cursor: 'default' }),
        { specificity: 0 },
      );
    });
  });

  describe('@supports', () => {
    it('errors if supports are not an object', () => {
      expect(() => {
        parse(
          {
            fb: {
              // @ts-expect-error
              '@supports': 123,
            },
          },
          {},
        );
      }).toThrow('@supports must be a mapping of CSS declarations.');
    });

    it('does not emit if no supports', () => {
      parse(
        {
          supports: {},
        },
        {
          onBlockSupports: spy,
        },
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits for each condition', () => {
      parse(
        {
          supports: SYNTAX_SUPPORTS,
        },
        {
          onBlockSupports: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(2);

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        '(display: flex)',
        createBlock('@supports (display: flex)', { display: 'flex' }),
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        'not (display: flex)',
        createBlock('@supports not (display: flex)', { float: 'left' }),
      );
    });
  });

  describe('@variables', () => {
    it('errors if variables are not an object', () => {
      expect(() => {
        parse(
          {
            vars: {
              // @ts-expect-error
              '@variables': 123,
            },
          },
          {},
        );
      }).toThrow('@variables must be a mapping of CSS variables.');
    });

    it('does not emit if no variables', () => {
      parse(
        {
          vars: {},
        },
        {
          onBlockVariable: spy,
        },
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it('does not emit `variable` listener', () => {
      parse(
        {
          vars: SYNTAX_VARIABLES,
        },
        {
          onVariable: spy,
        },
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits for each variable', () => {
      parse(
        {
          vars: SYNTAX_VARIABLES,
        },
        {
          onBlockVariable: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith(expect.any(Block), '--font-size', '14px');
      expect(spy).toHaveBeenCalledWith(expect.any(Block), '--color', 'red');
      expect(spy).toHaveBeenCalledWith(expect.any(Block), '--line-height', 1.5);
    });
  });

  describe('@variants', () => {
    it('errors if variants are not an object', () => {
      expect(() => {
        parse(
          {
            fb: {
              // @ts-expect-error
              '@variants': 123,
            },
          },
          {},
        );
      }).toThrow('@variants must be a mapping of CSS declarations.');
    });

    it('does not emit if no variants', () => {
      parse(
        {
          variants: {},
        },
        {
          onBlockVariant: spy,
        },
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits for each condition', () => {
      parse(
        {
          variants: SYNTAX_VARIANTS,
        },
        {
          onBlockVariant: spy,
        },
      );

      expect(spy).toHaveBeenCalledTimes(3);

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        'size_small',
        createBlock('size_small', { fontSize: 14 }),
        { specificity: 0 },
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Block),
        'size_large',
        createBlock('size_large', { fontSize: 18 }),
        { specificity: 0 },
      );
    });
  });
});
