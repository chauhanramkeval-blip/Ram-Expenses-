import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Trash2,
  RefreshCw,
  Plus,
  Info,
  Check,
  Search,
  Filter,
  Layers,
  HelpCircle,
  FileCode,
  Calendar,
  CreditCard,
  Building2,
  IndianRupee,
} from "lucide-react";
import { Expense, Income, UserAccount } from "../types";
import { formatINR } from "../utils/formatters";
import { CATEGORY_LIST, INCOME_CATEGORY_LIST } from "../data/categories";
import {
  ParsedStatementTransaction,
  ParseStatementResult,
  parseBankStatement,
  convertParsedToLedger,
} from "../services/statementParser";

interface BankStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingExpenses: Expense[];
  existingIncomes: Income[];
  currentUser?: UserAccount | null;
  onImportSuccess: (imported: {
    expenses: Expense[];
    incomes: Income[];
    count: number;
    message: string;
  }) => void;
}

export const BankStatementModal: React.FC<BankStatementModalProps> = ({
  isOpen,
  onClose,
  existingExpenses,
  existingIncomes,
  currentUser,
  onImportSuccess,
}) => {
  const [step, setStep] = useState<"upload" | "analyzing" | "review">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [analyzingText, setAnalyzingText] = useState("Analyzing statement with Gemini AI...");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Extracted transactions in review mode
  const [transactions, setTransactions] = useState<ParsedStatementTransaction[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "EXPENSE" | "INCOME" | "DUPLICATES">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process File with Gemini AI
  const handleProcessFile = async (file: File) => {
    setSelectedFileName(file.name);
    setStep("analyzing");
    setErrorNotice(null);
    setAnalyzingText("Analyzing statement with Gemini AI...");

    try {
      // Dynamic progress messages
      const progressTimer1 = setTimeout(() => {
        setAnalyzingText("Extracting tabular transactions, dates & amounts...");
      }, 1500);

      const progressTimer2 = setTimeout(() => {
        setAnalyzingText("Intelligently classifying credits (Income) & debits (Expenses)...");
      }, 3200);

      const result = await parseBankStatement(
        file,
        existingExpenses,
        existingIncomes,
        currentUser?.id
      );

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);

      if (!result.success || result.transactions.length === 0) {
        throw new Error(result.error || "No transactions could be detected in this document.");
      }

      setTransactions(result.transactions);
      setStep("review");
    } catch (err: any) {
      console.error("Statement parse failed:", err);
      setErrorNotice(err?.message || "Failed to parse bank statement. Please try again with another file.");
      setStep("upload");
    }
  };

  // Sample Demo Statement for 1-click testing
  const handleLoadDemoStatement = async () => {
    const demoCsvContent = `Date,Narration,Chq/Ref No,Value Dt,Withdrawal Amt,Deposit Amt,Closing Balance
01/09/2026,SALARY CREDIT FROM GOOGLE INDIA PVT LTD,NEFT-8392019,01/09/2026,,85000.00,125000.00
02/09/2026,UPI-SWIGGY BANGALORE-SWIGGY@HDFC,UPI-9920182,02/09/2026,450.00,,124550.00
03/09/2026,UPI-BLINKIT GROCERIES-BLINKIT@AXIS,UPI-7748291,03/09/2026,780.00,,123770.00
04/09/2026,BESCOM ELECTRICITY BILL PAYMENT,BILL-9928374,04/09/2026,1850.00,,121920.00
05/09/2026,FREELANCE UI UX CONSULTING RETAINER,NEFT-1192839,05/09/2026,,22500.00,144420.00
06/09/2026,UPI-CHAI POINT INDIRANAGAR-CHAIPOINT@ICICI,UPI-4492018,06/09/2026,120.00,,144300.00
06/09/2026,AMAZON INDIA SHOPPING ELECTRONICS,CARD-2938472,06/09/2026,2499.00,,141801.00`;

    const blob = new Blob([demoCsvContent], { type: "text/csv" });
    const demoFile = new File([blob], "HDFC_Bank_Statement_Sept2026.csv", { type: "text/csv" });
    await handleProcessFile(demoFile);
  };

  // Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  // Select all or Deselect all
  const handleSelectAll = (select: boolean) => {
    setTransactions((prev) =>
      prev.map((t) => (t.isDuplicate && select ? t : { ...t, selected: select }))
    );
  };

  // Update item field
  const handleUpdateItem = (
    id: string,
    field: keyof ParsedStatementTransaction,
    value: any
  ) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value };
        // If type changed, adapt default category
        if (field === "type") {
          if (value === "INCOME" && !INCOME_CATEGORY_LIST.some((c) => c.name === updated.category)) {
            updated.category = "Salary & Bonus";
          } else if (value === "EXPENSE" && !CATEGORY_LIST.some((c) => c.name === updated.category)) {
            updated.category = "Other Spends";
          }
        }
        return updated;
      })
    );
  };

  // Remove row
  const handleDeleteRow = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Add new blank row manually
  const handleAddNewRow = () => {
    const today = new Date().toISOString().split("T")[0];
    const newTx: ParsedStatementTransaction = {
      id: `manual_${Date.now()}`,
      date: today,
      description: "New Transaction",
      type: "EXPENSE",
      amount: 100,
      category: "Other Spends",
      payment_mode: "UPI",
      selected: true,
      isDuplicate: false,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Filtered transactions for review
  const displayedTransactions = transactions.filter((t) => {
    if (filterType === "EXPENSE" && t.type !== "EXPENSE") return false;
    if (filterType === "INCOME" && t.type !== "INCOME") return false;
    if (filterType === "DUPLICATES" && !t.isDuplicate) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      const matchAmt = String(t.amount).includes(q);
      const matchDate = t.date?.includes(q);
      if (!matchDesc && !matchCat && !matchAmt && !matchDate) return false;
    }

    return true;
  });

  // Selected totals
  const selectedItems = transactions.filter((t) => t.selected);
  const selectedIncomes = selectedItems.filter((t) => t.type === "INCOME");
  const selectedExpenses = selectedItems.filter((t) => t.type === "EXPENSE");
  const totalInflow = selectedIncomes.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalOutflow = selectedExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const duplicatesCount = transactions.filter((t) => t.isDuplicate).length;

  // Final confirmation & save
  const handleFinalImport = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one transaction to import.");
      return;
    }

    const { expenses: newExp, incomes: newInc } = convertParsedToLedger(
      selectedItems,
      currentUser?.id
    );

    const message = `Successfully imported ${selectedItems.length} transactions (${newInc.length} Income credits: ${formatINR(
      totalInflow
    )}, ${newExp.length} Expense debits: ${formatINR(totalOutflow)}) into your ledger!`;

    onImportSuccess({
      expenses: newExp,
      incomes: newInc,
      count: selectedItems.length,
      message,
    });

    onClose();
  };

  return (
    <div
      id="bank-statement-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="bank-statement-modal-container"
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E8EAED] text-[#202124] animate-scaleUp overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#F1F3F4] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC] shadow-xs">
              <Sparkles size={20} className="text-[#1A73E8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-[#202124]">
                  Upload & Auto-Parse Bank Statement
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]">
                  <Sparkles size={11} />
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-[#5F6368]">
                Extract all debits & credits automatically from PDF, CSV, or screenshots
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* STEP 1: UPLOAD SCREEN */}
          {step === "upload" && (
            <div className="space-y-5">
              {errorNotice && (
                <div className="p-3.5 rounded-2xl bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF] text-xs flex items-start gap-2.5">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Extraction Error:</strong> {errorNotice}
                  </div>
                </div>
              )}

              {/* Upload Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  dragOver
                    ? "border-[#1A73E8] bg-[#E8F0FE]/50 scale-[1.01]"
                    : "border-[#DADCE0] hover:border-[#1A73E8] bg-[#F8F9FA] hover:bg-[#E8F0FE]/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.csv,.jpg,.jpeg,.png,.webp,text/csv,application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-3xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC] shadow-sm">
                  <UploadCloud size={32} />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#202124]">
                    Click to select bank statement or drag & drop here
                  </h4>
                  <p className="text-xs text-[#5F6368]">
                    Supports official PDF statements, CSV exports, or clear scanned photos (Max 25MB)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="px-2.5 py-1 bg-white border border-[#DADCE0] rounded-lg text-[11px] font-semibold text-[#5F6368] flex items-center gap-1.5 shadow-2xs">
                    <FileText size={13} className="text-[#EA4335]" /> PDF Statement
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-[#DADCE0] rounded-lg text-[11px] font-semibold text-[#5F6368] flex items-center gap-1.5 shadow-2xs">
                    <FileSpreadsheet size={13} className="text-[#137333]" /> CSV Spreadsheet
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-[#DADCE0] rounded-lg text-[11px] font-semibold text-[#5F6368] flex items-center gap-1.5 shadow-2xs">
                    <FileCode size={13} className="text-[#1A73E8]" /> JPG / PNG Screenshot
                  </span>
                </div>
              </div>

              {/* Instant Demo Statement & Supported Banks */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED]">
                <div className="flex items-center gap-2.5 text-xs text-[#5F6368]">
                  <Building2 size={16} className="text-[#1A73E8] shrink-0" />
                  <span>Works seamlessly with HDFC, SBI, ICICI, Axis, Kotak, PNB & UPI apps</span>
                </div>

                <button
                  type="button"
                  id="btn-load-demo-statement"
                  onClick={handleLoadDemoStatement}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Sparkles size={14} />
                  <span>Try Sample Statement (1-Click)</span>
                </button>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl border border-[#E8EAED] bg-white text-left space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-[#E6F4EA] text-[#137333] flex items-center justify-center font-bold text-xs">
                    <TrendingUp size={14} />
                  </div>
                  <h5 className="font-bold text-xs text-[#202124]">Automatic Credit / Debit Split</h5>
                  <p className="text-[11px] text-[#5F6368] leading-tight">
                    Incomes go directly to Inflow; expenses to Outflow columns.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-[#E8EAED] bg-white text-left space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold text-xs">
                    <Sparkles size={14} />
                  </div>
                  <h5 className="font-bold text-xs text-[#202124]">Smart Categorization</h5>
                  <p className="text-[11px] text-[#5F6368] leading-tight">
                    AI tags Kirana, Swiggy, Bills, Salary, Metro & SIP accurately.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-[#E8EAED] bg-white text-left space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-[#FEF7E0] text-[#B06000] flex items-center justify-center font-bold text-xs">
                    <CheckCircle2 size={14} />
                  </div>
                  <h5 className="font-bold text-xs text-[#202124]">Duplicate Protection</h5>
                  <p className="text-[11px] text-[#5F6368] leading-tight">
                    Flags existing records so you never double-count transactions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ANALYZING SPINNER */}
          {step === "analyzing" && (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-[#E8F0FE] border-t-[#1A73E8] animate-spin flex items-center justify-center" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={24} className="text-[#1A73E8] animate-pulse" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-md">
                <h4 className="font-bold text-base sm:text-lg text-[#202124]">
                  Analyzing statement with Gemini AI...
                </h4>
                <p className="text-xs sm:text-sm text-[#5F6368] transition-all">
                  {analyzingText}
                </p>
                <p className="text-[11px] text-[#80868B] font-mono pt-1">
                  Processing: {selectedFileName}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & VERIFICATION MODAL */}
          {step === "review" && (
            <div className="space-y-4">
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#E8EAED]">
                  <span className="text-[11px] text-[#5F6368] font-medium block">Total Detected</span>
                  <span className="text-base sm:text-lg font-bold text-[#202124]">
                    {transactions.length} items
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#E6F4EA] border border-[#CEEAD6]">
                  <span className="text-[11px] text-[#137333] font-medium flex items-center gap-1">
                    <TrendingUp size={12} /> Total Inflow (Credit)
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#137333]">
                    {formatINR(totalInflow)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#FCE8E6] border border-[#FAD2CF]">
                  <span className="text-[11px] text-[#C5221F] font-medium flex items-center gap-1">
                    <TrendingDown size={12} /> Total Outflow (Debit)
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#C5221F]">
                    {formatINR(totalOutflow)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#E8F0FE] border border-[#D2E3FC]">
                  <span className="text-[11px] text-[#1A73E8] font-medium block">Ready to Import</span>
                  <span className="text-base sm:text-lg font-bold text-[#1A73E8]">
                    {selectedItems.length} selected
                  </span>
                </div>
              </div>

              {/* Duplicate Notice if any */}
              {duplicatesCount > 0 && (
                <div className="p-3 rounded-2xl bg-[#FEF7E0] border border-[#FEEFC3] text-xs text-[#B06000] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>
                      <strong>{duplicatesCount} potential duplicate(s)</strong> detected from your existing records and unchecked by default.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterType(filterType === "DUPLICATES" ? "ALL" : "DUPLICATES")}
                    className="font-bold underline cursor-pointer text-[#703800] hover:text-black ml-2"
                  >
                    {filterType === "DUPLICATES" ? "Show All" : "View Duplicates"}
                  </button>
                </div>
              )}

              {/* Toolbar: Search, Filters, Selection Toggles */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setFilterType("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      filterType === "ALL"
                        ? "bg-[#202124] text-white border-[#202124]"
                        : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F8F9FA]"
                    }`}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("INCOME")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      filterType === "INCOME"
                        ? "bg-[#137333] text-white border-[#137333]"
                        : "bg-white text-[#137333] border-[#CEEAD6] hover:bg-[#E6F4EA]"
                    }`}
                  >
                    Credits ({transactions.filter((t) => t.type === "INCOME").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("EXPENSE")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      filterType === "EXPENSE"
                        ? "bg-[#C5221F] text-white border-[#C5221F]"
                        : "bg-white text-[#C5221F] border-[#FAD2CF] hover:bg-[#FCE8E6]"
                    }`}
                  >
                    Debits ({transactions.filter((t) => t.type === "EXPENSE").length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5F6368]" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:outline-none focus:border-[#1A73E8] focus:bg-white text-[#202124]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1.5 bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] text-[#3C4043] rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1.5 bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] text-[#3C4043] rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Transactions Review Table */}
              <div className="border border-[#E8EAED] rounded-2xl overflow-hidden bg-white shadow-xs max-h-[48vh] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8F9FA] text-[#5F6368] font-bold border-b border-[#E8EAED] sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={displayedTransactions.length > 0 && displayedTransactions.every((t) => t.selected)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setTransactions((prev) =>
                              prev.map((t) => {
                                if (displayedTransactions.some((dt) => dt.id === t.id)) {
                                  return { ...t, selected: checked };
                                }
                                return t;
                              })
                            );
                          }}
                          className="rounded text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-28">Date</th>
                      <th className="p-3">Narration / Merchant</th>
                      <th className="p-3 w-28 text-center">Type</th>
                      <th className="p-3 w-40">Category</th>
                      <th className="p-3 w-28">Mode</th>
                      <th className="p-3 w-28 text-right">Amount</th>
                      <th className="p-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F4]">
                    {displayedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-[#5F6368]">
                          No transactions found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      displayedTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className={`hover:bg-[#F8F9FA] transition-colors ${
                            tx.isDuplicate ? "bg-[#FEF7E0]/30" : ""
                          } ${!tx.selected ? "opacity-60" : ""}`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!tx.selected}
                              onChange={() => handleToggleSelect(tx.id)}
                              className="rounded text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
                            />
                          </td>

                          {/* Date */}
                          <td className="p-3">
                            <input
                              type="date"
                              value={tx.date}
                              onChange={(e) => handleUpdateItem(tx.id, "date", e.target.value)}
                              className="w-full bg-transparent border border-transparent hover:border-[#DADCE0] focus:border-[#1A73E8] focus:bg-white rounded-lg px-1.5 py-1 text-xs font-mono font-medium text-[#202124]"
                            />
                          </td>

                          {/* Description */}
                          <td className="p-3">
                            <div className="space-y-0.5">
                              <input
                                type="text"
                                value={tx.description}
                                onChange={(e) => handleUpdateItem(tx.id, "description", e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-[#DADCE0] focus:border-[#1A73E8] focus:bg-white rounded-lg px-2 py-1 text-xs font-semibold text-[#202124]"
                              />
                              {tx.isDuplicate && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]">
                                  <AlertTriangle size={10} />
                                  Already in Ledger
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Type toggle */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(
                                  tx.id,
                                  "type",
                                  tx.type === "INCOME" ? "EXPENSE" : "INCOME"
                                )
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all ${
                                tx.type === "INCOME"
                                  ? "bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]"
                                  : "bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]"
                              }`}
                            >
                              {tx.type === "INCOME" ? (
                                <>
                                  <TrendingUp size={12} /> Credit
                                </>
                              ) : (
                                <>
                                  <TrendingDown size={12} /> Debit
                                </>
                              )}
                            </button>
                          </td>

                          {/* Category select */}
                          <td className="p-3">
                            <select
                              value={tx.category}
                              onChange={(e) => handleUpdateItem(tx.id, "category", e.target.value)}
                              className="w-full bg-[#F8F9FA] hover:bg-white border border-[#DADCE0] focus:border-[#1A73E8] rounded-xl px-2 py-1 text-xs text-[#202124] font-medium cursor-pointer"
                            >
                              {tx.type === "INCOME" ? (
                                INCOME_CATEGORY_LIST.map((c) => (
                                  <option key={c.id} value={c.name}>
                                    {c.name}
                                  </option>
                                ))
                              ) : (
                                CATEGORY_LIST.map((c) => (
                                  <option key={c.id} value={c.name}>
                                    {c.name}
                                  </option>
                                ))
                              )}
                            </select>
                          </td>

                          {/* Payment Mode */}
                          <td className="p-3">
                            <select
                              value={tx.payment_mode}
                              onChange={(e) => handleUpdateItem(tx.id, "payment_mode", e.target.value)}
                              className="w-full bg-[#F8F9FA] hover:bg-white border border-[#DADCE0] focus:border-[#1A73E8] rounded-xl px-2 py-1 text-xs text-[#202124] font-medium cursor-pointer"
                            >
                              <option value="UPI">UPI</option>
                              <option value="Net Banking">Net Banking</option>
                              <option value="Debit / Credit Card">Card</option>
                              <option value="Cash">Cash</option>
                              <option value="Bank Transfer">Transfer</option>
                              <option value="Cheque">Cheque</option>
                            </select>
                          </td>

                          {/* Amount */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[#5F6368] font-bold">₹</span>
                              <input
                                type="number"
                                min="1"
                                step="any"
                                value={tx.amount}
                                onChange={(e) =>
                                  handleUpdateItem(tx.id, "amount", parseFloat(e.target.value) || 0)
                                }
                                className={`w-24 text-right bg-transparent border border-transparent hover:border-[#DADCE0] focus:border-[#1A73E8] focus:bg-white rounded-lg px-2 py-1 text-xs font-bold ${
                                  tx.type === "INCOME" ? "text-[#137333]" : "text-[#C5221F]"
                                }`}
                              />
                            </div>
                          </td>

                          {/* Delete */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(tx.id)}
                              className="p-1 text-[#5F6368] hover:text-[#EA4335] hover:bg-[#FCE8E6] rounded-lg transition-colors cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add manual row button */}
              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={handleAddNewRow}
                  className="px-3 py-1.5 text-[#1A73E8] hover:bg-[#E8F0FE] rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Missing Row</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("upload");
                    setTransactions([]);
                  }}
                  className="text-[#5F6368] hover:text-[#202124] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={13} />
                  <span>Upload Different Document</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#F1F3F4] bg-[#F8F9FA] flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0">
          <div className="text-xs text-[#5F6368] text-center sm:text-left">
            {step === "review" && (
              <span>
                Ready to insert <strong className="text-[#202124]">{selectedItems.length}</strong> verified entries into Khata ledger
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-[#DADCE0] hover:bg-white rounded-2xl text-xs font-bold text-[#3C4043] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {step === "review" && (
              <button
                type="button"
                id="btn-confirm-import-statement"
                onClick={handleFinalImport}
                disabled={selectedItems.length === 0}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] active:scale-98 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Check size={16} />
                <span>
                  Import {selectedItems.length} Transactions ({formatINR(totalInflow + totalOutflow)})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
