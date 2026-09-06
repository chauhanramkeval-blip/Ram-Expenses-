import React, { useState, useMemo, useRef } from "react";
import {
  Table2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Printer,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  FileSpreadsheet,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  Check,
  RefreshCw,
  Layers,
  BarChart3,
  Percent,
  CalendarDays,
  SlidersHorizontal,
  ArrowRight,
  Award,
} from "lucide-react";
import {
  Expense,
  Income,
  UserBudget,
  CategoryMeta,
  IncomeCategoryMeta,
  UserAccount,
  PaymentMode,
  ExpenseCategory,
  IncomeCategory,
} from "../types";
import { CategoryIcon, IncomeIcon, resolveExpenseMeta, resolveIncomeMeta } from "./CategoryIcon";
import { formatINR, formatFriendlyDate } from "../utils/formatters";
import { exportTransactionsToExcel } from "../utils/export";

export interface MonthlyTableViewProps {
  expenses: Expense[];
  incomes: Income[];
  budget?: UserBudget;
  currentUser?: UserAccount | null;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onOpenAddExpense: () => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
  onOpenAddIncome: () => void;
  customExpenseCategories?: CategoryMeta[];
  customIncomeCategories?: IncomeCategoryMeta[];
  onNavigateToVisuals?: () => void;
}

export type TimeframeMode = "monthly" | "yearly";
export type TableSegment = "all" | "expenses" | "incomes" | "daily" | "categories" | "matrix" | "audit";

export interface UnifiedTransactionRow {
  id: string;
  originalId: string;
  type: "expense" | "income";
  title: string;
  amount: number;
  category: string;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD
  time?: string;
  notes?: string;
  party: string; // Merchant or Source/Client
  isRecurring?: boolean;
  rawExpense?: Expense;
  rawIncome?: Income;
  runningBalance?: number;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const MonthlyTableView: React.FC<MonthlyTableViewProps> = ({
  expenses,
  incomes,
  budget,
  currentUser,
  onEditExpense,
  onDeleteExpense,
  onOpenAddExpense,
  onEditIncome,
  onDeleteIncome,
  onOpenAddIncome,
  customExpenseCategories,
  customIncomeCategories,
  onNavigateToVisuals,
}) => {
  const now = new Date();

  // 1. Timeframe Mode: "monthly" vs "yearly"
  const [timeframeMode, setTimeframeMode] = useState<TimeframeMode>("monthly");

  // 2. Selected Year and Month
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed

  // 3. Table Feature Segment Tab
  const [activeSegment, setActiveSegment] = useState<TableSegment>("all");

  // 4. Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [paymentModeFilter, setPaymentModeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "title-asc">(
    "date-desc"
  );
  const [isCompact, setIsCompact] = useState(false);

  // 5. Dropdown open states
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  // 6. Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 7. AI Audit State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<string | null>(null);

  // Print ref
  const tablePrintRef = useRef<HTMLDivElement>(null);

  // 8. Distinct available years from data
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    yearSet.add(now.getFullYear());
    yearSet.add(now.getFullYear() - 1);
    yearSet.add(now.getFullYear() + 1);

    expenses.forEach((e) => {
      if (e.date) {
        const y = new Date(e.date).getFullYear();
        if (!isNaN(y)) yearSet.add(y);
      }
    });

    incomes.forEach((i) => {
      if (i.date) {
        const y = new Date(i.date).getFullYear();
        if (!isNaN(y)) yearSet.add(y);
      }
    });

    return Array.from(yearSet).sort((a, b) => b - a);
  }, [expenses, incomes]);

  // Month navigation helpers
  const handlePrev = () => {
    if (timeframeMode === "monthly") {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear((prev) => prev - 1);
      } else {
        setSelectedMonth((prev) => prev - 1);
      }
    } else {
      setSelectedYear((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (timeframeMode === "monthly") {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear((prev) => prev + 1);
      } else {
        setSelectedMonth((prev) => prev + 1);
      }
    } else {
      setSelectedYear((prev) => prev + 1);
    }
  };

  const handleSetCurrent = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  const isCurrentTimeframe =
    timeframeMode === "monthly"
      ? selectedYear === now.getFullYear() && selectedMonth === now.getMonth()
      : selectedYear === now.getFullYear();

  const currentLabel =
    timeframeMode === "monthly"
      ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
      : `Year ${selectedYear} (Annual Ledger)`;

  // Days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Filter raw data for current scope (Monthly or Yearly)
  const scopedExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      if (d.getFullYear() !== selectedYear) return false;
      if (timeframeMode === "monthly" && d.getMonth() !== selectedMonth) return false;
      return true;
    });
  }, [expenses, selectedYear, selectedMonth, timeframeMode]);

  const scopedIncomes = useMemo(() => {
    return incomes.filter((i) => {
      if (!i.date) return false;
      const d = new Date(i.date);
      if (d.getFullYear() !== selectedYear) return false;
      if (timeframeMode === "monthly" && d.getMonth() !== selectedMonth) return false;
      return true;
    });
  }, [incomes, selectedYear, selectedMonth, timeframeMode]);

  // Aggregate scope metrics
  const totalExpenseAmount = useMemo(() => {
    return scopedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [scopedExpenses]);

  const totalIncomeAmount = useMemo(() => {
    return scopedIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [scopedIncomes]);

  const netBalance = totalIncomeAmount - totalExpenseAmount;
  const savingsRate =
    totalIncomeAmount > 0 ? Math.round((netBalance / totalIncomeAmount) * 100) : 0;
  
  const avgDailySpend =
    timeframeMode === "monthly"
      ? Math.round(totalExpenseAmount / Math.max(1, daysInMonth))
      : Math.round(totalExpenseAmount / 365);

  const avgMonthlySpend =
    timeframeMode === "yearly" ? Math.round(totalExpenseAmount / 12) : totalExpenseAmount;

  // 12-Month Matrix Data for the selected year
  const yearMonthlyMatrix = useMemo(() => {
    return MONTH_NAMES.map((mName, mIdx) => {
      const mExp = expenses.filter((e) => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getFullYear() === selectedYear && d.getMonth() === mIdx;
      });
      const mInc = incomes.filter((i) => {
        if (!i.date) return false;
        const d = new Date(i.date);
        return d.getFullYear() === selectedYear && d.getMonth() === mIdx;
      });

      const expSum = mExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const incSum = mInc.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const net = incSum - expSum;
      const savingsPct = incSum > 0 ? Math.round((net / incSum) * 100) : 0;

      return {
        monthIndex: mIdx,
        monthName: mName,
        shortName: SHORT_MONTHS[mIdx],
        expenses: mExp,
        incomes: mInc,
        expenseSum: expSum,
        incomeSum: incSum,
        net,
        savingsPct,
        count: mExp.length + mInc.length,
        isCurrent: selectedYear === now.getFullYear() && mIdx === now.getMonth(),
        isSelected: mIdx === selectedMonth,
      };
    });
  }, [expenses, incomes, selectedYear, selectedMonth, now]);

  // Peak and Lowest Spending Months for Yearly mode
  const yearlyStats = useMemo(() => {
    if (timeframeMode !== "yearly") return null;

    const activeMonths = yearMonthlyMatrix.filter((m) => m.expenseSum > 0 || m.incomeSum > 0);
    if (activeMonths.length === 0) return null;

    const sortedByExp = [...activeMonths].sort((a, b) => b.expenseSum - a.expenseSum);
    const highestExpMonth = sortedByExp[0];
    const lowestExpMonth = sortedByExp[sortedByExp.length - 1];

    const sortedByNet = [...activeMonths].sort((a, b) => b.net - a.net);
    const bestSavingsMonth = sortedByNet[0];

    return {
      highestExpMonth,
      lowestExpMonth,
      bestSavingsMonth,
      activeMonthsCount: activeMonths.length,
    };
  }, [yearMonthlyMatrix, timeframeMode]);

  // Build unified chronological rows
  const unifiedRows = useMemo(() => {
    const list: UnifiedTransactionRow[] = [];

    scopedExpenses.forEach((e) => {
      list.push({
        id: `exp-${e.id}`,
        originalId: e.id,
        type: "expense",
        title: e.title,
        amount: Number(e.amount) || 0,
        category: e.category,
        paymentMode: e.paymentMode,
        date: e.date,
        time: e.time,
        notes: e.notes,
        party: e.merchantOrLocation || "",
        isRecurring: e.isRecurring,
        rawExpense: e,
      });
    });

    scopedIncomes.forEach((i) => {
      list.push({
        id: `inc-${i.id}`,
        originalId: i.id,
        type: "income",
        title: i.title,
        amount: Number(i.amount) || 0,
        category: i.category,
        paymentMode: i.paymentMode,
        date: i.date,
        time: i.time,
        notes: i.notes,
        party: i.sourceOrClient || "",
        isRecurring: i.isRecurring,
        rawIncome: i,
      });
    });

    // Sort chronologically ascending to calculate running balance accurately
    list.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
      const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
      return timeA - timeB;
    });

    let running = 0;
    list.forEach((row) => {
      if (row.type === "income") {
        running += row.amount;
      } else {
        running -= row.amount;
      }
      row.runningBalance = running;
    });

    return list;
  }, [scopedExpenses, scopedIncomes]);

  // Filter and Sort Table Rows based on UI Controls
  const filteredRows = useMemo(() => {
    let result = unifiedRows;

    // Segment filter
    if (activeSegment === "expenses") {
      result = result.filter((r) => r.type === "expense");
    } else if (activeSegment === "incomes") {
      result = result.filter((r) => r.type === "income");
    }

    // Category filter
    if (categoryFilter !== "ALL") {
      result = result.filter((r) => r.category === categoryFilter);
    }

    // Payment mode filter
    if (paymentModeFilter !== "ALL") {
      result = result.filter((r) => r.paymentMode === paymentModeFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const titleMatch = r.title.toLowerCase().includes(q);
        const catMatch = r.category.toLowerCase().includes(q);
        const partyMatch = r.party.toLowerCase().includes(q);
        const notesMatch = r.notes?.toLowerCase().includes(q) || false;
        const amtMatch = String(r.amount).includes(q);
        const modeMatch = r.paymentMode.toLowerCase().includes(q);
        return titleMatch || catMatch || partyMatch || notesMatch || amtMatch || modeMatch;
      });
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === "date-desc") {
        const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
        const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
        return timeB - timeA;
      }
      if (sortBy === "date-asc") {
        const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
        const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
        return timeA - timeB;
      }
      if (sortBy === "amount-desc") {
        return b.amount - a.amount;
      }
      if (sortBy === "amount-asc") {
        return a.amount - b.amount;
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [unifiedRows, activeSegment, categoryFilter, paymentModeFilter, searchQuery, sortBy]);

  // Aggregate sums for current filtered view
  const filteredExpenseSum = useMemo(() => {
    return filteredRows
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRows]);

  const filteredIncomeSum = useMemo(() => {
    return filteredRows
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRows]);

  // Daily Summary Data
  const dailySummaryList = useMemo(() => {
    const map = new Map<
      string,
      { date: string; dayName: string; expense: number; income: number; count: number }
    >();

    if (timeframeMode === "monthly") {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
        const d = new Date(selectedYear, selectedMonth, day);
        const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
        map.set(dateStr, { date: dateStr, dayName, expense: 0, income: 0, count: 0 });
      }
    }

    scopedExpenses.forEach((e) => {
      const dateStr = e.date ? e.date.split("T")[0] : "";
      if (!dateStr) return;
      let entry = map.get(dateStr);
      if (!entry) {
        const d = new Date(dateStr);
        const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
        entry = { date: dateStr, dayName, expense: 0, income: 0, count: 0 };
        map.set(dateStr, entry);
      }
      entry.expense += Number(e.amount) || 0;
      entry.count += 1;
    });

    scopedIncomes.forEach((i) => {
      const dateStr = i.date ? i.date.split("T")[0] : "";
      if (!dateStr) return;
      let entry = map.get(dateStr);
      if (!entry) {
        const d = new Date(dateStr);
        const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
        entry = { date: dateStr, dayName, expense: 0, income: 0, count: 0 };
        map.set(dateStr, entry);
      }
      entry.income += Number(i.amount) || 0;
      entry.count += 1;
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [scopedExpenses, scopedIncomes, selectedYear, selectedMonth, daysInMonth, timeframeMode]);

  // Category Breakdown Data
  const categoryBreakdownList = useMemo(() => {
    const expMap = new Map<string, { name: string; amount: number; count: number; type: "expense" }>();
    const incMap = new Map<string, { name: string; amount: number; count: number; type: "income" }>();

    scopedExpenses.forEach((e) => {
      const current = expMap.get(e.category) || {
        name: e.category,
        amount: 0,
        count: 0,
        type: "expense",
      };
      current.amount += Number(e.amount) || 0;
      current.count += 1;
      expMap.set(e.category, current);
    });

    scopedIncomes.forEach((i) => {
      const current = incMap.get(i.category) || {
        name: i.category,
        amount: 0,
        count: 0,
        type: "income",
      };
      current.amount += Number(i.amount) || 0;
      current.count += 1;
      incMap.set(i.category, current);
    });

    const expList = Array.from(expMap.values()).sort((a, b) => b.amount - a.amount);
    const incList = Array.from(incMap.values()).sort((a, b) => b.amount - a.amount);

    return { expList, incList };
  }, [scopedExpenses, scopedIncomes]);

  // All distinct categories for filter dropdown
  const allAvailableCategories = useMemo(() => {
    const set = new Set<string>();
    scopedExpenses.forEach((e) => set.add(e.category));
    scopedIncomes.forEach((i) => set.add(i.category));
    return Array.from(set).sort();
  }, [scopedExpenses, scopedIncomes]);

  // Distinct payment modes
  const allAvailablePaymentModes = useMemo(() => {
    const set = new Set<string>();
    scopedExpenses.forEach((e) => set.add(e.paymentMode));
    scopedIncomes.forEach((i) => set.add(i.paymentMode));
    return Array.from(set).sort();
  }, [scopedExpenses, scopedIncomes]);

  // Export handlers with universal Android APK / WebView / Desktop support
  const handleExportExcel = async () => {
    try {
      const scopeName =
        timeframeMode === "monthly"
          ? `${MONTH_NAMES[selectedMonth]}_${selectedYear}`
          : `Annual_Ledger_${selectedYear}`;

      const res = await exportTransactionsToExcel({
        expenses: scopedExpenses,
        incomes: scopedIncomes,
        user: currentUser,
        filterScopeName: scopeName,
        segment: "all",
        format: "xlsx",
      });

      if (!res.success) {
        setToastMessage(`Export alert: ${res.error || "Could not save file on this device."}`);
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      const msg =
        res.action === "shared"
          ? `Excel sheet shared: ${res.filename}`
          : `Downloaded ${res.filename} (${res.count} transactions)`;
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error("Export Excel error:", err);
      setToastMessage("Export failed: " + (err?.message || "Please check device permissions"));
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleExportCSV = async () => {
    try {
      const scopeName =
        timeframeMode === "monthly"
          ? `${MONTH_NAMES[selectedMonth]}_${selectedYear}`
          : `Annual_Ledger_${selectedYear}`;

      const res = await exportTransactionsToExcel({
        expenses: scopedExpenses,
        incomes: scopedIncomes,
        user: currentUser,
        filterScopeName: scopeName,
        segment: "all",
        format: "csv",
      });

      if (!res.success) {
        setToastMessage(`Export alert: ${res.error || "Could not save file on this device."}`);
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      const msg =
        res.action === "shared"
          ? `CSV sheet shared: ${res.filename}`
          : `Downloaded CSV Statement (${res.count} records)`;
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error("Export CSV error:", err);
      setToastMessage("Export failed: " + (err?.message || "Please check device permissions"));
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Print Statement Handler
  const handlePrintStatement = () => {
    window.print();
  };

  // AI Financial Audit Trigger
  const handleFetchAiAudit = async () => {
    setIsAiLoading(true);
    setActiveSegment("audit");
    try {
      const res = await fetch("/api/gemini/daily-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentMonthTotal: totalExpenseAmount,
          monthlyIncome: totalIncomeAmount,
          monthLabel: currentLabel,
          userContext: `${timeframeMode === "monthly" ? "Monthly" : "Annual"} Statement for ${currentLabel}. Total Income: ₹${totalIncomeAmount}, Total Expenses: ₹${totalExpenseAmount}, Net Balance: ₹${netBalance}, Transactions: ${unifiedRows.length}, Savings Ratio: ${savingsRate}%.`,
        }),
      });
      const data = await res.json();
      if (data.success && data.advice) {
        setAiAuditResult(
          `${data.advice.title}: ${data.advice.punchline}\n\n${data.advice.detailedAdvice}\n\nActionable Tip: ${data.advice.actionableStep || ""}`
        );
      } else {
        setAiAuditResult(
          `Financial Health Audit for ${currentLabel}:\n• Total Inflow: ${formatINR(totalIncomeAmount)}\n• Total Outflow: ${formatINR(totalExpenseAmount)}\n• Net Savings: ${formatINR(netBalance)} (${savingsRate}% savings rate).\n• Recommendation: Maintain at least a 20% savings buffer and optimize top recurring expenses.`
        );
      }
    } catch {
      setAiAuditResult(
        `Financial Summary for ${currentLabel}:\nTotal Inflow: ${formatINR(totalIncomeAmount)} | Total Outflow: ${formatINR(totalExpenseAmount)} | Net Surplus: ${formatINR(netBalance)}.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div id="monthly-statement-table-page" className="space-y-4 sm:space-y-5 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#202124] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-slideDown">
          <Check size={16} className="text-[#34A853]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MASTER FEATURE NAV BAR (Monthly & Yearly Scope + Sub-Features)          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E8EAED] p-3 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
        {/* Row 1: Timeframe Mode Filter Toggle + Date Switcher + Action Hub */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Timeframe Switcher (Monthly vs Yearly) & Period Picker */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap">
            {/* Timeframe Mode Pill Switcher */}
            <div className="inline-flex p-1 bg-[#F1F3F4] rounded-2xl border border-[#E8EAED] shrink-0">
              <button
                type="button"
                id="filter-mode-monthly"
                onClick={() => setTimeframeMode("monthly")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeframeMode === "monthly"
                    ? "bg-white text-[#1A73E8] shadow-xs"
                    : "text-[#5F6368] hover:text-[#202124]"
                }`}
              >
                <Calendar size={14} />
                <span>Monthly Filter</span>
              </button>

              <button
                type="button"
                id="filter-mode-yearly"
                onClick={() => setTimeframeMode("yearly")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeframeMode === "yearly"
                    ? "bg-white text-[#1A73E8] shadow-xs"
                    : "text-[#5F6368] hover:text-[#202124]"
                }`}
              >
                <CalendarDays size={14} />
                <span>Yearly Filter</span>
              </button>
            </div>

            {/* Date / Month Picker Dropdown */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="relative inline-block">
                <button
                  type="button"
                  id="btn-toggle-period-picker"
                  onClick={() => {
                    if (timeframeMode === "monthly") {
                      setIsMonthPickerOpen((prev) => !prev);
                      setIsYearPickerOpen(false);
                    } else {
                      setIsYearPickerOpen((prev) => !prev);
                      setIsMonthPickerOpen(false);
                    }
                  }}
                  className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#202124] hover:text-[#1A73E8] bg-[#F8F9FA] hover:bg-[#E8F0FE] px-3 py-1.5 rounded-xl border border-[#E8EAED] transition-colors cursor-pointer"
                >
                  <span>{currentLabel}</span>
                  <ChevronDown size={15} className="text-[#5F6368]" />
                </button>

                {/* Dropdown for Month Selection */}
                {isMonthPickerOpen && timeframeMode === "monthly" && (
                  <div className="absolute left-0 mt-2 w-72 bg-white border border-[#DADCE0] rounded-2xl shadow-xl p-3 z-50 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F1F3F4]">
                      <span className="text-xs font-bold text-[#5F6368]">Select Month</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedYear((y) => y - 1)}
                          className="px-2 py-0.5 text-xs font-bold text-[#5F6368] hover:bg-[#F1F3F4] rounded"
                        >
                          {selectedYear - 1}
                        </button>
                        <span className="text-xs font-black text-[#1A73E8]">{selectedYear}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedYear((y) => y + 1)}
                          className="px-2 py-0.5 text-xs font-bold text-[#5F6368] hover:bg-[#F1F3F4] rounded"
                        >
                          {selectedYear + 1}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTH_NAMES.map((mName, idx) => (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(idx);
                            setIsMonthPickerOpen(false);
                          }}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg text-center transition-all cursor-pointer ${
                            selectedMonth === idx
                              ? "bg-[#1A73E8] text-white font-bold"
                              : "hover:bg-[#F1F3F4] text-[#3C4043]"
                          }`}
                        >
                          {mName.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dropdown for Year Selection */}
                {isYearPickerOpen && timeframeMode === "yearly" && (
                  <div className="absolute left-0 mt-2 w-56 bg-white border border-[#DADCE0] rounded-2xl shadow-xl p-3 z-50 animate-fadeIn space-y-1">
                    <div className="text-xs font-bold text-[#5F6368] pb-1.5 border-b border-[#F1F3F4]">
                      Select Financial / Calendar Year
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {availableYears.map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            setSelectedYear(yr);
                            setIsYearPickerOpen(false);
                          }}
                          className={`py-2 px-3 text-xs font-bold rounded-xl text-center transition-all cursor-pointer ${
                            selectedYear === yr
                              ? "bg-[#1A73E8] text-white"
                              : "hover:bg-[#F1F3F4] text-[#3C4043]"
                          }`}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-0.5 bg-[#F1F3F4] rounded-full p-0.5 border border-[#E8EAED]">
                <button
                  type="button"
                  id="btn-prev-timeframe"
                  onClick={handlePrev}
                  title={timeframeMode === "monthly" ? "Previous Month" : "Previous Year"}
                  className="p-1 rounded-full hover:bg-white text-[#5F6368] hover:text-[#202124] transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  id="btn-next-timeframe"
                  onClick={handleNext}
                  title={timeframeMode === "monthly" ? "Next Month" : "Next Year"}
                  className="p-1 rounded-full hover:bg-white text-[#5F6368] hover:text-[#202124] transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Reset to Current Period Button */}
              {!isCurrentTimeframe && (
                <button
                  type="button"
                  id="btn-reset-current-period"
                  onClick={handleSetCurrent}
                  className="text-[11px] font-bold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                >
                  {timeframeMode === "monthly" ? "This Month" : "This Year"}
                </button>
              )}
            </div>
          </div>

          {/* Right: Quick Action Buttons & Exports */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-start lg:self-auto">
            {/* AI Advisor Insight Button */}
            <button
              type="button"
              id="btn-month-ai-review"
              onClick={handleFetchAiAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#FEF7E0] hover:bg-[#FEEFC3] text-[#B06000] border border-[#FEEFC3] rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles size={14} className="text-[#F9AB00]" />
              <span>AI {timeframeMode === "monthly" ? "Month" : "Year"} Audit</span>
            </button>

            {/* Export Excel (.xlsx) */}
            <button
              type="button"
              id="btn-export-monthly-excel"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] border border-[#CEEAD6] rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Download Excel Sheet (.xlsx)"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              id="btn-export-monthly-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white hover:bg-[#F1F3F4] text-[#3C4043] border border-[#DADCE0] rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Download CSV"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>

            {/* Print Statement */}
            <button
              type="button"
              id="btn-print-monthly-statement"
              onClick={handlePrintStatement}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white hover:bg-[#F1F3F4] text-[#3C4043] border border-[#DADCE0] rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Print / Save PDF Table"
            >
              <Printer size={14} />
              <span className="hidden md:inline">Print</span>
            </button>

            {/* Add Spend & Income Shortcuts */}
            <button
              type="button"
              id="btn-table-add-expense"
              onClick={onOpenAddExpense}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus size={14} />
              <span>Spend</span>
            </button>

            <button
              type="button"
              id="btn-table-add-income"
              onClick={onOpenAddIncome}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#0F9D58] hover:bg-[#0B8043] text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus size={14} />
              <span>Income</span>
            </button>
          </div>
        </div>

        {/* Row 2: Quick Jump Bar (Month Selector Slider in Monthly mode, or Year pills in Yearly mode) */}
        {timeframeMode === "monthly" ? (
          <div className="pt-2 border-t border-[#F1F3F4] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max pb-1">
              <span className="text-[11px] font-bold text-[#5F6368] mr-1 shrink-0">Quick Month:</span>
              {yearMonthlyMatrix.map((m) => {
                const isSel = m.monthIndex === selectedMonth;
                const hasData = m.expenseSum > 0 || m.incomeSum > 0;

                return (
                  <button
                    key={m.monthIndex}
                    type="button"
                    onClick={() => setSelectedMonth(m.monthIndex)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      isSel
                        ? "bg-[#1A73E8] text-white shadow-2xs"
                        : hasData
                        ? "bg-[#E8F0FE] text-[#1A73E8] hover:bg-[#D2E3FC]"
                        : "bg-[#F8F9FA] text-[#5F6368] hover:bg-[#E8EAED]"
                    }`}
                  >
                    <span>{m.shortName}</span>
                    {hasData && (
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded-md font-mono ${
                          isSel ? "bg-white/20 text-white" : "bg-white text-[#1A73E8]"
                        }`}
                      >
                        {formatINR(m.expenseSum, true)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-[#F1F3F4] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max pb-1">
              <span className="text-[11px] font-bold text-[#5F6368] mr-1 shrink-0">Annual View:</span>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedYear === yr
                      ? "bg-[#1A73E8] text-white shadow-2xs"
                      : "bg-[#F8F9FA] text-[#5F6368] hover:bg-[#E8EAED]"
                  }`}
                >
                  Year {yr}
                </button>
              ))}
              <span className="text-[11px] text-[#5F6368] ml-2">
                Showing all 12-month consolidated financial records for {selectedYear}
              </span>
            </div>
          </div>
        )}

        {/* Row 3: Feature Sub-Nav Tabs (All Ledger, Expenses, Incomes, Daily Sheet, Categories, 12-Month Matrix, AI Audit) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F1F3F4] flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              type="button"
              id="feature-tab-all"
              onClick={() => setActiveSegment("all")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "all"
                  ? "bg-[#E8F0FE] text-[#1A73E8] font-bold shadow-2xs border border-[#D2E3FC]"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <Table2 size={14} />
              <span>All Ledger ({unifiedRows.length})</span>
            </button>

            <button
              type="button"
              id="feature-tab-expenses"
              onClick={() => setActiveSegment("expenses")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "expenses"
                  ? "bg-[#FCE8E6] text-[#C5221F] font-bold shadow-2xs border border-[#FAD2CF]"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <TrendingDown size={14} />
              <span>Expenses ({scopedExpenses.length})</span>
            </button>

            <button
              type="button"
              id="feature-tab-incomes"
              onClick={() => setActiveSegment("incomes")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "incomes"
                  ? "bg-[#E6F4EA] text-[#137333] font-bold shadow-2xs border border-[#CEEAD6]"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <TrendingUp size={14} />
              <span>Income ({scopedIncomes.length})</span>
            </button>

            <button
              type="button"
              id="feature-tab-matrix"
              onClick={() => setActiveSegment("matrix")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "matrix"
                  ? "bg-[#E8F0FE] text-[#1A73E8] font-bold shadow-2xs border border-[#D2E3FC]"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <BarChart3 size={14} />
              <span>12-Month Matrix</span>
            </button>

            <button
              type="button"
              id="feature-tab-daily"
              onClick={() => setActiveSegment("daily")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "daily"
                  ? "bg-[#E8F0FE] text-[#1A73E8] font-bold shadow-2xs border border-[#D2E3FC]"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <Calendar size={14} />
              <span>Daily Breakdown</span>
            </button>

            <button
              type="button"
              id="feature-tab-categories"
              onClick={() => setActiveSegment("categories")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "categories"
                  ? "bg-[#E8F0FE] text-[#1A73E8] font-bold shadow-2xs border border-[#D2E3FC]"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <Layers size={14} />
              <span>Category Matrix</span>
            </button>

            <button
              type="button"
              id="feature-tab-audit"
              onClick={() => {
                setActiveSegment("audit");
                if (!aiAuditResult) handleFetchAiAudit();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "audit"
                  ? "bg-[#FEF7E0] text-[#B06000] font-bold shadow-2xs border border-[#FEEFC3]"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <Sparkles size={14} className="text-[#F9AB00]" />
              <span>AI Audit</span>
            </button>
          </div>

          {/* Density Toggle */}
          <button
            type="button"
            onClick={() => setIsCompact((c) => !c)}
            className="text-[11px] font-semibold text-[#5F6368] hover:text-[#202124] px-2.5 py-1 rounded-lg hover:bg-[#F1F3F4] transition-colors cursor-pointer shrink-0 hidden sm:inline-block"
          >
            {isCompact ? "Comfortable Table" : "Compact Table"}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FINANCIAL SUMMARY CARDS (Monthly / Yearly Aggregates)                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Inflow (Income) */}
        <div className="bg-white rounded-2xl border border-[#CEEAD6] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#137333] flex items-center gap-1">
              <ArrowUpRight size={14} />
              {timeframeMode === "monthly" ? "Month Inflow (Credit)" : `Annual Inflow (${selectedYear})`}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333]">
              {scopedIncomes.length} Credits
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#0F9D58] tracking-tight">
            +{formatINR(totalIncomeAmount)}
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1">
            {timeframeMode === "monthly"
              ? `Earnings recorded in ${MONTH_NAMES[selectedMonth]}`
              : `Total recorded income across all 12 months`}
          </p>
        </div>

        {/* Total Outflow (Expenses) */}
        <div className="bg-white rounded-2xl border border-[#FAD2CF] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#C5221F] flex items-center gap-1">
              <ArrowDownRight size={14} />
              {timeframeMode === "monthly" ? "Month Outflow (Debit)" : `Annual Outflow (${selectedYear})`}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCE8E6] text-[#C5221F]">
              {scopedExpenses.length} Debits
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#D93025] tracking-tight">
            -{formatINR(totalExpenseAmount)}
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1">
            {timeframeMode === "monthly"
              ? `Avg ${formatINR(avgDailySpend)} / day`
              : `Avg ${formatINR(avgMonthlySpend)} / month`}
          </p>
        </div>

        {/* Net Balance */}
        <div
          className={`bg-white rounded-2xl border p-4 shadow-xs relative overflow-hidden ${
            netBalance >= 0 ? "border-[#D2E3FC]" : "border-[#FAD2CF]"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#1A73E8] flex items-center gap-1">
              <Wallet size={14} />
              {timeframeMode === "monthly" ? "Net Monthly Balance" : "Net Annual Savings"}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                netBalance >= 0 ? "bg-[#E8F0FE] text-[#1A73E8]" : "bg-[#FCE8E6] text-[#D93025]"
              }`}
            >
              {netBalance >= 0 ? "Surplus" : "Deficit"}
            </span>
          </div>
          <div
            className={`text-lg sm:text-2xl font-black tracking-tight ${
              netBalance >= 0 ? "text-[#1A73E8]" : "text-[#D93025]"
            }`}
          >
            {formatINR(netBalance)}
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1">
            {netBalance >= 0 ? "Retained cashflow surplus" : "Total expenditure exceeds inflow"}
          </p>
        </div>

        {/* Savings Ratio / Yearly Peak Metric */}
        <div className="bg-white rounded-2xl border border-[#E8EAED] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#5F6368] flex items-center gap-1">
              <Percent size={14} />
              Savings Ratio
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1F3F4] text-[#202124]">
              {unifiedRows.length} Total Txns
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#202124] tracking-tight">
            {savingsRate}%
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1">
            {yearlyStats?.bestSavingsMonth
              ? `Best Month: ${yearlyStats.bestSavingsMonth.monthName} (+${formatINR(yearlyStats.bestSavingsMonth.net)})`
              : `${formatINR(Math.max(0, netBalance))} saved in ${currentLabel}`}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-VIEW: 12-MONTH MATRIX & COMPARATIVE ANNUAL GRID                     */}
      {/* ========================================================================= */}
      {activeSegment === "matrix" && (
        <div className="bg-white rounded-3xl border border-[#E8EAED] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#F1F3F4] pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#202124] flex items-center gap-2">
                <BarChart3 size={18} className="text-[#1A73E8]" />
                <span>12-Month Financial Matrix ({selectedYear})</span>
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Month-by-month cashflow, income, expense debit, and savings rate. Click any month to inspect detailed statement.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-[#E8F0FE] text-[#1A73E8] rounded-full">
              Full Year {selectedYear}
            </span>
          </div>

          {/* 12-Month Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {yearMonthlyMatrix.map((m) => {
              const hasActivity = m.expenseSum > 0 || m.incomeSum > 0;
              const isCurrent = m.isCurrent;
              const isSelected = m.isSelected;

              return (
                <div
                  key={m.monthIndex}
                  onClick={() => {
                    setSelectedMonth(m.monthIndex);
                    setTimeframeMode("monthly");
                    setActiveSegment("all");
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? "border-[#1A73E8] bg-[#F8FAFF] shadow-xs"
                      : isCurrent
                      ? "border-[#D2E3FC] bg-white hover:border-[#1A73E8]"
                      : "border-[#E8EAED] bg-white hover:border-[#DADCE0] hover:shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#202124] group-hover:text-[#1A73E8] transition-colors">
                      {m.monthName}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#1A73E8] text-white rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#5F6368]">Outflow:</span>
                      <span className="font-bold text-[#D93025]">
                        {m.expenseSum > 0 ? `-${formatINR(m.expenseSum)}` : "₹0"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#5F6368]">Inflow:</span>
                      <span className="font-bold text-[#0F9D58]">
                        {m.incomeSum > 0 ? `+${formatINR(m.incomeSum)}` : "₹0"}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-[#F1F3F4] flex items-center justify-between font-bold">
                      <span className="text-[11px] text-[#202124]">Net:</span>
                      <span className={m.net >= 0 ? "text-[#1A73E8]" : "text-[#D93025]"}>
                        {hasActivity ? (m.net >= 0 ? `+${formatINR(m.net)}` : formatINR(m.net)) : "—"}
                      </span>
                    </div>
                  </div>

                  {hasActivity && (
                    <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-[#80868B]">
                      <span>{m.count} txns</span>
                      <span className={m.savingsPct >= 0 ? "text-[#137333] font-bold" : "text-[#C5221F] font-bold"}>
                        {m.savingsPct}% saved
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Full 12-Month Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#E8EAED] mt-4">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E8EAED] text-[11px] font-bold text-[#5F6368] uppercase">
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Debit Outflow (₹)</th>
                  <th className="py-2.5 px-3 text-right">Credit Inflow (₹)</th>
                  <th className="py-2.5 px-3 text-right">Net Monthly Surplus</th>
                  <th className="py-2.5 px-3 text-center">Savings Rate</th>
                  <th className="py-2.5 px-3 text-center">Txn Count</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F4] text-xs">
                {yearMonthlyMatrix.map((m) => (
                  <tr key={m.monthIndex} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#202124]">{m.monthName}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#D93025]">
                      {m.expenseSum > 0 ? `-${formatINR(m.expenseSum)}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#0F9D58]">
                      {m.incomeSum > 0 ? `+${formatINR(m.incomeSum)}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={m.net >= 0 ? "text-[#1A73E8]" : "text-[#D93025]"}>
                        {m.expenseSum > 0 || m.incomeSum > 0 ? formatINR(m.net) : "—"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {m.incomeSum > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-bold text-[11px]">
                          {m.savingsPct}%
                        </span>
                      ) : (
                        <span className="text-[#80868B]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#5F6368]">{m.count}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMonth(m.monthIndex);
                          setTimeframeMode("monthly");
                          setActiveSegment("all");
                        }}
                        className="text-[11px] font-bold text-[#1A73E8] hover:underline cursor-pointer"
                      >
                        View Ledger →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8F9FA] border-t-2 border-[#DADCE0] font-bold text-xs text-[#202124]">
                  <td className="py-3 px-3">Total for Year {selectedYear}:</td>
                  <td className="py-3 px-3 text-right text-[#D93025] font-black text-sm">
                    -{formatINR(totalExpenseAmount)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#0F9D58] font-black text-sm">
                    +{formatINR(totalIncomeAmount)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#1A73E8] font-black text-sm">
                    {formatINR(netBalance)}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-sm text-[#202124]">
                    {savingsRate}%
                  </td>
                  <td className="py-3 px-3 text-center text-[#5F6368]">{unifiedRows.length} total</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-VIEW: AI FINANCIAL AUDIT                                           */}
      {/* ========================================================================= */}
      {activeSegment === "audit" && (
        <div className="bg-[#FEF7E0] border border-[#FEEFC3] rounded-3xl p-5 sm:p-6 shadow-xs animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-[#FEEAA7] pb-3">
            <div className="flex items-center gap-2.5">
              <Sparkles size={20} className="text-[#F9AB00]" />
              <h3 className="text-sm sm:text-base font-bold text-[#202124]">
                AI Financial Health & Cashflow Audit — {currentLabel}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleFetchAiAudit}
              disabled={isAiLoading}
              className="flex items-center gap-1 text-xs font-bold text-[#B06000] hover:text-[#202124] px-3 py-1 bg-white/60 rounded-full border border-[#FEEFC3] cursor-pointer"
            >
              <RefreshCw size={13} className={isAiLoading ? "animate-spin" : ""} />
              <span>Re-analyze</span>
            </button>
          </div>

          {isAiLoading ? (
            <div className="flex items-center gap-3 text-xs font-medium text-[#B06000] py-6 justify-center">
              <RefreshCw size={20} className="animate-spin text-[#F9AB00]" />
              <span>Analyzing all {unifiedRows.length} transactions for {currentLabel}...</span>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-[#3C4043] leading-relaxed whitespace-pre-line bg-white/80 rounded-2xl p-4 sm:p-5 border border-[#FEEAA7]">
              {aiAuditResult || "Click 'Re-analyze' to run a deep AI audit on your cashflow and expense habits."}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MAIN TABULAR LEDGER (Unified / Expenses / Incomes / Daily / Categories) */}
      {/* ========================================================================= */}
      {(activeSegment === "all" ||
        activeSegment === "expenses" ||
        activeSegment === "incomes" ||
        activeSegment === "daily" ||
        activeSegment === "categories") && (
        <div className="bg-white rounded-3xl border border-[#E8EAED] p-4 sm:p-5 shadow-xs space-y-4">
          {/* Filter & Search Bar */}
          {(activeSegment === "all" || activeSegment === "expenses" || activeSegment === "incomes") && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
              {/* Search Input */}
              <div className="sm:col-span-5 relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868B]"
                />
                <input
                  type="text"
                  id="input-table-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search description, shop, category, notes..."
                  className="w-full pl-9 pr-8 py-2 bg-[#F8F9FA] border border-[#E8EAED] focus:border-[#1A73E8] focus:bg-white rounded-xl text-xs text-[#202124] placeholder-[#80868B] outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#80868B] hover:text-[#202124] cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Dropdown Filter */}
              <div className="sm:col-span-3">
                <select
                  id="select-table-category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-[#F8F9FA] border border-[#E8EAED] focus:border-[#1A73E8] rounded-xl text-xs font-semibold text-[#202124] outline-none cursor-pointer truncate"
                >
                  <option value="ALL">All Categories ({allAvailableCategories.length})</option>
                  {allAvailableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Mode Filter */}
              <div className="sm:col-span-2">
                <select
                  id="select-table-payment-mode"
                  value={paymentModeFilter}
                  onChange={(e) => setPaymentModeFilter(e.target.value)}
                  className="w-full py-2 px-2.5 bg-[#F8F9FA] border border-[#E8EAED] focus:border-[#1A73E8] rounded-xl text-xs font-semibold text-[#202124] outline-none cursor-pointer truncate"
                >
                  <option value="ALL">All Modes</option>
                  {allAvailablePaymentModes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Selector */}
              <div className="sm:col-span-2">
                <select
                  id="select-table-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full py-2 px-2.5 bg-[#F8F9FA] border border-[#E8EAED] focus:border-[#1A73E8] rounded-xl text-xs font-semibold text-[#202124] outline-none cursor-pointer truncate"
                >
                  <option value="date-desc">Newest Date</option>
                  <option value="date-asc">Oldest Date</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                  <option value="title-asc">Title (A-Z)</option>
                </select>
              </div>
            </div>
          )}

          {/* A. UNIFIED / EXPENSES / INCOMES TABLE */}
          {(activeSegment === "all" || activeSegment === "expenses" || activeSegment === "incomes") && (
            <div ref={tablePrintRef} className="overflow-x-auto rounded-2xl border border-[#E8EAED]">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E8EAED] text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Payment Mode</th>
                    <th className="py-3 px-3">Merchant / Source</th>
                    <th className="py-3 px-3 text-right">Debit (₹)</th>
                    <th className="py-3 px-3 text-right">Credit (₹)</th>
                    {activeSegment === "all" && <th className="py-3 px-3 text-right">Net Running</th>}
                    <th className="py-3 px-3 text-center w-20">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F1F3F4] text-xs">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-[#5F6368] bg-[#F8F9FA]/50">
                        <div className="w-12 h-12 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto mb-2">
                          <Table2 size={22} />
                        </div>
                        <p className="font-bold text-sm text-[#202124]">No records in this statement</p>
                        <p className="text-xs text-[#5F6368] mt-1 max-w-sm mx-auto">
                          {searchQuery || categoryFilter !== "ALL" || paymentModeFilter !== "ALL"
                            ? "No transactions match the selected filters. Try clearing your search."
                            : `No transactions logged for ${currentLabel}. Click 'Spend' or 'Income' above to log entries.`}
                        </p>
                        {(searchQuery || categoryFilter !== "ALL" || paymentModeFilter !== "ALL") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setCategoryFilter("ALL");
                              setPaymentModeFilter("ALL");
                            }}
                            className="mt-3 px-3.5 py-1.5 bg-[#1A73E8] text-white text-xs font-semibold rounded-full hover:bg-[#1557B0] cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, index) => {
                      const isExp = row.type === "expense";
                      const catMeta = isExp
                        ? resolveExpenseMeta(row.category, customExpenseCategories)
                        : resolveIncomeMeta(row.category, customIncomeCategories);

                      return (
                        <tr
                          key={row.id}
                          id={`statement-row-${row.id}`}
                          className={`hover:bg-[#F8F9FA] transition-colors ${
                            isCompact ? "py-1.5" : "py-2.5"
                          }`}
                        >
                          {/* 1. S.No */}
                          <td className="py-2.5 px-3 text-center text-[#80868B] font-mono font-medium text-[11px]">
                            {index + 1}
                          </td>

                          {/* 2. Date & Time */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-semibold text-[#202124]">
                              {formatFriendlyDate(row.date)}
                            </div>
                            <div className="text-[10px] text-[#80868B] flex items-center gap-1 font-mono">
                              <Clock size={10} />
                              {row.time || "12:00 PM"}
                            </div>
                          </td>

                          {/* 3. Type */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {isExp ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FCE8E6] text-[#C5221F]">
                                <TrendingDown size={11} />
                                <span>Expense</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E6F4EA] text-[#137333]">
                                <TrendingUp size={11} />
                                <span>Income</span>
                              </span>
                            )}
                          </td>

                          {/* 4. Description / Title */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#202124] max-w-[220px] truncate">
                              {row.title}
                            </div>
                            {row.notes && (
                              <div className="text-[11px] text-[#5F6368] max-w-[220px] truncate">
                                💬 {row.notes}
                              </div>
                            )}
                          </td>

                          {/* 5. Category */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                              style={{
                                backgroundColor: catMeta.bgColor,
                                color: catMeta.color,
                              }}
                            >
                              {isExp ? (
                                <CategoryIcon category={row.category as ExpenseCategory} size={13} />
                              ) : (
                                <IncomeIcon category={row.category as IncomeCategory} size={13} />
                              )}
                              <span>{row.category}</span>
                            </div>
                          </td>

                          {/* 6. Payment Mode */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F1F3F4] text-[#3C4043] border border-[#E8EAED]">
                              {row.paymentMode}
                            </span>
                          </td>

                          {/* 7. Merchant / Source */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-[#5F6368]">
                            {row.party ? (
                              <span className="flex items-center gap-1 text-[11px] text-[#3C4043] font-medium">
                                <MapPin size={11} className="text-[#80868B]" />
                                {row.party}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#9AA0A6]">—</span>
                            )}
                          </td>

                          {/* 8. Debit (Expense ₹) */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-[#D93025]">
                            {isExp ? formatINR(row.amount) : "—"}
                          </td>

                          {/* 9. Credit (Income ₹) */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-[#0F9D58]">
                            {!isExp ? `+${formatINR(row.amount)}` : "—"}
                          </td>

                          {/* 10. Net Running Balance */}
                          {activeSegment === "all" && (
                            <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-xs">
                              <span
                                className={
                                  (row.runningBalance || 0) >= 0
                                    ? "text-[#1A73E8]"
                                    : "text-[#D93025]"
                                }
                              >
                                {formatINR(row.runningBalance || 0)}
                              </span>
                            </td>
                          )}

                          {/* 11. Actions */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExp && row.rawExpense) {
                                    onEditExpense(row.rawExpense);
                                  } else if (!isExp && row.rawIncome) {
                                    onEditIncome(row.rawIncome);
                                  }
                                }}
                                className="p-1 text-[#5F6368] hover:text-[#1A73E8] hover:bg-white rounded transition-colors cursor-pointer"
                                title="Edit Entry"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExp) {
                                    onDeleteExpense(row.originalId);
                                  } else {
                                    onDeleteIncome(row.originalId);
                                  }
                                }}
                                className="p-1 text-[#5F6368] hover:text-[#EA4335] hover:bg-white rounded transition-colors cursor-pointer"
                                title="Delete Entry"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* TABLE FOOTER SUMMARY */}
                {filteredRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#F8F9FA] border-t-2 border-[#DADCE0] font-bold text-xs text-[#202124]">
                      <td colSpan={7} className="py-3 px-3 text-right text-[#5F6368]">
                        Total for {filteredRows.length} transactions:
                      </td>
                      <td className="py-3 px-3 text-right text-[#D93025] font-black text-sm">
                        -{formatINR(filteredExpenseSum)}
                      </td>
                      <td className="py-3 px-3 text-right text-[#0F9D58] font-black text-sm">
                        +{formatINR(filteredIncomeSum)}
                      </td>
                      {activeSegment === "all" && (
                        <td className="py-3 px-3 text-right text-[#1A73E8] font-black text-sm">
                          {formatINR(filteredIncomeSum - filteredExpenseSum)}
                        </td>
                      )}
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* B. DAY-BY-DAY AGGREGATION TABLE */}
          {activeSegment === "daily" && (
            <div className="overflow-x-auto rounded-2xl border border-[#E8EAED]">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E8EAED] text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Day</th>
                    <th className="py-3 px-3 text-right">Debit / Outflow (₹)</th>
                    <th className="py-3 px-3 text-right">Credit / Inflow (₹)</th>
                    <th className="py-3 px-3 text-right">Daily Net Cashflow</th>
                    <th className="py-3 px-3 text-center">Entries Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F4] text-xs">
                  {dailySummaryList.map((dayItem) => {
                    const dayNet = dayItem.income - dayItem.expense;
                    const hasActivity = dayItem.expense > 0 || dayItem.income > 0;

                    return (
                      <tr
                        key={dayItem.date}
                        className={`hover:bg-[#F8F9FA] transition-colors ${
                          hasActivity ? "font-semibold" : "text-[#80868B]"
                        }`}
                      >
                        <td className="py-2.5 px-3">{formatFriendlyDate(dayItem.date)}</td>
                        <td className="py-2.5 px-3 text-[#5F6368]">{dayItem.dayName}</td>
                        <td className="py-2.5 px-3 text-right text-[#D93025]">
                          {dayItem.expense > 0 ? `-${formatINR(dayItem.expense)}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#0F9D58]">
                          {dayItem.income > 0 ? `+${formatINR(dayItem.income)}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {hasActivity ? (
                            <span className={dayNet >= 0 ? "text-[#1A73E8]" : "text-[#D93025]"}>
                              {dayNet >= 0 ? `+${formatINR(dayNet)}` : formatINR(dayNet)}
                            </span>
                          ) : (
                            <span className="text-[#9AA0A6]">₹0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1F3F4] text-[#5F6368]">
                            {dayItem.count}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8F9FA] border-t-2 border-[#DADCE0] font-bold text-xs text-[#202124]">
                    <td colSpan={2} className="py-3 px-3 text-right text-[#5F6368]">
                      {timeframeMode === "monthly" ? "Monthly Totals:" : "Annual Totals:"}
                    </td>
                    <td className="py-3 px-3 text-right text-[#D93025] font-black text-sm">
                      -{formatINR(totalExpenseAmount)}
                    </td>
                    <td className="py-3 px-3 text-right text-[#0F9D58] font-black text-sm">
                      +{formatINR(totalIncomeAmount)}
                    </td>
                    <td className="py-3 px-3 text-right text-[#1A73E8] font-black text-sm">
                      {formatINR(netBalance)}
                    </td>
                    <td className="py-3 px-3 text-center text-[#5F6368]">
                      {unifiedRows.length} total
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* C. CATEGORY BREAKDOWN TABLE */}
          {activeSegment === "categories" && (
            <div className="space-y-6">
              {/* Expense Categories Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-[#C5221F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingDown size={14} />
                  <span>Expense Categories Breakdown ({categoryBreakdownList.expList.length})</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-[#E8EAED]">
                  <table className="w-full text-left border-collapse min-w-[550px]">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E8EAED] text-[11px] font-bold text-[#5F6368] uppercase">
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Total Outflow (₹)</th>
                        <th className="py-2.5 px-3 text-right">% of Total Spends</th>
                        <th className="py-2.5 px-3 text-center">Txn Count</th>
                        <th className="py-2.5 px-3 text-right">Avg / Txn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F3F4] text-xs">
                      {categoryBreakdownList.expList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#5F6368]">
                            No expenses recorded in {currentLabel}
                          </td>
                        </tr>
                      ) : (
                        categoryBreakdownList.expList.map((item) => {
                          const pct =
                            totalExpenseAmount > 0
                              ? Math.round((item.amount / totalExpenseAmount) * 100)
                              : 0;
                          const avg = Math.round(item.amount / (item.count || 1));
                          const meta = resolveExpenseMeta(item.name, customExpenseCategories);

                          return (
                            <tr key={item.name} className="hover:bg-[#F8F9FA]">
                              <td className="py-2.5 px-3 font-semibold text-[#202124] flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-md flex items-center justify-center"
                                  style={{ backgroundColor: meta.bgColor }}
                                >
                                  <CategoryIcon category={item.name as ExpenseCategory} size={13} />
                                </div>
                                <span>{item.name}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-[#D93025]">
                                {formatINR(item.amount)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="px-2 py-0.5 rounded-full bg-[#FCE8E6] text-[#C5221F] font-bold text-[11px]">
                                  {pct}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center text-[#5F6368]">
                                {item.count}
                              </td>
                              <td className="py-2.5 px-3 text-right text-[#5F6368] font-medium">
                                {formatINR(avg)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Income Categories Breakdown */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-[#137333] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp size={14} />
                  <span>Income Sources Breakdown ({categoryBreakdownList.incList.length})</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-[#E8EAED]">
                  <table className="w-full text-left border-collapse min-w-[550px]">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E8EAED] text-[11px] font-bold text-[#5F6368] uppercase">
                        <th className="py-2.5 px-3">Category / Stream</th>
                        <th className="py-2.5 px-3 text-right">Total Inflow (₹)</th>
                        <th className="py-2.5 px-3 text-right">% of Total Earnings</th>
                        <th className="py-2.5 px-3 text-center">Txn Count</th>
                        <th className="py-2.5 px-3 text-right">Avg / Txn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F3F4] text-xs">
                      {categoryBreakdownList.incList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#5F6368]">
                            No income recorded in {currentLabel}
                          </td>
                        </tr>
                      ) : (
                        categoryBreakdownList.incList.map((item) => {
                          const pct =
                            totalIncomeAmount > 0
                              ? Math.round((item.amount / totalIncomeAmount) * 100)
                              : 0;
                          const avg = Math.round(item.amount / (item.count || 1));
                          const meta = resolveIncomeMeta(item.name, customIncomeCategories);

                          return (
                            <tr key={item.name} className="hover:bg-[#F8F9FA]">
                              <td className="py-2.5 px-3 font-semibold text-[#202124] flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-md flex items-center justify-center"
                                  style={{ backgroundColor: meta.bgColor }}
                                >
                                  <IncomeIcon category={item.name as IncomeCategory} size={13} />
                                </div>
                                <span>{item.name}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-[#0F9D58]">
                                +{formatINR(item.amount)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-bold text-[11px]">
                                  {pct}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center text-[#5F6368]">
                                {item.count}
                              </td>
                              <td className="py-2.5 px-3 text-right text-[#5F6368] font-medium">
                                {formatINR(avg)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
