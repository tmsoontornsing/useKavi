// Run with: node --test supabase/scripts/recipe-csv.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseCatalog, parseCsv } from './recipe-csv.ts';

const ING = 'name,aisle,avg_price_usd,unit\nChicken,Meat,4.50,lb\nOil,Pantry,0.35,tbsp\n';
const REC = 'title,servings,minutes,tags,steps\nStir fry,4,20,Dinner| Vegetarian ,"Chop.\nCook, then serve."\n';
const LINES = 'recipe_title,ingredient_name,quantity,unit\nStir fry,chicken,1.5,LB\nStir fry,Oil,2,tbsp\n';

const catalog = (o: Partial<{ ingredients: string; recipes: string; recipeIngredients: string }> = {}) =>
  parseCatalog({ ingredients: ING, recipes: REC, recipeIngredients: LINES, ...o });

test('parseCsv handles quotes, escaped quotes, embedded newlines, CRLF, and BOM', () => {
  const rows = parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n"line1\nline2",z\r\n');
  assert.deepEqual(rows, [['a', 'b'], ['x, y', 'say "hi"'], ['line1\nline2', 'z']]);
});

test('parseCsv rejects an unterminated quote', () => {
  assert.throws(() => parseCsv('a,b\n"oops,1\n'), /unterminated/);
});

test('a valid catalog parses, normalizes tags, and matches names case-insensitively', () => {
  const { catalog: c, errors } = catalog();
  assert.deepEqual(errors, []);
  assert.deepEqual(c.recipes[0].tags, ['dinner', 'vegetarian']);
  assert.equal(c.recipes[0].steps, 'Chop.\nCook, then serve.');
  assert.equal(c.recipeIngredients[0].ingredient_name, 'Chicken');
  assert.equal(c.recipeIngredients[0].unit, 'lb');
});

test('missing column is reported with the columns that were found', () => {
  const { errors } = catalog({ ingredients: 'name,aisle,unit\nA,B,lb\n' });
  assert.match(errors[0], /ingredients\.csv: missing column\(s\): avg_price_usd/);
});

test('bad numbers, duplicates, and unknown references are all reported', () => {
  const { errors } = catalog({
    ingredients: ING + 'chicken,Meat,x,lb\nSalt,Pantry,-1,tsp\n',
    recipes: REC + 'Stir fry,2,10,,steps\nSoup,0,10,,steps\n',
    recipeIngredients: LINES + 'Ghost,Oil,1,tbsp\nStir fry,Mystery,1,tbsp\nStir fry,Oil,0,tbsp\n',
  });
  const text = errors.join('\n');
  assert.match(text, /duplicate ingredient "chicken"/);
  assert.match(text, /ingredients\.csv row 4: avg_price_usd must be a number/);
  assert.match(text, /duplicate recipe "Stir fry"/);
  assert.match(text, /servings must be a whole number above 0/);
  assert.match(text, /recipe "Ghost" is not in recipes\.csv/);
  assert.match(text, /ingredient "Mystery" is not in ingredients\.csv/);
  assert.match(text, /quantity must be a number from 0\.01/);
  assert.match(text, /appears twice/);
});

test('a recipe line must use the ingredient pricing unit', () => {
  const { errors } = catalog({ recipeIngredients: 'recipe_title,ingredient_name,quantity,unit\nStir fry,Chicken,1,oz\nStir fry,Oil,1,tbsp\n' });
  assert.match(errors.join('\n'), /unit "oz" does not match Chicken's pricing unit "lb"/);
});

test('a recipe with no ingredient lines is an error', () => {
  const { errors } = catalog({ recipeIngredients: 'recipe_title,ingredient_name,quantity,unit\n' });
  assert.match(errors.join('\n'), /recipe "Stir fry" has no valid ingredient lines/);
});

test('an unquoted comma gives a clear error instead of shifting columns', () => {
  const { errors } = catalog({ ingredients: 'name,aisle,avg_price_usd,unit\nSalt, fine,Pantry,1,lb\n' });
  assert.match(errors.join('\n'), /5 values but only 4 columns/);
});

test('prices accept a dollar sign', () => {
  const { catalog: c, errors } = catalog({ ingredients: 'name,aisle,avg_price_usd,unit\nChicken,Meat,"$4.50",lb\nOil,Pantry,0.35,tbsp\n' });
  assert.deepEqual(errors, []);
  assert.equal(c.ingredients[0].avg_price_usd, 4.5);
});
