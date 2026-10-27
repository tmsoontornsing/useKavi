// Checks the app's pantry allergen matching against the planner's word lists.
// Run with: node --test supabase/scripts/allergens.test.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { ALLERGEN_WORDS as app, allergensIn } from '../../apps/mobile/src/lib/allergens.ts';

// plan-logic.ts imports a Deno-only module, so read its word list out of the source instead of importing it.
const source = readFileSync(join(import.meta.dirname, '../functions/_shared/plan-logic.ts'), 'utf8');
const body = source.match(/export const ALLERGEN_WORDS: Record<string, string\[\]> = \{([\s\S]*?)\n\};/)?.[1];
const server = body ? (new Function(`return {${body}}`)() as Record<string, string[]>) : {};

test('the app and the planner use the same allergen word lists', () => {
  assert.ok(Object.keys(server).length > 0, 'could not read the planner word list');
  assert.deepEqual(app, server);
});

test('foods are matched to the household\'s allergies by name', () => {
  assert.deepEqual(allergensIn('Parmesan', ['Dairy', 'Eggs']), ['Dairy']);
  assert.deepEqual(allergensIn('Mayonnaise', ['Dairy', 'Eggs']), ['Eggs']);
  assert.deepEqual(allergensIn('Soy sauce', ['Soy', 'Gluten', 'Dairy']), ['Soy', 'Gluten']);
  assert.deepEqual(allergensIn('Almonds', ['Tree nuts', 'Peanuts']), ['Tree nuts']);
  assert.deepEqual(allergensIn('Rolled oats', ['Gluten']), ['Gluten']);
});

test('plurals match, and unrelated foods do not', () => {
  assert.deepEqual(allergensIn('Eggs', ['Eggs']), ['Eggs']);
  assert.deepEqual(allergensIn('Olive oil', ['Dairy', 'Soy', 'Eggs', 'Gluten']), []);
  assert.deepEqual(allergensIn('Brown rice', ['Gluten', 'Dairy']), []);
  assert.deepEqual(allergensIn('Peanut butter', ['Peanuts', 'Dairy']), ['Peanuts', 'Dairy']);
});

test('an allergy with no word list is matched on its own name, and no allergies means no matches', () => {
  assert.deepEqual(allergensIn('Sesame oil', ['Sesame']), ['Sesame']);
  assert.deepEqual(allergensIn('Parmesan', []), []);
});
