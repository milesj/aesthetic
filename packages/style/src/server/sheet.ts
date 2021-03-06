import sortMediaQueries from 'sort-css-media-queries';
import { CSS, Sheet, SheetManager, SheetMap, VariablesMap } from '@aesthetic/types';
import { arrayLoop, arrayReduce } from '@aesthetic/utils';

// Rollup compatibility
import {
	FONT_FACE_RULE,
	IMPORT_RULE,
	insertAtRule,
	insertImportRule,
	insertRule,
	isAtRule,
	isImportRule,
	KEYFRAMES_RULE,
	MEDIA_RULE,
	STYLE_RULE,
	SUPPORTS_RULE,
} from '..';

export interface ServerSheetManager extends SheetManager {
	featureQueries: Record<string, Sheet>;
	mediaQueries: Record<string, Sheet>;
}

export class TransientSheet implements Sheet {
	conditionText: string = '';

	cssRules: Sheet[] = [];

	cssVariables: VariablesMap<string> = {};

	textContent: string = '';

	type: number;

	protected rule: string;

	constructor(type: number = STYLE_RULE, rule: string = '') {
		this.rule = rule;
		this.type = type;

		if (type === MEDIA_RULE || type === SUPPORTS_RULE) {
			this.rule = '';
			this.conditionText = rule
				.slice(0, rule.indexOf('{') - 1)
				.replace(this.conditionAtRule, '')
				.trim();
		}
	}

	get cssText() {
		const css = arrayReduce(this.cssRules, (rule) => rule.cssText, this.rule);

		if (this.type === MEDIA_RULE || this.type === SUPPORTS_RULE) {
			return `${this.conditionAtRule} ${this.conditionText} { ${css} }`;
		}

		return css;
	}

	insertRule(rule: string, index: number): number {
		this.cssRules.splice(index, 0, new TransientSheet(this.determineType(rule), rule));

		return index;
	}

	protected get conditionAtRule() {
		return this.type === MEDIA_RULE ? '@media' : '@supports';
	}

	protected determineType(rule: string): number {
		if (!isAtRule(rule)) {
			return STYLE_RULE;
		}

		if (rule.startsWith('@media')) {
			return MEDIA_RULE;
		}
		if (rule.startsWith('@supports')) {
			return SUPPORTS_RULE;
		}
		if (rule.startsWith('@font-face')) {
			return FONT_FACE_RULE;
		}
		if (rule.startsWith('@keyframes')) {
			return KEYFRAMES_RULE;
		}
		if (rule.startsWith('@import')) {
			return IMPORT_RULE;
		}

		return STYLE_RULE;
	}
}

function findNestedRule(sheet: Sheet, query: string, type: number): Sheet | null {
	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i = 0; i < sheet.cssRules.length; i += 1) {
		const child = sheet.cssRules[i];

		if (child && child.type === type && child.conditionText === query) {
			return child;
		}
	}

	return null;
}

function insertFeatureRule(
	manager: ServerSheetManager,
	sheet: Sheet,
	query: string,
	rule: CSS,
	parentSheet?: Sheet,
): number {
	const formattedRule = `@supports ${query} { ${rule} }`;

	// Already exists so append a new rule
	if (parentSheet && parentSheet !== sheet) {
		return parentSheet.insertRule(formattedRule, parentSheet.cssRules.length);
	}

	// Insert the rule and capture the instance
	const index = insertRule(sheet, formattedRule);

	manager.featureQueries[query] = sheet.cssRules[index];

	return index;
}

function insertMediaRule(
	manager: ServerSheetManager,
	sheet: Sheet,
	query: string,
	rule: CSS,
	parentSheet?: Sheet,
): number {
	const formattedRule = `@media ${query} { ${rule} }`;

	// Already exists so append a new rule (except for root sorting)
	if (parentSheet && parentSheet !== sheet) {
		return parentSheet.insertRule(formattedRule, parentSheet.cssRules.length);
	}

	// Sort and determine the index in which to insert a new query
	const sortedQueries = [...Object.keys(manager.mediaQueries), query].sort(sortMediaQueries);
	const index = sortedQueries.indexOf(query);

	insertRule(sheet, formattedRule, index);

	manager.mediaQueries[query] = sheet.cssRules[index];

	return index;
}

interface Condition {
	query: string;
	type: number;
}

function insertConditionRule(
	manager: ServerSheetManager,
	sheet: Sheet,
	rule: CSS,
	conditions: Condition[],
): number {
	let parent = sheet;

	arrayLoop(conditions, ({ query, type }) => {
		const instance = findNestedRule(parent, query, type);

		// Nested found, so continue without inserting a new rule
		if (instance) {
			parent = instance;

			return;
		}

		const index =
			type === MEDIA_RULE
				? insertMediaRule(manager, sheet, query, '', parent)
				: insertFeatureRule(manager, sheet, query, '', parent);

		parent = parent.cssRules[index];
	});

	return parent.insertRule(rule, parent.cssRules.length);
}

export function createSheetManager(sheets: SheetMap): ServerSheetManager {
	const manager: ServerSheetManager = {
		featureQueries: {},
		insertRule(rule, options, index) {
			const sheet =
				sheets[options.type ?? (options.media || options.supports ? 'conditions' : 'standard')];

			// Imports highest precedence
			if (isImportRule(rule)) {
				return insertImportRule(sheet, rule);
			}

			// Media and feature queries require special treatment
			if (options.media || options.supports) {
				const conditions: Condition[] = [];

				if (options.supports) {
					conditions.push({ query: options.supports, type: SUPPORTS_RULE });
				}

				if (options.media) {
					conditions.push({ query: options.media, type: MEDIA_RULE });
				}

				return insertConditionRule(manager, sheet, rule, conditions);
			}

			// Font faces and keyframes lowest precedence
			if (isAtRule(rule)) {
				return insertAtRule(sheet, rule);
			}

			return insertRule(sheet, rule, index);
		},
		mediaQueries: {},
		sheets,
	};

	return manager;
}
