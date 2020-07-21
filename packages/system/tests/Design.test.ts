import { Design, Theme } from '../src';
import { design, lightTheme } from '../src/testing';

describe('Design', () => {
  it('sets class properties', () => {
    expect(design.rootLineHeight).toBe(1.25);
    expect(design.rootTextSize).toBe(14);
    expect(design.spacingUnit).toBe(17.5);
  });

  it('can return a theme instance', () => {
    const theme = design.createTheme(
      { contrast: 'normal', scheme: 'light' },
      // @ts-expect-error
      lightTheme.tokens,
    );

    expect(theme).toBeInstanceOf(Theme);
  });

  it('can extend and create a new design', () => {
    const newDesign = design.extend('new-design', {
      spacing: {
        unit: 8,
      },
      text: {
        df: {
          size: '20px',
        },
      },
    });

    expect(newDesign).toBeInstanceOf(Design);
    expect(newDesign.name).toBe('new-design');
    expect(newDesign.getTokens().spacing.unit).toBe(8);
    expect(newDesign.getTokens().text.df.size).toBe('20px');
  });
});
