import React, { useState, useMemo } from "react";
import {
  TrendingDown,
  TrendingUp,
  Plus,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trash2,
  Edit2,
  Wallet,
  Clock,
  CheckCircle2,
  Repeat,
  ArrowRight,
  FileSpreadsheet,
  Download,
  Check,
  Sparkles,
} from "lucide-react";
import {
  Expense,
  Income,
  UserBudget,
  CategoryMeta,
  IncomeCategoryMeta,
  UserAccount,
} from "../types";
import { CategoryIcon, IncomeIcon, resolveExpenseMeta, resolveIncomeMeta } from "./CategoryIcon";
import { CATEGORY_LIST, INCOME_CATEGORY_LIST } from "../data/categories";
import { formatINR, formatFriendlyDate } from "../utils/formatters";
import { exportTransactionsToExcel } from "../utils/export";

export interface TransactionsViewProps {
  expenses: Expense[];
  incomes: Income[];
  budget: UserBudget;
  searchQuery: string;
  initialSegment?: "expenses" | "income";
  currentUser?: UserAccount | null;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onOpenAddExpense: () => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
  onOpenAddIncome: () => void;
  onNavigateToVisuals?: () => void;
  onNavigateToAdvisor?: () => void;
  customExpenseCategories?: CategoryMeta[];
  customIncomeCategories?: IncomeCategoryMeta[];
  onOpenCategoryManager?: (tab: "expense" | "income") => void;
  onOpenExportModal?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  expenses,
  incomes,
  budget,
  searchQuery: externalSearchQuery,
  initialSegment = "expenses",
  currentUser,
  onEditExpense,
  onDeleteExpense,
  onOpenAddExpense,
  onEditIncome,
  onDeleteIncome,
  onOpenAddIncome,
  onNavigateToVisuals,
  onNavigateToAdvisor,
  customExpenseCategories,
  customIncomeCategories,
  onOpenCategoryManager,
  onOpenExportModal,
}) => {
  // Segmented tab state: "expenses" (Red) vs "income" (Green)
  const [activeSegment, setActiveSegment] = useState<"expenses" | "income">(initialSegment);

  // Toast notification for instant file downloads
  const [exportToast, setExportToast] = useState<{
    show: boolean;
    message: string;
    filename: string;
  } | null>(null);

  // Month / Date Range State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dateFilterMode, setDateFilterMode] = useState<"today" | "week" | "month" | "year" | "all">("month");
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  // Internal search / filter state
  const [localSearch, setLocalSearch] = useState("");
  const activeSearch = (externalSearchQuery || localSearch).trim().toLowerCase();

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amt-desc" | "amt-asc">("date-desc");

  // Format month and year label: "September 2026"
  const currentMonthLabel = currentDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Navigate months
  const handlePrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
    setDateFilterMode("month");
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
    setDateFilterMode("month");
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
    setDateFilterMode("month");
  };

  // Filter items by Date Range
  const isDateInFilter = (dateStr: string): boolean => {
    if (dateFilterMode === "all") return true;
    if (!dateStr) return false;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    if (dateFilterMode === "today") {
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    }

    if (dateFilterMode === "week") {
      const now = new Date();
      const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return d >= monday && d <= sunday;
    }

    if (dateFilterMode === "month") {
      return (
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      );
    }

    if (dateFilterMode === "year") {
      return d.getFullYear() === currentDate.getFullYear();
    }

    return true;
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!isDateInFilter(e.date)) return false;

      if (activeSearch) {
        const matchTitle = e.title?.toLowerCase().includes(activeSearch);
        const matchCat = e.category?.toLowerCase().includes(activeSearch);
        const matchMerchant = e.merchantOrLocation?.toLowerCase().includes(activeSearch);
        const matchNote = e.notes?.toLowerCase().includes(activeSearch);
        if (!matchTitle && !matchCat && !matchMerchant && !matchNote) {
          return false;
        }
      }

      if (selectedCategory !== "ALL" && e.category !== selectedCategory) {
        return false;
      }

      if (selectedPaymentMode !== "ALL" && e.paymentMode !== selectedPaymentMode) {
        return false;
      }

      return true;
    });
  }, [expenses, currentDate, dateFilterMode, activeSearch, selectedCategory, selectedPaymentMode]);

  // Filtered Incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter((i) => {
      if (!isDateInFilter(i.date)) return false;

      if (activeSearch) {
        const matchTitle = i.title?.toLowerCase().includes(activeSearch);
        const matchCat = i.category?.toLowerCase().includes(activeSearch);
        const matchSource = i.sourceOrClient?.toLowerCase().includes(activeSearch);
        const matchNote = i.notes?.toLowerCase().includes(activeSearch);
        if (!matchTitle && !matchCat && !matchSource && !matchNote) {
          return false;
        }
      }

      if (selectedCategory !== "ALL" && i.category !== selectedCategory) {
        return false;
      }

      if (selectedPaymentMode !== "ALL" && i.paymentMode !== selectedPaymentMode) {
        return false;
      }

      return true;
    });
  }, [incomes, currentDate, dateFilterMode, activeSearch, selectedCategory, selectedPaymentMode]);

  // Totals calculations
  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const totalEarned = useMemo(() => {
    return filteredIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  }, [filteredIncomes]);

  // Monthly Budget calculations
  const monthlyLimit = budget.monthlyBudget || 25000;
  const percentBudgetUsed = Math.min(100, Math.round((totalSpent / (monthlyLimit || 1)) * 100));
  const remainingBudget = Math.max(0, monthlyLimit - totalSpent);
  const isOverBudget = totalSpent > monthlyLimit;

  // Income Streams Breakdown
  const salaryIncomes = filteredIncomes.filter(
    (i) =>
      i.category?.toLowerCase().includes("salary") ||
      i.category?.toLowerCase().includes("bonus") ||
      i.category?.toLowerCase().includes("stipend") ||
      i.streamType === "salary_bonus"
  );
  const totalSalary = salaryIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExtra = totalEarned - totalSalary;

  // Sort and group transactions by date
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "amt-desc") return b.amount - a.amount;
      if (sortBy === "amt-asc") return a.amount - b.amount;
      return 0;
    });
  }, [filteredExpenses, sortBy]);

  const sortedIncomes = useMemo(() => {
    return [...filteredIncomes].sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "amt-desc") return b.amount - a.amount;
      if (sortBy === "amt-asc") return a.amount - b.amount;
      return 0;
    });
  }, [filteredIncomes, sortBy]);

  // Grouped expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: { dateKey: string; items: Expense[]; subtotal: number }[] = [];
    const map = new Map<string, { items: Expense[]; subtotal: number }>();

    for (const exp of sortedExpenses) {
      const key = formatFriendlyDate(exp.date);
      if (!map.has(key)) {
        map.set(key, { items: [], subtotal: 0 });
      }
      const g = map.get(key)!;
      g.items.push(exp);
      g.subtotal += exp.amount;
    }

    map.forEach((value, dateKey) => {
      groups.push({ dateKey, items: value.items, subtotal: value.subtotal });
    });

    return groups;
  }, [sortedExpenses]);

  // Grouped incomes by date
  const groupedIncomes = useMemo(() => {
    const groups: { dateKey: string; items: Income[]; subtotal: number }[] = [];
    const map = new Map<string, { items: Income[]; subtotal: number }>();

    for (const inc of sortedIncomes) {
      const key = formatFriendlyDate(inc.date);
      if (!map.has(key)) {
        map.set(key, { items: [], subtotal: 0 });
      }
      const g = map.get(key)!;
      g.items.push(inc);
      g.subtotal += inc.amount;
    }

    map.forEach((value, dateKey) => {
      groups.push({ dateKey, items: value.items, subtotal: value.subtotal });
    });

    return groups;
  }, [sortedIncomes]);

  const allExpenseCats = customExpenseCategories || CATEGORY_LIST;
  const allIncomeCats = customIncomeCategories || INCOME_CATEGORY_LIST;

  // Active user's profile display name
  const userDisplayName = currentUser?.name?.trim() || "Your Name";

  // Handle Export to Excel / CSV with UTF-8 BOM
  const handleExportExcel = () => {
    const dataExpenses = activeSegment === "expenses" ? filteredExpenses : expenses;
    const dataIncomes = activeSegment === "income" ? filteredIncomes : incomes;

    const result = exportTransactionsToExcel({
      expenses: dataExpenses,
      incomes: dataIncomes,
      user: currentUser,
      segment: activeSegment,
    });

    setExportToast({
      show: true,
      message: `Exported ${result.count} ${activeSegment === "expenses" ? "expenses" : "income transactions"} to Excel!`,
      filename: result.filename,
    });

    setTimeout(() => {
      setExportToast(null);
    }, 4500);
  };

  return (
    <div id="transactions-view" className="space-y-4 sm:space-y-6 pb-20 sm:pb-8 animate-fadeIn">
      {/* 1. SEGMENTED CONTROL TABS (Expenses vs Income) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-3xl border border-[#E8EAED] shadow-xs">
        {/* Sleek 2-Way Pill Switch */}
        <div className="grid grid-cols-2 p-1 bg-[#F1F3F4] rounded-2xl w-full sm:w-80 relative">
          {/* Expenses Tab (Red / Negative accent) */}
          <button
            type="button"
            id="tab-segment-expenses"
            onClick={() => {
              setActiveSegment("expenses");
              setSelectedCategory("ALL");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSegment === "expenses"
                ? "bg-white text-[#EA4335] shadow-xs font-extrabold"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            <TrendingDown
              size={17}
              className={activeSegment === "expenses" ? "text-[#EA4335]" : "text-[#5F6368]"}
            />
            <span>Expenses</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                activeSegment === "expenses"
                  ? "bg-[#FCE8E6] text-[#C5221F]"
                  : "bg-[#E8EAED] text-[#5F6368]"
              }`}
            >
              {filteredExpenses.length}
            </span>
          </button>

          {/* Income Tab (Green / Positive accent) */}
          <button
            type="button"
            id="tab-segment-income"
            onClick={() => {
              setActiveSegment("income");
              setSelectedCategory("ALL");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSegment === "income"
                ? "bg-white text-[#0F9D58] shadow-xs font-extrabold"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            <TrendingUp
              size={17}
              className={activeSegment === "income" ? "text-[#0F9D58]" : "text-[#5F6368]"}
            />
            <span>Income</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                activeSegment === "income"
                  ? "bg-[#E6F4EA] text-[#137333]"
                  : "bg-[#E8EAED] text-[#5F6368]"
              }`}
            >
              {filteredIncomes.length}
            </span>
          </button>
        </div>

        {/* Quick Add Button & Date Period Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
          {/* Month/Date Picker Pill */}
          <div className="relative">
            <button
              type="button"
              id="btn-transactions-date-selector"
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#F8F9FA] hover:bg-[#E8EAED] text-[#202124] text-xs font-semibold rounded-2xl border border-[#DADCE0] transition-colors cursor-pointer shrink-0"
            >
              <Calendar size={14} className="text-[#1A73E8]" />
              <span>
                {dateFilterMode === "month"
                  ? currentMonthLabel
                  : dateFilterMode === "today"
                  ? "Today"
                  : dateFilterMode === "week"
                  ? "This Week"
                  : dateFilterMode === "year"
                  ? `Year ${currentDate.getFullYear()}`
                  : "All Records"}
              </span>
              <ChevronDown size={14} className="text-[#5F6368]" />
            </button>

            {/* Date Preset Dropdown */}
            {isDateDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDateDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-[#E8EAED] p-2 min-w-[200px] animate-scaleUp">
                  <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-bold text-[#5F6368] uppercase border-b border-[#F1F3F4] mb-1">
                    <span>Date Filter</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleCurrentMonth();
                        setIsDateDropdownOpen(false);
                      }}
                      className="text-[#1A73E8] hover:underline cursor-pointer"
                    >
                      This Month
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilterMode("month");
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer ${
                        dateFilterMode === "month"
                          ? "bg-[#E8F0FE] text-[#1A73E8] font-bold"
                          : "hover:bg-[#F1F3F4] text-[#202124]"
                      }`}
                    >
                      <span>{currentMonthLabel}</span>
                      {dateFilterMode === "month" && <CheckCircle2 size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDateFilterMode("today");
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer ${
                        dateFilterMode === "today"
                          ? "bg-[#E8F0FE] text-[#1A73E8] font-bold"
                          : "hover:bg-[#F1F3F4] text-[#202124]"
                      }`}
                    >
                      <span>Today</span>
                      {dateFilterMode === "today" && <CheckCircle2 size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDateFilterMode("week");
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer ${
                        dateFilterMode === "week"
                          ? "bg-[#E8F0FE] text-[#1A73E8] font-bold"
                          : "hover:bg-[#F1F3F4] text-[#202124]"
                      }`}
                    >
                      <span>This Week</span>
                      {dateFilterMode === "week" && <CheckCircle2 size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDateFilterMode("year");
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer ${
                        dateFilterMode === "year"
                          ? "bg-[#E8F0FE] text-[#1A73E8] font-bold"
                          : "hover:bg-[#F1F3F4] text-[#202124]"
                      }`}
                    >
                      <span>This Year ({currentDate.getFullYear()})</span>
                      {dateFilterMode === "year" && <CheckCircle2 size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDateFilterMode("all");
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer ${
                        dateFilterMode === "all"
                          ? "bg-[#E8F0FE] text-[#1A73E8] font-bold"
                          : "hover:bg-[#F1F3F4] text-[#202124]"
                      }`}
                    >
                      <span>All Records</span>
                      {dateFilterMode === "all" && <CheckCircle2 size={14} />}
                    </button>
                  </div>

                  {/* Month Switcher inside dropdown */}
                  <div className="mt-2 pt-2 border-t border-[#F1F3F4] flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124] cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-semibold text-[#5F6368]">
                      {currentDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124] cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export to Excel Button */}
          <button
            type="button"
            id="btn-export-excel-top"
            onClick={handleExportExcel}
            title={`Export ${activeSegment === "expenses" ? "Expenses" : "Income"} to Excel spreadsheet (.csv)`}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] border border-[#CEEAD6] rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <FileSpreadsheet size={15} className="text-[#137333]" />
            <span className="hidden sm:inline">Export to Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>

          {/* Primary Quick Action Button */}
          {activeSegment === "expenses" ? (
            <button
              type="button"
              id="btn-add-expense-top"
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#EA4335] hover:bg-[#D93025] active:scale-98 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Expense</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-add-income-top"
              onClick={onOpenAddIncome}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#0F9D58] hover:bg-[#0B8043] active:scale-98 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Income</span>
            </button>
          )}
        </div>
      </div>

      {/* TIME PERIOD FILTER BAR (Horizontal swipeable carousel on mobile) */}
      <div
        id="time-period-filter-bar"
        className="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar py-1 px-0.5 max-w-full touch-pan-x"
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          padding: "4px 2px",
        }}
      >
        <button
          type="button"
          id="filter-period-today"
          onClick={() => setDateFilterMode("today")}
          className={`shrink-0 flex-shrink-0 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
            dateFilterMode === "today"
              ? activeSegment === "expenses"
                ? "bg-[#EA4335] text-white border-[#EA4335] shadow-xs"
                : "bg-[#0F9D58] text-white border-[#0F9D58] shadow-xs"
              : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4] hover:text-[#202124]"
          }`}
        >
          <span>Today</span>
        </button>

        <button
          type="button"
          id="filter-period-week"
          onClick={() => setDateFilterMode("week")}
          className={`shrink-0 flex-shrink-0 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
            dateFilterMode === "week"
              ? activeSegment === "expenses"
                ? "bg-[#EA4335] text-white border-[#EA4335] shadow-xs"
                : "bg-[#0F9D58] text-white border-[#0F9D58] shadow-xs"
              : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4] hover:text-[#202124]"
          }`}
        >
          <span className="sm:hidden">Week</span>
          <span className="hidden sm:inline">This Week</span>
        </button>

        <button
          type="button"
          id="filter-period-month"
          onClick={() => {
            handleCurrentMonth();
            setDateFilterMode("month");
          }}
          className={`shrink-0 flex-shrink-0 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
            dateFilterMode === "month"
              ? activeSegment === "expenses"
                ? "bg-[#EA4335] text-white border-[#EA4335] shadow-xs"
                : "bg-[#0F9D58] text-white border-[#0F9D58] shadow-xs"
              : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4] hover:text-[#202124]"
          }`}
        >
          <span className="sm:hidden">Month</span>
          <span className="hidden sm:inline">This Month</span>
        </button>

        <button
          type="button"
          id="filter-period-year"
          onClick={() => setDateFilterMode("year")}
          className={`shrink-0 flex-shrink-0 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
            dateFilterMode === "year"
              ? activeSegment === "expenses"
                ? "bg-[#EA4335] text-white border-[#EA4335] shadow-xs"
                : "bg-[#0F9D58] text-white border-[#0F9D58] shadow-xs"
              : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4] hover:text-[#202124]"
          }`}
        >
          <span className="sm:hidden">Year</span>
          <span className="hidden sm:inline">This Year</span>
        </button>

        <button
          type="button"
          id="filter-period-all"
          onClick={() => setDateFilterMode("all")}
          className={`shrink-0 flex-shrink-0 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
            dateFilterMode === "all"
              ? activeSegment === "expenses"
                ? "bg-[#EA4335] text-white border-[#EA4335] shadow-xs"
                : "bg-[#0F9D58] text-white border-[#0F9D58] shadow-xs"
              : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4] hover:text-[#202124]"
          }`}
        >
          <span className="sm:hidden">All</span>
          <span className="hidden sm:inline">All Records</span>
        </button>
      </div>

      {/* 2. DYNAMIC SUMMARY HEADER CARD */}
      <div
        id="transactions-summary-card"
        className={`rounded-3xl border p-4 sm:p-6 shadow-xs transition-all ${
          activeSegment === "expenses"
            ? "bg-gradient-to-br from-white via-white to-[#FCE8E6]/30 border-[#FAD2CF]"
            : "bg-gradient-to-br from-white via-white to-[#E6F4EA]/40 border-[#CEEAD6]"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Main Total Metric */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeSegment === "expenses" ? "bg-[#EA4335]" : "bg-[#0F9D58]"
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
                {activeSegment === "expenses" ? "Total Spent" : "Total Earned"} •{" "}
                <span className="font-semibold text-[#202124]">
                  {dateFilterMode === "month"
                    ? currentMonthLabel
                    : dateFilterMode === "today"
                    ? "Today"
                    : dateFilterMode === "week"
                    ? "This Week"
                    : dateFilterMode === "year"
                    ? `This Year (${currentDate.getFullYear()})`
                    : "All Time"}
                </span>
              </span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h2
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  activeSegment === "expenses" ? "text-[#EA4335]" : "text-[#0F9D58]"
                }`}
              >
                {activeSegment === "expenses" ? `- ${formatINR(totalSpent)}` : `+ ${formatINR(totalEarned)}`}
              </h2>

              <span className="text-xs font-semibold text-[#5F6368]">
                {activeSegment === "expenses"
                  ? `${filteredExpenses.length} expense${filteredExpenses.length === 1 ? "" : "s"}`
                  : `${filteredIncomes.length} income inflow${filteredIncomes.length === 1 ? "" : "s"}`}
              </span>
            </div>

            {/* Contextual Stats subtitle */}
            <p className="text-xs text-[#5F6368] flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[#202124]">{userDisplayName}</span>
              <span>•</span>
              {activeSegment === "expenses" ? (
                <>
                  Budget: <strong className="text-[#202124]">{formatINR(monthlyLimit)}</strong> (
                  <span className={isOverBudget ? "text-[#EA4335] font-bold" : "text-[#137333] font-bold"}>
                    {percentBudgetUsed}% used
                  </span>
                  ) • {isOverBudget ? "Exceeded by " + formatINR(totalSpent - monthlyLimit) : formatINR(remainingBudget) + " remaining"}
                </>
              ) : (
                <>
                  Salary & Bonus: <strong className="text-[#202124]">{formatINR(totalSalary)}</strong> • Extra/Freelance:{" "}
                  <strong className="text-[#0F9D58]">{formatINR(totalExtra)}</strong>
                </>
              )}
            </p>
          </div>

          {/* Quick Month Navigator & Excel Export Shortcut */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              id="btn-export-excel-summary"
              onClick={handleExportExcel}
              title={`Export ${activeSegment === "expenses" ? "Expenses" : "Income"} to Excel`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] border border-[#CEEAD6] rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Download size={13} />
              <span>Export</span>
            </button>

            <div className="flex items-center gap-1 bg-[#F8F9FA] p-1 rounded-2xl border border-[#E8EAED]">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1 hover:bg-white rounded-xl text-[#5F6368] hover:text-[#202124] transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-[#202124] px-1.5 whitespace-nowrap">
                {currentMonthLabel}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1 hover:bg-white rounded-xl text-[#5F6368] hover:text-[#202124] transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar for Expenses or Savings preview for Income */}
        {activeSegment === "expenses" ? (
          <div className="mt-4 pt-3 border-t border-[#F1F3F4] space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-[#5F6368]">
              <span>Monthly Spend Progress</span>
              <span>{percentBudgetUsed}%</span>
            </div>
            <div className="w-full bg-[#E8EAED] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget ? "bg-[#EA4335]" : percentBudgetUsed > 80 ? "bg-[#FBBC04]" : "bg-[#1A73E8]"
                }`}
                style={{ width: `${percentBudgetUsed}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-[#F1F3F4] flex items-center justify-between text-xs text-[#5F6368]">
            <div className="flex items-center gap-1.5">
              <Wallet size={15} className="text-[#0F9D58]" />
              <span>Net Balance (Earned - Spent):</span>
              <strong
                className={`font-bold ${
                  totalEarned - totalSpent >= 0 ? "text-[#0F9D58]" : "text-[#EA4335]"
                }`}
              >
                {formatINR(totalEarned - totalSpent)}
              </strong>
            </div>
            {onNavigateToVisuals && (
              <button
                type="button"
                onClick={onNavigateToVisuals}
                className="text-[#1A73E8] hover:underline font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>View Analytics</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. FILTERS & SEARCH ROW */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Category Pills Slider / Filter */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar touch-pan-x"
          style={{
            display: "flex",
            overflowX: "auto",
            whiteSpace: "nowrap",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            padding: "2px 0",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`shrink-0 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === "ALL"
                ? activeSegment === "expenses"
                  ? "bg-[#EA4335] text-white border-[#EA4335]"
                  : "bg-[#0F9D58] text-white border-[#0F9D58]"
                : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4]"
            }`}
          >
            All Categories
          </button>

          {activeSegment === "expenses"
            ? allExpenseCats.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`shrink-0 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedCategory === cat.name
                      ? "bg-[#EA4335] text-white border-[#EA4335]"
                      : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4]"
                  }`}
                >
                  {cat.name}
                </button>
              ))
            : allIncomeCats.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`shrink-0 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedCategory === cat.name
                      ? "bg-[#0F9D58] text-white border-[#0F9D58]"
                      : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}

          {onOpenCategoryManager && (
            <button
              type="button"
              onClick={() => onOpenCategoryManager(activeSegment === "expenses" ? "expense" : "income")}
              title="Manage Categories"
              className="shrink-0 flex-shrink-0 px-2.5 py-1.5 bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#5F6368] text-xs font-medium rounded-full border border-[#DADCE0] cursor-pointer"
            >
              + Edit
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-white border border-[#DADCE0] text-[#202124] rounded-full px-3 py-1.5 pr-7 appearance-none cursor-pointer hover:bg-[#F8F9FA] focus:outline-none focus:border-[#1A73E8]"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amt-desc">Highest Amount</option>
              <option value="amt-asc">Lowest Amount</option>
            </select>
            <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5F6368] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. TRANSACTION LIST & CARDS */}
      <div className="space-y-4">
        {activeSegment === "expenses" ? (
          /* EXPENSES LIST */
          groupedExpenses.length === 0 ? (
            /* Empty State for Expenses */
            <div
              id="empty-expenses-state"
              className="bg-white rounded-3xl border border-[#E8EAED] p-8 sm:p-12 text-center space-y-4 shadow-xs"
            >
              <div className="w-16 h-16 rounded-full bg-[#FCE8E6] text-[#EA4335] flex items-center justify-center mx-auto shadow-inner">
                <TrendingDown size={32} />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h3 className="text-base font-bold text-[#202124]">No expenses recorded yet</h3>
                <p className="text-xs text-[#5F6368]">
                  {selectedCategory !== "ALL" || activeSearch
                    ? "No expenses match your active search or category filter."
                    : `No expense entries found for ${
                        dateFilterMode === "month" ? currentMonthLabel : "the selected period"
                      }. Start tracking your daily spends.`}
                </p>
              </div>
              <button
                type="button"
                id="btn-empty-add-expense"
                onClick={onOpenAddExpense}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EA4335] hover:bg-[#D93025] active:scale-98 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer"
              >
                <Plus size={18} />
                <span>Add First Expense</span>
              </button>
            </div>
          ) : (
            /* Render Grouped Expenses */
            groupedExpenses.map((group) => (
              <div key={group.dateKey} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#5F6368]" />
                    <span>{group.dateKey}</span>
                  </span>
                  <span className="text-xs font-semibold text-[#EA4335]">
                    - {formatINR(group.subtotal)}
                  </span>
                </div>

                {/* Items in this date */}
                <div className="bg-white rounded-3xl border border-[#E8EAED] shadow-xs divide-y divide-[#F1F3F4] overflow-hidden">
                  {group.items.map((exp) => {
                    const meta = resolveExpenseMeta(exp.category, customExpenseCategories);
                    return (
                      <div
                        key={exp.id}
                        id={`expense-card-${exp.id}`}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#F8F9FA] transition-colors group"
                      >
                        {/* Left: Category Icon with subtle circular background */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                            style={{
                              backgroundColor: meta.bgColor,
                              borderColor: meta.borderColor,
                            }}
                          >
                            <CategoryIcon
                              category={exp.category}
                              customCategories={customExpenseCategories}
                              size={20}
                            />
                          </div>

                          {/* Middle: Title / Merchant / Time / Payment mode badge */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-[#202124] truncate">
                                {exp.title}
                              </h4>
                              {exp.isRecurring && (
                                <span title="Recurring Expense" className="text-[#1A73E8]">
                                  <Repeat size={12} />
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-[#5F6368] mt-0.5 flex-wrap">
                              {exp.merchantOrLocation && (
                                <span className="font-medium text-[#202124] truncate max-w-[120px] sm:max-w-[200px]">
                                  {exp.merchantOrLocation} •
                                </span>
                              )}
                              {exp.time && (
                                <span className="flex items-center gap-0.5">
                                  <Clock size={11} />
                                  <span>{exp.time}</span>
                                  <span>•</span>
                                </span>
                              )}
                              <span className="px-1.5 py-0.2 rounded-md bg-[#F1F3F4] text-[#5F6368] font-medium text-[10px]">
                                {exp.paymentMode}
                              </span>
                              <span className="text-[#80868B] hidden xs:inline">• {exp.category}</span>
                            </div>

                            {exp.notes && (
                              <p className="text-[11px] text-[#80868B] truncate max-w-xs mt-0.5 italic">
                                "{exp.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Formatted Amount with Red color coding & Action Buttons */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-extrabold text-[#EA4335] block">
                              - {formatINR(exp.amount)}
                            </span>
                            <span className="text-[10px] text-[#80868B] block">Spend</span>
                          </div>

                          {/* Action Buttons (Edit & Delete) */}
                          <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => onEditExpense(exp)}
                              title="Edit Expense"
                              className="p-1.5 text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#E8F0FE] rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteExpense(exp.id)}
                              title="Delete Expense"
                              className="p-1.5 text-[#5F6368] hover:text-[#EA4335] hover:bg-[#FCE8E6] rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )
        ) : (
          /* INCOME LIST */
          groupedIncomes.length === 0 ? (
            /* Empty State for Income */
            <div
              id="empty-income-state"
              className="bg-white rounded-3xl border border-[#E8EAED] p-8 sm:p-12 text-center space-y-4 shadow-xs"
            >
              <div className="w-16 h-16 rounded-full bg-[#E6F4EA] text-[#0F9D58] flex items-center justify-center mx-auto shadow-inner">
                <TrendingUp size={32} />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h3 className="text-base font-bold text-[#202124]">No income recorded yet</h3>
                <p className="text-xs text-[#5F6368]">
                  {selectedCategory !== "ALL" || activeSearch
                    ? "No income matches your active search or category filter."
                    : `No income entries found for ${
                        dateFilterMode === "month" ? currentMonthLabel : "the selected period"
                      }. Record your salary, client inflows, or freelance earnings.`}
                </p>
              </div>
              <button
                type="button"
                id="btn-empty-add-income"
                onClick={onOpenAddIncome}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F9D58] hover:bg-[#0B8043] active:scale-98 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer"
              >
                <Plus size={18} />
                <span>Add First Income</span>
              </button>
            </div>
          ) : (
            /* Render Grouped Incomes */
            groupedIncomes.map((group) => (
              <div key={group.dateKey} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#5F6368]" />
                    <span>{group.dateKey}</span>
                  </span>
                  <span className="text-xs font-semibold text-[#0F9D58]">
                    + {formatINR(group.subtotal)}
                  </span>
                </div>

                {/* Items in this date */}
                <div className="bg-white rounded-3xl border border-[#E8EAED] shadow-xs divide-y divide-[#F1F3F4] overflow-hidden">
                  {group.items.map((inc) => {
                    const meta = resolveIncomeMeta(inc.category, customIncomeCategories);
                    return (
                      <div
                        key={inc.id}
                        id={`income-card-${inc.id}`}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#F8F9FA] transition-colors group"
                      >
                        {/* Left: Category Icon with subtle circular background */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                            style={{
                              backgroundColor: meta.bgColor,
                              borderColor: meta.borderColor,
                            }}
                          >
                            <IncomeIcon
                              category={inc.category}
                              customCategories={customIncomeCategories}
                              size={20}
                            />
                          </div>

                          {/* Middle: Title / Source / Time / Payment mode badge */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-[#202124] truncate">
                                {inc.title}
                              </h4>
                              {inc.isRecurring && (
                                <span title="Recurring Inflow" className="text-[#0F9D58]">
                                  <Repeat size={12} />
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-[#5F6368] mt-0.5 flex-wrap">
                              {inc.sourceOrClient && (
                                <span className="font-medium text-[#202124] truncate max-w-[120px] sm:max-w-[200px]">
                                  {inc.sourceOrClient} •
                                </span>
                              )}
                              {inc.time && (
                                <span className="flex items-center gap-0.5">
                                  <Clock size={11} />
                                  <span>{inc.time}</span>
                                  <span>•</span>
                                </span>
                              )}
                              <span className="px-1.5 py-0.2 rounded-md bg-[#E6F4EA] text-[#137333] font-medium text-[10px]">
                                {inc.paymentMode}
                              </span>
                              <span className="text-[#80868B] hidden xs:inline">• {inc.category}</span>
                            </div>

                            {inc.notes && (
                              <p className="text-[11px] text-[#80868B] truncate max-w-xs mt-0.5 italic">
                                "{inc.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Formatted Amount with Green color coding & Action Buttons */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-extrabold text-[#0F9D58] block">
                              + {formatINR(inc.amount)}
                            </span>
                            <span className="text-[10px] text-[#137333] block">Inflow</span>
                          </div>

                          {/* Action Buttons (Edit & Delete) */}
                          <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => onEditIncome(inc)}
                              title="Edit Income"
                              className="p-1.5 text-[#5F6368] hover:text-[#0F9D58] hover:bg-[#E6F4EA] rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteIncome(inc.id)}
                              title="Delete Income"
                              className="p-1.5 text-[#5F6368] hover:text-[#EA4335] hover:bg-[#FCE8E6] rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* 5. DOWNLOAD CONFIRMATION TOAST NOTIFICATION */}
      {exportToast && (
        <div
          id="toast-export-success"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] sm:w-full bg-[#202124] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-3 animate-slideUp"
        >
          <div className="w-8 h-8 rounded-xl bg-[#137333] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <FileSpreadsheet size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#81C995]">
              <Check size={14} />
              <span>Downloaded for Excel & Sheets</span>
            </div>
            <p className="text-xs text-white font-semibold mt-0.5 leading-snug">
              {exportToast.message}
            </p>
            <p className="text-[11px] text-[#9AA0A6] font-mono truncate mt-1">
              {exportToast.filename}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExportToast(null)}
            className="text-[#9AA0A6] hover:text-white p-1 text-xs cursor-pointer rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
