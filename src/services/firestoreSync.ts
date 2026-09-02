import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb, isFirebaseConfigValid } from "../firebase";
import { Expense, Income, UserBudget } from "../types";

export type SyncStatus = "synced" | "syncing" | "offline" | "error" | "unconfigured";

export interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  cloudExpensesCount: number;
  cloudIncomesCount: number;
  errorMessage: string | null;
}

const getSyncKey = (userId?: string) => `khata_firestore_last_sync_${userId || "default"}`;

export const getStoredLastSyncTime = (userId?: string): string | null => {
  try {
    return localStorage.getItem(getSyncKey(userId));
  } catch (e) {
    return null;
  }
};

export const setStoredLastSyncTime = (timestamp: string, userId?: string) => {
  try {
    localStorage.setItem(getSyncKey(userId), timestamp);
  } catch (e) {}
};

/**
 * Deeply sanitizes any object or array for Firestore:
 * - Drops any keys with `undefined` values (which Firestore rejects)
 * - Ensures plain serializable JS objects
 */
export function sanitizeForFirestore<T>(data: T): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (typeof data !== "object") {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item));
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      if (typeof value === "object" && value !== null) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Safely sanitizes and normalizes an Expense record for Firestore
 */
export const sanitizeExpense = (
  exp: Partial<Expense>,
  userId: string = "user-ramkeval"
): Record<string, any> => {
  const clean: Record<string, any> = {
    id: exp.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: exp.title ? String(exp.title).trim() : "Daily Spend",
    amount: typeof exp.amount === "number" && !isNaN(exp.amount) ? exp.amount : 0,
    category: exp.category || "Other Spends",
    paymentMode: exp.paymentMode || "UPI",
    date: exp.date || new Date().toISOString().split("T")[0],
    userId: userId || exp.userId || "user-ramkeval",
    syncedAt: new Date().toISOString(),
  };

  if (exp.time && String(exp.time).trim()) {
    clean.time = String(exp.time).trim();
  }
  if (exp.merchantOrLocation && String(exp.merchantOrLocation).trim()) {
    clean.merchantOrLocation = String(exp.merchantOrLocation).trim();
  }
  if (exp.notes && String(exp.notes).trim()) {
    clean.notes = String(exp.notes).trim();
  }
  if (typeof exp.isRecurring === "boolean") {
    clean.isRecurring = exp.isRecurring;
  }

  return sanitizeForFirestore(clean);
};

/**
 * Safely sanitizes and normalizes an Income record for Firestore
 */
export const sanitizeIncome = (
  inc: Partial<Income>,
  userId: string = "user-ramkeval"
): Record<string, any> => {
  const clean: Record<string, any> = {
    id: inc.id || `inc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: inc.title ? String(inc.title).trim() : "Income Inflow",
    amount: typeof inc.amount === "number" && !isNaN(inc.amount) ? inc.amount : 0,
    category: inc.category || "Salary & Bonus",
    paymentMode: inc.paymentMode || "UPI",
    date: inc.date || new Date().toISOString().split("T")[0],
    userId: userId || inc.userId || "user-ramkeval",
    syncedAt: new Date().toISOString(),
  };

  if (inc.streamType) {
    clean.streamType = inc.streamType;
  }
  if (inc.time && String(inc.time).trim()) {
    clean.time = String(inc.time).trim();
  }
  if (inc.sourceOrClient && String(inc.sourceOrClient).trim()) {
    clean.sourceOrClient = String(inc.sourceOrClient).trim();
  }
  if (inc.notes && String(inc.notes).trim()) {
    clean.notes = String(inc.notes).trim();
  }
  if (typeof inc.isRecurring === "boolean") {
    clean.isRecurring = inc.isRecurring;
  }

  return sanitizeForFirestore(clean);
};

/**
 * Safely sanitizes and normalizes Budget settings for Firestore
 */
export const sanitizeBudget = (
  budget: Partial<UserBudget>,
  userId: string = "user-ramkeval"
): Record<string, any> => {
  const clean: Record<string, any> = {
    userId: userId || "user-ramkeval",
    monthlyBudget:
      typeof budget.monthlyBudget === "number" && !isNaN(budget.monthlyBudget)
        ? budget.monthlyBudget
        : 25000,
    targetSavingsPercent:
      typeof budget.targetSavingsPercent === "number" && !isNaN(budget.targetSavingsPercent)
        ? budget.targetSavingsPercent
        : 20,
    currency: budget.currency || "INR",
    salaryDay:
      typeof budget.salaryDay === "number" && !isNaN(budget.salaryDay)
        ? budget.salaryDay
        : 1,
    updatedAt: new Date().toISOString(),
  };

  if (typeof budget.monthlyIncome === "number" && !isNaN(budget.monthlyIncome)) {
    clean.monthlyIncome = budget.monthlyIncome;
  }

  return sanitizeForFirestore(clean);
};

/**
 * Saves a single expense to Firestore under the isolated path: users/{userId}/expenses/{expense.id}
 */
export const syncExpenseToFirestore = async (
  expense: Expense,
  userId: string = "user-ramkeval"
): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid() || !userId) {
    return false;
  }

  try {
    const expenseDocRef = doc(db, "users", userId, "expenses", expense.id);
    const sanitizedData = sanitizeExpense(expense, userId);
    await setDoc(expenseDocRef, sanitizedData, { merge: true });
    setStoredLastSyncTime(new Date().toISOString(), userId);
    return true;
  } catch (err) {
    console.error(`Failed to sync expense ${expense.id} for user ${userId} to Firestore:`, err);
    return false;
  }
};

/**
 * Deletes an expense from Firestore under users/{userId}/expenses/{expenseId}
 */
export const deleteExpenseFromFirestore = async (
  expenseId: string,
  userId: string = "user-ramkeval"
): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid() || !userId) {
    return false;
  }

  try {
    const expenseDocRef = doc(db, "users", userId, "expenses", expenseId);
    await deleteDoc(expenseDocRef);
    setStoredLastSyncTime(new Date().toISOString(), userId);
    return true;
  } catch (err) {
    console.error(`Failed to delete expense ${expenseId} for user ${userId} from Firestore:`, err);
    return false;
  }
};

/**
 * Saves a single income to Firestore under users/{userId}/incomes/{income.id}
 */
export const syncIncomeToFirestore = async (
  income: Income,
  userId: string = "user-ramkeval"
): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid() || !userId) {
    return false;
  }

  try {
    const incomeDocRef = doc(db, "users", userId, "incomes", income.id);
    const sanitizedData = sanitizeIncome(income, userId);
    await setDoc(incomeDocRef, sanitizedData, { merge: true });
    setStoredLastSyncTime(new Date().toISOString(), userId);
    return true;
  } catch (err) {
    console.error(`Failed to sync income ${income.id} for user ${userId} to Firestore:`, err);
    return false;
  }
};

/**
 * Deletes an income from Firestore under users/{userId}/incomes/{incomeId}
 */
export const deleteIncomeFromFirestore = async (
  incomeId: string,
  userId: string = "user-ramkeval"
): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid() || !userId) {
    return false;
  }

  try {
    const incomeDocRef = doc(db, "users", userId, "incomes", incomeId);
    await deleteDoc(incomeDocRef);
    setStoredLastSyncTime(new Date().toISOString(), userId);
    return true;
  } catch (err) {
    console.error(`Failed to delete income ${incomeId} for user ${userId} from Firestore:`, err);
    return false;
  }
};

/**
 * Saves Budget and Settings to Firestore under users/{userId}/settings/budget
 */
export const syncBudgetToFirestore = async (
  budget: UserBudget,
  userId: string = "user-ramkeval"
): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid() || !userId) {
    return false;
  }

  try {
    const budgetDocRef = doc(db, "users", userId, "settings", "budget");
    const sanitizedData = sanitizeBudget(budget, userId);
    await setDoc(budgetDocRef, sanitizedData, { merge: true });
    return true;
  } catch (err) {
    console.error(`Failed to sync budget for user ${userId} to Firestore:`, err);
    return false;
  }
};

/**
 * Subscribes to real-time updates for a specific user's expenses (users/{userId}/expenses)
 */
export const subscribeToExpensesCollection = (
  userId: string,
  onData: (expenses: Expense[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid() || !userId) {
    return null;
  }

  try {
    const expensesColRef = collection(db, "users", userId, "expenses");
    return onSnapshot(
      expensesColRef,
      (snapshot) => {
        const fetched: Expense[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data() as Expense;
          fetched.push({
            ...data,
            id: docSnapshot.id || data.id,
            userId,
          });
        });
        // Sort descending by date
        fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onData(fetched);
      },
      (error) => {
        console.error(`Firestore expenses onSnapshot error for user ${userId}:`, error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error(`Failed to setup expenses subscription for user ${userId}:`, err);
    if (onError) onError(err);
    return null;
  }
};

/**
 * Subscribes to real-time updates for a specific user's incomes (users/{userId}/incomes)
 */
export const subscribeToIncomesCollection = (
  userId: string,
  onData: (incomes: Income[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid() || !userId) {
    return null;
  }

  try {
    const incomesColRef = collection(db, "users", userId, "incomes");
    return onSnapshot(
      incomesColRef,
      (snapshot) => {
        const fetched: Income[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data() as Income;
          fetched.push({
            ...data,
            id: docSnapshot.id || data.id,
            userId,
          });
        });
        // Sort descending by date
        fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onData(fetched);
      },
      (error) => {
        console.error(`Firestore incomes onSnapshot error for user ${userId}:`, error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error(`Failed to setup incomes subscription for user ${userId}:`, err);
    if (onError) onError(err);
    return null;
  }
};

/**
 * Full Manual Push / Backup: Uploads user's local expenses, incomes, and budget into Firestore
 * Uses chunks of up to 400 operations per batch to safely stay below Firestore's 500 batch limit,
 * with complete data sanitization against undefined values.
 */
export const pushAllLocalDataToFirestore = async (
  expenses: Expense[],
  incomes: Income[],
  budget: UserBudget,
  userId: string = "user-ramkeval"
): Promise<{ success: boolean; syncedExpenses: number; syncedIncomes: number; error?: string }> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid() || !userId) {
    return {
      success: false,
      syncedExpenses: 0,
      syncedIncomes: 0,
      error: "Firebase Firestore is not initialized or user ID is missing.",
    };
  }

  try {
    const nowIso = new Date().toISOString();
    let syncedExpCount = 0;
    let syncedIncCount = 0;

    // Collect all sanitized operations:
    const operations: { ref: any; data: Record<string, any> }[] = [];

    // 1. Prepare sanitized expenses
    for (const exp of expenses) {
      if (!exp || !exp.id) continue;
      try {
        const ref = doc(db, "users", userId, "expenses", exp.id);
        const cleanData = sanitizeExpense(exp, userId);
        operations.push({ ref, data: cleanData });
        syncedExpCount++;
      } catch (err) {
        console.warn(`Skipping malformed expense during backup:`, exp, err);
      }
    }

    // 2. Prepare sanitized incomes
    for (const inc of incomes) {
      if (!inc || !inc.id) continue;
      try {
        const ref = doc(db, "users", userId, "incomes", inc.id);
        const cleanData = sanitizeIncome(inc, userId);
        operations.push({ ref, data: cleanData });
        syncedIncCount++;
      } catch (err) {
        console.warn(`Skipping malformed income during backup:`, inc, err);
      }
    }

    // 3. Prepare sanitized budget settings
    try {
      const budgetRef = doc(db, "users", userId, "settings", "budget");
      const cleanBudget = sanitizeBudget(budget, userId);
      operations.push({ ref: budgetRef, data: cleanBudget });
    } catch (err) {
      console.warn(`Skipping budget settings during backup:`, err);
    }

    // 4. Commit operations in batches of 400
    const BATCH_SIZE = 400;
    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
      const chunk = operations.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const op of chunk) {
        batch.set(op.ref, op.data, { merge: true });
      }
      await batch.commit();
    }

    // Save timestamp locally
    setStoredLastSyncTime(nowIso, userId);

    return {
      success: true,
      syncedExpenses: syncedExpCount,
      syncedIncomes: syncedIncCount,
    };
  } catch (err: any) {
    console.error(`Failed to push data to Firestore for user ${userId}:`, err);
    return {
      success: false,
      syncedExpenses: 0,
      syncedIncomes: 0,
      error: err?.message || "Failed to batch upload to Firestore.",
    };
  }
};

/**
 * Pull all data for a specific user from Firestore
 */
export const fetchAllFromFirestore = async (
  userId: string = "user-ramkeval"
): Promise<{
  success: boolean;
  expenses: Expense[];
  incomes: Income[];
  error?: string;
}> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid() || !userId) {
    return {
      success: false,
      expenses: [],
      incomes: [],
      error: "Firestore is not connected or user is not specified.",
    };
  }

  try {
    const expSnap = await getDocs(collection(db, "users", userId, "expenses"));
    const fetchedExpenses: Expense[] = [];
    expSnap.forEach((d) => {
      const data = d.data() as Expense;
      fetchedExpenses.push({ ...data, id: d.id || data.id, userId });
    });

    const incSnap = await getDocs(collection(db, "users", userId, "incomes"));
    const fetchedIncomes: Income[] = [];
    incSnap.forEach((d) => {
      const data = d.data() as Income;
      fetchedIncomes.push({ ...data, id: d.id || data.id, userId });
    });

    setStoredLastSyncTime(new Date().toISOString(), userId);

    return {
      success: true,
      expenses: fetchedExpenses,
      incomes: fetchedIncomes,
    };
  } catch (err: any) {
    return {
      success: false,
      expenses: [],
      incomes: [],
      error: err?.message || "Failed to fetch from Firestore.",
    };
  }
};

/**
 * Permanently deletes all expenses and incomes stored on Firestore for a given user.
 */
export const deleteUserFirestoreData = async (userId: string): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid() || !userId) {
    return false;
  }

  try {
    const batch = writeBatch(db);

    const expSnap = await getDocs(collection(db, "users", userId, "expenses"));
    expSnap.forEach((d) => {
      batch.delete(d.ref);
    });

    const incSnap = await getDocs(collection(db, "users", userId, "incomes"));
    incSnap.forEach((d) => {
      batch.delete(d.ref);
    });

    const budgetRef = doc(db, "users", userId, "settings", "budget");
    batch.delete(budgetRef);

    await batch.commit();
    return true;
  } catch (err) {
    console.error(`Failed to delete Firestore data for user ${userId}:`, err);
    return false;
  }
};
