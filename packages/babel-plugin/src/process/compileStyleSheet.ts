/* eslint-disable no-param-reassign */

import intersection from 'lodash/intersection';
import { ClassName, CompiledClassMap, RenderResultSheet } from '@aesthetic/core';
import { RenderResultInput, RenderResultInputSheet, State, UnknownLocalSheet } from '../types';

type ThemeResultSheets = Record<string, RenderResultSheet<ClassName>>;

function removeFromClassName(name: ClassName, names: ClassName[]): ClassName {
  let className = name;

  names.forEach((classToRemove) => {
    className = className.replace(classToRemove, '').trim();
  });

  return className;
}

function intersectAndOptimizeClassMap(map: CompiledClassMap): CompiledClassMap {
  const themeClassNames = Object.values(map)
    .filter(Boolean)
    .map((value) => String(value).split(' '));
  const intersectedClassNames = intersection(...themeClassNames);

  const next: CompiledClassMap = {
    _: intersectedClassNames.join(' '),
  };

  Object.entries(map).forEach(([themeName, className]) => {
    const nextClassName = removeFromClassName(String(className), intersectedClassNames);

    if (nextClassName !== '') {
      next[themeName] = nextClassName;
    }
  });

  return next;
}

function combineResultClassNames(themeResultSheets: ThemeResultSheets) {}

function renderAndCombineResultSheets(
  aesthetic: State['aesthetic'],
  styleSheet: UnknownLocalSheet,
): RenderResultInputSheet {
  // @ts-expect-error Allow access
  const themeNames = Object.keys(aesthetic.themeRegistry.themes);
  const themeResultSheets: ThemeResultSheets = {};
  const sharedResultSheet: RenderResultInputSheet = {};

  // Render the stylesheet with every theme
  themeNames.forEach((themeName) => {
    themeResultSheets[themeName] = aesthetic.renderComponentStyles(styleSheet, themeName);
  });

  // Create a result that is shared amongst all themes
  Object.entries(themeResultSheets).forEach(([themeName, resultSheet]) => {
    Object.entries(resultSheet).forEach(([selector, result]) => {
      if (!result) {
        return;
      }

      const sharedResult = sharedResultSheet[selector] || {
        result: {},
        variants: {},
        variantTypes: new Set(),
      };

      if (result.result) {
        sharedResult.result[themeName] = result.result;
      }

      if (result.variants) {
        Object.entries(result.variants).forEach(([type, variant]) => {
          if (!sharedResult.variants[type]) {
            sharedResult.variants[type] = {};
          }

          sharedResult.variants[type][themeName] = variant;
        });
      }

      if (result.variantTypes) {
        sharedResult.variantTypes = new Set([
          ...Array.from(sharedResult.variantTypes),
          ...Array.from(result.variantTypes),
        ]);
      }

      sharedResultSheet[selector] = sharedResult;
    });
  });

  // Determine the intersection of theme results so that we can optimize
  Object.values(sharedResultSheet).forEach((result) => {
    result.result = intersectAndOptimizeClassMap(result.result);

    Object.entries(result.variants).forEach(([type, variant]) => {
      result.variants[type] = intersectAndOptimizeClassMap(variant);
    });
  });

  return sharedResultSheet;
}

function renderWithOppositeDirection(
  aesthetic: State['aesthetic'],
  styleSheet: UnknownLocalSheet,
): RenderResultInputSheet {
  const activeDirection = aesthetic.getActiveDirection();
  const otherDirection = activeDirection === 'ltr' ? 'rtl' : 'ltr';

  // Change to other direction
  aesthetic.changeDirection(otherDirection, false);

  const result = renderAndCombineResultSheets(aesthetic, styleSheet);

  // Be sure to change back for subsequent renders
  aesthetic.changeDirection(activeDirection, false);

  return result;
}

function determineIntersectedDirectionClassNames(
  ltrClass: ClassName | undefined,
  rtlClass: ClassName | undefined,
): ClassName | ClassName[] {
  if (ltrClass === rtlClass) {
    return ltrClass || '';
  }

  if (!ltrClass && !rtlClass) {
    return '';
  }

  if (!ltrClass) {
    return ['', '', rtlClass!];
  }

  if (!rtlClass) {
    return ['', ltrClass];
  }

  const intersectedClasses = intersection(ltrClass.split(' '), rtlClass.split(' '));
  const ltr = removeFromClassName(ltrClass, intersectedClasses);
  const rtl = removeFromClassName(rtlClass, intersectedClasses);

  if (ltr === rtl) {
    return ltr;
  }

  return [intersectedClasses.join(' '), ltr, rtl];
}

function mergeResults(
  ltrResult: RenderResultInput | undefined,
  rtlResult: RenderResultInput | undefined,
): RenderResultInput {
  const result: RenderResultInput = {
    result: {},
    variants: {},
    variantTypes: new Set(),
  };

  return result;
}

function mergeResultSheets(
  ltrSheet: RenderResultInputSheet,
  rtlSheet: RenderResultInputSheet,
): RenderResultInputSheet {
  const result: RenderResultInputSheet = {};
  const keys = new Set([...Object.keys(ltrSheet), ...Object.keys(rtlSheet)]);

  keys.forEach((key) => {
    result[key] = mergeResults(ltrSheet[key], rtlSheet[key]);
  });

  return result;
}

export function compileStyleSheet(
  state: State,
  styleSheet: UnknownLocalSheet,
): RenderResultInputSheet {
  const { aesthetic } = state;
  let resultSheet = renderAndCombineResultSheets(aesthetic, styleSheet);

  // @ts-expect-error Allow access
  if (aesthetic.options.directionConverter) {
    const oppositeResultSheet = renderWithOppositeDirection(aesthetic, styleSheet);

    resultSheet =
      aesthetic.getActiveDirection() === 'rtl'
        ? mergeResultSheets(oppositeResultSheet, resultSheet)
        : mergeResultSheets(resultSheet, oppositeResultSheet);
  }

  return resultSheet;
}
