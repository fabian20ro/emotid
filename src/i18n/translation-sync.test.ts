import { test, expect } from 'vitest';
import en from './en.json';
import ro from './ro.json';

function getKeys(obj: Record<string, unknown>, prefix = '') {
  const keys = new Set<string>();
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    keys.add(newKey);
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      getKeys(value as Record<string, unknown>, newKey).forEach(k => keys.add(k));
    }
  }
  return keys;
}

test('English vs Romanian translation keys integrity', () => {
  const enKeys = getKeys(en);
  const roKeys = getKeys(ro);

  const missingInRo = [...enKeys].filter(key => !roKeys.has(key));
  expect(missingInRo, `Missing keys in Romanian translation: ${missingInRo.join(', ')}`).toHaveLength(0);
});

test('Romanian values should be different from English values', () => {
  const isPlaceholder = (str: string) => 
    str.includes('{') || 
    str.includes('}') || 
    str.includes('(') || 
    str.includes(')') ||
    str.toLowerCase().startsWith('...') ||
    str.toLowerCase().endsWith('...');

  const knownIdentical = ['app.title', 'app.subtitle', 'app de', 'app.languageRo', 'app.languageEn', 'selectionBar.clear', 'onboarding.next', 'onboarding.back', 'menu.languageRo', 'menu.languageEn', 'onboarding.getStarted', 'menu.model'];

  const checkDifferences = (objEn: Record<string, unknown>, objRo: Record<string, unknown>, prefix = '') => {
    for (const key in objEn) {
      const currentPrefix = prefix ? `${prefix}.${key}` : key;
      const valEn = objEn[key];
      const valRo = objRo[key];

      if (typeof valEn === 'object' && valEn !== null && !Array.isArray(valEn)) {
        checkDifferences(valEn as Record<string, unknown>, valRo as Record<string, unknown>, currentPrefix);
      } else if (typeof valEn === 'string' && typeof valRo === 'string') {
        if (valEn.trim() === valRo.trim() && !isPlaceholder(valEn) && !knownIdentical.includes(currentPrefix)) {
          expect(valEn.toLowerCase(), `Key ${currentPrefix} is not translated (is identical to English)`).not.toBe(valRo.toLowerCase());
        }
      }
    }
  };

  checkDifferences(en, ro);
});

test('Critical safety and privacy sections must have distinct Romanian translations', () => {
  const criticalSections = ['crisis', 'supportScreen', 'privacyData'] as const;

  for (const section of criticalSections) {
    const enSection = en[section] as Record<string, string>;
    const roSection = ro[section] as Record<string, string> | undefined;

    if (!roSection) {
      throw new Error(`Critical section "${section}" is missing entirely from Romanian translations`);
    }

    for (const key of Object.keys(enSection)) {
      const enVal = enSection[key];
      const roVal = roSection[key];

      expect(roVal, `Key ${section}.${key} has no Romanian value`).toBeDefined();

      if (typeof roVal === 'string' && typeof enVal === 'string') {
        const enNorm = enVal.trim().toLowerCase();
        const roNorm = roVal.trim().toLowerCase();
        expect(
          roNorm,
          `Critical key ${section}.${key} is identical to English — likely a copy-paste error`
        ).not.toEqual(enNorm);

        if (roVal.trim() === '') {
          throw new Error(`Critical key ${section}.${key} has an empty Romanian translation`);
        }
      }
    }
  }
});
