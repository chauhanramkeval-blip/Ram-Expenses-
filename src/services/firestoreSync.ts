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
    await setDoc(
      expenseDocRef,
      {
        ...expense,
        userId,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
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
    await setDoc(
      incomeDocRef,
      {
        ...income,
        userId,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
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
    await setDoc(
      budgetDocRef,
      {
        ...budget,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
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
    const batch = writeBatch(db);
    const nowIso = new Date().toISOString();

    // Batch write user's expenses
    for (const exp of expenses) {
      const ref = doc(db, "users", userId, "expenses", exp.id);
      batch.set(ref, { ...exp, userId, syncedAt: nowIso }, { merge: true });
    }

    // Batch write user's incomes
    for (const inc of incomes) {
      const ref = doc(db, "users", userId, "incomes", inc.id);
      batch.set(ref, { ...inc, userId, syncedAt: nowIso }, { merge: true });
    }

    // Batch write user's budget settings
    const budgetRef = doc(db, "users", userId, "settings", "budget");
    batch.set(budgetRef, { ...budget, userId, updatedAt: nowIso }, { merge: true });

    await batch.commit();
    setStoredLastSyncTime(nowIso, userId);

    return {
      success: true,
      syncedExpenses: expenses.length,
      syncedIncomes: incomes.length,
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
