import React, { useState } from "react";
import {
  X,
  Smartphone,
  Download,
  Check,
  Sparkles,
  Share2,
  ExternalLink,
  Layers,
  HelpCircle,
  Copy,
  Terminal,
} from "lucide-react";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onTriggerInstall: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall,
}) => {
  const [copiedPwa, setCopiedPwa] = useState(false);
  const [copiedPwa2Apk, setCopiedPwa2Apk] = useState(false);
  const [activeTab, setActiveTab] = useState<"instant" | "apk-tools" | "capacitor">("instant");

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedPwa(true);
    setTimeout(() => setCopiedPwa(false), 2000);
  };

  const handleCopyCapacitorCmd = () => {
    const cmd = `npm i -g @bubblewrap/cli\nbubblewrap init --manifest=${window.location.origin}/manifest.json\nbubblewrap build`;
    navigator.clipboard.writeText(cmd);
    setCopiedPwa2Apk(true);
    setTimeout(() => setCopiedPwa2Apk(false), 2500);
  };

  return (
    <div
      id="install-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/50 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="install-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E8EAED] text-[#202124] animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F1F3F4] px-5 py-4 bg-[#F8F9FA] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC]">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#202124] flex items-center gap-1.5">
                <span>Android APK & Mobile App</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E6F4EA] text-[#137333]">
                  PWA + APK Ready
                </span>
              </h3>
              <p className="text-xs text-[#5F6368]">Standalone Indian Khata Ledger on Phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E8EAED] bg-[#F8F9FA] px-4 pt-2 gap-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("instant")}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "instant"
                ? "border-[#1A73E8] text-[#1A73E8] font-bold"
                : "border-transparent text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            1. Direct Android Install
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("apk-tools")}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "apk-tools"
                ? "border-[#1A73E8] text-[#1A73E8] font-bold"
                : "border-transparent text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            2. Build APK (1-Click Online)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("capacitor")}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "capacitor"
                ? "border-[#1A73E8] text-[#1A73E8] font-bold"
                : "border-transparent text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            3. Google Play TWA / CLI
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "instant" && (
            <div className="space-y-3.5">
              {deferredPrompt ? (
                <div className="bg-[#E6F4EA] p-4 rounded-2xl border border-[#CEEAD6] text-center space-y-2">
                  <div className="text-xs font-bold text-[#137333]">🚀 Instant 1-Tap Mobile Install Ready</div>
                  <p className="text-[11px] text-[#3C4043]">
                    Install Khata directly to your Android device with a native standalone launcher icon.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onTriggerInstall();
                      onClose();
                    }}
                    className="w-full py-2.5 bg-[#137333] hover:bg-[#0D652D] text-white text-xs font-bold rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Install Khata App on Android</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#E8F0FE] p-3.5 rounded-2xl border border-[#D2E3FC] text-xs space-y-1">
                  <div className="font-bold text-[#1A73E8] flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Instant Native Experience</span>
                  </div>
                  <p className="text-[11px] text-[#3C4043] leading-relaxed">
                    Khata is fully PWA & WebAPK compliant with a valid Web Manifest, custom icon, and standalone display mode. When installed on Android Chrome, it creates an authentic native WebAPK file.
                  </p>
                </div>
              )}

              <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#E8EAED] space-y-2 text-xs">
                <div className="font-bold text-[#202124] flex items-center gap-1.5">
                  <span>📱 How to install directly on Android:</span>
                </div>
                <ol className="list-decimal list-inside text-[#5F6368] space-y-1.5 pl-1 text-[11px] leading-relaxed">
                  <li>
                    Open this URL on your phone's <b>Chrome browser</b>
                  </li>
                  <li>
                    Tap the <b>three dots menu (⋮)</b> in the top right corner
                  </li>
                  <li>
                    Select <b>"Install app"</b> or <b>"Add to Home screen"</b>
                  </li>
                  <li>Android will package it as an installed app on your home screen</li>
                </ol>
              </div>

              <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#E8EAED] space-y-2 text-xs">
                <div className="font-bold text-[#202124] flex items-center gap-1.5">
                  <span>🍎 For iPhone / iPad (iOS Safari):</span>
                </div>
                <p className="text-[11px] text-[#5F6368]">
                  Open in Safari, tap the <b>Share icon (↑)</b> at the bottom, and tap <b>"Add to Home Screen"</b>.
                </p>
              </div>
            </div>
          )}

          {activeTab === "apk-tools" && (
            <div className="space-y-3.5 text-xs">
              <div className="bg-[#FEF7E0] p-3.5 rounded-2xl border border-[#FEEFC3] space-y-1 text-xs">
                <div className="font-bold text-[#B06000] flex items-center gap-1.5">
                  <span>📦 Generate Standalone Signed .APK File</span>
                </div>
                <p className="text-[11px] text-[#3C4043] leading-relaxed">
                  You can convert this live URL into an installable <b>.apk</b> or <b>.aab</b> file in 30 seconds using Google's trusted PWA-to-APK builder:
                </p>
              </div>

              <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#E8EAED] space-y-2.5">
                <div className="font-bold text-[#202124] flex items-center justify-between">
                  <span>PWABuilder (by Microsoft & Google)</span>
                  <span className="text-[10px] text-[#137333] font-bold bg-[#E6F4EA] px-2 py-0.5 rounded-full">
                    Recommended Free
                  </span>
                </div>
                <ol className="list-decimal list-inside text-[#5F6368] space-y-1.5 pl-1 text-[11px] leading-relaxed">
                  <li>Copy the shared live app URL below</li>
                  <li>Visit <b>PWABuilder.com</b> or <b>Web2Apk</b> in your browser</li>
                  <li>Paste the URL and click <b>"Package for Android"</b></li>
                  <li>Download the generated <b>.apk</b> file and install it directly on any Android phone</li>
                </ol>
                <div className="pt-1">
                  <a
                    href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <span>Open PWABuilder with this App URL</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === "capacitor" && (
            <div className="space-y-3.5 text-xs">
              <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#E8EAED] space-y-2">
                <div className="font-bold text-[#202124] flex items-center gap-1.5">
                  <Terminal size={15} className="text-[#1A73E8]" />
                  <span>Google Bubblewrap CLI (Official Trusted Web Activity)</span>
                </div>
                <p className="text-[11px] text-[#5F6368] leading-relaxed">
                  Google's official CLI tool generates Google Play Store compatible <b>.aab</b> and <b>.apk</b> packages from the project manifest:
                </p>
                <div className="bg-[#202124] text-[#E8EAED] p-3 rounded-xl font-mono text-[11px] space-y-1 overflow-x-auto">
                  <div className="text-[#8AB4F8]"># 1. Install Google Bubblewrap CLI</div>
                  <div>npm i -g @bubblewrap/cli</div>
                  <div className="text-[#8AB4F8] pt-1"># 2. Initialize from app manifest</div>
                  <div>bubblewrap init --manifest={window.location.origin}/manifest.json</div>
                  <div className="text-[#8AB4F8] pt-1"># 3. Compile signed APK</div>
                  <div>bubblewrap build</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCapacitorCmd}
                  className="w-full py-2 bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#202124] font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedPwa2Apk ? <Check size={14} className="text-[#137333]" /> : <Copy size={14} />}
                  <span>{copiedPwa2Apk ? "CLI Commands Copied!" : "Copy CLI Commands"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E8EAED] bg-[#F8F9FA] shrink-0 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-2.5 rounded-full text-xs font-bold border border-[#DADCE0] hover:bg-[#F1F3F4] text-[#3C4043] transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-white"
          >
            {copiedPwa ? <Check size={14} className="text-[#137333]" /> : <Share2 size={14} />}
            <span>{copiedPwa ? "App URL Copied to Clipboard!" : "Copy App URL (for Phone / APK Builder)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
