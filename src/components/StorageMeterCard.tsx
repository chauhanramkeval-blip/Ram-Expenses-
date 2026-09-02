import React from "react";
import { Plus, PieChart, Sparkles, AlertCircle, ArrowUpRight, CheckCircle2, FileText } from "lucide-react";
import { formatINR } from "../utils/formatters";
import { CATEGORIES_DATA } from "../data/categories";
import { Expense } from "../types";

interface StorageMeterCardProps {
  expenses: Expense[];
  monthlyBudget: number;
  onOpenAddExpense: () => void;
  onOpenPdfReportModal: () => void;
  onNavigateToVisuals: () => void;
  onNavigateToAdvisor: () => void;
}

export const StorageMeterCard: React.FC<StorageMeterCardProps> = ({
  expenses,
  monthlyBudget,
  onOpenAddExpense,
  onOpenPdfReportModal,
  onNavigateToVisuals,
  onNavigateToAdvisor,
}) => {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = Math.max(0, monthlyBudget - totalSpent);
  const percentUsed = Math.min(100, Math.round((totalSpent / (monthlyBudget || 1)) * 100));

  // Category breakdown for the segmented multi-color bar
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Remaining days in the month to calculate safe daily spend
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const safeDailySpend = Math.round(remaining / daysLeft);

  const isOverBudget = totalSpent > monthlyBudget;

  return (
    <div
      id="khata-storage-meter-card"
      className="bg-white rounded-2xl border border-[#E8EAED] p-5 shadow-xs transition-all hover:shadow-sm mb-6"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1A73E8]"></span>
            Monthly Expense Meter
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124]">
              {formatINR(totalSpent)}
            </h2>
            <span className="text-sm text-[#5F6368] font-medium">
              spent of {formatINR(monthlyBudget)} limit
            </span>
          </div>
        </div>

        {/* Health Status pill */}
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
              isOverBudget
                ? "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]"
                : percentUsed > 80
                ? "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]"
                : "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]"
            }`}
          >
            {isOverBudget ? (
              <>
                <AlertCircle size={13} />
                <span>Over Budget</span>
              </>
            ) : percentUsed > 80 ? (
              <>
                <AlertCircle size={13} />
                <span>{percentUsed}% Used</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                <span>On Track ({percentUsed}%)</span>
              </>
            )}
          </span>
          <p className="text-[11px] text-[#5F6368] mt-1">
            {isOverBudget
              ? `Exceeded by ${formatINR(totalSpent - monthlyBudget)}`
              : `${formatINR(remaining)} remaining`}
          </p>
        </div>
      </div>

      {/* Google Files Multi-Segmented Progress Bar */}
      <div className="mt-4">
        <div className="h-3.5 w-full bg-[#F1F3F4] rounded-full overflow-hidden flex p-0.5 gap-0.5">
          {sortedCategories.map(([cat, amount]) => {
            const catMeta = CATEGORIES_DATA[cat as keyof typeof CATEGORIES_DATA] || {
              color: "#5F6368",
            };
            const widthPct = Math.max(1.5, (amount / (monthlyBudget || 1)) * 100);
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-[#5F6368]">
          {sortedCategories.map(([cat, amount]) => {
            const catMeta = CATEGORIES_DATA[cat as keyof typeof CATEGORIES_DATA] || {
              color: "#5F6368",
            };
            return (
              <div key={cat} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: catMeta.color }}
                />
                <span className="font-medium text-[#3C4043]">{cat}</span>
                <span className="text-[#70757A]">({formatINR(amount, true)})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safe Daily Spend & Quick Action Badges */}
      <div className="mt-4 pt-3.5 border-t border-[#F1F3F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#5F6368] flex items-center gap-2">
          <span className="font-semibold text-[#202124] bg-[#F8F9FA] px-2.5 py-1 rounded-md border border-[#E8EAED]">
            💡 Daily Safe Spend: <span className="text-[#1A73E8] font-bold">{formatINR(safeDailySpend)}/day</span>
          </span>
          <span className="text-[11px] hidden md:inline">({daysLeft} days remaining in month)</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            id="btn-meter-pdf-report"
            onClick={onOpenPdfReportModal}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#EA4335] bg-[#FCE8E6] hover:bg-[#FAD2CF] transition-colors cursor-pointer"
          >
            <FileText size={13} />
            <span>PDF Summary</span>
          </button>

          <button
            id="btn-meter-visuals"
            onClick={onNavigateToVisuals}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] transition-colors cursor-pointer"
          >
            <PieChart size={13} />
            <span>Pie Chart</span>
          </button>

          <button
            id="btn-meter-advisor"
            onClick={onNavigateToAdvisor}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#B06000] bg-[#FEF7E0] hover:bg-[#FEEFC3] transition-colors cursor-pointer"
          >
            <Sparkles size={13} />
            <span>AI Advice</span>
          </button>

          <button
            id="btn-meter-add-expense"
            onClick={onOpenAddExpense}
            className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-[#1A73E8] hover:bg-[#1557B0] transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Add Spend</span>
          </button>
        </div>
      </div>
    </div>
  );
};
