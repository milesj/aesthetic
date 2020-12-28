import {
  GlobalStyleSheet,
  GlobalStyleSheetNeverize,
  LocalStyleSheet,
  LocalStyleSheetNeverize,
  LocalBlock,
  PropertyHandlerMap,
  CustomProperties,
} from '@aesthetic/sss';
import { Utilities } from '@aesthetic/system';
import {
  Direction,
  DirectionConverter,
  ColorScheme,
  ContrastLevel,
  ThemeName,
  Unit,
  UnitFactory,
  VendorPrefixer,
} from '@aesthetic/types';
import StyleSheet from './StyleSheet';

// Re-export for convenience
export { GlobalStyleSheet, LocalStyleSheet, LocalBlock, CustomProperties };

// And add aliases too
export type ElementStyles = LocalBlock;
export type ComponentStyles = LocalStyleSheet<ElementStyles>;
export type ThemeStyles = GlobalStyleSheet<ElementStyles>;

export interface RenderResult<T> {
  result?: T;
  variants?: Record<string, T>;
}

export type RenderResultSheet<Result, Keys extends string = string> = {
  [K in Keys]?: RenderResult<Result>;
};

export interface SheetParams {
  contrast?: ContrastLevel;
  direction?: Direction;
  scheme?: ColorScheme;
  theme?: ThemeName;
  unit?: Unit;
  vendor?: boolean;
}

export interface SheetParamsExtended extends SheetParams {
  customProperties?: PropertyHandlerMap;
}

export interface SheetElementMetadata<T> {
  renderResult: RenderResult<T>;
  variantTypes?: Set<string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BaseSheetFactory = (utils: Utilities<any>) => object;

export type GlobalSheetFactory<Shape = unknown, Block extends object = LocalBlock> = (
  utils: Utilities<Block>,
) => Shape extends unknown
  ? GlobalStyleSheet<Block>
  : GlobalStyleSheet<Block> & GlobalStyleSheetNeverize<Shape, Block>;

export type GlobalSheet<Shape, Block extends object, Result> = Omit<
  StyleSheet<Result, GlobalSheetFactory<Shape, Block>>,
  'addColorSchemeVariant' | 'addContrastVariant' | 'addThemeVariant'
>;

export type LocalSheetFactory<Shape = unknown, Block extends object = LocalBlock> = (
  utils: Utilities<Block>,
) => Shape extends unknown
  ? LocalStyleSheet<Block>
  : LocalStyleSheet<Block> & LocalStyleSheetNeverize<Shape, Block>;

export type LocalSheet<Shape, Block extends object, Result> = StyleSheet<
  Result,
  LocalSheetFactory<Shape, Block>
>;

export interface AestheticOptions {
  customProperties?: PropertyHandlerMap;
  defaultUnit?: Unit | UnitFactory;
  deterministicClasses?: boolean;
  directionConverter?: DirectionConverter | null;
  rootVariables?: boolean;
  vendorPrefixer?: VendorPrefixer | null;
}

export type EventType = 'change:direction' | 'change:theme';

export type EventListener = (...args: unknown[]) => void;

export type OnChangeDirection = (newDir: Direction) => void;

export type OnChangeTheme = (newTheme: ThemeName, results: unknown[]) => void;
