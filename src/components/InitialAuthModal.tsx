import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  User,
  Building2,
  Users,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
  Eye,
  EyeOff,
  Fingerprint,
  LogIn,
  ChevronRight,
} from "lucide-react";
import { UserAccount } from "../types";
import {
  getInitials,
  getUserEffectivePin,
  getUserEffectivePassword,
  verifyUserPin,
  verifyUserPassword,
  setOnboardingCompleted,
  setStoredAuthState,
} from "../utils/auth";
import { triggerBiometricAuthentication } from "../utils/biometrics";

interface InitialAuthModalProps {
  isOpen: boolean;
  allUsers: UserAccount[];
  currentUser: UserAccount;
  onSignUp: (newUser: UserAccount) => void;
  onLogin: (user: UserAccount) => void;
  initialMode?: "signup" | "login";
}

export const InitialAuthModal: React.FC<InitialAuthModalProps> = ({
  isOpen,
  allUsers,
  currentUser,
  onSignUp,
  onLogin,
  initialMode = "signup",
}) => {
  const [mode, setMode] = useState<"signup" | "login">(initialMode);

  // Sign Up Form State
  const [name, setName] = useState("Ramkeval Chauhan");
  const [accountType, setAccountType] = useState<
    "Personal" | "Business / Shop" | "Household & Family"
  >("Personal");
  const [email, setEmail] = useState("chauhanramkeval@gmail.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [upiId, setUpiId] = useState("ramkeval@okhdfcbank");
  const [pin, setPin] = useState("1234");
  const [password, setPassword] = useState("khata123");

  // Log In Form State
  const [selectedLoginUser, setSelectedLoginUser] = useState<UserAccount>(
    () => currentUser || allUsers[0]
  );
  const [loginMethod, setLoginMethod] = useState<"pin" | "password" | "google">("pin");
  const [loginPin, setLoginPin] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);

  // Common UI State
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected login user when props change
  useEffect(() => {
    if (currentUser) {
      setSelectedLoginUser(currentUser);
    } else if (allUsers.length > 0) {
      setSelectedLoginUser(allUsers[0]);
    }
  }, [currentUser, allUsers]);

  // Set mode if initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Reset errors when mode changes
  useEffect(() => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoginPin("");
    setLoginPassword("");
  }, [mode, loginMethod]);

  // PIN verification for Login
  const handleVerifyLoginPin = (enteredPin: string) => {
    if (enteredPin.length === 4) {
      if (verifyUserPin(selectedLoginUser, enteredPin)) {
        setErrorMessage("");
        setSuccessMessage(`Welcome back, ${selectedLoginUser.name}!`);
        setOnboardingCompleted(true);
        setStoredAuthState(true);
        setTimeout(() => {
          onLogin(selectedLoginUser);
        }, 500);
      } else {
        setIsShaking(true);
        setErrorMessage(`Incorrect 4-digit PIN for ${selectedLoginUser.name}.`);
        setTimeout(() => {
          setLoginPin("");
          setIsShaking(false);
        }, 600);
      }
    }
  };

  // Numpad button click for login
  const handleNumpadDigit = (digit: string) => {
    if (loginPin.length < 4 && !successMessage) {
      const next = loginPin + digit;
      setLoginPin(next);
      setErrorMessage("");
      if (next.length === 4) {
        handleVerifyLoginPin(next);
      }
    }
  };

  const handleNumpadBackspace = () => {
    if (loginPin.length > 0 && !successMessage) {
      setLoginPin((prev) => prev.slice(0, -1));
      setErrorMessage("");
    }
  };

  // Physical Keyboard Listener for Login PIN
  useEffect(() => {
    if (!isOpen || mode !== "login" || loginMethod !== "pin" || successMessage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumpadDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleNumpadBackspace();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, mode, loginMethod, loginPin, successMessage]);

  // Handle Sign Up Submission
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Please enter your mobile number.");
      return;
    }
    if (pin.length !== 4) {
      setErrorMessage("Security PIN must be exactly 4 digits.");
      return;
    }

    setIsSubmitting(true);

    const newUser: UserAccount = {
      id: "user-" + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      upiId: upiId.trim() || undefined,
      accountType,
      avatarColor:
        accountType === "Business / Shop"
          ? "#188038"
          : accountType === "Household & Family"
          ? "#E37400"
          : "#1A73E8",
      joinedDate: "Today",
      lastLogin: "Active Now",
      authProvider: "pin",
      pin: pin.trim(),
      password: password.trim() || "khata123",
      securityQuestion: "What is your favorite city?",
      securityAnswer: "Mumbai",
    };

    setOnboardingCompleted(true);
    setStoredAuthState(true);
    setSuccessMessage(`Account created! Welcome, ${newUser.name}! 🎉`);

    setTimeout(() => {
      setIsSubmitting(false);
      onSignUp(newUser);
    }, 600);
  };

  // Handle Password Login Submit
  const handlePasswordLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!loginPassword.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (verifyUserPassword(selectedLoginUser, loginPassword)) {
      setSuccessMessage(`Welcome back, ${selectedLoginUser.name}!`);
      setOnboardingCompleted(true);
      setStoredAuthState(true);
      setTimeout(() => {
        onLogin(selectedLoginUser);
      }, 500);
    } else {
      setIsShaking(true);
      setErrorMessage(`Incorrect password for ${selectedLoginUser.name}.`);
      setTimeout(() => {
        setIsShaking(false);
      }, 600);
    }
  };

  // Fast 1-Click Biometric
  const handleBiometricLogin = async () => {
    setIsBioLoading(true);
    setErrorMessage("");
    try {
      const res = await triggerBiometricAuthentication();
      if (res.success) {
        setSuccessMessage(`Biometric Verified! Welcome, ${selectedLoginUser.name}!`);
        setOnboardingCompleted(true);
        setStoredAuthState(true);
        setTimeout(() => {
          onLogin(selectedLoginUser);
        }, 500);
      } else {
        setErrorMessage(res.message || "Biometric verification failed.");
      }
    } catch {
      setErrorMessage("Biometric sensor verification cancelled.");
    } finally {
      setIsBioLoading(false);
    }
  };

  // 1-Click Google Sign In
  const handleGoogleInstantAuth = () => {
    const googleUser: UserAccount = {
      id: "user-google-" + Date.now(),
      name: name || "Ramkeval Chauhan",
      email: email || "chauhanramkeval@gmail.com",
      phone: phone || "+91 98765 43210",
      upiId: upiId || "ramkeval@okhdfcbank",
      avatarColor: "#1A73E8",
      accountType: accountType || "Personal",
      joinedDate: "Today",
      lastLogin: "Active Now",
      authProvider: "google",
      pin: "1234",
      password: "khata",
    };
    setOnboardingCompleted(true);
    setStoredAuthState(true);
    setSuccessMessage(`Google Verified! Welcome, ${googleUser.name}!`);
    setTimeout(() => {
      onSignUp(googleUser);
    }, 500);
  };

  if (!isOpen) return null;

  const targetPin = getUserEffectivePin(selectedLoginUser);
  const targetPassword = getUserEffectivePassword(selectedLoginUser);

  return (
    <div
      id="initial-auth-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/80 backdrop-blur-md animate-fadeIn text-[#202124]"
    >
      <div
        id="initial-auth-modal"
        className="bg-white rounded-3xl max-w-md w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-[#DADCE0] p-5 sm:p-6 relative flex flex-col justify-between"
      >
        {/* Brand Top Header */}
        <div className="text-center space-y-2 pb-3 border-b border-[#F1F3F4]">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="relative w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center border border-[#E8EAED]">
              <div className="absolute -top-1 -right-1 flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
              </div>
              <span className="text-[#1A73E8] font-bold text-2xl leading-none">₹</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#202124] tracking-tight">
              {mode === "signup" ? "Set Up Your Khata Profile" : "Unlock Khata Ledger"}
            </h2>
            <p className="text-xs text-[#5F6368]">
              {mode === "signup"
                ? "Create your account with isolated secure data & 4-digit PIN"
                : "Enter your 4-digit PIN or select an account to resume"}
            </p>
          </div>
        </div>

        {/* Global Success Banner */}
        {successMessage && (
          <div className="my-3 p-3 bg-[#E6F4EA] text-[#137333] text-xs font-bold rounded-2xl flex items-center gap-2 border border-[#CEEAD6] animate-fadeIn">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="my-3 p-3 bg-[#FCE8E6] text-[#C5221F] text-xs font-semibold rounded-2xl flex items-center gap-2 border border-[#FAD2CF] animate-fadeIn">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 1: SIGN UP / PROFILE CREATION                                        */}
        {/* ========================================================================= */}
        {mode === "signup" && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5 py-3">
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
                <input
                  id="signup-fullname"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramkeval Chauhan"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Account Type / Category */}
            <div>
              <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                Account Type / Category *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAccountType("Personal")}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    accountType === "Personal"
                      ? "bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] font-bold shadow-2xs"
                      : "bg-[#F8F9FA] border-[#DADCE0] text-[#5F6368] hover:bg-white"
                  }`}
                >
                  <User size={15} />
                  <span className="text-[11px]">Personal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("Business / Shop")}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    accountType === "Business / Shop"
                      ? "bg-[#E6F4EA] border-[#188038] text-[#188038] font-bold shadow-2xs"
                      : "bg-[#F8F9FA] border-[#DADCE0] text-[#5F6368] hover:bg-white"
                  }`}
                >
                  <Building2 size={15} />
                  <span className="text-[11px] truncate w-full">Business / Kirana</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("Household & Family")}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    accountType === "Household & Family"
                      ? "bg-[#FEF7E0] border-[#E37400] text-[#E37400] font-bold shadow-2xs"
                      : "bg-[#F8F9FA] border-[#DADCE0] text-[#5F6368] hover:bg-white"
                  }`}
                >
                  <Users size={15} />
                  <span className="text-[11px] truncate w-full">Household</span>
                </button>
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full pl-9 pr-2 py-2 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
                  <input
                    id="signup-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-2 py-2 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* UPI ID (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#5F6368]">
                  UPI ID <span className="text-[#80868B] font-normal">(Optional for QR Payments)</span>
                </label>
                <span className="text-[10px] font-bold text-[#1A73E8] bg-[#E8F0FE] px-1.5 py-0.2 rounded-md">
                  UPI Enabled
                </span>
              </div>
              <div className="relative">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
                <input
                  id="signup-upi"
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@okhdfcbank"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none font-mono"
                />
              </div>
            </div>

            {/* 4-Digit Security PIN */}
            <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                  <KeyRound size={15} className="text-[#1A73E8]" />
                  <span>Set 4-Digit Security PIN *</span>
                </span>
                <span className="text-[10px] text-[#137333] font-bold bg-[#E6F4EA] px-2 py-0.5 rounded-full border border-[#CEEAD6]">
                  Fast Switch & Unlock
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="signup-pin"
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="w-32 py-2 px-3 text-center text-base font-bold bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none tracking-widest font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setPin("1234")}
                  className="text-[11px] font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-2.5 py-1.5 rounded-xl border border-[#D2E3FC] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  <span>Use Default (1234)</span>
                </button>
              </div>
              <p className="text-[10px] text-[#5F6368]">
                You'll use this 4-digit PIN to unlock your Khata or switch profiles securely.
              </p>
            </div>

            {/* Create Account Action */}
            <button
              id="btn-signup-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{isSubmitting ? "Creating Khata..." : "Create Account / Start Khata"}</span>
              <ArrowRight size={16} />
            </button>

            {/* Google 1-Click Fast Setup Alternative */}
            <button
              type="button"
              onClick={handleGoogleInstantAuth}
              className="w-full py-2.5 px-4 bg-white hover:bg-[#F8F9FA] text-[#202124] font-semibold text-xs rounded-2xl border border-[#DADCE0] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] text-[#1A73E8]">
                G
              </div>
              <span>Fast 1-Click Sign-Up with Google</span>
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: LOG IN / PIN UNLOCK                                               */}
        {/* ========================================================================= */}
        {mode === "login" && (
          <div className="space-y-4 py-3">
            {/* Account Selector Cards */}
            <div>
              <label className="text-xs font-semibold text-[#5F6368] block mb-1.5">
                Select Account to Unlock:
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                {allUsers.map((u) => {
                  const isSelected = u.id === selectedLoginUser.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedLoginUser(u);
                        setLoginPin("");
                        setLoginPassword("");
                        setErrorMessage("");
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] font-bold shadow-2xs"
                          : "bg-[#F8F9FA] border-[#E8EAED] text-[#202124] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                          style={{ backgroundColor: u.avatarColor || "#1A73E8" }}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{u.name}</div>
                          <div className="text-[10px] text-[#5F6368] truncate">{u.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#1A73E8] bg-white px-2 py-0.5 rounded-full border border-[#D2E3FC] shrink-0 font-mono">
                        PIN: {getUserEffectivePin(u)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Login Mode Tabs (PIN vs Password vs Fast Unlock) */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#F1F3F4] rounded-2xl">
              <button
                type="button"
                onClick={() => setLoginMethod("pin")}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  loginMethod === "pin"
                    ? "bg-white text-[#1A73E8] shadow-xs"
                    : "text-[#5F6368] hover:text-[#202124]"
                }`}
              >
                <KeyRound size={13} />
                <span>4-Digit PIN</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("password")}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  loginMethod === "password"
                    ? "bg-white text-[#1A73E8] shadow-xs"
                    : "text-[#5F6368] hover:text-[#202124]"
                }`}
              >
                <Lock size={13} />
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("google")}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  loginMethod === "google"
                    ? "bg-white text-[#1A73E8] shadow-xs"
                    : "text-[#5F6368] hover:text-[#202124]"
                }`}
              >
                <Fingerprint size={13} />
                <span>Biometric</span>
              </button>
            </div>

            {/* TAB 1: 4-Digit PIN Pad */}
            {loginMethod === "pin" && (
              <div className="space-y-3">
                {/* Masked PIN Bullets */}
                <div
                  className={`flex items-center justify-center gap-3 py-2 ${
                    isShaking ? "animate-shake" : ""
                  }`}
                >
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = loginPin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                          isFilled
                            ? "bg-[#1A73E8] scale-125 shadow-xs"
                            : "bg-[#E8EAED] border border-[#DADCE0]"
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Interactive Keypad */}
                <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumpadDigit(num)}
                      className="h-10 bg-[#F8F9FA] hover:bg-[#E8EAED] active:bg-[#D2E3FC] active:scale-95 text-[#202124] text-base font-bold rounded-xl border border-[#E8EAED] transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginPin("");
                      setErrorMessage("");
                    }}
                    className="h-10 text-[11px] font-bold text-[#5F6368] hover:text-[#202124] rounded-xl transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumpadDigit("0")}
                    className="h-10 bg-[#F8F9FA] hover:bg-[#E8EAED] active:bg-[#D2E3FC] active:scale-95 text-[#202124] text-base font-bold rounded-xl border border-[#E8EAED] transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleNumpadBackspace}
                    className="h-10 text-[#5F6368] hover:text-[#C5221F] rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                    title="Backspace"
                  >
                    ⌫
                  </button>
                </div>

                {/* Auto Fill Shortcut */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginPin(targetPin);
                      handleVerifyLoginPin(targetPin);
                    }}
                    className="text-[11px] font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-3 py-1 rounded-full border border-[#D2E3FC] transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    <span>Auto-Fill PIN ({targetPin})</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Password Entry */}
            {loginMethod === "password" && (
              <form onSubmit={handlePasswordLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                    Password for {selectedLoginUser.name}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password (khata123)"
                      className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setLoginPassword(targetPassword)}
                    className="text-[11px] font-semibold text-[#1A73E8] bg-[#E8F0FE] px-2.5 py-1 rounded-full"
                  >
                    Auto-Fill ({targetPassword})
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-full"
                  >
                    Log In
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: Biometric / Instant */}
            {loginMethod === "google" && (
              <div className="space-y-3 py-2">
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={isBioLoading}
                  className="w-full p-3.5 bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] rounded-2xl border border-[#D2E3FC] font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
                >
                  <Fingerprint size={20} className={isBioLoading ? "animate-pulse" : ""} />
                  <span>{isBioLoading ? "Verifying..." : "Unlock with Fingerprint"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOnboardingCompleted(true);
                    setStoredAuthState(true);
                    setSuccessMessage(`Instant Login! Welcome, ${selectedLoginUser.name}!`);
                    setTimeout(() => onLogin(selectedLoginUser), 400);
                  }}
                  className="w-full p-3 bg-white hover:bg-[#F8F9FA] text-[#202124] rounded-2xl border border-[#DADCE0] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] text-[#1A73E8]">
                    G
                  </div>
                  <span>Fast 1-Click Login ({selectedLoginUser.name})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* BOTTOM TOGGLE LINK: Sign Up <-> Log In                                     */}
        {/* ========================================================================= */}
        <div className="pt-3 border-t border-[#F1F3F4] text-center">
          {mode === "signup" ? (
            <p className="text-xs text-[#5F6368]">
              Already have an account?{" "}
              <button
                id="btn-toggle-to-login"
                type="button"
                onClick={() => setMode("login")}
                className="font-bold text-[#1A73E8] hover:underline cursor-pointer inline-flex items-center gap-0.5 ml-1"
              >
                <span>Log In with PIN</span>
                <ChevronRight size={13} />
              </button>
            </p>
          ) : (
            <p className="text-xs text-[#5F6368]">
              Don't have an account yet?{" "}
              <button
                id="btn-toggle-to-signup"
                type="button"
                onClick={() => setMode("signup")}
                className="font-bold text-[#1A73E8] hover:underline cursor-pointer inline-flex items-center gap-0.5 ml-1"
              >
                <span>Create Khata / Sign Up</span>
                <ChevronRight size={13} />
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
