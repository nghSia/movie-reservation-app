import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('retourne une chaîne vide si valeur falsy', () => {
    // pas de `any` : on passe null en le castant via unknown
    expect(pipe.transform(null as unknown as string)).toBe('');
  });

  it('tronque au nombre de caractères demandé', () => {
    const txt = 'abcdefghijklmnopqrstuvwxyz';
    expect(pipe.transform(txt, 5)).toBe('abcde...');
    expect(pipe.transform(txt, 26)).toBe(txt);
  });

  it('utilise le trail personnalisé', () => {
    const txt = 'HelloWorld';
    expect(pipe.transform(txt, 5, ' (suite)')).toBe('Hello (suite)');
  });
});
