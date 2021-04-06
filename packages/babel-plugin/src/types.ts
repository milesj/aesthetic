import type {
  Aesthetic,
  ClassName,
  CompiledClassMap,
  CompiledRenderResult,
  LocalSheet,
  SheetParams,
} from '@aesthetic/core';
import { BabelFile } from '@babel/core';
import { Path } from '@boost/common';

export type UnknownAesthetic = Aesthetic<ClassName, {}>;

export type UnknownLocalSheet = LocalSheet<unknown, {}, ClassName>;

// STYLE SHEET

export interface RenderResultInput {
  result: CompiledClassMap;
  variants: Record<string, CompiledClassMap>;
  variantTypes: Set<string>;
}

export type RenderResultInputSheet = Record<string, RenderResultInput>;

export type RenderResultOutput = CompiledRenderResult;

// PLUGIN

export interface State {
  aesthetic: UnknownAesthetic;
  filePath: Path;
  integrationModule: string;
  hasRemovedIntegration?: boolean;
  hasRuntimeImport?: boolean;
  renderParamsList: SheetParams[];
  styleFactories: Record<string, string>;
  // Babel
  cwd: string;
  filename: string;
  file: Omit<BabelFile, 'metadata'> & {
    metadata: {
      aesthetic?: {
        renderResult: RenderResultInputSheet;
      };
    };
  };
}

export interface Options {
  setupPath: string;
}
