/* eslint-disable sort-keys, import/no-unresolved, @typescript-eslint/no-explicit-any, unicorn/import-index */

import CSS from 'csstype';
import convertRTL from 'rtl-css-js';
import {
  getFlushedStyles as getBaseFlushedStyles,
  getStyleElements,
  isObject,
} from 'aesthetic-utils';
import {
  Aesthetic,
  Adapter,
  TestAdapter,
  FontFace,
  Direction,
  SheetMap,
  Keyframes,
  GLOBAL_STYLE_NAME,
} from './index';

export { TestAdapter };

export interface TestTheme {
  bg: string;
  color: string;
  unit: number;
}

export function setupAesthetic(aesthetic: Aesthetic, adapter?: Adapter<any, any>) {
  aesthetic.configure({
    adapter: adapter || new TestAdapter(),
  });

  aesthetic.registerTheme('default', { bg: 'gray', color: 'black', unit: 8 }, ({ unit }) => ({
    '@global': {
      body: {
        padding: unit,
      },
    },
  }));

  aesthetic.extendTheme('light', 'default', { bg: 'white' });

  aesthetic.extendTheme('dark', 'default', { bg: 'black', color: 'white' });

  aesthetic.registerTheme('no-globals', {});
}

export function teardownAesthetic(aesthetic: Aesthetic) {
  aesthetic.resetForTesting();
}

export function cleanupStyleElements() {
  getStyleElements().forEach(style => {
    style.remove();
  });
}

export function getFlushedStyles(namespace?: string): string {
  return getBaseFlushedStyles(getStyleElements(namespace));
}

export interface UnknownObject {
  [key: string]: unknown;
}

export function convertDirection(value: UnknownObject | UnknownObject[], dir: Direction): {} {
  if (dir !== 'rtl') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(object => convertDirection(object, dir));
  }

  if (!isObject(value)) {
    return value;
  }

  const props: UnknownObject = {};
  const nested: UnknownObject = {};

  Object.keys(value).forEach(key => {
    const prop = value[key];

    if (isObject(prop) || Array.isArray(prop)) {
      nested[key] = convertDirection(prop as UnknownObject, dir);
    } else {
      props[key] = prop;
    }
  });

  return {
    ...convertRTL(props),
    ...nested,
  };
}

export function renderAndExpect(
  adapter: Adapter<{}, {}>,
  styleSheet: SheetMap<string | UnknownObject>,
  expectedStyles: UnknownObject,
  {
    dir,
    global = false,
  }: {
    dir: Direction;
    global?: boolean;
  },
) {
  const name = global
    ? GLOBAL_STYLE_NAME
    : adapter.constructor.name.replace('Adapter', '').toLowerCase();
  const options = { name, dir };
  const convertedSheet = global
    ? adapter.syntax.convertGlobalSheet(styleSheet, options).toObject()
    : adapter.syntax.convertStyleSheet(styleSheet, options).toObject();
  const parsedSheet = adapter.parseStyleSheet(convertedSheet, { dir, global, name, theme: '' });
  const className = adapter.transformStyles(Object.values(parsedSheet), options);

  adapter.flushStyles(name);

  expect(convertedSheet).toEqual(convertDirection(expectedStyles, dir));
  expect(getFlushedStyles()).toMatchSnapshot();
  expect(className).toMatchSnapshot();
}

export const TEST_CLASS_NAMES = {
  footer: '.footer',
  header: '.header',
};

export const TEST_STATEMENT = {
  footer: { color: 'blue' },
  header: { color: 'red' },
};

export const DIRECTIONS: Direction[] = ['ltr', 'rtl'];

export const FONT_ROBOTO: FontFace = {
  fontFamily: 'Roboto',
  fontStyle: 'normal',
  fontWeight: 'normal',
  local: ['Robo'],
  srcPaths: ['fonts/Roboto.woff2', 'fonts/Roboto.ttf'],
};

export const FONT_ROBOTO_FLAT_SRC: CSS.FontFace = {
  fontFamily: 'Roboto',
  fontStyle: 'normal',
  fontWeight: 'normal',
  src:
    "local('Robo'), url('fonts/Roboto.woff2') format('woff2'), url('fonts/Roboto.ttf') format('truetype')",
};

export const FONT_CIRCULAR_MULTIPLE: FontFace[] = [
  {
    fontFamily: 'Circular',
    fontStyle: 'normal',
    fontWeight: 'normal',
    srcPaths: ['fonts/Circular.woff2'],
  },
  {
    fontFamily: 'Circular',
    fontStyle: 'italic',
    fontWeight: 'normal',
    srcPaths: ['fonts/Circular-Italic.woff2'],
  },
  {
    fontFamily: 'Circular',
    fontStyle: 'normal',
    fontWeight: 300,
    srcPaths: ['fonts/Circular-Light.woff2'],
  },
  {
    fontFamily: 'Circular',
    fontStyle: 'normal',
    fontWeight: 700,
    srcPaths: ['fonts/Circular-Bold.woff2'],
  },
];

export const FONT_CIRCULAR_MULTIPLE_FLAT_SRC: CSS.FontFace[] = [
  {
    fontFamily: 'Circular',
    fontStyle: 'normal',
    fontWeight: 'normal',
    src: "url('fonts/Circular.woff2') format('woff2')",
  },
  {
    fontFamily: 'Circular',
    fontStyle: 'italic',
    fontWeight: 'normal',
    src: "url('fonts/Circular-Italic.woff2') format('woff2')",
  },
  {
    fontFamily: 'Circular',
    fontStyle: 'normal',
    fontWeight: 300,
    src: "url('fonts/Circular-Light.woff2') format('woff2')",
  },
  {
    fontFamily: 'Circular',
    fontStyle: 'normal',
    fontWeight: 700,
    src: "url('fonts/Circular-Bold.woff2') format('woff2')",
  },
];

export const KEYFRAME_FADE: Keyframes = {
  from: { opacity: 0 },
  to: { opacity: 1 },
};

export const KEYFRAME_SLIDE_PERCENT: Keyframes = {
  '0%': { left: '0%' },
  '50%': { left: '50%' },
  '100%': { left: '100%' },
};

export const SYNTAX_UNIFIED_LOCAL = {
  button: {
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
    ':hover': {
      backgroundColor: '#286090',
      borderColor: '#204d74',
    },
    '::before': {
      content: '"★"',
      display: 'inline-block',
      verticalAlign: 'middle',
      marginRight: 5,
    },
  },
};

export const SYNTAX_UNIFIED_GLOBAL_FULL = {
  '@font-face': {
    Roboto: FONT_ROBOTO,
  },
  '@keyframes': {
    fade: KEYFRAME_FADE,
  },
};

export const SYNTAX_UNIFIED_LOCAL_FULL = {
  button: {
    ...SYNTAX_UNIFIED_LOCAL.button,
    '@media': {
      '(max-width: 600px)': {
        padding: '4px 8px',
      },
    },
  },
};

export const SYNTAX_ATTRIBUTE = {
  attr: {
    display: 'block',
    '[disabled]': {
      opacity: 0.5,
    },
  },
};

export const SYNTAX_CHARSET = {
  '@charset': 'utf8',
};

export const SYNTAX_DESCENDANT = {
  list: {
    margin: 0,
    padding: 0,
    '@selectors': {
      '> li': {
        listStyle: 'bullet',
      },
    },
  },
};

export const SYNTAX_IMPORT = {
  '@import': 'url("./some/path.css")',
};

export const SYNTAX_IMPORT_MULTIPLE = {
  '@import': ['url("./some/path.css")', 'url("./another/path.css")'],
};

export const SYNTAX_FALLBACKS = {
  fallback: {
    background: 'linear-gradient(...)',
    display: 'flex',
    '@fallbacks': {
      background: 'red',
      display: ['block', 'inline-block'],
      // Test property without a non-fallback
      color: 'blue',
    },
  },
};

export const SYNTAX_FONT_FACE = {
  '@font-face': {
    Roboto: [FONT_ROBOTO],
  },
};

export const SYNTAX_FONT_FACE_MULTIPLE = {
  '@font-face': {
    Circular: FONT_CIRCULAR_MULTIPLE,
  },
};

export const SYNTAX_FONT_FACE_MIXED = {
  '@font-face': {
    Roboto: [FONT_ROBOTO],
    Circular: FONT_CIRCULAR_MULTIPLE,
  },
};

export const SYNTAX_FONT_FACES_INLINE = {
  single: {
    fontFamily: FONT_ROBOTO,
  },
  multiple: {
    fontFamily: [...FONT_CIRCULAR_MULTIPLE, 'OtherFont', FONT_ROBOTO],
  },
};

export const SYNTAX_GLOBAL = {
  '@global': {
    body: { margin: 0 },
    html: { height: '100%' },
    a: {
      color: 'red',
      ':hover': {
        color: 'darkred',
      },
      '@selectors': {
        ':focus': {
          color: 'lightred',
        },
      },
    },
    ul: {
      margin: 0,
      '@selectors': {
        '> li': {
          margin: 0,
        },
      },
      '@media': {
        '(max-width: 500px)': {
          margin: 20,
        },
      },
    },
  },
};

export const SYNTAX_KEYFRAMES = {
  '@keyframes': {
    fade: KEYFRAME_FADE,
  },
};

export const SYNTAX_KEYFRAMES_PERCENT = {
  '@keyframes': {
    slide: KEYFRAME_SLIDE_PERCENT,
  },
};

export const SYNTAX_KEYFRAMES_MIXED = {
  '@keyframes': {
    fade: KEYFRAME_FADE,
    slide: KEYFRAME_SLIDE_PERCENT,
  },
};

export const SYNTAX_KEYFRAMES_INLINE = {
  single: {
    animationName: {
      ...KEYFRAME_SLIDE_PERCENT,
      name: 'slide',
    },
  },
  multiple: {
    animationName: [{ ...KEYFRAME_SLIDE_PERCENT, name: 'slide' }, 'unknown', KEYFRAME_FADE],
  },
};

export const SYNTAX_MEDIA_QUERY = {
  media: {
    color: 'red',
    paddingLeft: 10,
    '@media': {
      '(min-width: 300px)': {
        color: 'blue',
        paddingLeft: 15,
      },
      '(max-width: 1000px)': {
        color: 'green',
        paddingLeft: 20,
      },
    },
  },
};

export const SYNTAX_MEDIA_QUERY_NESTED = {
  media: {
    color: 'red',
    '@media': {
      '(min-width: 300px)': {
        color: 'blue',

        '@media': {
          '(max-width: 1000px)': {
            color: 'green',
          },
        },
      },
    },
  },
};

export const SYNTAX_MULTI_SELECTOR = {
  multi: {
    cursor: 'pointer',
    '@selectors': {
      ':disabled, [disabled], > span': {
        cursor: 'default',
      },
    },
  },
};

export const SYNTAX_NAMESPACE = {
  '@namespace': 'url(http://www.w3.org/1999/xhtml)',
};

export const SYNTAX_PAGE = {
  '@page': {
    margin: '1cm',
    ':left': {
      margin: 0,
    },
  },
};

export const SYNTAX_PROPERTIES = {
  props: {
    color: 'black',
    display: 'inline',
    marginRight: 10,
    padding: 0,
  },
};

export const SYNTAX_PSEUDO = {
  pseudo: {
    position: 'fixed',
    ':hover': {
      position: 'static',
    },
    '::before': {
      position: 'absolute',
    },
  },
};

export const SYNTAX_SUPPORTS = {
  sup: {
    display: 'block',
    '@supports': {
      '(display: flex)': {
        display: 'flex',
      },
      'not (display: flex)': {
        float: 'left' as 'left',
      },
    },
  },
};

export const SYNTAX_VIEWPORT = {
  '@viewport': {
    width: 'device-width',
    orientation: 'landscape',
  },
};

export const SYNTAX_RAW_CSS = {
  button: `
    display: 'block';
    font-size: 16px;
    text-align: 'left';

    &:hover {
      color: 'red';
    }

    & {
      vertical-align: 'middle';
    }

    @media (max-width: 600px) {
      display: 'none';
    }

    @supports (display: flex) {
      display: 'flex';
    }
  `,
};