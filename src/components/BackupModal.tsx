import React, { useState, useRef } from "react";
import {
  X,
  Mail,
  Download,
  Upload,
  Check,
  FileCode,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Send,
  Copy,
} from "lucide-react";
import { Expense, Income, UserBudget, UserAccount, CategoryMeta, IncomeCategoryMeta } from "../types";
import { formatINR } from "../utils/formatters";
import {
  createBackupObject,
  formatBackupSummaryText,
  downloadJsonBackupFile,
  openEmailBackupClient,
  validateAndParseBackupJson,
  KhataFullBackupData,
} from "../utils/backup";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  incomes: Income[];
  budget: UserBudget;
  currentUser: UserAccount;
  customExpenseCategories?: CategoryMeta[];
  customIncomeCategories?: IncomeCategoryMeta[];
  onRestoreBackup?: (backupData: KhataFullBackupData, mode: "replace" | "merge") => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  expenses,
  incomes,
  budget,
  currentUser,
  customExpenseCategories,
  customIncomeCategories,
  onRestoreBackup,
}) => {
  const [activeTab, setActiveTab] = useState<"email_backup" | "json_file" | "restore">("email_backup");
  const [recipientEmail, setRecipientEmail] = useState(currentUser.email || "chauhanramkeval@gmail.com");
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{ type: "success" | "error" | ""; message: string }>({
    type: "",
    message: "",
  });
  const [restoreMode, setRestoreMode] = useState<"replace" | "merge">("replace");
  const [pendingRestoreData, setPendingRestoreData] = useState<KhataFullBackupData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Build current backup object
  const backupData = createBackupObject(
    expenses,
    incomes,
    budget,
    currentUser,
    customExpenseCategories,
    customIncomeCategories
  );

  const summaryText = formatBackupSummaryText(backupData);
  const jsonString = JSON.stringify(backupData, null, 2);

  const dateObj = new Date(backupData.exportDate);
  const formattedDate = dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const subjectLine = `App Backup - ${formattedDate}`;

  // Handle Send Email
  const handleSendEmail = () => {
    openEmailBackupClient(backupData, recipientEmail || "chauhanramkeval@gmail.com");
  };

  // Handle Download JSON
  const handleDownloadJson = () => {
    downloadJsonBackupFile(backupData);
  };

  // Handle Copy Summary
  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Handle Copy JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  // Handle File Upload for Restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreStatus({ type: "", message: "" });
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateAndParseBackupJson(content);
      if (result.success && result.data) {
        setPendingRestoreData(result.data);
        setRestoreStatus({
          type: "success",
          message: `Valid backup detected: ${result.data.expenses?.length || 0} expenses, ${
            result.data.incomes?.length || 0
          } incomes. Choose restore mode below.`,
        });
      } else {
        setPendingRestoreData(null);
        setRestoreStatus({
          type: "error",
          message: result.error || "Failed to parse backup JSON file.",
        });
      }
    };
    reader.readAsText(file);
  };

  // Confirm Restore Action
  const handleConfirmRestore = () => {
    if (!pendingRestoreData || !onRestoreBackup) return;
    onRestoreBackup(pendingRestoreData, restoreMode);
    setRestoreStatus({
      type: "success",
      message: `Successfully restored ${pendingRestoreData.expenses.length} records!`,
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      id="backup-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/50 backdrop-blur-xs animate-fadeIn text-[#202124]"
      onClick={onClose}
    >
      <div
        id="backup-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E8EAED] animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F1F3F4] bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold shadow-2xs border border-[#D2E3FC]">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#202124] flex items-center gap-1.5">
                <span>Export / Email Backup</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                  Encrypted
                </span>
              </h3>
              <p className="text-xs text-[#5F6368]">Send email summary or download .json backup</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-backup-modal"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-[#F1F3F4] border-b border-[#E8EAED]">
          <button
            type="button"
            id="tab-btn-email-backup"
            onClick={() => setActiveTab("email_backup")}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "email_backup"
                ? "bg-white text-[#1A73E8] shadow-2xs"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            <Send size={13} />
            <span>Email Backup</span>
          </button>
          <button
            type="button"
            id="tab-btn-json-file"
            onClick={() => setActiveTab("json_file")}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "json_file"
                ? "bg-white text-[#1A73E8] shadow-2xs"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            <FileCode size={13} />
            <span>Download .JSON</span>
          </button>
          <button
            type="button"
            id="tab-btn-restore-json"
            onClick={() => setActiveTab("restore")}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "restore"
                ? "bg-white text-[#188038] shadow-2xs"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            <Upload size={13} />
            <span>Restore Backup</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 bg-[#F8F9FA] p-3 rounded-2xl border border-[#E8EAED] text-center">
            <div>
              <span className="text-[10px] text-[#5F6368] block">Total Spends</span>
              <span className="text-xs font-bold text-[#C5221F]">
                {formatINR(backupData.stats.totalExpensesAmount)}
              </span>
              <span className="text-[9px] text-[#80868B] block">({expenses.length} records)</span>
            </div>
            <div>
              <span className="text-[10px] text-[#5F6368] block">Total Income</span>
              <span className="text-xs font-bold text-[#137333]">
                {formatINR(backupData.stats.totalIncomesAmount)}
              </span>
              <span className="text-[9px] text-[#80868B] block">({incomes.length} records)</span>
            </div>
            <div>
              <span className="text-[10px] text-[#5F6368] block">Net Balance</span>
              <span className="text-xs font-bold text-[#1A73E8]">
                {formatINR(backupData.stats.netBalance)}
              </span>
              <span className="text-[9px] text-[#80868B] block">Khata balance</span>
            </div>
          </div>

          {/* TAB 1: Email Backup (mailto:) */}
          {activeTab === "email_backup" && (
            <div className="space-y-3.5 animate-fadeIn">
              <div>
                <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                  Recipient Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6368]" size={15} />
                  <input
                    id="input-backup-recipient"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="chauhanramkeval@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                  />
                </div>
              </div>

              {/* Email Pre-fill Details Card */}
              <div className="p-3 bg-[#E8F0FE]/50 rounded-2xl border border-[#D2E3FC] space-y-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#5F6368] font-semibold w-16">Subject:</span>
                  <span className="font-mono text-[11px] font-bold text-[#1A73E8] truncate">
                    {subjectLine}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#5F6368] font-semibold w-16">To:</span>
                  <span className="font-mono text-[11px] text-[#202124]">{recipientEmail}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#5F6368] font-semibold w-16">Format:</span>
                  <span className="text-[11px] text-[#5F6368]">
                    Formatted Text Summary + Category Breakdown + Recent Logs
                  </span>
                </div>
              </div>

              {/* Summary Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#5F6368]">
                    Email Body Content Preview
                  </label>
                  <button
                    type="button"
                    id="btn-copy-summary"
                    onClick={handleCopySummary}
                    className="text-[11px] font-bold text-[#1A73E8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSummary ? <Check size={12} className="text-[#188038]" /> : <Copy size={12} />}
                    <span>{copiedSummary ? "Copied!" : "Copy Body Text"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={summaryText}
                  rows={6}
                  className="w-full p-2.5 bg-[#F8F9FA] text-[#202124] font-mono text-[11px] rounded-xl border border-[#DADCE0] outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                id="btn-open-mailto-link"
                onClick={handleSendEmail}
                className="w-full py-3 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Send size={16} />
                <span>Open Email App & Send Backup</span>
                <ExternalLink size={14} className="opacity-75" />
              </button>

              <p className="text-[10px] text-center text-[#5F6368]">
                Opens Gmail / Apple Mail / Outlook with your pre-filled subject and data summary
              </p>
            </div>
          )}

          {/* TAB 2: JSON File Download */}
          {activeTab === "json_file" && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] text-[#137333] flex items-center justify-center font-bold">
                    <FileCode size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#202124]">Full JSON Data Export</h4>
                    <p className="text-[11px] text-[#5F6368]">
                      Complete structured backup including expenses, incomes, categories & limits
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-[#5F6368] space-y-1 pt-1 border-t border-[#E8EAED]">
                  <p>• Compatible with 100% accurate one-click restoration.</p>
                  <p>• Can be stored in Google Drive, USB drives, or local PC/Mobile storage.</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#5F6368]">
                    Raw JSON Structure
                  </label>
                  <button
                    type="button"
                    id="btn-copy-json"
                    onClick={handleCopyJson}
                    className="text-[11px] font-bold text-[#1A73E8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedJson ? <Check size={12} className="text-[#188038]" /> : <Copy size={12} />}
                    <span>{copiedJson ? "Copied JSON!" : "Copy JSON"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={jsonString}
                  rows={6}
                  className="w-full p-2.5 bg-[#F8F9FA] text-[#202124] font-mono text-[10px] rounded-xl border border-[#DADCE0] outline-none resize-none"
                />
              </div>

              {/* Download JSON Button */}
              <button
                type="button"
                id="btn-download-json-file"
                onClick={handleDownloadJson}
                className="w-full py-3 bg-[#188038] hover:bg-[#137333] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download size={16} />
                <span>Download .JSON Backup File</span>
              </button>
            </div>
          )}

          {/* TAB 3: Restore Backup */}
          {activeTab === "restore" && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-4 bg-[#FEF7E0] border border-[#FEEFC3] rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FBBC04]/20 text-[#B06000] flex items-center justify-center font-bold">
                    <Upload size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#202124]">Restore From JSON Backup</h4>
                    <p className="text-[11px] text-[#5F6368]">
                      Upload your previously downloaded Khata .json file
                    </p>
                  </div>
                </div>
              </div>

              {/* Hidden File Input & Upload Trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#DADCE0] hover:border-[#1A73E8] bg-[#F8F9FA] hover:bg-[#E8F0FE]/30 rounded-2xl p-6 text-center cursor-pointer transition-colors"
              >
                <Upload size={24} className="mx-auto text-[#1A73E8] mb-2" />
                <p className="text-xs font-bold text-[#202124]">Click to Browse JSON Backup File</p>
                <p className="text-[11px] text-[#5F6368] mt-0.5">Supports Khata_Backup_*.json files</p>
              </div>

              {/* Status Message */}
              {restoreStatus.message && (
                <div
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                    restoreStatus.type === "success"
                      ? "bg-[#E6F4EA] border-[#CEEAD6] text-[#137333]"
                      : "bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]"
                  }`}
                >
                  {restoreStatus.type === "success" ? (
                    <CheckCircle2 size={16} className="shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0" />
                  )}
                  <span>{restoreStatus.message}</span>
                </div>
              )}

              {/* Restore Configuration Options */}
              {pendingRestoreData && (
                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-3 animate-fadeIn">
                  <label className="text-xs font-bold text-[#202124] block">
                    Restore Strategy:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode("replace")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        restoreMode === "replace"
                          ? "bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] font-bold"
                          : "bg-white border-[#E8EAED] text-[#5F6368]"
                      }`}
                    >
                      <span className="block text-xs">Replace Current Data</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        Clean restore from backup
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestoreMode("merge")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        restoreMode === "merge"
                          ? "bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] font-bold"
                          : "bg-white border-[#E8EAED] text-[#5F6368]"
                      }`}
                    >
                      <span className="block text-xs">Merge with Existing</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        Combine unique records
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    id="btn-confirm-restore"
                    onClick={handleConfirmRestore}
                    className="w-full py-2.5 bg-[#188038] hover:bg-[#137333] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={15} />
                    <span>Apply & Restore Ledger</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F8F9FA] border-t border-[#F1F3F4] flex items-center justify-between text-xs text-[#5F6368]">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheck size={14} className="text-[#188038]" />
            <span>100% Client-Side Privacy</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#5F6368] hover:bg-[#E8EAED] rounded-full transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
