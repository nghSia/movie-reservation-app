import { DateFrPipe } from './date-fr.pipe';

describe('DateFrPipe', () => {
  let pipe: DateFrPipe;

  beforeEach(() => {
    pipe = new DateFrPipe();
  });

  it('devrait retourner une chaîne vide si valeur falsy', () => {
    // @ts-expect-error test falsy
    expect(pipe.transform(null)).toBe('');
    // @ts-expect-error test falsy
    expect(pipe.transform(undefined)).toBe('');
  });

  it('formate une date en français avec jour, date et heure', () => {
    const d = new Date('2020-01-01T12:34:00');
    const out = pipe.transform(d);

    expect(out).toContain('2020');
    expect(out).toMatch(
      /janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre/,
    );
    expect(out).toMatch(/\d{2}:\d{2}/);
  });

  it('accepte une string date ISO', () => {
    const out = pipe.transform('2023-12-25T15:30:00');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});
