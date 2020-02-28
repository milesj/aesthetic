import Adapter from './Adapter';
import { ClassName, SheetMap } from './types';

export default class TestAdapter extends Adapter<{}, string> {
  isParsedBlock(block: unknown): block is string {
    return typeof block === 'string';
  }

  parseStyleSheet(styleSheet: SheetMap<{}>): SheetMap<string> {
    return Object.keys(styleSheet).reduce(
      (obj, key) => ({
        ...obj,
        [key]: key,
      }),
      {},
    );
  }

  transformToClassName(styles: string[]): ClassName {
    return styles.filter(style => style && typeof style === 'string').join(' ');
  }
}