import deepMerge from 'extend';
import uuid from 'uuid/v4';
import { isObject, stripClassPrefix } from 'aesthetic-utils';
import CacheManager from './CacheManager';
import Sheet from './Sheet';
import StyleSheetManager from './StyleSheetManager';
import UnifiedSyntax from './UnifiedSyntax';
import { GLOBAL_STYLE_NAME } from './constants';
import {
  AestheticOptions,
  ClassName,
  GlobalSheetDefinition,
  TransformOptions,
  SheetMap,
  StyleName,
  StyleSheet,
  StyleSheetDefinition,
  ThemeName,
} from './types';

export default abstract class Aesthetic<
  Theme extends object,
  NativeBlock extends object,
  ParsedBlock extends object | string = NativeBlock
> {
  globals: { [themeName: string]: GlobalSheetDefinition<Theme, any> } = {};

  options: AestheticOptions;

  parents: { [childStyleName: string]: StyleName } = {};

  styles: { [styleName: string]: StyleSheetDefinition<Theme, any> } = {};

  syntax = new UnifiedSyntax<NativeBlock>();

  themes: { [themeName: string]: Theme } = {};

  protected cacheManager = new CacheManager<SheetMap<ParsedBlock>>();

  protected sheetManager: StyleSheetManager | null = null;

  constructor(options: Partial<AestheticOptions> = {}) {
    this.options = {
      cxPropName: 'cx',
      extendable: false,
      passThemeProp: false,
      rtl: false,
      stylesPropName: 'styles',
      theme: 'default',
      themePropName: 'theme',
      ...options,
    };
  }

  /**
   * Apply and inject global styles for the current theme.
   * This should only happen once!
   */
  applyGlobalStyles(baseOptions?: TransformOptions): this {
    // Templates may be generated by Webpack or something similar,
    // so set this programmatically based on the defined option.
    document.documentElement.setAttribute('dir', this.options.rtl ? 'rtl' : 'ltr');

    const options = this.getPreparedTransformOptions({
      ...baseOptions,
      global: true,
      name: GLOBAL_STYLE_NAME,
    });

    // Direction changes shouldn't regenerate global styles
    delete options.dir;

    const cache = this.cacheManager.get(GLOBAL_STYLE_NAME, options);
    const globalDef = this.globals[options.theme];

    if (cache || !globalDef) {
      return this;
    }

    const globalSheet = globalDef(this.getTheme(options.theme));
    const parsedSheet = this.cacheManager.set(
      GLOBAL_STYLE_NAME,
      this.parseStyleSheet(
        this.syntax.convertGlobalSheet(globalSheet, options).toObject(),
        GLOBAL_STYLE_NAME,
      ),
      options,
    );

    // Some adapters require the styles to be transformed to be flushed
    this.transformStyles(Object.values(parsedSheet), options);
    this.flushStyles(GLOBAL_STYLE_NAME);

    return this;
  }

  /**
   * Change the current theme to another registered theme.
   * This will purge all flushed global styles and regenerate new ones.
   */
  changeTheme(themeName: ThemeName): this {
    const oldTheme = this.options.theme;

    // Set theme as new option
    this.getTheme(themeName);
    this.options.theme = themeName;

    // Purge previous global styles
    this.purgeStyles(GLOBAL_STYLE_NAME);
    this.cacheManager.clear(unit => !!unit.global && unit.theme === oldTheme);

    // Generate new global styles
    this.applyGlobalStyles({ theme: themeName });

    return this;
  }

  /**
   * Create and return a style sheet unique to an adapter.
   */
  createStyleSheet(styleName: StyleName, baseOptions?: TransformOptions): SheetMap<ParsedBlock> {
    const options = this.getPreparedTransformOptions(baseOptions);
    const cache = this.cacheManager.get(styleName, options);

    if (cache) {
      return cache;
    }

    // Apply global styles on first render
    this.applyGlobalStyles(baseOptions);

    const nativeSheet = this.syntax.convertStyleSheet(
      this.getStyleSheet(styleName, options.theme),
      {
        ...options,
        name: styleName,
      },
    );

    const parsedSheet = this.parseStyleSheet(nativeSheet.toObject(), styleName);

    return this.cacheManager.set(
      styleName,
      {
        ...parsedSheet,
        ...nativeSheet.classNames,
      } as SheetMap<ParsedBlock>,
      options,
    );
  }

  /**
   * Compose and extend multiple style sheets to create 1 style sheet.
   */
  extendStyles(
    ...styleSheets: StyleSheetDefinition<Theme, any>[]
  ): StyleSheetDefinition<Theme, any> {
    return (theme: Theme) => {
      const sheets = styleSheets.map(sheet => sheet(theme));

      return deepMerge(true, {}, ...sheets);
    };
  }

  /**
   * Register a theme by extending and merging with a previously defined theme.
   */
  extendTheme<T>(
    themeName: ThemeName,
    parentThemeName: ThemeName,
    theme: Partial<Theme>,
    globalSheet: GlobalSheetDefinition<Theme, T> = null,
  ): this {
    return this.registerTheme(
      themeName,
      deepMerge(true, {}, this.getTheme(parentThemeName), theme),
      globalSheet || this.globals[parentThemeName],
    );
  }

  /**
   * Flush a target component's transformed styles and inject them into the DOM.
   * If no target defined, will flush all buffered styles.
   */
  flushStyles(styleName?: StyleName) {}

  /**
   * Retrieve the component style sheet for the defined theme.
   * If the definition is a function, execute it while passing the current theme.
   */
  getStyleSheet(styleName: StyleName, themeName: ThemeName): StyleSheet {
    const parentStyleName = this.parents[styleName];
    const styleDef = this.styles[styleName];
    const styleSheet = styleDef(this.getTheme(themeName || this.options.theme));

    // Merge from parent
    if (parentStyleName) {
      return deepMerge(true, {}, this.getStyleSheet(parentStyleName, themeName), styleSheet);
    }

    return styleSheet;
  }

  /**
   * Return a theme object or throw an error.
   */
  getTheme(name?: ThemeName): Theme {
    const themeName = name || this.options.theme;
    const theme = this.themes[themeName];

    if (__DEV__) {
      if (!theme || !isObject(theme)) {
        throw new Error(`Theme "${themeName}" does not exist.`);
      }
    }

    return theme;
  }

  /**
   * Return true if the style object is a parsed block and not a native block.
   */
  isParsedBlock(block: NativeBlock | ParsedBlock): block is ParsedBlock {
    return isObject(block);
  }

  /**
   * Parse an Aesthetic style sheet into an adapter native style sheet.
   */
  parseStyleSheet(styleSheet: SheetMap<NativeBlock>, styleName: StyleName): SheetMap<ParsedBlock> {
    // @ts-ignore Allow spread
    return { ...styleSheet };
  }

  /**
   * Purge and remove all styles from the DOM for the target component.
   * If no target defined, will purge all possible styles.
   */
  purgeStyles(styleName?: StyleName) {}

  /**
   * Register a style sheet definition. Optionally extend from a parent style sheet if defined.
   */
  registerStyleSheet<T>(
    styleName: StyleName,
    styleSheet: StyleSheetDefinition<Theme, T>,
    extendFrom?: StyleName,
  ): this {
    if (extendFrom) {
      if (__DEV__) {
        if (!this.styles[extendFrom]) {
          throw new Error(`Cannot extend from "${extendFrom}" as those styles do not exist.`);
        } else if (extendFrom === styleName) {
          throw new Error('Cannot extend styles from itself.');
        }
      }

      this.parents[styleName] = extendFrom;
    }

    this.styles[styleName] = this.validateDefinition(styleName, styleSheet);

    return this;
  }

  /**
   * Register a theme with a set of parameters. Optionally register
   * a global style sheet to apply to the entire document.
   */
  registerTheme<T>(
    themeName: ThemeName,
    theme: Theme,
    globalSheet: GlobalSheetDefinition<Theme, T> = null,
  ): this {
    if (__DEV__) {
      if (this.themes[themeName]) {
        throw new Error(`Theme "${themeName}" already exists.`);
      } else if (!isObject(theme)) {
        throw new TypeError(`Theme "${themeName}" must be a style object.`);
      }
    }

    this.themes[themeName] = theme;
    this.globals[themeName] = this.validateDefinition(themeName, globalSheet);

    return this;
  }

  /**
   * Transform the list of style objects to a list of CSS class names.
   */
  transformStyles(
    styles: (undefined | false | ClassName | NativeBlock | ParsedBlock)[],
    baseOptions?: TransformOptions,
  ): ClassName {
    const options = this.getPreparedTransformOptions(baseOptions);
    const classNames: ClassName[] = [];
    const nativeBlocks: NativeBlock[] = [];
    const parsedBlocks: ParsedBlock[] = [];
    let inlineName = '';

    styles.forEach(style => {
      if (!style) {
        return;
      }

      if (typeof style === 'string') {
        classNames.push(
          ...String(style)
            .split(' ')
            .map(s => stripClassPrefix(s).trim()),
        );
      } else if (isObject(style)) {
        if (this.isParsedBlock(style)) {
          parsedBlocks.push(style);
        } else {
          nativeBlocks.push(style);
        }
      } else if (__DEV__) {
        throw new Error('Unsupported style type to transform.');
      }
    });

    // Convert native blocks to parsed blocks
    if (nativeBlocks.length > 0) {
      const nativeSheet: Sheet<NativeBlock> = new Sheet(options);
      let counter = 0;
      inlineName = uuid();

      nativeBlocks.forEach(block => {
        nativeSheet.addRuleset(nativeSheet.createRuleset(`inline-${counter}`).addProperties(block));
        counter += 1;
      });

      parsedBlocks.push(...Object.values(this.parseStyleSheet(nativeSheet.toObject(), inlineName)));
    }

    // Transform parsed blocks to class names
    if (parsedBlocks.length > 0) {
      classNames.push(this.transformToClassName(parsedBlocks));
    }

    // Flush styles immediately since they're being rendered
    if (inlineName) {
      this.flushStyles(inlineName);
    }

    return classNames.join(' ').trim();
  }

  /**
   * Transform the parsed style objects into CSS class names.
   */
  abstract transformToClassName(styles: ParsedBlock[]): ClassName;

  /**
   * Return transform options with defaults applied.
   */
  protected getPreparedTransformOptions(
    baseOptions: TransformOptions = {},
  ): Required<TransformOptions> {
    const dir = this.options.rtl ? 'rtl' : 'ltr';

    return {
      dir: baseOptions.dir || dir,
      global: false,
      name: '',
      theme: baseOptions.theme || this.options.theme,
    };
  }

  /**
   * Return a native style sheet manager used for injecting CSS.
   */
  protected getStyleSheetManager(): StyleSheetManager {
    if (this.sheetManager) {
      return this.sheetManager;
    }

    this.sheetManager = new StyleSheetManager();

    return this.sheetManager;
  }

  /**
   * Validate a style sheet or theme definition.
   */
  private validateDefinition<T>(key: string, value: T): T {
    if (__DEV__) {
      if (value !== null && typeof value !== 'function') {
        throw new TypeError(`Definition for "${key}" must be null or a function.`);
      }
    }

    return value;
  }
}
