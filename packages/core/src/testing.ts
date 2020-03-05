/* eslint-disable sort-keys, unicorn/import-index */

import { aesthetic, Design } from './index';

export const design = new Design({
  border: {
    sm: {
      radius: '0.14rem',
      width: '0.04rem',
    },
    df: {
      radius: '0.21rem',
      width: '0.07rem',
    },
    lg: {
      radius: '0.32rem',
      width: '0.14rem',
    },
  },
  breakpoint: {
    xs: {
      query: '(min-width: 45.71em) and (max-width: 68.50em)',
      querySize: 640,
      rootLineHeight: 1.33,
      rootTextSize: '14.94px',
    },
    sm: {
      query: '(min-width: 68.57em) and (max-width: 91.36em)',
      querySize: 960,
      rootLineHeight: 1.42,
      rootTextSize: '15.94px',
    },
    md: {
      query: '(min-width: 91.43em) and (max-width: 114.21em)',
      querySize: 1280,
      rootLineHeight: 1.52,
      rootTextSize: '17.01px',
    },
    lg: {
      query: '(min-width: 114.29em) and (max-width: 137.07em)',
      querySize: 1600,
      rootLineHeight: 1.62,
      rootTextSize: '18.15px',
    },
    xl: {
      query: '(min-width: 137.14em)',
      querySize: 1920,
      rootLineHeight: 1.73,
      rootTextSize: '19.36px',
    },
  },
  heading: {
    l1: {
      letterSpacing: '0.25px',
      lineHeight: 1.5,
      size: '1.14rem',
    },
    l2: {
      letterSpacing: '0.33px',
      lineHeight: 1.69,
      size: '1.43rem',
    },
    l3: {
      letterSpacing: '0.44px',
      lineHeight: 1.9,
      size: '1.79rem',
    },
    l4: {
      letterSpacing: '0.59px',
      lineHeight: 2.14,
      size: '2.23rem',
    },
    l5: {
      letterSpacing: '0.79px',
      lineHeight: 2.4,
      size: '2.79rem',
    },
    l6: {
      letterSpacing: '1.05px',
      lineHeight: 2.7,
      size: '3.49rem',
    },
  },
  shadow: {
    xs: {
      x: '0rem',
      y: '0.14rem',
      blur: '0.14rem',
      spread: '0rem',
    },
    sm: {
      x: '0rem',
      y: '0.23rem',
      blur: '0.25rem',
      spread: '0rem',
    },
    md: {
      x: '0rem',
      y: '0.37rem',
      blur: '0.44rem',
      spread: '0rem',
    },
    lg: {
      x: '0rem',
      y: '0.61rem',
      blur: '0.77rem',
      spread: '0rem',
    },
    xl: {
      x: '0rem',
      y: '0.98rem',
      blur: '1.34rem',
      spread: '0rem',
    },
  },
  spacing: {
    xs: '0.31rem',
    sm: '0.63rem',
    df: '1.25rem',
    md: '2.50rem',
    lg: '3.75rem',
    xl: '5rem',
    type: 'vertical-rhythm',
    unit: 17.5,
  },
  text: {
    sm: {
      lineHeight: 1.25,
      size: '0.89rem',
    },
    df: {
      lineHeight: 1.25,
      size: '1rem',
    },
    lg: {
      lineHeight: 1.25,
      size: '1.13rem',
    },
  },
  typography: {
    font: {
      heading:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      locale: {},
      monospace: '"Lucida Console", Monaco, monospace',
      text:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      system:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    },
    rootLineHeight: 1.25,
    rootTextSize: '14px',
  },
});

export const lightTheme = design.createTheme(
  {
    contrast: 'normal',
    scheme: 'light',
  },
  {
    palette: {
      brand: {
        color: {
          '10': '#fff',
          '20': '#fff',
          '30': '#fff',
          '40': '#fff',
          '50': '#fff',
          '60': '#fff',
          '70': '#fff',
          '80': '#fff',
          '90': '#fff',
          '00': '#fff',
        },
        bg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
        fg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
      },
      primary: {
        color: {
          '10': '#fff',
          '20': '#fff',
          '30': '#fff',
          '40': '#fff',
          '50': '#fff',
          '60': '#fff',
          '70': '#fff',
          '80': '#fff',
          '90': '#fff',
          '00': '#fff',
        },
        bg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
        fg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
      },
      secondary: {
        color: {
          '10': '#fff',
          '20': '#fff',
          '30': '#fff',
          '40': '#fff',
          '50': '#fff',
          '60': '#fff',
          '70': '#fff',
          '80': '#fff',
          '90': '#fff',
          '00': '#fff',
        },
        bg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
        fg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
      },
      tertiary: {
        color: {
          '10': '#fff',
          '20': '#fff',
          '30': '#fff',
          '40': '#fff',
          '50': '#fff',
          '60': '#fff',
          '70': '#fff',
          '80': '#fff',
          '90': '#fff',
          '00': '#fff',
        },
        bg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
        fg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
      },
      neutral: {
        color: {
          '10': '#fff',
          '20': '#fff',
          '30': '#fff',
          '40': '#fff',
          '50': '#fff',
          '60': '#fff',
          '70': '#fff',
          '80': '#fff',
          '90': '#fff',
          '00': '#fff',
        },
        bg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
        fg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
      },
      muted: {
        color: {
          '10': '#fff',
          '20': '#fff',
          '30': '#fff',
          '40': '#fff',
          '50': '#fff',
          '60': '#fff',
          '70': '#fff',
          '80': '#fff',
          '90': '#fff',
          '00': '#fff',
        },
        bg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
        fg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
      },
      info: {
        color: {
          '10': '#fff',
          '20': '#fff',
          '30': '#fff',
          '40': '#fff',
          '50': '#fff',
          '60': '#fff',
          '70': '#fff',
          '80': '#fff',
          '90': '#fff',
          '00': '#fff',
        },
        bg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
        fg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
      },
      warning: {
        color: {
          '10': '#fff',
          '20': '#fff',
          '30': '#fff',
          '40': '#fff',
          '50': '#fff',
          '60': '#fff',
          '70': '#fff',
          '80': '#fff',
          '90': '#fff',
          '00': '#fff',
        },
        bg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
        fg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
      },
      danger: {
        color: {
          '10': '#fff',
          '20': '#fff',
          '30': '#fff',
          '40': '#fff',
          '50': '#fff',
          '60': '#fff',
          '70': '#fff',
          '80': '#fff',
          '90': '#fff',
          '00': '#fff',
        },
        bg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
        fg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
      },
      success: {
        color: {
          '10': '#fff',
          '20': '#fff',
          '30': '#fff',
          '40': '#fff',
          '50': '#fff',
          '60': '#fff',
          '70': '#fff',
          '80': '#fff',
          '90': '#fff',
          '00': '#fff',
        },
        bg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
        fg: { base: '#fff', disabled: '#fff', focused: '#fff', hovered: '#fff', selected: '#fff' },
      },
    },
  },
);

export const darkTheme = design.createTheme(
  {
    contrast: 'normal',
    scheme: 'dark',
  },
  {
    palette: {
      brand: {
        color: {
          '10': '#000',
          '20': '#000',
          '30': '#000',
          '40': '#000',
          '50': '#000',
          '60': '#000',
          '70': '#000',
          '80': '#000',
          '90': '#000',
          '00': '#000',
        },
        bg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
        fg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
      },
      primary: {
        color: {
          '10': '#000',
          '20': '#000',
          '30': '#000',
          '40': '#000',
          '50': '#000',
          '60': '#000',
          '70': '#000',
          '80': '#000',
          '90': '#000',
          '00': '#000',
        },
        bg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
        fg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
      },
      secondary: {
        color: {
          '10': '#000',
          '20': '#000',
          '30': '#000',
          '40': '#000',
          '50': '#000',
          '60': '#000',
          '70': '#000',
          '80': '#000',
          '90': '#000',
          '00': '#000',
        },
        bg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
        fg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
      },
      tertiary: {
        color: {
          '10': '#000',
          '20': '#000',
          '30': '#000',
          '40': '#000',
          '50': '#000',
          '60': '#000',
          '70': '#000',
          '80': '#000',
          '90': '#000',
          '00': '#000',
        },
        bg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
        fg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
      },
      neutral: {
        color: {
          '10': '#000',
          '20': '#000',
          '30': '#000',
          '40': '#000',
          '50': '#000',
          '60': '#000',
          '70': '#000',
          '80': '#000',
          '90': '#000',
          '00': '#000',
        },
        bg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
        fg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
      },
      muted: {
        color: {
          '10': '#000',
          '20': '#000',
          '30': '#000',
          '40': '#000',
          '50': '#000',
          '60': '#000',
          '70': '#000',
          '80': '#000',
          '90': '#000',
          '00': '#000',
        },
        bg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
        fg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
      },
      info: {
        color: {
          '10': '#000',
          '20': '#000',
          '30': '#000',
          '40': '#000',
          '50': '#000',
          '60': '#000',
          '70': '#000',
          '80': '#000',
          '90': '#000',
          '00': '#000',
        },
        bg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
        fg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
      },
      warning: {
        color: {
          '10': '#000',
          '20': '#000',
          '30': '#000',
          '40': '#000',
          '50': '#000',
          '60': '#000',
          '70': '#000',
          '80': '#000',
          '90': '#000',
          '00': '#000',
        },
        bg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
        fg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
      },
      danger: {
        color: {
          '10': '#000',
          '20': '#000',
          '30': '#000',
          '40': '#000',
          '50': '#000',
          '60': '#000',
          '70': '#000',
          '80': '#000',
          '90': '#000',
          '00': '#000',
        },
        bg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
        fg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
      },
      success: {
        color: {
          '10': '#000',
          '20': '#000',
          '30': '#000',
          '40': '#000',
          '50': '#000',
          '60': '#000',
          '70': '#000',
          '80': '#000',
          '90': '#000',
          '00': '#000',
        },
        bg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
        fg: { base: '#000', disabled: '#000', focused: '#000', hovered: '#000', selected: '#000' },
      },
    },
  },
);

export function setupAesthetic() {
  aesthetic.registerDefaultTheme('day', lightTheme);
  aesthetic.registerDefaultTheme('night', darkTheme);
}

export function teardownAesthetic() {
  lightTheme.name = '';
  darkTheme.name = '';
  aesthetic.resetForTesting();
}
