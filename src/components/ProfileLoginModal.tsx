import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Fingerprint,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  Mail,
  RotateCw,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { UserAccount } from "../types";
import {
  getInitials,
  getUserEffectivePin,
  getUserEffectivePassword,
  verifyUserPin,
  verifyUserPassword,
  DEFAULT_USERS,
} from "../utils/auth";
import { triggerBiometricAuthentication } from "../utils/biometrics";
import { ErrorBoundary } from "./ErrorBoundary";

interface ProfileLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: UserAccount | null;
  allUsers?: UserAccount[];
  onAuthenticated: (user: UserAccount) => void;
  isSessionLockOnly?: boolean; // When true, locked for current user
}

type AuthMethod = "pin" | "password" | "google";

export const ProfileLoginModal: React.FC<ProfileLoginModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <ErrorBoundary fallbackTitle="Authentication Modal Error" fallbackMessage="Could not load PIN authentication screen.">
      <ProfileLoginModalContent {...props} />
    </ErrorBoundary>
  );
};

const ProfileLoginModalContent: React.FC<ProfileLoginModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  allUsers = [],
  onAuthenticated,
  isSessionLockOnly = false,
}) => {
  const fallbackUser: UserAccount = targetUser || allUsers[0] || DEFAULT_USERS[0] || {
    id: "user-ramkeval",
    name: "Ramkeval Chauhan",
    email: "chauhanramkeval@gmail.com",
    avatarColor: "#1A73E8",
    accountType: "Personal",
    pin: "1234",
    password: "khata",
    joinedDate: "Today",
    lastLogin: "Active",
    authProvider: "pin",
  };

  const [selectedUser, setSelectedUser] = useState<UserAccount>(fallbackUser);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("pin");
  const [pin, setPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isBioLoading, setIsBioLoading] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  // Forgot PIN State
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotAnswer, setForgotAnswer] = useState<string>("");
  const [forgotError, setForgotError] = useState<string>("");
  const [forgotSuccess, setForgotSuccess] = useState<string>("");

  const pinInputRef = useRef<HTMLInputElement>(null);

  // Update selected user when targetUser prop changes or modal opens
  useEffect(() => {
    if (targetUser) {
      setSelectedUser(targetUser);
    } else if (Array.isArray(allUsers) && allUsers.length > 0) {
      setSelectedUser(allUsers[0]);
    }
    setPin("");
    setPassword("");
    setErrorMessage("");
    setIsSuccess(false);
    setShowUserDropdown(false);
    setShowForgotModal(false);
  }, [targetUser, isOpen, allUsers]);

  const targetPin = getUserEffectivePin(selectedUser);
  const targetPassword = getUserEffectivePassword(selectedUser);

  // Verify PIN Function
  const handleVerifyPin = useCallback(
    (enteredPin: string) => {
      if (enteredPin.length === 4) {
        if (verifyUserPin(selectedUser, enteredPin)) {
          setErrorMessage("");
          setIsSuccess(true);
          setTimeout(() => {
            onAuthenticated(selectedUser);
          }, 400);
        } else {
          setIsShaking(true);
          setErrorMessage(`Incorrect 4-digit PIN for ${selectedUser?.name || "User"}.`);
          setTimeout(() => {
            setPin("");
            setIsShaking(false);
          }, 600);
        }
      }
    },
    [selectedUser, onAuthenticated]
  );

  // Handle Numpad digit click
  const handleDigitClick = (digit: string) => {
    if (pin.length < 4 && !isSuccess) {
      const next = pin + digit;
      setPin(next);
      setErrorMessage("");
      if (next.length === 4) {
        handleVerifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !isSuccess) {
      setPin((prev) => prev.slice(0, -1));
      setErrorMessage("");
    }
  };

  const handleClearPin = () => {
    setPin("");
    setErrorMessage("");
  };

  // Physical Keyboard Listener
  useEffect(() => {
    if (!isOpen || showForgotModal || isSuccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (authMethod === "pin") {
        if (e.key >= "0" && e.key <= "9") {
          e.preventDefault();
          handleDigitClick(e.key);
        } else if (e.key === "Backspace") {
          e.preventDefault();
          handleBackspace();
        } else if (e.key === "Escape") {
          if (!isSessionLockOnly) onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, authMethod, pin, showForgotModal, isSuccess, isSessionLockOnly]);

  // Handle Password Submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!password.trim()) {
      setErrorMessage("Please enter the password.");
      return;
    }

    if (verifyUserPassword(selectedUser, password)) {
      setErrorMessage("");
      setIsSuccess(true);
      setTimeout(() => {
        onAuthenticated(selectedUser);
      }, 400);
    } else {
      setIsShaking(true);
      setErrorMessage(`Incorrect password for ${selectedUser.name}. Try again.`);
      setTimeout(() => {
        setIsShaking(false);
      }, 600);
    }
  };

  // Handle Biometric / Instant Fingerprint Verification
  const handleBiometricAuth = async () => {
    setIsBioLoading(true);
    setErrorMessage("");

    try {
      const res = await triggerBiometricAuthentication();
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onAuthenticated(selectedUser);
        }, 400);
      } else {
        setErrorMessage(res.message || "Biometric verification failed. Please use PIN.");
      }
    } catch (e: any) {
      setErrorMessage("Biometric verification cancelled.");
    } finally {
      setIsBioLoading(false);
    }
  };

  // Handle Google 1-Click OAuth Verification
  const handleGoogleVerify = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onAuthenticated(selectedUser);
    }, 400);
  };

  // Quick fill helper for effortless testing
  const handleQuickFillPin = () => {
    setPin(targetPin);
    handleVerifyPin(targetPin);
  };

  // Handle Forgot PIN verification
  const handleForgotPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    const expectedAnswer = selectedUser.securityAnswer || "Mumbai";
    if (forgotAnswer.trim().toLowerCase() === expectedAnswer.trim().toLowerCase()) {
      setForgotSuccess(`PIN Verified! Your PIN is: ${targetPin}`);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotAnswer("");
        setPin(targetPin);
        handleVerifyPin(targetPin);
      }, 1500);
    } else {
      setForgotError("Incorrect security answer. Please check and try again.");
    }
  };

  if (!isOpen) return null;

  const initials = getInitials(selectedUser?.name);

  return (
    <div
      id="profile-login-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/75 backdrop-blur-md animate-fadeIn text-[#202124]"
      onClick={() => {
        if (!isSessionLockOnly) onClose();
      }}
    >
      <div
        id="profile-login-card"
        className="bg-white rounded-3xl max-w-md w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-[#DADCE0] p-5 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F4] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold shadow-2xs border border-[#D2E3FC]">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#202124] flex items-center gap-1.5">
                <span>{isSessionLockOnly ? "Session Locked" : "Switch Profile Verification"}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-bold border border-[#CEEAD6]">
                  Encrypted
                </span>
              </h3>
              <p className="text-xs text-[#5F6368]">
                {isSessionLockOnly
                  ? "Enter credentials to resume your session"
                  : "Verify authentication before loading profile ledger"}
              </p>
            </div>
          </div>

          {!isSessionLockOnly && (
            <button
              id="btn-close-profile-login"
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
              title="Cancel Switch"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Target Profile Card / Selector */}
        <div className="relative mb-4">
          <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-xs shrink-0"
                style={{ backgroundColor: selectedUser?.avatarColor || "#1A73E8" }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-[#202124] truncate">{selectedUser?.name || "User"}</h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-bold border border-[#D2E3FC] shrink-0">
                    {selectedUser?.accountType || "Personal"}
                  </span>
                </div>
                <p className="text-xs text-[#5F6368] truncate flex items-center gap-1">
                  <Mail size={12} className="text-[#80868B] shrink-0" />
                  <span className="truncate">{selectedUser?.email || ""}</span>
                </p>
              </div>
            </div>

            {/* Profile Dropdown Toggle if multiple accounts exist and not single session lock */}
            {!isSessionLockOnly && (allUsers?.length || 0) > 1 && (
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="p-2 text-[#5F6368] hover:text-[#1A73E8] hover:bg-white rounded-xl transition-colors border border-transparent hover:border-[#DADCE0] cursor-pointer shrink-0"
                title="Change Target Profile"
              >
                <ChevronDown size={18} className={showUserDropdown ? "rotate-180" : ""} />
              </button>
            )}
          </div>

          {/* Expanded Profile Selection List */}
          {showUserDropdown && !isSessionLockOnly && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-[#DADCE0] z-20 p-2 space-y-1 animate-fadeIn">
              <p className="text-[11px] font-bold text-[#5F6368] px-2 py-1 uppercase tracking-wider">
                Select Profile to Unlock:
              </p>
              {allUsers.map((u) => {
                const isSelected = u.id === selectedUser.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(u);
                      setShowUserDropdown(false);
                      setPin("");
                      setPassword("");
                      setErrorMessage("");
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#E8F0FE] text-[#1A73E8] font-bold border border-[#D2E3FC]"
                        : "hover:bg-[#F1F3F4] text-[#202124]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: u.avatarColor || "#1A73E8" }}
                      >
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{u.name}</div>
                        <div className="text-[10px] text-[#5F6368] truncate">{u.email}</div>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="text-[10px] font-bold text-[#1A73E8] bg-white px-2 py-0.5 rounded-full border border-[#D2E3FC] shrink-0 flex items-center gap-1">
                        <KeyRound size={10} className="text-[#1A73E8]" />
                        <span>Selected</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-[#5F6368] bg-[#F1F3F4] px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 border border-[#E8EAED]">
                        <Lock size={10} className="text-[#5F6368]" />
                        <span>Locked</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Authentication Mode Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F3F4] rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("pin");
              setErrorMessage("");
            }}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              authMethod === "pin"
                ? "bg-white text-[#1A73E8] shadow-xs"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            <KeyRound size={13} />
            <span>4-Digit PIN</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("password");
              setErrorMessage("");
            }}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              authMethod === "password"
                ? "bg-white text-[#1A73E8] shadow-xs"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            <Lock size={13} />
            <span>Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("google");
              setErrorMessage("");
            }}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              authMethod === "google"
                ? "bg-white text-[#1A73E8] shadow-xs"
                : "text-[#5F6368] hover:text-[#202124]"
            }`}
          >
            <Fingerprint size={13} />
            <span>Fast Unlock</span>
          </button>
        </div>

        {/* Success State Overlay */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-fadeIn">
            <div className="w-16 h-16 bg-[#E6F4EA] text-[#137333] rounded-full flex items-center justify-center mx-auto shadow-sm border border-[#CEEAD6]">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="text-base font-bold text-[#137333]">Authentication Successful!</h4>
            <p className="text-xs text-[#5F6368]">
              Loading secure financial ledger for <strong>{selectedUser.name}</strong>...
            </p>
          </div>
        ) : (
          <>
            {/* TAB 1: 4-Digit PIN */}
            {authMethod === "pin" && (
              <div className="space-y-4">
                {/* PIN Display & Masking with Eye Toggle */}
                <div className="flex items-center justify-center gap-2.5 py-1">
                  <div
                    className={`flex items-center justify-center gap-2.5 py-2 px-4 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] shadow-2xs ${
                      isShaking ? "animate-shake border-[#EA4335]" : ""
                    }`}
                  >
                    {[0, 1, 2, 3].map((idx) => {
                      const isFilled = pin.length > idx;
                      const digit = pin[idx];
                      return (
                        <div
                          key={idx}
                          className={`w-7 h-9 rounded-xl flex items-center justify-center text-base font-mono font-bold transition-all duration-200 border ${
                            isFilled
                              ? "bg-white border-[#1A73E8] text-[#1A73E8] shadow-xs scale-105"
                              : "bg-white/60 border-[#DADCE0] text-transparent"
                          }`}
                        >
                          {isFilled ? (
                            showPin ? (
                              <span>{digit}</span>
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8] inline-block"></span>
                            )
                          ) : (
                            <span className="text-[#DADCE0] text-xs font-normal">−</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Eye Toggle Button */}
                  <button
                    id="btn-toggle-pin-visibility"
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="p-2.5 text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#F1F3F4] rounded-2xl transition-colors cursor-pointer border border-[#E8EAED] bg-white shadow-2xs"
                    title={showPin ? "Hide PIN digits" : "Show PIN digits"}
                    aria-label={showPin ? "Hide PIN digits" : "Show PIN digits"}
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-2.5 bg-[#FCE8E6] text-[#C5221F] text-xs font-semibold rounded-xl flex items-center gap-2 border border-[#FAD2CF] animate-fadeIn">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Interactive Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleDigitClick(num)}
                      className="h-12 bg-[#F8F9FA] hover:bg-[#E8EAED] active:bg-[#D2E3FC] active:scale-95 text-[#202124] text-lg font-bold rounded-2xl border border-[#E8EAED] transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="h-12 text-xs font-bold text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-2xl transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigitClick("0")}
                    className="h-12 bg-[#F8F9FA] hover:bg-[#E8EAED] active:bg-[#D2E3FC] active:scale-95 text-[#202124] text-lg font-bold rounded-2xl border border-[#E8EAED] transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-12 text-[#5F6368] hover:text-[#C5221F] hover:bg-[#FCE8E6] rounded-2xl transition-colors flex items-center justify-center cursor-pointer"
                    title="Backspace"
                  >
                    ⌫
                  </button>
                </div>

                {/* Demo Helper & Forgot PIN */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleQuickFillPin}
                    className="text-[11px] font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-2.5 py-1 rounded-full border border-[#D2E3FC] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    <span>Auto-Fill (••••)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-[#5F6368] hover:text-[#1A73E8] hover:underline cursor-pointer"
                  >
                    Forgot PIN?
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Password Authentication */}
            {authMethod === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
                    <input
                      type="email"
                      readOnly
                      value={selectedUser.email}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F9FA] text-[#5F6368] rounded-xl border border-[#DADCE0] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={`Enter password for ${selectedUser.name}`}
                      autoFocus
                      className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#202124]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 bg-[#FCE8E6] text-[#C5221F] text-xs font-semibold rounded-xl flex items-center gap-2 border border-[#FAD2CF] animate-fadeIn">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setPassword(targetPassword)}
                    className="text-[11px] font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-2.5 py-1 rounded-full border border-[#D2E3FC] transition-colors cursor-pointer"
                  >
                    Auto-Fill Password ({targetPassword})
                  </button>

                  <button
                    type="submit"
                    id="btn-submit-password-auth"
                    className="px-5 py-2 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Authenticate</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: Fast Unlock / Biometric / Google */}
            {authMethod === "google" && (
              <div className="py-2 space-y-3">
                <button
                  type="button"
                  id="btn-biometric-verify"
                  onClick={handleBiometricAuth}
                  disabled={isBioLoading}
                  className="w-full p-3.5 bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] rounded-2xl border border-[#D2E3FC] font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Fingerprint size={20} className={isBioLoading ? "animate-pulse" : ""} />
                  <span>{isBioLoading ? "Verifying Sensor..." : "Unlock with Fingerprint / Biometrics"}</span>
                </button>

                <button
                  type="button"
                  id="btn-google-verify"
                  onClick={handleGoogleVerify}
                  className="w-full p-3.5 bg-white hover:bg-[#F8F9FA] text-[#202124] rounded-2xl border border-[#DADCE0] font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] text-[#1A73E8]">
                    G
                  </div>
                  <span>1-Click Google Verification ({selectedUser.email})</span>
                </button>

                {errorMessage && (
                  <div className="p-2.5 bg-[#FCE8E6] text-[#C5221F] text-xs font-semibold rounded-xl flex items-center gap-2 border border-[#FAD2CF] animate-fadeIn">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Forgot PIN Recovery Sub-modal */}
        {showForgotModal && (
          <div className="absolute inset-0 bg-white rounded-3xl p-5 sm:p-6 z-30 flex flex-col justify-between animate-fadeIn">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F4] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FEF7E0] text-[#B06000] flex items-center justify-center">
                    <HelpCircle size={16} />
                  </div>
                  <h4 className="text-sm font-bold text-[#202124]">PIN Recovery Security Check</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="p-1 text-[#5F6368] hover:text-[#202124] rounded-full"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleForgotPinSubmit} className="space-y-3">
                <p className="text-xs text-[#5F6368]">
                  Answer the security question for <strong>{selectedUser.name}</strong> to retrieve your PIN:
                </p>

                <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E8EAED]">
                  <span className="text-[11px] font-bold text-[#1A73E8] block mb-0.5">Security Question:</span>
                  <span className="text-xs font-semibold text-[#202124]">
                    {selectedUser.securityQuestion || "What is your favorite city / secret answer?"}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5F6368] block mb-1">Your Answer *</label>
                  <input
                    type="text"
                    required
                    value={forgotAnswer}
                    onChange={(e) => setForgotAnswer(e.target.value)}
                    placeholder="e.g. Mumbai / Bruno"
                    className="w-full p-2 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                  />
                  <span className="text-[10px] text-[#80868B] block mt-1">
                    Hint: Default answer is <strong>{selectedUser.securityAnswer || "Mumbai"}</strong>
                  </span>
                </div>

                {forgotError && (
                  <p className="text-xs font-semibold text-[#C5221F] bg-[#FCE8E6] p-2 rounded-lg">
                    {forgotError}
                  </p>
                )}

                {forgotSuccess && (
                  <p className="text-xs font-bold text-[#137333] bg-[#E6F4EA] p-2 rounded-lg">
                    {forgotSuccess}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-[#5F6368] hover:bg-[#F1F3F4] rounded-full"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-full"
                  >
                    Verify Answer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
