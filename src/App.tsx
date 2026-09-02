import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { StorageMeterCard } from "./components/StorageMeterCard";
import { ExpenseList } from "./components/ExpenseList";
import { IncomeView } from "./components/IncomeView";
import { VisualizationView } from "./components/VisualizationView";
import { DailyAdvisorView } from "./components/DailyAdvisorView";
import { AddExpenseModal } from "./components/AddExpenseModal";
import { AddIncomeModal } from "./components/AddIncomeModal";
import { CategoryManagerModal } from "./components/CategoryManagerModal";
import { BudgetSettingsModal } from "./components/BudgetSettingsModal";
import { SecuritySettingsModal } from "./components/SecuritySettingsModal";
import { EditProfileModal } from "./components/EditProfileModal";
import { AddAccountModal } from "./components/AddAccountModal";
import { ProfileLoginModal } from "./components/ProfileLoginModal";
import { InitialAuthModal } from "./components/InitialAuthModal";
import { AuthScreen } from "./components/AuthScreen";
import { LockScreen } from "./components/LockScreen";
import { ExportModal } from "./components/ExportModal";
import { BackupModal } from "./components/BackupModal";
import { FirebaseSyncModal } from "./components/FirebaseSyncModal";
import { PdfReportModal } from "./components/PdfReportModal";
import { InstallAppModal } from "./components/InstallAppModal";
import { BottomNav } from "./components/BottomNav";
import { INITIAL_EXPENSES, INITIAL_INCOMES } from "./data/initialExpenses";
import { CATEGORY_LIST, INCOME_CATEGORY_LIST } from "./data/categories";
import { KhataFullBackupData } from "./utils/backup";
import {
  syncExpenseToFirestore,
  deleteExpenseFromFirestore,
  syncIncomeToFirestore,
  deleteIncomeFromFirestore,
  syncBudgetToFirestore,
  subscribeToExpensesCollection,
  subscribeToIncomesCollection,
  deleteUserFirestoreData,
} from "./services/firestoreSync";
import {
  CategoryMeta,
  Expense,
  Income,
  IncomeCategoryMeta,
  UserBudget,
  AppSecuritySettings,
  UserAccount,
} from "./types";
import {
  getStoredUsers,
  saveStoredUsers,
  getStoredCurrentUser,
  setStoredCurrentUser,
  getStoredAuthState,
  setStoredAuthState,
  isOnboardingCompleted,
  setOnboardingCompleted,
} from "./utils/auth";
import {
  loadUserExpenses,
  saveUserExpenses,
  loadUserIncomes,
  saveUserIncomes,
  loadUserBudget,
  saveUserBudget,
  loadUserCategories,
  saveUserCategories,
  loadUserIncCategories,
  saveUserIncCategories,
  loadUserSecurity,
  saveUserSecurity,
  deleteUserAllData,
} from "./utils/userStorage";

const DEFAULT_BUDGET: UserBudget = {
  monthlyBudget: 35000,
  monthlyIncome: 65000,
  targetSavingsPercent: 20,
  currency: "INR",
  salaryDay: 1,
};

const DEFAULT_SECURITY: AppSecuritySettings = {
  isEnabled: false,
  pinCode: "",
  isBiometricEnabled: false,
  autoLockMinutes: 0,
};

export default function App() {
  // User Accounts & Authentication State
  const [users, setUsers] = useState<UserAccount[]>(getStoredUsers);
  const [currentUser, setCurrentUser] = useState<UserAccount>(getStoredCurrentUser);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getStoredAuthState);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [pendingSwitchUser, setPendingSwitchUser] = useState<UserAccount | null>(null);
  const [isProfileLoginModalOpen, setIsProfileLoginModalOpen] = useState(false);

  // User-Isolated Expenses State
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadUserExpenses(currentUser.id)
  );

  // User-Isolated Incomes State
  const [incomes, setIncomes] = useState<Income[]>(() =>
    loadUserIncomes(currentUser.id)
  );

  // User-Isolated Custom Expense Categories State
  const [customExpenseCategories, setCustomExpenseCategories] = useState<CategoryMeta[]>(() =>
    loadUserCategories(currentUser.id, CATEGORY_LIST)
  );

  // User-Isolated Custom Income Categories State
  const [customIncomeCategories, setCustomIncomeCategories] = useState<IncomeCategoryMeta[]>(() =>
    loadUserIncCategories(currentUser.id, INCOME_CATEGORY_LIST)
  );

  // User-Isolated Budget State
  const [budget, setBudget] = useState<UserBudget>(() =>
    loadUserBudget(currentUser.id, DEFAULT_BUDGET)
  );

  // User-Isolated Privacy & Security App Lock State
  const [securitySettings, setSecuritySettings] = useState<AppSecuritySettings>(() =>
    loadUserSecurity(currentUser.id, DEFAULT_SECURITY)
  );

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const sec = loadUserSecurity(currentUser.id, DEFAULT_SECURITY);
    return sec.isEnabled === true;
  });

  // UI States
  const [activeTab, setActiveTab] = useState<"expenses" | "incomes" | "visuals" | "advisor">("expenses");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isFirebaseSyncModalOpen, setIsFirebaseSyncModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isFirebaseSynced, setIsFirebaseSynced] = useState<boolean>(true);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalTab, setCategoryModalTab] = useState<"expense" | "income">("expense");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Network online/offline status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Real-time Firestore live synchronization listener for active user
  useEffect(() => {
    if (!currentUser?.id) return;
    const activeUserId = currentUser.id;

    const unsubExpenses = subscribeToExpensesCollection(activeUserId, (remoteExpenses) => {
      if (remoteExpenses) {
        setExpenses((prev) => {
          // Check if remote data differs from local state
          const prevMap = new Map<string, Expense>(prev.map((e) => [e.id, e]));
          let hasDiff = false;
          if (remoteExpenses.length !== prev.length) {
            hasDiff = true;
          } else {
            for (const re of remoteExpenses) {
              const existing = prevMap.get(re.id);
              if (!existing || JSON.stringify(existing) !== JSON.stringify(re)) {
                hasDiff = true;
                break;
              }
            }
          }

          if (hasDiff) {
            const merged = [...remoteExpenses];
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            saveUserExpenses(activeUserId, merged);
            return merged;
          }
          return prev;
        });
        setIsFirebaseSynced(true);
      }
    });

    const unsubIncomes = subscribeToIncomesCollection(activeUserId, (remoteIncomes) => {
      if (remoteIncomes) {
        setIncomes((prev) => {
          const prevMap = new Map<string, Income>(prev.map((i) => [i.id, i]));
          let hasDiff = false;
          if (remoteIncomes.length !== prev.length) {
            hasDiff = true;
          } else {
            for (const ri of remoteIncomes) {
              const existing = prevMap.get(ri.id);
              if (!existing || JSON.stringify(existing) !== JSON.stringify(ri)) {
                hasDiff = true;
                break;
              }
            }
          }

          if (hasDiff) {
            const merged = [...remoteIncomes];
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            saveUserIncomes(activeUserId, merged);
            return merged;
          }
          return prev;
        });
        setIsFirebaseSynced(true);
      }
    });

    return () => {
      if (unsubExpenses) unsubExpenses();
      if (unsubIncomes) unsubIncomes();
    };
  }, [currentUser.id]);

  // Sync users and authentication state
  useEffect(() => {
    saveStoredUsers(users);
  }, [users]);

  useEffect(() => {
    setStoredCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    setStoredAuthState(isLoggedIn);
  }, [isLoggedIn]);

  // Persist active user data changes to localStorage
  useEffect(() => {
    if (currentUser?.id) {
      saveUserExpenses(currentUser.id, expenses);
    }
  }, [expenses, currentUser.id]);

  useEffect(() => {
    if (currentUser?.id) {
      saveUserIncomes(currentUser.id, incomes);
    }
  }, [incomes, currentUser.id]);

  useEffect(() => {
    if (currentUser?.id) {
      saveUserBudget(currentUser.id, budget);
    }
  }, [budget, currentUser.id]);

  useEffect(() => {
    if (currentUser?.id) {
      saveUserCategories(currentUser.id, customExpenseCategories);
    }
  }, [customExpenseCategories, currentUser.id]);

  useEffect(() => {
    if (currentUser?.id) {
      saveUserIncCategories(currentUser.id, customIncomeCategories);
    }
  }, [customIncomeCategories, currentUser.id]);

  useEffect(() => {
    if (currentUser?.id) {
      saveUserSecurity(currentUser.id, securitySettings);
    }
  }, [securitySettings, currentUser.id]);

  // Handle Backup Restoration
  const handleRestoreBackup = (backupData: KhataFullBackupData, mode: "replace" | "merge") => {
    const activeUserId = currentUser.id;
    if (mode === "replace") {
      if (Array.isArray(backupData.expenses)) {
        setExpenses(backupData.expenses);
        saveUserExpenses(activeUserId, backupData.expenses);
      }
      if (Array.isArray(backupData.incomes)) {
        setIncomes(backupData.incomes);
        saveUserIncomes(activeUserId, backupData.incomes);
      }
      if (backupData.budget) {
        setBudget(backupData.budget);
        saveUserBudget(activeUserId, backupData.budget);
      }
      if (Array.isArray(backupData.customExpenseCategories)) {
        setCustomExpenseCategories(backupData.customExpenseCategories);
        saveUserCategories(activeUserId, backupData.customExpenseCategories);
      }
      if (Array.isArray(backupData.customIncomeCategories)) {
        setCustomIncomeCategories(backupData.customIncomeCategories);
        saveUserIncCategories(activeUserId, backupData.customIncomeCategories);
      }
    } else {
      // Merge mode: Add records that don't exist by ID
      if (Array.isArray(backupData.expenses)) {
        setExpenses((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newItems = backupData.expenses.filter((e) => !existingIds.has(e.id));
          const merged = [...prev, ...newItems];
          saveUserExpenses(activeUserId, merged);
          return merged;
        });
      }
      if (Array.isArray(backupData.incomes)) {
        setIncomes((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = backupData.incomes.filter((i) => !existingIds.has(i.id));
          const merged = [...prev, ...newItems];
          saveUserIncomes(activeUserId, merged);
          return merged;
        });
      }
    }
  };

  // Auth & Profile Handlers
  const handleSignUp = (newUser: UserAccount) => {
    // 1. Initialize empty data slate (₹0 balance, 0 expenses) for the new user
    saveUserExpenses(newUser.id, []);
    saveUserIncomes(newUser.id, []);
    saveUserBudget(newUser.id, DEFAULT_BUDGET);
    saveUserCategories(newUser.id, CATEGORY_LIST);
    saveUserIncCategories(newUser.id, INCOME_CATEGORY_LIST);

    const initialSecurity: AppSecuritySettings = {
      isEnabled: true,
      pinCode: newUser.pin || "1234",
      isBiometricEnabled: false,
      autoLockMinutes: 0,
    };
    saveUserSecurity(newUser.id, initialSecurity);

    // 2. Set as primary user in stored users
    setUsers((prev) => {
      const filtered = prev.filter(
        (u) => u.id !== newUser.id && u.email.toLowerCase() !== newUser.email.toLowerCase()
      );
      const updated = [newUser, ...filtered];
      saveStoredUsers(updated);
      return updated;
    });

    // 3. Set active user & fresh slate state
    setCurrentUser(newUser);
    setExpenses([]);
    setIncomes([]);
    setBudget(DEFAULT_BUDGET);
    setCustomExpenseCategories(CATEGORY_LIST);
    setCustomIncomeCategories(INCOME_CATEGORY_LIST);
    setSecuritySettings(initialSecurity);
    setIsLoggedIn(true);
    setIsLocked(false);
    setEditingExpense(null);
    setEditingIncome(null);
    setSearchQuery("");

    // 4. Persist state
    setOnboardingCompleted(true);
    setStoredAuthState(true);
    setStoredCurrentUser(newUser);
  };

  const handleLogin = (user: UserAccount) => {
    const userExpenses = loadUserExpenses(user.id);
    const userIncomes = loadUserIncomes(user.id);
    const userBudget = loadUserBudget(user.id, DEFAULT_BUDGET);
    const userExpCats = loadUserCategories(user.id, CATEGORY_LIST);
    const userIncCats = loadUserIncCategories(user.id, INCOME_CATEGORY_LIST);
    const userSecurity = loadUserSecurity(user.id, DEFAULT_SECURITY);

    setCurrentUser(user);
    setExpenses(userExpenses);
    setIncomes(userIncomes);
    setBudget(userBudget);
    setCustomExpenseCategories(userExpCats);
    setCustomIncomeCategories(userIncCats);
    setSecuritySettings(userSecurity);
    setIsLoggedIn(true);
    setIsLocked(false);
    setEditingExpense(null);
    setEditingIncome(null);
    setSearchQuery("");

    setOnboardingCompleted(true);
    setStoredAuthState(true);
    setStoredCurrentUser(user);
  };

  const handleLogout = () => {
    // Save current user state before clearing session
    if (currentUser?.id) {
      saveUserExpenses(currentUser.id, expenses);
      saveUserIncomes(currentUser.id, incomes);
      saveUserBudget(currentUser.id, budget);
      saveUserCategories(currentUser.id, customExpenseCategories);
      saveUserIncCategories(currentUser.id, customIncomeCategories);
      saveUserSecurity(currentUser.id, securitySettings);
    }

    // Immediately clear active user session
    setIsLoggedIn(false);
    setStoredAuthState(false);
    setIsLocked(false);
    setIsProfileLoginModalOpen(false);
    setIsEditProfileOpen(false);
    setIsAddAccountOpen(false);
    setPendingSwitchUser(null);
  };

  /**
   * Permanently deletes the active user's profile and all associated data,
   * then resets the application to the initial onboarding / signup screen.
   */
  const handleDeleteAccount = async (targetUser: UserAccount) => {
    const userIdToDelete = targetUser.id;

    // 1. Delete Firestore cloud documents for this user
    deleteUserFirestoreData(userIdToDelete).catch((err) => {
      console.error("Failed to delete user data from Firestore", err);
    });

    // 2. Wipe all local storage keys for this user
    deleteUserAllData(userIdToDelete);

    // 3. Remove user from the registered users list
    const remainingUsers = users.filter((u) => u.id !== userIdToDelete);
    setUsers(remainingUsers);
    saveStoredUsers(remainingUsers);

    // 4. Reset authentication state & return to initial screen
    setIsLoggedIn(false);
    setStoredAuthState(false);
    setOnboardingCompleted(remainingUsers.length > 0);
    setIsLocked(false);
    setIsProfileLoginModalOpen(false);
    setIsEditProfileOpen(false);
    setIsAddAccountOpen(false);
    setPendingSwitchUser(null);

    // 5. If other accounts remain, point current user to the first one, else default
    if (remainingUsers.length > 0) {
      const fallback = remainingUsers[0];
      setCurrentUser(fallback);
      setStoredCurrentUser(fallback);
      setExpenses(loadUserExpenses(fallback.id));
      setIncomes(loadUserIncomes(fallback.id));
      setBudget(loadUserBudget(fallback.id, DEFAULT_BUDGET));
      setCustomExpenseCategories(loadUserCategories(fallback.id, CATEGORY_LIST));
      setCustomIncomeCategories(loadUserIncCategories(fallback.id, INCOME_CATEGORY_LIST));
      setSecuritySettings(loadUserSecurity(fallback.id, DEFAULT_SECURITY));
    } else {
      // Complete reset to clean state
      const defaultRamkeval = getStoredCurrentUser();
      setCurrentUser(defaultRamkeval);
      setStoredCurrentUser(defaultRamkeval);
      setExpenses([]);
      setIncomes([]);
      setBudget(DEFAULT_BUDGET);
      setCustomExpenseCategories(CATEGORY_LIST);
      setCustomIncomeCategories(INCOME_CATEGORY_LIST);
      setSecuritySettings(DEFAULT_SECURITY);
      setOnboardingCompleted(false);
    }
  };

  /**
   * User Switch Initiator:
   * 1. Immediately saves active user data
   * 2. Opens the Profile Authentication / Login Modal to securely verify PIN/Password/Biometric
   * 3. Prevents displaying the target profile's private finances until verified
   */
  const handleSwitchUser = (selectedUser: UserAccount) => {
    // 1. Immediately persist active user's data
    saveUserExpenses(currentUser.id, expenses);
    saveUserIncomes(currentUser.id, incomes);
    saveUserBudget(currentUser.id, budget);
    saveUserCategories(currentUser.id, customExpenseCategories);
    saveUserIncCategories(currentUser.id, customIncomeCategories);
    saveUserSecurity(currentUser.id, securitySettings);

    // 2. Open Profile Login Modal
    setPendingSwitchUser(selectedUser);
    setIsProfileLoginModalOpen(true);
  };

  /**
   * Lock Session:
   * Prompts authentication for the current active account
   */
  const handleLockSession = () => {
    saveUserExpenses(currentUser.id, expenses);
    saveUserIncomes(currentUser.id, incomes);
    saveUserBudget(currentUser.id, budget);
    saveUserCategories(currentUser.id, customExpenseCategories);
    saveUserIncCategories(currentUser.id, customIncomeCategories);
    saveUserSecurity(currentUser.id, securitySettings);

    setPendingSwitchUser(currentUser);
    setIsProfileLoginModalOpen(true);
  };

  /**
   * Executed when authentication succeeds in ProfileLoginModal:
   * Switches to authenticated user and loads their isolated ledger data
   */
  const handleAuthenticatedSwitch = (authenticatedUser: UserAccount) => {
    const newExpenses = loadUserExpenses(authenticatedUser.id);
    const newIncomes = loadUserIncomes(authenticatedUser.id);
    const newBudget = loadUserBudget(authenticatedUser.id, DEFAULT_BUDGET);
    const newExpCats = loadUserCategories(authenticatedUser.id, CATEGORY_LIST);
    const newIncCats = loadUserIncCategories(authenticatedUser.id, INCOME_CATEGORY_LIST);
    const newSecurity = loadUserSecurity(authenticatedUser.id, DEFAULT_SECURITY);

    setCurrentUser(authenticatedUser);
    setExpenses(newExpenses);
    setIncomes(newIncomes);
    setBudget(newBudget);
    setCustomExpenseCategories(newExpCats);
    setCustomIncomeCategories(newIncCats);
    setSecuritySettings(newSecurity);

    setEditingExpense(null);
    setEditingIncome(null);
    setSearchQuery("");
    setIsLocked(false);
    setPendingSwitchUser(null);
    setIsProfileLoginModalOpen(false);

    // Update users array with lastLogin timestamp
    setUsers((prev) =>
      prev.map((u) => (u.id === authenticatedUser.id ? { ...u, lastLogin: "Just now" } : u))
    );
  };

  const handleRegisterUser = (newUser: UserAccount) => {
    // Seed new user storage with empty slate
    saveUserExpenses(newUser.id, []);
    saveUserIncomes(newUser.id, []);
    saveUserBudget(newUser.id, DEFAULT_BUDGET);
    saveUserCategories(newUser.id, CATEGORY_LIST);
    saveUserIncCategories(newUser.id, INCOME_CATEGORY_LIST);
    saveUserSecurity(newUser.id, DEFAULT_SECURITY);

    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newUser;
        return copy;
      }
      return [...prev, newUser];
    });
  };

  const handleSaveProfile = (updatedUser: UserAccount) => {
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const handleAddAccount = (newAcc: UserAccount) => {
    // 1. Save current active user data
    saveUserExpenses(currentUser.id, expenses);
    saveUserIncomes(currentUser.id, incomes);
    saveUserBudget(currentUser.id, budget);
    saveUserCategories(currentUser.id, customExpenseCategories);
    saveUserIncCategories(currentUser.id, customIncomeCategories);
    saveUserSecurity(currentUser.id, securitySettings);

    // 2. Initialize clean slate for new user account
    saveUserExpenses(newAcc.id, []);
    saveUserIncomes(newAcc.id, []);
    saveUserBudget(newAcc.id, DEFAULT_BUDGET);
    saveUserCategories(newAcc.id, CATEGORY_LIST);
    saveUserIncCategories(newAcc.id, INCOME_CATEGORY_LIST);
    saveUserSecurity(newAcc.id, DEFAULT_SECURITY);

    // 3. Switch active user to new account with clean slate
    setUsers((prev) => [...prev, newAcc]);
    setCurrentUser(newAcc);
    setExpenses([]);
    setIncomes([]);
    setBudget(DEFAULT_BUDGET);
    setCustomExpenseCategories(CATEGORY_LIST);
    setCustomIncomeCategories(INCOME_CATEGORY_LIST);
    setSecuritySettings(DEFAULT_SECURITY);
    setIsLocked(false);
    setEditingExpense(null);
    setEditingIncome(null);
    setSearchQuery("");
  };

  // Auto-lock when tab is backgrounded / hidden based on autoLockMinutes setting
  useEffect(() => {
    let backgroundTime: number | null = null;

    const handleVisibilityChange = () => {
      if (!securitySettings.isEnabled) return;

      if (document.hidden) {
        backgroundTime = Date.now();
        if (securitySettings.autoLockMinutes === 0) {
          setIsLocked(true);
        }
      } else {
        if (backgroundTime !== null && securitySettings.autoLockMinutes > 0) {
          const elapsedMinutes = (Date.now() - backgroundTime) / (1000 * 60);
          if (elapsedMinutes >= securitySettings.autoLockMinutes) {
            setIsLocked(true);
          }
        }
        backgroundTime = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [securitySettings]);

  // Security Lock Handlers
  const handleSaveSecuritySettings = (newSettings: AppSecuritySettings) => {
    setSecuritySettings(newSettings);
    saveUserSecurity(currentUser.id, newSettings);
    if (!newSettings.isEnabled) {
      setIsLocked(false);
    }
  };

  const handleLockImmediately = () => {
    if (securitySettings.isEnabled) {
      setIsLocked(true);
    }
  };

  const handleResetSecurity = () => {
    const disabled: AppSecuritySettings = {
      isEnabled: false,
      pinCode: "",
      isBiometricEnabled: false,
      autoLockMinutes: 0,
    };
    setSecuritySettings(disabled);
    saveUserSecurity(currentUser.id, disabled);
    setIsLocked(false);
  };

  // PWA BeforeInstallPrompt Event Listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Filter expenses and incomes for current month totals
  const now = new Date();
  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalSpentThisMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const currentMonthIncomes = incomes.filter((inc) => {
    const d = new Date(inc.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalIncomeThisMonth = currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);

  // Category Manager Open Helper
  const handleOpenCategoryManager = (tab: "expense" | "income" = "expense") => {
    setCategoryModalTab(tab);
    setIsCategoryModalOpen(true);
  };

  // Expense Handlers
  const handleSaveExpense = (
    expenseData: Omit<Expense, "id">,
    editId?: string
  ) => {
    let savedExpense: Expense;
    if (editId) {
      savedExpense = { ...expenseData, id: editId, userId: currentUser.id };
      setExpenses((prev) => {
        const next = prev.map((e) => (e.id === editId ? savedExpense : e));
        saveUserExpenses(currentUser.id, next);
        return next;
      });
    } else {
      savedExpense = {
        ...expenseData,
        id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: currentUser.id,
      };
      setExpenses((prev) => {
        const next = [savedExpense, ...prev];
        saveUserExpenses(currentUser.id, next);
        return next;
      });
    }
    setEditingExpense(null);

    // Instant Real-time Cloud Sync for active user
    setIsFirebaseSynced(false);
    syncExpenseToFirestore(savedExpense, currentUser.id)
      .then((success) => {
        if (success) setIsFirebaseSynced(true);
      })
      .catch(() => {});
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveUserExpenses(currentUser.id, next);
      return next;
    });
    setIsFirebaseSynced(false);
    deleteExpenseFromFirestore(id, currentUser.id)
      .then((success) => {
        if (success) setIsFirebaseSynced(true);
      })
      .catch(() => {});
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddExpenseOpen(true);
  };

  // Income Handlers
  const handleSaveIncome = (
    incomeData: Omit<Income, "id">,
    editId?: string
  ) => {
    let savedIncome: Income;
    if (editId) {
      savedIncome = { ...incomeData, id: editId, userId: currentUser.id };
      setIncomes((prev) => {
        const next = prev.map((inc) => (inc.id === editId ? savedIncome : inc));
        saveUserIncomes(currentUser.id, next);
        return next;
      });
    } else {
      savedIncome = {
        ...incomeData,
        id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: currentUser.id,
      };
      setIncomes((prev) => {
        const next = [savedIncome, ...prev];
        saveUserIncomes(currentUser.id, next);
        return next;
      });
    }
    setEditingIncome(null);

    // Instant Real-time Cloud Sync for active user
    setIsFirebaseSynced(false);
    syncIncomeToFirestore(savedIncome, currentUser.id)
      .then((success) => {
        if (success) setIsFirebaseSynced(true);
      })
      .catch(() => {});
  };

  const handleDeleteIncome = (id: string) => {
    setIncomes((prev) => {
      const next = prev.filter((inc) => inc.id !== id);
      saveUserIncomes(currentUser.id, next);
      return next;
    });
    setIsFirebaseSynced(false);
    deleteIncomeFromFirestore(id, currentUser.id)
      .then((success) => {
        if (success) setIsFirebaseSynced(true);
      })
      .catch(() => {});
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setIsAddIncomeOpen(true);
  };

  const handleSaveBudget = (newBudget: UserBudget) => {
    setBudget(newBudget);
    saveUserBudget(currentUser.id, newBudget);
    syncBudgetToFirestore(newBudget, currentUser.id).catch(() => {});
  };

  const handleResetData = () => {
    const defaultExp = currentUser.id === "user-ramkeval" ? INITIAL_EXPENSES : [];
    const defaultInc = currentUser.id === "user-ramkeval" ? INITIAL_INCOMES : [];
    setExpenses(defaultExp);
    setIncomes(defaultInc);
    setBudget(DEFAULT_BUDGET);
    setCustomExpenseCategories(CATEGORY_LIST);
    setCustomIncomeCategories(INCOME_CATEGORY_LIST);
    saveUserExpenses(currentUser.id, defaultExp);
    saveUserIncomes(currentUser.id, defaultInc);
    saveUserBudget(currentUser.id, DEFAULT_BUDGET);
    saveUserCategories(currentUser.id, CATEGORY_LIST);
    saveUserIncCategories(currentUser.id, INCOME_CATEGORY_LIST);
  };

  const handleResetDefaultCategories = () => {
    setCustomExpenseCategories(CATEGORY_LIST);
    setCustomIncomeCategories(INCOME_CATEGORY_LIST);
    saveUserCategories(currentUser.id, CATEGORY_LIST);
    saveUserIncCategories(currentUser.id, INCOME_CATEGORY_LIST);
  };

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log("User choice on install:", choiceResult.outcome);
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      <div
        className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#F8F9FA] text-[#202124] flex flex-col font-sans transition-all duration-300 ${
          !isLoggedIn ? "pointer-events-none select-none filter blur-[3px] opacity-60" : ""
        }`}
      >
      {/* Google Files style sticky Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalSpentThisMonth={totalSpentThisMonth}
        totalIncomeThisMonth={totalIncomeThisMonth}
        monthlyBudget={budget.monthlyBudget}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsAddExpenseOpen(true);
        }}
        onOpenAddIncome={() => {
          setEditingIncome(null);
          setIsAddIncomeOpen(true);
        }}
        onOpenPdfReportModal={() => setIsPdfModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenFirebaseSync={() => setIsFirebaseSyncModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenCategoryManager={() => handleOpenCategoryManager(activeTab === "incomes" ? "income" : "expense")}
        isSecurityEnabled={securitySettings.isEnabled}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        onOpenNewAccountModal={() => setIsAddAccountOpen(true)}
        onLockSession={handleLockSession}
        isFirebaseOnline={isOnline}
        isFirebaseSynced={isFirebaseSynced}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-24 sm:pb-16 overflow-x-hidden">
        {/* Tab 1: Daily Expenses View */}
        {activeTab === "expenses" && (
          <div className="animate-fadeIn">
            {/* Storage / Budget Meter Card */}
            <StorageMeterCard
              expenses={currentMonthExpenses}
              monthlyBudget={budget.monthlyBudget}
              onOpenAddExpense={() => {
                setEditingExpense(null);
                setIsAddExpenseOpen(true);
              }}
              onOpenPdfReportModal={() => setIsPdfModalOpen(true)}
              onNavigateToVisuals={() => setActiveTab("visuals")}
              onNavigateToAdvisor={() => setActiveTab("advisor")}
            />

            {/* Expense Items grouped by date */}
            <ExpenseList
              expenses={expenses}
              searchQuery={searchQuery}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              onOpenAddExpense={() => {
                setEditingExpense(null);
                setIsAddExpenseOpen(true);
              }}
              onNavigateToVisuals={() => setActiveTab("visuals")}
              customExpenseCategories={customExpenseCategories}
              onOpenCategoryManager={() => handleOpenCategoryManager("expense")}
            />
          </div>
        )}

        {/* Tab 2: Income & Inflow Stream View */}
        {activeTab === "incomes" && (
          <div className="animate-fadeIn">
            <IncomeView
              incomes={incomes}
              expenses={expenses}
              monthlyBudget={budget.monthlyBudget}
              searchQuery={searchQuery}
              onOpenAddIncome={() => {
                setEditingIncome(null);
                setIsAddIncomeOpen(true);
              }}
              onEditIncome={handleEditIncome}
              onDeleteIncome={handleDeleteIncome}
              onNavigateToVisuals={() => setActiveTab("visuals")}
              customIncomeCategories={customIncomeCategories}
              onOpenCategoryManager={() => handleOpenCategoryManager("income")}
            />
          </div>
        )}

        {/* Tab 3: Visualizations & Pie Chart */}
        {activeTab === "visuals" && (
          <VisualizationView
            expenses={expenses}
            monthlyBudget={budget.monthlyBudget}
            onNavigateToAdvisor={() => setActiveTab("advisor")}
          />
        )}

        {/* Tab 4: Daily Advisor & AI Insights */}
        {activeTab === "advisor" && (
          <DailyAdvisorView
            expenses={expenses}
            monthlyBudget={budget.monthlyBudget}
          />
        )}
      </main>

      {/* Google Files style Bottom Navigation & FAB */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsAddExpenseOpen(true);
        }}
        onOpenAddIncome={() => {
          setEditingIncome(null);
          setIsAddIncomeOpen(true);
        }}
      />

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        customExpenseCategories={customExpenseCategories}
        onOpenCategoryManager={() => handleOpenCategoryManager("expense")}
      />

      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => {
          setIsAddIncomeOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
        editingIncome={editingIncome}
        customIncomeCategories={customIncomeCategories}
        onOpenCategoryManager={() => handleOpenCategoryManager("income")}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        expenseCategories={customExpenseCategories}
        incomeCategories={customIncomeCategories}
        onSaveExpenseCategories={(cats) => {
          setCustomExpenseCategories(cats);
          saveUserCategories(currentUser.id, cats);
        }}
        onSaveIncomeCategories={(cats) => {
          setCustomIncomeCategories(cats);
          saveUserIncCategories(currentUser.id, cats);
        }}
        onResetDefaultCategories={handleResetDefaultCategories}
        initialTab={categoryModalTab}
      />

      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        expenses={expenses}
        budget={budget}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        expenses={expenses}
        filteredExpenses={expenses}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        expenses={expenses}
        incomes={incomes}
        budget={budget}
        currentUser={currentUser}
        customExpenseCategories={customExpenseCategories}
        customIncomeCategories={customIncomeCategories}
        onRestoreBackup={handleRestoreBackup}
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onTriggerInstall={handleTriggerInstall}
      />

      <BudgetSettingsModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budget={budget}
        onSaveBudget={handleSaveBudget}
        onResetData={handleResetData}
        isSecurityEnabled={securitySettings.isEnabled}
        onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenFirebaseSync={() => setIsFirebaseSyncModalOpen(true)}
      />

      <FirebaseSyncModal
        isOpen={isFirebaseSyncModalOpen}
        onClose={() => setIsFirebaseSyncModalOpen(false)}
        expenses={expenses}
        incomes={incomes}
        budget={budget}
        currentUser={currentUser}
        onSyncCompleted={(newExpenses, newIncomes) => {
          setExpenses(newExpenses);
          setIncomes(newIncomes);
          saveUserExpenses(currentUser.id, newExpenses);
          saveUserIncomes(currentUser.id, newIncomes);
          setIsFirebaseSynced(true);
        }}
      />

      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        securitySettings={securitySettings}
        onSaveSecuritySettings={handleSaveSecuritySettings}
        onLockImmediately={handleLockImmediately}
      />

      {/* User Profile & Account Settings Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
        onLogout={handleLogout}
      />

      {/* Add New Ledger / Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAddAccount={handleAddAccount}
      />

      {/* Secure Profile Authentication / Login & Switch Modal */}
      <ProfileLoginModal
        isOpen={isProfileLoginModalOpen}
        targetUser={pendingSwitchUser || currentUser}
        allUsers={users}
        onClose={() => {
          setIsProfileLoginModalOpen(false);
          setPendingSwitchUser(null);
        }}
        onAuthenticated={handleAuthenticatedSwitch}
      />

      {/* Full-Screen PIN & Biometric Lock Overlay */}
      {securitySettings.isEnabled && isLocked && (
        <LockScreen
          securitySettings={securitySettings}
          onUnlock={() => setIsLocked(false)}
          onResetSecurity={handleResetSecurity}
        />
      )}
      </div>

      {/* Initial First-Launch & Logged Out Sign Up / Login Modal Popup */}
      <InitialAuthModal
        isOpen={!isLoggedIn}
        allUsers={users}
        currentUser={currentUser}
        onSignUp={handleSignUp}
        onLogin={handleLogin}
        initialMode={isOnboardingCompleted() ? "login" : "signup"}
      />
    </>
  );
}
