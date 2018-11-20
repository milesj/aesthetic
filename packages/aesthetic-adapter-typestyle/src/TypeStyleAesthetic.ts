/**
 * @copyright   2017, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import Aesthetic, { AestheticOptions, ClassName, Keyframes, Ruleset, Sheet } from 'aesthetic';
import { TypeStyle } from 'typestyle';
import { NativeBlock, ParsedBlock } from './types';

export default class TypeStyleAesthetic<Theme> extends Aesthetic<Theme, NativeBlock, ParsedBlock> {
  typeStyle: TypeStyle;

  keyframes: { [animationName: string]: ClassName } = {};

  constructor(typeStyle?: TypeStyle, options: Partial<AestheticOptions> = {}) {
    super(options);

    this.typeStyle = typeStyle || new TypeStyle({ autoGenerateTag: true });

    this.syntax
      .on('attribute', this.handleNested)
      .on('fallback', this.handleFallback)
      .on('font-face', this.handleFontFace)
      .on('global', this.handleGlobal)
      .on('keyframe', this.handleKeyframe)
      .on('media', this.handleMedia)
      .on('property', this.handleProperty)
      .on('pseudo', this.handleNested)
      .on('selector', this.handleNested)
      .on('support', this.handleSupport);
  }

  protected transformToClassName(styles: (NativeBlock | ParsedBlock)[]): ClassName {
    return this.typeStyle.style(...styles);
  }

  // https://typestyle.github.io/#/core/concept-fallbacks
  private handleFallback = (
    ruleset: Ruleset<NativeBlock>,
    name: keyof NativeBlock,
    value: any[],
  ) => {
    let fallbacks: any = ruleset.properties[name] || [];

    if (!Array.isArray(fallbacks)) {
      fallbacks = [fallbacks];
    }

    ruleset.addProperty(name, [...value, ...fallbacks]);
  };

  // https://typestyle.github.io/#/raw/fontface
  private handleFontFace = (sheet: Sheet<NativeBlock>, fontFaces: NativeBlock[]) => {
    fontFaces.map(face => this.typeStyle.fontFace(face));
  };

  // https://typestyle.github.io/#/raw/cssrule
  private handleGlobal = (
    sheet: Sheet<NativeBlock>,
    selector: string,
    ruleset: Ruleset<NativeBlock>,
  ) => {
    this.typeStyle.cssRule(selector, ruleset.toObject());
  };

  // https://typestyle.github.io/#/core/concept-keyframes
  private handleKeyframe = (
    sheet: Sheet<NativeBlock>,
    keyframes: Keyframes<NativeBlock>,
    animationName: string,
  ) => {
    this.keyframes[animationName] = this.typeStyle.keyframes(keyframes);
  };

  // https://typestyle.github.io/#/core/concept-media-queries
  private handleMedia = (
    ruleset: Ruleset<NativeBlock>,
    query: string,
    value: Ruleset<NativeBlock>,
  ) => {
    this.handleNested(ruleset, `@media ${query}`, value);
  };

  // https://typestyle.github.io/#/core/concept-interpolation
  private handleNested = (
    ruleset: Ruleset<NativeBlock>,
    selector: string,
    value: Ruleset<NativeBlock>,
  ) => {
    const nest = ruleset.nested['$nest'] || ruleset.createRuleset('$nest');

    nest.addNested(selector.startsWith('@') ? selector : `&${selector}`, value);

    ruleset.addNested('$nest', nest);
  };

  // https://typestyle.github.io/#/core
  private handleProperty = (ruleset: Ruleset<NativeBlock>, name: keyof NativeBlock, value: any) => {
    if (name === 'animationName') {
      ruleset.addProperty(name, this.syntax.injectKeyframes(value, this.keyframes).join(', '));
    } else {
      ruleset.addProperty(name, value);
    }
  };

  // https://typestyle.github.io/#/core/concept-media-queries
  private handleSupport = (
    ruleset: Ruleset<NativeBlock>,
    query: string,
    value: Ruleset<NativeBlock>,
  ) => {
    this.handleNested(ruleset, `@supports ${query}`, value);
  };
}