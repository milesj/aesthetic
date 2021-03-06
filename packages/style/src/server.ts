import { ClassName, EngineOptions, VariablesMap } from '@aesthetic/types';
import { objectLoop } from '@aesthetic/utils';
import { createSheetManager, TransientSheet } from './server/sheet';
// Rollup compatibility
import {
	createCacheManager,
	createStyleEngine,
	formatVariable,
	ServerStyleEngine,
	StyleEngine,
} from '.';

export * from './server/markup';

function setRootVariables(engine: StyleEngine, vars: VariablesMap) {
	const sheet = engine.sheetManager.sheets.global;

	objectLoop(vars, (value, key) => {
		sheet.cssVariables[formatVariable(key)] = String(value);
	});
}

function extractStyles<T>(engine: StyleEngine, result?: T): T {
	global.AESTHETIC_CUSTOM_ENGINE = engine;
	process.env.AESTHETIC_SSR = 'true';

	return result!;
}

export function createServerEngine(
	options: Partial<EngineOptions<ClassName>> = {},
): ServerStyleEngine {
	const engine = createStyleEngine({
		cacheManager: createCacheManager(),
		sheetManager: createSheetManager({
			conditions: new TransientSheet(),
			global: new TransientSheet(),
			standard: new TransientSheet(),
		}),
		...options,
	}) as ServerStyleEngine;

	engine.setRootVariables = (vars) => void setRootVariables(engine, vars);
	engine.extractStyles = (result) => extractStyles(engine, result);

	return engine;
}
