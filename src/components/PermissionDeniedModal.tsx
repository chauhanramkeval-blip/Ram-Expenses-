import React from "react";
import {
  X,
  AlertTriangle,
  Lock,
  Camera,
  Mic,
  MapPin,
  Bell,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  FileImage,
  Keyboard,
  Compass,
  Image as ImageIcon,
  HardDrive,
  MessageSquare,
  PhoneCall,
  Users,
} from "lucide-react";
import { PermissionType } from "../types";
import { DECLARED_PERMISSIONS, POPULAR_INDIAN_CITIES } from "../utils/permissionManager";

interface PermissionDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionType: PermissionType | null;
  errorMessage?: string;
  onRetry: () => void;
  onSelectFallbackCity?: (cityName: string) => void;
  onTriggerFileUpload?: () => void;
  onFocusManualInput?: () => void;
}

export const PermissionDeniedModal: React.FC<PermissionDeniedModalProps> = ({
  isOpen,
  onClose,
  permissionType,
  errorMessage,
  onRetry,
  onSelectFallbackCity,
  onTriggerFileUpload,
  onFocusManualInput,
}) => {
  if (!isOpen || !permissionType) return null;

  const decl = DECLARED_PERMISSIONS[permissionType];

  const getIcon = () => {
    switch (permissionType) {
      case "camera":
        return <Camera size={24} className="text-[#EA4335]" />;
      case "microphone":
        return <Mic size={24} className="text-[#EA4335]" />;
      case "geolocation":
        return <MapPin size={24} className="text-[#EA4335]" />;
      case "notifications":
        return <Bell size={24} className="text-[#EA4335]" />;
      case "media":
        return <ImageIcon size={24} className="text-[#EA4335]" />;
      case "storage":
        return <HardDrive size={24} className="text-[#EA4335]" />;
      case "sms":
        return <MessageSquare size={24} className="text-[#EA4335]" />;
      case "call_logs":
        return <PhoneCall size={24} className="text-[#EA4335]" />;
      default:
        return <AlertTriangle size={24} className="text-[#EA4335]" />;
    }
  };

  return (
    <div
      id="permission-denied-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/60 backdrop-blur-xs animate-fadeIn text-[#202124]"
      onClick={onClose}
    >
      <div
        id="permission-denied-content"
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#DADCE0] p-5 sm:p-6 transition-all animate-scaleUp text-[#202124]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#F1F3F4]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE8E6] flex items-center justify-center shrink-0 border border-[#FAD2CF]">
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D93025] bg-[#FCE8E6] px-2 py-0.5 rounded-md">
                  Step 4: Handle Result (Denied)
                </span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#202124] mt-0.5">
                {decl.title} Was Declined
              </h3>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-permission-denied"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Reason & Rationale */}
        <div className="mt-4 space-y-3.5">
          <div className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-[#E8EAED]">
            <p className="text-xs text-[#3C4043] leading-relaxed">
              <strong className="text-[#202124]">Why Khata needs this: </strong>
              {decl.description}
            </p>
            {errorMessage && (
              <p className="mt-2 text-[11px] text-[#D93025] font-mono bg-white p-2 rounded-lg border border-[#FCE8E6]">
                Browser note: {errorMessage}
              </p>
            )}
          </div>

          {/* Browser Unblock Guide */}
          <div className="border border-[#D2E3FC] bg-[#E8F0FE]/50 rounded-2xl p-3.5">
            <h4 className="text-xs font-bold text-[#1A73E8] flex items-center gap-1.5 mb-2">
              <Lock size={14} />
              <span>How to Re-Enable in Browser Settings:</span>
            </h4>
            <ol className="text-xs text-[#3C4043] space-y-1.5 list-decimal list-inside pl-1">
              <li>Click the <strong>Lock / Settings icon (🔒)</strong> in your browser's address bar.</li>
              <li>Find <strong>{decl.name}</strong> under site permissions.</li>
              <li>Switch the toggle from <em>Block</em> to <strong>Allow</strong>.</li>
              <li>Click <strong>Try Again</strong> below.</li>
            </ol>
          </div>

          {/* Instant Fallbacks according to permission type */}
          <div>
            <h4 className="text-xs font-bold text-[#5F6368] uppercase tracking-wider mb-2">
              Instant Fallback Alternatives:
            </h4>

            {(permissionType === "camera" || permissionType === "media") && (
              <button
                type="button"
                id="btn-fallback-camera-file"
                onClick={() => {
                  onClose();
                  if (onTriggerFileUpload) onTriggerFileUpload();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] hover:bg-[#F1F3F4] border border-[#DADCE0] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0">
                    <FileImage size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#202124]">Upload Receipt Photo File</p>
                    <p className="text-[11px] text-[#5F6368]">Select bill image from device storage / file picker</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[#5F6368] group-hover:text-[#1A73E8] transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {permissionType === "microphone" && (
              <button
                type="button"
                id="btn-fallback-mic-typing"
                onClick={() => {
                  onClose();
                  if (onFocusManualInput) onFocusManualInput();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] hover:bg-[#F1F3F4] border border-[#DADCE0] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] text-[#0F9D58] flex items-center justify-center shrink-0">
                    <Keyboard size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#202124]">Use Quick Keyboard Entry</p>
                    <p className="text-[11px] text-[#5F6368]">Type with smart auto-suggest categories</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[#5F6368] group-hover:text-[#0F9D58] transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {permissionType === "sms" && (
              <button
                type="button"
                id="btn-fallback-sms-manual"
                onClick={() => {
                  onClose();
                  if (onFocusManualInput) onFocusManualInput();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] hover:bg-[#F1F3F4] border border-[#DADCE0] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                    <MessageSquare size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#202124]">Paste SMS Text Manually</p>
                    <p className="text-[11px] text-[#5F6368]">Copy transaction alert and paste in parser</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[#5F6368] group-hover:text-[#059669] transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {permissionType === "call_logs" && (
              <button
                type="button"
                id="btn-fallback-call-manual"
                onClick={() => {
                  onClose();
                  if (onFocusManualInput) onFocusManualInput();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] hover:bg-[#F1F3F4] border border-[#DADCE0] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#202124]">Type Contact Name Manually</p>
                    <p className="text-[11px] text-[#5F6368]">Enter friend / vendor name for expense split</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[#5F6368] group-hover:text-[#EA580C] transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {permissionType === "storage" && (
              <div className="bg-[#E8F0FE]/70 p-3 rounded-2xl border border-[#D2E3FC]">
                <p className="text-xs text-[#1A73E8] font-medium">
                  Standard browser local storage is still active. Cloud backup and manual export (.csv/.json) remain available anytime.
                </p>
              </div>
            )}

            {permissionType === "geolocation" && (
              <div className="space-y-2">
                <p className="text-[11px] text-[#5F6368]">Select your Indian city manually:</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {POPULAR_INDIAN_CITIES.slice(0, 6).map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => {
                        if (onSelectFallbackCity) onSelectFallbackCity(`${city.popularLocalities[0]}, ${city.name}`);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-[#F1F3F4] hover:bg-[#E8F0FE] hover:text-[#1A73E8] text-[#3C4043] rounded-lg text-xs font-semibold border border-[#DADCE0] transition-colors cursor-pointer"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {permissionType === "notifications" && (
              <div className="bg-[#FEF7E0] p-3 rounded-2xl border border-[#FEEFC3]">
                <p className="text-xs text-[#7A4B04] font-medium">
                  No worries! You can still view daily spending insights and budget alerts directly on the <strong>Daily Advisor</strong> tab.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-[#F1F3F4] flex items-center justify-end gap-2.5">
          <button
            type="button"
            id="btn-permission-dismiss"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            I Understand
          </button>
          <button
            type="button"
            id="btn-permission-retry"
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-full shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};

