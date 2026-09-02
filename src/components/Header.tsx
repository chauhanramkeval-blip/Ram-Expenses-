import React from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  Plus,
  ShieldCheck,
  Sparkles,
  FileSpreadsheet,
  FileText,
  Smartphone,
  Lock,
  Fingerprint,
  Mail,
  Cloud,
} from "lucide-react";
import { formatINR } from "../utils/formatters";
import { UserAccount } from "../types";
import { UserProfileMenu } from "./UserProfileMenu";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: "expenses" | "incomes" | "visuals" | "advisor";
  onTabChange: (tab: "expenses" | "incomes" | "visuals" | "advisor") => void;
  totalSpentThisMonth: number;
  totalIncomeThisMonth: number;
  monthlyBudget: number;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenPdfReportModal: () => void;
  onOpenExportModal: () => void;
  onOpenBackupModal: () => void;
  onOpenFirebaseSync?: () => void;
  onOpenInstallModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenCategoryManager?: () => void;
  isSecurityEnabled?: boolean;
  onOpenSecurityModal?: () => void;
  currentUser?: UserAccount;
  allUsers?: UserAccount[];
  onSwitchUser?: (user: UserAccount) => void;
  onOpenEditProfile?: () => void;
  onLogout?: () => void;
  onOpenNewAccountModal?: () => void;
  onLockSession?: () => void;
  isFirebaseOnline?: boolean;
  isFirebaseSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  totalSpentThisMonth,
  totalIncomeThisMonth,
  monthlyBudget,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenPdfReportModal,
  onOpenExportModal,
  onOpenBackupModal,
  onOpenFirebaseSync,
  onOpenInstallModal,
  onOpenBudgetModal,
  onOpenCategoryManager,
  isSecurityEnabled = false,
  onOpenSecurityModal,
  currentUser,
  allUsers = [],
  onSwitchUser = () => {},
  onOpenEditProfile = () => {},
  onLogout = () => {},
  onOpenNewAccountModal = () => {},
  onLockSession,
  isFirebaseOnline = true,
  isFirebaseSynced = true,
}) => {
  return (
    <header id="khata-app-header" className="sticky top-0 z-30 bg-white border-b border-[#E8EAED] shadow-xs w-full max-w-[100vw] overflow-x-hidden">
      {/* Top Google Files style bar */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-2.5 sm:pt-3 pb-2 w-full">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full">
          {/* Logo with Google 4-color vibe */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E8F0FE] flex items-center justify-center border border-[#D2E3FC] shrink-0">
              {/* Google 4 dots accent */}
              <div className="absolute -top-1 -right-1 flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
              </div>
              <span className="text-[#1A73E8] font-bold text-base sm:text-lg leading-none">₹</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#202124] flex items-center gap-1 leading-tight">
                  Khata
                  <span className="text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded bg-[#E8F0FE] text-[#1A73E8]">
                    India
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-[#5F6368] font-medium hidden md:block">
                Daily Expense & Smart Finance Tracker
              </p>
            </div>
          </div>

          {/* Search bar styled like Google Files */}
          <div className="flex-1 min-w-0 max-w-xs sm:max-w-md mx-1 sm:mx-2">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368] shrink-0" size={15} />
              <input
                id="khata-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 bg-[#F1F3F4] hover:bg-[#E8EAED] focus:bg-white text-xs sm:text-sm text-[#202124] placeholder-[#5F6368] rounded-full transition-colors border border-transparent focus:border-[#1A73E8] focus:shadow-xs outline-none truncate"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#202124] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {onOpenFirebaseSync && (
              <button
                id="btn-cloud-sync-header"
                onClick={onOpenFirebaseSync}
                title={
                  !isFirebaseOnline
                    ? "Offline Mode - Click to view sync status"
                    : isFirebaseSynced
                    ? "Cloud Firestore Synced - Click to manage"
                    : "Syncing changes to Firestore..."
                }
                className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] rounded-full transition-colors cursor-pointer border border-[#D2E3FC] relative"
              >
                <Cloud size={14} />
                <span className="hidden md:inline">Cloud Sync</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    !isFirebaseOnline
                      ? "bg-[#FBBC04]"
                      : isFirebaseSynced
                      ? "bg-[#188038]"
                      : "bg-[#1A73E8] animate-ping"
                  }`}
                />
              </button>
            )}
            <button
              id="btn-pdf-statement-header"
              onClick={onOpenPdfReportModal}
              title="Generate PDF Statement for WhatsApp / Email"
              className="hidden xs:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#EA4335] bg-[#FCE8E6] hover:bg-[#FAD2CF] rounded-full transition-colors cursor-pointer border border-[#FAD2CF]"
            >
              <FileText size={14} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              id="btn-backup-email-header"
              onClick={onOpenBackupModal}
              title="Export / Email Backup"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] rounded-full transition-colors cursor-pointer border border-[#D2E3FC]"
            >
              <Mail size={14} />
              <span className="hidden lg:inline">Backup</span>
            </button>
            <button
              id="btn-export-csv-header"
              onClick={onOpenExportModal}
              title="Export Expenses to CSV"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#137333] bg-[#E6F4EA] hover:bg-[#CEEAD6] rounded-full transition-colors cursor-pointer border border-[#CEEAD6]"
            >
              <FileSpreadsheet size={14} />
              <span>CSV</span>
            </button>
            {onOpenCategoryManager && (
              <button
                id="btn-category-manager-header"
                onClick={onOpenCategoryManager}
                title="Manage Categories"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#5F6368] hover:text-[#1A73E8] bg-[#F1F3F4] hover:bg-[#E8F0FE] rounded-full transition-colors cursor-pointer border border-[#DADCE0]"
              >
                <span>🏷️</span>
              </button>
            )}
            {onOpenSecurityModal && (
              <button
                id="btn-security-lock-header"
                onClick={onOpenSecurityModal}
                title={
                  isSecurityEnabled
                    ? "App Lock Active"
                    : "Configure App PIN Lock"
                }
                className={`p-1.5 sm:p-2 rounded-full transition-colors relative cursor-pointer ${
                  isSecurityEnabled
                    ? "text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] border border-[#D2E3FC]"
                    : "text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#F1F3F4]"
                }`}
              >
                <ShieldCheck size={16} className={isSecurityEnabled ? "text-[#1A73E8]" : ""} />
                {isSecurityEnabled && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white"></span>
                )}
              </button>
            )}
            <button
              id="btn-budget-settings"
              onClick={onOpenBudgetModal}
              title="Budget Settings"
              className="p-1.5 sm:p-2 text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
            >
              <SlidersHorizontal size={16} />
            </button>

            {/* User Profile Menu Avatar Button */}
            <UserProfileMenu
              currentUser={currentUser}
              allUsers={allUsers}
              onSwitchUser={onSwitchUser}
              onOpenEditProfile={onOpenEditProfile}
              onOpenSecurityModal={onOpenSecurityModal || (() => {})}
              onOpenBackupModal={onOpenBackupModal}
              onOpenFirebaseSync={onOpenFirebaseSync}
              onLogout={onLogout}
              onOpenNewAccountModal={onOpenNewAccountModal}
              onLockSession={onLockSession}
            />
          </div>
        </div>

        {/* Navigation Tabs (Google Files / Material 3 style segmented pills) */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto no-scrollbar pb-1 w-full max-w-full">
          <button
            id="tab-btn-expenses"
            onClick={() => onTabChange("expenses")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "expenses"
                ? "bg-[#E8F0FE] text-[#1A73E8] shadow-2xs font-bold"
                : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
            }`}
          >
            <span>📋 Daily Expenses</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "expenses" ? "bg-[#1A73E8] text-white" : "bg-[#E8EAED] text-[#5F6368]"
              }`}
            >
              {formatINR(totalSpentThisMonth, true)}
            </span>
          </button>

          <button
            id="tab-btn-incomes"
            onClick={() => onTabChange("incomes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "incomes"
                ? "bg-[#E6F4EA] text-[#0F9D58] shadow-2xs font-bold"
                : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
            }`}
          >
            <span>💰 Income & Inflow</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "incomes" ? "bg-[#0F9D58] text-white" : "bg-[#E6F4EA] text-[#0F9D58] font-bold"
              }`}
            >
              +{formatINR(totalIncomeThisMonth, true)}
            </span>
          </button>

          <button
            id="tab-btn-visuals"
            onClick={() => onTabChange("visuals")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "visuals"
                ? "bg-[#E8F0FE] text-[#1A73E8] shadow-2xs font-bold"
                : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
            }`}
          >
            <span>📊 Charts & Insights</span>
            <span className="w-2 h-2 rounded-full bg-[#1E8E3E]"></span>
          </button>

          <button
            id="tab-btn-advisor"
            onClick={() => onTabChange("advisor")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "advisor"
                ? "bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3] shadow-2xs font-bold"
                : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
            }`}
          >
            <Sparkles size={14} className="text-[#F9AB00]" />
            <span>AI Finance Advisor</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FEEFC3] text-[#B06000] font-bold">
              Daily
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
