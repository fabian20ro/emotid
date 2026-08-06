import { test, expect } from 'vitest';
import { emotionCatalog } from "../models/catalog";

test('Catalog integrity: all emotions have valid structure and translations', () => {
  for (const [id, emotion] of Object.entries(emotionCatalog)) {
    // 1. ID matches key
    expect(emotion.id, `Emotion ID mismatch for key: ${id}`).toBe(id);

    // 2. Basic fields existence
    expect(emotion.label, `Missing label for: ${id}`).toBeDefined();
    expect(emotion.color, `Missing color for: ${id}`).toBeDefined();

    // 3. Translations presence
    expect(emotion.label.en, `Missing en label for: ${id}`).toBeDefined();
    expect(emotion.label.ro, `Missing ro label for: ${id}`).toBeDefined();
    if (emotion.description) {
      expect(emotion.description.en, `Missing en description for: ${id}`).toBeDefined();
      expect(emotion.description.ro, `Missing ro description for: ${id}`).toBeDefined();
      expect(emotion.descriptionStatus, `Unreviewed description for: ${id}`).toBe('reviewed');
    }
    if (emotion.needs) {
      expect(emotion.needs.en, `Missing en needs for: ${id}`).toBeDefined();
      expect(emotion.needs.ro, `Missing ro needs for: ${id}`).toBeDefined();
      expect(emotion.guidanceStatus, `Unreviewed needs for: ${id}`).toBe('reviewed');
    }
    
    // 4. Non-empty translations (catch whitespace-only strings)
    expect(emotion.label.en.trim(), `Empty en label for: ${id}`).not.toBe('');
    expect(emotion.label.ro.trim(), `Empty ro label for: ${id}`).not.toBe('');
    if (emotion.description) {
      expect(emotion.description.en.trim(), `Empty en description for: ${id}`).not.toBe('');
      expect(emotion.description.ro.trim(), `Empty ro description for: ${id}`).not.toBe('');
    }
    if (emotion.needs) {
      expect(emotion.needs.en.trim(), `Empty en needs for: ${id}`).not.toBe('');
      expect(emotion.needs.ro.trim(), `Empty ro needs for: ${id}`).not.toBe('');
    }

    // 5. Color is a valid hex string (#RRGGBB or #RGB)
    expect(emotion.color, `Invalid color format for: ${id}`).toMatch(/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/);
  }
});

test('Catalog uniqueness: no duplicate IDs', () => {
  const ids = Object.values(emotionCatalog).map(e => e.id);
  const uniqueIds = new Set(ids);
  expect(ids.length, `Found ${ids.length} emotions, but only ${uniqueIds.size} are unique`).toBe(uniqueIds.size);
});
