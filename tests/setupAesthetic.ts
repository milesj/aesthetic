import { darkTheme, lightTheme } from '@aesthetic/core/test';
// eslint-disable-next-line import/no-extraneous-dependencies
import { configure, registerDefaultTheme, registerTheme } from '@aesthetic/local';

configure({
  deterministicClasses: true,
});

registerDefaultTheme('light', lightTheme);
registerTheme('dark', darkTheme);
