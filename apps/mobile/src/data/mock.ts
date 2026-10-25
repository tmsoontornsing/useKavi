// Example data from the mockups. It stands in for Supabase until the backend is wired up.

export type Meal = {
  id: string;
  name: string;
  minutes: string;
  cost: number;
};

export type PlannedMeal = Meal & { day: string; dayLong: string };

export const DAYS = [
  ['Mon', 'Monday'],
  ['Tue', 'Tuesday'],
  ['Wed', 'Wednesday'],
  ['Thu', 'Thursday'],
  ['Fri', 'Friday'],
  ['Sat', 'Saturday'],
  ['Sun', 'Sunday'],
] as const;

export const MEALS: Record<string, Meal> = {
  fajitas: { id: 'fajitas', name: 'Sheet-pan chicken fajitas', minutes: '30 min', cost: 16 },
  tacos: { id: 'tacos', name: 'Black bean and sweet potato tacos', minutes: '25 min', cost: 11 },
  spaghetti: { id: 'spaghetti', name: 'Spaghetti with turkey meatballs', minutes: '35 min', cost: 15 },
  friedrice: { id: 'friedrice', name: 'Veggie fried rice with eggs', minutes: '20 min', cost: 9 },
  pizza: { id: 'pizza', name: 'Homemade margherita pizza', minutes: '40 min', cost: 14 },
  chili: { id: 'chili', name: 'Slow-cooker beef chili', minutes: '15 min prep', cost: 21 },
  salmon: { id: 'salmon', name: 'Lemon garlic salmon with broccoli', minutes: '25 min', cost: 26 },
  pesto: { id: 'pesto', name: 'Chicken pesto pasta', minutes: '25 min', cost: 13 },
  bowls: { id: 'bowls', name: 'Turkey taco bowls', minutes: '20 min', cost: 14 },
  ziti: { id: 'ziti', name: 'Baked ziti with spinach', minutes: '45 min', cost: 17 },
  lentil: { id: 'lentil', name: 'Lentil soup with crusty bread', minutes: '40 min', cost: 8 },
};

export const DEFAULT_PLAN = ['fajitas', 'tacos', 'spaghetti', 'friedrice', 'pizza', 'chili', 'salmon'];

export const SWAP_POOL = ['pesto', 'bowls', 'ziti', 'lentil'];

export type RecipeDetail = {
  serves: number;
  ingredients: { name: string; price: number | 'pantry' }[];
  steps: string[];
};

export const RECIPES: Record<string, RecipeDetail> = {
  fajitas: {
    serves: 4,
    ingredients: [
      { name: 'Chicken breast, 2 lb', price: 8.98 },
      { name: 'Bell peppers, 3', price: 3.75 },
      { name: 'Yellow onion, 1', price: 0.87 },
      { name: 'Flour tortillas, 8', price: 2.63 },
      { name: 'Olive oil, 2 tbsp', price: 'pantry' },
      { name: 'Garlic, 2 cloves', price: 'pantry' },
      { name: 'Chili powder, 1 tbsp', price: 'pantry' },
    ],
    steps: [
      'Heat the oven to 425°F and line a sheet pan with foil.',
      'Slice the chicken, peppers, and onion into thin strips.',
      'Toss with the olive oil, minced garlic, and chili powder, then spread on the pan.',
      'Roast 20 to 22 minutes, until the chicken reaches 165°F.',
      'Warm the tortillas and fill them at the table.',
    ],
  },
};

export type Aisle = { name: string; items: { name: string; price: number }[] };

export const GROCERIES: Aisle[] = [
  {
    name: 'Produce',
    items: [
      { name: 'Bell peppers, 3', price: 3.75 },
      { name: 'Sweet potatoes, 2 lb', price: 2.98 },
      { name: 'Yellow onions, 3 lb bag', price: 3.49 },
      { name: 'Broccoli crowns, 1.5 lb', price: 2.97 },
      { name: 'Lemons, 2', price: 1.38 },
      { name: 'Cilantro, 1 bunch', price: 0.85 },
    ],
  },
  {
    name: 'Meat and Seafood',
    items: [
      { name: 'Chicken breast, 2 lb', price: 8.98 },
      { name: 'Ground turkey, 1 lb', price: 5.49 },
      { name: 'Ground beef, 1.5 lb', price: 8.99 },
      { name: 'Salmon fillets, 1.25 lb', price: 12.49 },
    ],
  },
  {
    name: 'Dairy and Eggs',
    items: [
      { name: 'Eggs, 1 dozen', price: 3.29 },
      { name: 'Shredded mozzarella, 8 oz', price: 2.99 },
      { name: 'Sour cream, 16 oz', price: 3.19 },
      { name: 'Butter, 1 lb', price: 4.42 },
    ],
  },
  {
    name: 'Pantry',
    items: [
      { name: 'Black beans, 2 cans', price: 2.18 },
      { name: 'Kidney beans, 2 cans', price: 2.18 },
      { name: 'Crushed tomatoes, 2 cans', price: 3.58 },
      { name: 'Spaghetti, 1 lb', price: 1.49 },
      { name: 'Flour tortillas, 10 ct', price: 3.29 },
      { name: 'Pizza dough, 1 lb', price: 2.99 },
      { name: 'Chili seasoning', price: 1.29 },
      { name: 'Taco seasoning', price: 1.29 },
      { name: 'Soy sauce, 10 oz', price: 2.49 },
    ],
  },
  {
    name: 'Frozen',
    items: [
      { name: 'Mixed vegetables, 2 bags', price: 4.58 },
      { name: 'Peas, 12 oz', price: 1.79 },
      { name: 'Sweet corn, 12 oz', price: 1.79 },
    ],
  },
];

export type Shelf = { name: string; items: string[] };

export const PANTRY: Shelf[] = [
  { name: 'Staples', items: ['Rice', 'Olive oil', 'Flour', 'Sugar', 'Chicken broth'] },
  { name: 'Spices', items: ['Garlic', 'Salt', 'Black pepper', 'Chili powder', 'Cumin', 'Oregano'] },
  { name: 'Fridge', items: ['Ketchup', 'Mustard', 'Mayonnaise', 'Parmesan'] },
];

export const DIETS = [
  { id: 'any', name: 'Everything', detail: 'Meat, fish, and vegetarian dinners' },
  { id: 'vegetarian', name: 'Vegetarian', detail: 'No meat or fish' },
  { id: 'pescatarian', name: 'Pescatarian', detail: 'Fish and seafood, no other meat' },
  { id: 'vegan', name: 'Vegan', detail: 'No animal products' },
  { id: 'lowcarb', name: 'Lower carb', detail: 'Fewer pasta, rice, and bread dinners' },
  { id: 'halal', name: 'Halal', detail: 'Halal meat only, no pork' },
] as const;

export type DietId = (typeof DIETS)[number]['id'];

export const ALLERGIES = ['Peanuts', 'Tree nuts', 'Shellfish', 'Dairy', 'Gluten', 'Eggs', 'Soy'];
export const DISLIKES = ['Mushrooms', 'Olives', 'Eggplant', 'Spicy food', 'Tofu', 'Fish'];

export const PLANS = [
  { id: 'annual', name: 'Annual', detail: '$59 per year, about $4.92 per month', badge: 'Save 38%', cta: 'Subscribe for $59 per Year' },
  { id: 'monthly', name: 'Monthly', detail: '$7.99 per month', badge: '', cta: 'Subscribe for $7.99 per Month' },
] as const;

export const money = (n: number) => '$' + n.toFixed(2);
