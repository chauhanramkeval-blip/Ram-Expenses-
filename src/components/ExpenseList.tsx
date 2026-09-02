import React, { useState } from "react";
import {
  Trash2,
  Edit2,
  ArrowUpDown,
  Filter,
  Download,
  Calendar,
  CreditCard,
  Building2,
  Plus,
  Search,
  Sparkles,
  Settings,
} from "lucide-react";
import { CategoryMeta, Expense, ExpenseCategory, PaymentMode } from "../types";
import { CATEGORIES_DATA, CATEGORY_LIST } from "../data/categories";
import { CategoryBadge, CategoryIcon, resolveExpenseMeta } from "./CategoryIcon";
import { formatINR, formatFriendlyDate } from "../utils/formatters";

interface ExpenseListProps {
  expenses: Expense[];
  searchQuery: string;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onOpenAddExpense: () => void;
  onNavigateToVisuals: () => void;
  customExpenseCategories?: CategoryMeta[];
  onOpenCategoryManager?: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  searchQuery,
  onEditExpense,
  onDeleteExpense,
  onOpenAddExpense,
  onNavigateToVisuals,
  customExpenseCategories,
  onOpenCategoryManager,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amt-desc" | "amt-asc">(
    "date-desc"
  );

  const allCategories = customExpenseCategories || CATEGORY_LIST;

  // Filter & Search logic
  const filtered = expenses.filter((e) => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchCat = e.category.toLowerCase().includes(q);
      const matchMerchant = e.merchantOrLocation?.toLowerCase().includes(q) || false;
      const matchNote = e.notes?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchCat && !matchMerchant && !matchNote) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== "ALL" && e.category !== selectedCategory) {
      return false;
    }

    // Payment mode filter
    if (selectedPaymentMode !== "ALL" && e.paymentMode !== selectedPaymentMode) {
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

  // Group by Date for Google Files style chronological sections
  const groupedByDate: Record<string, Expense[]> = {};
  sorted.forEach((item) => {
    const groupKey = formatFriendlyDate(item.date);
    if (!groupedByDate[groupKey]) {
      groupedByDate[groupKey] = [];
    }
    groupedByDate[groupKey].push(item);
  });

  // Export CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ["ID", "Date", "Title", "Category", "Amount(INR)", "PaymentMode", "Merchant", "Notes"];
    const rows = expenses.map((e) => [
      e.id,
      e.date,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      e.paymentMode,
      `"${(e.merchantOrLocation || "").replace(/"/g, '""')}"`,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Khata_Expenses_Backup_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="khata-expense-list-container" className="space-y-4">
      {/* Category Filter Chips Carousel (Google Files style) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 pt-0.5">
        <button
          id="chip-cat-all"
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
            selectedCategory === "ALL"
              ? "bg-[#202124] text-white border-[#202124]"
              : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4]"
          }`}
        >
          All ({expenses.length})
        </button>
        {allCategories.map((cat) => {
          const count = expenses.filter((e) => e.category === cat.id || e.category === cat.name).length;
          const isSelected = selectedCategory === cat.id || selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              id={`chip-cat-${cat.id.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => setSelectedCategory(isSelected ? "ALL" : cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
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
              <CategoryIcon category={cat.id} customCategories={customExpenseCategories} size={13} />
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
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] border border-[#D2E3FC] transition-colors cursor-pointer"
          >
            <Settings size={12} />
            <span>Edit Categories</span>
          </button>
        )}
      </div>

      {/* Sub-bar: Payment Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 py-1 text-xs text-[#5F6368]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#3C4043] flex items-center gap-1">
            <Filter size={13} /> Filter:
          </span>
          <select
            id="select-payment-mode-filter"
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
            className="bg-white border border-[#DADCE0] rounded-lg px-2.5 py-1 text-xs text-[#202124] focus:border-[#1A73E8] outline-none"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI">UPI (GPay/PhonePe)</option>
            <option value="Cash">Cash (Rokda)</option>
            <option value="Debit / Credit Card">Card</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#3C4043] flex items-center gap-1">
            <ArrowUpDown size={13} /> Sort:
          </span>
          <select
            id="select-sort-expenses"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-[#DADCE0] rounded-lg px-2.5 py-1 text-xs text-[#202124] focus:border-[#1A73E8] outline-none"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amt-desc">Highest Amount (₹)</option>
            <option value="amt-asc">Lowest Amount (₹)</option>
          </select>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            title="Download CSV Statement"
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124] rounded-lg border border-[#DADCE0] transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Expense Items List */}
      {sorted.length === 0 ? (
        <div
          id="expense-empty-state"
          className="bg-white rounded-2xl border border-[#E8EAED] p-8 text-center shadow-xs"
        >
          <div className="w-14 h-14 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto mb-3">
            <Search size={26} />
          </div>
          <h3 className="text-base font-bold text-[#202124]">No expenses found</h3>
          <p className="text-xs text-[#5F6368] mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== "ALL" || selectedPaymentMode !== "ALL"
              ? "Try adjusting your search query or category filters."
              : "Start by logging your daily tea, groceries, bills, or commute."}
          </p>
          <button
            id="btn-empty-add-spend"
            onClick={onOpenAddExpense}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add First Expense</span>
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
                    <Calendar size={13} className="text-[#1A73E8]" />
                    {dateGroup}
                  </span>
                  <span className="text-xs font-semibold text-[#3C4043] bg-[#F1F3F4] px-2 py-0.5 rounded-md">
                    Total: {formatINR(dayTotal)}
                  </span>
                </div>

                {/* Group Item Cards (Google Files item card look) */}
                <div className="bg-white rounded-2xl border border-[#E8EAED] shadow-xs divide-y divide-[#F1F3F4] overflow-hidden">
                  {items.map((item) => {
                    const catMeta = resolveExpenseMeta(item.category, customExpenseCategories);

                    return (
                      <div
                        key={item.id}
                        id={`expense-item-${item.id}`}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#F8F9FA] transition-colors group"
                      >
                        {/* Left: Icon & Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: catMeta.bgColor,
                              borderColor: catMeta.borderColor,
                            }}
                          >
                            <CategoryIcon category={item.category} customCategories={customExpenseCategories} size={20} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm text-[#202124] truncate">
                                {item.title}
                              </h4>
                              {item.merchantOrLocation && (
                                <span className="text-[11px] font-medium text-[#5F6368] bg-[#F1F3F4] px-1.5 py-0.2 rounded">
                                  📍 {item.merchantOrLocation}
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
                              <span className="flex items-center gap-1">
                                {item.paymentMode === "UPI" && "⚡ UPI"}
                                {item.paymentMode === "Cash" && "💵 Cash"}
                                {item.paymentMode === "Debit / Credit Card" && "💳 Card"}
                                {item.paymentMode === "Net Banking" && "🏦 NetBanking"}
                                {item.paymentMode === "Wallet" && "👛 Wallet"}
                              </span>
                              {item.time && (
                                <>
                                  <span>•</span>
                                  <span>{item.time}</span>
                                </>
                              )}
                              {item.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-[#70757A] truncate max-w-[160px]">
                                    "{item.notes}"
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-bold text-[#202124]">
                              {formatINR(item.amount)}
                            </div>
                          </div>

                          {/* Action Buttons (Edit in Green, Delete in Red) */}
                          <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              id={`btn-edit-exp-${item.id}`}
                              onClick={() => onEditExpense(item)}
                              title="Edit Expense"
                              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#0F9D58] bg-[#E6F4EA] hover:bg-[#CEEAD6] border border-[#CEEAD6] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              <Edit2 size={13} strokeWidth={2.2} />
                              <span className="hidden md:inline">Edit</span>
                            </button>
                            <button
                              id={`btn-delete-exp-${item.id}`}
                              onClick={() => onDeleteExpense(item.id)}
                              title="Delete Expense"
                              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#EA4335] bg-[#FCE8E6] hover:bg-[#FAD2CF] border border-[#FAD2CF] rounded-lg transition-colors cursor-pointer shadow-2xs"
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
