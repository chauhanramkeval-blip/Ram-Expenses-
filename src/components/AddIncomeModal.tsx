import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Calendar,
  Building2,
  Briefcase,
  TrendingUp,
  Settings,
  Sparkles,
} from "lucide-react";
import { INCOME_CATEGORY_LIST, INCOME_CATEGORIES_DATA } from "../data/categories";
import { Income, IncomeCategory, IncomeCategoryMeta, IncomeStreamType, PaymentMode } from "../types";
import { IncomeIcon, resolveIncomeMeta } from "./CategoryIcon";
import { formatINR } from "../utils/formatters";
import confetti from "canvas-confetti";

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incomeData: Omit<Income, "id">, editId?: string) => void;
  editingIncome?: Income | null;
  customIncomeCategories?: IncomeCategoryMeta[];
  onOpenCategoryManager?: () => void;
}

const INCOME_PAYMENT_MODES: { mode: PaymentMode; label: string; icon: string }[] = [
  { mode: "Bank Transfer", label: "Direct Bank Transfer (NEFT/IMPS)", icon: "🏦" },
  { mode: "UPI", label: "UPI / GPay / PhonePe", icon: "⚡" },
  { mode: "Net Banking", label: "Net Banking", icon: "💻" },
  { mode: "Cash", label: "Cash (Rokda)", icon: "💵" },
  { mode: "Cheque", label: "Cheque Deposit", icon: "📜" },
  { mode: "Debit / Credit Card", label: "Card / Payout", icon: "💳" },
];

const SALARY_PRESETS = [30000, 50000, 75000, 100000, 150000];
const EXTRA_INCOME_PRESETS = [2000, 5000, 15000, 30000, 50000];

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingIncome,
  customIncomeCategories,
  onOpenCategoryManager,
}) => {
  const [streamType, setStreamType] = useState<IncomeStreamType>("salary_bonus");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<IncomeCategory>("Salary & Bonus");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Bank Transfer");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sourceOrClient, setSourceOrClient] = useState("");
  const [notes, setNotes] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");

  const allIncomeCategories = customIncomeCategories || INCOME_CATEGORY_LIST;

  useEffect(() => {
    if (editingIncome) {
      setTitle(editingIncome.title);
      setAmount(editingIncome.amount.toString());

      const meta = resolveIncomeMeta(editingIncome.category, customIncomeCategories);
      const isKnown = allIncomeCategories.some((c) => c.name === editingIncome.category || c.id === editingIncome.category);

      setStreamType(editingIncome.streamType || meta.streamType || "salary_bonus");

      if (isKnown) {
        setCategory(editingIncome.category);
        setIsCustomCategory(false);
        setCustomCategoryName("");
      } else {
        setCategory("Other Income");
        setIsCustomCategory(true);
        setCustomCategoryName(editingIncome.category);
      }
      setPaymentMode(editingIncome.paymentMode);
      setDate(editingIncome.date);
      setSourceOrClient(editingIncome.sourceOrClient || "");
      setNotes(editingIncome.notes || "");
    } else {
      setTitle("");
      setAmount("");
      setStreamType("salary_bonus");
      setCategory("Salary & Bonus");
      setIsCustomCategory(false);
      setCustomCategoryName("");
      setPaymentMode("Bank Transfer");
      setDate(new Date().toISOString().split("T")[0]);
      setSourceOrClient("");
      setNotes("");
    }
  }, [editingIncome, isOpen, customIncomeCategories]);

  if (!isOpen) return null;

  const currentCategoryMeta = resolveIncomeMeta(category, customIncomeCategories);

  // Filter categories matching current stream selection
  const streamCategories = allIncomeCategories.filter((c) => c.streamType === streamType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const finalCategory =
      isCustomCategory && customCategoryName.trim()
        ? customCategoryName.trim()
        : category;

    const incomeTitle =
      title.trim() || `${finalCategory} (${sourceOrClient || "Direct Inflow"})`;

    onSave(
      {
        title: incomeTitle,
        amount: parsedAmount,
        category: finalCategory,
        streamType,
        paymentMode,
        date,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        sourceOrClient: sourceOrClient.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      editingIncome ? editingIncome.id : undefined
    );

    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.75 },
        colors: ["#0F9D58", "#34A853", "#1A73E8", "#FBBC05"],
      });
    } catch {
      // Ignore if confetti fails
    }

    onClose();
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const quickAmounts =
    currentCategoryMeta.defaultQuickAmounts?.length > 0
      ? currentCategoryMeta.defaultQuickAmounts
      : streamType === "salary_bonus"
      ? SALARY_PRESETS
      : EXTRA_INCOME_PRESETS;

  return (
    <div
      id="add-income-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/50 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="add-income-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8EAED] p-5 sm:p-6 transition-all animate-scaleUp text-[#202124]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#E6F4EA] flex items-center justify-center text-[#0F9D58] font-bold shadow-2xs">
              💰
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#202124]">
                {editingIncome ? "Edit Income Entry" : "Record Income / Inflow"}
              </h3>
              <p className="text-xs text-[#5F6368]">
                Track Salary & Bonus or Extra & Side Income
              </p>
            </div>
          </div>
          <button
            id="btn-close-income-modal"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Stream Type Selector: Salary & Bonus VS Extra Income */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1.5">
              Select Income Type:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-stream-salary"
                type="button"
                onClick={() => {
                  setStreamType("salary_bonus");
                  if (!isCustomCategory) {
                    setCategory("Salary & Bonus");
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  streamType === "salary_bonus"
                    ? "bg-[#E6F4EA] border-[#0F9D58] text-[#0F9D58] ring-2 ring-[#0F9D58]/20 shadow-xs"
                    : "bg-[#F8F9FA] border-[#DADCE0] text-[#3C4043] hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Briefcase size={15} />
                  <span>💼 Salary & Bonus</span>
                </div>
                <p className="text-[10px] text-[#5F6368] mt-0.5">
                  Monthly in-hand salary, annual corporate bonus, incentives
                </p>
              </button>

              <button
                id="btn-stream-extra"
                type="button"
                onClick={() => {
                  setStreamType("extra_income");
                  if (!isCustomCategory) {
                    setCategory("Freelance & Consulting");
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  streamType === "extra_income"
                    ? "bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] ring-2 ring-[#1A73E8]/20 shadow-xs"
                    : "bg-[#F8F9FA] border-[#DADCE0] text-[#3C4043] hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <TrendingUp size={15} />
                  <span>⚡ Extra & Side Income</span>
                </div>
                <p className="text-[10px] text-[#5F6368] mt-0.5">
                  Freelancing, dividends, rental, cash gifts & side hustles
                </p>
              </button>
            </div>
          </div>

          {/* 2. Amount Field (Hero element) */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1">
              Amount (₹) <span className="text-[#EA4335]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-[#0F9D58]">
                +₹
              </span>
              <input
                id="input-income-amount"
                type="number"
                step="any"
                required
                autoFocus
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] focus:bg-white text-2xl font-bold text-[#202124] rounded-2xl border border-[#DADCE0] focus:border-[#0F9D58] focus:ring-2 focus:ring-[#0F9D58]/20 outline-none transition-all"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  id={`btn-quick-inc-${val}`}
                  onClick={() => handleQuickAmount(val)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F1F3F4] hover:bg-[#E6F4EA] text-[#3C4043] hover:text-[#0F9D58] border border-[#E8EAED] transition-colors cursor-pointer"
                >
                  +{formatINR(val, true)}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Title Field */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1">
              Income Title / Reference
            </label>
            <input
              id="input-income-title"
              type="text"
              placeholder={
                streamType === "salary_bonus"
                  ? "e.g. Monthly In-Hand Salary, Annual Performance Bonus"
                  : "e.g. React Dashboard Project Milestone, House Rent Received"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#F8F9FA] focus:bg-white text-xs font-medium text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#0F9D58] outline-none"
            />
          </div>

          {/* 4. Category Selector Grid */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="block text-xs font-semibold text-[#5F6368]">
                Category Stream <span className="text-[#EA4335]">*</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-toggle-custom-income-category"
                  onClick={() => {
                    setIsCustomCategory(!isCustomCategory);
                    if (!isCustomCategory) {
                      setCategory("Other Income");
                    }
                  }}
                  className="text-[11px] font-semibold text-[#0F9D58] hover:underline cursor-pointer flex items-center gap-1"
                >
                  {isCustomCategory ? "← Standard Streams" : "+ Manual Category"}
                </button>

                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCategoryManager();
                    }}
                    className="text-[11px] font-semibold text-[#1A73E8] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Settings size={11} />
                    <span>Manage Categories</span>
                  </button>
                )}
              </div>
            </div>

            {isCustomCategory ? (
              <div className="space-y-2 bg-[#F8F9FA] p-3 rounded-2xl border border-[#DADCE0]">
                <label className="block text-[11px] font-semibold text-[#202124]">
                  Enter Custom Manual Category:
                </label>
                <input
                  id="input-custom-income-category"
                  type="text"
                  required={isCustomCategory}
                  autoFocus
                  placeholder={
                    streamType === "salary_bonus"
                      ? "e.g. Festival Shagun Bonus, Company Stipend"
                      : "e.g. YouTube AdSense, Agriculture Mandi, Airbnb, Crypto"
                  }
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-xs font-medium text-[#202124] rounded-xl border border-[#0F9D58] focus:ring-2 focus:ring-[#0F9D58]/20 outline-none"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {streamCategories.map((cat) => {
                  const isSelected = category === cat.id && !isCustomCategory;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      id={`btn-select-inc-cat-${cat.id.replace(/\s+/g, "-").toLowerCase()}`}
                      onClick={() => {
                        setCategory(cat.id);
                        setIsCustomCategory(false);
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "shadow-xs ring-2"
                          : "bg-white border-[#DADCE0] hover:bg-[#F8F9FA]"
                      }`}
                      style={{
                        backgroundColor: isSelected ? cat.bgColor : undefined,
                        borderColor: isSelected ? cat.color : undefined,
                        color: isSelected ? cat.color : "#3C4043",
                        // @ts-ignore
                        "--tw-ring-color": cat.color,
                      }}
                    >
                      <IncomeIcon category={cat.id} customCategories={customIncomeCategories} size={18} />
                      <span className="text-[11px] font-semibold mt-1 leading-tight line-clamp-1">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Source / Employer & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5F6368] mb-1">
                {streamType === "salary_bonus" ? "Employer / Company Name" : "Client / Platform / Payer"}
              </label>
              <div className="relative">
                <Building2
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]"
                />
                <input
                  id="input-income-source"
                  type="text"
                  placeholder={
                    streamType === "salary_bonus"
                      ? "e.g. Infosys, TCS, Tech Corp"
                      : "e.g. Upwork, Zerodha, Airbnb, Uncle"
                  }
                  value={sourceOrClient}
                  onChange={(e) => setSourceOrClient(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] focus:bg-white text-xs text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#0F9D58] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F6368] mb-1">
                Date Credited
              </label>
              <div className="relative">
                <Calendar
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]"
                />
                <input
                  id="input-income-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] focus:bg-white text-xs text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#0F9D58] outline-none"
                />
              </div>
            </div>
          </div>

          {/* 6. Deposit Mode */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1">
              Deposit Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INCOME_PAYMENT_MODES.map((pm) => {
                const isSelected = paymentMode === pm.mode;
                return (
                  <button
                    key={pm.mode}
                    type="button"
                    id={`btn-inc-mode-${pm.mode.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => setPaymentMode(pm.mode)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#E6F4EA] text-[#0F9D58] border-[#0F9D58] font-bold shadow-2xs"
                        : "bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-white"
                    }`}
                  >
                    <span>{pm.icon}</span>
                    <span className="truncate">{pm.mode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1">
              Notes (Optional)
            </label>
            <input
              id="input-income-notes"
              type="text"
              placeholder="e.g. In-hand after PF & TDS deductions, milestone 1 of 3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8F9FA] focus:bg-white text-xs text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#0F9D58] outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#F1F3F4] flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="btn-cancel-income-modal"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-income"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{editingIncome ? "Update Income" : "Save Income (+₹)"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

