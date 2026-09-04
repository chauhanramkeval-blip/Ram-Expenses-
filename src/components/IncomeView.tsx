import React, { useState } from "react";
import {
  TrendingUp,
  Plus,
  Filter,
  ArrowUpDown,
  Download,
  Calendar,
  Building2,
  Search,
  Wallet,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowDownRight,
  PiggyBank,
  Sparkles,
  Settings,
  Briefcase,
  Zap,
} from "lucide-react";
import { Income, IncomeCategory, PaymentMode, Expense, IncomeCategoryMeta } from "../types";
import { INCOME_CATEGORIES_DATA, INCOME_CATEGORY_LIST } from "../data/categories";
import { IncomeBadge, IncomeIcon, resolveIncomeMeta } from "./CategoryIcon";
import { formatINR, formatFriendlyDate } from "../utils/formatters";
import { exportTransactionsToExcel } from "../utils/export";

interface IncomeViewProps {
  incomes: Income[];
  expenses: Expense[];
  monthlyBudget: number;
  searchQuery: string;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
  onOpenAddIncome: () => void;
  onNavigateToVisuals: () => void;
  customIncomeCategories?: IncomeCategoryMeta[];
  onOpenCategoryManager?: () => void;
}

const SALARY_CATEGORIES = new Set([
  "Salary / Wages",
  "Bonus & Incentives",
  "Monthly Stipend",
  "Salary",
  "Bonus",
]);

export const IncomeView: React.FC<IncomeViewProps> = ({
  incomes,
  expenses,
  monthlyBudget,
  searchQuery,
  onEditIncome,
  onDeleteIncome,
  onOpenAddIncome,
  onNavigateToVisuals,
  customIncomeCategories,
  onOpenCategoryManager,
}) => {
  const [streamFilter, setStreamFilter] = useState<"ALL" | "SALARY" | "EXTRA">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amt-desc" | "amt-asc">(
    "date-desc"
  );

  const now = new Date();
  const allCategories = customIncomeCategories || INCOME_CATEGORY_LIST;

  // Current Month calculations
  const currentMonthIncomes = incomes.filter((inc) => {
    const d = new Date(inc.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalMonthlyIncome = currentMonthIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalMonthlyExpense = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netSavings = totalMonthlyIncome - totalMonthlyExpense;
  const savingsRate =
    totalMonthlyIncome > 0
      ? Math.max(0, Math.round((netSavings / totalMonthlyIncome) * 100))
      : 0;

  // Salary vs Extra calculations (Current Month)
  const salaryIncomes = currentMonthIncomes.filter(
    (i) => SALARY_CATEGORIES.has(i.category) || i.category.toLowerCase().includes("salary") || i.category.toLowerCase().includes("bonus")
  );
  const totalSalaryBonus = salaryIncomes.reduce((sum, i) => sum + i.amount, 0);

  const extraIncomes = currentMonthIncomes.filter(
    (i) => !SALARY_CATEGORIES.has(i.category) && !i.category.toLowerCase().includes("salary") && !i.category.toLowerCase().includes("bonus")
  );
  const totalExtraIncome = extraIncomes.reduce((sum, i) => sum + i.amount, 0);

  // Filter & Search logic
  const filtered = incomes.filter((i) => {
    // Stream filter (Salary vs Extra)
    const isSalary =
      SALARY_CATEGORIES.has(i.category) ||
      i.category.toLowerCase().includes("salary") ||
      i.category.toLowerCase().includes("bonus");

    if (streamFilter === "SALARY" && !isSalary) return false;
    if (streamFilter === "EXTRA" && isSalary) return false;

    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = i.title.toLowerCase().includes(q);
      const matchCat = i.category.toLowerCase().includes(q);
      const matchSource = i.sourceOrClient?.toLowerCase().includes(q) || false;
      const matchNotes = i.notes?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchCat && !matchSource && !matchNotes) {
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

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "date-desc") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === "date-asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === "amt-desc") {
      return b.amount - a.amount;
    }
    if (sortBy === "amt-asc") {
      return a.amount - b.amount;
    }
    return 0;
  });

  // Group by Date for Chronological sections
  const groupedByDate: Record<string, Income[]> = {};
  sorted.forEach((item) => {
    const groupKey = formatFriendlyDate(item.date);
    if (!groupedByDate[groupKey]) {
      groupedByDate[groupKey] = [];
    }
    groupedByDate[groupKey].push(item);
  });

  // Export to Excel / CSV for Income
  const handleExportIncomeCSV = () => {
    if (incomes.length === 0) return;
    exportTransactionsToExcel({
      incomes: sorted.length > 0 ? sorted : incomes,
      segment: "income",
    });
  };

  return (
    <div id="khata-income-section-container" className="space-y-5 animate-fadeIn">
      {/* 1. Top Income & Savings Overview Card */}
      <div
        id="income-summary-card"
        className="bg-white rounded-3xl border border-[#E8EAED] p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F3F4] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F9D58]"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
                Monthly Income & Inflow Dashboard
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#0F9D58]">
                {now.toLocaleString("en-IN", { month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-3 flex-wrap">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F9D58]">
                +{formatINR(totalMonthlyIncome)}
              </h2>
              <span className="text-xs sm:text-sm font-semibold text-[#5F6368]">
                total in-hand inflow ({currentMonthIncomes.length} receipts)
              </span>
            </div>
          </div>

          {/* Action Buttons: Add Income & Categories Manual Edit */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            {onOpenCategoryManager && (
              <button
                id="btn-edit-income-categories"
                onClick={onOpenCategoryManager}
                title="Edit Income & Expense Categories"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] border border-[#D2E3FC] rounded-full transition-colors cursor-pointer"
              >
                <Settings size={14} />
                <span>Edit Categories</span>
              </button>
            )}

            <button
              id="btn-add-income-header"
              onClick={onOpenAddIncome}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs sm:text-sm font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Record Income (+₹)</span>
            </button>
          </div>
        </div>

        {/* Breakdown: Salary & Bonus vs Extra Income vs Spends & Net */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: Salary & Bonus */}
          <div
            onClick={() => setStreamFilter(streamFilter === "SALARY" ? "ALL" : "SALARY")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              streamFilter === "SALARY"
                ? "bg-[#E6F4EA] border-[#0F9D58] ring-2 ring-[#0F9D58]/30 shadow-xs"
                : "bg-[#F8F9FA] hover:bg-[#E6F4EA]/60 border-[#E8EAED]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#137333] flex items-center gap-1">
                <Briefcase size={14} /> Salary & Bonus
              </span>
              <span className="text-[10px] px-1.5 py-0.2 font-bold rounded bg-[#CEEAD6] text-[#137333]">
                {salaryIncomes.length} logs
              </span>
            </div>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-bold text-[#137333]">
                +{formatINR(totalSalaryBonus)}
              </span>
              <p className="text-[11px] text-[#5F6368] mt-0.5">
                Primary wages & appraisals
              </p>
            </div>
          </div>

          {/* Card 2: Extra & Side Income */}
          <div
            onClick={() => setStreamFilter(streamFilter === "EXTRA" ? "ALL" : "EXTRA")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              streamFilter === "EXTRA"
                ? "bg-[#FEF7E0] border-[#F9AB00] ring-2 ring-[#F9AB00]/30 shadow-xs"
                : "bg-[#F8F9FA] hover:bg-[#FEF7E0]/60 border-[#E8EAED]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#B06000] flex items-center gap-1">
                <Zap size={14} /> Extra & Side Income
              </span>
              <span className="text-[10px] px-1.5 py-0.2 font-bold rounded bg-[#FEEFC3] text-[#B06000]">
                {extraIncomes.length} logs
              </span>
            </div>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-bold text-[#B06000]">
                +{formatINR(totalExtraIncome)}
              </span>
              <p className="text-[11px] text-[#5F6368] mt-0.5">
                Freelance, dividends & rent
              </p>
            </div>
          </div>

          {/* Card 3: Outflow */}
          <div className="bg-[#FCE8E6] p-4 rounded-2xl border border-[#FAD2CF] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#C5221F]">Total Expenses</span>
              <div className="w-5 h-5 rounded-full bg-[#EA4335] text-white flex items-center justify-center text-[10px] font-bold">
                ↑
              </div>
            </div>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-bold text-[#C5221F]">
                -{formatINR(totalMonthlyExpense)}
              </span>
              <p className="text-[11px] text-[#C5221F]/80 mt-0.5">
                Logged spends this month
              </p>
            </div>
          </div>

          {/* Card 4: Net Balance / Savings */}
          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between ${
              netSavings >= 0
                ? "bg-[#E8F0FE] border-[#D2E3FC]"
                : "bg-[#FEF7E0] border-[#FEEFC3]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold ${
                  netSavings >= 0 ? "text-[#1A73E8]" : "text-[#B06000]"
                }`}
              >
                Net Cashflow
              </span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                  netSavings >= 0 ? "bg-[#1A73E8]" : "bg-[#F9AB00]"
                }`}
              >
                ₹
              </div>
            </div>
            <div className="mt-2">
              <span
                className={`text-lg sm:text-xl font-bold ${
                  netSavings >= 0 ? "text-[#1A73E8]" : "text-[#B06000]"
                }`}
              >
                {netSavings >= 0 ? "+" : ""}
                {formatINR(netSavings)}
              </span>
              <p className="text-[11px] text-[#5F6368] mt-0.5">
                Savings rate: <span className="font-bold text-[#1E8E3E]">{savingsRate}%</span>
              </p>
            </div>
          </div>
        </div>

        {/* Savings Rate Progress Bar */}
        <div className="mt-4 pt-3 border-t border-[#F1F3F4]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5F6368] mb-1.5">
            <span className="flex items-center gap-1.5">
              <PiggyBank size={14} className="text-[#0F9D58]" />
              <span>Monthly Retained Savings</span>
            </span>
            <span className="font-bold text-[#0F9D58]">{savingsRate}% In-Hand Retained</span>
          </div>
          <div className="h-2.5 w-full bg-[#F1F3F4] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#0F9D58] to-[#34A853]"
              style={{ width: `${Math.min(100, savingsRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stream Type Filter Segmented Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-[#5F6368] uppercase tracking-wider mr-1">
          Income Streams:
        </span>
        <button
          id="btn-stream-all"
          onClick={() => setStreamFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
            streamFilter === "ALL"
              ? "bg-[#202124] text-white border-[#202124] shadow-2xs"
              : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4]"
          }`}
        >
          All Inflows ({incomes.length})
        </button>
        <button
          id="btn-stream-salary"
          onClick={() => setStreamFilter("SALARY")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
            streamFilter === "SALARY"
              ? "bg-[#0F9D58] text-white border-[#0F9D58] shadow-2xs"
              : "bg-white text-[#137333] border-[#CEEAD6] hover:bg-[#E6F4EA]"
          }`}
        >
          <Briefcase size={13} />
          <span>Salary & Bonus</span>
        </button>
        <button
          id="btn-stream-extra"
          onClick={() => setStreamFilter("EXTRA")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
            streamFilter === "EXTRA"
              ? "bg-[#B06000] text-white border-[#B06000] shadow-2xs"
              : "bg-white text-[#B06000] border-[#FEEFC3] hover:bg-[#FEF7E0]"
          }`}
        >
          <Zap size={13} />
          <span>Extra & Side Income</span>
        </button>
      </div>

      {/* 2. Category Filter Chips */}
      <div
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 touch-pan-x"
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
          id="chip-inc-cat-all"
          onClick={() => setSelectedCategory("ALL")}
          className={`shrink-0 flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
            selectedCategory === "ALL"
              ? "bg-[#202124] text-white border-[#202124]"
              : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4]"
          }`}
        >
          All Categories
        </button>
        {allCategories.map((cat) => {
          const count = incomes.filter((i) => i.category === cat.id || i.category === cat.name).length;
          const isSelected = selectedCategory === cat.id || selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              id={`chip-inc-cat-${cat.id.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => setSelectedCategory(isSelected ? "ALL" : cat.id)}
              className={`shrink-0 flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                isSelected
                  ? "shadow-2xs font-bold"
                  : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F8F9FA]"
              }`}
              style={{
                backgroundColor: isSelected ? cat.bgColor : undefined,
                borderColor: isSelected ? cat.color : undefined,
                color: isSelected ? cat.color : undefined,
              }}
            >
              <IncomeIcon category={cat.id} customCategories={customIncomeCategories} size={14} />
              <span>{cat.name}</span>
              {count > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                  style={{
                    backgroundColor: isSelected ? cat.color : "#E8EAED",
                    color: isSelected ? "white" : "#5F6368",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {onOpenCategoryManager && (
          <button
            type="button"
            onClick={onOpenCategoryManager}
            className="shrink-0 flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap text-[#0F9D58] bg-[#E6F4EA] hover:bg-[#CEEAD6] border border-[#CEEAD6] transition-colors cursor-pointer"
          >
            <Settings size={12} />
            <span>Edit Categories</span>
          </button>
        )}
      </div>

      {/* 3. Sub-bar: Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 py-1 text-xs text-[#5F6368]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#3C4043] flex items-center gap-1">
            <Filter size={13} /> Deposit Mode:
          </span>
          <select
            id="select-income-payment-mode-filter"
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
            className="bg-white border border-[#DADCE0] rounded-lg px-2.5 py-1 text-xs text-[#202124] focus:border-[#0F9D58] outline-none"
          >
            <option value="ALL">All Deposit Modes</option>
            <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
            <option value="UPI">UPI (GPay/PhonePe)</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Cash">Cash (Rokda)</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#3C4043] flex items-center gap-1">
            <ArrowUpDown size={13} /> Sort:
          </span>
          <select
            id="select-sort-incomes"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-[#DADCE0] rounded-lg px-2.5 py-1 text-xs text-[#202124] focus:border-[#0F9D58] outline-none"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amt-desc">Highest Amount (+₹)</option>
            <option value="amt-asc">Lowest Amount (+₹)</option>
          </select>

          <button
            id="btn-export-income-csv"
            onClick={handleExportIncomeCSV}
            title="Download Income Statement"
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124] rounded-lg border border-[#DADCE0] transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* 4. Income Items Chronological List */}
      {sorted.length === 0 ? (
        <div
          id="income-empty-state"
          className="bg-white rounded-3xl border border-[#E8EAED] p-8 text-center shadow-xs"
        >
          <div className="w-14 h-14 rounded-full bg-[#E6F4EA] text-[#0F9D58] flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={26} />
          </div>
          <h3 className="text-base font-bold text-[#202124]">No income records found</h3>
          <p className="text-xs text-[#5F6368] mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== "ALL" || selectedPaymentMode !== "ALL" || streamFilter !== "ALL"
              ? "Try adjusting your search query, stream filter or category chips."
              : "Log your salary, freelance retainers, dividends, or cash gifts to see your net cashflow."}
          </p>
          <button
            id="btn-empty-add-income"
            onClick={onOpenAddIncome}
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Record First Income</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedByDate).map(([dateGroup, items]) => {
            const dayTotal = items.reduce((sum, it) => sum + it.amount, 0);

            return (
              <div key={dateGroup} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5F6368] flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#0F9D58]" />
                    {dateGroup}
                  </span>
                  <span className="text-xs font-semibold text-[#137333] bg-[#E6F4EA] px-2 py-0.5 rounded-md">
                    Total Inflow: +{formatINR(dayTotal)}
                  </span>
                </div>

                {/* Items Group Card */}
                <div className="bg-white rounded-2xl border border-[#E8EAED] shadow-xs divide-y divide-[#F1F3F4] overflow-hidden">
                  {items.map((item) => {
                    const catMeta = resolveIncomeMeta(item.category, customIncomeCategories);

                    return (
                      <div
                        key={item.id}
                        id={`income-item-${item.id}`}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#F8F9FA] transition-colors group"
                      >
                        {/* Left Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: catMeta.bgColor,
                              borderColor: catMeta.borderColor,
                            }}
                          >
                            <IncomeIcon category={item.category} customCategories={customIncomeCategories} size={20} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm text-[#202124] truncate">
                                {item.title}
                              </h4>
                              {item.sourceOrClient && (
                                <span className="text-[11px] font-medium text-[#5F6368] bg-[#F1F3F4] px-1.5 py-0.2 rounded flex items-center gap-1">
                                  <Building2 size={11} /> {item.sourceOrClient}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#5F6368] flex-wrap">
                              <span
                                className="font-medium"
                                style={{ color: catMeta.color }}
                              >
                                {item.category}
                              </span>
                              <span>•</span>
                              <span>
                                {item.paymentMode === "Bank Transfer" && "🏦 Bank Transfer"}
                                {item.paymentMode === "UPI" && "⚡ UPI"}
                                {item.paymentMode === "Net Banking" && "💻 NetBanking"}
                                {item.paymentMode === "Cash" && "💵 Cash"}
                                {item.paymentMode === "Cheque" && "📜 Cheque"}
                                {item.paymentMode === "Debit / Credit Card" && "💳 Card"}
                              </span>
                              {item.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-[#70757A] truncate max-w-[180px]">
                                    "{item.notes}"
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions (Edit in GREEN, Delete in RED) */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-bold text-[#0F9D58]">
                              +{formatINR(item.amount)}
                            </div>
                          </div>

                          {/* Action Buttons: Edit in Green (#0F9D58), Delete in Red (#EA4335) */}
                          <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              id={`btn-edit-inc-${item.id}`}
                              onClick={() => onEditIncome(item)}
                              title="Edit Income (Green)"
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0F9D58] bg-[#E6F4EA] hover:bg-[#CEEAD6] border border-[#CEEAD6] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              <Edit2 size={13} strokeWidth={2.2} />
                              <span className="hidden md:inline">Edit</span>
                            </button>
                            <button
                              id={`btn-delete-inc-${item.id}`}
                              onClick={() => onDeleteIncome(item.id)}
                              title="Delete Income (Red)"
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#EA4335] bg-[#FCE8E6] hover:bg-[#FAD2CF] border border-[#FAD2CF] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              <Trash2 size={13} strokeWidth={2.2} />
                              <span className="hidden md:inline">Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
