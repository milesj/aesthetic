// eslint-disable-next-line import/no-unresolved
import CSS from 'csstype';

export type ClassName = string;

export type Value = string | number;

export type Properties = CSS.Properties<Value> & CSS.PropertiesHyphen<Value>;

export type Property = keyof Properties;

export type AttributeBlock = {
  [K in CSS.HtmlAttributes]?: Properties;
};

export type PseudoBlock = {
  [K in CSS.SimplePseudos]?: Properties;
};

export type DeclarationBlock = Properties & AttributeBlock & PseudoBlock;

export interface Block extends DeclarationBlock {
  [key: string]: Block | Value | unknown;
}

export type FontFace = Omit<CSS.FontFace, 'fontFamily'> & { fontFamily: string };

export interface Keyframes {
  [percent: string]: Properties | undefined;
  from?: Properties;
  to?: Properties;
}

export type SheetType = 'global' | 'standard' | 'conditions';

export interface Condition {
  query: string;
  type: number;
}

export interface StyleParams {
  className?: ClassName;
  conditions?: Condition[];
  selector?: string;
  type?: SheetType;
}

export interface CacheItem extends Required<StyleParams> {
  className: string;
  rank: number;
}

export interface CacheParams {
  bypassCache?: boolean;
  minimumRank?: number;
}

export interface CSSVariables<T = Value> {
  [key: string]: T;
}

export interface StyleRule {
  conditionText?: string;
  cssRules: StyleRule[];
  cssText: string;
  cssVariables: CSSVariables<string>;
  type: number;
  insertRule(rule: string, index: number): number;
}

export interface ProcessedProperties {
  [key: string]: string | string[];
}

// RENDERER

export interface RendererOptions {
  deterministic?: boolean;
  prefix?: boolean;
  rtl?: boolean;
  unit?: string;
}
