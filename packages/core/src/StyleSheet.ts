import { parse } from '@aesthetic/sss';
import { Theme } from '@aesthetic/system';
import { ColorScheme, ContrastLevel, Engine, Property } from '@aesthetic/types';
import { deepMerge } from '@aesthetic/utils';
import { createCacheKey, createDefaultParams } from './helpers';
import { BaseSheetFactory, RenderResultSheet, SheetParams, SheetParamsExtended } from './types';

export default class StyleSheet<Result, Factory extends BaseSheetFactory> {
  readonly type: 'global' | 'local';

  protected contrastVariants: { [K in ContrastLevel]?: Factory } = {};

  protected factory: Factory;

  protected renderCache: Record<string, RenderResultSheet<Result>> = {};

  protected schemeVariants: { [K in ColorScheme]?: Factory } = {};

  protected themeVariants: Record<string, Factory> = {};

  constructor(type: 'global' | 'local', factory: Factory) {
    this.type = type;
    this.factory = this.validateFactory(factory);
  }

  addColorSchemeVariant(scheme: ColorScheme, factory: Factory): this {
    if (__DEV__) {
      if (this.type !== 'local') {
        throw new Error('Color scheme variants are only supported by local style sheets.');
      }

      if (scheme !== 'light' && scheme !== 'dark') {
        throw new Error('Color scheme variant must be one of "light" or "dark".');
      }
    }

    this.schemeVariants[scheme] = this.validateFactory(factory);

    return this;
  }

  addContrastVariant(contrast: ContrastLevel, factory: Factory): this {
    if (__DEV__) {
      if (this.type !== 'local') {
        throw new Error('Contrast level variants are only supported by local style sheets.');
      }

      if (contrast !== 'normal' && contrast !== 'high' && contrast !== 'low') {
        throw new Error('Contrast level variant must be one of "high", "low", or "normal".');
      }
    }

    this.contrastVariants[contrast] = this.validateFactory(factory);

    return this;
  }

  addThemeVariant(theme: string, factory: Factory): this {
    if (__DEV__) {
      if (this.type !== 'local') {
        throw new Error('Theme variants are only supported by local style sheets.');
      }
    }

    this.themeVariants[theme] = this.validateFactory(factory);

    return this;
  }

  compose(params: SheetParams): Factory {
    if (this.type === 'global') {
      return this.factory;
    }

    const factories = [this.factory];

    if (params.scheme && this.schemeVariants[params.scheme]) {
      factories.push(this.schemeVariants[params.scheme]!);
    }

    if (params.contrast && this.contrastVariants[params.contrast]) {
      factories.push(this.contrastVariants[params.contrast]!);
    }

    if (params.theme && this.themeVariants[params.theme]) {
      factories.push(this.themeVariants[params.theme]!);
    }

    if (factories.length === 1) {
      return factories[0];
    }

    const composer: BaseSheetFactory = (p) => deepMerge(...factories.map((factory) => factory(p)));

    return composer as Factory;
  }

  render(
    engine: Engine<Result>,
    // This is hidden behind abstractions, so is ok
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    theme: Theme<any>,
    { customProperties, ...baseParams }: SheetParamsExtended,
  ): RenderResultSheet<Result> {
    const params = createDefaultParams(theme, baseParams);
    const key = createCacheKey(params, this.type);
    const cache = this.renderCache[key];

    if (cache) {
      return cache;
    }

    const resultSheet: RenderResultSheet<Result> = {};
    const composer = this.compose(params);
    const styles = composer(theme);
    const rankings = {};

    const createResultMetadata = (selector: string) => {
      if (!resultSheet[selector]) {
        resultSheet[selector] = {};
      }

      return resultSheet[selector]!;
    };

    parse(this.type, styles, {
      customProperties,
      onClass: (selector, className) => {
        createResultMetadata(selector).result = (className as unknown) as Result;
      },
      onFontFace: (fontFace) => engine.renderFontFace(fontFace.toObject(), params),
      onImport: (path) => {
        engine.renderImport(path);
      },
      onKeyframes: (keyframes, animationName) =>
        engine.renderKeyframes(keyframes.toObject(), animationName, params),
      onProperty: (block, property, value) => {
        if (engine.atomic) {
          block.addResult(
            engine.renderDeclaration(property as Property, value as string, {
              ...params,
              media: block.media,
              rankings,
              selector: block.selector,
              supports: block.supports,
            }),
          );
        }
      },
      onRoot: (block) => {
        createResultMetadata('@root').result = engine.renderRuleGrouped(block.toObject(), {
          ...params,
          type: 'global',
        });
      },
      onRootVariables: (variables) => {
        engine.setRootVariables(variables);
      },
      onRule: (selector, block) => {
        if (!engine.atomic) {
          block.addResult(engine.renderRule(block.toObject(), params));
        }

        createResultMetadata(selector).result = block.result as Result;
      },
      onVariable: (block, name, value) => {
        if (engine.atomic) {
          block.addResult(engine.renderVariable(name, value));
        }
      },
      onVariant: (parent, type, block) => {
        if (!engine.atomic) {
          block.addResult(engine.renderRule(block.toObject(), params));
        }

        const meta = createResultMetadata(parent.id);

        if (!meta.variants) {
          meta.variants = {};
        }

        if (!meta.variantTypes) {
          meta.variantTypes = new Set();
        }

        meta.variants[type] = block.result as Result;
        meta.variantTypes.add(type.split('_')[0]);
      },
    });

    this.renderCache[key] = resultSheet;

    return resultSheet;
  }

  protected validateFactory(factory: Factory): Factory {
    if (__DEV__) {
      const typeOf = typeof factory;

      if (typeOf !== 'function') {
        throw new TypeError(`A style sheet factory function is required, found "${typeOf}".`);
      }
    }

    return factory;
  }
}
