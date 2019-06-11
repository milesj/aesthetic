import deepMerge from 'extend';
import uuid from 'uuid/v4';
import { isObject, stripClassPrefix } from 'aesthetic-utils';
import Sheet from './Sheet';
import StyleSheetManager from './StyleSheetManager';
import UnifiedSyntax from './UnifiedSyntax';
import {
  ClassName,
  GlobalSheetDefinition,
  TransformOptions,
  SheetMap,
  StyleName,
  StyleSheet,
  StyleSheetDefinition,
  ThemeName,
} from './types';

export interface AestheticOptions {
  cxPropName: string;
  extendable: boolean;
  passThemeProp: boolean;
  pure: boolean;
  rtl: boolean;
  stylesPropName: string;
  theme: ThemeName;
  themePropName: string;
}

export default abstract class Aesthetic<
  Theme extends object,
  NativeBlock extends object,
  ParsedBlock extends object | string = NativeBlock
> {
  cache: { [styleName: string]: SheetMap<ParsedBlock> } = {};

  globals: { [themeName: string]: GlobalSheetDefinition<Theme, any> } = {};

  options: AestheticOptions;

  parents: { [childStyleName: string]: StyleName } = {};

  styles: { [styleName: string]: StyleSheetDefinition<Theme, any> } = {};

  syntax: UnifiedSyntax<NativeBlock>;

  themes: { [themeName: string]: Theme } = {};

  protected appliedGlobals: boolean = false;

  protected sheetManager: StyleSheetManager | null = null;

  constructor(options: Partial<AestheticOptions> = {}) {
    this.options = {
      cxPropName: 'cx',
      extendable: false,
      passThemeProp: false,
      pure: true,
      rtl: false,
      stylesPropName: 'styles',
      theme: 'default',
      themePropName: 'theme',
      ...options,
    };

    this.syntax = new UnifiedSyntax();

    // Templates may be generated by Webpack or something similar,
    // so set this programmatically based on the defined option.
    document.documentElement.setAttribute('dir', this.options.rtl ? 'rtl' : 'ltr');
  }

  /**
   * Apply and inject global styles for the current theme.
   * This should only happen once!
   */
  applyGlobalStyles(baseOptions?: TransformOptions): this {
    if (this.appliedGlobals) {
      return this;
    }

    const options = this.getDefaultTransformOptions(baseOptions);
    const globalDef = this.globals[this.options.theme];
    const globalSheet = globalDef ? globalDef(this.getTheme()) : null;

    if (globalSheet) {
      const sheet = this.parseStyleSheet(
        this.syntax.convertGlobalSheet(globalSheet, options).toObject(),
        ':root',
      );

      // Some adapters require the styles to be transformed to be flushed
      this.transformStyles(Object.values(sheet), options);
    }

    this.appliedGlobals = true;
    this.flushStyles(':root');

    return this;
  }

  /**
   * Change the current theme to another registered theme.
   * This requires all flushed styles to be purged, and for new styles
   * to be regenerated.
   */
  changeTheme(themeName: ThemeName): this {
    // Set theme as new option
    this.getTheme(themeName);
    this.options.theme = themeName;

    // Remove flushed styles
    this.purgeStyles();
    this.getStyleSheetManager().purgeStyles();

    // Clear caches
    this.cache = {};
    this.appliedGlobals = false;

    // Generate new global styles
    this.applyGlobalStyles({
      rtl: this.options.rtl,
    });

    return this;
  }

  /**
   * Create and return a style sheet unique to an adapter.
   */
  createStyleSheet(styleName: StyleName, baseOptions?: TransformOptions): SheetMap<ParsedBlock> {
    if (this.cache[styleName]) {
      return this.cache[styleName];
    }

    // Apply global styles on first render
    this.applyGlobalStyles(baseOptions);

    const options = this.getDefaultTransformOptions(baseOptions);
    const nativeSheet = this.syntax.convertStyleSheet(this.getStyleSheet(styleName), {
      ...options,
      name: styleName,
    });
    const parsedSheet = this.parseStyleSheet(nativeSheet.toObject(), styleName);

    this.cache[styleName] = {
      ...parsedSheet,
      ...nativeSheet.classNames,
    } as SheetMap<ParsedBlock>;

    return this.cache[styleName];
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
   * Flush transformed styles and inject them into the DOM.
   */
  flushStyles(styleName: StyleName) {}

  /**
   * Retrieve the defined component style sheet. If the definition is a function,
   * execute it while passing the current theme.
   */
  getStyleSheet(styleName: StyleName): StyleSheet {
    const parentStyleName = this.parents[styleName];
    const styleDef = this.styles[styleName];
    const styleSheet = styleDef(this.getTheme());

    // Merge from parent
    if (parentStyleName) {
      return deepMerge(true, {}, this.getStyleSheet(parentStyleName), styleSheet);
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
   * Purge and remove all flushed styles from the DOM.
   * If no name is provided, purge all transformed styles.
   */
  purgeStyles() {}

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

    this.styles[styleName] = this.validateDefinition(styleName, styleSheet, this.styles);

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
    this.globals[themeName] = this.validateDefinition(themeName, globalSheet, this.globals);

    return this;
  }

  /**
   * Transform the list of style objects to a list of CSS class names.
   */
  transformStyles(
    styles: (undefined | false | ClassName | NativeBlock | ParsedBlock)[],
    baseOptions?: TransformOptions,
  ): ClassName {
    const options = this.getDefaultTransformOptions(baseOptions);
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
  protected getDefaultTransformOptions(baseOptions: TransformOptions = {}): TransformOptions {
    return {
      rtl: typeof baseOptions.rtl === 'undefined' ? this.options.rtl : baseOptions.rtl,
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
  private validateDefinition<T>(key: string, value: T, cache: { [key: string]: T }): T {
    if (__DEV__) {
      if (cache[key]) {
        throw new Error(`Styles have already been defined for "${key}".`);
      } else if (value !== null && typeof value !== 'function') {
        throw new TypeError(`Definition for "${key}" must be null or a function.`);
      }
    }

    return value;
  }
}
