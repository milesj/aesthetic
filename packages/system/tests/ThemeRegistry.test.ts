import { Rule } from '@aesthetic/types';
import { Theme, ThemeRegistry } from '../src';
import { darkTheme, lightTheme } from '../src/test';

describe('ThemeRegistry', () => {
	let registry: ThemeRegistry<Rule>;
	let mediaMocks: Record<string, boolean> = {};

	const matchColorScheme = (query: string) =>
		mediaMocks[`(prefers-color-scheme: ${query})`] || false;

	const matchContrastLevel = (query: string) => mediaMocks[`(prefers-contrast: ${query})`] || false;

	beforeEach(() => {
		registry = new ThemeRegistry();
		registry.register('day', lightTheme, true);
		registry.register('night', darkTheme, true);
	});

	afterEach(() => {
		lightTheme.name = '';
		darkTheme.name = '';
		mediaMocks = {};
	});

	describe('getDarkTheme()', () => {
		it('returns the default dark theme', () => {
			expect(registry.getDarkTheme()).toBe(darkTheme);
		});
	});

	describe('getLightTheme()', () => {
		it('returns the default light theme', () => {
			expect(registry.getLightTheme()).toBe(lightTheme);
		});
	});

	describe('getPreferredTheme()', () => {
		let highTheme: Theme<Rule>;
		let lowTheme: Theme<Rule>;

		beforeEach(() => {
			highTheme = darkTheme.extend({}, { contrast: 'high' });
			lowTheme = darkTheme.extend({}, { contrast: 'low' });

			registry.register('night-high', highTheme);
			registry.register('night-low', lowTheme);
		});

		it('errors if no themes', () => {
			registry = new ThemeRegistry();

			expect(() => {
				registry.getPreferredTheme({
					matchColorScheme,
					matchContrastLevel,
				});
			}).toThrow('No themes have been registered.');
		});

		it('returns 1st registered default theme if no media matches', () => {
			expect(
				registry.getPreferredTheme({
					matchColorScheme,
					matchContrastLevel,
				}),
			).toBe(lightTheme);
		});

		it('returns dark theme if media matches', () => {
			mediaMocks['(prefers-color-scheme: dark)'] = true;
			mediaMocks['(prefers-color-scheme: light)'] = false;

			expect(
				registry.getPreferredTheme({
					matchColorScheme,
					matchContrastLevel,
				}),
			).toBe(darkTheme);
		});

		it('returns light theme if media matches', () => {
			mediaMocks['(prefers-color-scheme: light)'] = true;
			mediaMocks['(prefers-color-scheme: dark)'] = false;

			expect(
				registry.getPreferredTheme({
					matchColorScheme,
					matchContrastLevel,
				}),
			).toBe(lightTheme);
		});

		it('returns a dark high contrast theme if media matches', () => {
			mediaMocks['(prefers-color-scheme: dark)'] = true;
			mediaMocks['(prefers-contrast: high)'] = true;

			expect(
				registry.getPreferredTheme({
					matchColorScheme,
					matchContrastLevel,
				}),
			).toBe(highTheme);
		});

		it('returns a dark low contrast theme if media matches', () => {
			mediaMocks['(prefers-color-scheme: dark)'] = true;
			mediaMocks['(prefers-contrast: low)'] = true;

			expect(
				registry.getPreferredTheme({
					matchColorScheme,
					matchContrastLevel,
				}),
			).toBe(lowTheme);
		});

		it('returns a light theme if media doesnt match', () => {
			mediaMocks['(prefers-contrast: low)'] = true;

			expect(
				registry.getPreferredTheme({
					matchColorScheme,
					matchContrastLevel,
				}),
			).toBe(lightTheme);
		});
	});

	describe('getTheme()', () => {
		it('errors if no name or empty name', () => {
			expect(() => {
				registry.getTheme('');
			}).toThrow('Cannot find a theme without a name.');
		});

		it('errors for a missing theme', () => {
			expect(() => {
				registry.getTheme('dusk');
			}).toThrow('Theme "dusk" does not exist. Has it been registered?');
		});

		it('returns the theme', () => {
			expect(registry.getTheme('day')).toBe(lightTheme);
		});
	});

	describe('register()', () => {
		it('errors if not a theme instance', () => {
			expect(() => {
				registry.register(
					'test',
					// @ts-expect-error Invalid type
					{},
				);
			}).toThrow('Only a `Theme` object can be registered.');
		});

		it('errors if trying to register an already registered theme', () => {
			expect(() => {
				registry.register('dayer', lightTheme);
			}).toThrow('Theme "dayer" has already been registered under "day".');
		});

		it('sets the name on the theme', () => {
			expect(lightTheme.name).toBe('day');
			expect(darkTheme.name).toBe('night');
		});
	});

	describe('reset()', () => {
		it('resets to initial state', () => {
			registry.reset();

			expect(() => {
				registry.getDarkTheme();
				// eslint-disable-next-line jest/require-to-throw-message
			}).toThrow();
		});
	});
});
