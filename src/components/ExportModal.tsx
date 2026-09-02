import React, { useState } from "react";
import { X, FileSpreadsheet, Download, Check, FileText } from "lucide-react";
import { Expense } from "../types";
import { formatINR } from "../utils/formatters";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  filteredExpenses: Expense[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  filteredExpenses,
}) => {
  const [exportScope, setExportScope] = useState<"all" | "filtered" | "current-month">("all");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const now = new Date();
  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const getExportData = () => {
    if (exportScope === "filtered") return filteredExpenses;
    if (exportScope === "current-month") return currentMonthExpenses;
    return expenses;
  };

  const generateCSV = () => {
    const data = getExportData();
    const headers = ["ID", "Date", "Title", "Amount (INR)", "Category", "Payment Mode", "Merchant / Vendor", "Notes", "Created At"];
    
    const rows = data.map((e) => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${(e.title || "").replace(/"/g, '""')}"`,
      e.amount,
      `"${e.category}"`,
      `"${e.paymentMode}"`,
      `"${(e.merchant || "").replace(/"/g, '""')}"`,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
      `"${e.createdAt || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return csvContent;
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Khata_Expenses_Export_${exportScope}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyClipboard = () => {
    const csvContent = generateCSV();
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentDataset = getExportData();
  const datasetSum = currentDataset.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div
      id="export-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/50 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="export-modal-content"
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8EAED] text-[#202124] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6F4EA] text-[#137333] flex items-center justify-center border border-[#CEEAD6]">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#202124]">Export to CSV</h3>
              <p className="text-xs text-[#5F6368]">Download spreadsheet for Excel or Google Sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5F6368] uppercase mb-2">
              Select Dataset Range
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportScope("all")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  exportScope === "all"
                    ? "bg-[#E8F0FE] text-[#1A73E8] border-[#1A73E8]"
                    : "bg-[#F8F9FA] text-[#3C4043] border-[#DADCE0] hover:bg-[#F1F3F4]"
                }`}
              >
                All ({expenses.length})
              </button>
              <button
                type="button"
                onClick={() => setExportScope("current-month")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  exportScope === "current-month"
                    ? "bg-[#E8F0FE] text-[#1A73E8] border-[#1A73E8]"
                    : "bg-[#F8F9FA] text-[#3C4043] border-[#DADCE0] hover:bg-[#F1F3F4]"
                }`}
              >
                This Month ({currentMonthExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setExportScope("filtered")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  exportScope === "filtered"
                    ? "bg-[#E8F0FE] text-[#1A73E8] border-[#1A73E8]"
                    : "bg-[#F8F9FA] text-[#3C4043] border-[#DADCE0] hover:bg-[#F1F3F4]"
                }`}
              >
                Filtered ({filteredExpenses.length})
              </button>
            </div>
          </div>

          <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#E8EAED] text-xs space-y-1">
            <div className="flex justify-between text-[#5F6368]">
              <span>Selected Records:</span>
              <span className="font-bold text-[#202124]">{currentDataset.length} items</span>
            </div>
            <div className="flex justify-between text-[#5F6368]">
              <span>Total Spend Value:</span>
              <span className="font-bold text-[#1A73E8]">{formatINR(datasetSum)}</span>
            </div>
            <div className="flex justify-between text-[#5F6368]">
              <span>Fields Included:</span>
              <span className="font-mono text-[10px]">Date, Title, Amount, Category, UPI/Cash, Notes</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="flex-1 py-2.5 rounded-full text-xs font-bold border border-[#DADCE0] hover:bg-[#F1F3F4] text-[#3C4043] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-[#137333]" /> : <FileText size={14} />}
              <span>{copied ? "Copied CSV" : "Copy to Clipboard"}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#137333] hover:bg-[#0D652D] text-white transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Download .CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
