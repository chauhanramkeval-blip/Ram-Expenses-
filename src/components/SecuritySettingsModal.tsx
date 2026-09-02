import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  ShieldCheck,
  Fingerprint,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  Smartphone,
  Eye,
  EyeOff,
} from "lucide-react";
import { AppSecuritySettings } from "../types";
import {
  checkBiometricAvailability,
  triggerBiometricAuthentication,
} from "../utils/biometrics";

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  securitySettings: AppSecuritySettings;
  onSaveSecuritySettings: (newSettings: AppSecuritySettings) => void;
  onLockImmediately: () => void;
}

const SECURITY_QUESTIONS = [
  "What is your favorite Indian street food or sweet?",
  "Which Indian city were you born in?",
  "What was the name of your first school?",
  "What is your mother's maiden name?",
  "What was your first car/two-wheeler model?",
];

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  securitySettings,
  onSaveSecuritySettings,
  onLockImmediately,
}) => {
  const [isEnabled, setIsEnabled] = useState(securitySettings.isEnabled);
  const [pinCode, setPinCode] = useState(securitySettings.pinCode || "");
  const [confirmPin, setConfirmPin] = useState(securitySettings.pinCode || "");
  const [showPin, setShowPin] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(
    securitySettings.isBiometricEnabled
  );
  const [autoLockMinutes, setAutoLockMinutes] = useState(
    securitySettings.autoLockMinutes ?? 0
  );
  const [securityQuestion, setSecurityQuestion] = useState(
    securitySettings.securityQuestion || SECURITY_QUESTIONS[0]
  );
  const [securityAnswer, setSecurityAnswer] = useState(
    securitySettings.securityAnswer || ""
  );

  const [hasBiometricHardware, setHasBiometricHardware] = useState<boolean>(true);
  const [bioTestSuccess, setBioTestSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setIsEnabled(securitySettings.isEnabled);
      setPinCode(securitySettings.pinCode || "");
      setConfirmPin(securitySettings.pinCode || "");
      setIsBiometricEnabled(securitySettings.isBiometricEnabled);
      setAutoLockMinutes(securitySettings.autoLockMinutes ?? 0);
      setSecurityQuestion(securitySettings.securityQuestion || SECURITY_QUESTIONS[0]);
      setSecurityAnswer(securitySettings.securityAnswer || "");
      setErrorMsg("");
      setBioTestSuccess(null);

      // Check biometric sensor
      checkBiometricAvailability().then((avail) => {
        setHasBiometricHardware(avail);
      });
    }
  }, [isOpen, securitySettings]);

  if (!isOpen) return null;

  // Handle Biometric Hardware test
  const handleTestBiometrics = async () => {
    setBioTestSuccess(null);
    setErrorMsg("");
    const res = await triggerBiometricAuthentication();
    if (res.success) {
      setBioTestSuccess("Fingerprint sensor verified successfully! ✅");
    } else {
      setErrorMsg(res.message || "Biometric sensor check failed.");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isEnabled) {
      // Validate PIN
      if (!/^\d{4}$/.test(pinCode)) {
        setErrorMsg("Please enter a valid 4-digit numeric PIN.");
        return;
      }
      if (pinCode !== confirmPin) {
        setErrorMsg("The PIN and Confirm PIN do not match.");
        return;
      }
    }

    const updated: AppSecuritySettings = {
      isEnabled,
      pinCode: isEnabled ? pinCode : "",
      isBiometricEnabled: isEnabled ? isBiometricEnabled : false,
      autoLockMinutes,
      securityQuestion: isEnabled ? securityQuestion : undefined,
      securityAnswer: isEnabled ? securityAnswer : undefined,
    };

    onSaveSecuritySettings(updated);
    onClose();
  };

  return (
    <div
      id="security-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/50 backdrop-blur-xs animate-fadeIn text-[#202124]"
      onClick={onClose}
    >
      <div
        id="security-settings-card"
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8EAED] p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold shadow-2xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#202124] flex items-center gap-1.5">
                <span>Privacy & App Lock</span>
                <span className="text-[10px] bg-[#E6F4EA] text-[#137333] font-semibold px-2 py-0.5 rounded-full border border-[#CEEAD6]">
                  Biometric
                </span>
              </h3>
              <p className="text-xs text-[#5F6368]">
                Protect sensitive financial records with PIN or Fingerprint
              </p>
            </div>
          </div>
          <button
            id="btn-close-security-settings"
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Main Master Toggle: Enable App Lock */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E8EAED]">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isEnabled ? "bg-[#1A73E8] text-white" : "bg-[#E8EAED] text-[#5F6368]"
                }`}
              >
                {isEnabled ? <Lock size={18} /> : <Unlock size={18} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#202124]">
                  Require Lock on App Launch
                </h4>
                <p className="text-[11px] text-[#5F6368]">
                  {isEnabled
                    ? "Financial data is shielded behind authentication"
                    : "App opens directly without PIN or biometric screen"}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="toggle-app-lock"
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#DADCE0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#DADCE0] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
            </label>
          </div>

          {isEnabled && (
            <div className="space-y-4 animate-fadeIn">
              {/* PIN Code Configuration */}
              <div className="bg-[#FFFFFF] border border-[#E8EAED] rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                    <KeyRound size={15} className="text-[#1A73E8]" />
                    <span>Set 4-Digit PIN Code</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[11px] font-semibold text-[#1A73E8] flex items-center gap-1 hover:underline"
                  >
                    {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showPin ? "Hide PIN" : "Show PIN"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] font-semibold text-[#5F6368] block mb-1">
                      New PIN (4 Digits)
                    </span>
                    <input
                      id="input-security-pin"
                      type={showPin ? "text" : "password"}
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required={isEnabled}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 1234"
                      className="w-full text-center tracking-widest text-lg font-bold py-2 bg-[#F8F9FA] focus:bg-white rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-[#5F6368] block mb-1">
                      Confirm PIN
                    </span>
                    <input
                      id="input-confirm-pin"
                      type={showPin ? "text" : "password"}
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required={isEnabled}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 1234"
                      className="w-full text-center tracking-widest text-lg font-bold py-2 bg-[#F8F9FA] focus:bg-white rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                    />
                  </div>
                </div>

                {pinCode && confirmPin && pinCode === confirmPin && (
                  <p className="text-[11px] font-semibold text-[#137333] flex items-center gap-1">
                    <CheckCircle2 size={13} /> PIN codes match!
                  </p>
                )}
              </div>

              {/* Biometric / Fingerprint Unlock */}
              <div className="bg-[#F8F9FA] border border-[#E8EAED] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                      <Fingerprint size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#202124]">
                        Fingerprint / Biometric Unlock
                      </h4>
                      <p className="text-[11px] text-[#5F6368]">
                        Use Touch ID, Face ID or device fingerprint scanner
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="toggle-biometric"
                      type="checkbox"
                      checked={isBiometricEnabled}
                      onChange={(e) => setIsBiometricEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#DADCE0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#DADCE0] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
                  </label>
                </div>

                {isBiometricEnabled && (
                  <div className="pt-2 border-t border-[#E8EAED] flex items-center justify-between">
                    <span className="text-[11px] text-[#5F6368]">
                      Device sensor supported
                    </span>
                    <button
                      type="button"
                      onClick={handleTestBiometrics}
                      className="text-xs font-bold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Fingerprint size={13} />
                      <span>Test Sensor</span>
                    </button>
                  </div>
                )}

                {bioTestSuccess && (
                  <p className="text-[11px] font-semibold text-[#137333]">{bioTestSuccess}</p>
                )}
              </div>

              {/* Auto-Lock Inactivity Timeout */}
              <div className="bg-white border border-[#E8EAED] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                  <Clock size={15} className="text-[#1A73E8]" />
                  <span>Auto-Lock Sensitivity</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { val: 0, label: "Immediately" },
                    { val: 1, label: "1 Minute" },
                    { val: 5, label: "5 Minutes" },
                    { val: 15, label: "15 Minutes" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      id={`btn-autolock-${item.val}`}
                      onClick={() => setAutoLockMinutes(item.val)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        autoLockMinutes === item.val
                          ? "bg-[#1A73E8] text-white border-[#1A73E8] shadow-2xs"
                          : "bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#5F6368] border-[#E8EAED]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Question for Forgot PIN Recovery */}
              <div className="bg-white border border-[#E8EAED] rounded-2xl p-4 space-y-2.5">
                <label className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                  <HelpCircle size={15} className="text-[#F9AB00]" />
                  <span>PIN Recovery Security Question</span>
                </label>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="w-full bg-[#F8F9FA] text-xs font-medium text-[#202124] p-2 rounded-xl border border-[#DADCE0] outline-none"
                >
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your secret answer (e.g. Samosa, Jaipur)"
                  className="w-full bg-[#F8F9FA] focus:bg-white text-xs text-[#202124] p-2.5 rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-[#FCE8E6] border border-[#FAD2CF] text-[#C5221F] rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-[#F1F3F4] flex items-center justify-between gap-2">
            {isEnabled && securitySettings.isEnabled ? (
              <button
                type="button"
                id="btn-lock-app-now"
                onClick={() => {
                  onClose();
                  onLockImmediately();
                }}
                className="px-3 py-2 text-xs font-bold text-[#C5221F] bg-[#FCE8E6] hover:bg-[#FAD2CF] rounded-full transition-colors cursor-pointer flex items-center gap-1"
              >
                <Lock size={13} />
                <span>Lock Now</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-security"
                className="px-5 py-2 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-full shadow-xs transition-colors cursor-pointer"
              >
                Save Lock Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
