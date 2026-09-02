import React, { useRef, useState } from "react";
import {
  X,
  FileText,
  Download,
  Share2,
  Check,
  Send,
  Mail,
  Sparkles,
  ShieldCheck,
  Printer,
  TrendingDown,
  TrendingUp,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { Expense, UserBudget, ExpenseCategory } from "../types";
import { formatINR, formatFriendlyDate } from "../utils/formatters";
import { CATEGORIES_DATA } from "../data/categories";
import { CategoryIcon } from "./CategoryIcon";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  budget: UserBudget;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  budget,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const now = new Date();
  const monthName = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

  // Filter current month expenses
  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyLimit = budget.monthlyBudget;
  const remainingBudget = Math.max(0, monthlyLimit - totalSpent);
  const percentUsed = Math.min(100, Math.round((totalSpent / monthlyLimit) * 100));
  const estimatedIncome = budget.monthlyIncome || 65000;
  const estimatedSavings = Math.max(0, estimatedIncome - totalSpent);
  const savingsRate = Math.round((estimatedSavings / estimatedIncome) * 100);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .map(([catId, amount]) => {
      const meta = CATEGORIES_DATA[catId as keyof typeof CATEGORIES_DATA];
      return {
        category: catId as ExpenseCategory,
        name: meta?.name || catId,
        color: meta?.color || "#1A73E8",
        amount,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Group by payment mode
  const modeTotals: Record<string, number> = {};
  currentMonthExpenses.forEach((e) => {
    modeTotals[e.paymentMode] = (modeTotals[e.paymentMode] || 0) + e.amount;
  });

  // Generate PDF
  const handleDownloadPdf = async () => {
    if (!reportRef.current || isGenerating) return;
    setIsGenerating(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      const cleanMonth = monthName.replace(/\s+/g, "_");
      pdf.save(`Khata_Financial_Summary_${cleanMonth}.pdf`);

      try {
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.8 },
          colors: ["#1A73E8", "#34A853", "#FBBC05"],
        });
      } catch {
        // ignore
      }
    } catch (error) {
      console.error("PDF generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // WhatsApp Share Text
  const handleShareWhatsApp = () => {
    const text = `📊 *Khata Financial Summary - ${monthName}*\n\n` +
      `💸 *Total Spends:* ${formatINR(totalSpent)}\n` +
      `🎯 *Monthly Limit:* ${formatINR(monthlyLimit)} (${percentUsed}% used)\n` +
      `💰 *Estimated Savings:* ${formatINR(estimatedSavings)} (${savingsRate}% savings rate)\n` +
      `🔥 *Top Category:* ${sortedCategories[0]?.name || "N/A"} (${formatINR(sortedCategories[0]?.amount || 0)})\n\n` +
      `Generated via Khata App (Google Files Style Expense Tracker).`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  // Email Share
  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Khata Financial Summary Statement - ${monthName}`);
    const body = encodeURIComponent(
      `Hello,\n\nHere is my financial summary report for ${monthName}:\n\n` +
      `• Total Spent: ${formatINR(totalSpent)}\n` +
      `• Monthly Budget: ${formatINR(monthlyLimit)} (${percentUsed}% used)\n` +
      `• Net Savings: ${formatINR(estimatedSavings)} (${savingsRate}% savings rate)\n` +
      `• Top Outflow: ${sortedCategories[0]?.name || "N/A"} (${formatINR(sortedCategories[0]?.amount || 0)})\n\n` +
      `Attached/Generated via Khata Expense Tracker.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div
      id="pdf-report-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#202124]/50 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="pdf-report-modal-content"
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-[#E8EAED] text-[#202124] animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between border-b border-[#F1F3F4] px-5 py-3.5 bg-[#F8F9FA] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC]">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#202124] flex items-center gap-1.5">
                <span>Monthly Financial Statement</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E6F4EA] text-[#137333]">
                  PDF Ready
                </span>
              </h3>
              <p className="text-[11px] text-[#5F6368]">{monthName} • High-Resolution Report</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              id="btn-share-whatsapp"
              onClick={handleShareWhatsApp}
              title="Share Summary via WhatsApp"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#137333] bg-[#E6F4EA] hover:bg-[#CEEAD6] border border-[#CEEAD6] transition-colors cursor-pointer"
            >
              <Send size={13} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              id="btn-share-email"
              onClick={handleShareEmail}
              title="Share Summary via Email"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] border border-[#D2E3FC] transition-colors cursor-pointer"
            >
              <Mail size={13} />
              <span className="hidden sm:inline">Email</span>
            </button>

            <button
              type="button"
              id="btn-download-pdf"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download size={13} strokeWidth={2.5} />
              <span>{isGenerating ? "Rendering..." : "Save PDF"}</span>
            </button>

            <button
              id="btn-close-pdf-modal"
              onClick={onClose}
              className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Report Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F1F3F4]/50">
          <div
            ref={reportRef}
            id="printable-khata-statement"
            className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8EAED] shadow-sm max-w-xl mx-auto space-y-6 text-[#202124]"
            style={{ width: "100%", minHeight: "750px" }}
          >
            {/* 1. Header Banner */}
            <div className="flex items-start justify-between border-b-2 border-[#1A73E8] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1A73E8] text-white font-bold flex items-center justify-center text-base">
                    ₹
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-[#202124]">
                      KHATA FINANCIAL STATEMENT
                    </h1>
                    <p className="text-[11px] text-[#5F6368] font-medium">
                      Personal & Household Expense Ledger
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#1A73E8] bg-[#E8F0FE] px-2.5 py-1 rounded-full border border-[#D2E3FC]">
                  {monthName}
                </span>
                <p className="text-[10px] text-[#5F6368] mt-1 font-mono">
                  Generated: {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            {/* 2. Executive KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E8EAED]">
                <span className="text-[10px] uppercase font-bold text-[#5F6368]">Total Spends</span>
                <div className="text-base sm:text-lg font-extrabold text-[#202124] mt-0.5">
                  {formatINR(totalSpent)}
                </div>
                <span className="text-[10px] text-[#EA4335] font-semibold">
                  {currentMonthExpenses.length} transactions
                </span>
              </div>

              <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E8EAED]">
                <span className="text-[10px] uppercase font-bold text-[#5F6368]">Monthly Limit</span>
                <div className="text-base sm:text-lg font-extrabold text-[#1A73E8] mt-0.5">
                  {formatINR(monthlyLimit)}
                </div>
                <span className="text-[10px] text-[#5F6368] font-medium">
                  {percentUsed}% utilized
                </span>
              </div>

              <div className="bg-[#E6F4EA] p-3.5 rounded-xl border border-[#CEEAD6]">
                <span className="text-[10px] uppercase font-bold text-[#137333]">Net Savings</span>
                <div className="text-base sm:text-lg font-extrabold text-[#137333] mt-0.5">
                  {formatINR(estimatedSavings)}
                </div>
                <span className="text-[10px] text-[#137333] font-bold">
                  {savingsRate}% savings rate
                </span>
              </div>
            </div>

            {/* 3. Budget Meter Visualization Bar */}
            <div className="space-y-1.5 bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E8EAED]">
              <div className="flex justify-between text-xs font-bold text-[#202124]">
                <span>Budget Consumption Meter</span>
                <span>{percentUsed}% Used</span>
              </div>
              <div className="w-full h-3 bg-[#E8EAED] rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all ${
                    percentUsed > 90 ? "bg-[#EA4335]" : percentUsed > 75 ? "bg-[#FBBC05]" : "bg-[#1A73E8]"
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#5F6368] pt-0.5">
                <span>Remaining: {formatINR(remainingBudget)}</span>
                <span>Limit: {formatINR(monthlyLimit)}</span>
              </div>
            </div>

            {/* 4. Category Breakdown Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-2 flex items-center justify-between">
                <span>Category Breakdown</span>
                <span>Share %</span>
              </h3>
              <div className="border border-[#E8EAED] rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-12 bg-[#F1F3F4] px-3 py-2 font-bold text-[#3C4043] border-b border-[#E8EAED]">
                  <div className="col-span-6">Category</div>
                  <div className="col-span-3 text-right">Amount</div>
                  <div className="col-span-3 text-right">% of Total</div>
                </div>
                <div className="divide-y divide-[#F1F3F4]">
                  {sortedCategories.map((cat) => (
                    <div key={cat.category} className="grid grid-cols-12 px-3 py-2 text-[#3C4043] items-center">
                      <div className="col-span-6 flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon category={cat.category} size={13} className="text-white" />
                        </div>
                        <span className="font-semibold text-[#202124]">{cat.name}</span>
                      </div>
                      <div className="col-span-3 text-right font-bold">{formatINR(cat.amount)}</div>
                      <div className="col-span-3 text-right">
                        <span className="font-semibold px-2 py-0.5 rounded-full text-[10px] bg-[#F1F3F4] text-[#5F6368]">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Payment Mode Distribution */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(modeTotals).map(([mode, amt]) => (
                <div key={mode} className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E8EAED] text-center">
                  <div className="text-[10px] font-bold text-[#5F6368] uppercase">{mode}</div>
                  <div className="text-xs font-extrabold text-[#202124] mt-0.5">{formatINR(amt)}</div>
                </div>
              ))}
            </div>

            {/* 6. Advisor & Auditor Note */}
            <div className="bg-[#FEF7E0] p-3.5 rounded-xl border border-[#FEEFC3] text-xs space-y-1">
              <div className="font-bold text-[#B06000] flex items-center gap-1.5">
                <span>💡 AI Financial Health Verdict</span>
              </div>
              <p className="text-[11px] text-[#3C4043] leading-relaxed">
                {percentUsed < 70
                  ? "Excellent spending discipline! Your monthly outflows are well within the safe 50-30-20 threshold. Consider channeling the surplus savings into a recurring index SIP."
                  : percentUsed < 95
                  ? "Moderate spending pace. Keep a check on high-frequency UPI micro-transactions and street snack deliveries during the remaining days of the month."
                  : "Critical budget alert. You have reached close to your spending ceiling. Pause discretionary retail shopping and prioritize essential living expenses."}
              </p>
            </div>

            {/* 7. Footer Seal */}
            <div className="pt-4 border-t border-[#E8EAED] flex items-center justify-between text-[10px] text-[#5F6368]">
              <div className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-[#137333]" />
                <span>Verified Private Client-Side Calculation</span>
              </div>
              <div>Khata • India Edition</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
