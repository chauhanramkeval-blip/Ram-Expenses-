import React, { useState, useMemo, useRef } from "react";
import {
  Table2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Tag,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  Check,
  RefreshCw,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Percent,
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
import { CATEGORIES_DATA } from "../data/categories";
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

export type TableSegment = "all" | "expenses" | "incomes" | "daily" | "categories";

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
  // Selected Month and Year
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed

  // Table Segment Tab
  const [activeSegment, setActiveSegment] = useState<TableSegment>("all");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [paymentModeFilter, setPaymentModeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "title-asc">(
    "date-desc"
  );
  const [isCompact, setIsCompact] = useState(false);

  // Month Picker Dropdown
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Monthly Review Box Collapsible
  const [isAiBoxOpen, setIsAiBoxOpen] = useState(false);
  const [aiAdviceText, setAiAdviceText] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Print ref
  const tablePrintRef = useRef<HTMLDivElement>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleSetCurrentMonth = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  const monthNames = [
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

  const currentMonthLabel = `${monthNames[selectedMonth]} ${selectedYear}`;
  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  // Days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const startDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
  const endDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(
    daysInMonth
  ).padStart(2, "0")}`;

  // Filter raw data for this month
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [expenses, selectedYear, selectedMonth]);

  const monthIncomes = useMemo(() => {
    return incomes.filter((i) => {
      if (!i.date) return false;
      const d = new Date(i.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [incomes, selectedYear, selectedMonth]);

  // Aggregate monthly metrics
  const totalExpenseAmount = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [monthExpenses]);

  const totalIncomeAmount = useMemo(() => {
    return monthIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [monthIncomes]);

  const netBalance = totalIncomeAmount - totalExpenseAmount;
  const savingsRate =
    totalIncomeAmount > 0 ? Math.round((netBalance / totalIncomeAmount) * 100) : 0;
  const avgDailySpend = Math.round(totalExpenseAmount / Math.max(1, daysInMonth));

  // Build unified chronological rows
  const unifiedRows = useMemo(() => {
    const list: UnifiedTransactionRow[] = [];

    monthExpenses.forEach((e) => {
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

    monthIncomes.forEach((i) => {
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
  }, [monthExpenses, monthIncomes]);

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

    // Initialize all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const d = new Date(selectedYear, selectedMonth, day);
      const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
      map.set(dateStr, { date: dateStr, dayName, expense: 0, income: 0, count: 0 });
    }

    // Fill with data
    monthExpenses.forEach((e) => {
      const entry = map.get(e.date);
      if (entry) {
        entry.expense += Number(e.amount) || 0;
        entry.count += 1;
      }
    });

    monthIncomes.forEach((i) => {
      const entry = map.get(i.date);
      if (entry) {
        entry.income += Number(i.amount) || 0;
        entry.count += 1;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [monthExpenses, monthIncomes, selectedYear, selectedMonth, daysInMonth]);

  // Category Breakdown Data
  const categoryBreakdownList = useMemo(() => {
    const expMap = new Map<string, { name: string; amount: number; count: number; type: "expense" }>();
    const incMap = new Map<string, { name: string; amount: number; count: number; type: "income" }>();

    monthExpenses.forEach((e) => {
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

    monthIncomes.forEach((i) => {
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
  }, [monthExpenses, monthIncomes]);

  // All distinct categories for filter dropdown
  const allAvailableCategories = useMemo(() => {
    const set = new Set<string>();
    monthExpenses.forEach((e) => set.add(e.category));
    monthIncomes.forEach((i) => set.add(i.category));
    return Array.from(set).sort();
  }, [monthExpenses, monthIncomes]);

  // Distinct payment modes
  const allAvailablePaymentModes = useMemo(() => {
    const set = new Set<string>();
    monthExpenses.forEach((e) => set.add(e.paymentMode));
    monthIncomes.forEach((i) => set.add(i.paymentMode));
    return Array.from(set).sort();
  }, [monthExpenses, monthIncomes]);

  // Export handlers
  const handleExportExcel = () => {
    const res = exportTransactionsToExcel({
      expenses: monthExpenses,
      incomes: monthIncomes,
      user: currentUser,
      filterScopeName: `${monthNames[selectedMonth]}_${selectedYear}`,
      segment: "all",
      format: "xlsx",
    });

    setToastMessage(`Downloaded ${res.filename} (${res.count} transactions)`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportCSV = () => {
    const res = exportTransactionsToExcel({
      expenses: monthExpenses,
      incomes: monthIncomes,
      user: currentUser,
      filterScopeName: `${monthNames[selectedMonth]}_${selectedYear}`,
      segment: "all",
      format: "csv",
    });

    setToastMessage(`Downloaded CSV Statement (${res.count} records)`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Print Statement Handler
  const handlePrintStatement = () => {
    window.print();
  };

  // AI Advisor Trigger for this month
  const handleFetchAiMonthReview = async () => {
    setIsAiLoading(true);
    setIsAiBoxOpen(true);
    try {
      const res = await fetch("/api/gemini/daily-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentMonthTotal: totalExpenseAmount,
          monthlyIncome: totalIncomeAmount,
          monthLabel: currentMonthLabel,
          userContext: `Monthly Statement for ${currentMonthLabel}. Income: ${totalIncomeAmount}, Expenses: ${totalExpenseAmount}, Net: ${netBalance}, Transactions: ${unifiedRows.length}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.advice) {
        setAiAdviceText(
          `${data.advice.title}: ${data.advice.punchline}\n\n${data.advice.detailedAdvice}\n\nActionable Tip: ${data.advice.actionableStep || ""}`
        );
      } else {
        setAiAdviceText(
          `Monthly Financial Audit for ${currentMonthLabel}:\n• Total Inflow: ${formatINR(totalIncomeAmount)}\n• Total Outflow: ${formatINR(totalExpenseAmount)}\n• Net Savings: ${formatINR(netBalance)} (${savingsRate}% savings rate).\n• Recommended: Track recurring grocery & dining spends to maximize monthly cashflow.`
        );
      }
    } catch {
      setAiAdviceText(
        `Monthly Summary for ${currentMonthLabel}:\nTotal Inflow: ${formatINR(totalIncomeAmount)} | Total Outflow: ${formatINR(totalExpenseAmount)} | Net Surplus: ${formatINR(netBalance)}.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div id="monthly-statement-table-page" className="space-y-5 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#202124] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-slideDown">
          <Check size={16} className="text-[#34A853]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER & MONTH SWITCHER CARD */}
      <div className="bg-white rounded-3xl border border-[#E8EAED] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Month Navigation & Label */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0 border border-[#D2E3FC]">
              <Table2 size={22} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative inline-block">
                  <button
                    type="button"
                    id="btn-toggle-month-picker"
                    onClick={() => setIsMonthPickerOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 text-base sm:text-lg font-bold text-[#202124] hover:text-[#1A73E8] transition-colors cursor-pointer"
                  >
                    <span>{currentMonthLabel}</span>
                    <ChevronDown size={16} className="text-[#5F6368]" />
                  </button>

                  {/* Dropdown for Month Selection */}
                  {isMonthPickerOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white border border-[#DADCE0] rounded-2xl shadow-xl p-3 z-50 grid grid-cols-3 gap-1.5 animate-fadeIn">
                      {monthNames.map((mName, idx) => (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(idx);
                            setIsMonthPickerOpen(false);
                          }}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg text-center transition-all cursor-pointer ${
                            selectedMonth === idx
                              ? "bg-[#1A73E8] text-white"
                              : "hover:bg-[#F1F3F4] text-[#3C4043]"
                          }`}
                        >
                          {mName.slice(0, 3)}
                        </button>
                      ))}
                      <div className="col-span-3 pt-2 mt-1 border-t border-[#F1F3F4] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedYear((y) => y - 1)}
                          className="text-[11px] font-bold text-[#5F6368] hover:text-[#202124] px-2 py-1 rounded hover:bg-[#F1F3F4]"
                        >
                          {selectedYear - 1}
                        </button>
                        <span className="text-xs font-bold text-[#1A73E8]">{selectedYear}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedYear((y) => y + 1)}
                          className="text-[11px] font-bold text-[#5F6368] hover:text-[#202124] px-2 py-1 rounded hover:bg-[#F1F3F4]"
                        >
                          {selectedYear + 1}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-[#F1F3F4] rounded-full p-0.5">
                  <button
                    type="button"
                    id="btn-prev-month-table"
                    onClick={handlePrevMonth}
                    title="Previous Month"
                    className="p-1 rounded-full hover:bg-white text-[#5F6368] hover:text-[#202124] transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    id="btn-next-month-table"
                    onClick={handleNextMonth}
                    title="Next Month"
                    className="p-1 rounded-full hover:bg-white text-[#5F6368] hover:text-[#202124] transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {!isCurrentMonth && (
                  <button
                    type="button"
                    id="btn-reset-current-month"
                    onClick={handleSetCurrentMonth}
                    className="text-[11px] font-bold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    This Month
                  </button>
                )}
              </div>

              <p className="text-xs text-[#5F6368] mt-0.5">
                Monthly Statement & Ledger Table ({startDateStr} to {endDateStr})
              </p>
            </div>
          </div>

          {/* Right: Quick Action Buttons & Exports */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {/* AI Advisor Insight Button */}
            <button
              type="button"
              id="btn-month-ai-review"
              onClick={handleFetchAiMonthReview}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FEF7E0] hover:bg-[#FEEFC3] text-[#B06000] border border-[#FEEFC3] rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles size={14} className="text-[#F9AB00]" />
              <span>AI Month Audit</span>
            </button>

            {/* Export Excel (.xlsx) */}
            <button
              type="button"
              id="btn-export-monthly-excel"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] border border-[#CEEAD6] rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Download Excel Sheet (.xlsx)"
            >
              <FileSpreadsheet size={14} />
              <span>Export Excel</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              id="btn-export-monthly-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F1F3F4] text-[#3C4043] border border-[#DADCE0] rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
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
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F1F3F4] text-[#3C4043] border border-[#DADCE0] rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Print / Save PDF Table"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Direct Add Buttons */}
            <button
              type="button"
              id="btn-table-add-expense"
              onClick={onOpenAddExpense}
              className="flex items-center gap-1 px-3.5 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus size={14} />
              <span>Add Spend</span>
            </button>

            <button
              type="button"
              id="btn-table-add-income"
              onClick={onOpenAddIncome}
              className="flex items-center gap-1 px-3.5 py-2 bg-[#0F9D58] hover:bg-[#0B8043] text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus size={14} />
              <span>Add Income</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MONTHLY FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Inflow (Income) */}
        <div className="bg-white rounded-2xl border border-[#CEEAD6] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#137333] flex items-center gap-1">
              <ArrowUpRight size={14} />
              Total Inflow (Income)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333]">
              {monthIncomes.length} Credits
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#0F9D58] tracking-tight">
            +{formatINR(totalIncomeAmount)}
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1">
            Recorded earnings in {monthNames[selectedMonth].slice(0, 3)}
          </p>
        </div>

        {/* Total Outflow (Expenses) */}
        <div className="bg-white rounded-2xl border border-[#FAD2CF] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#C5221F] flex items-center gap-1">
              <ArrowDownRight size={14} />
              Total Outflow (Expenses)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCE8E6] text-[#C5221F]">
              {monthExpenses.length} Debits
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#D93025] tracking-tight">
            -{formatINR(totalExpenseAmount)}
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1">
            Avg {formatINR(avgDailySpend)} / day
          </p>
        </div>

        {/* Net Monthly Balance */}
        <div
          className={`bg-white rounded-2xl border p-4 shadow-xs relative overflow-hidden ${
            netBalance >= 0 ? "border-[#D2E3FC]" : "border-[#FAD2CF]"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#1A73E8] flex items-center gap-1">
              <Wallet size={14} />
              Net Monthly Balance
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
            Inflow minus outflow
          </p>
        </div>

        {/* Savings Rate & Metrics */}
        <div className="bg-white rounded-2xl border border-[#E8EAED] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#5F6368] flex items-center gap-1">
              <Percent size={14} />
              Savings Ratio
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1F3F4] text-[#202124]">
              {unifiedRows.length} Total
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#202124] tracking-tight">
            {savingsRate}%
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1">
            {totalIncomeAmount > 0
              ? `${formatINR(netBalance)} saved this month`
              : "No income registered yet"}
          </p>
        </div>
      </div>

      {/* Embedded Collapsible AI Month Audit Box */}
      {isAiBoxOpen && (
        <div className="bg-[#FEF7E0] border border-[#FEEFC3] rounded-3xl p-5 shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#FEEAA7] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#F9AB00]" />
              <h4 className="text-sm font-bold text-[#202124]">
                AI Monthly Financial Audit — {currentMonthLabel}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsAiBoxOpen(false)}
              className="text-[#5F6368] hover:text-[#202124] p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {isAiLoading ? (
            <div className="flex items-center gap-2 text-xs font-medium text-[#B06000] py-3">
              <RefreshCw size={16} className="animate-spin text-[#F9AB00]" />
              <span>Analyzing all {unifiedRows.length} transactions for {currentMonthLabel}...</span>
            </div>
          ) : (
            <div className="text-xs text-[#3C4043] leading-relaxed whitespace-pre-line">
              {aiAdviceText}
            </div>
          )}
        </div>
      )}

      {/* 3. TABLE SEGMENT TABS & CONTROLS */}
      <div className="bg-white rounded-3xl border border-[#E8EAED] p-4 sm:p-5 shadow-xs space-y-4">
        {/* Segmented Filter Pills */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#F1F3F4] pb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              id="tab-table-all"
              onClick={() => setActiveSegment("all")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "all"
                  ? "bg-[#E8F0FE] text-[#1A73E8] font-bold shadow-2xs"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <Table2 size={14} />
              <span>All Ledger ({unifiedRows.length})</span>
            </button>

            <button
              type="button"
              id="tab-table-expenses"
              onClick={() => setActiveSegment("expenses")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "expenses"
                  ? "bg-[#FCE8E6] text-[#C5221F] font-bold shadow-2xs"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <TrendingDown size={14} />
              <span>Expenses Only ({monthExpenses.length})</span>
            </button>

            <button
              type="button"
              id="tab-table-incomes"
              onClick={() => setActiveSegment("incomes")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "incomes"
                  ? "bg-[#E6F4EA] text-[#137333] font-bold shadow-2xs"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <TrendingUp size={14} />
              <span>Income Only ({monthIncomes.length})</span>
            </button>

            <button
              type="button"
              id="tab-table-daily"
              onClick={() => setActiveSegment("daily")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "daily"
                  ? "bg-[#E8F0FE] text-[#1A73E8] font-bold shadow-2xs"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <Calendar size={14} />
              <span>Day-by-Day Summary</span>
            </button>

            <button
              type="button"
              id="tab-table-categories"
              onClick={() => setActiveSegment("categories")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSegment === "categories"
                  ? "bg-[#E8F0FE] text-[#1A73E8] font-bold shadow-2xs"
                  : "text-[#5F6368] hover:bg-[#F1F3F4]"
              }`}
            >
              <Layers size={14} />
              <span>Category Summary</span>
            </button>
          </div>

          {/* Density Toggle */}
          <button
            type="button"
            onClick={() => setIsCompact((c) => !c)}
            className="text-[11px] font-semibold text-[#5F6368] hover:text-[#202124] px-2.5 py-1 rounded-lg hover:bg-[#F1F3F4] transition-colors cursor-pointer shrink-0"
          >
            {isCompact ? "Comfortable View" : "Compact View"}
          </button>
        </div>

        {/* Filter & Search Bar (Visible for All, Expenses, and Incomes views) */}
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

        {/* 4. MAIN TABULAR LEDGER DISPLAY */}
        <div ref={tablePrintRef} className="overflow-x-auto rounded-2xl border border-[#E8EAED]">
          {/* A. UNIFIED / EXPENSES / INCOMES TABLE */}
          {(activeSegment === "all" || activeSegment === "expenses" || activeSegment === "incomes") && (
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
                      <p className="font-bold text-sm text-[#202124]">No records in this monthly statement</p>
                      <p className="text-xs text-[#5F6368] mt-1 max-w-sm mx-auto">
                        {searchQuery || categoryFilter !== "ALL" || paymentModeFilter !== "ALL"
                          ? "No transactions match the selected filters. Try clearing your search."
                          : `No transactions logged for ${currentMonthLabel}. Click 'Add Spend' or 'Add Income' above.`}
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
          )}

          {/* B. DAY-BY-DAY AGGREGATION TABLE */}
          {activeSegment === "daily" && (
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
                    Monthly Totals:
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
          )}

          {/* C. CATEGORY BREAKDOWN TABLE */}
          {activeSegment === "categories" && (
            <div className="p-4 space-y-6">
              {/* Expense Categories Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-[#C5221F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingDown size={14} />
                  <span>Expense Categories Breakdown ({categoryBreakdownList.expList.length})</span>
                </h4>
                <table className="w-full text-left border-collapse min-w-[550px]">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-[#E8EAED] text-[11px] font-bold text-[#5F6368] uppercase">
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Total Outflow (₹)</th>
                      <th className="py-2.5 px-3 text-right">% of Month Spends</th>
                      <th className="py-2.5 px-3 text-center">Txn Count</th>
                      <th className="py-2.5 px-3 text-right">Avg / Txn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F4] text-xs">
                    {categoryBreakdownList.expList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#5F6368]">
                          No expenses recorded in {currentMonthLabel}
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

              {/* Income Categories Breakdown */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-[#137333] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp size={14} />
                  <span>Income Sources Breakdown ({categoryBreakdownList.incList.length})</span>
                </h4>
                <table className="w-full text-left border-collapse min-w-[550px]">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-[#E8EAED] text-[11px] font-bold text-[#5F6368] uppercase">
                      <th className="py-2.5 px-3">Category / Stream</th>
                      <th className="py-2.5 px-3 text-right">Total Inflow (₹)</th>
                      <th className="py-2.5 px-3 text-right">% of Month Earnings</th>
                      <th className="py-2.5 px-3 text-center">Txn Count</th>
                      <th className="py-2.5 px-3 text-right">Avg / Txn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F4] text-xs">
                    {categoryBreakdownList.incList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#5F6368]">
                          No income recorded in {currentMonthLabel}
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
          )}
        </div>
      </div>
    </div>
  );
};
