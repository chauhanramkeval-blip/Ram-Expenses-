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

const LOCAL_STORAGE_LAST_SYNC_KEY = "khata_firestore_last_sync_timestamp";

export const getStoredLastSyncTime = (): string | null => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_LAST_SYNC_KEY);
  } catch (e) {
    return null;
  }
};

export const setStoredLastSyncTime = (timestamp: string) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, timestamp);
  } catch (e) {}
};

/**
 * Saves a single expense to Firestore (collection: "expenses", document ID: expense.id)
 */
export const syncExpenseToFirestore = async (expense: Expense): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid()) {
    return false;
  }

  try {
    const expenseDocRef = doc(db, "expenses", expense.id);
    await setDoc(expenseDocRef, {
      ...expense,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    setStoredLastSyncTime(new Date().toISOString());
    return true;
  } catch (err) {
    console.error(`Failed to sync expense ${expense.id} to Firestore:`, err);
    return false;
  }
};

/**
 * Deletes an expense from Firestore
 */
export const deleteExpenseFromFirestore = async (expenseId: string): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid()) {
    return false;
  }

  try {
    const expenseDocRef = doc(db, "expenses", expenseId);
    await deleteDoc(expenseDocRef);
    setStoredLastSyncTime(new Date().toISOString());
    return true;
  } catch (err) {
    console.error(`Failed to delete expense ${expenseId} from Firestore:`, err);
    return false;
  }
};

/**
 * Saves a single income to Firestore (collection: "incomes", document ID: income.id)
 */
export const syncIncomeToFirestore = async (income: Income): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid()) {
    return false;
  }

  try {
    const incomeDocRef = doc(db, "incomes", income.id);
    await setDoc(incomeDocRef, {
      ...income,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    setStoredLastSyncTime(new Date().toISOString());
    return true;
  } catch (err) {
    console.error(`Failed to sync income ${income.id} to Firestore:`, err);
    return false;
  }
};

/**
 * Deletes an income from Firestore
 */
export const deleteIncomeFromFirestore = async (incomeId: string): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid()) {
    return false;
  }

  try {
    const incomeDocRef = doc(db, "incomes", incomeId);
    await deleteDoc(incomeDocRef);
    setStoredLastSyncTime(new Date().toISOString());
    return true;
  } catch (err) {
    console.error(`Failed to delete income ${incomeId} from Firestore:`, err);
    return false;
  }
};

/**
 * Saves Budget and Settings to Firestore
 */
export const syncBudgetToFirestore = async (budget: UserBudget): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid()) {
    return false;
  }

  try {
    const budgetDocRef = doc(db, "settings", "budget");
    await setDoc(budgetDocRef, {
      ...budget,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("Failed to sync budget to Firestore:", err);
    return false;
  }
};

/**
 * Subscribes to real-time updates on "expenses" collection
 */
export const subscribeToExpensesCollection = (
  onData: (expenses: Expense[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid()) {
    return null;
  }

  try {
    const expensesColRef = collection(db, "expenses");
    return onSnapshot(
      expensesColRef,
      (snapshot) => {
        const fetched: Expense[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data() as Expense;
          fetched.push({
            ...data,
            id: docSnapshot.id || data.id,
          });
        });
        // Sort descending by date
        fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onData(fetched);
      },
      (error) => {
        console.error("Firestore expenses onSnapshot error:", error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error("Failed to setup expenses subscription:", err);
    if (onError) onError(err);
    return null;
  }
};

/**
 * Subscribes to real-time updates on "incomes" collection
 */
export const subscribeToIncomesCollection = (
  onData: (incomes: Income[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid()) {
    return null;
  }

  try {
    const incomesColRef = collection(db, "incomes");
    return onSnapshot(
      incomesColRef,
      (snapshot) => {
        const fetched: Income[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data() as Income;
          fetched.push({
            ...data,
            id: docSnapshot.id || data.id,
          });
        });
        // Sort descending by date
        fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onData(fetched);
      },
      (error) => {
        console.error("Firestore incomes onSnapshot error:", error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error("Failed to setup incomes subscription:", err);
    if (onError) onError(err);
    return null;
  }
};

/**
 * Full Manual Push / Backup: Uploads all local expenses, incomes, and budget into Firestore
 */
export const pushAllLocalDataToFirestore = async (
  expenses: Expense[],
  incomes: Income[],
  budget: UserBudget
): Promise<{ success: boolean; syncedExpenses: number; syncedIncomes: number; error?: string }> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid()) {
    return {
      success: false,
      syncedExpenses: 0,
      syncedIncomes: 0,
      error: "Firebase Firestore is not initialized or credentials are missing.",
    };
  }

  try {
    const batch = writeBatch(db);
    const nowIso = new Date().toISOString();

    // Batch write expenses (chunks of up to 450 to stay under 500 batch limit)
    for (const exp of expenses) {
      const ref = doc(db, "expenses", exp.id);
      batch.set(ref, { ...exp, syncedAt: nowIso }, { merge: true });
    }

    // Batch write incomes
    for (const inc of incomes) {
      const ref = doc(db, "incomes", inc.id);
      batch.set(ref, { ...inc, syncedAt: nowIso }, { merge: true });
    }

    // Batch write budget settings
    const budgetRef = doc(db, "settings", "budget");
    batch.set(budgetRef, { ...budget, updatedAt: nowIso }, { merge: true });

    await batch.commit();
    setStoredLastSyncTime(nowIso);

    return {
      success: true,
      syncedExpenses: expenses.length,
      syncedIncomes: incomes.length,
    };
  } catch (err: any) {
    console.error("Failed to push all data to Firestore batch:", err);
    return {
      success: false,
      syncedExpenses: 0,
      syncedIncomes: 0,
      error: err?.message || "Failed to batch upload to Firestore.",
    };
  }
};

/**
 * Pull all data from Firestore
 */
export const fetchAllFromFirestore = async (): Promise<{
  success: boolean;
  expenses: Expense[];
  incomes: Income[];
  error?: string;
}> => {
  const db = getFirestoreDb();
  if (!db || !isFirebaseConfigValid()) {
    return {
      success: false,
      expenses: [],
      incomes: [],
      error: "Firestore is not connected.",
    };
  }

  try {
    const expSnap = await getDocs(collection(db, "expenses"));
    const fetchedExpenses: Expense[] = [];
    expSnap.forEach((d) => {
      const data = d.data() as Expense;
      fetchedExpenses.push({ ...data, id: d.id || data.id });
    });

    const incSnap = await getDocs(collection(db, "incomes"));
    const fetchedIncomes: Income[] = [];
    incSnap.forEach((d) => {
      const data = d.data() as Income;
      fetchedIncomes.push({ ...data, id: d.id || data.id });
    });

    setStoredLastSyncTime(new Date().toISOString());

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
