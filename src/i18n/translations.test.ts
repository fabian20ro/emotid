import { describe, it, expect } from 'vitest';
import en from './en.json';
import ro from './ro.json';

/**
 * Collects every `{word}` placeholder found in string values of a nested
 * object tree. Used to verify that translation files expose the same
 * template variables across languages.
 */
const collectPlaceholders = (obj: unknown, path = ''): Set<string> => {
  const placeholders = new Set<string>();
  if (typeof obj === 'string') {
    const re = /\{([^}]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(obj)) !== null) {
      placeholders.add(match[1]);
    }
    return placeholders;
  }
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj as object)) {
      const value = (obj as Record<string, unknown>)[key];
      const nested = collectPlaceholders(value, path ? `${path}.${key}` : key);
      for (const p of nested) placeholders.add(p);
    }
  }
  return placeholders;
};

describe('i18n integrity', () => {
  const languages = [
    { name: 'en', data: en },
    { name: 'ro', data: ro }
  ];

  languages.forEach(({ name, data }) => {
    describe(`Language: ${name}`, () => {
      it('should have the required aiPrompt key in analyze', () => {
        expect(data.analyze).toHaveProperty('aiPrompt');
      });

      it('should contain the {emotions} placeholder for replacement', () => {
        expect(data.analyze.aiPrompt).toContain('{emotions}');
      });

      it('should have the required aiPromptMultiple key in analyze', () => {
        expect(data.analyze).toHaveProperty('aiPromptMultiple');
      });

      it('should have identical keys for all nested objects (en vs ro)', () => {
        const checkKeys = (obj1: any, obj2: any, path = '') => { // eslint-disable-line @typescript-eslint/no-explicit-any
          Object.keys(obj1).forEach(key => {
            const currentPath = path ? `${path}.${key}` : key;
            if (typeof obj1[key] === 'object' && obj1[key] !== null && !Array.isArray(obj1[key])) {
              if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key])) {
                checkKeys(obj1[key], obj2[key], currentPath);
              } else {
                throw new Error(`Key ${currentPath} is an object in en.json but not in ro.json`);
              }
            } else {
              if (key in obj2 === false) {
                throw new Error(`Key ${currentPath} is missing in ro.json`);
              }
            }
          });
        };
        checkKeys(en, ro);
      });

      it('should expose the same template placeholders across languages', () => {
        const enPlaceholders = collectPlaceholders(en);
        const roPlaceholders = collectPlaceholders(ro);

        const onlyInEn = [...enPlaceholders].filter(p => !roPlaceholders.has(p));
        const onlyInRo = [...roPlaceholders].filter(p => !enPlaceholders.has(p));

        expect(onlyInEn, `Missing placeholders in ro.json: ${onlyInEn.join(', ')}`).toHaveLength(0);
        expect(onlyInRo, `Missing placeholders in en.json: ${onlyInRo.join(', ')}`).toHaveLength(0);
      });
    });
  });
});
