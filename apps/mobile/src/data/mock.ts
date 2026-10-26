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

// Kitchen equipment a household can say it has. Dinners that need something a household lacks are flagged.
export const APPLIANCES = [
  { id: 'stovetop', name: 'Stovetop', detail: 'Burners for pots and pans' },
  { id: 'oven', name: 'Oven', detail: 'For roasting and baking' },
  { id: 'microwave', name: 'Microwave', detail: '' },
  { id: 'slow-cooker', name: 'Slow cooker', detail: 'Crock-Pot or similar' },
  { id: 'pressure-cooker', name: 'Pressure cooker', detail: 'Instant Pot or similar' },
  { id: 'air-fryer', name: 'Air fryer', detail: '' },
  { id: 'rice-cooker', name: 'Rice cooker', detail: '' },
  { id: 'grill', name: 'Grill', detail: 'Outdoor or indoor' },
  { id: 'blender', name: 'Blender', detail: 'Countertop or immersion' },
  { id: 'food-processor', name: 'Food processor', detail: '' },
] as const;

export type ApplianceId = (typeof APPLIANCES)[number]['id'];

export const applianceName = (id: string) => APPLIANCES.find((a) => a.id === id)?.name ?? id;

export type RecipeDetail = {
  serves: number;
  // Equipment the recipe needs. Anything the household has not ticked is flagged.
  appliances: ApplianceId[];
  ingredients: { name: string; price: number | 'pantry' }[];
  steps: string[];
};

export const RECIPES: Record<string, RecipeDetail> = {
  fajitas: {
    serves: 4,
    appliances: ['oven'],
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
  tacos: {
    serves: 4,
    appliances: ['oven', 'stovetop'],
    ingredients: [
      { name: 'Sweet potatoes, 2 lb', price: 2.98 },
      { name: 'Black beans, 2 cans', price: 2.18 },
      { name: 'Flour tortillas, 8', price: 2.63 },
      { name: 'Limes, 2', price: 1.38 },
      { name: 'Cilantro, 1 bunch', price: 0.85 },
      { name: 'Yellow onion, 1', price: 0.87 },
      { name: 'Olive oil, 1 tbsp', price: 'pantry' },
      { name: 'Cumin, 1 tsp', price: 'pantry' },
      { name: 'Salt, a pinch', price: 'pantry' },
    ],
    steps: [
      'Heat the oven to 425°F.',
      'Cut the sweet potatoes into small cubes, toss with the olive oil, half the cumin, and a pinch of salt, and roast 20 minutes until tender.',
      'Warm the black beans in a small pot with the remaining cumin and the chopped onion, about 5 minutes.',
      'Warm the tortillas in a dry pan.',
      'Fill with sweet potato and beans, then top with cilantro and a squeeze of lime.',
    ],
  },
  spaghetti: {
    serves: 4,
    appliances: ['stovetop'],
    ingredients: [
      { name: 'Spaghetti, 1 lb', price: 1.49 },
      { name: 'Ground turkey, 1 lb', price: 5.49 },
      { name: 'Crushed tomatoes, 2 cans', price: 3.58 },
      { name: 'Eggs, 1 dozen', price: 3.29 },
      { name: 'Yellow onion, 1', price: 0.87 },
      { name: 'Parmesan, ¼ cup', price: 'pantry' },
      { name: 'Garlic, 3 cloves', price: 'pantry' },
      { name: 'Oregano, 1 tsp', price: 'pantry' },
      { name: 'Olive oil, 1 tbsp', price: 'pantry' },
    ],
    steps: [
      'Mix the turkey with 1 egg, the grated parmesan, half the garlic, and a pinch of salt, then roll into about 16 small meatballs.',
      'Brown the meatballs in the olive oil over medium heat, about 6 minutes, turning once.',
      'Add the diced onion and remaining garlic, then the tomatoes and oregano. Simmer 15 minutes, until the meatballs are cooked through.',
      'Meanwhile, boil the spaghetti in salted water until al dente, then drain.',
      'Toss the spaghetti with the sauce and serve.',
    ],
  },
  friedrice: {
    serves: 4,
    appliances: ['stovetop'],
    ingredients: [
      { name: 'Eggs, 1 dozen', price: 3.29 },
      { name: 'Peas, 12 oz', price: 1.79 },
      { name: 'Soy sauce, 10 oz', price: 2.49 },
      { name: 'Green onions, 1 bunch', price: 0.99 },
      { name: 'Rice, 2 cups uncooked', price: 'pantry' },
      { name: 'Olive oil, 2 tbsp', price: 'pantry' },
      { name: 'Garlic, 2 cloves', price: 'pantry' },
    ],
    steps: [
      'Cook the rice ahead and spread it on a tray to cool. Day-old rice works best.',
      'Scramble 3 eggs in a hot pan with a little of the oil, then set them aside.',
      'Fry the garlic and the white parts of the green onions for 30 seconds, then add the peas and cook 2 minutes.',
      'Add the rice and 3 tablespoons of soy sauce and stir-fry until hot, about 4 minutes.',
      'Fold the eggs back in and top with the green onion tops.',
    ],
  },
  pizza: {
    serves: 4,
    appliances: ['oven'],
    ingredients: [
      { name: 'Pizza dough, 1 lb', price: 2.99 },
      { name: 'Shredded mozzarella, 16 oz', price: 5.98 },
      { name: 'Crushed tomatoes, 1 can', price: 1.79 },
      { name: 'Fresh basil, 1 bunch', price: 2.49 },
      { name: 'Yellow onion, 1', price: 0.87 },
      { name: 'Olive oil, 1 tbsp', price: 'pantry' },
      { name: 'Oregano, 1 tsp', price: 'pantry' },
      { name: 'Salt, a pinch', price: 'pantry' },
    ],
    steps: [
      'Heat the oven to 475°F with a baking sheet inside.',
      'Stretch the dough into a thin round on a sheet of parchment.',
      'Spread the tomatoes mixed with the oregano and salt, then top with the mozzarella and thin slices of onion.',
      'Slide it onto the hot sheet and bake 12 to 14 minutes, until the crust is browned and the cheese bubbles.',
      'Finish with torn basil and a drizzle of olive oil.',
    ],
  },
  chili: {
    serves: 6,
    appliances: ['stovetop', 'slow-cooker'],
    ingredients: [
      { name: 'Ground beef, 1.5 lb', price: 8.99 },
      { name: 'Kidney beans, 2 cans', price: 2.18 },
      { name: 'Black beans, 1 can', price: 1.09 },
      { name: 'Crushed tomatoes, 2 cans', price: 3.58 },
      { name: 'Yellow onions, 3 lb bag', price: 3.49 },
      { name: 'Chili seasoning, 1 packet', price: 1.29 },
      { name: 'Garlic, 4 cloves', price: 'pantry' },
      { name: 'Cumin, 1 tsp', price: 'pantry' },
      { name: 'Salt, to taste', price: 'pantry' },
    ],
    steps: [
      'Brown the beef with 2 chopped onions in a skillet, about 8 minutes, then drain the fat.',
      'Put the beef in the slow cooker with the drained beans, tomatoes, minced garlic, cumin, and chili seasoning.',
      'Stir, cover, and cook on low 7 to 8 hours, or on high 4 hours.',
      'Taste, add salt if it needs it, and serve.',
    ],
  },
  salmon: {
    serves: 4,
    appliances: ['oven'],
    ingredients: [
      { name: 'Salmon fillets, 1.25 lb', price: 12.49 },
      { name: 'Broccoli crowns, 1.5 lb', price: 2.97 },
      { name: 'Sweet potatoes, 2 lb', price: 2.98 },
      { name: 'Lemons, 2', price: 1.38 },
      { name: 'Butter, 1 lb', price: 4.42 },
      { name: 'Fresh parsley, 1 bunch', price: 1.29 },
      { name: 'Garlic, 3 cloves', price: 'pantry' },
      { name: 'Olive oil, 2 tbsp', price: 'pantry' },
      { name: 'Salt and pepper', price: 'pantry' },
    ],
    steps: [
      'Heat the oven to 425°F. Cube the sweet potatoes, toss with half the olive oil and a pinch of salt, and roast 15 minutes.',
      'Add the broccoli to the pan with the rest of the oil and roast 10 more minutes.',
      'Melt 2 tablespoons of butter with the minced garlic and the juice of 1 lemon.',
      'Season the salmon with salt and pepper, set it on a second pan, spoon over the lemon butter, and roast 12 minutes, until it flakes easily.',
      'Finish with chopped parsley and lemon wedges.',
    ],
  },
  pesto: {
    serves: 4,
    appliances: ['stovetop'],
    ingredients: [
      { name: 'Chicken breast, 2 lb', price: 8.98 },
      { name: 'Penne, 1 lb', price: 1.49 },
      { name: 'Basil pesto, 6 oz jar', price: 2.99 },
      { name: 'Parmesan, ¼ cup', price: 'pantry' },
      { name: 'Olive oil, 1 tbsp', price: 'pantry' },
      { name: 'Salt and pepper', price: 'pantry' },
    ],
    steps: [
      'Cut the chicken into bite-size pieces and season with salt and pepper.',
      'Boil the penne in salted water according to the package. Save ½ cup of the pasta water, then drain.',
      'Sear the chicken in the olive oil over medium-high heat, 6 to 7 minutes, until golden and 165°F inside.',
      'Lower the heat, add the pasta, the pesto, and a splash of pasta water, and toss until coated.',
      'Serve with parmesan.',
    ],
  },
  bowls: {
    serves: 4,
    appliances: ['stovetop'],
    ingredients: [
      { name: 'Ground turkey, 1 lb', price: 5.49 },
      { name: 'Black beans, 1 can', price: 1.09 },
      { name: 'Sweet corn, 12 oz', price: 1.79 },
      { name: 'Taco seasoning, 1 packet', price: 1.29 },
      { name: 'Salsa, 1 jar', price: 3.49 },
      { name: 'Limes, 1', price: 0.69 },
      { name: 'Rice, 2 cups uncooked', price: 'pantry' },
      { name: 'Olive oil, 1 tbsp', price: 'pantry' },
    ],
    steps: [
      'Cook the rice.',
      'Brown the turkey in the olive oil, breaking it up. Add the taco seasoning and ¼ cup of water and simmer 3 minutes.',
      'Warm the beans and corn together in a small pan.',
      'Build the bowls with rice, turkey, beans and corn, and salsa. Finish with a squeeze of lime.',
    ],
  },
  ziti: {
    serves: 6,
    appliances: ['oven', 'stovetop'],
    ingredients: [
      { name: 'Ziti or penne, 1 lb', price: 1.49 },
      { name: 'Crushed tomatoes, 2 cans', price: 3.58 },
      { name: 'Shredded mozzarella, 16 oz', price: 5.98 },
      { name: 'Ricotta, 15 oz', price: 3.49 },
      { name: 'Baby spinach, 10 oz', price: 2.99 },
      { name: 'Garlic, 3 cloves', price: 'pantry' },
      { name: 'Oregano, 1 tsp', price: 'pantry' },
      { name: 'Olive oil, 1 tbsp', price: 'pantry' },
      { name: 'Salt, to taste', price: 'pantry' },
    ],
    steps: [
      'Heat the oven to 375°F. Boil the ziti 2 minutes short of the package time, then drain.',
      'Warm the minced garlic in the olive oil in a large pot for 1 minute, then add the tomatoes, oregano, and salt and simmer 10 minutes.',
      'Stir the spinach into the sauce until wilted, then stir in the pasta.',
      'Spread half in a 9 by 13 inch dish, dot with ricotta, add the rest, and top with the mozzarella.',
      'Bake 20 to 25 minutes, until bubbling and browned on top.',
    ],
  },
  lentil: {
    serves: 6,
    appliances: ['stovetop'],
    ingredients: [
      { name: 'Brown lentils, 1 lb', price: 1.99 },
      { name: 'Carrots, 1 lb', price: 1.29 },
      { name: 'Yellow onion, 1', price: 0.87 },
      { name: 'Crushed tomatoes, 1 can', price: 1.79 },
      { name: 'Crusty bread, 1 loaf', price: 2.49 },
      { name: 'Chicken broth or water, 6 cups', price: 'pantry' },
      { name: 'Garlic, 3 cloves', price: 'pantry' },
      { name: 'Cumin, 2 tsp', price: 'pantry' },
      { name: 'Olive oil, 2 tbsp', price: 'pantry' },
    ],
    steps: [
      'Soften the diced onion and carrots in the olive oil, about 6 minutes.',
      'Add the minced garlic and cumin and stir for 30 seconds.',
      'Add the rinsed lentils, tomatoes, broth, and 1 teaspoon of salt. Bring to a boil, then simmer 30 minutes, until the lentils are tender.',
      'Taste, adjust the salt, and serve with the bread.',
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
