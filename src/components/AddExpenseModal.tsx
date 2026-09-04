import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Calendar,
  CreditCard,
  Sparkles,
  MapPin,
  Tag,
  ArrowRight,
  Settings,
} from "lucide-react";
import { CATEGORY_LIST, CATEGORIES_DATA } from "../data/categories";
import { CategoryMeta, Expense, ExpenseCategory, PaymentMode } from "../types";
import { CategoryIcon, resolveExpenseMeta } from "./CategoryIcon";
import { formatINR } from "../utils/formatters";
import confetti from "canvas-confetti";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, "id">, editId?: string) => void;
  editingExpense?: Expense | null;
  customExpenseCategories?: CategoryMeta[];
  onOpenCategoryManager?: () => void;
  initialPrefill?: Partial<Expense> | null;
}

const PAYMENT_MODES: { mode: PaymentMode; label: string; icon: string }[] = [
  { mode: "UPI", label: "UPI / GPay / PhonePe", icon: "⚡" },
  { mode: "Cash", label: "Cash (Rokda)", icon: "💵" },
  { mode: "Debit / Credit Card", label: "Card", icon: "💳" },
  { mode: "Net Banking", label: "Net Banking", icon: "🏦" },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  customExpenseCategories,
  onOpenCategoryManager,
  initialPrefill,
}) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Chai & Street Food");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [merchantOrLocation, setMerchantOrLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");

  const allExpenseCategories = customExpenseCategories || CATEGORY_LIST;

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount.toString());
      const isKnown = allExpenseCategories.some((c) => c.name === editingExpense.category || c.id === editingExpense.category);
      if (isKnown) {
        setCategory(editingExpense.category);
        setIsCustomCategory(false);
        setCustomCategoryName("");
      } else {
        setCategory("Other Spends");
        setIsCustomCategory(true);
        setCustomCategoryName(editingExpense.category);
      }
      setPaymentMode(editingExpense.paymentMode);
      setDate(editingExpense.date);
      setMerchantOrLocation(editingExpense.merchantOrLocation || "");
      setNotes(editingExpense.notes || "");
    } else if (initialPrefill) {
      if (initialPrefill.title) setTitle(initialPrefill.title);
      if (initialPrefill.amount) setAmount(initialPrefill.amount.toString());
      if (initialPrefill.category) {
        const isKnown = allExpenseCategories.some((c) => c.name === initialPrefill.category || c.id === initialPrefill.category);
        if (isKnown) {
          setCategory(initialPrefill.category);
          setIsCustomCategory(false);
        } else {
          setCategory("Other Spends");
          setIsCustomCategory(true);
          setCustomCategoryName(initialPrefill.category);
        }
      }
      if (initialPrefill.paymentMode) setPaymentMode(initialPrefill.paymentMode);
      if (initialPrefill.merchantOrLocation) setMerchantOrLocation(initialPrefill.merchantOrLocation);
      if (initialPrefill.notes) setNotes(initialPrefill.notes);
    } else {
      // Defaults for new expense
      setTitle("");
      setAmount("");
      setCategory("Chai & Street Food");
      setIsCustomCategory(false);
      setCustomCategoryName("");
      setPaymentMode("UPI");
      setDate(new Date().toISOString().split("T")[0]);
      setMerchantOrLocation("");
      setNotes("");
    }
  }, [editingExpense, isOpen, customExpenseCategories, initialPrefill]);

  if (!isOpen) return null;

  const currentCategoryMeta = resolveExpenseMeta(category, customExpenseCategories);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const finalCategory = isCustomCategory && customCategoryName.trim()
      ? customCategoryName.trim()
      : category;

    const expenseTitle =
      title.trim() || `${finalCategory} Spend (${merchantOrLocation || "Daily"})`;

    onSave(
      {
        title: expenseTitle,
        amount: parsedAmount,
        category: finalCategory,
        paymentMode,
        date,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        merchantOrLocation: merchantOrLocation.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      editingExpense ? editingExpense.id : undefined
    );

    // Subtle celebration on add
    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
        colors: ["#1A73E8", "#34A853", "#FBBC05", "#EA4335"],
      });
    } catch {
      // Ignore if confetti not supported
    }

    onClose();
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  return (
    <div
      id="add-expense-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="add-expense-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8EAED] p-5 sm:p-6 transition-all animate-scaleUp text-[#202124]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#E8F0FE] flex items-center justify-center text-[#1A73E8] font-bold text-lg">
              ₹
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#202124]">
                {editingExpense ? "Edit Expense" : "Add Daily Expense"}
              </h3>
              <p className="text-xs text-[#5F6368]">Track your daily Indian spends effortlessly</p>
            </div>
          </div>
          <button
            id="btn-close-expense-modal"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input with big Indian Rupee font */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1">
              Amount (₹) <span className="text-[#EA4335]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-bold text-[#1A73E8]">₹</span>
              <input
                id="input-expense-amount"
                type="number"
                step="any"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-[#F8F9FA] focus:bg-white text-2xl font-bold text-[#202124] rounded-2xl border border-[#DADCE0] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#E8F0FE] outline-none transition-all"
              />
            </div>

            {/* Quick Amount Shortcuts according to category */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] text-[#5F6368] font-medium whitespace-nowrap mr-1">
                Quick:
              </span>
              {currentCategoryMeta.defaultQuickAmounts.map((qVal) => (
                <button
                  key={qVal}
                  type="button"
                  id={`btn-quick-amt-${qVal}`}
                  onClick={() => handleQuickAmount(qVal)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#F1F3F4] hover:bg-[#E8F0FE] hover:text-[#1A73E8] text-[#3C4043] transition-colors whitespace-nowrap border border-[#E8EAED] cursor-pointer"
                >
                  +{formatINR(qVal)}
                </button>
              ))}
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1">
              What did you spend on?
            </label>
            <input
              id="input-expense-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. ${currentCategoryMeta.description.split(",")[0]}`}
              className="w-full px-3.5 py-2.5 bg-[#F8F9FA] focus:bg-white text-sm text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none transition-all"
            />
          </div>

          {/* Category Selector Grid */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="block text-xs font-semibold text-[#5F6368]">
                Select Category <span className="text-[#EA4335]">*</span>
              </label>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-toggle-custom-expense-category"
                  onClick={() => {
                    setIsCustomCategory(!isCustomCategory);
                    if (!isCustomCategory) {
                      setCategory("Other Spends");
                    }
                  }}
                  className="text-[11px] font-semibold text-[#1A73E8] hover:underline cursor-pointer flex items-center gap-1"
                >
                  {isCustomCategory ? "← Standard Categories" : "+ Manual Category"}
                </button>

                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCategoryManager();
                    }}
                    className="text-[11px] font-semibold text-[#5F6368] hover:text-[#1A73E8] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Settings size={11} />
                    <span>Manage</span>
                  </button>
                )}
              </div>
            </div>

            {isCustomCategory ? (
              <div className="space-y-2 bg-[#F8F9FA] p-3 rounded-2xl border border-[#DADCE0]">
                <label className="block text-[11px] font-semibold text-[#202124]">
                  Enter Custom Category Name:
                </label>
                <input
                  id="input-custom-expense-category"
                  type="text"
                  required={isCustomCategory}
                  autoFocus
                  placeholder="e.g. Gym & Fitness, Pet Care, Bike Repairs, House Maid"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-xs font-medium text-[#202124] rounded-xl border border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none"
                />
                <p className="text-[10px] text-[#5F6368]">
                  This manual category will be tracked with its own badge and included in monthly breakdown.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {allExpenseCategories.map((cat) => {
                  const isSelected = category === cat.id && !isCustomCategory;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      id={`btn-category-select-${cat.id.replace(/\s+/g, "-").toLowerCase()}`}
                      onClick={() => {
                        setCategory(cat.id);
                        setIsCustomCategory(false);
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "shadow-xs ring-2 ring-[#1A73E8]/30 font-bold"
                          : "bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#3C4043] border-[#E8EAED]"
                      }`}
                      style={{
                        backgroundColor: isSelected ? cat.bgColor : undefined,
                        borderColor: isSelected ? cat.color : undefined,
                        color: isSelected ? cat.color : undefined,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isSelected ? "white" : cat.bgColor }}
                      >
                        <CategoryIcon category={cat.id} customCategories={customExpenseCategories} size={14} />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1.5">
              Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_MODES.map((pm) => (
                <button
                  key={pm.mode}
                  type="button"
                  id={`btn-pm-${pm.mode.replace(/[\s\/]+/g, "-").toLowerCase()}`}
                  onClick={() => setPaymentMode(pm.mode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    paymentMode === pm.mode
                      ? "bg-[#E8F0FE] text-[#1A73E8] border-[#1A73E8] font-bold shadow-2xs"
                      : "bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4]"
                  }`}
                >
                  <span className="text-sm">{pm.icon}</span>
                  <span className="truncate">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Merchant/Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5F6368] mb-1">
                Date
              </label>
              <div className="relative">
                <input
                  id="input-expense-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F9FA] focus:bg-white text-xs text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F6368] mb-1">
                Shop / Market / Area (Optional)
              </label>
              <div className="relative">
                <input
                  id="input-expense-merchant"
                  type="text"
                  value={merchantOrLocation}
                  onChange={(e) => setMerchantOrLocation(e.target.value)}
                  placeholder="e.g. Connaught Place, Blinkit, DMart"
                  className="w-full pl-3 pr-8 py-2 bg-[#F8F9FA] focus:bg-white text-xs text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                />
                <MapPin size={14} className="absolute right-2.5 top-2.5 text-[#5F6368] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1">
              Note (Optional)
            </label>
            <input
              id="input-expense-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Split with Rohan, treat for birthday"
              className="w-full px-3 py-2 bg-[#F8F9FA] focus:bg-white text-xs text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-[#F1F3F4] flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="btn-cancel-expense"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-expense"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-full shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={16} strokeWidth={3} />
              <span>{editingExpense ? "Update Expense" : "Save Spend"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
