import React from "react";
import { Plus, ListFilter, PieChart, Sparkles, Wallet, ArrowDownRight } from "lucide-react";

interface BottomNavProps {
  activeTab: "transactions" | "expenses" | "incomes" | "visuals" | "advisor";
  onTabChange: (tab: "transactions" | "expenses" | "incomes" | "visuals" | "advisor") => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddExpense,
  onOpenAddIncome,
}) => {
  return (
    <>
      {/* Floating Action Buttons (FAB) - Google Material Design 3 */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-8 z-40 flex flex-col items-end gap-2.5">
        {activeTab === "incomes" ? (
          <button
            id="khata-fab-add-income"
            onClick={onOpenAddIncome}
            title="Add New Income / Inflow"
            className="flex items-center gap-2 px-5 py-3.5 bg-[#0F9D58] hover:bg-[#0B8043] active:scale-95 text-white font-bold text-sm rounded-2xl shadow-xl shadow-[#0F9D58]/30 transition-all cursor-pointer border border-[#CEEAD6]/30"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>Add Income</span>
          </button>
        ) : (
          <button
            id="khata-fab-add-expense"
            onClick={onOpenAddExpense}
            title="Add New Expense"
            className="flex items-center gap-2 px-5 py-3.5 bg-[#1A73E8] hover:bg-[#1557B0] active:scale-95 text-white font-bold text-sm rounded-2xl shadow-xl shadow-[#1A73E8]/30 transition-all cursor-pointer border border-[#D2E3FC]/20"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>Add Spend</span>
          </button>
        )}
      </div>

      {/* Bottom Navigation Bar (Visible on mobile/tablet) */}
      <nav
        id="khata-mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8EAED] px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        <button
          id="mobile-nav-transactions"
          onClick={() => onTabChange("transactions")}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "transactions" || activeTab === "expenses"
              ? "text-[#1A73E8] font-bold"
              : "text-[#5F6368]"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              activeTab === "transactions" || activeTab === "expenses" ? "bg-[#E8F0FE]" : ""
            }`}
          >
            <ListFilter size={16} />
          </div>
          <span className="text-[10px]">Transactions</span>
        </button>

        <button
          id="mobile-nav-incomes"
          onClick={() => onTabChange("incomes")}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "incomes" ? "text-[#0F9D58] font-bold" : "text-[#5F6368]"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              activeTab === "incomes" ? "bg-[#E6F4EA]" : ""
            }`}
          >
            <Wallet size={16} />
          </div>
          <span className="text-[10px]">Incomes</span>
        </button>

        <button
          id="mobile-nav-visuals"
          onClick={() => onTabChange("visuals")}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "visuals" ? "text-[#1A73E8] font-bold" : "text-[#5F6368]"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              activeTab === "visuals" ? "bg-[#E8F0FE]" : ""
            }`}
          >
            <PieChart size={16} />
          </div>
          <span className="text-[10px]">Charts</span>
        </button>

        <button
          id="mobile-nav-advisor"
          onClick={() => onTabChange("advisor")}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "advisor" ? "text-[#B06000] font-bold" : "text-[#5F6368]"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              activeTab === "advisor" ? "bg-[#FEF7E0]" : ""
            }`}
          >
            <Sparkles size={16} className={activeTab === "advisor" ? "text-[#F9AB00]" : ""} />
          </div>
          <span className="text-[10px]">Advisor</span>
        </button>
      </nav>
    </>
  );
};
