import React, { useState, useEffect } from "react";
import {
  X,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ShieldCheck,
  Wifi,
  WifiOff,
  Database,
  Sparkles,
  Check,
} from "lucide-react";
import { Expense, Income, UserBudget, UserAccount } from "../types";
import { isFirebaseConfigValid } from "../firebase";
import {
  pushAllLocalDataToFirestore,
  fetchAllFromFirestore,
  getStoredLastSyncTime,
  setStoredLastSyncTime,
} from "../services/firestoreSync";
import { ErrorBoundary } from "./ErrorBoundary";

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  incomes: Income[];
  budget: UserBudget;
  currentUser?: UserAccount;
  onSyncCompleted?: (newExpenses: Expense[], newIncomes: Income[]) => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = (props) => {
  return (
    <ErrorBoundary fallbackTitle="Cloud Backup Unavailable" fallbackMessage="Could not load Cloud Backup & Sync.">
      <FirebaseSyncModalContent {...props} />
    </ErrorBoundary>
  );
};

/**
 * Format ISO timestamp into a readable format:
 * e.g., "03 Sep 2026, 03:30 PM"
 */
function formatBackupTimestamp(isoString: string | null): string {
  if (!isoString) return "Not yet backed up";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Not yet backed up";

    const day = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${day}, ${time}`;
  } catch {
    return "Not yet backed up";
  }
}

const FirebaseSyncModalContent: React.FC<FirebaseSyncModalProps> = ({
  isOpen,
  onClose,
  expenses,
  incomes,
  budget,
  currentUser,
  onSyncCompleted,
}) => {
  const activeUserId = currentUser?.id || "user-ramkeval";
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => getStoredLastSyncTime(activeUserId));
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info" | ""; text: string }>({
    type: "",
    text: "",
  });

  const isConfigValid = isFirebaseConfigValid();

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync state whenever modal opens or active user changes
  useEffect(() => {
    if (isOpen) {
      setLastBackupTime(getStoredLastSyncTime(activeUserId));
      setToastMessage({ type: "", text: "" });
    }
  }, [isOpen, activeUserId]);

  if (!isOpen) return null;

  // Single Primary Action: Backup Data Now
  const handleBackupNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setToastMessage({ type: "info", text: "Backing up your ledger to Google Cloud Firestore..." });

    try {
      const res = await pushAllLocalDataToFirestore(expenses, incomes, budget, activeUserId);
      if (res.success) {
        const nowIso = new Date().toISOString();
        setStoredLastSyncTime(nowIso, activeUserId);
        setLastBackupTime(nowIso);
        setToastMessage({
          type: "success",
          text: `Backup Successful! Synced ${res.syncedExpenses} expenses and ${res.syncedIncomes} incomes securely.`,
        });
      } else {
        setToastMessage({
          type: "error",
          text: res.error || "Backup failed. Please check your internet connection.",
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.message || "An unexpected error occurred during backup.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Secondary Action: Restore / Pull Cloud Data
  const handleRestoreFromCloud = async () => {
    if (isPulling) return;
    setIsPulling(true);
    setToastMessage({ type: "info", text: "Fetching cloud records..." });

    try {
      const res = await fetchAllFromFirestore(activeUserId);
      if (res.success) {
        const nowIso = new Date().toISOString();
        setStoredLastSyncTime(nowIso, activeUserId);
        setLastBackupTime(nowIso);
        setToastMessage({
          type: "success",
          text: `Retrieved ${res.expenses.length} expenses and ${res.incomes.length} incomes from cloud.`,
        });
        if (onSyncCompleted && (res.expenses.length > 0 || res.incomes.length > 0)) {
          onSyncCompleted(res.expenses, res.incomes);
        }
      } else {
        setToastMessage({
          type: "error",
          text: res.error || "Failed to fetch cloud records.",
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to restore cloud records.",
      });
    } finally {
      setIsPulling(false);
    }
  };

  const formattedTimestamp = formatBackupTimestamp(lastBackupTime);
  const isCloudActive = isOnline && isConfigValid;

  return (
    <div
      id="cloud-backup-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/60 backdrop-blur-xs animate-fadeIn text-[#202124]"
      onClick={onClose}
    >
      <div
        id="cloud-backup-modal-content"
        className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E8EAED] animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F1F3F4] bg-[#F8F9FA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold shadow-2xs border border-[#D2E3FC]">
              <Cloud size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#202124] flex items-center gap-1.5">
                <span>Cloud Backup & Sync</span>
              </h3>
              <p className="text-xs text-[#5F6368]">Secure cloud storage for your daily ledger</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-cloud-backup-modal"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status Alert / Toast Notification */}
          {toastMessage.text && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 animate-fadeIn ${
                toastMessage.type === "success"
                  ? "bg-[#E6F4EA] border-[#CEEAD6] text-[#137333]"
                  : toastMessage.type === "error"
                  ? "bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]"
                  : "bg-[#E8F0FE] border-[#D2E3FC] text-[#1A73E8]"
              }`}
            >
              {toastMessage.type === "success" ? (
                <CheckCircle2 size={17} className="shrink-0 text-[#188038] mt-0.5" />
              ) : toastMessage.type === "error" ? (
                <AlertTriangle size={17} className="shrink-0 text-[#D93025] mt-0.5" />
              ) : (
                <RefreshCw size={17} className="shrink-0 animate-spin text-[#1A73E8] mt-0.5" />
              )}
              <div className="flex-1">
                <span>{toastMessage.text}</span>
              </div>
            </div>
          )}

          {/* Clean Cloud Status Card */}
          <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-3.5">
            {/* Cloud Status Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5F6368]">Cloud Status</span>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  !isOnline
                    ? "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]"
                    : isCloudActive
                    ? "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]"
                    : "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    !isOnline ? "bg-[#FBBC04]" : isCloudActive ? "bg-[#188038] animate-pulse" : "bg-[#FBBC04]"
                  }`}
                />
                <span>{!isOnline ? "Offline Mode" : isCloudActive ? "Connected / Cloud Active" : "Initializing Cloud"}</span>
              </div>
            </div>

            {/* Active Profile */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#E8EAED]">
              <span className="text-xs font-semibold text-[#5F6368]">Active Account</span>
              <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: currentUser?.avatarColor || "#1A73E8" }}
                />
                <span>{currentUser?.name || "Personal Account"}</span>
              </span>
            </div>

            {/* Last Backup Date & Time */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#E8EAED]">
              <span className="text-xs font-semibold text-[#5F6368]">Last Backup</span>
              <span
                className={`text-xs font-bold ${
                  lastBackupTime ? "text-[#1A73E8]" : "text-[#80868B] italic"
                }`}
              >
                {formattedTimestamp}
              </span>
            </div>
          </div>

          {/* Records Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] text-center">
              <span className="text-[11px] text-[#5F6368] block">Expenses Ready</span>
              <span className="text-base font-bold text-[#202124]">{expenses.length}</span>
              <span className="text-[10px] text-[#80868B] block">Saved in ledger</span>
            </div>
            <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] text-center">
              <span className="text-[11px] text-[#5F6368] block">Incomes Ready</span>
              <span className="text-base font-bold text-[#137333]">{incomes.length}</span>
              <span className="text-[10px] text-[#80868B] block">Saved in ledger</span>
            </div>
          </div>

          {/* Primary Action Button: Backup Data Now */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              id="btn-backup-data-now"
              onClick={handleBackupNow}
              disabled={isSyncing || !isOnline}
              className="w-full py-3.5 bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-[#DADCE0] disabled:text-[#80868B] text-white font-bold text-sm rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-98"
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Backing up to Cloud...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  <span>Backup Data Now</span>
                </>
              )}
            </button>

            {/* Secondary Option: Fetch & Restore Cloud Records */}
            <button
              type="button"
              id="btn-restore-from-cloud"
              onClick={handleRestoreFromCloud}
              disabled={isPulling || isSyncing || !isOnline}
              className="w-full py-2.5 bg-white hover:bg-[#F8F9FA] border border-[#DADCE0] hover:border-[#1A73E8] text-[#1A73E8] font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DownloadCloud size={15} />
              <span>{isPulling ? "Fetching Cloud Data..." : "Restore Data from Cloud"}</span>
            </button>
          </div>

          {/* Automatic Sync Note */}
          <div className="p-3.5 bg-[#E8F0FE]/60 rounded-2xl border border-[#D2E3FC] text-[11px] text-[#5F6368] space-y-1">
            <p className="font-bold text-[#1A73E8] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#1A73E8]" />
              <span>Automatic Real-Time Sync</span>
            </p>
            <p className="leading-relaxed">
              Whenever you add, edit, or delete an expense or income, Khata automatically updates your cloud backup in the background.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F8F9FA] border-t border-[#F1F3F4] flex items-center justify-between text-xs text-[#5F6368]">
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <ShieldCheck size={14} className="text-[#188038]" />
            <span>End-to-end Encrypted</span>
          </div>
          <button
            type="button"
            id="btn-close-cloud-backup-footer"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
