import { Expense, Income, UserBudget, CategoryMeta, IncomeCategoryMeta, AppSecuritySettings } from "../types";
import { INITIAL_EXPENSES, INITIAL_INCOMES } from "../data/initialExpenses";
import { CATEGORY_LIST, INCOME_CATEGORY_LIST } from "../data/categories";

export const getUserExpensesStorageKey = (userId: string) => `khata_user_expenses_${userId}`;
export const getUserIncomesStorageKey = (userId: string) => `khata_user_incomes_${userId}`;
export const getUserBudgetStorageKey = (userId: string) => `khata_user_budget_${userId}`;
export const getUserCategoriesStorageKey = (userId: string) => `khata_user_exp_cat_${userId}`;
export const getUserIncCategoriesStorageKey = (userId: string) => `khata_user_inc_cat_${userId}`;
export const getUserSecurityStorageKey = (userId: string) => `khata_user_security_${userId}`;

const LEGACY_EXPENSES_KEY = "khata_indian_expenses_v1";
const LEGACY_INCOMES_KEY = "khata_indian_incomes_v1";
const LEGACY_BUDGET_KEY = "khata_indian_budget_v1";

/**
 * Loads isolated expenses for a specific user ID.
 * If the user is the primary default user (user-ramkeval) and hasn't saved yet, falls back to initial/legacy data.
 * All other/new users start with an empty array [] (clean slate).
 */
export function loadUserExpenses(userId: string): Expense[] {
  try {
    const userKey = getUserExpensesStorageKey(userId);
    const saved = localStorage.getItem(userKey);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // Default primary profile legacy migration / seed
    if (userId === "user-ramkeval") {
      const legacy = localStorage.getItem(LEGACY_EXPENSES_KEY);
      if (legacy !== null) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          localStorage.setItem(userKey, JSON.stringify(parsedLegacy));
          return parsedLegacy;
        }
      }
      localStorage.setItem(userKey, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
  } catch (e) {
    console.error(`Failed to load expenses for user ${userId}`, e);
  }

  // Any other profile or empty state: return clean slate
  return [];
}

/**
 * Saves isolated expenses for a specific user ID into their storage key.
 */
export function saveUserExpenses(userId: string, expenses: Expense[]): void {
  if (!userId) return;
  try {
    const userKey = getUserExpensesStorageKey(userId);
    localStorage.setItem(userKey, JSON.stringify(expenses));
  } catch (e) {
    console.error(`Failed to save expenses for user ${userId}`, e);
  }
}

/**
 * Loads isolated incomes for a specific user ID.
 * If user-ramkeval has no saved incomes, seeds from initial incomes.
 * Other users start with an empty array [] (clean slate).
 */
export function loadUserIncomes(userId: string): Income[] {
  try {
    const userKey = getUserIncomesStorageKey(userId);
    const saved = localStorage.getItem(userKey);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // Default primary profile legacy migration / seed
    if (userId === "user-ramkeval") {
      const legacy = localStorage.getItem(LEGACY_INCOMES_KEY);
      if (legacy !== null) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          localStorage.setItem(userKey, JSON.stringify(parsedLegacy));
          return parsedLegacy;
        }
      }
      localStorage.setItem(userKey, JSON.stringify(INITIAL_INCOMES));
      return INITIAL_INCOMES;
    }
  } catch (e) {
    console.error(`Failed to load incomes for user ${userId}`, e);
  }

  return [];
}

/**
 * Saves isolated incomes for a specific user ID into their storage key.
 */
export function saveUserIncomes(userId: string, incomes: Income[]): void {
  if (!userId) return;
  try {
    const userKey = getUserIncomesStorageKey(userId);
    localStorage.setItem(userKey, JSON.stringify(incomes));
  } catch (e) {
    console.error(`Failed to save incomes for user ${userId}`, e);
  }
}

/**
 * Loads isolated budget settings for a specific user ID.
 */
export function loadUserBudget(userId: string, defaultBudget: UserBudget): UserBudget {
  try {
    const userKey = getUserBudgetStorageKey(userId);
    const saved = localStorage.getItem(userKey);
    if (saved !== null) {
      return JSON.parse(saved);
    }
    if (userId === "user-ramkeval") {
      const legacy = localStorage.getItem(LEGACY_BUDGET_KEY);
      if (legacy !== null) {
        return JSON.parse(legacy);
      }
    }
  } catch (e) {
    console.error(`Failed to load budget for user ${userId}`, e);
  }
  return defaultBudget;
}

/**
 * Saves isolated budget settings for a specific user ID.
 */
export function saveUserBudget(userId: string, budget: UserBudget): void {
  if (!userId) return;
  try {
    localStorage.setItem(getUserBudgetStorageKey(userId), JSON.stringify(budget));
  } catch (e) {
    console.error(`Failed to save budget for user ${userId}`, e);
  }
}

/**
 * Loads isolated custom expense categories for a user.
 */
export function loadUserCategories(userId: string, defaultCategories: CategoryMeta[] = CATEGORY_LIST): CategoryMeta[] {
  try {
    const userKey = getUserCategoriesStorageKey(userId);
    const saved = localStorage.getItem(userKey);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(`Failed to load categories for user ${userId}`, e);
  }
  return defaultCategories;
}

/**
 * Saves isolated custom expense categories for a user.
 */
export function saveUserCategories(userId: string, categories: CategoryMeta[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(getUserCategoriesStorageKey(userId), JSON.stringify(categories));
  } catch (e) {
    console.error(`Failed to save categories for user ${userId}`, e);
  }
}

/**
 * Loads isolated custom income categories for a user.
 */
export function loadUserIncCategories(
  userId: string,
  defaultCategories: IncomeCategoryMeta[] = INCOME_CATEGORY_LIST
): IncomeCategoryMeta[] {
  try {
    const userKey = getUserIncCategoriesStorageKey(userId);
    const saved = localStorage.getItem(userKey);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(`Failed to load income categories for user ${userId}`, e);
  }
  return defaultCategories;
}

/**
 * Saves isolated custom income categories for a user.
 */
export function saveUserIncCategories(userId: string, categories: IncomeCategoryMeta[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(getUserIncCategoriesStorageKey(userId), JSON.stringify(categories));
  } catch (e) {
    console.error(`Failed to save income categories for user ${userId}`, e);
  }
}

/**
 * Loads isolated security settings for a user.
 */
export function loadUserSecurity(
  userId: string,
  defaultSecurity: AppSecuritySettings
): AppSecuritySettings {
  try {
    const userKey = getUserSecurityStorageKey(userId);
    const saved = localStorage.getItem(userKey);
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(`Failed to load security for user ${userId}`, e);
  }
  return defaultSecurity;
}

/**
 * Saves isolated security settings for a user.
 */
export function saveUserSecurity(userId: string, security: AppSecuritySettings): void {
  if (!userId) return;
  try {
    localStorage.setItem(getUserSecurityStorageKey(userId), JSON.stringify(security));
  } catch (e) {
    console.error(`Failed to save security for user ${userId}`, e);
  }
}
