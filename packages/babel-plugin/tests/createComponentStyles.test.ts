import { transformAsync } from '@babel/core';

function transpile(code: string) {
  return transformAsync(code, {
    babelrc: false,
    configFile: false,
    filename: __filename,
    plugins: [[require.resolve('../src'), { setupPath: 'tests/setupAesthetic.ts' }]],
  });
}

// other variables in same declaration
// multiple style sheets in same file
// code above and below

describe('createComponentStyles()', () => {
  it('transforms a single property', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    display: 'inline-block',
  }
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: \\"c169hbqq\\"
      });"
    `);
  });

  it('transforms multiple properties', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    display: 'inline-block',
    position: 'relative',
  }
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: \\"c169hbqq c1et6jhk\\"
      });"
    `);
  });

  it('transforms multiple elements', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    display: 'inline-block',
  },
  sibling: {
    position: 'absolute',
  },
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: \\"c169hbqq\\",
        sibling: \\"chj83d7\\"
      });"
    `);
  });

  it('returns same class name for same property', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    display: 'inline-block',
  },
  sibling: {
    display: 'inline-block',
  },
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: \\"c169hbqq\\",
        sibling: \\"c169hbqq\\"
      });"
    `);
  });

  it('supports selectors', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles((css) => ({
  element: {
    backgroundColor: css.var('palette-brand-bg-base'),

    ':hover': {
      backgroundColor: css.var('palette-brand-bg-hovered'),
    },

    '[disabled]': {
      backgroundColor: css.var('palette-brand-bg-disabled'),
      opacity: 0.75,
    },
  }
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: \\"csk11b8 c35023u caksy0n c184s1x2\\"
      });"
    `);
  });

  it('supports advanced selectors', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    '@selectors': {
      '> li': {
        listStyle: 'none',
      },
      '[href*="foo"]': {
        color: 'red',
      },
      ':not(:nth-child(9))': {
        display: 'hidden',
      },
      ':disabled, [disabled]': {
        opacity: 0.75,
      },
    },
  }
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: \\"c18e5758 cwctczp c1dh84j0 cgfq97u c184s1x2\\"
      });"
    `);
  });

  it('supports media and feature queries', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles((css) => ({
  element: {
    '@media': {
      '(max-width: 600px)': {
        width: '100%',
      },
      [css.tokens.breakpoint.lg.query]: {
        width: '10rem',
      },
    },

    '@supports': {
      '(display: inline-flex)': {
        display: 'inline-flex',
      },
    },
  }
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: \\"czviw19 c1caoji8 cm8buhq\\"
      });"
    `);
  });

  it('supports font faces', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    fontFamily: {
      fontFamily: 'Open Sans',
      fontStyle: 'normal',
      fontWeight: 'normal',
      srcPaths: ['fonts/OpenSans.woff2', 'fonts/OpenSans.ttf'],
    },
  }
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: \\"c113ikk6\\"
      });"
    `);
  });

  it('supports keyframes', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    animationName: {
      from: { transform: 'scaleX(0)' },
      to: { transform: 'scaleX(1)' },
    },
    animationDuration: '3s',
    animationTimingFunction: 'ease-in',
  }
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: \\"cgfm18 cqdzva8 c128h89l\\"
      });"
    `);
  });

  it('supports fallbacks', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    display: 'inline-flex',

    '@fallbacks': {
      display: ['inline', 'inline-block'],
    },
  }
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: \\"ceq1ljg\\"
      });"
    `);
  });

  it('supports variants', async () => {
    const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles((css) => ({
  element: {
    '@variants': {
      size: {
        sm: { fontSize: css.var('text-sm-size') },
        df: { fontSize: css.var('text-df-size') },
        lg: { fontSize: css.var('text-lg-size') },
      },

      palette: {
        brand: { backgroundColor: css.var('palette-brand-bg-base') },
        success: { backgroundColor: css.var('palette-success-bg-base') },
        warning: { backgroundColor: css.var('palette-warning-bg-base') },
      },
    },
  }
}));`);

    expect(result?.code).toMatchInlineSnapshot(`
      "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
      const styleSheet = compileComponentStyles({
        element: {
          variants: {
            size_sm: \\"c1qx7d18\\",
            size_df: \\"cpfxegw\\",
            size_lg: \\"ckfuq95\\",
            palette_brand: \\"csk11b8\\",
            palette_success: \\"czb93oc\\",
            palette_warning: \\"c3x9w2d\\"
          },
          variantTypes: [\\"size\\", \\"palette\\"]
        }
      });"
    `);
  });

  describe('style sheet variants', () => {
    it('works with color scheme chained', async () => {
      const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    display: 'block',
    color: 'gray',
  },
}))
  .addColorSchemeVariant('light', () => ({
    element: {
      backgroundColor: 'white',
      color: 'black',
    },
  }))
  .addColorSchemeVariant('dark', () => ({
    element: {
      backgroundColor: 'black',
      color: 'white',
    },
  }));`);

      expect(result?.code).toMatchInlineSnapshot(`
        "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
        const styleSheet = compileComponentStyles({
          element: {
            result: {
              _: \\"c1s7hmty\\",
              light: \\"cddrzz3 c13fy9i4\\",
              dark: \\"c1r72mm7 c18rzwak\\"
            }
          }
        });"
      `);
    });

    it('works with contrast level chained', async () => {
      const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    display: 'block',
    color: 'orange',
  },
}))
  .addContrastVariant('low', () => ({
    element: {
      color: 'red',
    },
  }))
  .addContrastVariant('high', () => ({
    element: {
      color: 'yellow',
    },
  }));`);

      expect(result?.code).toMatchInlineSnapshot(`
        "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
        const styleSheet = compileComponentStyles({
          element: \\"c1s7hmty c3s35ig\\"
        });"
      `);
    });

    it('works with theme chained', async () => {
      const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    display: 'block',
    color: 'gray',
  },
}))
  .addThemeVariant('night', () => ({
    element: {
      color: 'blue',
    },
  }))
  .addThemeVariant('twilight', () => ({
    element: {
      color: 'purple',
    },
  }));`);

      expect(result?.code).toMatchInlineSnapshot(`
        "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
        const styleSheet = compileComponentStyles({
          element: \\"c1s7hmty cmqamj9\\"
        });"
      `);
    });

    it('works with theme and applies if current theme matches', async () => {
      const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles(() => ({
  element: {
    display: 'block',
    color: 'gray',
  },
}))
  .addThemeVariant('light', () => ({
    element: {
      color: 'blue',
    },
  }));`);

      expect(result?.code).toMatchInlineSnapshot(`
        "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
        const styleSheet = compileComponentStyles({
          element: {
            result: {
              _: \\"c1s7hmty\\",
              light: \\"ct2jx0m\\",
              dark: \\"cmqamj9\\"
            }
          }
        });"
      `);
    });
  });

  describe('interpolations', () => {
    it('supports token variables', async () => {
      const result = await transpile(`
import { createComponentStyles } from '@aesthetic/local';

const styleSheet = createComponentStyles((css) => ({
  element: {
    display: 'block',
    padding: css.unit(1, 2, 3),
    color: css.tokens.palette.danger.bg.base,
    '@variants': {
      size: {
        sm: { fontSize: css.var('text-sm-size') },
        df: { fontSize: css.var('text-df-size') },
        lg: { fontSize: css.var('text-lg-size') },
      },
    },
  },
}));`);

      expect(result?.code).toMatchInlineSnapshot(`
        "import { compileComponentStyles } from \\"@aesthetic/core/runtime\\";
        const styleSheet = compileComponentStyles({
          element: {
            result: {
              _: \\"c1s7hmty c1w1f7yo\\",
              light: \\"cczrxkt\\",
              dark: \\"cih57e3\\"
            },
            variants: {
              size_sm: \\"c1qx7d18\\",
              size_df: \\"cpfxegw\\",
              size_lg: \\"ckfuq95\\"
            },
            variantTypes: [\\"size\\"]
          }
        });"
      `);
    });
  });
});
