import directionConverter from '@aesthetic/addon-direction';
import vendorPrefixer from '@aesthetic/addon-vendor';
import { RankCache, SheetManager } from '@aesthetic/types';
import {
	createTestSheetManager,
	createTestStyleEngine,
	getRenderedStyles,
	purgeStyles,
} from '../src/test';
import { StyleEngine } from '../src/types';

const fontFace = {
	fontFamily: '"Open Sans"',
	fontStyle: 'normal',
	fontWeight: 800,
	src: 'url("fonts/OpenSans-Bold.woff2")',
};

describe('Engine', () => {
	let sheetManager: SheetManager;
	let engine: StyleEngine;

	beforeEach(() => {
		sheetManager = createTestSheetManager();
		engine = createTestStyleEngine({
			directionConverter,
			sheetManager,
			vendorPrefixer,
		});
	});

	afterEach(() => {
		purgeStyles();
	});

	it('inserts at-rules before standard rules', () => {
		engine.renderRule({ display: 'block' }, { type: 'global' });
		engine.renderFontFace(fontFace);

		expect(getRenderedStyles('global')).toMatchSnapshot();
	});

	it('inserts imports before at-rules', () => {
		engine.renderFontFace(fontFace);
		engine.renderImport('"custom.css"');

		expect(getRenderedStyles('global')).toMatchSnapshot();
	});

	describe('renderDeclaration()', () => {
		it('generates a unique class name for a large number of properties', () => {
			for (let i = 0; i < 100; i += 1) {
				engine.renderDeclaration('padding', `${i}px`);
			}

			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('uses the same class name for the same property value pair', () => {
			engine.renderDeclaration('display', 'block');
			engine.renderDeclaration('display', 'flex');
			engine.renderDeclaration('display', 'block');
			engine.renderDeclaration('display', 'flex');
			engine.renderDeclaration('display', 'inline');
			engine.renderDeclaration('display', 'block');

			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('uses the same class name for dashed and camel cased properties', () => {
			engine.renderDeclaration('textDecoration', 'none');
			// @ts-expect-error Not allowed with types but works
			engine.renderDeclaration('text-decoration', 'none');

			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('uses the same class name for numeric and string values', () => {
			engine.renderDeclaration('width', 0);
			engine.renderDeclaration('width', '0');
			engine.renderDeclaration('width', '100em');

			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('supports CSS variables', () => {
			engine.renderDeclaration('color', 'var(--primary-color)');
			engine.renderDeclaration('border', '1px solid var(--border-color)');
			engine.renderDeclaration('display', 'var(--display, var(--fallback), flex)');

			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('prefixes properties, values, value functions, and selectors', () => {
			// Value prefixing (wont show in snapshot because of DOM)
			engine.renderDeclaration('minWidth', 'fit-content', { vendor: true });

			// Value function prefixing (wont show in snapshot because of DOM)
			engine.renderDeclaration('background', 'image-set()', { vendor: true });

			// Property prefixing
			engine.renderDeclaration('appearance', 'none', { vendor: true });

			// Selector prefixing (only shows last in snapshot)
			engine.renderDeclaration('display', 'none', {
				selector: ':fullscreen',
				vendor: true,
			});

			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('generates a deterministic class name', () => {
			const className = engine.renderDeclaration('margin', 0, { deterministic: true });

			expect(className).toBe('c13kbekr');
		});

		describe('selectors', () => {
			it('supports selectors', () => {
				engine.renderDeclaration('color', 'green', { selector: ':hover' });
				engine.renderDeclaration('color', 'red', { selector: '[disabled]' });
				engine.renderDeclaration('color', 'blue', { selector: ':nth-child(2)' });

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});
		});

		describe('conditions', () => {
			it('supports conditionals', () => {
				engine.renderDeclaration('color', 'green', { media: '(max-size: 100px)' });
				engine.renderDeclaration('color', 'red', { supports: '(color: red)' });
				engine.renderDeclaration('color', 'blue', {
					media: '(max-width: 100px) and (min-width: 200px)',
					supports: '(color: red)',
				});

				expect(getRenderedStyles('conditions')).toMatchSnapshot();
			});

			it('supports conditionals with selectors', () => {
				engine.renderDeclaration('color', 'green', {
					media: '(max-size: 100px)',
					selector: ':focus',
				});

				expect(getRenderedStyles('conditions')).toMatchSnapshot();
			});

			it('generates different class names between standard and condition rules, when condition is inserted first', () => {
				const a = engine.renderDeclaration('width', '100em', {
					media: '(max-width: 100px)',
				});
				const b = engine.renderDeclaration('width', '100em');

				expect(a).toBe('a');
				expect(b).toBe('b');
				expect(a).not.toBe(b);
			});
		});

		describe('directionality', () => {
			it('converts directional properties', () => {
				engine.renderDeclaration('marginLeft', 0);
				engine.renderDeclaration('marginRight', 0);
				engine.renderDeclaration('marginLeft', 0, { direction: 'ltr' });
				engine.renderDeclaration('marginRight', 0, { direction: 'rtl' });
				engine.renderDeclaration('marginLeft', 0, { direction: 'ltr' });
				engine.renderDeclaration('marginRight', 0, { direction: 'rtl' });

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('converts directional values', () => {
				engine.renderDeclaration('textAlign', 'left');
				engine.renderDeclaration('textAlign', 'right');
				engine.renderDeclaration('textAlign', 'left', { direction: 'ltr' });
				engine.renderDeclaration('textAlign', 'left', { direction: 'rtl' });
				engine.renderDeclaration('textAlign', 'right', { direction: 'ltr' });
				engine.renderDeclaration('textAlign', 'right', { direction: 'rtl' });

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});
		});

		describe('rankings', () => {
			it('generates a ranking (insertion order)', () => {
				const spy = jest.spyOn(sheetManager, 'insertRule');
				const rankings: RankCache = {};

				engine.renderDeclaration('textAlign', 'center', { rankings });
				engine.renderDeclaration('textAlign', 'center', { rankings });
				engine.renderDeclaration('textAlign', 'center', { rankings });

				expect(rankings).toEqual({ 'text-align': 0 });
				expect(spy).toHaveBeenCalledTimes(1);
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('inserts the same declaration if the minimum rank is not met (specificity guarantee)', () => {
				const spy = jest.spyOn(sheetManager, 'insertRule');
				const rankings: RankCache = {};

				engine.renderDeclaration('textAlign', 'center', { rankings });
				rankings['text-align'] = 1;
				engine.renderDeclaration('textAlign', 'center', { rankings });
				rankings['text-align'] = 2;
				engine.renderDeclaration('textAlign', 'center', { rankings });

				expect(rankings).toEqual({ 'text-align': 2 });
				expect(spy).toHaveBeenCalledTimes(3);
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('can insert the same declaration if using a minimum rank requirement', () => {
				engine.renderDeclaration('color', 'red'); // 0
				engine.renderDeclaration('color', 'green'); // 1

				const c = engine.renderDeclaration('color', 'blue'); // 2
				const d = engine.renderDeclaration('color', 'blue', { rankings: { color: 10 } }); // 3

				expect(c).toBe('c');
				expect(d).toBe('d');
				expect(c).not.toBe(d);
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('can insert the same declaration if using a shared rankings cache', () => {
				const rankings = {};

				engine.renderRule({ color: 'red', display: 'inline' }, { rankings });
				engine.renderRule({ color: 'blue' }, { rankings });
				engine.renderRule({ color: 'green', display: 'block' }, { rankings });

				// Should render again
				engine.renderRule({ color: 'red', display: 'inline' }, { rankings });

				expect(rankings).toEqual({ color: 5, display: 6 });
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('wont insert the same declaration if not using a shared rankings cache', () => {
				engine.renderRule({ color: 'red', display: 'inline' });
				engine.renderRule({ color: 'blue' });
				engine.renderRule({ color: 'green', display: 'block' });

				// Should NOT render again
				engine.renderRule({ color: 'red', display: 'inline' });

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});
		});

		describe('custom properties', () => {
			it('can change the value', () => {
				engine.customProperties = {
					display(value, add) {
						add('display', value === 'box' ? 'flex' : 'block');
					},
				};

				engine.renderDeclaration('display', 'box');
				engine.renderDeclaration('display', 'block');

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('can add a completely different property', () => {
				engine.customProperties = {
					display(value, add) {
						add('flex', 1);
					},
				};

				engine.renderDeclaration('display', 'block');

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('can add multiple properties', () => {
				engine.customProperties = {
					display(value, add) {
						add('display', value);
						add('position', 'relative');
						add('zIndex', 0);
					},
				};

				engine.renderDeclaration('display', 'block');

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('ignores properties with invalid values', () => {
				const spy = jest.spyOn(console, 'warn').mockImplementation();

				engine.customProperties = {
					display(value, add) {
						add('display', '');
						// @ts-expect-error Allow invalid type
						add('display', undefined);
						// @ts-expect-error Allow invalid type
						add('display', null);
						// @ts-expect-error Allow invalid type
						add('display', false);
						// @ts-expect-error Allow invalid type
						add('display', true);
					},
				};

				engine.renderDeclaration('display', 'block');

				expect(spy).toHaveBeenCalledTimes(4);
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});
		});
	});

	describe('renderFontFace()', () => {
		it('doesnt insert the same at-rule more than once', () => {
			engine.renderFontFace(fontFace);
			engine.renderFontFace(fontFace);

			expect(getRenderedStyles('global')).toMatchSnapshot();
		});

		it('renders and returns family name', () => {
			const name = engine.renderFontFace(fontFace);

			expect(name).toBe('"Open Sans"');
			expect(getRenderedStyles('global')).toMatchSnapshot();
		});

		it('generates a hashed family name if none provided', () => {
			const name = engine.renderFontFace({
				fontStyle: 'normal',
				fontWeight: 800,
				src: 'url("fonts/OpenSans-Bold.woff2")',
			});

			expect(name).toBe('ffweix7s');
			expect(getRenderedStyles('global')).toMatchSnapshot();
		});

		it('converts an array of `srcPaths` to `src`', () => {
			const name = engine.renderFontFace({
				fontFamily: 'Roboto',
				fontStyle: 'normal',
				fontWeight: 'normal',
				local: ['Robo'],
				srcPaths: ['fonts/Roboto.woff2', 'fonts/Roboto.ttf'],
			});

			expect(name).toBe('Roboto');
			expect(getRenderedStyles('global')).toMatchSnapshot();
		});
	});

	describe('renderImport()', () => {
		it('doesnt insert the same at-rule more than once', () => {
			engine.renderImport('"custom.css"');
			engine.renderImport('"custom.css"');

			expect(getRenderedStyles('global')).toMatchSnapshot();
		});

		it('renders all variants', () => {
			engine.renderImport('"custom.css"');
			engine.renderImport({ path: 'common.css', media: 'screen' });
			engine.renderImport({ path: 'print.css', media: 'print' });
			engine.renderImport('url("chrome://communicator/skin")');
			engine.renderImport('"landscape.css" screen');
			engine.renderImport({ path: 'a11y.css', media: 'speech', url: true });
			engine.renderImport({ path: 'responsive.css', media: 'screen and (orientation: landscape)' });
			engine.renderImport({ path: 'fallback-layout.css', media: 'supports(not (display: flex))' });

			expect(getRenderedStyles('global')).toMatchSnapshot();
		});
	});

	describe('renderKeyframes()', () => {
		it('doesnt insert the same at-rule more than once', () => {
			engine.renderKeyframes({
				from: {
					transform: 'translateX(0%)',
				},
				to: {
					transform: 'translateX(100%)',
				},
			});
			engine.renderKeyframes({
				from: {
					transform: 'translateX(0%)',
				},
				to: {
					transform: 'translateX(100%)',
				},
			});

			expect(getRenderedStyles('global')).toMatchSnapshot();
		});

		it('renders range based and returns animation name', () => {
			const name = engine.renderKeyframes({
				from: {
					transform: 'translateX(0%)',
				},
				to: {
					transform: 'translateX(100%)',
				},
			});

			expect(name).toBe('kf103rcyx');
			expect(getRenderedStyles('global')).toMatchSnapshot();
		});

		it('renders percentage based and returns animation name', () => {
			const name = engine.renderKeyframes({
				'0%': { top: 0, left: 0 },
				'30%': { top: '50px' },
				'68%, 72%': { left: '50px' },
				'100%': { top: '100px', left: '100%' },
			});

			expect(name).toBe('kf22exw8');
			expect(getRenderedStyles('global')).toMatchSnapshot();
		});

		it('can provide a custom animation name', () => {
			const name = engine.renderKeyframes(
				{
					from: {
						opacity: 0,
					},
					to: {
						opacity: 1,
					},
				},
				'fade',
			);

			expect(name).toBe('fade');
			expect(getRenderedStyles('global')).toMatchSnapshot();
		});

		it('converts between LTR and RTL', () => {
			const ltr = engine.renderKeyframes(
				{
					from: {
						left: '0',
					},
					to: {
						right: '100px',
					},
				},
				'',
				{ direction: 'ltr' },
			);

			const rtl = engine.renderKeyframes(
				{
					from: {
						left: '0',
					},
					to: {
						right: '100px',
					},
				},
				'',
				{
					direction: 'rtl',
				},
			);

			expect(ltr).toBe('kf1lt4056');
			expect(rtl).toBe('kf944ipm');
			expect(getRenderedStyles('global')).toMatchSnapshot();
		});
	});

	describe('renderRule()', () => {
		it('generates a unique class name for each property', () => {
			const className = engine.renderRule({
				margin: 0,
				padding: '6px 12px',
				border: '1px solid #2e6da4',
				borderRadius: '4px',
				display: 'inline-block',
				cursor: 'pointer',
				fontFamily: 'Roboto',
				fontWeight: 'normal',
				lineHeight: 'normal',
				whiteSpace: 'nowrap',
				textDecoration: 'none',
				textAlign: 'left',
				backgroundColor: '#337ab7',
				verticalAlign: 'middle',
				color: 'rgba(0, 0, 0, 0)',
				animationName: 'fade',
				animationDuration: '.3s',
			});

			expect(className.result).toBe('a b c d e f g h i j k l m n o p q');
			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('generates a deterministic class name for each property', () => {
			const className = engine.renderRule(
				{
					margin: 0,
					cursor: 'pointer',
				},
				{ deterministic: true },
			);
			const cursor = engine.renderDeclaration('cursor', 'pointer', { deterministic: true });

			expect(className.result).toBe('c13kbekr c16r1ggk');
			expect(className.result).toContain(cursor);
			expect(cursor).toBe('c16r1ggk');
			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('generates a unique class name for each selector even if property value pair is the same', () => {
			const className = engine.renderRule({
				background: '#000',
				':hover': {
					background: '#000',
				},
				'[disabled]': {
					background: '#000',
				},
			});

			expect(className.result).toBe('a b c');
			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('can nest conditionals infinitely', () => {
			engine.renderRule({
				margin: 0,
				'@media': {
					'(width: 500px)': {
						margin: '10px',
						':hover': {
							color: 'red',
						},
						'@media': {
							'(width: 350px)': {
								'@supports': {
									'(color: blue)': {
										color: 'blue',
										':focus': {
											color: 'darkblue',
										},
									},
								},
							},
						},
					},
				},
			});

			expect(getRenderedStyles('standard')).toMatchSnapshot();
			expect(getRenderedStyles('conditions')).toMatchSnapshot();
		});

		it('applies nested conditionals and selectors correctly', () => {
			engine.renderRule({
				'@media': {
					'(max-width: 1000px)': {
						':hover': {},
						'@supports': {
							'(display: flex)': {
								'[disabled]': {},
								'@media': {
									'(min-width: 500px)': {
										'@media': {
											'(prefers-contrast: low)': {
												'@supports': {
													'(color: red)': {
														color: 'red',
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			});

			expect(getRenderedStyles('conditions')).toMatchSnapshot();
		});

		it('can nest selectors infinitely', () => {
			engine.renderRule({
				width: '100%',
				maxWidth: '100%',
				margin: 0,
				padding: 0,
				backgroundColor: '#fff',
				border: '1px solid #ccc',
				borderCollapse: 'collapse',
				borderSpacing: 0,
				'@selectors': {
					'> thead': {
						display: 'table-head',
						'@selectors': {
							'> tr': {
								backgroundColor: '#eee',
								'@selectors': {
									'> th': {
										border: '1px solid #ccc',
										padding: 8,
										textAlign: 'center',
										'@selectors': {
											'> span': {
												fontWeight: 'bold',
											},
											'> a': {
												textDecoration: 'underline',
											},
										},
									},
									'> td': {
										border: '1px solid #ccc',
										padding: 8,
										textAlign: 'left',
									},
								},
							},
						},
					},
				},
			});

			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('ignores invalid values', () => {
			const spy = jest.spyOn(console, 'warn').mockImplementation();

			const className = engine.renderRule({
				// @ts-expect-error Invalid type
				margin: true,
				// @ts-expect-error Invalid type
				padding: null,
				color: undefined,
			});

			expect(className.result).toBe('');
			expect(getRenderedStyles('standard')).toMatchSnapshot();

			spy.mockRestore();
		});

		it('logs a warning for invalid values', () => {
			const spy = jest.spyOn(console, 'warn').mockImplementation();

			engine.renderRule({
				// @ts-expect-error Invalid type
				color: true,
			});

			expect(spy).toHaveBeenCalledWith('Invalid value "true" for "color".');
			expect(getRenderedStyles('standard')).toMatchSnapshot();

			spy.mockRestore();
		});

		it('logs a warning for unknown nested selector', () => {
			const spy = jest.spyOn(console, 'warn').mockImplementation();

			engine.renderRule({
				background: 'white',
				// @ts-expect-error Invalid type
				'$ what is this': {
					background: 'black',
				},
			});

			expect(spy).toHaveBeenCalledWith(
				'Unknown property selector or nested block "$ what is this".',
			);
			expect(getRenderedStyles('standard')).toMatchSnapshot();

			spy.mockRestore();
		});

		it('inserts into the appropriate style sheets', () => {
			engine.renderRule({
				background: 'white',
				'@media': {
					'(prefers-color-scheme: dark)': {
						background: 'black',
					},
				},
			});

			expect(getRenderedStyles('standard')).toMatchSnapshot();
			expect(getRenderedStyles('conditions')).toMatchSnapshot();
		});

		it('supports CSS variables', () => {
			const className = engine.renderRule({
				display: 'block',
				color: 'var(--color)',
				'@variables': {
					'--color': 'red',
					fontSize: '14px',
					'line-height': 1,
				},
			});

			expect(className.result).toBe('a b c d e');
			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		describe('media queries', () => {
			it('supports @media conditions', () => {
				const className = engine.renderRule({
					background: '#000',
					padding: '15px',
					'@media': {
						'(max-width: 600px)': {
							padding: '15px',
						},
						'screen and (min-width: 900px)': {
							padding: '20px',
						},
					},
				});

				expect(className.result).toBe('a b c d');
				expect(getRenderedStyles('standard')).toMatchSnapshot();
				expect(getRenderedStyles('conditions')).toMatchSnapshot();
			});

			it('can be nested in @supports', () => {
				const className = engine.renderRule({
					padding: '15px',
					'@supports': {
						'(display: flex)': {
							'@media': {
								'(max-width: 600px)': {
									padding: '15px',
								},
							},
						},
					},
				});

				expect(className.result).toBe('a b');
				expect(getRenderedStyles('standard')).toMatchSnapshot();
				expect(getRenderedStyles('conditions')).toMatchSnapshot();
			});
		});

		describe('support queries', () => {
			it('supports @supports conditions', () => {
				const className = engine.renderRule({
					display: 'block',
					'@supports': {
						'(display: flex)': {
							display: 'flex',
						},
					},
				});

				expect(className.result).toBe('a b');
				expect(getRenderedStyles('standard')).toMatchSnapshot();
				expect(getRenderedStyles('conditions')).toMatchSnapshot();
			});

			it('can be nested in @media', () => {
				const className = engine.renderRule({
					display: 'block',
					'@media': {
						'screen and (min-width: 900px)': {
							'@supports': {
								'(display: flex)': {
									display: 'flex',
								},
							},
						},
					},
				});

				expect(className.result).toBe('a b');
				expect(getRenderedStyles('standard')).toMatchSnapshot();
				expect(getRenderedStyles('conditions')).toMatchSnapshot();
			});
		});

		describe('attributes', () => {
			it('generates the correct class names with attribute selector', () => {
				const className = engine.renderRule({
					background: '#000',
					'[disabled]': {
						backgroundColor: '#286090',
						borderColor: '#204d74',
					},
				});

				expect(className.result).toBe('a b c');
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('uses same class name between both APIs', () => {
				const classNameA = engine.renderRule({
					'[disabled]': {
						backgroundColor: '#000',
					},
				});
				const classNameB = engine.renderDeclaration('backgroundColor', '#000', {
					selector: '[disabled]',
				});

				expect(classNameA.result).toBe('a');
				expect(classNameA.result).toBe(classNameB);
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('supports complex attribute selectors', () => {
				engine.renderDeclaration('backgroundColor', '#286090', {
					selector: '[href*="example"]',
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('supports attributes in @selectors', () => {
				engine.renderRule({
					'@selectors': {
						'[disabled]': {
							opacity: 0.5,
						},
						'[href]': {
							cursor: 'pointer',
						},
					},
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});
		});

		describe('pseudos', () => {
			it('generates the correct class names with pseudo selector', () => {
				const className = engine.renderRule({
					padding: '5px',
					':hover': {
						padding: '10px',
					},
					'::before': {
						content: '"★"',
						display: 'inline-block',
					},
				});

				expect(className.result).toBe('a b c d');
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('uses same class name between both APIs', () => {
				const classNameA = engine.renderRule({
					':focus': {
						backgroundColor: '#000',
					},
				});
				const classNameB = engine.renderDeclaration('backgroundColor', '#000', {
					selector: ':focus',
				});

				expect(classNameA.result).toBe('a');
				expect(classNameA.result).toBe(classNameB);
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('supports complex attribute selectors', () => {
				engine.renderDeclaration('color', 'white', {
					selector: ':nth-last-of-type(4n)',
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('supports pseudos in @selectors', () => {
				engine.renderRule({
					'@selectors': {
						':hover': {
							position: 'static',
						},
						'::before': {
							position: 'absolute',
						},
					},
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});
		});

		describe('hierarchy', () => {
			it('generates the correct class names with hierarchy selector', () => {
				const className = engine.renderRule({
					padding: '10px',
					'@selectors': {
						'+ div': {
							padding: '10px',
						},
						'~ SPAN': {
							padding: '10px',
						},
						'>li': {
							padding: '10px',
						},
						'*': {
							padding: '10px',
						},
					},
				});

				expect(className.result).toBe('a b c d e');
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('uses same class name between both APIs', () => {
				const classNameA = engine.renderRule({
					'@selectors': {
						'+ div': {
							backgroundColor: '#000',
						},
					},
				});
				const classNameB = engine.renderDeclaration('backgroundColor', '#000', {
					selector: '+ div',
				});

				expect(classNameA.result).toBe('a');
				expect(classNameA.result).toBe(classNameB);
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('supports complex attribute selectors', () => {
				engine.renderDeclaration('color', 'white', {
					selector: ':first-of-type + li',
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('supports combinators in @selectors', () => {
				engine.renderRule({
					'@selectors': {
						'> li': {
							listStyle: 'bullet',
						},
						'+ div': {
							display: 'none',
						},
						'~ span': {
							color: 'black',
						},
						'*': {
							backgroundColor: 'inherit',
						},
					},
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('supports multiple selectors separated by a comma', () => {
				engine.renderRule({
					':active': {
						cursor: 'pointer',
					},
					'@selectors': {
						':disabled, [disabled], > span': {
							cursor: 'default',
						},
					},
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});
		});

		describe('unit suffixes', () => {
			it('adds suffix to number values', () => {
				engine.renderRule({
					marginLeft: '10px',
					marginRight: 20,
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('doesnt suffix 0 values', () => {
				engine.renderRule({
					margin: 0,
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('doesnt suffix unitless values', () => {
				engine.renderRule({
					lineHeight: 1.25,
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('can customize with a string `unit` option', () => {
				engine.renderRule(
					{
						marginLeft: '10px',
						marginRight: 20,
					},
					{
						unit: 'rem',
					},
				);

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('can customize with a function `unit` option', () => {
				engine.unitSuffixer = (prop) => {
					/* eslint-disable jest/no-if */
					if (prop.includes('margin')) return '%';
					if (prop.includes('padding')) return 'rem';
					if (prop === 'font-size') return 'pt';

					return 'px';
				};

				engine.renderRule({
					margin: 10,
					padding: 20,
					fontSize: 16,
					width: 100,
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});
		});

		describe('specificity', () => {
			it('inserts declarations in the order they are defined', () => {
				engine.renderRule({
					margin: 0,
					padding: '1px',
					width: '50px',
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('inserts declarations in the order they are defined (reversed)', () => {
				engine.renderRule({
					width: '50px',
					padding: '1px',
					margin: 0,
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('inserts selectors in the order they are defined', () => {
				engine.renderRule({
					color: 'white',
					':active': {
						color: 'red',
					},
					':hover': {
						color: 'blue',
					},
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('inserts selectors in the order they are defined (reversed)', () => {
				engine.renderRule({
					color: 'white',
					':hover': {
						color: 'blue',
					},
					':active': {
						color: 'red',
					},
				});

				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});
		});

		describe('variants', () => {
			it('errors if missing a colon', () => {
				expect(() => {
					engine.renderRule({
						'@variants': {
							foo: {},
						},
					});
				}).toThrowErrorMatchingSnapshot();
			});

			it('errors if starts with a number', () => {
				expect(() => {
					engine.renderRule({
						'@variants': {
							'9a:value': {},
						},
					});
				}).toThrowErrorMatchingSnapshot();
			});

			it('errors if enum is empty', () => {
				expect(() => {
					engine.renderRule({
						'@variants': {
							'type:': {},
						},
					});
				}).toThrowErrorMatchingSnapshot();
			});

			it('errors if contains a space', () => {
				expect(() => {
					engine.renderRule({
						'@variants': {
							'type:va lue': {},
						},
					});
				}).toThrowErrorMatchingSnapshot();
			});

			it('errors for invalid compound name', () => {
				expect(() => {
					engine.renderRule({
						'@variants': {
							'type:value + broken': {},
						},
					});
				}).toThrowErrorMatchingSnapshot();
			});

			it('doesnt error for valid variant type', () => {
				expect(() => {
					engine.renderRule({
						'@variants': {
							'type:value': {},
						},
					});
				}).not.toThrow();
			});

			it('doesnt error for valid compound variant', () => {
				expect(() => {
					engine.renderRule({
						'@variants': {
							'a:value + b:value': {},
							'b:value + c:value + d:value': {},
						},
					});
				}).not.toThrow();
			});

			it('returns an empty array if no variants', () => {
				const result = engine.renderRule({ '@variants': {} });

				expect(result).toEqual({ result: '', variants: [] });
			});

			it('returns a result for each variant', () => {
				const result = engine.renderRule({
					display: 'block',

					'@variants': {
						'size:small': {
							fontSize: 14,
							padding: 2,
						},
						'size:default': {
							fontSize: 16,
							padding: 3,
						},
						'size:large': {
							fontSize: 18,
							padding: 4,
						},
					},
				});

				expect(result).toEqual({
					result: 'a',
					variants: [
						{
							result: 'b c',
							types: ['size:small'],
						},
						{
							result: 'd e',
							types: ['size:default'],
						},
						{
							result: 'f g',
							types: ['size:large'],
						},
					],
				});
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});

			it('returns a result for each compound variant', () => {
				const result = engine.renderRule({
					'@variants': {
						'size:large + palette:negative': {
							fontWeight: 'bold',
						},
					},
				});

				expect(result).toEqual({
					result: '',
					variants: [{ result: 'a', types: ['size:large', 'palette:negative'] }],
				});
				expect(getRenderedStyles('standard')).toMatchSnapshot();
			});
		});
	});

	describe('renderRuleGrouped()', () => {
		const rule = {
			display: 'block',
			background: 'transparent',
			color: 'black',
			paddingRight: 0,
			marginLeft: 0,
			transition: '200ms all',
			appearance: 'none',
			':hover': {
				display: 'flex',
				color: 'blue',
			},
			'::backdrop': {
				background: 'black',
			},
			'@media': {
				'(width: 500px)': {
					margin: '10px',
					padding: '10px',
					':hover': {
						color: 'darkblue',
					},
				},
			},
		} as const;

		it('generates a single class name for all properties', () => {
			const className = engine.renderRuleGrouped({
				margin: 0,
				padding: '6px 12px',
				border: '1px solid #2e6da4',
				borderRadius: '4px',
				display: 'inline-block',
				cursor: 'pointer',
				fontFamily: 'Roboto',
				fontWeight: 'normal',
				lineHeight: 'normal',
				whiteSpace: 'nowrap',
				textDecoration: 'none',
				textAlign: 'left',
				backgroundColor: '#337ab7',
				verticalAlign: 'middle',
				color: 'rgba(0, 0, 0, 0)',
				animationName: 'fade',
				animationDuration: '.3s',
			});

			expect(className.result).toBe('cj1oomc');
			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('generates a consistent class name for same properties', () => {
			const a = engine.renderRuleGrouped(rule);
			const b = engine.renderRuleGrouped(rule);

			expect(a.result).toBe(b.result);
			expect(getRenderedStyles('standard')).toMatchSnapshot();
			expect(getRenderedStyles('conditions')).toMatchSnapshot();
		});

		it('can vendor prefix applicable properties', () => {
			const className = engine.renderRuleGrouped(rule, { vendor: true });

			expect(className.result).toBe('cix1mgi');
			expect(getRenderedStyles('standard')).toMatchSnapshot();
			expect(getRenderedStyles('conditions')).toMatchSnapshot();
		});

		it('can convert direction applicable properties', () => {
			const className = engine.renderRuleGrouped(rule, { direction: 'rtl' });

			expect(className.result).toBe('cnaaqpz');
			expect(getRenderedStyles('standard')).toMatchSnapshot();
			expect(getRenderedStyles('conditions')).toMatchSnapshot();
		});

		it('handles direction and vendor prefixes at once', () => {
			const a = engine.renderRuleGrouped(rule, {
				direction: 'ltr',
				vendor: true,
			});

			// RTL
			const b = engine.renderRuleGrouped(rule, {
				direction: 'rtl',
				vendor: true,
			});

			expect(a.result).toBe('cix1mgi');
			expect(b.result).toBe('c1t3l09e');
			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('supports CSS variables', () => {
			const className = engine.renderRuleGrouped({
				display: 'block',
				color: 'var(--color)',
				'@variables': {
					'--color': 'red',
					fontSize: '14px',
					'line-height': 1,
				},
			});

			expect(className.result).toBe('cng2wkm');
			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('generates unique class names for each variant', () => {
			const className = engine.renderRuleGrouped({
				display: 'block',
				'@variants': {
					'size:small': {
						fontSize: 14,
						padding: 2,
					},
					'size:default': {
						fontSize: 16,
						padding: 3,
					},
					'size:large': {
						fontSize: 18,
						padding: 4,
					},
				},
			});

			expect(className).toEqual({
				result: 'csfd7x3',
				variants: [
					{
						result: 'c1taja0',
						types: ['size:small'],
					},
					{
						result: 'c146gq7v',
						types: ['size:default'],
					},
					{
						result: 'czmqclu',
						types: ['size:large'],
					},
				],
			});
			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('logs a warning for unknown nested selector', () => {
			const spy = jest.spyOn(console, 'warn').mockImplementation();

			engine.renderRuleGrouped({
				background: 'white',
				// @ts-expect-error Invalid type
				'$ what is this': {
					background: 'black',
				},
			});

			expect(spy).toHaveBeenCalledWith(
				'Unknown property selector or nested block "$ what is this".',
			);
			expect(getRenderedStyles('standard')).toMatchSnapshot();

			spy.mockRestore();
		});
	});

	describe('renderVariable()', () => {
		it('generates a unique class name for a large number of variables', () => {
			for (let i = 0; i < 100; i += 1) {
				engine.renderVariable('fontSize', `${i}px`);
			}

			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('uses the same class name for the same property value pair', () => {
			engine.renderVariable('fontSize', '16px');
			engine.renderVariable('fontSize', '16px');
			engine.renderVariable('fontSize', '16px');

			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('uses the same class name for dashed and camel cased properties', () => {
			engine.renderVariable('fontSize', '16px');
			engine.renderVariable('font-size', '16px');
			engine.renderVariable('--font-size', '16px');

			expect(getRenderedStyles('standard')).toMatchSnapshot();
		});

		it('generates a deterministic class name', () => {
			const className = engine.renderVariable('--font-size', '16px', { deterministic: true });

			expect(className).toBe('ca1tahd');
		});
	});
});
