import React, { useState } from "react";
import {
  X,
  Shield,
  ShieldCheck,
  Camera,
  Mic,
  MapPin,
  Bell,
  Image as ImageIcon,
  HardDrive,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCw,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { PermissionType, PermissionStatusInfo } from "../types";
import { DECLARED_PERMISSIONS } from "../utils/permissionManager";

interface PermissionsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: Record<PermissionType, PermissionStatusInfo>;
  onTestPermission: (type: PermissionType) => void;
  onRefreshPermissions: () => void;
}

export const PermissionsManagerModal: React.FC<PermissionsManagerModalProps> = ({
  isOpen,
  onClose,
  permissions,
  onTestPermission,
  onRefreshPermissions,
}) => {
  const [selectedType, setSelectedType] = useState<PermissionType>("camera");

  if (!isOpen) return null;

  const currentDecl = DECLARED_PERMISSIONS[selectedType];
  const currentStatus = permissions[selectedType] || {
    type: selectedType,
    status: "prompt",
    canRequest: true,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "granted":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#137333] bg-[#E6F4EA] border border-[#CEEAD6] px-2.5 py-1 rounded-full">
            <CheckCircle2 size={12} />
            Granted (Active)
          </span>
        );
      case "denied":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#C5221F] bg-[#FCE8E6] border border-[#FAD2CF] px-2.5 py-1 rounded-full">
            <AlertCircle size={12} />
            Denied (Blocked)
          </span>
        );
      case "unsupported":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#5F6368] bg-[#F1F3F4] border border-[#DADCE0] px-2.5 py-1 rounded-full">
            <Info size={12} />
            Not Supported
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#B06000] bg-[#FEF7E0] border border-[#FEEFC3] px-2.5 py-1 rounded-full">
            <HelpCircle size={12} />
            Prompt (Ready to Request)
          </span>
        );
    }
  };

  const getPermissionIcon = (type: PermissionType, size = 18) => {
    switch (type) {
      case "camera":
        return <Camera size={size} className="text-[#1A73E8]" />;
      case "microphone":
        return <Mic size={size} className="text-[#0F9D58]" />;
      case "geolocation":
        return <MapPin size={size} className="text-[#EA4335]" />;
      case "notifications":
        return <Bell size={size} className="text-[#FBBC04]" />;
      case "media":
        return <ImageIcon size={size} className="text-[#9334E8]" />;
      case "storage":
        return <HardDrive size={size} className="text-[#0284C7]" />;
      case "sms":
        return <MessageSquare size={size} className="text-[#10B981]" />;
      case "call_logs":
        return <PhoneCall size={size} className="text-[#F97316]" />;
    }
  };

  const getAllowOutcomeText = (type: PermissionType) => {
    switch (type) {
      case "camera":
        return "Instant Receipt Scanner & Bill OCR Extraction";
      case "microphone":
        return "Live Voice Logger & Spoken Expense Audio Parser";
      case "geolocation":
        return "Auto GPS City & Neighborhood Locality Tagging";
      case "notifications":
        return "9 PM Daily Khata Reminder & 80% Budget Limit Alerts";
      case "media":
        return "Photo Album Picker & Payment Screenshot OCR";
      case "storage":
        return "Permanent Offline Ledger Lock (Zero Data Loss)";
      case "sms":
        return "Auto-Read Indian Bank & UPI Transaction SMS (HDFC/SBI/ICICI)";
      case "call_logs":
        return "Split Expenses & Reconcile Udhar with Phone Contacts";
    }
  };

  return (
    <div
      id="permissions-manager-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/60 backdrop-blur-xs animate-fadeIn text-[#202124]"
      onClick={onClose}
    >
      <div
        id="permissions-manager-content"
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#DADCE0] flex flex-col transition-all animate-scaleUp text-[#202124]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F1F3F4] bg-[#F8F9FA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] border border-[#D2E3FC] flex items-center justify-center text-[#1A73E8] shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-[#202124]">
                  Runtime Permissions Hub
                </h3>
                <span className="text-[10px] font-bold bg-[#1A73E8] text-white px-2 py-0.5 rounded-full">
                  4-Step Architecture
                </span>
              </div>
              <p className="text-xs text-[#5F6368]">
                Declare • Check • Request • Handle Result (8 Declared Permissions)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRefreshPermissions}
              title="Refresh Permissions Status"
              className="p-2 text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] rounded-full transition-colors cursor-pointer"
            >
              <RotateCw size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 4-Step Architecture Banner */}
        <div className="bg-[#E8F0FE]/60 px-4 py-2.5 border-b border-[#D2E3FC] flex items-center justify-between overflow-x-auto no-scrollbar gap-2 text-xs">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <span className="font-bold text-[#1A73E8]">Declare</span>
          </div>
          <ArrowRight size={12} className="text-[#8AB4F8] shrink-0" />
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <span className="font-bold text-[#1A73E8]">Check</span>
          </div>
          <ArrowRight size={12} className="text-[#8AB4F8] shrink-0" />
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-[10px] font-bold">3</span>
            <span className="font-bold text-[#1A73E8]">Request</span>
          </div>
          <ArrowRight size={12} className="text-[#8AB4F8] shrink-0" />
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-[10px] font-bold">4</span>
            <span className="font-bold text-[#1A73E8]">Handle Result</span>
          </div>
        </div>

        {/* Modal Body: Sidebar Selector & Detail Inspector */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: Permission Items List */}
          <div className="md:col-span-5 space-y-1.5">
            <p className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider mb-1">
              Declared Permissions ({Object.keys(DECLARED_PERMISSIONS).length})
            </p>
            {(Object.keys(DECLARED_PERMISSIONS) as PermissionType[]).map((type) => {
              const decl = DECLARED_PERMISSIONS[type];
              const stat = permissions[type] || { status: "prompt" };
              const isSelected = selectedType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`w-full text-left p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#E8F0FE] border-[#1A73E8] shadow-xs"
                      : "bg-[#F8F9FA] hover:bg-[#F1F3F4] border-[#DADCE0]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xs shrink-0 border border-[#E8EAED]">
                      {getPermissionIcon(type, 16)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#202124] truncate">
                        {decl.name}
                      </p>
                      <p className="text-[10px] text-[#5F6368] truncate">
                        {decl.shortLabel}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full block ${
                        stat.status === "granted"
                          ? "bg-[#34A853]"
                          : stat.status === "denied"
                          ? "bg-[#EA4335]"
                          : "bg-[#FBBC04]"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: 4-Step Technical & User Breakdown */}
          <div className="md:col-span-7 space-y-3 bg-[#F8F9FA] p-4 rounded-2xl border border-[#DADCE0]">
            <div className="flex items-center justify-between border-b border-[#E8EAED] pb-3">
              <div className="flex items-center gap-2">
                {getPermissionIcon(selectedType, 20)}
                <h4 className="font-bold text-sm text-[#202124]">
                  {currentDecl.title}
                </h4>
              </div>
              {getStatusBadge(currentStatus.status)}
            </div>

            {/* Step 1 Breakdown */}
            <div className="bg-white p-3 rounded-xl border border-[#E8EAED] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A73E8]">
                <span className="w-4 h-4 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-[9px]">1</span>
                <span>Declare (Manifest & Config)</span>
              </div>
              <p className="text-[11px] text-[#3C4043]">
                Declared in <code className="bg-[#F1F3F4] px-1 py-0.5 rounded text-[10px]">metadata.json</code> & <code className="bg-[#F1F3F4] px-1 py-0.5 rounded text-[10px]">manifest.json</code> ({currentDecl.category})
              </p>
            </div>

            {/* Step 2 Breakdown */}
            <div className="bg-white p-3 rounded-xl border border-[#E8EAED] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A73E8]">
                <span className="w-4 h-4 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-[9px]">2</span>
                <span>Check (Runtime State)</span>
              </div>
              <p className="text-[11px] text-[#3C4043]">
                Current status: <strong className="capitalize">{currentStatus.status}</strong>
                {'lastChecked' in currentStatus && currentStatus.lastChecked && (
                  <span className="text-[10px] text-[#5F6368] block">Checked at: {currentStatus.lastChecked}</span>
                )}
              </p>
            </div>

            {/* Step 3 Breakdown */}
            <div className="bg-white p-3 rounded-xl border border-[#E8EAED] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A73E8]">
                <span className="w-4 h-4 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-[9px]">3</span>
                <span>Request (OS-Level Prompt)</span>
              </div>
              <p className="text-[11px] text-[#3C4043]">
                Prompt reason: &quot;{currentDecl.osPromptReason}&quot;
              </p>
            </div>

            {/* Step 4 Breakdown */}
            <div className="bg-white p-3 rounded-xl border border-[#E8EAED] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A73E8]">
                <span className="w-4 h-4 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-[9px]">4</span>
                <span>Handle Result (Allow / Deny Outcomes)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                <div className="bg-[#E6F4EA] p-2 rounded-lg text-[#137333]">
                  <strong>On Allow:</strong> {getAllowOutcomeText(selectedType)}
                </div>
                <div className="bg-[#FCE8E6] p-2 rounded-lg text-[#C5221F]">
                  <strong>On Deny:</strong> Displays rationale sheet & {currentDecl.fallbackLabel}
                </div>
              </div>
            </div>

            {/* Test Action Button */}
            <div className="pt-2">
              <button
                type="button"
                id={`btn-test-permission-${selectedType}`}
                onClick={() => {
                  onClose();
                  onTestPermission(selectedType);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                <span>Test 4-Step Flow for {currentDecl.name}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F1F3F4] bg-[#F8F9FA] flex items-center justify-between text-xs text-[#5F6368]">
          <span>All hardware & private data remains 100% on-device.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-[#E8EAED] text-[#202124] font-semibold rounded-full border border-[#DADCE0] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

