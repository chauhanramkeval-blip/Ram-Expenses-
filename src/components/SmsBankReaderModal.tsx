import React, { useState } from "react";
import {
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Copy,
  Plus,
  Zap,
  Building2,
  CreditCard,
  RefreshCw,
  X,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  BankSmsTransaction,
  SAMPLE_INDIAN_BANK_SMS,
  parseBankTransactionSms,
} from "../utils/permissionManager";

interface SmsBankReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportExpense: (expenseData: {
    title: string;
    amount: number;
    category: string;
    paymentMode: string;
    merchantOrLocation: string;
    date: string;
  }) => void;
  onRequestSmsPermission?: () => void;
}

export const SmsBankReaderModal: React.FC<SmsBankReaderModalProps> = ({
  isOpen,
  onClose,
  onImportExpense,
  onRequestSmsPermission,
}) => {
  const [smsList, setSmsList] = useState<BankSmsTransaction[]>(
    SAMPLE_INDIAN_BANK_SMS.map((s) => ({ ...s, imported: false }))
  );
  const [customSmsInput, setCustomSmsInput] = useState("");
  const [parsedPreview, setParsedPreview] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"inbox" | "custom_parse">("inbox");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseCustom = (text: string) => {
    setCustomSmsInput(text);
    if (text.trim().length > 10) {
      const parsed = parseBankTransactionSms(text);
      setParsedPreview(parsed);
    } else {
      setParsedPreview(null);
    }
  };

  const handleImportSingle = (sms: BankSmsTransaction) => {
    onImportExpense({
      title: sms.merchantOrPayee,
      amount: sms.amount,
      category: sms.category,
      paymentMode: sms.paymentMode,
      merchantOrLocation: `${sms.merchantOrPayee} (${sms.bankName})`,
      date: new Date().toISOString().split("T")[0],
    });
    setSmsList((prev) =>
      prev.map((item) => (item.id === sms.id ? { ...item, imported: true } : item))
    );
    onClose();
  };

  const handleImportCustom = () => {
    if (!parsedPreview) return;
    onImportExpense({
      title: parsedPreview.merchantOrPayee,
      amount: parsedPreview.amount,
      category: parsedPreview.category,
      paymentMode: parsedPreview.paymentMode,
      merchantOrLocation: `${parsedPreview.merchantOrPayee} (${parsedPreview.bankName})`,
      date: parsedPreview.date,
    });
    onClose();
  };

  const handleSamplePaste = (sampleText: string) => {
    handleParseCustom(sampleText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="modal-sms-bank-reader"
        className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E8EAED] overflow-hidden"
      >
        {/* Header with Google 4-Color Brand Accents */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F3F4] bg-linear-to-r from-[#E8F0FE]/60 via-white to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC]">
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#202124]">SMS Bank & UPI Reader</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                  Step 4 • Auto-Parsed
                </span>
              </div>
              <p className="text-xs text-[#5F6368]">
                Auto-read debit & credit alerts from HDFC, SBI, ICICI, Axis, Paytm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-[#F1F3F4] bg-[#F8F9FA]">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "inbox"
                ? "bg-white text-[#1A73E8] shadow-xs border border-[#E8EAED]"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            📩 Detected Bank SMS ({smsList.filter((s) => !s.imported).length})
          </button>
          <button
            onClick={() => setActiveTab("custom_parse")}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "custom_parse"
                ? "bg-white text-[#1A73E8] shadow-xs border border-[#E8EAED]"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            ✨ Paste & Test Custom SMS
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "inbox" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#5F6368] px-1">
                <span>Recent Bank Transaction Messages</span>
                <span className="flex items-center gap-1 text-[#137333]">
                  <ShieldCheck size={13} /> 100% On-Device Parsed
                </span>
              </div>

              {smsList.map((sms) => (
                <div
                  key={sms.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    sms.imported
                      ? "bg-[#F8F9FA] border-[#E8EAED] opacity-60"
                      : "bg-white border-[#E8EAED] hover:border-[#1A73E8]/40 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          sms.type === "debit"
                            ? "bg-[#FCE8E6] text-[#D93025]"
                            : "bg-[#E6F4EA] text-[#137333]"
                        }`}
                      >
                        {sms.type === "debit" ? (
                          <ArrowDownLeft size={18} />
                        ) : (
                          <ArrowUpRight size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#202124] truncate">
                            {sms.merchantOrPayee}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F1F3F4] text-[#5F6368]">
                            {sms.sender}
                          </span>
                        </div>
                        <p className="text-xs text-[#5F6368] mt-0.5 line-clamp-2">
                          {sms.rawText}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-[#5F6368]">
                          <span className="font-medium text-[#1A73E8] bg-[#E8F0FE] px-2 py-0.5 rounded-full">
                            {sms.category}
                          </span>
                          <span>•</span>
                          <span>{sms.paymentMode}</span>
                          <span>•</span>
                          <span>{sms.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-sm font-extrabold ${
                          sms.type === "debit" ? "text-[#D93025]" : "text-[#137333]"
                        }`}
                      >
                        {sms.type === "debit" ? "-" : "+"}₹{sms.amount.toLocaleString("en-IN")}
                      </span>

                      {sms.imported ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#137333]">
                          <CheckCircle2 size={13} /> Imported
                        </span>
                      ) : (
                        <button
                          onClick={() => handleImportSingle(sms)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
                        >
                          <Plus size={13} /> Log Spends
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#202124]">
                  Paste Bank or UPI SMS Text
                </label>
                <textarea
                  value={customSmsInput}
                  onChange={(e) => handleParseCustom(e.target.value)}
                  placeholder="Paste SMS here (e.g. 'Rs. 450 debited from A/c XX4589 for Swiggy UPI...')"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8EAED] text-xs text-[#202124] placeholder-[#80868B] focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 transition-all resize-none"
                />
              </div>

              {/* Sample Templates for Quick Testing */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#5F6368]">
                  Or try a sample bank alert template:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() =>
                      handleSamplePaste(
                        "Dear Customer, INR 520.00 debited from HDFC Bank A/c **3421 on 04-Sep-26 towards UPI/Zomato/zomato@hdfc. Bal: INR 28,400.00."
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#F1F3F4] hover:bg-[#E8EAED] text-[11px] text-[#202124] font-medium transition-colors cursor-pointer"
                  >
                    🍕 Zomato ₹520 (HDFC)
                  </button>
                  <button
                    onClick={() =>
                      handleSamplePaste(
                        "SBI Alert: Rs. 2,100.00 debited from A/c **8892 on 04-SEP-26 via UPI to DMart Supermarket. Avail Bal: Rs 14,200.00."
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#F1F3F4] hover:bg-[#E8EAED] text-[11px] text-[#202124] font-medium transition-colors cursor-pointer"
                  >
                    🛒 DMart ₹2,100 (SBI)
                  </button>
                  <button
                    onClick={() =>
                      handleSamplePaste(
                        "Your ICICI Bank Card **4412 spent INR 1,800.00 on 04-Sep-26 at INDIAN OIL PETROL PUMP. Avl Lmt: INR 75,000."
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#F1F3F4] hover:bg-[#E8EAED] text-[11px] text-[#202124] font-medium transition-colors cursor-pointer"
                  >
                    ⛽ Petrol ₹1,800 (ICICI)
                  </button>
                </div>
              </div>

              {/* Real-time Parsed Preview Card */}
              {parsedPreview && (
                <div className="p-4 rounded-2xl bg-linear-to-br from-[#E8F0FE]/60 to-[#F8F9FA] border border-[#D2E3FC] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A73E8]">
                      <Sparkles size={14} /> Real-Time Smart Extracted Result
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        parsedPreview.type === "debit"
                          ? "bg-[#FCE8E6] text-[#D93025]"
                          : "bg-[#E6F4EA] text-[#137333]"
                      }`}
                    >
                      {parsedPreview.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-[#E8EAED]">
                      <span className="text-[10px] text-[#5F6368] block">Payee / Merchant</span>
                      <span className="font-bold text-[#202124] truncate block">
                        {parsedPreview.merchantOrPayee}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#E8EAED]">
                      <span className="text-[10px] text-[#5F6368] block">Parsed Amount</span>
                      <span className="font-extrabold text-[#1A73E8] text-sm block">
                        ₹{parsedPreview.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#E8EAED]">
                      <span className="text-[10px] text-[#5F6368] block">Category</span>
                      <span className="font-semibold text-[#202124] block">
                        {parsedPreview.category}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#E8EAED]">
                      <span className="text-[10px] text-[#5F6368] block">Bank & Mode</span>
                      <span className="font-semibold text-[#202124] truncate block">
                        {parsedPreview.bankName} ({parsedPreview.paymentMode})
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleImportCustom}
                    className="w-full py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={15} /> Confirm & Log This Expense
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#F1F3F4] bg-[#F8F9FA] text-xs text-[#5F6368]">
          <span className="text-[11px]">Privacy: SMS text is never uploaded to any server.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
