import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart as RechartsAreaChart,
  Area,
  Legend as RechartsLegend,
} from "recharts";
import {
  PieChart,
  BarChart3,
  TrendingUp,
  LineChart,
  CreditCard,
  Briefcase,
  Zap,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Sparkles,
  Download,
  Building2,
  X,
  ChevronRight,
  Plus,
  Coins,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { Income, Expense, IncomeCategoryMeta } from "../types";
import { formatINR, formatFriendlyDate } from "../utils/formatters";
import { resolveIncomeMeta, IncomeIcon } from "./CategoryIcon";
import { exportTransactionsToExcel } from "../utils/export";

interface IncomeChartsSectionProps {
  incomes: Income[];
  expenses: Expense[];
  customIncomeCategories?: IncomeCategoryMeta[];
  onOpenAddIncome?: () => void;
  onOpenCategoryManager?: () => void;
}

type ChartViewType =
  | "category-donut"
  | "cashflow-bar"
  | "trend-area"
  | "payment-channels"
  | "stream-ratio";

type TimeRangePreset =
  | "this-month"
  | "last-3-months"
  | "last-6-months"
  | "this-year"
  | "all-time";

const PALETTE = [
  "#0F9D58", // Emerald Green
  "#1A73E8", // Google Blue
  "#F9AB00", // Warm Amber
  "#9334E6", // Purple
  "#0097A7", // Teal
  "#E37400", // Deep Orange
  "#D93025", // Crimson
  "#12B5CB", // Cyan
  "#673AB7", // Deep Purple
  "#8E24AA", // Magenta
  "#43A047", // Grass Green
  "#3949AB", // Indigo
];

const SALARY_CATEGORIES = new Set([
  "Salary / Wages",
  "Bonus & Incentives",
  "Monthly Stipend",
  "Salary",
  "Bonus",
]);

export const IncomeChartsSection: React.FC<IncomeChartsSectionProps> = ({
  incomes,
  expenses,
  customIncomeCategories,
  onOpenAddIncome,
  onOpenCategoryManager,
}) => {
  const [chartType, setChartType] = useState<ChartViewType>("category-donut");
  const [timeRange, setTimeRange] = useState<TimeRangePreset>("this-month");
  const [pieSubtype, setPieSubtype] = useState<"donut" | "pie">("donut");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [exportingCategory, setExportingCategory] = useState(false);

  const now = new Date();

  // Filter Data by Timeframe
  const { filteredIncomes, filteredExpenses, periodLabel } = useMemo(() => {
    let startLimit: Date | null = null;
    let endLimit: Date = new Date();
    let label = "This Month";

    if (timeRange === "this-month") {
      startLimit = new Date(now.getFullYear(), now.getMonth(), 1);
      label = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
    } else if (timeRange === "last-3-months") {
      startLimit = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      label = "Last 3 Months";
    } else if (timeRange === "last-6-months") {
      startLimit = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      label = "Last 6 Months";
    } else if (timeRange === "this-year") {
      startLimit = new Date(now.getFullYear(), 0, 1);
      label = `Year ${now.getFullYear()}`;
    } else if (timeRange === "all-time") {
      startLimit = null;
      label = "All Time History";
    }

    const incs = incomes.filter((item) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      if (isNaN(d.getTime())) return false;
      if (startLimit && d < startLimit) return false;
      if (d > endLimit) return false;
      return true;
    });

    const exps = expenses.filter((item) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      if (isNaN(d.getTime())) return false;
      if (startLimit && d < startLimit) return false;
      if (d > endLimit) return false;
      return true;
    });

    return {
      filteredIncomes: incs,
      filteredExpenses: exps,
      periodLabel: label,
    };
  }, [incomes, expenses, timeRange]);

  // Overall Financial KPIs for the selected timeframe
  const kpis = useMemo(() => {
    const totalInflow = filteredIncomes.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const totalOutflow = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const netCashflow = totalInflow - totalOutflow;
    const savingsRate =
      totalInflow > 0 ? Math.max(0, Math.round((netCashflow / totalInflow) * 100)) : 0;
    const avgPerReceipt = filteredIncomes.length > 0 ? Math.round(totalInflow / filteredIncomes.length) : 0;

    return {
      totalInflow,
      totalOutflow,
      netCashflow,
      savingsRate,
      avgPerReceipt,
      count: filteredIncomes.length,
    };
  }, [filteredIncomes, filteredExpenses]);

  // 1. Category Breakdown Data
  const categoryData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filteredIncomes.forEach((i) => {
      const cat = i.category || "General Income";
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += Number(i.amount) || 0;
      map[cat].count += 1;
    });

    const items = Object.entries(map)
      .map(([name, stats], idx) => {
        const meta = resolveIncomeMeta(name, customIncomeCategories);
        const percent = kpis.totalInflow > 0 ? (stats.total / kpis.totalInflow) * 100 : 0;
        return {
          name,
          value: stats.total,
          count: stats.count,
          percent: Number(percent.toFixed(1)),
          color: meta.color || PALETTE[idx % PALETTE.length],
          bgColor: meta.bgColor || "#E6F4EA",
          iconName: meta.iconName,
        };
      })
      .sort((a, b) => b.value - a.value);

    return items;
  }, [filteredIncomes, kpis.totalInflow, customIncomeCategories]);

  // Top Category
  const topCategory = categoryData[0] || null;

  // 2. Month-by-Month Cashflow Comparison Data (Last 6 months or 12 months)
  const cashflowComparisonData = useMemo(() => {
    const monthsMap: Record<
      string,
      { monthKey: string; label: string; income: number; expense: number; net: number; order: number }
    > = {};

    const numberOfMonths = timeRange === "this-year" ? 12 : timeRange === "all-time" ? 12 : 6;
    for (let i = numberOfMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-IN", { month: "short" });
      monthsMap[key] = {
        monthKey: key,
        label,
        income: 0,
        expense: 0,
        net: 0,
        order: d.getTime(),
      };
    }

    filteredIncomes.forEach((i) => {
      const d = new Date(i.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthsMap[key]) {
        monthsMap[key].income += Number(i.amount) || 0;
      }
    });

    filteredExpenses.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthsMap[key]) {
        monthsMap[key].expense += Number(e.amount) || 0;
      }
    });

    return Object.values(monthsMap)
      .sort((a, b) => a.order - b.order)
      .map((m) => ({
        name: m.label,
        monthKey: m.monthKey,
        Income: m.income,
        Expenses: m.expense,
        NetSavings: m.income - m.expense,
        savingsRate: m.income > 0 ? Math.max(0, Math.round(((m.income - m.expense) / m.income) * 100)) : 0,
      }));
  }, [filteredIncomes, filteredExpenses, timeRange]);

  // 3. Timeline / Inflow Velocity Trend Data
  const trendData = useMemo(() => {
    // If 'this-month', group by day of month. Otherwise group by month/week.
    if (timeRange === "this-month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayMap: Record<number, number> = {};
      for (let d = 1; d <= daysInMonth; d++) dayMap[d] = 0;

      filteredIncomes.forEach((i) => {
        const d = new Date(i.date);
        const dayNum = d.getDate();
        if (dayMap[dayNum] !== undefined) {
          dayMap[dayNum] += Number(i.amount) || 0;
        }
      });

      let cumulative = 0;
      return Object.entries(dayMap).map(([day, amt]) => {
        cumulative += amt;
        return {
          label: `${day} ${now.toLocaleString("en-IN", { month: "short" })}`,
          dailyInflow: amt,
          cumulative,
        };
      });
    }

    // For multi-month views: group by month
    return cashflowComparisonData.map((m) => ({
      label: m.name,
      dailyInflow: m.Income,
      cumulative: m.Income,
    }));
  }, [filteredIncomes, timeRange, cashflowComparisonData]);

  // 4. Payment / Deposit Modes Distribution
  const depositModesData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filteredIncomes.forEach((i) => {
      const mode = i.paymentMode || "Bank Transfer";
      if (!map[mode]) map[mode] = { total: 0, count: 0 };
      map[mode].total += Number(i.amount) || 0;
      map[mode].count += 1;
    });

    const colors: Record<string, string> = {
      "Bank Transfer": "#1A73E8",
      UPI: "#0F9D58",
      "Net Banking": "#9334E6",
      Cash: "#F9AB00",
      Cheque: "#E37400",
      "Debit / Credit Card": "#0097A7",
    };

    return Object.entries(map)
      .map(([mode, stats]) => ({
        name: mode,
        value: stats.total,
        count: stats.count,
        percent: kpis.totalInflow > 0 ? Number(((stats.total / kpis.totalInflow) * 100).toFixed(1)) : 0,
        color: colors[mode] || "#5F6368",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredIncomes, kpis.totalInflow]);

  // 5. Salary vs Extra Income Stream Ratio
  const streamRatioData = useMemo(() => {
    let salaryTotal = 0;
    let salaryCount = 0;
    let extraTotal = 0;
    let extraCount = 0;

    filteredIncomes.forEach((i) => {
      const isSalary =
        SALARY_CATEGORIES.has(i.category) ||
        i.category.toLowerCase().includes("salary") ||
        i.category.toLowerCase().includes("bonus");

      if (isSalary) {
        salaryTotal += Number(i.amount) || 0;
        salaryCount += 1;
      } else {
        extraTotal += Number(i.amount) || 0;
        extraCount += 1;
      }
    });

    const salaryPct = kpis.totalInflow > 0 ? Math.round((salaryTotal / kpis.totalInflow) * 100) : 0;
    const extraPct = kpis.totalInflow > 0 ? 100 - salaryPct : 0;

    return {
      salaryTotal,
      salaryCount,
      salaryPct,
      extraTotal,
      extraCount,
      extraPct,
      chartData: [
        { name: "Salary & Wages", value: salaryTotal, count: salaryCount, color: "#0F9D58" },
        { name: "Extra & Passive", value: extraTotal, count: extraCount, color: "#F9AB00" },
      ].filter((d) => d.value > 0),
    };
  }, [filteredIncomes, kpis.totalInflow]);

  // Drilldown data for selected category
  const drilldownIncomes = useMemo(() => {
    if (!selectedCategory) return [];
    return filteredIncomes
      .filter((i) => i.category === selectedCategory)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredIncomes, selectedCategory]);

  const handleExportDrilldownCategory = async () => {
    if (!selectedCategory || drilldownIncomes.length === 0) return;
    setExportingCategory(true);
    try {
      const res = await exportTransactionsToExcel({
        incomes: drilldownIncomes,
        segment: "income",
        format: "xlsx",
      });
      if (!res.success) {
        alert("Export notice: " + (res.error || "Could not export on this device."));
      }
    } catch (err: any) {
      console.error(err);
      alert("Export failed: " + (err?.message || "Unknown error"));
    } finally {
      setExportingCategory(false);
    }
  };

  return (
    <div id="income-charts-master-section" className="space-y-4 animate-fadeIn">
      {/* 1. PRIMARY CHART NAVIGATION BAR */}
      <div
        id="income-charts-nav-bar"
        className="bg-white rounded-3xl border border-[#E8EAED] p-3 sm:p-4 shadow-xs space-y-3"
      >
        {/* Top Header of Nav Bar: Title & Timeframe Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F3F4]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#E6F4EA] text-[#0F9D58] flex items-center justify-center font-bold shadow-2xs border border-[#CEEAD6]">
              <PieChart size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#202124] flex items-center gap-2">
                <span>Income Visual Charts & Insights</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#0F9D58]">
                  {periodLabel}
                </span>
              </h3>
              <p className="text-xs text-[#5F6368]">
                Interactive graphical analysis for all in-hand receipts & cash inflows
              </p>
            </div>
          </div>

          {/* Timeframe Range Nav Bar (Pills) */}
          <div
            id="income-chart-time-nav-bar"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
          >
            <span className="text-xs font-bold text-[#5F6368] uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Calendar size={13} className="text-[#0F9D58]" /> Range:
            </span>
            {[
              { id: "this-month", label: "This Month" },
              { id: "last-3-months", label: "3 Months" },
              { id: "last-6-months", label: "6 Months" },
              { id: "this-year", label: "This Year" },
              { id: "all-time", label: "All Time" },
            ].map((preset) => {
              const isActive = timeRange === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`btn-time-${preset.id}`}
                  onClick={() => {
                    setTimeRange(preset.id as TimeRangePreset);
                    setSelectedCategory(null);
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "bg-[#0F9D58] text-white border-[#0F9D58] shadow-xs font-bold"
                      : "bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-[#E8EAED]"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart View Modes Nav Bar (5 Feature Tabs) */}
        <div
          id="income-chart-view-modes-nav-bar"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 touch-pan-x"
        >
          <span className="text-xs font-bold text-[#5F6368] uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter size={13} className="text-[#1A73E8]" /> Chart Mode:
          </span>

          <button
            type="button"
            id="nav-tab-category-donut"
            onClick={() => setChartType("category-donut")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              chartType === "category-donut"
                ? "bg-[#0F9D58] text-white border-[#0F9D58] shadow-xs"
                : "bg-white text-[#3C4043] border-[#DADCE0] hover:bg-[#F8F9FA]"
            }`}
          >
            <PieChart size={14} />
            <span>1. Source Donut & Pie</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                chartType === "category-donut"
                  ? "bg-white/20 text-white"
                  : "bg-[#E6F4EA] text-[#0F9D58]"
              }`}
            >
              {categoryData.length}
            </span>
          </button>

          <button
            type="button"
            id="nav-tab-cashflow-bar"
            onClick={() => setChartType("cashflow-bar")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              chartType === "cashflow-bar"
                ? "bg-[#1A73E8] text-white border-[#1A73E8] shadow-xs"
                : "bg-white text-[#3C4043] border-[#DADCE0] hover:bg-[#F8F9FA]"
            }`}
          >
            <BarChart3 size={14} />
            <span>2. Inflows vs Spends</span>
          </button>

          <button
            type="button"
            id="nav-tab-trend-area"
            onClick={() => setChartType("trend-area")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              chartType === "trend-area"
                ? "bg-[#0097A7] text-white border-[#0097A7] shadow-xs"
                : "bg-white text-[#3C4043] border-[#DADCE0] hover:bg-[#F8F9FA]"
            }`}
          >
            <LineChart size={14} />
            <span>3. Inflow Timeline</span>
          </button>

          <button
            type="button"
            id="nav-tab-payment-channels"
            onClick={() => setChartType("payment-channels")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              chartType === "payment-channels"
                ? "bg-[#9334E6] text-white border-[#9334E6] shadow-xs"
                : "bg-white text-[#3C4043] border-[#DADCE0] hover:bg-[#F8F9FA]"
            }`}
          >
            <CreditCard size={14} />
            <span>4. Deposit Modes</span>
          </button>

          <button
            type="button"
            id="nav-tab-stream-ratio"
            onClick={() => setChartType("stream-ratio")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              chartType === "stream-ratio"
                ? "bg-[#B06000] text-white border-[#B06000] shadow-xs"
                : "bg-white text-[#3C4043] border-[#DADCE0] hover:bg-[#F8F9FA]"
            }`}
          >
            <Briefcase size={14} />
            <span>5. Salary vs Extra Inflow</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY KPI METRIC TILES FOR THE CURRENT PERIOD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Total Period Inflow */}
        <div className="bg-white rounded-2xl border border-[#E8EAED] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider block">
            Total Inflow
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold text-[#0F9D58]">
              +{formatINR(kpis.totalInflow)}
            </span>
          </div>
          <span className="text-[11px] text-[#5F6368] mt-0.5 block">
            {kpis.count} receipts recorded
          </span>
        </div>

        {/* Metric 2: Top Source */}
        <div className="bg-white rounded-2xl border border-[#E8EAED] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider block">
            Top Income Source
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-[#202124] truncate">
              {topCategory ? topCategory.name : "None"}
            </span>
          </div>
          <span className="text-[11px] text-[#0F9D58] font-bold mt-0.5 block">
            {topCategory ? `${topCategory.percent}% (+${formatINR(topCategory.value)})` : "—"}
          </span>
        </div>

        {/* Metric 3: Avg Receipt Size */}
        <div className="bg-white rounded-2xl border border-[#E8EAED] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider block">
            Avg Ticket Inflow
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold text-[#1A73E8]">
              {formatINR(kpis.avgPerReceipt)}
            </span>
          </div>
          <span className="text-[11px] text-[#5F6368] mt-0.5 block">per income deposit</span>
        </div>

        {/* Metric 4: Net Retained Savings */}
        <div
          className={`rounded-2xl border p-3.5 sm:p-4 shadow-xs ${
            kpis.netCashflow >= 0
              ? "bg-[#E8F0FE] border-[#D2E3FC]"
              : "bg-[#FEF7E0] border-[#FEEFC3]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368] block">
            Net Savings Rate
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span
              className={`text-xl sm:text-2xl font-bold ${
                kpis.netCashflow >= 0 ? "text-[#1A73E8]" : "text-[#B06000]"
              }`}
            >
              {kpis.savingsRate}%
            </span>
          </div>
          <span className="text-[11px] text-[#5F6368] mt-0.5 block font-medium">
            {kpis.netCashflow >= 0 ? "+" : ""}
            {formatINR(kpis.netCashflow)} retained
          </span>
        </div>
      </div>

      {/* 3. DYNAMIC CHART VISUALIZATION CANVAS */}
      {filteredIncomes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E8EAED] p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#E6F4EA] text-[#0F9D58] flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={26} />
          </div>
          <h3 className="text-base font-bold text-[#202124]">No income records in {periodLabel}</h3>
          <p className="text-xs text-[#5F6368] mt-1 max-w-sm mx-auto">
            Log your salary, freelance retainers, dividends, or investments to see visual charts.
          </p>
          {onOpenAddIncome && (
            <button
              onClick={onOpenAddIncome}
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Record First Income</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Chart Canvas Area (7 or 8 columns on desktop) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E8EAED] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            {/* Chart Top Header & Sub-Toggles */}
            <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-3">
              <div>
                <h4 className="font-bold text-sm text-[#202124] flex items-center gap-2">
                  {chartType === "category-donut" && "Income Category Allocation"}
                  {chartType === "cashflow-bar" && "Monthly Inflow vs Outflow Cashflow"}
                  {chartType === "trend-area" && "Inflow Velocity Timeline"}
                  {chartType === "payment-channels" && "Deposit Modes Distribution"}
                  {chartType === "stream-ratio" && "Salary vs Extra Income Streams"}
                </h4>
                <p className="text-[11px] text-[#5F6368]">
                  {chartType === "category-donut" && "Click any slice to filter & drill down receipts"}
                  {chartType === "cashflow-bar" && "Comparing earned income against logged spends"}
                  {chartType === "trend-area" && "Cumulative earnings & day-by-day inflow trajectory"}
                  {chartType === "payment-channels" && "Breakdown by Bank Transfer, UPI, Cash & Cheque"}
                  {chartType === "stream-ratio" && "Core employment wages vs freelance & side returns"}
                </p>
              </div>

              {/* Sub-toggle for Pie vs Donut */}
              {chartType === "category-donut" && (
                <div className="flex bg-[#F1F3F4] p-0.5 rounded-full text-xs font-semibold">
                  <button
                    onClick={() => setPieSubtype("donut")}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      pieSubtype === "donut"
                        ? "bg-white text-[#0F9D58] shadow-2xs font-bold"
                        : "text-[#5F6368]"
                    }`}
                  >
                    Donut
                  </button>
                  <button
                    onClick={() => setPieSubtype("pie")}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      pieSubtype === "pie"
                        ? "bg-white text-[#0F9D58] shadow-2xs font-bold"
                        : "text-[#5F6368]"
                    }`}
                  >
                    Pie
                  </button>
                </div>
              )}
            </div>

            {/* CHART 1: CATEGORY DONUT / PIE */}
            {chartType === "category-donut" && (
              <div className="h-72 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={pieSubtype === "donut" ? 65 : 0}
                      outerRadius={95}
                      paddingAngle={pieSubtype === "donut" ? 3 : 1}
                      onClick={(entry) => {
                        if (entry && entry.name) {
                          setSelectedCategory(
                            selectedCategory === entry.name ? null : entry.name
                          );
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={selectedCategory === entry.name ? "#202124" : "#ffffff"}
                          strokeWidth={selectedCategory === entry.name ? 3 : 1}
                          opacity={
                            selectedCategory && selectedCategory !== entry.name ? 0.45 : 1
                          }
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(val: any) => [`+${formatINR(Number(val))}`, "Total Inflow"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #DADCE0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>

                {/* Center Donut Badge */}
                {pieSubtype === "donut" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6368]">
                      {selectedCategory ? "Filtered" : "Total Inflow"}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-[#0F9D58]">
                      {selectedCategory
                        ? `+${formatINR(
                            categoryData.find((c) => c.name === selectedCategory)?.value || 0
                          )}`
                        : `+${formatINR(kpis.totalInflow)}`}
                    </span>
                    <span className="text-[10px] font-medium text-[#5F6368]">
                      {selectedCategory || `${categoryData.length} categories`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* CHART 2: CASHFLOW BAR CHART (Inflow vs Outflow) */}
            {chartType === "cashflow-bar" && (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={cashflowComparisonData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#5F6368" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#5F6368" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                    />
                    <RechartsTooltip
                      formatter={(val: any, name: any) => [
                        `${name === "Expenses" ? "-" : "+"}${formatINR(Number(val))}`,
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #DADCE0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    />
                    <RechartsLegend
                      verticalAlign="top"
                      height={32}
                      wrapperStyle={{ fontSize: "11px", fontWeight: 600 }}
                    />
                    <Bar
                      dataKey="Income"
                      fill="#0F9D58"
                      radius={[4, 4, 0, 0]}
                      name="Inflows (+₹)"
                    />
                    <Bar
                      dataKey="Expenses"
                      fill="#EA4335"
                      radius={[4, 4, 0, 0]}
                      name="Spends (-₹)"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* CHART 3: INFLOW TIMELINE AREA CHART */}
            {chartType === "trend-area" && (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F9D58" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0F9D58" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#5F6368" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#5F6368" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                    />
                    <RechartsTooltip
                      formatter={(val: any) => [`+${formatINR(Number(val))}`, "Inflow Velocity"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #DADCE0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="dailyInflow"
                      stroke="#0F9D58"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#incomeAreaGrad)"
                    />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* CHART 4: DEPOSIT MODES */}
            {chartType === "payment-channels" && (
              <div className="h-72 w-full flex flex-col justify-center gap-3 px-2">
                {depositModesData.map((channel) => (
                  <div key={channel.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-[#202124]">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: channel.color }}
                        />
                        {channel.name} ({channel.count} receipts)
                      </span>
                      <span className="font-bold text-[#0F9D58]">
                        +{formatINR(channel.value)} ({channel.percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#F1F3F4] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${channel.percent}%`,
                          backgroundColor: channel.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CHART 5: SALARY VS EXTRA STREAM RATIO */}
            {chartType === "stream-ratio" && (
              <div className="h-72 w-full flex flex-col items-center justify-center p-2">
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  {/* Salary Box */}
                  <div className="p-4 bg-[#E6F4EA] border border-[#CEEAD6] rounded-2xl text-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-[#0F9D58] text-white flex items-center justify-center mx-auto">
                      <Briefcase size={16} />
                    </div>
                    <span className="text-xs font-bold text-[#137333] block">
                      Primary Salary / Bonus
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold text-[#0F9D58] block">
                      +{formatINR(streamRatioData.salaryTotal)}
                    </span>
                    <span className="text-xs font-bold text-[#137333]">
                      {streamRatioData.salaryPct}% Share ({streamRatioData.salaryCount} logs)
                    </span>
                  </div>

                  {/* Extra Box */}
                  <div className="p-4 bg-[#FEF7E0] border border-[#FEEFC3] rounded-2xl text-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-[#F9AB00] text-white flex items-center justify-center mx-auto">
                      <Zap size={16} />
                    </div>
                    <span className="text-xs font-bold text-[#B06000] block">
                      Extra & Side Hustles
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold text-[#B06000] block">
                      +{formatINR(streamRatioData.extraTotal)}
                    </span>
                    <span className="text-xs font-bold text-[#B06000]">
                      {streamRatioData.extraPct}% Share ({streamRatioData.extraCount} logs)
                    </span>
                  </div>
                </div>

                {/* Diversification Progress Gauge */}
                <div className="w-full max-w-md mt-4">
                  <div className="flex justify-between text-xs font-bold text-[#5F6368] mb-1">
                    <span>Income Diversification Ratio</span>
                    <span className="text-[#0F9D58]">
                      {streamRatioData.extraPct > 0 ? "Diversified Inflow" : "Single Primary Stream"}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-[#E6F4EA] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#0F9D58] transition-all duration-700"
                      style={{ width: `${streamRatioData.salaryPct}%` }}
                      title={`Salary: ${streamRatioData.salaryPct}%`}
                    />
                    <div
                      className="h-full bg-[#F9AB00] transition-all duration-700"
                      style={{ width: `${streamRatioData.extraPct}%` }}
                      title={`Extra: ${streamRatioData.extraPct}%`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Category Breakdown Table & Slice Drilldown (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8EAED] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F4]">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[#202124]">
                    {selectedCategory ? `Receipts: ${selectedCategory}` : "Category Leaderboard"}
                  </h4>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-[10px] font-bold text-[#EA4335] bg-[#FCE8E6] px-2 py-0.5 rounded-full hover:bg-[#FAD2CF] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <X size={10} />
                      <span>Show All</span>
                    </button>
                  )}
                </div>

                {onOpenCategoryManager && (
                  <button
                    onClick={onOpenCategoryManager}
                    className="text-xs font-semibold text-[#1A73E8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Settings size={12} />
                    <span>Manage</span>
                  </button>
                )}
              </div>

              {/* If a category is selected: Drill-Down List */}
              {selectedCategory ? (
                <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  <div className="p-3 bg-[#E6F4EA] rounded-2xl border border-[#CEEAD6] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#137333] block">
                        {selectedCategory}
                      </span>
                      <span className="text-[11px] text-[#5F6368]">
                        {drilldownIncomes.length} receipts in {periodLabel}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#0F9D58] block">
                        +
                        {formatINR(
                          drilldownIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0)
                        )}
                      </span>
                      <button
                        onClick={handleExportDrilldownCategory}
                        disabled={exportingCategory}
                        className="mt-1 text-[10px] font-bold text-[#137333] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download size={10} />
                        <span>{exportingCategory ? "Exporting..." : "Export XLSX"}</span>
                      </button>
                    </div>
                  </div>

                  {drilldownIncomes.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-[#F8F9FA] rounded-xl border border-[#E8EAED] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-xs text-[#202124] block truncate">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#5F6368] mt-0.5">
                          <span>{formatFriendlyDate(item.date)}</span>
                          <span>•</span>
                          <span>{item.paymentMode}</span>
                          {item.sourceOrClient && (
                            <>
                              <span>•</span>
                              <span className="truncate">{item.sourceOrClient}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#0F9D58] shrink-0">
                        +{formatINR(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Leaderboard Table of All Categories */
                <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {categoryData.map((cat, idx) => (
                    <div
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className="p-2.5 rounded-xl border border-[#E8EAED] hover:bg-[#F8F9FA] transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#202124] flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate">{cat.name}</span>
                          <span className="text-[10px] text-[#5F6368] font-normal shrink-0">
                            ({cat.count})
                          </span>
                        </span>
                        <span className="font-bold text-[#0F9D58] shrink-0">
                          +{formatINR(cat.value)} ({cat.percent}%)
                        </span>
                      </div>
                      {/* Visual Bar */}
                      <div className="h-1.5 w-full bg-[#F1F3F4] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percent}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Quick Action */}
            {onOpenAddIncome && (
              <div className="pt-2 border-t border-[#F1F3F4]">
                <button
                  type="button"
                  onClick={onOpenAddIncome}
                  className="w-full py-2 bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#0F9D58] text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Record Inflow into Charts</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
