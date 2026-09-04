import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  Fingerprint,
  Delete,
  Lock,
  Unlock,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { AppSecuritySettings } from "../types";
import { triggerBiometricAuthentication } from "../utils/biometrics";

interface LockScreenProps {
  securitySettings: AppSecuritySettings;
  onUnlock: () => void;
  onResetSecurity: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  securitySettings,
  onUnlock,
  onResetSecurity,
}) => {
  const [pin, setPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isAuthenticatingBio, setIsAuthenticatingBio] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotAnswer, setForgotAnswer] = useState<string>("");
  const [forgotError, setForgotError] = useState<string>("");
  const [bioVerifiedSuccess, setBioVerifiedSuccess] = useState<boolean>(false);

  const targetPin = securitySettings.pinCode || "1234";

  // Trigger Biometric unlock
  const handleBiometricUnlock = useCallback(async () => {
    if (!securitySettings.isBiometricEnabled) return;
    setIsAuthenticatingBio(true);
    setErrorMsg("");

    try {
      const result = await triggerBiometricAuthentication();
      if (result.success) {
        setBioVerifiedSuccess(true);
        setTimeout(() => {
          onUnlock();
        }, 400);
      } else {
        setErrorMsg(result.message || "Fingerprint recognition failed. Please enter PIN.");
      }
    } catch (e: any) {
      setErrorMsg("Biometric verification cancelled. Enter PIN.");
    } finally {
      setIsAuthenticatingBio(false);
    }
  }, [securitySettings.isBiometricEnabled, onUnlock]);

  // Attempt biometric prompt on initial mount if enabled
  useEffect(() => {
    if (securitySettings.isBiometricEnabled) {
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [securitySettings.isBiometricEnabled, handleBiometricUnlock]);

  // Check PIN when 4 digits are entered
  const verifyPin = useCallback(
    (enteredPin: string) => {
      if (enteredPin.length === 4) {
        if (enteredPin === targetPin) {
          setErrorMsg("");
          setBioVerifiedSuccess(true);
          setTimeout(() => {
            onUnlock();
          }, 250);
        } else {
          setIsShaking(true);
          setErrorMsg("Incorrect 4-digit PIN. Try again.");
          setTimeout(() => {
            setPin("");
            setIsShaking(false);
          }, 600);
        }
      }
    },
    [targetPin, onUnlock]
  );

  // Handle digit press
  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg("");
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg("");
    }
  };

  // Listen to physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showForgotModal) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        setPin("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, showForgotModal]);

  // Handle Forgot PIN verification
  const handleVerifyForgot = (e: React.FormEvent) => {
    e.preventDefault();
    const correctAns = securitySettings.securityAnswer || "";
    if (
      correctAns.trim() &&
      forgotAnswer.trim().toLowerCase() === correctAns.trim().toLowerCase()
    ) {
      setShowForgotModal(false);
      onResetSecurity();
      onUnlock();
    } else if (!correctAns.trim()) {
      // Default reset if no question was configured
      setShowForgotModal(false);
      onResetSecurity();
      onUnlock();
    } else {
      setForgotError("Incorrect answer to security question. Please try again.");
    }
  };

  return (
    <div
      id="app-lock-screen"
      className="fixed inset-0 z-[100] bg-[#121316] text-[#F8F9FA] flex flex-col items-center justify-between p-6 select-none overflow-y-auto"
    >
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1A73E8]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Section: Khata India Brand & Security Badge */}
      <div className="w-full max-w-sm flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#388BFD] font-bold shadow-xs">
            ₹
          </div>
          <span className="text-sm font-bold tracking-tight text-[#E2E8F0]">
            Khata <span className="text-[#388BFD]">India</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1E293B] border border-[#334155] text-[11px] font-semibold text-[#94A3B8]">
          <ShieldCheck size={13} className="text-[#10B981]" />
          <span>Encrypted</span>
        </div>
      </div>

      {/* Center Lock Visual & 4-Digit PIN Status */}
      <div className="w-full max-w-xs flex flex-col items-center text-center my-auto py-4">
        {/* Shield / Lock Avatar Icon */}
        <div
          className={`w-18 h-18 rounded-3xl flex items-center justify-center mb-4 transition-all duration-300 border ${
            bioVerifiedSuccess
              ? "bg-[#064E3B] border-[#10B981] text-[#34D399] scale-110 shadow-lg shadow-[#10B981]/20"
              : errorMsg
              ? "bg-[#450A0A] border-[#EF4444] text-[#F87171] animate-pulse shadow-lg shadow-[#EF4444]/20"
              : "bg-[#1E222B] border-[#2D333F] text-[#388BFD] shadow-xl"
          }`}
        >
          {bioVerifiedSuccess ? (
            <Unlock size={36} strokeWidth={2.2} />
          ) : (
            <Lock size={34} strokeWidth={2.2} />
          )}
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
          {bioVerifiedSuccess ? "Unlocked!" : "Khata Financial Lock"}
        </h2>
        <p className="text-xs text-[#94A3B8] max-w-[240px]">
          {bioVerifiedSuccess
            ? "Access granted. Loading your khata..."
            : "Enter 4-digit PIN or use Biometric Fingerprint to view transactions"}
        </p>

        {/* 4 PIN Dots & Eye Toggle */}
        <div className="flex items-center justify-center gap-2.5 my-5">
          <div
            className={`flex items-center justify-center gap-2.5 py-1.5 px-4 rounded-2xl bg-[#1A1D24] border border-[#2B303C] transition-transform ${
              isShaking ? "animate-shake border-[#EF4444]" : ""
            }`}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              const digit = pin[index];
              return (
                <div
                  key={index}
                  className={`w-7 h-9 rounded-xl flex items-center justify-center text-base font-mono font-bold transition-all duration-200 border ${
                    isFilled
                      ? "bg-[#1E293B] border-[#388BFD] text-[#388BFD] scale-105 shadow-md shadow-[#388BFD]/30"
                      : "bg-[#14161D] border-[#2D333F] text-transparent"
                  }`}
                >
                  {isFilled ? (
                    showPin ? (
                      <span>{digit}</span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#388BFD] inline-block shadow-xs shadow-[#388BFD]/80"></span>
                    )
                  ) : (
                    <span className="text-[#333846] text-xs font-normal">−</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            id="btn-lockscreen-toggle-pin"
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="p-2.5 text-[#94A3B8] hover:text-[#388BFD] hover:bg-[#1E222B] rounded-2xl transition-colors cursor-pointer border border-[#2B303C] bg-[#1A1D24] shadow-xs"
            title={showPin ? "Hide PIN digits" : "Show PIN digits"}
            aria-label={showPin ? "Hide PIN digits" : "Show PIN digits"}
          >
            {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Error / Feedback Message */}
        <div className="h-6 flex items-center justify-center">
          {errorMsg ? (
            <span className="text-xs font-semibold text-[#F87171] flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle size={13} /> {errorMsg}
            </span>
          ) : isAuthenticatingBio ? (
            <span className="text-xs font-semibold text-[#60A5FA] flex items-center gap-1.5 animate-pulse">
              <Fingerprint size={14} /> Touch fingerprint sensor...
            </span>
          ) : null}
        </div>
      </div>

      {/* Numeric Keypad & Biometric Button */}
      <div className="w-full max-w-xs space-y-3 pb-2">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { num: "1", sub: "" },
            { num: "2", sub: "ABC" },
            { num: "3", sub: "DEF" },
            { num: "4", sub: "GHI" },
            { num: "5", sub: "JKL" },
            { num: "6", sub: "MNO" },
            { num: "7", sub: "PQRS" },
            { num: "8", sub: "TUV" },
            { num: "9", sub: "WXYZ" },
          ].map((item) => (
            <button
              key={item.num}
              id={`keypad-digit-${item.num}`}
              type="button"
              onClick={() => handleDigit(item.num)}
              className="h-14 sm:h-16 rounded-2xl bg-[#1C1F26] hover:bg-[#282D37] active:bg-[#388BFD] active:text-white border border-[#2B303C] text-white flex flex-col items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer group"
            >
              <span className="text-xl sm:text-2xl font-bold group-active:text-white leading-none">
                {item.num}
              </span>
              {item.sub && (
                <span className="text-[9px] font-semibold text-[#64748B] group-active:text-white/80 tracking-widest mt-0.5">
                  {item.sub}
                </span>
              )}
            </button>
          ))}

          {/* Bottom Left: Biometric / Fingerprint Icon */}
          <button
            id="keypad-biometric-btn"
            type="button"
            onClick={handleBiometricUnlock}
            title="Unlock with Fingerprint / Biometrics"
            className={`h-14 sm:h-16 rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
              securitySettings.isBiometricEnabled
                ? "bg-[#16253B] hover:bg-[#1E3A5F] border-[#1D4ED8] text-[#60A5FA]"
                : "bg-[#1C1F26] opacity-30 border-[#2B303C] text-[#64748B] cursor-not-allowed"
            }`}
            disabled={!securitySettings.isBiometricEnabled || isAuthenticatingBio}
          >
            <Fingerprint size={26} strokeWidth={2} />
            <span className="text-[9px] font-semibold mt-0.5">Touch ID</span>
          </button>

          {/* Bottom Middle: '0' */}
          <button
            id="keypad-digit-0"
            type="button"
            onClick={() => handleDigit("0")}
            className="h-14 sm:h-16 rounded-2xl bg-[#1C1F26] hover:bg-[#282D37] active:bg-[#388BFD] active:text-white border border-[#2B303C] text-white flex flex-col items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer group"
          >
            <span className="text-xl sm:text-2xl font-bold leading-none">0</span>
            <span className="text-[9px] font-semibold text-[#64748B] tracking-widest mt-0.5">
              +
            </span>
          </button>

          {/* Bottom Right: Backspace / Delete */}
          <button
            id="keypad-backspace-btn"
            type="button"
            onClick={handleBackspace}
            title="Delete Digit"
            className="h-14 sm:h-16 rounded-2xl bg-[#1C1F26] hover:bg-[#282D37] active:bg-[#EF4444] active:text-white border border-[#2B303C] text-[#94A3B8] hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <Delete size={22} strokeWidth={2} />
          </button>
        </div>

        {/* Forgot PIN & Help Options */}
        <div className="flex items-center justify-between pt-2 px-1 text-xs">
          <button
            id="btn-forgot-pin"
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-[#94A3B8] hover:text-[#388BFD] transition-colors cursor-pointer flex items-center gap-1 font-medium"
          >
            <HelpCircle size={13} />
            <span>Forgot PIN?</span>
          </button>

          {securitySettings.isBiometricEnabled && (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              className="text-[#60A5FA] hover:text-[#93C5FD] transition-colors cursor-pointer flex items-center gap-1 font-medium"
            >
              <Fingerprint size={13} />
              <span>Use Fingerprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Forgot PIN / Reset Security Dialog */}
      {showForgotModal && (
        <div
          id="forgot-pin-backdrop"
          className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            id="forgot-pin-card"
            className="bg-[#1C1F26] border border-[#333A48] rounded-3xl max-w-sm w-full p-6 text-[#F8F9FA] shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2.5 border-b border-[#2D333F] pb-3">
              <div className="w-9 h-9 rounded-xl bg-[#282E3C] text-[#388BFD] flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Reset Khata PIN</h3>
                <p className="text-[11px] text-[#94A3B8]">Answer security question or recover access</p>
              </div>
            </div>

            <form onSubmit={handleVerifyForgot} className="space-y-3.5">
              {securitySettings.securityQuestion ? (
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                    Security Question:
                  </label>
                  <p className="text-xs font-bold text-[#E2E8F0] bg-[#14161C] p-2.5 rounded-xl border border-[#2D333F]">
                    {securitySettings.securityQuestion}
                  </p>

                  <label className="block text-xs font-semibold text-[#94A3B8] mt-2.5 mb-1">
                    Your Answer:
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotAnswer}
                    onChange={(e) => {
                      setForgotAnswer(e.target.value);
                      setForgotError("");
                    }}
                    placeholder="Enter answer provided during setup"
                    className="w-full bg-[#14161C] border border-[#2D333F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748B] focus:border-[#388BFD] outline-none"
                  />
                </div>
              ) : (
                <div className="bg-[#14161C] border border-[#2D333F] rounded-xl p-3 text-xs text-[#94A3B8] space-y-1.5">
                  <p className="font-semibold text-white">No security question was registered.</p>
                  <p className="text-[11px]">
                    Clicking 'Reset App Lock' will unlock your app and remove the PIN protection so you can set a new PIN in Settings.
                  </p>
                </div>
              )}

              {forgotError && (
                <p className="text-xs font-semibold text-[#EF4444] flex items-center gap-1">
                  <AlertCircle size={13} /> {forgotError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#282D37] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#388BFD] hover:bg-[#2563EB] rounded-xl shadow-xs transition-colors"
                >
                  Reset App Lock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
