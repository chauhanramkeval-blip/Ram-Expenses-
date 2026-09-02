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
} from "./utils/auth";

const LOCAL_STORAGE_EXPENSES_KEY = "khata_indian_expenses_v1";
const LOCAL_STORAGE_INCOMES_KEY = "khata_indian_incomes_v1";
const LOCAL_STORAGE_BUDGET_KEY = "khata_indian_budget_v1";
const LOCAL_STORAGE_EXP_CATEGORIES_KEY = "khata_expense_categories_v2";
const LOCAL_STORAGE_INC_CATEGORIES_KEY = "khata_income_categories_v2";
const LOCAL_STORAGE_SECURITY_KEY = "khata_security_settings_v1";

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
  // Expenses State
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load saved expenses", e);
    }
    return INITIAL_EXPENSES;
  });

  // Incomes State
  const [incomes, setIncomes] = useState<Income[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_INCOMES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load saved incomes", e);
    }
    return INITIAL_INCOMES;
  });

  // Custom Expense Categories State
  const [customExpenseCategories, setCustomExpenseCategories] = useState<CategoryMeta[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EXP_CATEGORIES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load custom expense categories", e);
    }
    return CATEGORY_LIST;
  });

  // Custom Income Categories State
  const [customIncomeCategories, setCustomIncomeCategories] = useState<IncomeCategoryMeta[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_INC_CATEGORIES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load custom income categories", e);
    }
    return INCOME_CATEGORY_LIST;
  });

  // Budget State
  const [budget, setBudget] = useState<UserBudget>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BUDGET_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load budget", e);
    }
    return DEFAULT_BUDGET;
  });

  // Privacy & Security App Lock State
  const [securitySettings, setSecuritySettings] = useState<AppSecuritySettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SECURITY_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load security settings", e);
    }
    return DEFAULT_SECURITY;
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SECURITY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.isEnabled === true;
      }
    } catch (e) {}
    return false;
  });

  // User Accounts & Authentication State
  const [users, setUsers] = useState<UserAccount[]>(getStoredUsers);
  const [currentUser, setCurrentUser] = useState<UserAccount>(getStoredCurrentUser);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getStoredAuthState);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

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

  // Real-time Firestore live synchronization listener
  useEffect(() => {
    const unsubExpenses = subscribeToExpensesCollection((remoteExpenses) => {
      if (remoteExpenses && remoteExpenses.length > 0) {
        setExpenses((prev) => {
          const prevMap = new Map<string, Expense>(prev.map((e) => [e.id, e]));
          let hasDiff = false;
          remoteExpenses.forEach((re) => {
            const existing = prevMap.get(re.id);
            if (!existing || JSON.stringify(existing) !== JSON.stringify(re)) {
              prevMap.set(re.id, re);
              hasDiff = true;
            }
          });
          if (hasDiff) {
            const merged = Array.from(prevMap.values());
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return merged;
          }
          return prev;
        });
        setIsFirebaseSynced(true);
      }
    });

    const unsubIncomes = subscribeToIncomesCollection((remoteIncomes) => {
      if (remoteIncomes && remoteIncomes.length > 0) {
        setIncomes((prev) => {
          const prevMap = new Map<string, Income>(prev.map((i) => [i.id, i]));
          let hasDiff = false;
          remoteIncomes.forEach((ri) => {
            const existing = prevMap.get(ri.id);
            if (!existing || JSON.stringify(existing) !== JSON.stringify(ri)) {
              prevMap.set(ri.id, ri);
              hasDiff = true;
            }
          });
          if (hasDiff) {
            const merged = Array.from(prevMap.values());
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  }, []);

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

  // Handle Backup Restoration
  const handleRestoreBackup = (backupData: KhataFullBackupData, mode: "replace" | "merge") => {
    if (mode === "replace") {
      if (Array.isArray(backupData.expenses)) {
        setExpenses(backupData.expenses);
      }
      if (Array.isArray(backupData.incomes)) {
        setIncomes(backupData.incomes);
      }
      if (backupData.budget) {
        setBudget(backupData.budget);
      }
      if (Array.isArray(backupData.customExpenseCategories)) {
        setCustomExpenseCategories(backupData.customExpenseCategories);
      }
      if (Array.isArray(backupData.customIncomeCategories)) {
        setCustomIncomeCategories(backupData.customIncomeCategories);
      }
    } else {
      // Merge mode: Add records that don't exist by ID
      if (Array.isArray(backupData.expenses)) {
        setExpenses((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newItems = backupData.expenses.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newItems];
        });
      }
      if (Array.isArray(backupData.incomes)) {
        setIncomes((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = backupData.incomes.filter((i) => !existingIds.has(i.id));
          return [...prev, ...newItems];
        });
      }
    }
  };

  // Auth & Profile Handlers
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    // If user has security enabled, prompt app lock if enabled
    if (securitySettings.isEnabled) {
      setIsLocked(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleSwitchUser = (user: UserAccount) => {
    setCurrentUser(user);
  };

  const handleRegisterUser = (newUser: UserAccount) => {
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
    setUsers((prev) => [...prev, newAcc]);
    setCurrentUser(newAcc);
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
          const elapsedMinutes = (Date.now() - backgroundTime) / 60000;
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

  // Capture PWA beforeinstallprompt event for Android 1-click install
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(expenses));
    } catch (e) {
      console.error("Failed to save expenses", e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_INCOMES_KEY, JSON.stringify(incomes));
    } catch (e) {
      console.error("Failed to save incomes", e);
    }
  }, [incomes]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_EXP_CATEGORIES_KEY, JSON.stringify(customExpenseCategories));
    } catch (e) {
      console.error("Failed to save custom expense categories", e);
    }
  }, [customExpenseCategories]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_INC_CATEGORIES_KEY, JSON.stringify(customIncomeCategories));
    } catch (e) {
      console.error("Failed to save custom income categories", e);
    }
  }, [customIncomeCategories]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BUDGET_KEY, JSON.stringify(budget));
    } catch (e) {
      console.error("Failed to save budget", e);
    }
  }, [budget]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SECURITY_KEY, JSON.stringify(securitySettings));
    } catch (e) {
      console.error("Failed to save security settings", e);
    }
  }, [securitySettings]);

  // Security Lock Handlers
  const handleSaveSecuritySettings = (newSettings: AppSecuritySettings) => {
    setSecuritySettings(newSettings);
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
    setIsLocked(false);
  };

  // Current month calculations
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
      savedExpense = { ...expenseData, id: editId };
      setExpenses((prev) =>
        prev.map((e) => (e.id === editId ? savedExpense : e))
      );
    } else {
      savedExpense = {
        ...expenseData,
        id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      };
      setExpenses((prev) => [savedExpense, ...prev]);
    }
    setEditingExpense(null);

    // Instant Real-time Cloud Sync
    setIsFirebaseSynced(false);
    syncExpenseToFirestore(savedExpense)
      .then((success) => {
        if (success) setIsFirebaseSynced(true);
      })
      .catch(() => {});
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setIsFirebaseSynced(false);
    deleteExpenseFromFirestore(id)
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
      savedIncome = { ...incomeData, id: editId };
      setIncomes((prev) =>
        prev.map((inc) => (inc.id === editId ? savedIncome : inc))
      );
    } else {
      savedIncome = {
        ...incomeData,
        id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      };
      setIncomes((prev) => [savedIncome, ...prev]);
    }
    setEditingIncome(null);

    // Instant Real-time Cloud Sync
    setIsFirebaseSynced(false);
    syncIncomeToFirestore(savedIncome)
      .then((success) => {
        if (success) setIsFirebaseSynced(true);
      })
      .catch(() => {});
  };

  const handleDeleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((inc) => inc.id !== id));
    setIsFirebaseSynced(false);
    deleteIncomeFromFirestore(id)
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
    syncBudgetToFirestore(newBudget).catch(() => {});
  };

  const handleResetData = () => {
    setExpenses(INITIAL_EXPENSES);
    setIncomes(INITIAL_INCOMES);
    setBudget(DEFAULT_BUDGET);
    setCustomExpenseCategories(CATEGORY_LIST);
    setCustomIncomeCategories(INCOME_CATEGORY_LIST);
  };

  const handleResetDefaultCategories = () => {
    setCustomExpenseCategories(CATEGORY_LIST);
    setCustomIncomeCategories(INCOME_CATEGORY_LIST);
  };

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log("User choice on install:", choiceResult.outcome);
      setDeferredPrompt(null);
    }
  };

  // If logged out, render the modern Login & Registration Portal
  if (!isLoggedIn) {
    return (
      <AuthScreen
        allUsers={users}
        currentUser={currentUser}
        onLogin={handleLogin}
        onRegisterUser={handleRegisterUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] flex flex-col font-sans">
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
        onOpenNewAccountModal={() => setIsAddAccountOpen(true)}
        isFirebaseOnline={isOnline}
        isFirebaseSynced={isFirebaseSynced}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-24 sm:pb-16">
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
        onSaveExpenseCategories={setCustomExpenseCategories}
        onSaveIncomeCategories={setCustomIncomeCategories}
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
        onSyncCompleted={(newExpenses, newIncomes) => {
          setExpenses(newExpenses);
          setIncomes(newIncomes);
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

      {/* Full-Screen PIN & Biometric Lock Overlay */}
      {securitySettings.isEnabled && isLocked && (
        <LockScreen
          securitySettings={securitySettings}
          onUnlock={() => setIsLocked(false)}
          onResetSecurity={handleResetSecurity}
        />
      )}
    </div>
  );
}
