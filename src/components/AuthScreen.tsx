import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  Building2,
  User,
  LogIn,
  KeyRound,
  RotateCw,
} from "lucide-react";
import { UserAccount } from "../types";
import { getInitials } from "../utils/auth";

interface AuthScreenProps {
  allUsers: UserAccount[];
  currentUser: UserAccount;
  onLogin: (user: UserAccount) => void;
  onRegisterUser: (newUser: UserAccount) => void;
}

type AuthMode = "quick_profiles" | "email" | "otp" | "register";

export const AuthScreen: React.FC<AuthScreenProps> = ({
  allUsers,
  currentUser,
  onLogin,
  onRegisterUser,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>("quick_profiles");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpCountdown, setOtpCountdown] = useState(30);

  // New User Registration Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAccountType, setRegAccountType] = useState<"Personal" | "Business / Shop" | "Household & Family">("Personal");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // OTP Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpCountdown]);

  // Handle Google 1-Click Sign-In
  const handleGoogleSignIn = (userToLogin?: UserAccount) => {
    setErrorMessage("");
    const targetUser = userToLogin || allUsers[0] || {
      id: "user-google-" + Date.now(),
      name: "Your Name",
      email: "user@gmail.com",
      phone: "+91 98765 43210",
      upiId: "user@okhdfcbank",
      avatarColor: "#1A73E8",
      accountType: "Personal",
      joinedDate: "Aug 2024",
      lastLogin: "Just now",
      authProvider: "google",
    };
    onLogin(targetUser);
  };

  // Handle Email & Password Sign In
  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage("Password must be at least 4 characters.");
      return;
    }

    // Check if user exists or log in as matching user
    const existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      onLogin({ ...existing, lastLogin: "Just now", authProvider: "email" });
    } else {
      // Create account dynamically if not existing
      const newUser: UserAccount = {
        id: "user-" + Date.now(),
        name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: email.trim(),
        phone: "+91 98000 00000",
        avatarColor: "#1A73E8",
        accountType: "Personal",
        joinedDate: "Aug 2024",
        lastLogin: "Just now",
        authProvider: "email",
      };
      onRegisterUser(newUser);
      onLogin(newUser);
    }
  };

  // Handle Send OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (phoneNumber.replace(/\D/g, "").length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpSent(true);
    setOtpCountdown(30);
    // Autofill simulated OTP after 1.2s for great UX
    setTimeout(() => {
      setOtpCode(["4", "8", "2", "9", "1", "0"]);
      setSuccessMessage("SMS OTP Received: 482910 (Auto-filled) 📩");
    }, 800);
  };

  // Handle Verify OTP
  const handleVerifyOtp = () => {
    const fullOtp = otpCode.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP code.");
      return;
    }
    // Match phone or create user
    const existing = allUsers.find((u) => u.phone && u.phone.includes(phoneNumber.slice(-8)));
    if (existing) {
      onLogin({ ...existing, lastLogin: "Just now", authProvider: "phone" });
    } else {
      const newUser: UserAccount = {
        id: "user-phone-" + Date.now(),
        name: `Khata User (+91 ${phoneNumber.slice(-4)})`,
        email: `user.${phoneNumber.slice(-4)}@khata.in`,
        phone: `+91 ${phoneNumber}`,
        avatarColor: "#188038",
        accountType: "Personal",
        joinedDate: "Aug 2024",
        lastLogin: "Just now",
        authProvider: "phone",
      };
      onRegisterUser(newUser);
      onLogin(newUser);
    }
  };

  // Handle Registration Form Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!regName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!regEmail.trim() && !regPhone.trim()) {
      setErrorMessage("Please provide either an email or mobile number.");
      return;
    }

    const newUser: UserAccount = {
      id: "user-" + Date.now(),
      name: regName.trim(),
      email: regEmail.trim() || `${regName.toLowerCase().replace(/\s+/g, "")}@khata.in`,
      phone: regPhone.trim() || "+91 98765 00000",
      avatarColor: "#1A73E8",
      accountType: regAccountType,
      joinedDate: "Aug 2024",
      lastLogin: "Just now",
      authProvider: "email",
    };

    onRegisterUser(newUser);
    onLogin(newUser);
  };

  return (
    <div
      id="khata-auth-screen"
      className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between items-center p-4 sm:p-6 text-[#202124]"
    >
      {/* Top Brand Banner */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 sm:pt-4">
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center border border-[#E8EAED]">
            <div className="absolute -top-1 -right-1 flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
            </div>
            <span className="text-[#1A73E8] font-bold text-xl leading-none">₹</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#202124] flex items-center gap-1.5">
              <span>Khata India</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]">
                Secure
              </span>
            </h1>
            <p className="text-[11px] text-[#5F6368]">Sign in to access your ledger & spends</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#137333] bg-[#E6F4EA] px-2.5 py-1 rounded-full border border-[#CEEAD6]">
          <ShieldCheck size={14} />
          <span>Encrypted</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md my-auto pt-4 pb-6">
        <div className="bg-white rounded-3xl shadow-xl border border-[#E8EAED] p-6 sm:p-7 space-y-5">
          {/* Header Title in Card */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-[#202124]">Welcome to Khata</h2>
            <p className="text-xs text-[#5F6368]">
              Manage daily Indian expenses, UPI logs, kirana, and savings
            </p>
          </div>

          {/* Quick 1-Click Google Sign In Button */}
          <button
            id="btn-google-signin"
            type="button"
            onClick={() => handleGoogleSignIn()}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-[#F8F9FA] text-[#202124] border border-[#DADCE0] hover:border-[#BDC1C6] rounded-full shadow-2xs font-semibold text-xs sm:text-sm transition-all cursor-pointer active:scale-98"
          >
            {/* Google SVG G Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E8EAED] w-full"></div>
            <span className="bg-white px-3 text-[11px] font-semibold text-[#80868B] uppercase tracking-wider relative">
              Or Choose Method
            </span>
          </div>

          {/* Auth Mode Switcher Pills */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#F1F3F4] rounded-2xl">
            <button
              type="button"
              id="tab-auth-saved"
              onClick={() => {
                setAuthMode("quick_profiles");
                setErrorMessage("");
              }}
              className={`py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                authMode === "quick_profiles"
                  ? "bg-white text-[#1A73E8] shadow-2xs"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Profiles
            </button>
            <button
              type="button"
              id="tab-auth-email"
              onClick={() => {
                setAuthMode("email");
                setErrorMessage("");
              }}
              className={`py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                authMode === "email"
                  ? "bg-white text-[#1A73E8] shadow-2xs"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              id="tab-auth-otp"
              onClick={() => {
                setAuthMode("otp");
                setErrorMessage("");
              }}
              className={`py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                authMode === "otp"
                  ? "bg-white text-[#1A73E8] shadow-2xs"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Mobile OTP
            </button>
            <button
              type="button"
              id="tab-auth-register"
              onClick={() => {
                setAuthMode("register");
                setErrorMessage("");
              }}
              className={`py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                authMode === "register"
                  ? "bg-white text-[#1A73E8] shadow-2xs"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Mode 1: Quick Saved Profiles Selection */}
          {authMode === "quick_profiles" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="text-xs font-semibold text-[#5F6368] flex items-center justify-between">
                <span>Select Account on this Device</span>
                <span className="text-[10px] text-[#1A73E8] font-bold">{allUsers.length} Saved</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    id={`btn-login-profile-${u.id}`}
                    type="button"
                    onClick={() => handleGoogleSignIn(u)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#E8EAED] hover:border-[#1A73E8] bg-[#F8F9FA] hover:bg-[#E8F0FE]/40 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                        style={{ backgroundColor: u.avatarColor || "#1A73E8" }}
                      >
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#202124] group-hover:text-[#1A73E8] transition-colors">
                            {u.name}
                          </h4>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white border border-[#DADCE0] text-[#5F6368] font-medium">
                            {u.accountType}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5F6368]">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-[#1A73E8] opacity-80 group-hover:opacity-100">
                      <span>Log In</span>
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                id="btn-switch-to-create"
                onClick={() => setAuthMode("register")}
                className="w-full py-2 text-center text-xs font-bold text-[#1A73E8] hover:bg-[#E8F0FE] rounded-xl transition-colors cursor-pointer"
              >
                + Register New Indian Khata Profile
              </button>
            </div>
          )}

          {/* Mode 2: Email & Password */}
          {authMode === "email" && (
            <form onSubmit={handleEmailSignIn} className="space-y-3.5 animate-fadeIn">
              <div>
                <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-2xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#5F6368]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#1A73E8] font-semibold flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
                  <input
                    id="input-login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (e.g. khata123)"
                    className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-2xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-email-login"
                className="w-full py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn size={16} />
                <span>Log In with Email</span>
              </button>
            </form>
          )}

          {/* Mode 3: Mobile Number & Instant OTP */}
          {authMode === "otp" && (
            <div className="space-y-3.5 animate-fadeIn">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                      Indian Mobile Number (+91)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-[#5F6368]">
                        +91
                      </span>
                      <input
                        id="input-login-phone"
                        type="tel"
                        maxLength={10}
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="9876543210"
                        className="w-full pl-12 pr-3 py-2.5 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-2xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-[#5F6368] mt-1">
                      We'll simulate an instant 6-digit SMS OTP verification code
                    </p>
                  </div>

                  <button
                    type="submit"
                    id="btn-send-otp"
                    className="w-full py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone size={16} />
                    <span>Send SMS OTP</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-3.5">
                  <div className="text-center space-y-1">
                    <span className="text-xs font-semibold text-[#5F6368]">
                      Enter 6-digit code sent to +91 {phoneNumber}
                    </span>
                    <div className="flex justify-center gap-1.5 pt-1">
                      {otpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          maxLength={1}
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => {
                            const val = e.target.value.slice(-1);
                            const next = [...otpCode];
                            next[idx] = val;
                            setOtpCode(next);
                            if (val && idx < 5) {
                              const nextInput = document.getElementById(`otp-input-${idx + 1}`);
                              nextInput?.focus();
                            }
                          }}
                          className="w-9 h-11 text-center text-lg font-bold bg-[#F8F9FA] focus:bg-white border border-[#DADCE0] focus:border-[#1A73E8] rounded-xl outline-none"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#5F6368] px-1">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[#1A73E8] hover:underline"
                    >
                      Change Number
                    </button>
                    <span>
                      {otpCountdown > 0 ? (
                        `Resend in ${otpCountdown}s`
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpCountdown(30);
                            setSuccessMessage("New OTP code generated! 📩");
                          }}
                          className="text-[#1A73E8] font-bold hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    id="btn-verify-otp"
                    onClick={handleVerifyOtp}
                    className="w-full py-2.5 bg-[#188038] hover:bg-[#137333] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Verify & Open Khata</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 4: Sign Up / Register New Khata */}
          {authMode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-fadeIn">
              <div>
                <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                  Full Name / Khata Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={15} />
                  <input
                    id="input-reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                    Email
                  </label>
                  <input
                    id="input-reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ramesh@gmail.com"
                    className="w-full px-3 py-2 text-xs bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                    Mobile (+91)
                  </label>
                  <input
                    id="input-reg-phone"
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 text-xs bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                  Ledger Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "Personal", label: "Personal" },
                    { id: "Household & Family", label: "Family" },
                    { id: "Business / Shop", label: "Business" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setRegAccountType(t.id as any)}
                      className={`py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        regAccountType === t.id
                          ? "bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] font-bold"
                          : "bg-[#F8F9FA] border-[#E8EAED] text-[#5F6368]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                className="w-full py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Sparkles size={16} />
                <span>Create & Open Khata</span>
              </button>
            </form>
          )}

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="p-2.5 bg-[#FCE8E6] border border-[#FAD2CF] text-[#C5221F] rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-2.5 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info Badges */}
      <div className="w-full max-w-md pb-2 text-center">
        <div className="flex items-center justify-center gap-4 text-[11px] text-[#5F6368] font-medium flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]"></span>
            <span>100% Private Offline Ledger</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
            <span>Instant UPI & Kirana Tracking</span>
          </span>
        </div>
      </div>
    </div>
  );
};
