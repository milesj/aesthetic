/* eslint-disable no-param-reassign, lines-between-class-members, no-dupe-class-members */

import { FontFace as SSSFontFace, formatFontFace, LocalBlock } from '@aesthetic/sss';
import { Theme, ThemeRegistry } from '@aesthetic/system';
import {
  ClassName,
  Direction,
  Engine,
  FontFace,
  Keyframes,
  RenderOptions,
  ThemeName,
} from '@aesthetic/types';
import { arrayLoop, createState, isDOM } from '@aesthetic/utils';
import StyleSheet from './StyleSheet';
import {
  AestheticOptions,
  EventListener,
  EventType,
  GlobalSheet,
  GlobalSheetFactory,
  LocalSheet,
  LocalSheetFactory,
  OnChangeDirection,
  OnChangeTheme,
  RenderResultSheet,
  SheetParams,
} from './types';

export default class Aesthetic<Result = ClassName, Block extends object = LocalBlock> {
  protected activeDirection = createState<Direction>();

  protected activeTheme = createState<ThemeName>();

  protected globalSheetRegistry = new Map<ThemeName, GlobalSheet<unknown, Block, Result>>();

  protected listeners = new Map<EventType, Set<EventListener>>();

  protected options: AestheticOptions = {};

  protected styleEngine = createState<Engine<Result>>();

  protected themeRegistry = new ThemeRegistry<Block>();

  constructor(options?: AestheticOptions) {
    if (options) {
      this.configure(options);
    }

    // Must be bound manually because of method overloading
    this.emit = this.emit.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
  }

  /**
   * Change the active direction.
   */
  changeDirection = (direction: Direction, propagate: boolean = true): void => {
    if (direction === this.activeDirection.get()) {
      return;
    }

    const engine = this.getEngine();

    // Set the active direction
    this.activeDirection.set(direction);

    // Update engine direction
    engine.direction = direction;
    engine.setDirection(direction);

    // Let consumers know about the change
    if (propagate) {
      this.emit('change:direction', [direction]);
    }
  };

  /**
   * Change the active theme.
   */
  changeTheme = (name: ThemeName, propagate: boolean = true): void => {
    if (name === this.activeTheme.get()) {
      return;
    }

    const theme = this.getTheme(name);
    const engine = this.getEngine();

    // Set the active theme
    this.activeTheme.set(name);

    // Set root variables
    if (this.options.rootVariables) {
      engine.setRootVariables(theme.toVariables());
    }

    // Render theme styles
    const results = this.renderThemeStyles(theme);

    // Update engine theme
    engine.setTheme(results);

    // Let consumers know about the change
    if (propagate) {
      this.emit('change:theme', [name, results]);
    }
  };

  /**
   * Configure options unique to this instance.
   */
  configure = (customOptions: AestheticOptions): void => {
    Object.assign(this.options, customOptions);

    // Configure the engine with itself to reapply options
    const engine = this.styleEngine.get();

    if (engine) {
      this.configureEngine(engine);
    }
  };

  /**
   * Configuring which styling engine to use.
   */
  configureEngine = (engine: Engine<Result>): void => {
    const { options } = this;

    if (!engine.directionConverter && options.directionConverter) {
      engine.directionConverter = options.directionConverter;
    }

    if (!engine.unitSuffixer && options.defaultUnit) {
      engine.unitSuffixer = options.defaultUnit;
    }

    if (!engine.vendorPrefixer && options.vendorPrefixer) {
      engine.vendorPrefixer = options.vendorPrefixer;
    }

    this.styleEngine.set(engine);
  };

  /**
   * Create a local style sheet for use within components.
   */
  createComponentStyles = <T = unknown>(
    factory: LocalSheetFactory<T, Block>,
  ): LocalSheet<T, Block, Result> => new StyleSheet('local', factory);

  /**
   * Create a global style sheet for root theme styles.
   */
  createThemeStyles = <T = unknown>(
    factory: GlobalSheetFactory<T, Block>,
  ): GlobalSheet<T, Block, Result> => new StyleSheet('global', factory);

  /**
   * Emit all listeners by type, with the defined arguments.
   */
  emit(type: 'change:direction', args: Parameters<OnChangeDirection>): void;
  emit(type: 'change:theme', args: Parameters<OnChangeTheme>): void;
  emit(type: EventType, args: unknown[]): void {
    this.getListeners(type).forEach((listener) => {
      listener(...args);
    });
  }

  /**
   * Generate a class name using the selectors of a style sheet.
   * If an object is provided, it will be used to check for variants.
   */
  generateClassName = <T extends string>(
    keys: T[],
    variants: string[],
    classNames: RenderResultSheet<ClassName>,
  ): ClassName => {
    let className = '';

    arrayLoop(keys, (key) => {
      const hash = classNames[key];

      if (!hash) {
        return;
      }

      if (hash.result) {
        className += ' ';
        className += hash.result;
      }

      if (hash.variants) {
        arrayLoop(variants, (variant) => {
          if (hash.variants?.[variant]) {
            className += ' ';
            className += hash.variants[variant];
          }
        });
      }
    });

    return className.trim();
  };

  /**
   * Return the active direction for the entire application. If an active direction is undefined,
   * it will be detected from the browser's `dir` attribute.
   */
  getActiveDirection = (): Direction => {
    const active = this.activeDirection.get();

    if (active) {
      return active;
    }

    // Detect theme from engine
    const direction: Direction = this.getEngine().direction || 'ltr';

    this.changeDirection(direction);

    return direction;
  };

  /**
   * Return the currently active theme instance. If an active instance has not been defined,
   * one will be detected from the client's browser preferences.
   */
  getActiveTheme = (): Theme<Block> => {
    const active = this.activeTheme.get();

    if (active) {
      return this.getTheme(active);
    }

    // Detect theme from browser preferences
    const engine = this.getEngine();
    const theme = this.themeRegistry.getPreferredTheme({
      matchColorScheme: engine.prefersColorScheme,
      matchContrastLevel: engine.prefersContrastLevel,
    });

    this.changeTheme(theme.name);

    return theme;
  };

  /**
   * Return the current style engine.
   */
  getEngine = (): Engine<Result> => {
    const current = global.AESTHETIC_CUSTOM_ENGINE || this.styleEngine.get();

    if (current) {
      return current;
    }

    throw new Error('No style engine defined. Have you configured one with `configureEngine()`?');
  };

  /**
   * Return a set of listeners, or create it if it does not exist.
   */
  getListeners = <T extends Function>(type: EventType): Set<T> => {
    const set = this.listeners.get(type) || new Set();

    this.listeners.set(type, set);

    return (set as unknown) as Set<T>;
  };

  /**
   * Return a theme instance by name.
   */
  getTheme = (name: ThemeName): Theme<Block> => this.themeRegistry.getTheme(name);

  /**
   * Register a theme, with optional global theme styles.
   */
  registerTheme = (
    name: ThemeName,
    theme: Theme<Block>,
    sheet: GlobalSheet<unknown, Block, Result> | null = null,
    isDefault: boolean = false,
  ): void => {
    this.themeRegistry.register(name, theme, isDefault);

    if (sheet) {
      if (__DEV__) {
        if (!(sheet instanceof StyleSheet) || sheet.type !== 'global') {
          throw new TypeError('Rendering theme styles require a `GlobalSheet` instance.');
        }
      }

      this.globalSheetRegistry.set(name, sheet);
    }
  };

  /**
   * Register a default light or dark theme, with optional global theme styles.
   */
  registerDefaultTheme = (
    name: ThemeName,
    theme: Theme<Block>,
    sheet: GlobalSheet<unknown, Block, Result> | null = null,
  ): void => {
    this.registerTheme(name, theme, sheet, true);
  };

  /**
   * Render a component style sheet to the document with the defined style query parameters.
   */
  renderComponentStyles = <T = unknown>(
    sheet: LocalSheet<T, Block, Result>,
    themeName?: ThemeName,
  ) => {
    if (__DEV__) {
      if (!(sheet instanceof StyleSheet) || sheet.type !== 'local') {
        throw new TypeError('Rendering component styles require a `LocalSheet` instance.');
      }
    }

    const theme = themeName ? this.getTheme(themeName) : this.getActiveTheme();

    return sheet.render(this.getEngine(), theme, {
      customProperties: this.options.customProperties,
      deterministic: this.options.deterministicClasses,
      direction: this.getActiveDirection(),
      vendor: !!this.options.vendorPrefixer,
    });
  };

  /**
   * Render a `@font-face` to the global style sheet and return the font family name.
   */
  renderFontFace = (
    fontFace: FontFace | SSSFontFace,
    fontFamily?: string,
    params?: RenderOptions,
  ): string =>
    this.getEngine().renderFontFace(
      formatFontFace({
        fontFamily,
        ...fontFace,
      }) as FontFace,
      params,
    );

  /**
   * Render an `@import` to the global style sheet and return the import path.
   */
  renderImport = (path: string, params?: RenderOptions): string =>
    this.getEngine().renderImport(path, params);

  /**
   * Render a `@keyframes` to the global style sheet and return the animation name.
   */
  renderKeyframes = (
    keyframes: Keyframes,
    animationName?: string,
    params?: RenderOptions,
  ): string => this.getEngine().renderKeyframes(keyframes, animationName, params);

  /**
   * Render a global theme style sheet and return a result, if one was generated.
   */
  renderThemeStyles = (theme: Theme<Block>, params: SheetParams = {}): Result[] => {
    const sheet = this.globalSheetRegistry.get(theme.name);
    const results: Result[] = [];

    // Render theme CSS variables
    if (isDOM()) {
      results.push(this.getEngine().renderRuleGrouped(theme.toVariables(), { type: 'global' }));
    }

    // Render theme styles
    if (sheet) {
      const result = sheet.render(this.getEngine(), theme, {
        customProperties: this.options.customProperties,
        direction: this.getActiveDirection(),
        vendor: !!this.options.vendorPrefixer,
        ...params,
      })['@root']?.result;

      if (result) {
        results.push(result);
      }
    }

    return results;
  };

  /**
   * Subscribe and listen to an event by name.
   */
  subscribe(type: 'change:direction', listener: OnChangeDirection): () => void;
  subscribe(type: 'change:theme', listener: OnChangeTheme): () => void;
  subscribe(type: EventType, listener: Function): () => void {
    this.getListeners(type).add(listener);

    return () => {
      this.unsubscribe(type as 'change:theme', listener as OnChangeTheme);
    };
  }

  /**
   * Unsubscribe from an event by name.
   */
  unsubscribe(type: 'change:direction', listener: OnChangeDirection): void;
  unsubscribe(type: 'change:theme', listener: OnChangeTheme): void;
  unsubscribe(type: EventType, listener: Function): void {
    this.getListeners(type).delete(listener);
  }
}
