import React, { useState, useEffect } from "react";
import {
  X,
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Server,
  Key,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Database,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  Wifi,
  WifiOff,
  Save,
  RotateCcw,
} from "lucide-react";
import { Expense, Income, UserBudget } from "../types";
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  resetCustomFirebaseConfig,
  isFirebaseConfigValid,
  getFirebaseInstances,
  FirebaseConfig,
} from "../firebase";
import {
  pushAllLocalDataToFirestore,
  fetchAllFromFirestore,
  getStoredLastSyncTime,
  SyncStatus,
} from "../services/firestoreSync";
import { formatINR } from "../utils/formatters";

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  incomes: Income[];
  budget: UserBudget;
  onSyncCompleted?: (newExpenses: Expense[], newIncomes: Income[]) => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({
  isOpen,
  onClose,
  expenses,
  incomes,
  budget,
  onSyncCompleted,
}) => {
  const [activeTab, setActiveTab] = useState<"status" | "config">("status");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info" | ""; text: string }>({
    type: "",
    text: "",
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getStoredLastSyncTime);

  // Config editing state
  const [config, setConfig] = useState<FirebaseConfig>(getActiveFirebaseConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      setConfig(getActiveFirebaseConfig());
      setLastSyncTime(getStoredLastSyncTime());
      const { isValid, error } = getFirebaseInstances();
      if (!isOnline) {
        setSyncStatus("offline");
      } else if (!isValid) {
        setSyncStatus("unconfigured");
      } else {
        setSyncStatus("synced");
      }
    }
  }, [isOpen, isOnline]);

  if (!isOpen) return null;

  const isValidConfig = isFirebaseConfigValid(config);

  // Handle Manual Push / Sync to Cloud
  const handleManualPushSync = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: "info", text: "Pushing expenses and incomes to Firestore..." });

    try {
      const res = await pushAllLocalDataToFirestore(expenses, incomes, budget);
      if (res.success) {
        const time = new Date().toISOString();
        setLastSyncTime(time);
        setSyncStatus("synced");
        setStatusMessage({
          type: "success",
          text: `Synced ${res.syncedExpenses} expenses and ${res.syncedIncomes} incomes to Firestore successfully!`,
        });
      } else {
        setSyncStatus("error");
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to sync to Firestore.",
        });
      }
    } catch (err: any) {
      setSyncStatus("error");
      setStatusMessage({
        type: "error",
        text: err?.message || "An unexpected error occurred during sync.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Pull from Cloud
  const handlePullFromCloud = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: "info", text: "Fetching cloud records from Firestore..." });

    try {
      const res = await fetchAllFromFirestore();
      if (res.success) {
        const time = new Date().toISOString();
        setLastSyncTime(time);
        setSyncStatus("synced");
        setStatusMessage({
          type: "success",
          text: `Pulled ${res.expenses.length} expenses and ${res.incomes.length} incomes from Firestore.`,
        });
        if (onSyncCompleted && (res.expenses.length > 0 || res.incomes.length > 0)) {
          onSyncCompleted(res.expenses, res.incomes);
        }
      } else {
        setSyncStatus("error");
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to fetch cloud records.",
        });
      }
    } catch (err: any) {
      setSyncStatus("error");
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to pull cloud records.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Saving Custom Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomFirebaseConfig(config);
    setConfigSaveSuccess(true);
    setTimeout(() => setConfigSaveSuccess(false), 3000);
    const { isValid } = getFirebaseInstances();
    if (isValid) {
      setStatusMessage({ type: "success", text: "Firebase credentials updated & verified." });
    } else {
      setStatusMessage({ type: "error", text: "Saved, but credentials appear incomplete." });
    }
  };

  const handleResetConfig = () => {
    resetCustomFirebaseConfig();
    const def = getActiveFirebaseConfig();
    setConfig(def);
    setStatusMessage({ type: "info", text: "Reset Firebase configuration to app defaults." });
  };

  const formatTimeAgo = (iso?: string | null) => {
    if (!iso) return "Never";
    try {
      const date = new Date(iso);
      return (
        date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
        " at " +
        date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return "Unknown";
    }
  };

  return (
    <div
      id="firebase-sync-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/50 backdrop-blur-xs animate-fadeIn text-[#202124]"
      onClick={onClose}
    >
      <div
        id="firebase-sync-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E8EAED] animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F1F3F4] bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold shadow-2xs border border-[#D2E3FC]">
              <Cloud size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#202124]">Cloud Firestore Sync</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    !isOnline
                      ? "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]"
                      : isValidConfig
                      ? "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]"
                      : "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      !isOnline ? "bg-[#FBBC04]" : isValidConfig ? "bg-[#188038] animate-pulse" : "bg-[#D93025]"
                    }`}
                  />
                  {!isOnline ? "Offline Mode" : isValidConfig ? "Live Cloud Active" : "Config Needed"}
                </span>
              </div>
              <p className="text-xs text-[#5F6368]">
                Real-time backup & automatic multi-device synchronization
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-firebase-modal"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-2 bg-[#F1F3F4] border-b border-[#E8EAED]">
          <button
            type="button"
            id="tab-btn-sync-status"
            onClick={() => setActiveTab("status")}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "status"
                ? "bg-white text-[#1A73E8] shadow-2xs"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            <Server size={14} />
            <span>Sync Status & Actions</span>
          </button>
          <button
            type="button"
            id="tab-btn-sync-config"
            onClick={() => setActiveTab("config")}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "config"
                ? "bg-white text-[#1A73E8] shadow-2xs"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            <Key size={14} />
            <span>Firebase Config</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "status" ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Overall Status Banner */}
              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#5F6368]">Connection Status</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isOnline ? (
                      <>
                        <Wifi size={14} className="text-[#188038]" />
                        <span className="text-[#137333]">Internet Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff size={14} className="text-[#C5221F]" />
                        <span className="text-[#C5221F]">Internet Offline (Local Cache Active)</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8EAED]">
                  <span className="text-xs font-semibold text-[#5F6368]">Firestore Target</span>
                  <span className="font-mono text-xs font-bold text-[#1A73E8] truncate max-w-[200px]">
                    {config.projectId || "Not Set"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8EAED]">
                  <span className="text-xs font-semibold text-[#5F6368]">Collection Name</span>
                  <span className="font-mono text-xs font-bold text-[#202124] bg-white px-2 py-0.5 rounded-lg border border-[#E8EAED]">
                    expenses & incomes
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8EAED]">
                  <span className="text-xs font-semibold text-[#5F6368]">Last Cloud Sync</span>
                  <span className="text-xs font-medium text-[#202124]">
                    {formatTimeAgo(lastSyncTime)}
                  </span>
                </div>
              </div>

              {/* Status Message Alert */}
              {statusMessage.text && (
                <div
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                    statusMessage.type === "success"
                      ? "bg-[#E6F4EA] border-[#CEEAD6] text-[#137333]"
                      : statusMessage.type === "error"
                      ? "bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]"
                      : "bg-[#E8F0FE] border-[#D2E3FC] text-[#1A73E8]"
                  }`}
                >
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 size={16} className="shrink-0 text-[#188038]" />
                  ) : statusMessage.type === "error" ? (
                    <AlertTriangle size={16} className="shrink-0 text-[#D93025]" />
                  ) : (
                    <RefreshCw size={16} className="shrink-0 animate-spin text-[#1A73E8]" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Offline fallback banner if offline */}
              {!isOnline && (
                <div className="p-3.5 bg-[#FEF7E0] border border-[#FEEFC3] rounded-2xl text-xs text-[#B06000] flex items-start gap-2.5">
                  <CloudOff size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Offline Mode Active</p>
                    <p className="mt-0.5 opacity-90">
                      All new expenses, edits, and deletions are safely stored in your browser's
                      LocalStorage. They will automatically sync to Firestore once internet connectivity
                      resumes.
                    </p>
                  </div>
                </div>
              )}

              {/* Local vs Cloud Counts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] text-center">
                  <span className="text-[10px] text-[#5F6368] block">Local Expenses</span>
                  <span className="text-base font-bold text-[#202124]">{expenses.length}</span>
                  <span className="text-[10px] text-[#80868B] block">Saved on device</span>
                </div>
                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] text-center">
                  <span className="text-[10px] text-[#5F6368] block">Local Incomes</span>
                  <span className="text-base font-bold text-[#137333]">{incomes.length}</span>
                  <span className="text-[10px] text-[#80868B] block">Saved on device</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  id="btn-sync-now-manual"
                  onClick={handleManualPushSync}
                  disabled={isSyncing || !isOnline || !isValidConfig}
                  className="w-full py-3 bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-[#DADCE0] disabled:text-[#80868B] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-98"
                >
                  <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                  <span>{isSyncing ? "Syncing with Firestore..." : "Backup & Sync Now"}</span>
                </button>

                <button
                  type="button"
                  id="btn-pull-cloud-records"
                  onClick={handlePullFromCloud}
                  disabled={isSyncing || !isOnline || !isValidConfig}
                  className="w-full py-2.5 bg-white hover:bg-[#F8F9FA] border border-[#DADCE0] hover:border-[#1A73E8] text-[#1A73E8] font-bold text-xs rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DownloadCloud size={15} />
                  <span>Fetch & Merge Remote Cloud Records</span>
                </button>
              </div>

              <div className="p-3 bg-[#E8F0FE]/40 rounded-2xl border border-[#D2E3FC] text-[11px] text-[#5F6368] space-y-1">
                <p className="font-semibold text-[#1A73E8] flex items-center gap-1">
                  <ShieldCheck size={14} />
                  <span>Real-time Automatic Sync</span>
                </p>
                <p>
                  Any expense added, edited, or removed in Khata is automatically synced to Firestore in
                  the background.
                </p>
              </div>
            </div>
          ) : (
            /* Tab 2: Firebase Credentials / Config Form */
            <form onSubmit={handleSaveConfig} className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#202124]">Firebase Cloud Credentials</h4>
                  <p className="text-[11px] text-[#5F6368]">
                    Provisioned via Google Cloud or enter custom Firebase config
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetConfig}
                  className="text-[11px] font-semibold text-[#5F6368] hover:text-[#202124] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset Default</span>
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-[#5F6368] block mb-0.5">
                    Project ID
                  </label>
                  <input
                    id="input-firebase-project-id"
                    type="text"
                    value={config.projectId}
                    onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                    placeholder="potent-crossbar-wtvkm"
                    className="w-full px-3 py-2 text-xs font-mono bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#5F6368] block mb-0.5">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      id="input-firebase-api-key"
                      type={showApiKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="w-full pl-3 pr-16 py-2 text-xs font-mono bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1A73E8] hover:underline cursor-pointer"
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-[#5F6368] block mb-0.5">
                      Auth Domain
                    </label>
                    <input
                      type="text"
                      value={config.authDomain}
                      onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                      placeholder="project.firebaseapp.com"
                      className="w-full px-3 py-2 text-xs font-mono bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#5F6368] block mb-0.5">
                      App ID
                    </label>
                    <input
                      type="text"
                      value={config.appId}
                      onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                      placeholder="1:614...:web:..."
                      className="w-full px-3 py-2 text-xs font-mono bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-[#5F6368] block mb-0.5">
                      Storage Bucket
                    </label>
                    <input
                      type="text"
                      value={config.storageBucket}
                      onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                      placeholder="project.firebasestorage.app"
                      className="w-full px-3 py-2 text-xs font-mono bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#5F6368] block mb-0.5">
                      Messaging Sender ID
                    </label>
                    <input
                      type="text"
                      value={config.messagingSenderId}
                      onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                      placeholder="614702205249"
                      className="w-full px-3 py-2 text-xs font-mono bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#5F6368] block mb-0.5">
                    Firestore Database ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={config.firestoreDatabaseId || ""}
                    onChange={(e) => setConfig({ ...config, firestoreDatabaseId: e.target.value })}
                    placeholder="(default) or custom database ID"
                    className="w-full px-3 py-2 text-xs font-mono bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                  />
                </div>
              </div>

              {configSaveSuccess && (
                <div className="p-2.5 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>Configuration saved successfully!</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-save-firebase-config"
                className="w-full py-2.5 bg-[#188038] hover:bg-[#137333] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save size={15} />
                <span>Save Firebase Credentials</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F8F9FA] border-t border-[#F1F3F4] flex items-center justify-between text-xs text-[#5F6368]">
          <div className="flex items-center gap-1 text-[11px]">
            <Database size={13} className="text-[#1A73E8]" />
            <span>Google Cloud Firestore</span>
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
