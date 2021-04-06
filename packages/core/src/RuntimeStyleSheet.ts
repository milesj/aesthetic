import { Theme } from '@aesthetic/system';
import { ClassName, Direction, Engine } from '@aesthetic/types';
import { createCacheKey, createDefaultParams } from './helpers';
import StyleSheet from './StyleSheet';
import {
  BaseSheetFactory,
  CompiledClassMap,
  CompiledRenderResultSheet,
  RenderResult,
  RenderResultSheet,
  SheetParams,
  SheetParamsExtended,
} from './types';

const noop: BaseSheetFactory = () => ({});

export default class RuntimeStyleSheet extends StyleSheet<ClassName, BaseSheetFactory> {
  // Pre-compiled result injected from the Babel plugin
  protected compiled: CompiledRenderResultSheet;

  constructor(type: 'global' | 'local', compiled: CompiledRenderResultSheet) {
    super(type, noop);

    this.compiled = compiled;
  }

  render(
    engine: Engine<ClassName>,
    theme: Theme<{}>,
    baseParams: SheetParamsExtended,
  ): RenderResultSheet<ClassName> {
    const params = createDefaultParams(theme, baseParams);
    const key = createCacheKey(params, this.type);
    const cache = this.renderCache[key];

    if (cache) {
      return cache;
    }

    const resultSheet: RenderResultSheet<ClassName> = {};

    Object.entries(this.compiled).forEach(([selector, compiledResult]) => {
      const result: RenderResult<ClassName> = {};

      if (typeof compiledResult === 'string' || Array.isArray(compiledResult)) {
        result.result = this.determineClassName(compiledResult, params.direction);

        return;
      }

      if (compiledResult.result) {
        result.result = this.extractClassName(compiledResult.result, params);
      }

      if (compiledResult.variants) {
        result.variants = {};

        Object.entries(compiledResult.variants).forEach(([type, variantMap]) => {
          result.variants![type] = this.extractClassName(variantMap, params);
        });
      }

      if (compiledResult.variantTypes) {
        result.variantTypes = new Set(compiledResult.variantTypes);
      }

      resultSheet[selector] = result;
    });

    this.renderCache[key] = resultSheet;

    return resultSheet;
  }

  protected determineClassName(className: ClassName | ClassName[], direction: Direction) {
    if (Array.isArray(className)) {
      const [neutral, ltr = '', rtl = ''] = className;

      return `${neutral} ${direction === 'rtl' ? rtl : ltr}`;
    }

    return className.trim();
  }

  protected extractClassName(
    map: ClassName | CompiledClassMap,
    params: Required<SheetParams>,
  ): ClassName {
    if (typeof map === 'string') {
      return map;
    }

    let className = this.determineClassName(map._, params.direction);
    className += ' ';
    className += this.determineClassName(map[params.theme], params.direction);

    return className.trim();
  }
}
