// Tarot energy rules, shared by the User model, protectRoute (daily regeneration)
// and the Tarot controller. The web client reads `max` from the Tarot API.
export const ENERGY_MAX = 7;
export const DAILY_ENERGY_GAIN = 1;
export const TAROT_ENERGY_COST = ENERGY_MAX;
