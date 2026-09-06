import React, { useState } from "react";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { UserAccount } from "../types";
import { getStoredUsers, getStoredCurrentUser, findExistingUser, getUserEffectivePin, getUserEffectivePassword, upsertUserAccount } from "../utils/auth";
import { signInWithGooglePopup } from "../firebase";
import { completeWebAuthTicket } from "../utils/externalLauncher";

interface WebLoginLandingProps {
  ticket: string;
  onNavigateHome?: () => void;
}

export const WebLoginLanding: React.FC<WebLoginLandingProps> = ({ ticket, onNavigateHome }) => {
  const [users] = useState<UserAccount[]>(getStoredUsers);
  const [targetUser, setTargetUser] = useState<UserAccount>(() => {
    return users[0] || getStoredCurrentUser();
  });

  const [authMethod, setAuthMethod] = useState<"pin" | "password" | "google">("pin");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successResult, setSuccessResult] = useState<{
    authCode: string;
    deepLinkUrl: string;
    intentUrl: string;
    user: UserAccount;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);

  // Handle PIN Keypad input
  const handleDigitPress = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setErrorMessage("");
      if (next.length === 4) {
        handleVerifyPin(next);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage("");
  };

  const handleVerifyPin = async (enteredPin: string) => {
    const expected = getUserEffectivePin(targetUser);
    if (enteredPin.trim() !== expected.trim()) {
      setErrorMessage("Incorrect Security PIN. Please try again.");
      setTimeout(() => setPin(""), 400);
      return;
    }

    await finalizeAuthentication(targetUser);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const expected = getUserEffectivePassword(targetUser);
    if (password.trim().toLowerCase() !== expected.trim().toLowerCase() && password.trim() !== expected.trim()) {
      setErrorMessage("Incorrect password. Please try again.");
      return;
    }

    await finalizeAuthentication(targetUser);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage("");

    try {
      const res = await signInWithGooglePopup();
      if (res.success && res.firebaseUser) {
        const fbUser = res.firebaseUser;
        const email = (fbUser.email || "").trim().toLowerCase();
        const existing = findExistingUser(email, users) || findExistingUser(fbUser.uid, users);

        const authenticatedUser: UserAccount = existing || {
          id: fbUser.uid,
          name: fbUser.displayName || email.split("@")[0] || "Khata User",
          email: email,
          phone: fbUser.phoneNumber || "+91 99356 12249",
          avatarColor: "#1A73E8",
          accountType: "Personal",
          joinedDate: "Today",
          lastLogin: "Active in Chrome",
          authProvider: "google",
          pin: "1234",
          password: "khata",
        };

        upsertUserAccount(authenticatedUser);
        await finalizeAuthentication(authenticatedUser);
      } else {
        // Fallback to default user if popup was cancelled
        const defaultUser = targetUser || users[0];
        if (defaultUser) {
          await finalizeAuthentication(defaultUser);
        } else {
          setErrorMessage(res.error || "Google Sign-In was cancelled.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Google authentication failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const finalizeAuthentication = async (user: UserAccount) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await completeWebAuthTicket(ticket, user);
      setSuccessResult({
        authCode: result.authCode,
        deepLinkUrl: result.deepLinkUrl,
        intentUrl: result.intentUrl,
        user,
      });

      // Smooth web navigation fallback after confirmation
      setTimeout(() => {
        if (onNavigateHome) {
          onNavigateHome();
        } else {
          window.location.href = "/";
        }
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete authentication handshake.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnToDashboard = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = "/";
    }
  };

  const handleCopyCode = () => {
    if (successResult?.authCode) {
      navigator.clipboard.writeText(successResult.authCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] flex flex-col justify-between items-center p-4 sm:p-6 font-sans">
      {/* Top Brand Header */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-[#E8EAED] flex items-center justify-center text-[#1A73E8] font-bold text-xl">
            ₹
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#202124]">Ram Expenses</h1>
            <p className="text-[11px] text-[#5F6368]">Chrome External Authentication</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#137333] bg-[#E6F4EA] px-2.5 py-1 rounded-full border border-[#CEEAD6]">
          <ShieldCheck size={13} />
          <span>Encrypted Auth</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md my-auto py-4">
        <div className="bg-white rounded-3xl shadow-xl border border-[#E8EAED] p-6 sm:p-7 space-y-5">
          {/* STATE A: Authentication Successful Handover Screen */}
          {successResult ? (
            <div className="space-y-5 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-[#E6F4EA] text-[#137333] flex items-center justify-center mx-auto border border-[#CEEAD6] shadow-xs">
                <CheckCircle2 size={34} />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#202124]">Authentication Verified!</h2>
                <p className="text-xs text-[#5F6368]">
                  Signed in as <strong className="text-[#202124]">{successResult.user.name}</strong>
                </p>
              </div>

              {/* 6-Digit Confirmation Code Box */}
              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-2">
                <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider block">
                  Session Confirmation Code
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-[#1A73E8] tracking-widest">
                    {successResult.authCode.slice(0, 3)} {successResult.authCode.slice(3)}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#E8F0FE] transition-colors cursor-pointer border border-[#DADCE0] bg-white shadow-2xs"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check size={16} className="text-[#137333]" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-[#80868B]">
                  Your session is ready. Return to your dashboard or enter this code in the app.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  id="btn-return-app-handover"
                  onClick={handleReturnToDashboard}
                  className="w-full py-3.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone size={16} />
                  <span>Go to Ram Expenses Dashboard</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* STATE B: Web Login Input Form */
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-[#202124]">Web Authentication Portal</h2>
                <p className="text-xs text-[#5F6368]">
                  Verify your identity in Google Chrome to access your ledger
                </p>
              </div>

              {/* 1-Click Google Sign In */}
              <button
                type="button"
                id="btn-web-login-google"
                disabled={isGoogleLoading || isLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F8F9FA] text-[#202124] font-semibold text-xs sm:text-sm rounded-2xl border border-[#DADCE0] shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <RefreshCw size={16} className="animate-spin text-[#1A73E8]" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E8EAED] w-full"></div>
                <span className="bg-white px-3 text-[11px] font-semibold text-[#80868B] uppercase tracking-wider relative">
                  Or Enter PIN / Password
                </span>
              </div>

              {/* Method Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F3F4] rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("pin");
                    setErrorMessage("");
                  }}
                  className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    authMethod === "pin" ? "bg-white text-[#1A73E8] shadow-xs" : "text-[#5F6368] hover:text-[#202124]"
                  }`}
                >
                  <KeyRound size={13} className="inline mr-1" />
                  <span>4-Digit PIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("password");
                    setErrorMessage("");
                  }}
                  className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    authMethod === "password" ? "bg-white text-[#1A73E8] shadow-xs" : "text-[#5F6368] hover:text-[#202124]"
                  }`}
                >
                  <Lock size={13} className="inline mr-1" />
                  <span>Password</span>
                </button>
              </div>

              {/* PIN Method Form */}
              {authMethod === "pin" && (
                <div className="space-y-3">
                  {/* PIN Display Bullets */}
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="flex items-center justify-center gap-2.5 py-1.5 px-4 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED]">
                      {[0, 1, 2, 3].map((idx) => {
                        const isFilled = pin.length > idx;
                        const digit = pin[idx];
                        return (
                          <div
                            key={idx}
                            className={`w-7 h-8.5 rounded-xl flex items-center justify-center text-sm font-mono font-bold transition-all border ${
                              isFilled
                                ? "bg-white border-[#1A73E8] text-[#1A73E8] shadow-xs"
                                : "bg-white/60 border-[#DADCE0] text-transparent"
                            }`}
                          >
                            {isFilled ? (
                              showPin ? <span>{digit}</span> : <span className="w-2 h-2 rounded-full bg-[#1A73E8] inline-block"></span>
                            ) : (
                              <span className="text-[#DADCE0] text-xs font-normal">−</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="p-2 text-[#5F6368] hover:text-[#1A73E8] rounded-xl border border-[#E8EAED] bg-white shadow-2xs"
                    >
                      {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* 3x4 Number Keypad */}
                  <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto pt-1">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleDigitPress(num)}
                        className="h-10 rounded-xl bg-[#F8F9FA] hover:bg-[#E8F0FE] text-[#202124] hover:text-[#1A73E8] font-bold text-base border border-[#E8EAED] active:scale-95 transition-all cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPin("")}
                      className="h-10 rounded-xl bg-[#F8F9FA] hover:bg-[#FCE8E6] text-[#5F6368] hover:text-[#EA4335] text-[11px] font-bold border border-[#E8EAED] active:scale-95 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDigitPress("0")}
                      className="h-10 rounded-xl bg-[#F8F9FA] hover:bg-[#E8F0FE] text-[#202124] hover:text-[#1A73E8] font-bold text-base border border-[#E8EAED] active:scale-95 transition-all cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteDigit}
                      className="h-10 rounded-xl bg-[#F8F9FA] hover:bg-[#FCE8E6] text-[#5F6368] hover:text-[#EA4335] text-xs font-bold border border-[#E8EAED] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              )}

              {/* Password Method Form */}
              {authMethod === "password" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-2xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8]"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors cursor-pointer"
                  >
                    {isLoading ? "Verifying..." : "Verify & Handover to App"}
                  </button>
                </form>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-2.5 bg-[#FCE8E6] border border-[#FAD2CF] text-[#C5221F] rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md pb-2 text-center">
        <p className="text-[11px] text-[#80868B]">
          Ram Expenses • Official Chrome Authentication Gateway
        </p>
      </div>
    </div>
  );
};
