import { prefixValueFunction } from '../src/prefixValueFunction';

describe('prefixValueFunction()', () => {
	it('doesnt prefix for unsupported value', () => {
		expect(prefixValueFunction('image-set()', {})).toEqual(['image-set()']);
		expect(prefixValueFunction('image-set()', { 'image-set': 0 })).toEqual(['image-set()']);
	});

	it('prefixes for values that have a mapping', () => {
		expect(
			prefixValueFunction('image-set()', {
				'image-set': 7,
			}),
		).toEqual(['-ms-image-set()', '-moz-image-set()', '-webkit-image-set()', 'image-set()']);
	});

	it('prefixes multiple instances', () => {
		expect(
			prefixValueFunction('image-set(), image-set()', {
				'image-set': 1,
			}),
		).toEqual(['-webkit-image-set(), -webkit-image-set()', 'image-set(), image-set()']);
	});
});
