/* eslint-disable */

import React from 'react';
import ClassNameAesthetic from '../src/ClassNameAesthetic';
import { ComponentBlock, StyleSheet } from '../src/types';

type Theme = { unit: number };

const aesthetic = new ClassNameAesthetic<Theme>();

type Props = { foo?: string };

function Comp(props: Props) {
  return <div />;
}

// Theme
aesthetic.registerTheme('invalid', { unit: 8 }, () => ({
  '@charset': 123,
  '@font-face': [],
  '@global': 'foo',
  '@import': 123,
  '@keyframes': 'bar',
  '@page': 'baz',
  '@viewport': true,
  invalid: 'property',
}));

aesthetic.registerTheme('invalid-nested', { unit: 8 }, () => ({
  '@charset': 'utf8',
  '@font-face': {
    One: [{ invalid: 'property' }],
    Two: { fontFamily: 'Two', srcPaths: 123 },
  },
  '@global': {
    button: {
      display: 'block',
      invalid: 'property',
    },
    unknown: 123,
  },
  '@import': './foo.css',
  '@keyframes': {
    fade: {},
    slide: {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    },
    warp: {
      from: { color: 'red' },
      to: { color: 'blue', invalid: 'property' },
    },
  },
  '@page': {
    color: 'black',
    invalid: 'property',
  },
  '@viewport': {
    color: 'black',
    position: 'invalid',
  },
}));

aesthetic.registerTheme('valid', { unit: 8 }, () => ({
  '@charset': 'utf8',
  '@font-face': {
    One: [],
    Two: { fontFamily: 'Two', srcPaths: [] },
  },
  '@global': {
    button: {
      display: 'block',
    },
  },
  '@import': './foo.css',
  '@keyframes': {
    fade: {},
    slide: {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    },
    warp: {
      from: { color: 'red' },
      to: { color: 'blue', invalid: 'property' },
    },
  },
  '@page': {
    color: 'black',
  },
  '@viewport': {
    color: 'black',
  },
}));

// Direct object
const ruleset: ComponentBlock = {
  display: 'block',
  invalid: 'property',

  ':hover': {
    color: 'red',
  },

  '> invalid': {
    color: 'blue',
  },
};

const styleSheet: StyleSheet = {
  foo: {
    display: 'block',
    invalid: 'property',
  },
  bar: {
    another: 'invalid',
  },
  baz: 'direct-css-class-name',
};

// Styled component using arrow function
const CompA = aesthetic.withStyles(() => ({
  element: {
    display: 'block',
    invalid: 'property',

    ':hover': {
      color: 'red',
      invalid: 'property',
    },
  },

  // className: 'foo',
}))(Comp);

// Styled component using arrow function with body
const CompB = aesthetic.withStyles(() => {
  return {
    element: {
      display: 'block',
      invalid: 'property',

      ':hover': {
        color: 'red',
      },
    },

    className: 'foo',
  };
})(Comp);

// Styled component using regular function
const CompC = aesthetic.withStyles(function() {
  return {
    element: {
      display: 'block',
      invalid: 'property',

      ':hover': {
        color: 'red',
      },
    },

    className: 'foo',
  };
})(Comp);

// Styled component with no styles
const CompD = aesthetic.withStyles(null)(Comp);
