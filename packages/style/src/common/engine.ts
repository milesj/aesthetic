/* eslint-disable prefer-template, no-console */

import {
	AddPropertyCallback,
	CacheItem,
	ClassName,
	CSS,
	EngineOptions,
	FontFace,
	GenericProperties,
	Import,
	Keyframes,
	Properties,
	Property,
	RenderOptions,
	RenderResult,
	RenderResultVariant,
	Rule,
	RuleMap,
	RuleWithoutVariants,
	Value,
	VariablesMap,
} from '@aesthetic/types';
import {
	arrayLoop,
	generateHash,
	isObject,
	joinQueries,
	objectLoop,
	objectReduce,
} from '@aesthetic/utils';
import { StyleEngine } from '../types';
import { createCacheKey, createCacheManager } from './cache';
import { VARIANT_COMBO_PATTERN } from './constants';
import { isAtRule, isNestedSelector, isValidValue } from './helpers';
import {
	createDeclaration,
	createDeclarationBlock,
	formatDeclaration,
	formatFontFace,
	formatImport,
	formatProperty,
	formatRule,
	formatVariable,
	formatVariableBlock,
} from './syntax';

type RenderCallback = (
	styleEngine: StyleEngine,
	rule: Rule,
	opts: RenderOptions,
) => RenderResult<ClassName>;

const CHARS = 'abcdefghijklmnopqrstuvwxyz';
const CHARS_LENGTH = CHARS.length;

function generateClassName(key: string, options: RenderOptions, engine: StyleEngine): ClassName {
	// Avoid hashes that start with an invalid number
	if (options.deterministic) {
		return `c${generateHash(key)}`;
	}

	engine.nameIndex += 1;

	const index = engine.nameIndex;

	if (index < CHARS_LENGTH) {
		return CHARS[index];
	}

	return CHARS[index % CHARS_LENGTH] + String(Math.floor(index / CHARS_LENGTH));
}

function insertAtRule(
	cacheKey: string,
	rule: CSS,
	options: RenderOptions,
	engine: StyleEngine,
): CacheItem<ClassName> {
	const { cacheManager, sheetManager } = engine;
	let item = cacheManager.read(cacheKey);

	if (!item) {
		engine.ruleCount += 1;
		item = { result: '' };
		sheetManager.insertRule(rule, { ...options, type: 'global' });
		cacheManager.write(cacheKey, item);
	}

	return item;
}

function insertStyles(
	cacheKey: string,
	render: (className: ClassName) => CSS,
	options: RenderOptions,
	engine: StyleEngine,
	minimumRank?: number,
): CacheItem<ClassName> {
	const { cacheManager, sheetManager, vendorPrefixer } = engine;
	let item = cacheManager.read(cacheKey, minimumRank);

	if (!item) {
		engine.ruleCount += 1;

		// Generate class name and format CSS rule with class name
		const className = options.className ?? generateClassName(cacheKey, options, engine);
		const css = render(className);

		// Insert rule and return a rank (insert index)
		const rank = sheetManager.insertRule(
			options.selector && options.vendor && vendorPrefixer
				? vendorPrefixer.prefixSelector(options.selector, css)
				: css,
			options,
		);

		// Cache the results for subsequent performance
		item = { rank, result: className };
		cacheManager.write(cacheKey, item);
	}

	return item;
}

function renderProperty<K extends Property>(
	engine: StyleEngine,
	property: K,
	value: NonNullable<Properties[K]>,
	options: RenderOptions,
): ClassName {
	const key = formatProperty(property);
	const { rankings } = options;
	const { result, rank } = insertStyles(
		createCacheKey(key, value, options),
		(name) => formatRule(name, createDeclaration(key, value, options, engine), options),
		options,
		engine,
		rankings?.[key],
	);

	// Persist the rank for specificity guarantees
	if (rankings && rank !== undefined && (rankings[key] === undefined || rank > rankings[key])) {
		rankings[key] = rank;
	}

	return result;
}

function renderDeclaration<K extends Property>(
	engine: StyleEngine,
	property: K,
	value: NonNullable<Properties[K]>,
	options: RenderOptions,
): ClassName {
	const { customProperties } = engine;
	let className = '';

	const handler: AddPropertyCallback = (prop, val) => {
		if (isValidValue(prop, val)) {
			className += renderProperty(engine, prop, val, options) + ' ';
		}
	};

	if (customProperties && property in customProperties) {
		// @ts-expect-error Value is a complex union
		customProperties[property](value, handler, engine);
	} else {
		handler(property, value);
	}

	return className.trim();
}

function renderFontFace(engine: StyleEngine, fontFace: FontFace, options: RenderOptions): string {
	let name = fontFace.fontFamily;
	let block = createDeclarationBlock(
		formatFontFace(fontFace) as GenericProperties,
		options,
		engine,
	);

	if (!name) {
		name = `ff${generateHash(block)}`;
		block += formatDeclaration('font-family', name);
	}

	insertAtRule(
		createCacheKey('@font-face', name, options),
		`@font-face { ${block} }`,
		options,
		engine,
	);

	return name;
}

function renderImport(engine: StyleEngine, value: Import | string, options: RenderOptions): string {
	const path = formatImport(value);

	insertAtRule(createCacheKey('@import', path, options), `@import ${path};`, options, engine);

	return path;
}

function renderKeyframes(
	engine: StyleEngine,
	keyframes: Keyframes,
	animationName: string,
	options: RenderOptions,
): string {
	const block = objectReduce(
		keyframes,
		(keyframe, step) =>
			`${step} { ${createDeclarationBlock(keyframe as GenericProperties, options, engine)} } `,
	);

	const name = animationName || `kf${generateHash(block)}`;

	insertAtRule(
		createCacheKey('@keyframes', name, options),
		`@keyframes ${name} { ${block} }`,
		options,
		engine,
	);

	return name;
}

function renderVariable(
	engine: StyleEngine,
	name: string,
	value: Value,
	options: RenderOptions,
): ClassName {
	const key = formatVariable(name);

	return insertStyles(
		createCacheKey(key, value, options),
		(className) => formatRule(className, formatDeclaration(key, value), options),
		options,
		engine,
	).result;
}

// It's much faster to set and unset options (conditions and selector) than it is
// to spread and clone the options object. Since rendering is synchronous, it just works!
function renderAtRules(
	engine: StyleEngine,
	rule: Rule,
	options: RenderOptions,
	render: RenderCallback,
): RenderResult<ClassName> {
	const {
		className: originalClassName,
		media: originalMedia,
		selector: originalSelector,
		supports: originalSupports,
	} = options;
	const variants: RenderResultVariant<ClassName>[] = [];
	let className = '';

	objectLoop(rule['@media'], (condition, query) => {
		options.media = joinQueries(options.media, query);
		className += render(engine, condition, options).result + ' ';
		options.media = originalMedia;
	});

	objectLoop(rule['@selectors'], (nestedRule, selectorGroup) => {
		arrayLoop(selectorGroup.split(','), (selector) => {
			if (originalSelector === undefined) {
				options.selector = '';
			}

			// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
			options.selector += selector.trim();
			className += render(engine, nestedRule, options).result + ' ';
			options.selector = originalSelector;
		});
	});

	objectLoop(rule['@supports'], (condition, query) => {
		options.supports = joinQueries(options.supports, query);
		className += render(engine, condition, options).result + ' ';
		options.supports = originalSupports;
	});

	objectLoop(rule['@variables'], (value, name) => {
		className += renderVariable(engine, formatVariable(name), value, options) + ' ';
	});

	objectLoop(rule['@variants'], (nestedRule, variant) => {
		if (__DEV__ && !VARIANT_COMBO_PATTERN.test(variant)) {
			throw new Error(
				`Invalid variant "${variant}". Type and enumeration must be separated with a ":", and each part may only contain a-z, 0-9, -, _.`,
			);
		}

		options.className = undefined;
		variants.push({
			result: render(engine, nestedRule, options).result,
			types: variant.split('+').map((v) => v.trim()),
		});
		options.className = originalClassName;
	});

	return {
		result: className.trim(),
		variants,
	};
}

function renderRule(
	engine: StyleEngine,
	rule: Rule,
	options: RenderOptions,
): RenderResult<ClassName> {
	let className = '';

	objectLoop(rule, (value, property) => {
		if (isObject<Rule>(value)) {
			if (isNestedSelector(property)) {
				(rule['@selectors'] ||= {})[property] = value;
			} else if (!isAtRule(property) && __DEV__) {
				console.warn(`Unknown property selector or nested block "${property}".`);
			}
		} else if (isValidValue(property, value)) {
			className += renderDeclaration(engine, property as Property, value, options) + ' ';
		}
	});

	// Render at-rules last to somewhat ensure specificity
	const atResult = renderAtRules(engine, rule, options, renderRule);

	return {
		result: (className + atResult.result).trim(),
		variants: atResult.variants,
	};
}

function renderRuleGrouped(
	engine: StyleEngine,
	rule: Rule,
	options: RenderOptions,
): RenderResult<ClassName> {
	const atRules: Rule = {};
	let variables: CSS = '';
	let properties: CSS = '';

	// Extract all nested rules first as we need to process them *after* properties
	objectLoop(rule, (value, property) => {
		if (isObject(value)) {
			// Extract and include variables in the top level class
			if (property === '@variables') {
				variables += formatVariableBlock(value as VariablesMap);

				// Extract all other at-rules
			} else if (isAtRule(property)) {
				atRules[property] = value as RuleMap;

				// Merge local selectors into the selectors at-rule
			} else if (isNestedSelector(property)) {
				(atRules['@selectors'] ||= {})[property] = value as RuleWithoutVariants;

				// Log for invalid value
			} else if (__DEV__) {
				console.warn(`Unknown property selector or nested block "${property}".`);
			}
		} else if (isValidValue(property, value)) {
			properties += createDeclaration(property, value, options, engine);
		}
	});

	// Always use deterministic classes for grouped rules
	options.deterministic = true;

	// Insert rule styles only once
	const block = variables + properties;
	const { result } = insertStyles(
		createCacheKey(block, '', options),
		(name) => formatRule(name, block, options),
		options,
		engine,
	);

	// Render all at/nested rules with the parent class name
	options.className = result;

	const { variants } = renderAtRules(engine, atRules, options, renderRuleGrouped);

	return {
		result: result.trim(),
		variants,
	};
}

const noop = () => {};

export function createStyleEngine(engineOptions: EngineOptions<ClassName>): StyleEngine {
	const renderOptions = {};
	const engine: StyleEngine = {
		cacheManager: createCacheManager(),
		direction: 'ltr',
		name: 'style',
		nameIndex: -1,
		ruleCount: -1,
		...engineOptions,
		prefersColorScheme: () => false,
		prefersContrastLevel: () => false,
		renderDeclaration: (property, value, options = renderOptions) =>
			renderDeclaration(engine, property, value, options),
		renderFontFace: (fontFace, options = renderOptions) =>
			renderFontFace(engine, fontFace, options),
		renderImport: (path, options = renderOptions) => renderImport(engine, path, options),
		renderKeyframes: (keyframes, animationName = '', options = renderOptions) =>
			renderKeyframes(engine, keyframes, animationName, options),
		renderRule: (rule, options = renderOptions) => renderRule(engine, rule, options),
		renderRuleGrouped: (rule, options = renderOptions) => renderRuleGrouped(engine, rule, options),
		renderVariable: (name, value, options = renderOptions) =>
			renderVariable(engine, name, value, options),
		setDirection: noop,
		setRootVariables: noop,
		setTheme: noop,
	};

	return engine;
}
