import React, { useMemo } from "react";
import {
  Plus,
  PieChart,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  TrendingDown,
  Calendar,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Table2,
} from "lucide-react";
import { formatINR } from "../utils/formatters";
import { CATEGORIES_DATA } from "../data/categories";
import { Expense } from "../types";

interface StorageMeterCardProps {
  expenses: Expense[];
  monthlyBudget: number;
  onOpenAddExpense: () => void;
  onOpenPdfReportModal?: () => void;
  onNavigateToVisuals?: () => void;
  onNavigateToAdvisor?: () => void;
}

export const StorageMeterCard: React.FC<StorageMeterCardProps> = ({
  expenses,
  monthlyBudget,
  onOpenAddExpense,
  onOpenPdfReportModal,
  onNavigateToVisuals,
  onNavigateToAdvisor,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - currentDay + 1);
  const monthProgressPct = Math.round((currentDay / daysInMonth) * 100);

  // Month name formatting
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const currentMonthName = monthNames[currentMonth];

  // 1. Current Month's Expenses
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [expenses, currentYear, currentMonth]);

  // Total spent in current month
  const totalSpent = useMemo(() => {
    return currentMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [currentMonthExpenses]);

  // Safe budget limit
  const safeBudget = monthlyBudget > 0 ? monthlyBudget : 25000;
  const remaining = Math.max(0, safeBudget - totalSpent);
  const percentUsedExact = (totalSpent / safeBudget) * 100;
  const percentUsed = Math.round(percentUsedExact);
  const clampedProgressPercent = Math.min(100, percentUsedExact);
  const isOverBudget = totalSpent > safeBudget;
  const overSpentAmount = Math.max(0, totalSpent - safeBudget);
  const safeDailySpend = Math.max(0, Math.round(remaining / daysLeft));

  // Category breakdown for the secondary segmented distribution
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [currentMonthExpenses]);

  // Financial Health Status Computation
  const healthStatus = useMemo(() => {
    if (isOverBudget) {
      return {
        level: "danger",
        title: "Budget Exceeded",
        badge: "Over Budget",
        color: "#D93025",
        bgBadge: "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]",
        barGradient: "from-[#EA4335] via-[#D93025] to-[#B31412]",
        barColor: "#EA4335",
        icon: AlertCircle,
        advice: `Exceeded by ${formatINR(overSpentAmount)}. Pause non-essential spends.`,
      };
    }

    if (percentUsedExact >= 90) {
      return {
        level: "critical",
        title: "Near Limit",
        badge: "Critical (90%+)",
        color: "#D93025",
        bgBadge: "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]",
        barGradient: "from-[#FBBC04] via-[#EA8600] to-[#D93025]",
        barColor: "#EA8600",
        icon: AlertTriangle,
        advice: `Only ${formatINR(remaining)} left for the next ${daysLeft} days.`,
      };
    }

    if (percentUsedExact >= 75) {
      return {
        level: "warning",
        title: "Moderate Caution",
        badge: "Caution (75%+)",
        color: "#B06000",
        bgBadge: "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]",
        barGradient: "from-[#1A73E8] via-[#FBBC04] to-[#F29900]",
        barColor: "#FBBC04",
        icon: Flame,
        advice: `Safe spend pace: ${formatINR(safeDailySpend)}/day to stay within limits.`,
      };
    }

    if (percentUsedExact <= monthProgressPct + 5) {
      return {
        level: "excellent",
        title: "Optimal Pace",
        badge: "Healthy Pace",
        color: "#137333",
        bgBadge: "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]",
        barGradient: "from-[#34A853] via-[#0F9D58] to-[#137333]",
        barColor: "#0F9D58",
        icon: ShieldCheck,
        advice: `Spending is well below target pace. Safe daily allowance: ${formatINR(safeDailySpend)}/day.`,
      };
    }

    return {
      level: "normal",
      title: "On Track",
      badge: "On Track",
      color: "#1A73E8",
      bgBadge: "bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]",
      barGradient: "from-[#4285F4] via-[#1A73E8] to-[#1557B0]",
      barColor: "#1A73E8",
      icon: CheckCircle2,
      advice: `Well managed. ${formatINR(remaining)} remaining for ${daysLeft} days.`,
    };
  }, [
    isOverBudget,
    percentUsedExact,
    overSpentAmount,
    remaining,
    daysLeft,
    safeDailySpend,
    monthProgressPct,
  ]);

  const StatusIcon = healthStatus.icon;

  return (
    <div
      id="khata-storage-meter-card"
      className="bg-white rounded-3xl border border-[#E8EAED] p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm mb-5"
    >
      {/* 1. Header Row with Metric & Health Badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
              {currentMonthName} {currentYear} • Expense vs Budget
            </span>
          </div>

          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <h2
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isOverBudget ? "text-[#D93025]" : "text-[#202124]"
              }`}
            >
              {formatINR(totalSpent)}
            </h2>
            <span className="text-sm text-[#5F6368] font-medium">
              spent of <strong className="text-[#202124]">{formatINR(safeBudget)}</strong> budget
            </span>
          </div>
        </div>

        {/* Financial Health Status Badge */}
        <div className="flex items-center sm:flex-col sm:items-end gap-2 sm:gap-1">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${healthStatus.bgBadge}`}
          >
            <StatusIcon size={14} />
            <span>{healthStatus.badge}</span>
            <span className="opacity-80">({percentUsed}%)</span>
          </span>

          <p className="text-[11px] font-medium text-[#5F6368]">
            {isOverBudget
              ? `Exceeded by +${formatINR(overSpentAmount)}`
              : `${formatINR(remaining)} remaining`}
          </p>
        </div>
      </div>

      {/* 2. DEDICATED VISUAL PROGRESS BAR (Spending vs Defined Budget) */}
      <div className="mt-4 pt-1">
        {/* Progress Bar Label & Milestone Ticks */}
        <div className="flex items-center justify-between text-[11px] font-bold text-[#5F6368] mb-1.5 px-0.5">
          <div className="flex items-center gap-1">
            <Wallet size={13} className="text-[#1A73E8]" />
            <span>Monthly Budget Utilization</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={isOverBudget ? "text-[#D93025] font-black" : "text-[#202124]"}>
              {percentUsed}% Utilized
            </span>
            <span className="text-[#80868B] font-normal">|</span>
            <span className="text-[#202124]">{formatINR(safeBudget)} Target</span>
          </div>
        </div>

        {/* The Main Dual-Layer Progress Track */}
        <div
          className="relative w-full h-4 sm:h-5 bg-[#F1F3F4] rounded-full overflow-hidden p-0.5 border border-[#E8EAED] shadow-inner"
          title={`Spent: ${formatINR(totalSpent)} of ${formatINR(safeBudget)} (${percentUsed}%)`}
        >
          {/* Calendar Month Progress Pace Marker (Subtle Background Guide) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#5F6368]/30 z-10 pointer-events-none"
            style={{ left: `${Math.min(100, monthProgressPct)}%` }}
            title={`Today (Day ${currentDay}/${daysInMonth}): Expected target pace ${monthProgressPct}%`}
          />

          {/* Budget Milestone Notch Markers (25%, 50%, 75%) */}
          <div
            className="absolute top-0 bottom-0 w-px bg-white/70 z-10 pointer-events-none"
            style={{ left: "25%" }}
          />
          <div
            className="absolute top-0 bottom-0 w-px bg-white/70 z-10 pointer-events-none"
            style={{ left: "50%" }}
          />
          <div
            className="absolute top-0 bottom-0 w-px bg-white/70 z-10 pointer-events-none"
            style={{ left: "75%" }}
          />

          {/* Active Spending Fill Bar */}
          <div
            className={`h-full rounded-full bg-gradient-to-r ${healthStatus.barGradient} transition-all duration-700 ease-out flex items-center justify-end pr-1.5 shadow-xs`}
            style={{ width: `${clampedProgressPercent}%` }}
          >
            {clampedProgressPercent > 18 && (
              <span className="text-[10px] font-black text-white drop-shadow-xs select-none">
                {percentUsed}%
              </span>
            )}
          </div>

          {/* Over-budget Striped Overflow Segment if Exceeded */}
          {isOverBudget && (
            <div
              className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(217,48,37,0.25)_6px,rgba(217,48,37,0.25)_12px)] pointer-events-none animate-pulse rounded-full"
            />
          )}
        </div>

        {/* Milestone Labels below the Track */}
        <div className="flex justify-between items-center text-[10px] font-semibold text-[#80868B] mt-1 px-1">
          <span>₹0</span>
          <span className="hidden xs:inline">25%</span>
          <span>50% ({formatINR(safeBudget * 0.5, true)})</span>
          <span className="hidden xs:inline">75%</span>
          <span className="font-bold text-[#202124]">100% ({formatINR(safeBudget, true)})</span>
        </div>
      </div>

      {/* 3. AT-A-GLANCE FINANCIAL HEALTH METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-[#F1F3F4]">
        {/* Spent Amount */}
        <div className="bg-[#F8F9FA] rounded-xl p-2.5 border border-[#E8EAED]/70">
          <div className="text-[10px] font-bold text-[#5F6368] uppercase flex items-center gap-1">
            <TrendingDown size={11} className="text-[#EA4335]" />
            <span>Spent</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-[#202124] mt-0.5">
            {formatINR(totalSpent)}
          </div>
          <p className="text-[10px] text-[#5F6368] mt-0.5">
            {currentMonthExpenses.length} transaction{currentMonthExpenses.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* Remaining Balance */}
        <div className="bg-[#F8F9FA] rounded-xl p-2.5 border border-[#E8EAED]/70">
          <div className="text-[10px] font-bold text-[#5F6368] uppercase flex items-center gap-1">
            <Wallet size={11} className="text-[#1A73E8]" />
            <span>Remaining</span>
          </div>
          <div
            className={`text-xs sm:text-sm font-black mt-0.5 ${
              isOverBudget ? "text-[#D93025]" : "text-[#137333]"
            }`}
          >
            {isOverBudget ? `-${formatINR(overSpentAmount)}` : formatINR(remaining)}
          </div>
          <p className="text-[10px] text-[#5F6368] mt-0.5">
            {isOverBudget ? "Budget limit exceeded" : `${100 - percentUsed}% of limit left`}
          </p>
        </div>

        {/* Daily Safe Spend Allowance */}
        <div className="bg-[#F8F9FA] rounded-xl p-2.5 border border-[#E8EAED]/70">
          <div className="text-[10px] font-bold text-[#5F6368] uppercase flex items-center gap-1">
            <Sparkles size={11} className="text-[#F9AB00]" />
            <span>Safe Daily Burn</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-[#1A73E8] mt-0.5">
            {formatINR(safeDailySpend)}
            <span className="text-[10px] font-normal text-[#5F6368]">/day</span>
          </div>
          <p className="text-[10px] text-[#5F6368] mt-0.5">
            For {daysLeft} remaining day{daysLeft === 1 ? "" : "s"}
          </p>
        </div>

        {/* Month Calendar Pace */}
        <div className="bg-[#F8F9FA] rounded-xl p-2.5 border border-[#E8EAED]/70">
          <div className="text-[10px] font-bold text-[#5F6368] uppercase flex items-center gap-1">
            <Calendar size={11} className="text-[#5F6368]" />
            <span>Month Elapsed</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-[#202124] mt-0.5">
            Day {currentDay} of {daysInMonth}
          </div>
          <p className="text-[10px] text-[#5F6368] mt-0.5">
            {monthProgressPct}% of month passed
          </p>
        </div>
      </div>

      {/* 4. Google Drive Style Category Spend Distribution Sub-Bar */}
      {categoryTotals.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-[#F1F3F4]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#5F6368] mb-1.5">
            <span>Category Spending Breakdown</span>
            <span>Top {categoryTotals.length} Categories</span>
          </div>

          <div className="h-2 w-full bg-[#F1F3F4] rounded-full overflow-hidden flex p-0.2 gap-0.5">
            {categoryTotals.map(([cat, amount]) => {
              const catMeta = CATEGORIES_DATA[cat as keyof typeof CATEGORIES_DATA] || {
                color: "#5F6368",
              };
              const widthPct = Math.max(2, (amount / (safeBudget || 1)) * 100);
              return (
                <div
                  key={cat}
                  title={`${cat}: ${formatINR(amount)}`}
                  className="h-full rounded-sm transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: catMeta.color,
                  }}
                />
              );
            })}
          </div>

          {/* Category Legend with Google Color Dots */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-2 text-[11px] text-[#5F6368]">
            {categoryTotals.map(([cat, amount]) => {
              const catMeta = CATEGORIES_DATA[cat as keyof typeof CATEGORIES_DATA] || {
                color: "#5F6368",
              };
              return (
                <div key={cat} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: catMeta.color }}
                  />
                  <span className="font-medium text-[#3C4043]">{cat}</span>
                  <span className="text-[#70757A]">({formatINR(amount, true)})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Health Advice & Quick Actions Row */}
      <div className="mt-4 pt-3.5 border-t border-[#F1F3F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#3C4043] flex items-center gap-2">
          <span className="font-medium">💡 {healthStatus.advice}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {onOpenPdfReportModal && (
            <button
              type="button"
              id="btn-meter-pdf-report"
              onClick={onOpenPdfReportModal}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#EA4335] bg-[#FCE8E6] hover:bg-[#FAD2CF] transition-colors cursor-pointer"
            >
              <FileText size={13} />
              <span>PDF Summary</span>
            </button>
          )}

          {onNavigateToVisuals && (
            <button
              type="button"
              id="btn-meter-visuals"
              onClick={onNavigateToVisuals}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] transition-colors cursor-pointer"
            >
              <PieChart size={13} />
              <span>Pie Chart</span>
            </button>
          )}

          {onNavigateToAdvisor && (
            <button
              type="button"
              id="btn-meter-statement"
              onClick={onNavigateToAdvisor}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] transition-colors cursor-pointer"
            >
              <Table2 size={13} />
              <span>Monthly Table</span>
            </button>
          )}

          <button
            type="button"
            id="btn-meter-add-expense"
            onClick={onOpenAddExpense}
            className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Add Spend</span>
          </button>
        </div>
      </div>
    </div>
  );
};

