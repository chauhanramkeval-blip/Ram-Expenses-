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
} from "lucide-react";
import { Expense, ExpenseCategory } from "../types";
import { CATEGORIES_DATA } from "../data/categories";
import { formatINR } from "../utils/formatters";
import { CategoryIcon } from "./CategoryIcon";
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
}

export const VisualizationView: React.FC<VisualizationViewProps> = ({
  expenses,
  monthlyBudget,
  onNavigateToAdvisor,
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

    // If single day or invalid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return [];
    }

    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    // Populate dates list
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
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="khata-visualization-page" className="space-y-6 animate-fadeIn">
      {/* 1. NEW VISUAL CARD: Month-over-Month Spending Progress Card */}
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
                You made {topCategory.count} transactions in {topCategory.name}. Tracking these
                micro-expenses will yield the quickest monthly savings.
              </p>
            </div>
          </div>

          <button
            id="btn-trigger-ai-audit"
            onClick={onNavigateToAdvisor}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Ask AI Advice</span>
          </button>
        </div>
      )}

      {/* 3. Control Bar: Modern Dark Date Range & Period Filter + Chart Style Toggle */}
      <div className="bg-white rounded-2xl border border-[#E8EAED] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Date Range & Period Filter Component (Dark theme with DD/MM/YY 📅 ~ DD/MM/YY 📅 and Period ⌵) */}
        <div className="flex items-center gap-2 flex-wrap">
          <DatePeriodFilter
            value={dateRange}
            onChange={setDateRange}
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
        {/* Left Column: Interactive Recharts Pie Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8EAED] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                  <PieChart size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#202124]">Category Expense Distribution</h3>
                  <p className="text-[11px] text-[#5F6368]">
                    {categoryStats.length} active spending categories
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#1A73E8] bg-[#E8F0FE] px-2.5 py-1 rounded-full">
                Total: {formatINR(totalSpent)}
              </span>
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
                      onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                      onMouseLeave={() => setActiveCategoryIndex(null)}
                    >
                      {categoryStats.map((entry, index) => {
                        const meta =
                          CATEGORIES_DATA[entry.name as ExpenseCategory] || { color: "#1A73E8" };
                        const isHovered = activeCategoryIndex === index;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={meta.color}
                            stroke="#ffffff"
                            strokeWidth={2}
                            opacity={
                              activeCategoryIndex === null || isHovered ? 1 : 0.65
                            }
                            className="transition-opacity cursor-pointer outline-none"
                          />
                        );
                      })}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>

                {/* Center text for Donut mode */}
                {chartType === "donut" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[11px] font-semibold text-[#5F6368]">Total Spent</span>
                    <span className="text-lg font-bold text-[#202124]">{formatINR(totalSpent)}</span>
                    <span className="text-[10px] text-[#1E8E3E] font-bold">
                      {filteredExpenses.length} Spends
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mini Category Chips below chart */}
          <div className="pt-3 border-t border-[#F1F3F4] flex flex-wrap gap-2 text-xs">
            {categoryStats.slice(0, 6).map((cat, idx) => {
              const meta = CATEGORIES_DATA[cat.name as ExpenseCategory] || { color: "#1A73E8" };
              const pct = totalSpent > 0 ? Math.round((cat.value / totalSpent) * 100) : 0;
              return (
                <div
                  key={cat.name}
                  onMouseEnter={() => setActiveCategoryIndex(idx)}
                  onMouseLeave={() => setActiveCategoryIndex(null)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F9FA] border border-[#E8EAED] cursor-pointer hover:bg-[#E8F0FE] transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="font-semibold text-[#202124]">{cat.name}</span>
                  <span className="text-[#5F6368]">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Category Breakdown list (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8EAED] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-3">
              <h3 className="font-bold text-sm text-[#202124] flex items-center gap-1.5">
                <span>Ranked Category Spends</span>
              </h3>
              <span className="text-xs text-[#5F6368] font-medium">% Share</span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {categoryStats.map((item, index) => {
                const meta = CATEGORIES_DATA[item.name as ExpenseCategory] || {
                  color: "#1A73E8",
                  bgColor: "#E8F0FE",
                };
                const percent = totalSpent > 0 ? Math.round((item.value / totalSpent) * 100) : 0;
                const avgSpend = Math.round(item.value / (item.count || 1));

                return (
                  <div
                    key={item.name}
                    id={`cat-stat-${item.name.replace(/\s+/g, "-").toLowerCase()}`}
                    className="p-2.5 rounded-xl hover:bg-[#F8F9FA] transition-colors border border-transparent hover:border-[#E8EAED]"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#5F6368] w-4">{index + 1}.</span>
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: meta.bgColor }}
                        >
                          <CategoryIcon category={item.name as ExpenseCategory} size={12} />
                        </div>
                        <span className="font-semibold text-[#202124]">{item.name}</span>
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

      {/* 5. Period Spending Velocity Bar Chart */}
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
