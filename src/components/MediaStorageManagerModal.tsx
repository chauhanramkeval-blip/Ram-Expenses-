import React, { useState, useEffect } from "react";
import {
  HardDrive,
  Image as ImageIcon,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FolderOpen,
  Sparkles,
  Lock,
  X,
  FileImage,
  RefreshCw,
  Plus,
} from "lucide-react";
import {
  getStorageQuotaInfo,
  StorageQuotaInfo,
} from "../utils/permissionManager";

interface MediaStorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalExpensesCount: number;
  totalIncomesCount: number;
  onRequestStoragePersist: () => Promise<boolean>;
  onAttachReceiptImage: (imageUrl: string, suggestedExpense?: any) => void;
}

export const MediaStorageManagerModal: React.FC<MediaStorageManagerModalProps> = ({
  isOpen,
  onClose,
  totalExpensesCount,
  totalIncomesCount,
  onRequestStoragePersist,
  onAttachReceiptImage,
}) => {
  const [quotaInfo, setQuotaInfo] = useState<StorageQuotaInfo | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [persistedSuccess, setPersistedSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"storage" | "media">("storage");

  // Sample media bill attachments demo gallery
  const SAMPLE_BILL_ATTACHMENTS = [
    {
      id: "bill-1",
      title: "DMart Groceries Bill",
      date: "03 Sep 2026",
      size: "245 KB",
      merchant: "DMart Hypermarket",
      amount: 2150,
      category: "Kirana & Groceries",
      thumbGradient: "from-blue-500 to-indigo-600",
      icon: "🛒",
    },
    {
      id: "bill-2",
      title: "Apollo Pharmacy Tax Invoice",
      date: "01 Sep 2026",
      size: "180 KB",
      merchant: "Apollo Pharmacy",
      amount: 480,
      category: "Healthcare & Medicine",
      thumbGradient: "from-emerald-500 to-teal-600",
      icon: "💊",
    },
    {
      id: "bill-3",
      title: "Indian Oil Petrol Chit",
      date: "31 Aug 2026",
      size: "120 KB",
      merchant: "Indian Oil Corp",
      amount: 1200,
      category: "Commute & Auto/Metro",
      thumbGradient: "from-amber-500 to-orange-600",
      icon: "⛽",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      getStorageQuotaInfo(totalExpensesCount, totalIncomesCount).then(setQuotaInfo);
    }
  }, [isOpen, totalExpensesCount, totalIncomesCount]);

  if (!isOpen) return null;

  const handlePersistClick = async () => {
    setIsRequesting(true);
    try {
      const ok = await onRequestStoragePersist();
      if (ok) {
        setPersistedSuccess(true);
        const updated = await getStorageQuotaInfo(totalExpensesCount, totalIncomesCount);
        setQuotaInfo(updated);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        setSelectedImage(resultUrl);
        onAttachReceiptImage(resultUrl, {
          title: file.name.replace(/\.[^/.]+$/, ""),
          amount: 350,
          category: "Kirana & Groceries",
          merchantOrLocation: "Media Attachment",
        });
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="modal-media-storage-manager"
        className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E8EAED] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F3F4] bg-linear-to-r from-[#E8F0FE]/60 via-white to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC]">
              {activeTab === "storage" ? <HardDrive size={20} /> : <ImageIcon size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#202124]">
                  Storage & Media Permissions
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                  Step 4 • Active
                </span>
              </div>
              <p className="text-xs text-[#5F6368]">
                Persistent offline device storage and receipt media gallery
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

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-[#F1F3F4] bg-[#F8F9FA]">
          <button
            onClick={() => setActiveTab("storage")}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "storage"
                ? "bg-white text-[#1A73E8] shadow-xs border border-[#E8EAED]"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            💾 Persistent Storage Quota
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "media"
                ? "bg-white text-[#1A73E8] shadow-xs border border-[#E8EAED]"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            🖼️ Media & Receipt Files
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "storage" ? (
            <div className="space-y-4">
              {/* Storage Quota Health Meter */}
              <div className="p-4 rounded-2xl bg-linear-to-br from-[#E8F0FE]/40 to-[#F8F9FA] border border-[#D2E3FC] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8] animate-pulse"></span>
                    <span className="text-xs font-bold text-[#202124]">
                      IndexedDB & Device Storage Quota
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#1A73E8]">
                    {quotaInfo ? `${quotaInfo.usageFormatted} / ${quotaInfo.quotaFormatted}` : "Calculating..."}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#E8EAED] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-linear-to-r from-[#1A73E8] to-[#34A853] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, quotaInfo?.percentUsed || 2)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
                  <span>{quotaInfo?.totalLedgerRecords || 0} Ledger Records Stored</span>
                  <span>{quotaInfo?.percentUsed || 0.05}% Utilized</span>
                </div>
              </div>

              {/* Persistence Lock Status */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8EAED] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        quotaInfo?.isPersisted || persistedSuccess
                          ? "bg-[#E6F4EA] text-[#137333]"
                          : "bg-[#FEF7E0] text-[#B06000]"
                      }`}
                    >
                      {quotaInfo?.isPersisted || persistedSuccess ? (
                        <ShieldCheck size={20} />
                      ) : (
                        <Lock size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#202124]">
                        {quotaInfo?.isPersisted || persistedSuccess
                          ? "Permanent Offline Storage Locked"
                          : "Temporary Best-Effort Storage"}
                      </h4>
                      <p className="text-xs text-[#5F6368] mt-0.5">
                        {quotaInfo?.isPersisted || persistedSuccess
                          ? "Your financial records, receipts, and user accounts are immune to browser eviction."
                          : "Browser may clear cache if disk space runs low. Request permanent storage to protect your data."}
                      </p>
                    </div>
                  </div>
                </div>

                {!(quotaInfo?.isPersisted || persistedSuccess) && (
                  <button
                    onClick={handlePersistClick}
                    disabled={isRequesting}
                    className="w-full py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {isRequesting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Requesting OS Lock...
                      </>
                    ) : (
                      <>
                        <Lock size={14} /> Lock Permanent Persistent Storage
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Storage Benefits Checklist */}
              <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E8EAED] space-y-2 text-xs">
                <span className="font-bold text-[#202124] block">Persistent Storage Benefits:</span>
                <div className="space-y-1.5 text-[#5F6368]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#137333] shrink-0" />
                    <span>Never lose transaction history even after months of inactivity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#137333] shrink-0" />
                    <span>Keep offline receipt images and PDF financial statements cached</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#137333] shrink-0" />
                    <span>Works without internet connection using local IndexedDB database</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Media File Upload Action Card */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-[#1A73E8]/40 bg-[#E8F0FE]/20 flex flex-col items-center justify-center text-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC]">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#202124]">
                    Select Bill or Invoice from Photos
                  </h4>
                  <p className="text-xs text-[#5F6368] max-w-xs mt-0.5">
                    Choose PNG, JPG, or payment screenshots from your phone photo gallery
                  </p>
                </div>

                <label className="mt-1 px-4 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2">
                  <FolderOpen size={15} /> Pick from Device Gallery
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Sample Media Receipts Gallery */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#5F6368] px-1">
                  <span>Saved Invoice & Bill Attachments</span>
                  <span>{SAMPLE_BILL_ATTACHMENTS.length} receipts</span>
                </div>

                {SAMPLE_BILL_ATTACHMENTS.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#E8EAED] hover:border-[#1A73E8]/40 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl bg-linear-to-br ${bill.thumbGradient} text-white flex items-center justify-center text-lg shrink-0 shadow-xs`}
                      >
                        {bill.icon}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-[#202124] truncate">{bill.title}</h5>
                        <p className="text-[11px] text-[#5F6368] mt-0.5">
                          {bill.merchant} • {bill.date} • {bill.size}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-extrabold text-[#202124]">
                        ₹{bill.amount.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => {
                          onAttachReceiptImage("", {
                            title: bill.merchant,
                            amount: bill.amount,
                            category: bill.category,
                            merchantOrLocation: bill.merchant,
                          });
                          onClose();
                        }}
                        className="p-1.5 rounded-lg bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#1A73E8] transition-colors cursor-pointer"
                        title="Use in Expense"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#F1F3F4] bg-[#F8F9FA] text-xs text-[#5F6368]">
          <span className="text-[11px]">Private: Media files are stored locally on your device.</span>
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
