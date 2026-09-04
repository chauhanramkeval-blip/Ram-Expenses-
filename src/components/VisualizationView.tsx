import React, { useState, useMemo } from "react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Wallet,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Percent,
  Filter,
  X,
  Search,
  ArrowUpDown,
  Trash2,
  Edit2,
  Tag,
  MapPin,
  RotateCcw,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Expense, ExpenseCategory } from "../types";
import { CATEGORIES_DATA } from "../data/categories";
import { formatINR, formatFriendlyDate } from "../utils/formatters";
import { CategoryIcon, CategoryBadge } from "./CategoryIcon";
import {
  DatePeriodFilter,
  DateRangeValue,
  calculatePresetRange,
  formatToDDMMYY,
} from "./DatePeriodFilter";

interface VisualizationViewProps {
  expenses: Expense[];
  monthlyBudget: number;
  onNavigateToAdvisor: () => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (id: string) => void;
  onOpenAddExpense?: () => void;
}

export const VisualizationView: React.FC<VisualizationViewProps> = ({
  expenses,
  monthlyBudget,
  onNavigateToAdvisor,
  onEditExpense,
  onDeleteExpense,
  onOpenAddExpense,
}) => {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    const initial = calculatePresetRange("this-month");
    return {
      startDate: initial.startDate,
      endDate: initial.endDate,
      preset: "this-month",
      label: initial.label,
    };
  });
  const [chartType, setChartType] = useState<"donut" | "pie">("donut");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drillSearchQuery, setDrillSearchQuery] = useState("");
  const [drillSortBy, setDrillSortBy] = useState<"date-desc" | "date-asc" | "amt-desc" | "amt-asc">("date-desc");

  // Month-over-Month Comparison Data
  const momComparison = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevMonthIdx = (currentMonth - 1 + 12) % 12;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
    const prevMonthLabel = new Date(prevYear, prevMonthIdx, 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });

    const currentMonthExp = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const prevMonthExp = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === prevMonthIdx && d.getFullYear() === prevYear;
    });

    const currentTotal = currentMonthExp.reduce((sum, e) => sum + e.amount, 0);
    const prevTotal = prevMonthExp.reduce((sum, e) => sum + e.amount, 0);

    const diff = currentTotal - prevTotal;
    const diffPct =
      prevTotal > 0
        ? Math.round((Math.abs(diff) / prevTotal) * 100)
        : currentTotal > 0
        ? 100
        : 0;

    const hasDecreased = diff < 0;
    const hasIncreased = diff > 0;

    const daysPassedInCurrentMonth = Math.max(1, now.getDate());
    const totalDaysInPrevMonth = new Date(prevYear, prevMonthIdx + 1, 0).getDate();

    const currentDailyAvg = Math.round(currentTotal / daysPassedInCurrentMonth);
    const prevDailyAvg = Math.round(prevTotal / totalDaysInPrevMonth);

    // Calculate category level changes
    const currentCatMap: Record<string, number> = {};
    currentMonthExp.forEach((e) => {
      currentCatMap[e.category] = (currentCatMap[e.category] || 0) + e.amount;
    });

    const prevCatMap: Record<string, number> = {};
    prevMonthExp.forEach((e) => {
      prevCatMap[e.category] = (prevCatMap[e.category] || 0) + e.amount;
    });

    const allCatKeys = Array.from(
      new Set([...Object.keys(currentCatMap), ...Object.keys(prevCatMap)])
    );

    const categoryShifts = allCatKeys
      .map((cat) => {
        const cur = currentCatMap[cat] || 0;
        const prev = prevCatMap[cat] || 0;
        const delta = cur - prev;
        return {
          category: cat as ExpenseCategory,
          current: cur,
          previous: prev,
          delta,
        };
      })
      .sort((a, b) => b.delta - a.delta);

    const maxMonthlySpending = Math.max(currentTotal, prevTotal, monthlyBudget, 1);

    return {
      currentMonthLabel,
      prevMonthLabel,
      currentTotal,
      prevTotal,
      currentCount: currentMonthExp.length,
      prevCount: prevMonthExp.length,
      diff,
      diffPct,
      hasDecreased,
      hasIncreased,
      currentDailyAvg,
      prevDailyAvg,
      daysPassedInCurrentMonth,
      totalDaysInPrevMonth,
      categoryShifts,
      maxMonthlySpending,
    };
  }, [expenses, monthlyBudget]);

  // Predict End-of-Month spending based on current daily consumption
  const endOfMonthPrediction = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const totalDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
    const daysElapsed = Math.max(1, now.getDate());
    const daysRemaining = Math.max(0, totalDaysInMonth - daysElapsed);

    const currentMonthExp = expenses.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
    });

    const totalSpentSoFar = currentMonthExp.reduce((sum, e) => sum + e.amount, 0);
    const dailyAverageBurn = totalSpentSoFar / daysElapsed;
    const projectedEndOfMonth = Math.round(dailyAverageBurn * totalDaysInMonth);
    const remainingBudget = Math.max(0, monthlyBudget - totalSpentSoFar);
    const safeDailyAllowanceRemaining =
      daysRemaining > 0 ? Math.round(remainingBudget / daysRemaining) : 0;
    const varianceFromBudget = projectedEndOfMonth - monthlyBudget;
    const isOverBudget = varianceFromBudget > 0;
    const projectedPercent =
      monthlyBudget > 0 ? Math.round((projectedEndOfMonth / monthlyBudget) * 100) : 0;

    return {
      monthName: now.toLocaleString("default", { month: "long" }),
      totalDaysInMonth,
      daysElapsed,
      daysRemaining,
      totalSpentSoFar,
      dailyAverageBurn: Math.round(dailyAverageBurn),
      projectedEndOfMonth,
      remainingBudget,
      safeDailyAllowanceRemaining,
      varianceFromBudget: Math.abs(varianceFromBudget),
      isOverBudget,
      projectedPercent,
    };
  }, [expenses, monthlyBudget]);

  // Filter expenses according to selected Date Range (Start Date ~ End Date)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.date) return false;
      if (dateRange.startDate && e.date < dateRange.startDate) return false;
      if (dateRange.endDate && e.date > dateRange.endDate) return false;
      return true;
    });
  }, [expenses, dateRange]);

  const totalSpent = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  // Category data aggregation for Pie Chart
  const categoryStats = useMemo(() => {
    const map: Record<string, { name: ExpenseCategory; value: number; count: number }> = {};

    filteredExpenses.forEach((e) => {
      if (!map[e.category]) {
        map[e.category] = { name: e.category, value: 0, count: 0 };
      }
      map[e.category].value += e.amount;
      map[e.category].count += 1;
    });

    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Payment mode data aggregation
  const paymentStats = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.paymentMode] = (map[e.paymentMode] || 0) + e.amount;
    });
    return Object.entries(map).map(([mode, amount]) => ({
      mode,
      amount,
      percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }));
  }, [filteredExpenses, totalSpent]);

  // Daily Trend Data dynamically matching selected Date Range
  const dailyTrendData = useMemo(() => {
    const map: Record<string, number> = {};

    if (!dateRange.startDate || !dateRange.endDate) {
      return [];
    }

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return [];
    }

    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const datesList: string[] = [];
    const cur = new Date(start);
    while (cur <= end && datesList.length <= 60) {
      const str = cur.toISOString().split("T")[0];
      datesList.push(str);
      map[str] = 0;
      cur.setDate(cur.getDate() + 1);
    }

    filteredExpenses.forEach((e) => {
      if (map[e.date] !== undefined) {
        map[e.date] += e.amount;
      }
    });

    return datesList.map((dateStr) => {
      const d = new Date(dateStr);
      let label = "";
      if (diffDays <= 7) {
        label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
      } else if (diffDays <= 31) {
        label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      } else {
        label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      }

      return {
        date: label,
        fullDate: dateStr,
        amount: map[dateStr] || 0,
      };
    });
  }, [filteredExpenses, dateRange]);

  // Top spending category
  const topCategory = categoryStats[0];
  const topCategoryPercent =
    topCategory && totalSpent > 0 ? Math.round((topCategory.value / totalSpent) * 100) : 0;

  // Toggle or select category drill-down
  const handleToggleCategory = (categoryName: string) => {
    setSelectedCategory((prev) => (prev === categoryName ? null : categoryName));
  };

  // Selected Category Stat Object
  const selectedCategoryStat = useMemo(() => {
    if (!selectedCategory) return null;
    return categoryStats.find((c) => c.name === selectedCategory) || null;
  }, [categoryStats, selectedCategory]);

  // Drilled-down and searched transactions list
  const drilledExpenses = useMemo(() => {
    let list = filteredExpenses;

    // Filter by selected category slice
    if (selectedCategory) {
      list = list.filter((e) => e.category === selectedCategory);
    }

    // Filter by drill-down search
    if (drillSearchQuery.trim()) {
      const q = drillSearchQuery.toLowerCase();
      list = list.filter((e) => {
        const titleMatch = e.title.toLowerCase().includes(q);
        const catMatch = e.category.toLowerCase().includes(q);
        const merchantMatch = e.merchantOrLocation?.toLowerCase().includes(q) || false;
        const notesMatch = e.notes?.toLowerCase().includes(q) || false;
        return titleMatch || catMatch || merchantMatch || notesMatch;
      });
    }

    // Sort list
    return [...list].sort((a, b) => {
      if (drillSortBy === "date-desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (drillSortBy === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (drillSortBy === "amt-desc") {
        return b.amount - a.amount;
      }
      if (drillSortBy === "amt-asc") {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [filteredExpenses, selectedCategory, drillSearchQuery, drillSortBy]);

  const drilledTotal = useMemo(() => {
    return drilledExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [drilledExpenses]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const catMeta = CATEGORIES_DATA[data.name as ExpenseCategory] || { color: "#1A73E8" };
      const pct = totalSpent > 0 ? ((data.value / totalSpent) * 100).toFixed(1) : "0";

      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-[#E8EAED] text-xs">
          <div className="flex items-center gap-2 font-bold text-[#202124]">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: catMeta.color }}
            />
            <span>{data.name}</span>
          </div>
          <div className="mt-1.5 space-y-0.5 text-[#5F6368]">
            <div>
              Total Spend: <span className="font-bold text-[#202124]">{formatINR(data.value)}</span>
            </div>
            <div>
              Share of Spends: <span className="font-semibold text-[#1A73E8]">{pct}%</span>
            </div>
            <div>
              Transactions: <span className="font-semibold">{data.count} items</span>
            </div>
            <div className="text-[10px] text-[#1A73E8] font-bold pt-1 border-t border-[#F1F3F4] mt-1">
              👉 Click slice to drill down into items
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="khata-visualization-page" className="space-y-6 animate-fadeIn">
      {/* 1. Month-over-Month Spending Progress Card */}
      <div
        id="mom-spending-progress-card"
        className="bg-white rounded-3xl border border-[#E8EAED] p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all"
      >
        {/* Header with Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F3F4] pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                momComparison.hasDecreased
                  ? "bg-[#E6F4EA] text-[#0F9D58]"
                  : momComparison.hasIncreased
                  ? "bg-[#FEF7E0] text-[#B06000]"
                  : "bg-[#E8F0FE] text-[#1A73E8]"
              }`}
            >
              {momComparison.hasDecreased ? (
                <TrendingDown size={24} />
              ) : momComparison.hasIncreased ? (
                <TrendingUp size={24} />
              ) : (
                <Calendar size={24} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#202124]">
                  Monthly Spending Progress
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    momComparison.hasDecreased
                      ? "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]"
                      : momComparison.hasIncreased
                      ? "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]"
                      : "bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]"
                  }`}
                >
                  {momComparison.hasDecreased
                    ? `📉 ${momComparison.diffPct}% Reduced vs Last Month`
                    : momComparison.hasIncreased
                    ? `📈 +${momComparison.diffPct}% vs Last Month`
                    : "⚖️ Equal to Last Month"}
                </span>
              </div>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Comparing <span className="font-semibold text-[#202124]">{momComparison.currentMonthLabel}</span> against{" "}
                <span className="font-semibold text-[#202124]">{momComparison.prevMonthLabel}</span>
              </p>
            </div>
          </div>

          {/* Quick AI Advice Action */}
          <button
            id="btn-mom-ai-advisor"
            onClick={onNavigateToAdvisor}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] rounded-full transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Monthly Audit</span>
          </button>
        </div>

        {/* 2 Comparative Columns (Current Month vs Previous Month) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Current Month Box */}
          <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[#E8EAED]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5F6368] mb-1">
              <span className="flex items-center gap-1.5 text-[#1A73E8]">
                <Calendar size={14} /> Current Month ({momComparison.currentMonthLabel})
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-[#E8EAED]">
                Day {momComparison.daysPassedInCurrentMonth}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#202124]">
                {formatINR(momComparison.currentTotal)}
              </span>
              <span className="text-xs text-[#5F6368]">
                ({momComparison.currentCount} logged spends)
              </span>
            </div>

            {/* Visual Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-[#5F6368] mb-1">
                <span>Month Budget Utilized</span>
                <span className="font-bold text-[#1A73E8]">
                  {Math.round((momComparison.currentTotal / (monthlyBudget || 1)) * 100)}%
                </span>
              </div>
              <div className="h-3 w-full bg-[#E8EAED] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A73E8] rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      (momComparison.currentTotal / momComparison.maxMonthlySpending) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#5F6368] mt-3 pt-2.5 border-t border-[#E8EAED]">
              <span>Daily Spend Pace:</span>
              <span className="font-bold text-[#202124]">
                {formatINR(momComparison.currentDailyAvg)} / day
              </span>
            </div>
          </div>

          {/* Previous Month Box */}
          <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[#E8EAED]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5F6368] mb-1">
              <span className="flex items-center gap-1.5 text-[#5F6368]">
                <Clock size={14} /> Previous Month ({momComparison.prevMonthLabel})
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-[#E8EAED]">
                Full {momComparison.totalDaysInPrevMonth} Days
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#5F6368]">
                {formatINR(momComparison.prevTotal)}
              </span>
              <span className="text-xs text-[#70757A]">
                ({momComparison.prevCount} total spends)
              </span>
            </div>

            {/* Visual Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-[#5F6368] mb-1">
                <span>Baseline Spending Volume</span>
                <span className="font-bold text-[#5F6368]">100% (Baseline)</span>
              </div>
              <div className="h-3 w-full bg-[#E8EAED] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#70757A] rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      (momComparison.prevTotal / momComparison.maxMonthlySpending) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#5F6368] mt-3 pt-2.5 border-t border-[#E8EAED]">
              <span>Past Daily Average:</span>
              <span className="font-bold text-[#5F6368]">
                {formatINR(momComparison.prevDailyAvg)} / day
              </span>
            </div>
          </div>
        </div>

        {/* Progress Delta Summary Bar */}
        <div
          className={`mt-4 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            momComparison.hasDecreased
              ? "bg-[#E6F4EA] border-[#CEEAD6] text-[#137333]"
              : momComparison.hasIncreased
              ? "bg-[#FEF7E0] border-[#FEEFC3] text-[#B06000]"
              : "bg-[#E8F0FE] border-[#D2E3FC] text-[#1A73E8]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {momComparison.hasDecreased ? (
              <CheckCircle2 size={18} className="text-[#0F9D58] shrink-0" />
            ) : momComparison.hasIncreased ? (
              <AlertTriangle size={18} className="text-[#B06000] shrink-0" />
            ) : (
              <Info size={18} className="text-[#1A73E8] shrink-0" />
            )}
            <span className="font-medium leading-relaxed">
              {momComparison.hasDecreased
                ? `You have spent ${formatINR(
                    Math.abs(momComparison.diff)
                  )} (${momComparison.diffPct}%) less than this time last month! Keep this momentum to maximize monthly savings.`
                : momComparison.hasIncreased
                ? `Spending is higher by ${formatINR(
                    momComparison.diff
                  )} (+${momComparison.diffPct}%) compared to last month. Review major discretionary purchases.`
                : "Your total spending is consistent with last month's pace."}
            </span>
          </div>

          <div className="shrink-0 font-bold px-3 py-1 bg-white rounded-full shadow-2xs">
            Net MoM Delta:{" "}
            <span
              className={
                momComparison.hasDecreased
                  ? "text-[#0F9D58]"
                  : momComparison.hasIncreased
                  ? "text-[#EA4335]"
                  : "text-[#1A73E8]"
              }
            >
              {momComparison.hasDecreased ? "-" : "+"}
              {formatINR(Math.abs(momComparison.diff))}
            </span>
          </div>
        </div>

        {/* End-of-Month Spending Prediction Summary */}
        <div
          id="end-of-month-prediction-card"
          className="mt-4 bg-[#F8F9FA] rounded-2xl p-4 sm:p-5 border border-[#E8EAED] shadow-2xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E8EAED]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold">
                <Zap size={16} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#202124] flex items-center gap-1.5">
                  <span>End-of-Month Spending Prediction</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                    {endOfMonthPrediction.monthName} Forecast
                  </span>
                </h4>
                <p className="text-[11px] text-[#5F6368]">
                  Extrapolated from your current daily burn rate of {formatINR(endOfMonthPrediction.dailyAverageBurn)}/day (Days 1–{endOfMonthPrediction.daysElapsed} of {endOfMonthPrediction.totalDaysInMonth})
                </p>
              </div>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto border flex items-center gap-1.5 ${
                endOfMonthPrediction.isOverBudget
                  ? "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]"
                  : "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]"
              }`}
            >
              {endOfMonthPrediction.isOverBudget ? (
                <>
                  <AlertTriangle size={13} />
                  <span>Projected Over Budget by {formatINR(endOfMonthPrediction.varianceFromBudget)}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} />
                  <span>Projected Within Budget ({formatINR(endOfMonthPrediction.varianceFromBudget)} surplus)</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5">
            <div className="bg-white p-3 rounded-xl border border-[#E8EAED]">
              <span className="text-[10px] text-[#5F6368] font-medium block">Current Spent</span>
              <span className="text-sm sm:text-base font-bold text-[#202124]">
                {formatINR(endOfMonthPrediction.totalSpentSoFar)}
              </span>
              <span className="text-[10px] text-[#80868B] block mt-0.5">
                {endOfMonthPrediction.daysElapsed} days passed
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#E8EAED]">
              <span className="text-[10px] text-[#5F6368] font-medium block">Current Daily Pace</span>
              <span className="text-sm sm:text-base font-bold text-[#1A73E8]">
                {formatINR(endOfMonthPrediction.dailyAverageBurn)}
              </span>
              <span className="text-[10px] text-[#80868B] block mt-0.5">per day average</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#E8EAED]">
              <span className="text-[10px] text-[#5F6368] font-medium block">Predicted Month-End</span>
              <span
                className={`text-sm sm:text-base font-bold ${
                  endOfMonthPrediction.isOverBudget ? "text-[#C5221F]" : "text-[#137333]"
                }`}
              >
                {formatINR(endOfMonthPrediction.projectedEndOfMonth)}
              </span>
              <span className="text-[10px] text-[#80868B] block mt-0.5">
                {endOfMonthPrediction.projectedPercent}% of {formatINR(monthlyBudget)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#E8EAED]">
              <span className="text-[10px] text-[#5F6368] font-medium block">Safe Daily Allowance</span>
              <span className="text-sm sm:text-base font-bold text-[#202124]">
                {formatINR(endOfMonthPrediction.safeDailyAllowanceRemaining)}
              </span>
              <span className="text-[10px] text-[#80868B] block mt-0.5">
                for remaining {endOfMonthPrediction.daysRemaining} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Banner: Where are you spending most? */}
      {topCategory && (
        <div
          id="spending-audit-banner"
          className="bg-[#FEF7E0] rounded-2xl p-4 sm:p-5 border border-[#FEEFC3] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F9AB00]/20 text-[#B06000] flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B06000]">
                  Where You Are Spending Most
                </span>
                <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-[#FBBC04] text-[#202124]">
                  {topCategoryPercent}% of Total
                </span>
              </div>
              <h3 className="text-base font-bold text-[#202124] mt-0.5">
                Highest Expense: <span className="text-[#B06000]">{topCategory.name}</span> (
                {formatINR(topCategory.value)})
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                You made {topCategory.count} transactions in {topCategory.name}. Click below to filter by this category or ask the AI Advisor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <button
              type="button"
              id="btn-filter-top-category"
              onClick={() => handleToggleCategory(topCategory.name)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                selectedCategory === topCategory.name
                  ? "bg-[#1A73E8] text-white border-[#1A73E8]"
                  : "bg-white text-[#B06000] border-[#FEEFC3] hover:bg-[#FFF9E6]"
              }`}
            >
              <Filter size={13} />
              <span>{selectedCategory === topCategory.name ? "Viewing Filter" : "Filter Slices"}</span>
            </button>

            <button
              id="btn-trigger-ai-audit"
              onClick={onNavigateToAdvisor}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Ask AI Advice</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Control Bar: Modern Dark Date Range & Period Filter + Chart Style Toggle */}
      <div className="bg-white rounded-2xl border border-[#E8EAED] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Date Range & Period Filter Component */}
        <div className="flex items-center gap-2 flex-wrap">
          <DatePeriodFilter
            value={dateRange}
            onChange={(newVal) => {
              setDateRange(newVal);
            }}
          />

          <span className="text-xs text-[#5F6368] font-medium hidden lg:inline">
            Showing <strong className="text-[#202124]">{filteredExpenses.length}</strong> transactions
          </span>
        </div>

        {/* Chart View Toggle (Donut vs Solid Pie) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-[#5F6368]">Chart Style:</span>
          <div className="flex items-center gap-1 bg-[#F1F3F4] p-1 rounded-full text-xs">
            <button
              id="btn-chart-donut"
              onClick={() => setChartType("donut")}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                chartType === "donut"
                  ? "bg-white text-[#1A73E8] shadow-2xs"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Donut Chart
            </button>
            <button
              id="btn-chart-pie"
              onClick={() => setChartType("pie")}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                chartType === "pie"
                  ? "bg-white text-[#1A73E8] shadow-2xs"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Solid Pie
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Recharts Pie Chart with Drill-Down (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8EAED] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                  <PieChart size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#202124] flex items-center gap-2">
                    <span>Category Expense Distribution</span>
                    {selectedCategory && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]">
                        Drill-Down Active
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-[#5F6368]">
                    {selectedCategory
                      ? `Filtered to ${selectedCategory}. Click slice again to show all.`
                      : "Click any slice to filter and drill down transactions"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="text-[11px] font-bold text-[#EA4335] hover:bg-[#FCE8E6] px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title="Reset Category Filter"
                  >
                    <X size={12} />
                    <span>Clear</span>
                  </button>
                )}
                <span className="text-xs font-bold text-[#1A73E8] bg-[#E8F0FE] px-2.5 py-1 rounded-full">
                  Total: {formatINR(totalSpent)}
                </span>
              </div>
            </div>

            {/* Pie Chart Canvas */}
            {categoryStats.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#5F6368]">
                No expense data for this time period.
              </div>
            ) : (
              <div className="h-72 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={categoryStats}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={chartType === "donut" ? 65 : 0}
                      outerRadius={105}
                      paddingAngle={chartType === "donut" ? 3 : 1}
                      onClick={(entry: any) => {
                        if (entry && entry.name) {
                          handleToggleCategory(entry.name);
                        }
                      }}
                      onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                      onMouseLeave={() => setActiveCategoryIndex(null)}
                    >
                      {categoryStats.map((entry, index) => {
                        const meta =
                          CATEGORIES_DATA[entry.name as ExpenseCategory] || { color: "#1A73E8" };
                        const isSelected = selectedCategory === entry.name;
                        const isHovered = activeCategoryIndex === index;

                        let cellOpacity = 1;
                        if (selectedCategory) {
                          cellOpacity = isSelected ? 1 : 0.35;
                        } else if (activeCategoryIndex !== null) {
                          cellOpacity = isHovered ? 1 : 0.65;
                        }

                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={meta.color}
                            stroke={isSelected ? "#1A73E8" : "#ffffff"}
                            strokeWidth={isSelected ? 3 : 2}
                            opacity={cellOpacity}
                            className="transition-all cursor-pointer outline-none"
                            onClick={() => handleToggleCategory(entry.name)}
                          />
                        );
                      })}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>

                {/* Center text for Donut mode */}
                {chartType === "donut" && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
                    onClick={() => {
                      if (selectedCategory) setSelectedCategory(null);
                    }}
                    title={selectedCategory ? "Click to reset category drill-down" : undefined}
                  >
                    {selectedCategory ? (
                      <>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A73E8] bg-[#E8F0FE] px-2 py-0.5 rounded-full mb-0.5">
                          Drilled In
                        </span>
                        <span className="text-xs font-bold text-[#202124] max-w-[120px] truncate text-center">
                          {selectedCategory}
                        </span>
                        <span className="text-base font-bold text-[#1A73E8]">
                          {formatINR(selectedCategoryStat?.value || 0)}
                        </span>
                        <span className="text-[10px] text-[#5F6368]">
                          {drilledExpenses.length} items • Click to reset
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-semibold text-[#5F6368]">Total Spent</span>
                        <span className="text-lg font-bold text-[#202124]">{formatINR(totalSpent)}</span>
                        <span className="text-[10px] text-[#1E8E3E] font-bold">
                          {filteredExpenses.length} Spends
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive Mini Category Chips below chart */}
          <div className="pt-3 border-t border-[#F1F3F4]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#5F6368]">
                Filter by Category:
              </span>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="text-[10px] font-bold text-[#1A73E8] hover:underline cursor-pointer"
                >
                  Show All
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {categoryStats.slice(0, 8).map((cat, idx) => {
                const meta = CATEGORIES_DATA[cat.name as ExpenseCategory] || { color: "#1A73E8" };
                const pct = totalSpent > 0 ? Math.round((cat.value / totalSpent) * 100) : 0;
                const isSelected = selectedCategory === cat.name;

                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleToggleCategory(cat.name)}
                    onMouseEnter={() => setActiveCategoryIndex(idx)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#E8F0FE] text-[#1A73E8] border-[#1A73E8] ring-1 ring-[#1A73E8] shadow-2xs font-bold"
                        : "bg-[#F8F9FA] border-[#E8EAED] text-[#3C4043] hover:bg-[#E8F0FE] hover:text-[#1A73E8]"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="truncate max-w-[90px]">{cat.name}</span>
                    <span className={isSelected ? "text-[#1A73E8]" : "text-[#5F6368]"}>
                      ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Category Breakdown list (5 cols) with Click-to-Drill */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8EAED] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-3">
              <div>
                <h3 className="font-bold text-sm text-[#202124] flex items-center gap-1.5">
                  <span>Ranked Category Spends</span>
                </h3>
                <p className="text-[11px] text-[#5F6368]">
                  Click any row to drill down into items
                </p>
              </div>
              <span className="text-xs text-[#5F6368] font-medium">% Share</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {categoryStats.map((item, index) => {
                const meta = CATEGORIES_DATA[item.name as ExpenseCategory] || {
                  color: "#1A73E8",
                  bgColor: "#E8F0FE",
                };
                const percent = totalSpent > 0 ? Math.round((item.value / totalSpent) * 100) : 0;
                const avgSpend = Math.round(item.value / (item.count || 1));
                const isSelected = selectedCategory === item.name;

                return (
                  <div
                    key={item.name}
                    id={`cat-stat-${item.name.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => handleToggleCategory(item.name)}
                    className={`p-2.5 rounded-xl transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-[#E8F0FE] border-[#1A73E8] shadow-xs ring-1 ring-[#1A73E8]"
                        : "hover:bg-[#F8F9FA] border-transparent hover:border-[#E8EAED]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold w-4 ${isSelected ? "text-[#1A73E8]" : "text-[#5F6368]"}`}>
                          {index + 1}.
                        </span>
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                          style={{ backgroundColor: meta.bgColor }}
                        >
                          <CategoryIcon category={item.name as ExpenseCategory} size={12} />
                        </div>
                        <span className={`font-semibold ${isSelected ? "text-[#1A73E8]" : "text-[#202124]"}`}>
                          {item.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#1A73E8] text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#202124]">{formatINR(item.value)}</span>
                        <span className="text-[#5F6368] ml-1.5 font-bold">({percent}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-[#F1F3F4] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#5F6368] mt-1">
                      <span>{item.count} items</span>
                      <span>Avg: {formatINR(avgSpend)}/spend</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Modes Analysis (UPI vs Cash vs Card) */}
          <div className="bg-white rounded-2xl border border-[#E8EAED] p-4 shadow-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#5F6368] mb-2.5 flex items-center gap-1.5">
              <Wallet size={14} className="text-[#1A73E8]" />
              <span>Payment Mode Breakdown</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {paymentStats.map((p) => (
                <div
                  key={p.mode}
                  className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E8EAED] flex flex-col justify-between"
                >
                  <span className="text-[11px] font-semibold text-[#5F6368] flex items-center gap-1">
                    {p.mode === "UPI" && "⚡ UPI"}
                    {p.mode === "Cash" && "💵 Cash"}
                    {p.mode === "Debit / Credit Card" && "💳 Card"}
                    {p.mode === "Net Banking" && "🏦 Net Banking"}
                    {p.mode === "Wallet" && "👛 Wallet"}
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-[#202124]">{formatINR(p.amount)}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E8F0FE] text-[#1A73E8]">
                      {p.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. DEDICATED CATEGORY DRILL-DOWN TRANSACTIONS SECTION */}
      <div
        id="category-drill-down-section"
        className="bg-white rounded-3xl border border-[#E8EAED] p-5 sm:p-6 shadow-xs"
      >
        {/* Drill-down Header with Category Focus & Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F1F3F4] pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                selectedCategory ? "bg-[#E8F0FE] text-[#1A73E8]" : "bg-[#F1F3F4] text-[#5F6368]"
              }`}
            >
              {selectedCategory ? (
                <CategoryIcon category={selectedCategory as ExpenseCategory} size={22} />
              ) : (
                <Layers size={22} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#202124]">
                  {selectedCategory ? `${selectedCategory} Transactions` : "All Period Transactions"}
                </h3>
                {selectedCategory ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]">
                    Filtered Slice
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#F1F3F4] text-[#5F6368]">
                    Click any pie slice to filter
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5F6368] mt-0.5">
                {selectedCategory
                  ? `Showing only transactions recorded under "${selectedCategory}" for ${formatToDDMMYY(dateRange.startDate)} ~ ${formatToDDMMYY(dateRange.endDate)}`
                  : `Showing all transactions for ${formatToDDMMYY(dateRange.startDate)} ~ ${formatToDDMMYY(dateRange.endDate)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            {selectedCategory && (
              <button
                type="button"
                id="btn-clear-category-drilldown"
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#EA4335] bg-[#FCE8E6] hover:bg-[#FAD2CF] rounded-full transition-colors cursor-pointer"
              >
                <X size={14} />
                <span>Show All Categories</span>
              </button>
            )}

            <div className="bg-[#F8F9FA] px-3.5 py-1.5 rounded-full border border-[#E8EAED] text-xs font-bold text-[#202124]">
              {selectedCategory ? "Category Total: " : "Period Total: "}
              <span className="text-[#1A73E8] font-black">{formatINR(drilledTotal)}</span>
              <span className="text-[#5F6368] font-medium ml-1.5">
                ({drilledExpenses.length} {drilledExpenses.length === 1 ? "item" : "items"})
              </span>
            </div>
          </div>
        </div>

        {/* Search & Sort Toolbar for Drill-down */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-1">
          {/* Search Box */}
          <div className="sm:col-span-8 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868B]"
            />
            <input
              type="text"
              id="input-drill-search"
              value={drillSearchQuery}
              onChange={(e) => setDrillSearchQuery(e.target.value)}
              placeholder={
                selectedCategory
                  ? `Search in ${selectedCategory} (title, shop, note)...`
                  : "Search transactions (title, category, merchant)..."
              }
              className="w-full pl-9 pr-8 py-2 bg-[#F8F9FA] border border-[#E8EAED] focus:border-[#1A73E8] focus:bg-white rounded-xl text-xs text-[#202124] placeholder-[#80868B] outline-none transition-all"
            />
            {drillSearchQuery && (
              <button
                type="button"
                onClick={() => setDrillSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#80868B] hover:text-[#202124] p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="sm:col-span-4 flex items-center gap-2">
            <ArrowUpDown size={14} className="text-[#5F6368] shrink-0" />
            <select
              id="select-drill-sort"
              value={drillSortBy}
              onChange={(e) => setDrillSortBy(e.target.value as any)}
              className="w-full py-2 px-2.5 bg-[#F8F9FA] border border-[#E8EAED] focus:border-[#1A73E8] rounded-xl text-xs font-semibold text-[#202124] outline-none cursor-pointer"
            >
              <option value="date-desc">Newest Date First</option>
              <option value="date-asc">Oldest Date First</option>
              <option value="amt-desc">Highest Amount (₹)</option>
              <option value="amt-asc">Lowest Amount (₹)</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="mt-4 space-y-2.5">
          {drilledExpenses.length === 0 ? (
            <div className="bg-[#F8F9FA] rounded-2xl p-8 text-center border border-[#E8EAED]">
              <div className="w-12 h-12 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto mb-2">
                <FileText size={22} />
              </div>
              <h4 className="text-sm font-bold text-[#202124]">
                {selectedCategory
                  ? `No transactions in ${selectedCategory}`
                  : "No transactions found"}
              </h4>
              <p className="text-xs text-[#5F6368] mt-1 max-w-sm mx-auto">
                {drillSearchQuery
                  ? `No results match "${drillSearchQuery}". Try clearing your search keyword.`
                  : "There are no recorded expenses matching the current filter and date range."}
              </p>
              {(drillSearchQuery || selectedCategory) && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {drillSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDrillSearchQuery("")}
                      className="px-3 py-1.5 bg-white border border-[#DADCE0] hover:bg-[#F1F3F4] text-xs font-semibold text-[#3C4043] rounded-full cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="px-3 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-full cursor-pointer"
                    >
                      Show All Categories
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {drilledExpenses.map((expense) => {
                const catMeta = CATEGORIES_DATA[expense.category as ExpenseCategory] || {
                  color: "#1A73E8",
                  bgColor: "#E8F0FE",
                };

                return (
                  <div
                    key={expense.id}
                    id={`drill-expense-item-${expense.id}`}
                    className="bg-[#F8F9FA] hover:bg-white p-3.5 rounded-2xl border border-[#E8EAED] hover:border-[#D2E3FC] hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Icon & Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: catMeta.bgColor }}
                      >
                        <CategoryIcon category={expense.category as ExpenseCategory} size={18} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-[#202124] truncate max-w-xs">
                            {expense.title}
                          </h4>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: catMeta.bgColor,
                              color: catMeta.color,
                            }}
                          >
                            {expense.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-[#DADCE0] text-[#5F6368]">
                            {expense.paymentMode}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#5F6368] flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar size={12} className="text-[#80868B]" />
                            {formatFriendlyDate(expense.date)}
                          </span>

                          {expense.merchantOrLocation && (
                            <span className="flex items-center gap-1 text-[#3C4043] font-medium">
                              <MapPin size={12} className="text-[#EA4335]" />
                              {expense.merchantOrLocation}
                            </span>
                          )}

                          {expense.notes && (
                            <span className="text-[#70757A] truncate max-w-[200px]" title={expense.notes}>
                              💬 {expense.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8EAED]">
                      <div className="text-left sm:text-right">
                        <span className="text-sm sm:text-base font-black text-[#202124] block">
                          {formatINR(expense.amount)}
                        </span>
                        <span className="text-[10px] text-[#5F6368] block">
                          {selectedCategory && totalSpent > 0
                            ? `${((expense.amount / totalSpent) * 100).toFixed(1)}% of total`
                            : "Recorded expense"}
                        </span>
                      </div>

                      {(onEditExpense || onDeleteExpense) && (
                        <div className="flex items-center gap-1">
                          {onEditExpense && (
                            <button
                              type="button"
                              id={`btn-drill-edit-${expense.id}`}
                              onClick={() => onEditExpense(expense)}
                              className="p-1.5 text-[#5F6368] hover:text-[#1A73E8] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#DADCE0] cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {onDeleteExpense && (
                            <button
                              type="button"
                              id={`btn-drill-delete-${expense.id}`}
                              onClick={() => onDeleteExpense(expense.id)}
                              className="p-1.5 text-[#5F6368] hover:text-[#EA4335] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#DADCE0] cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Period Spending Velocity Bar Chart */}
      <div className="bg-white rounded-2xl border border-[#E8EAED] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F1F3F4] pb-3 mb-4 gap-2">
          <div>
            <h3 className="font-bold text-sm text-[#202124] flex items-center gap-1.5">
              <TrendingUp size={16} className="text-[#1A73E8]" />
              <span>Spending Velocity Timeline</span>
            </h3>
            <p className="text-[11px] text-[#5F6368]">
              Daily expenditure pattern for {formatToDDMMYY(dateRange.startDate)} 📅 ~ {formatToDDMMYY(dateRange.endDate)} 📅
            </p>
          </div>

          <span className="text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] px-2.5 py-1 rounded-full self-start sm:self-auto">
            {dateRange.label || "Custom Timeline"}
          </span>
        </div>

        {dailyTrendData.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-xs text-[#5F6368]">
            No transaction records found for this period range.
          </div>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F4" />
                <XAxis dataKey="date" stroke="#5F6368" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#5F6368"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => formatINR(val, true)}
                />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    formatINR(Number(value)),
                    item?.payload?.fullDate ? `Date: ${item.payload.fullDate}` : "Spent",
                  ]}
                  contentStyle={{
                    backgroundColor: "#1E1F24",
                    borderRadius: "12px",
                    border: "1px solid #3A3D46",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="amount" fill="#1A73E8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
