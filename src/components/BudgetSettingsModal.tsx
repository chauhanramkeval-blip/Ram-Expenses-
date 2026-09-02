import React, { useState } from "react";
import { X, Check, Sliders, DollarSign, RefreshCw, ShieldCheck, Lock } from "lucide-react";
import { UserBudget } from "../types";
import { formatINR } from "../utils/formatters";

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: UserBudget;
  onSaveBudget: (newBudget: UserBudget) => void;
  onResetData: () => void;
  isSecurityEnabled?: boolean;
  onOpenSecuritySettings?: () => void;
}

const BUDGET_PRESETS = [
  { label: "College / Fresher", amount: 15000 },
  { label: "Young Professional", amount: 35000 },
  { label: "Family / Household", amount: 65000 },
  { label: "High Earner", amount: 125000 },
];

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({
  isOpen,
  onClose,
  budget,
  onSaveBudget,
  onResetData,
  isSecurityEnabled = false,
  onOpenSecuritySettings,
}) => {
  const [monthlyBudget, setMonthlyBudget] = useState(budget.monthlyBudget.toString());
  const [monthlyIncome, setMonthlyIncome] = useState((budget.monthlyIncome || 50000).toString());
  const [savingsPercent, setSavingsPercent] = useState(budget.targetSavingsPercent || 20);
  const [salaryDay, setSalaryDay] = useState(budget.salaryDay || 1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBudget = parseFloat(monthlyBudget);
    const parsedIncome = parseFloat(monthlyIncome);
    if (isNaN(parsedBudget) || parsedBudget <= 0) return;

    onSaveBudget({
      ...budget,
      monthlyBudget: parsedBudget,
      monthlyIncome: isNaN(parsedIncome) ? undefined : parsedIncome,
      targetSavingsPercent: savingsPercent,
      salaryDay: salaryDay,
    });
    onClose();
  };

  return (
    <div
      id="budget-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="budget-settings-content"
        className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8EAED] p-5 sm:p-6 text-[#202124]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <h3 className="font-bold text-base text-[#202124]">Monthly Khata Settings</h3>
              <p className="text-xs text-[#5F6368]">Configure your monthly budget and limits</p>
            </div>
          </div>
          <button
            id="btn-close-budget-settings"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monthly Expense Budget Limit */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1">
              Monthly Spending Limit (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#1A73E8]">
                ₹
              </span>
              <input
                id="input-monthly-budget"
                type="number"
                required
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#F8F9FA] focus:bg-white text-base font-bold text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {BUDGET_PRESETS.map((p) => (
                <button
                  key={p.amount}
                  type="button"
                  id={`btn-preset-${p.amount}`}
                  onClick={() => setMonthlyBudget(p.amount.toString())}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F1F3F4] hover:bg-[#E8F0FE] text-[#3C4043] hover:text-[#1A73E8] transition-colors border border-[#E8EAED]"
                >
                  {p.label} ({formatINR(p.amount, true)})
                </button>
              ))}
            </div>
          </div>

          {/* Monthly In-Hand Income */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] mb-1">
              Monthly Net Salary / Income (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5F6368]">
                ₹
              </span>
              <input
                id="input-monthly-income"
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-8 pr-3 py-2 bg-[#F8F9FA] focus:bg-white text-sm text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
              />
            </div>
          </div>

          {/* Target Savings % */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#3C4043] mb-1">
              <span>Target Savings Goal:</span>
              <span className="text-[#1E8E3E] font-bold">{savingsPercent}% of Income</span>
            </div>
            <input
              id="range-savings-percent"
              type="range"
              min={10}
              max={60}
              step={5}
              value={savingsPercent}
              onChange={(e) => setSavingsPercent(Number(e.target.value))}
              className="w-full h-2 bg-[#E8EAED] rounded-lg appearance-none cursor-pointer accent-[#1E8E3E]"
            />
            <div className="flex justify-between text-[10px] text-[#5F6368] mt-1">
              <span>10% (Basic)</span>
              <span>20% (Standard 50-30-20)</span>
              <span>50% (Aggressive FIRE)</span>
            </div>
          </div>

          {/* App Privacy & Biometric Lock Shortcut */}
          {onOpenSecuritySettings && (
            <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#202124]">Privacy & Biometric Lock</h4>
                  <p className="text-[11px] text-[#5F6368]">
                    {isSecurityEnabled
                      ? "App is locked with PIN & Fingerprint"
                      : "Protect financial records with 4-digit PIN"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-open-security-from-budget"
                onClick={() => {
                  onClose();
                  onOpenSecuritySettings();
                }}
                className="px-3 py-1.5 bg-white hover:bg-[#E8F0FE] text-[#1A73E8] border border-[#DADCE0] hover:border-[#1A73E8] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {isSecurityEnabled ? "Manage PIN" : "Enable Lock"}
              </button>
            </div>
          )}

          {/* Reset sample data */}
          <div className="pt-2 border-t border-[#F1F3F4] flex items-center justify-between">
            <button
              type="button"
              id="btn-reset-sample-data"
              onClick={() => {
                if (window.confirm("Reset all expenses back to realistic Indian sample data?")) {
                  onResetData();
                  onClose();
                }
              }}
              className="text-xs text-[#5F6368] hover:text-[#EA4335] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Reset Sample Indian Spends</span>
            </button>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#F1F3F4] flex items-center justify-end gap-2">
            <button
              type="button"
              id="btn-cancel-budget"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-budget"
              className="px-5 py-2 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-full shadow-xs transition-colors cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
