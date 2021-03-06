import {
	BORDER_SIZES,
	BREAKPOINT_SIZES,
	DEPTHS,
	HEADING_LEVELS,
	HEADING_SIZES,
	SHADE_RANGES,
	SHADOW_SIZES,
	SIZES,
	SPACING_SIZES,
	StateType,
	TEXT_SIZES,
} from '@aesthetic/system';
import { BreakpointListConfig, ScaleType } from './types';

export {
	BORDER_SIZES,
	BREAKPOINT_SIZES,
	DEPTHS,
	HEADING_LEVELS,
	HEADING_SIZES,
	SHADE_RANGES,
	SHADOW_SIZES,
	SIZES,
	SPACING_SIZES,
	TEXT_SIZES,
};

export const CONFIG_FOLDER = '.aesthetic';

export const BRAND_FILE = 'brand.yaml';

export const LANGUAGE_FILE = 'language.yaml';

export const THEMES_FILE = 'themes.yaml';

export const DEFAULT_BREAKPOINTS: BreakpointListConfig = [640, 960, 1280, 1600, 1920];

export const DEFAULT_UNIT = 8;

export const FONT_FAMILIES = {
	'android-monospace': 'monospace',
	'android-system': 'sans-serif',
	'ios-monospace': 'Menlo-Regular',
	'ios-system': 'SF Pro',
	'web-monospace':
		'Menlo, Monaco, Consolas, "Lucida Console", "Liberation Mono", "Courier New", monospace',
	'web-system':
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
};

// https://learnui.design/blog/ultimate-guide-font-sizes-ui-design.html
export const PLATFORM_CONFIGS = {
	android: {
		baseFontSize: 14,
		fontUnit: 'sp',
		spacingUnit: 'dp',
	},
	ios: {
		baseFontSize: 17,
		fontUnit: 'pt',
		spacingUnit: 'pt',
	},
	native: {
		baseFontSize: 16,
		fontUnit: 'px',
		spacingUnit: 'px',
	},
	web: {
		baseFontSize: 16,
		fontUnit: 'px',
		spacingUnit: 'rem',
	},
};

// https://type-scale.com
export const SCALES: { [K in ScaleType]: number } = {
	'augmented-fourth': 1.414,
	'double-octave': 4,
	'golden-ratio': 1.618,
	'golden-section': 1.618,
	'major-second': 1.125,
	'major-third': 1.25,
	'major-sixth': 1.667,
	'major-seventh': 1.875,
	'major-tenth': 2.5,
	'major-eleventh': 2.667,
	'major-twelfth': 3,
	'minor-second': 1.067,
	'minor-third': 1.2,
	'minor-sixth': 1.6,
	'minor-seventh': 1.778,
	octave: 2,
	'perfect-fifth': 1.5,
	'perfect-fourth': 1.333,
};

// SYSTEM

// Loose based on LVHA:
// https://css-tricks.com/remember-selectors-with-love-and-hate/
export const STATE_ORDER: StateType[] = ['focused', 'hovered', 'selected', 'disabled'];

export const SHADE_TEXT = 80;
export const SHADE_BASE = 40;
export const SHADE_FOCUSED = 50;
export const SHADE_HOVERED = 50;
export const SHADE_SELECTED = 60;
export const SHADE_DISABLED = 20;

export const INHERIT_SETTING = 'INHERIT';
