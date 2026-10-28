// What the + menu offers on each pantry shelf. Names match the recipe catalog exactly, so an item added here comes off
// the grocery list when a recipe needs it. Saved in English; shown with tx().
// i18n: content
export const COMMON: Record<string, string[]> = {
  Staples: [
    'Rice', 'Quinoa', 'Spaghetti', 'Penne', 'Egg noodles', 'Lentils', 'Rolled oats', 'Flour', 'Sugar', 'Cornstarch',
    'Baking powder', 'Olive oil', 'Sesame oil', 'Soy sauce', 'Rice vinegar', 'Honey', 'Maple syrup', 'Canned tuna',
    'Black beans (canned)', 'Kidney beans (canned)', 'Chickpeas (canned)', 'Diced tomatoes (canned)', 'Tomato paste',
    'Marinara sauce', 'Chicken broth', 'Vegetable broth', 'Almonds', 'Sandwich bread', 'Flour tortillas', 'Corn tortillas',
  ],
  Spices: [
    'Salt', 'Black pepper', 'Cumin', 'Chili powder', 'Paprika', 'Oregano', 'Italian seasoning', 'Curry powder',
    'Red pepper flakes', 'Cinnamon',
  ],
  Fridge: [
    'Eggs', 'Butter', 'Milk', 'Plain yogurt', 'Cheddar', 'Mozzarella', 'Parmesan', 'Feta', 'Tofu (firm)', 'Orange juice',
    'Ketchup', 'Mustard', 'Mayonnaise', 'Salsa', 'Hummus', 'Bacon', 'Deli turkey',
  ],
  Freezer: ['Frozen peas and carrots', 'Frozen corn', 'Frozen berries', 'Pizza dough', 'Chicken breast', 'Ground beef', 'Shrimp'],
  Produce: [
    'Garlic', 'Ginger', 'Yellow onion', 'Red onion', 'Green onions', 'Bell pepper', 'Carrots', 'Celery', 'Russet potato',
    'Sweet potato', 'Tomato', 'Cucumber', 'Spinach', 'Lemon', 'Lime', 'Avocado', 'Bananas', 'Apples',
  ],
};

// Which shelf a typed name probably belongs on: a known item first, then a few giveaway words. Null when unsure.
export function guessShelf(name: string): string | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  for (const [shelf, items] of Object.entries(COMMON)) if (items.some((i) => i.toLowerCase() === n)) return shelf;
  if (/\b(frozen|ice cream)\b/.test(n)) return 'Freezer';
  if (/\b(powder|seasoning|spice|pepper flakes|cinnamon|turmeric|nutmeg|paprika|cumin|oregano|thyme|rosemary)\b/.test(n)) return 'Spices';
  if (/\b(milk|cheese|yogurt|butter|cream|egg|eggs|juice|sauce|dressing|ham|sausage|tofu)\b/.test(n)) return 'Fridge';
  if (/\b(onion|lettuce|apple|banana|berries|pepper|tomato|potato|carrot|herb|garlic|fruit|vegetable|mushroom)\b/.test(n)) return 'Produce';
  if (/\b(rice|pasta|noodle|flour|sugar|oil|vinegar|beans|lentils|oats|cereal|canned|bread|tortilla|broth)\b/.test(n)) return 'Staples';
  return null;
}
