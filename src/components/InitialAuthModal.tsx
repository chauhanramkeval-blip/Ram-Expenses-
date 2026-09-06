import React, { useState, useEffect } from "react";
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
  RefreshCw,
  CloudCheck,
  Compass,
  ExternalLink,
  Copy,
  Smartphone,
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
  findExistingUser,
  upsertUserAccount,
} from "../utils/auth";
import { triggerBiometricAuthentication } from "../utils/biometrics";
import { signInWithGooglePopup, checkGoogleRedirectResult } from "../firebase";
import { syncUserProfileToFirestore } from "../services/firestoreSync";
import {
  createWebAuthTicket,
  openInExternalChromeBrowser,
  checkWebAuthStatus,
  verifyWebAuthCode,
  WebAuthSession,
} from "../utils/externalLauncher";

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
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"signup" | "login">(initialMode);

  // Sign Up Form State
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<
    "Personal" | "Business / Shop" | "Household & Family"
  >("Personal");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+919935612249");
  const [upiId, setUpiId] = useState("");
  const [pin, setPin] = useState("");
  const [showSignupPin, setShowSignupPin] = useState(false);
  const [password, setPassword] = useState("");

  // Log In Form State
  const [selectedLoginUser, setSelectedLoginUser] = useState<UserAccount>(
    () => currentUser || allUsers[0]
  );
  const [loginMethod, setLoginMethod] = useState<"pin" | "password" | "google">("pin");
  const [loginPin, setLoginPin] = useState("");
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);

  // Chrome Web Auth Handshake State
  const [activeWebAuthSession, setActiveWebAuthSession] = useState<WebAuthSession | null>(null);
  const [isLaunchingChrome, setIsLaunchingChrome] = useState(false);
  const [manualAuthCode, setManualAuthCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

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

  // Sync mode if initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Reset transient fields when mode or method toggles
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
        setSuccessMessage(`Welcome back, ${selectedLoginUser.name}! Restoring cloud data...`);
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

  // Check for completed Google Redirect Result on mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    checkGoogleRedirectResult().then((res) => {
      if (!isMounted) return;
      if (res.success && res.firebaseUser) {
        const fbUser = res.firebaseUser;
        const userEmail = (fbUser.email || "").trim().toLowerCase();
        const userDisplayName = fbUser.displayName || userEmail.split("@")[0] || "Khata User";
        const permanentUid = fbUser.uid;

        const existingUser =
          findExistingUser(userEmail, allUsers) ||
          findExistingUser(permanentUid, allUsers);

        if (existingUser) {
          const updatedUser: UserAccount = {
            ...existingUser,
            lastLogin: "Active Now",
            authProvider: "google",
            avatarColor: existingUser.avatarColor || "#1A73E8",
          };
          upsertUserAccount(updatedUser);
          syncUserProfileToFirestore(updatedUser).catch(() => {});
          setSuccessMessage(`Welcome back, ${existingUser.name}!`);
          setOnboardingCompleted(true);
          setStoredAuthState(true);
          setTimeout(() => onLogin(updatedUser), 300);
        } else {
          const newUser: UserAccount = {
            id: permanentUid,
            name: userDisplayName,
            email: userEmail,
            phone: fbUser.phoneNumber || "+91 98765 43210",
            accountType: "Personal",
            avatarColor: "#1A73E8",
            joinedDate: "Today",
            lastLogin: "Active Now",
            authProvider: "google",
            pin: "1234",
            password: "khata",
          };
          upsertUserAccount(newUser);
          syncUserProfileToFirestore(newUser).catch(() => {});
          setSuccessMessage(`Google Verified! Welcome, ${newUser.name}!`);
          setOnboardingCompleted(true);
          setStoredAuthState(true);
          setTimeout(() => onSignUp(newUser), 300);
        }
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen, allUsers, onLogin, onSignUp]);

  // Unified Google Sign-In with Firebase Auth & auto-detection of existing users
  const handleGoogleSignInUnified = async () => {
    setIsGoogleAuthLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await signInWithGooglePopup();
      if (res.success && res.firebaseUser) {
        const fbUser = res.firebaseUser;
        const userEmail = (fbUser.email || "").trim().toLowerCase();
        const userDisplayName = fbUser.displayName || userEmail.split("@")[0] || "Khata User";
        const permanentUid = fbUser.uid;

        // Check if an account already exists by email or UID
        const existingUser =
          findExistingUser(userEmail, allUsers) ||
          findExistingUser(permanentUid, allUsers);

        if (existingUser) {
          // DIRECT LOGIN TO EXISTING ACCOUNT - NO NEW PROFILE CREATION
          const updatedUser: UserAccount = {
            ...existingUser,
            lastLogin: "Active Now",
            authProvider: "google",
            avatarColor: existingUser.avatarColor || "#1A73E8",
          };
          upsertUserAccount(updatedUser);
          syncUserProfileToFirestore(updatedUser).catch(() => {});

          setSuccessMessage(`Welcome back, ${existingUser.name}! Restoring your transactions & backup...`);
          setOnboardingCompleted(true);
          setStoredAuthState(true);

          setTimeout(() => {
            setIsGoogleAuthLoading(false);
            onLogin(updatedUser);
          }, 600);
          return;
        }

        // CREATE NEW PERMANENT ACCOUNT BINDING TO THE AUTHENTICATED UID
        const newUser: UserAccount = {
          id: permanentUid,
          name: userDisplayName,
          email: userEmail,
          phone: fbUser.phoneNumber || phone.trim() || "+91 98765 43210",
          upiId: upiId.trim() || undefined,
          accountType: accountType || "Personal",
          avatarColor: "#1A73E8",
          joinedDate: "Today",
          lastLogin: "Active Now",
          authProvider: "google",
          pin: "1234",
          password: "khata",
        };

        upsertUserAccount(newUser);
        syncUserProfileToFirestore(newUser).catch(() => {});

        setOnboardingCompleted(true);
        setStoredAuthState(true);
        setSuccessMessage(`Google Verified! Welcome, ${newUser.name}! Initializing cloud khata...`);

        setTimeout(() => {
          setIsGoogleAuthLoading(false);
          onSignUp(newUser);
        }, 600);
        return;
      }

      // If popup was cancelled or not ready, fallback gracefully to existing user match or informative prompt
      if (res.error) {
        // If user cancelled, don't throw harsh error, check if default primary user exists
        const fallbackExisting = findExistingUser(email || "chauhanramkeval@gmail.com", allUsers);
        if (fallbackExisting) {
          setSuccessMessage(`Loaded profile for ${fallbackExisting.name}. Click Unlock to continue.`);
          setSelectedLoginUser(fallbackExisting);
          setMode("login");
        } else {
          setErrorMessage(res.error || "Google Sign-In was cancelled.");
        }
      }
    } catch (err: any) {
      console.warn("Google Sign-In error:", err);
      setErrorMessage(err?.message || "Failed to complete Google Sign-In. Please use PIN login.");
    } finally {
      setIsGoogleAuthLoading(false);
    }
  };

  // Launch Chrome External Web Authentication
  const handleLaunchChromeLogin = async () => {
    setIsLaunchingChrome(true);
    setErrorMessage("");
    setSuccessMessage("");
    setManualAuthCode("");

    try {
      const userHint = selectedLoginUser?.email || email.trim() || undefined;
      const session = await createWebAuthTicket(userHint);
      if (!session) {
        setErrorMessage("Could not initialize external web login ticket. Please try PIN.");
        setIsLaunchingChrome(false);
        return;
      }

      setActiveWebAuthSession(session);
      openInExternalChromeBrowser(session.webLoginUrl);
    } catch (err: any) {
      console.error("Chrome Web Auth launch error:", err);
      setErrorMessage("Could not launch Google Chrome browser. Please log in using PIN or Google.");
    } finally {
      setIsLaunchingChrome(false);
    }
  };

  // Poll for external Chrome authentication status
  useEffect(() => {
    if (!activeWebAuthSession || !isOpen) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const result = await checkWebAuthStatus(activeWebAuthSession.ticket);
        if (!isMounted) return;

        if (result.status === "authenticated" && result.user) {
          clearInterval(interval);
          setActiveWebAuthSession(null);

          const matchedUser: UserAccount = {
            id: result.user.id || "user-" + result.user.email.replace(/[^a-zA-Z0-9]/g, "_"),
            name: result.user.name || "Khata User",
            email: result.user.email || "",
            phone: result.user.phone || phone || "+919935612249",
            accountType: (result.user.accountType as any) || "Personal",
            avatarColor: result.user.avatarColor || "#1A73E8",
            joinedDate: "Today",
            lastLogin: "Active Now",
            authProvider: "google",
            pin: "1234",
            password: "khata",
          };

          upsertUserAccount(matchedUser);
          syncUserProfileToFirestore(matchedUser).catch(() => {});

          setSuccessMessage(`Chrome Verified! Welcome back, ${matchedUser.name}! Restoring ledger...`);
          setOnboardingCompleted(true);
          setStoredAuthState(true);

          setTimeout(() => {
            onLogin(matchedUser);
          }, 600);
        }
      } catch (e) {
        console.warn("Chrome web auth poll error:", e);
      }
    }, 1600);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeWebAuthSession, isOpen, phone, onLogin]);

  // Handle manual 6-digit confirmation code verification
  const handleVerifyManualCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAuthCode.trim() || manualAuthCode.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit confirmation code shown in Chrome.");
      return;
    }

    setIsVerifyingCode(true);
    setErrorMessage("");
    try {
      const result = await verifyWebAuthCode(manualAuthCode.trim());
      if (result.success && result.user) {
        setActiveWebAuthSession(null);
        const authedUser: UserAccount = {
          id: result.user.id || "user-" + result.user.email.replace(/[^a-zA-Z0-9]/g, "_"),
          name: result.user.name || "Khata User",
          email: result.user.email || "",
          phone: result.user.phone || phone || "+919935612249",
          accountType: (result.user.accountType as any) || "Personal",
          avatarColor: result.user.avatarColor || "#1A73E8",
          joinedDate: "Today",
          lastLogin: "Active Now",
          authProvider: "google",
          pin: "1234",
          password: "khata",
        };

        upsertUserAccount(authedUser);
        syncUserProfileToFirestore(authedUser).catch(() => {});

        setSuccessMessage(`Code Verified! Welcome back, ${authedUser.name}!`);
        setOnboardingCompleted(true);
        setStoredAuthState(true);
        setTimeout(() => {
          onLogin(authedUser);
        }, 500);
      } else {
        setErrorMessage(result.error || "Invalid or expired confirmation code. Please check Chrome.");
      }
    } catch (err: any) {
      setErrorMessage("Verification error. Please try again or use PIN.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Handle Manual Sign Up Form Submission
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
    const targetEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = findExistingUser(targetEmail, allUsers);
    if (existing) {
      // Direct login to prevent duplicate accounts and restore their cloud data
      setSuccessMessage(`Account found for ${existing.name}! Logging into existing profile & restoring backup...`);
      setOnboardingCompleted(true);
      setStoredAuthState(true);

      setTimeout(() => {
        setIsSubmitting(false);
        onLogin(existing);
      }, 700);
      return;
    }

    // Determine deterministic permanent ID
    const permanentId =
      targetEmail === "chauhanramkeval@gmail.com"
        ? "user-ramkeval"
        : "user-" + targetEmail.replace(/[^a-zA-Z0-9]/g, "_");

    const newUser: UserAccount = {
      id: permanentId,
      name: name.trim(),
      email: targetEmail,
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

    upsertUserAccount(newUser);
    syncUserProfileToFirestore(newUser).catch(() => {});

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
      setSuccessMessage(`Welcome back, ${selectedLoginUser.name}! Restoring cloud backup...`);
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
              {mode === "login" ? "Welcome Back to Ram expenses" : "Create New Khata Account"}
            </h2>
            <p className="text-xs text-[#5F6368]">
              {mode === "login"
                ? "Sign in with Google or enter your 4-digit PIN to access your account"
                : "Register a profile to isolate your expenses with automatic cloud sync"}
            </p>
          </div>

          {/* Top Segmented Mode Selector: Log In vs Create Account */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F3F4] rounded-2xl mt-2">
            <button
              id="tab-mode-login"
              type="button"
              onClick={() => setMode("login")}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "login"
                  ? "bg-white text-[#1A73E8] shadow-xs"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              <LogIn size={14} />
              <span>Log In</span>
            </button>
            <button
              id="tab-mode-signup"
              type="button"
              onClick={() => setMode("signup")}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "signup"
                  ? "bg-white text-[#1A73E8] shadow-xs"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              <User size={14} />
              <span>Create Account</span>
            </button>
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
        {/* MODE 1: LOG IN (Auto-Detect Existing Profile & Cloud Sync)                */}
        {/* ========================================================================= */}
        {mode === "login" && (
          <div className="space-y-4 py-3">
            {/* Unified 1-Click Google Sign In & Chrome External Browser Login */}
            <div className="space-y-2">
              <button
                id="btn-google-unified-login"
                type="button"
                disabled={isGoogleAuthLoading || isLaunchingChrome}
                onClick={handleGoogleSignInUnified}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F8F9FA] active:bg-[#F1F3F4] text-[#202124] font-semibold text-xs sm:text-sm rounded-2xl border border-[#DADCE0] shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isGoogleAuthLoading ? (
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
                <span>
                  {isGoogleAuthLoading
                    ? "Authenticating with Google..."
                    : "Continue with Google (Auto-Detect)"}
                </span>
              </button>

              {/* Log In via External Chrome Browser */}
              <button
                id="btn-login-via-chrome"
                type="button"
                disabled={isLaunchingChrome || isGoogleAuthLoading}
                onClick={handleLaunchChromeLogin}
                className="w-full py-2.5 px-4 bg-[#F8F9FA] hover:bg-[#E8F0FE] text-[#1A73E8] font-bold text-xs rounded-2xl border border-[#DADCE0] hover:border-[#1A73E8] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                {isLaunchingChrome ? (
                  <RefreshCw size={14} className="animate-spin text-[#1A73E8]" />
                ) : (
                  <Compass size={15} className="text-[#1A73E8]" />
                )}
                <span>Log In via Chrome / Web Browser</span>
                <ExternalLink size={12} className="text-[#5F6368]" />
              </button>
            </div>

            {/* Active Chrome Web Authentication Waiting Box */}
            {activeWebAuthSession && (
              <div className="p-3.5 bg-[#E8F0FE]/80 rounded-2xl border border-[#D2E3FC] space-y-3 animate-fadeIn">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#1A73E8] flex items-center justify-center shadow-xs">
                      <RefreshCw size={16} className="animate-spin text-[#1A73E8]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1A73E8]">Waiting for Chrome Authentication...</h4>
                      <p className="text-[11px] text-[#5F6368]">
                        Complete sign in inside the external Chrome browser tab.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWebAuthSession(null)}
                    className="text-[10px] text-[#5F6368] hover:text-[#C5221F] font-bold px-2 py-1 rounded-lg bg-white border border-[#DADCE0] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* 6-Digit Verification Code Manual Input */}
                <form onSubmit={handleVerifyManualCode} className="space-y-2 pt-1 border-t border-[#D2E3FC]">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#3C4043]">
                      Or enter 6-digit confirmation code from Chrome:
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      value={manualAuthCode}
                      onChange={(e) => setManualAuthCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="e.g. 849201"
                      className="flex-1 px-3 py-1.5 text-center text-sm font-mono font-bold bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none tracking-wider"
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingCode || manualAuthCode.length !== 6}
                      className="px-3 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {isVerifyingCode ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      <span>Verify</span>
                    </button>
                  </div>
                </form>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={() => openInExternalChromeBrowser(activeWebAuthSession.webLoginUrl)}
                    className="text-[#1A73E8] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink size={11} />
                    <span>Reopen in Google Chrome</span>
                  </button>
                </div>
              </div>
            )}

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
                {/* Masked PIN Bullets & Eye Toggle */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <div
                    className={`flex items-center justify-center gap-2.5 py-1.5 px-3 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] shadow-2xs ${
                      isShaking ? "animate-shake border-[#EA4335]" : ""
                    }`}
                  >
                    {[0, 1, 2, 3].map((idx) => {
                      const isFilled = loginPin.length > idx;
                      const digit = loginPin[idx];
                      return (
                        <div
                          key={idx}
                          className={`w-7 h-8.5 rounded-xl flex items-center justify-center text-sm font-mono font-bold transition-all duration-200 border ${
                            isFilled
                              ? "bg-white border-[#1A73E8] text-[#1A73E8] shadow-xs scale-105"
                              : "bg-white/60 border-[#DADCE0] text-transparent"
                          }`}
                        >
                          {isFilled ? (
                            showLoginPin ? (
                              <span>{digit}</span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-[#1A73E8] inline-block"></span>
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
                    id="btn-toggle-initial-pin-visibility"
                    type="button"
                    onClick={() => setShowLoginPin(!showLoginPin)}
                    className="p-2 text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer border border-[#E8EAED] bg-white shadow-2xs"
                    title={showLoginPin ? "Hide PIN digits" : "Show PIN digits"}
                    aria-label={showLoginPin ? "Hide PIN digits" : "Show PIN digits"}
                  >
                    {showLoginPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
              </div>
            )}

            {/* TAB 2: Password Entry */}
            {loginMethod === "password" && (
              <form onSubmit={handlePasswordLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                    Account Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
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

                <div>
                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-xl shadow-xs transition-colors cursor-pointer"
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
                  <span>{isBioLoading ? "Verifying Fingerprint..." : "Unlock with Fingerprint"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOnboardingCompleted(true);
                    setStoredAuthState(true);
                    setSuccessMessage(`Welcome back, ${selectedLoginUser.name}! Restoring cloud backup...`);
                    setTimeout(() => onLogin(selectedLoginUser), 400);
                  }}
                  className="w-full p-3 bg-white hover:bg-[#F8F9FA] text-[#202124] rounded-2xl border border-[#DADCE0] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>1-Click Direct Unlock ({selectedLoginUser.name})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: SIGN UP / PROFILE CREATION                                        */}
        {/* ========================================================================= */}
        {mode === "signup" && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5 py-3">
            {/* 1-Click Google Sign-Up Top Shortcut */}
            <button
              type="button"
              disabled={isGoogleAuthLoading}
              onClick={handleGoogleSignInUnified}
              className="w-full py-2.5 px-4 bg-white hover:bg-[#F8F9FA] text-[#202124] font-semibold text-xs rounded-2xl border border-[#DADCE0] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
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
              <span>1-Click Sign Up with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#E8EAED] w-full"></div>
              <span className="bg-white px-2 text-[10px] uppercase font-bold text-[#80868B] shrink-0 tracking-wider">
                Or Enter Details
              </span>
            </div>

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
                    placeholder="chauhanramkeval@gmail.com"
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
                    placeholder="+919935612249"
                    className="w-full pl-9 pr-2 py-2 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none transition-all font-mono"
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
                  placeholder="ramkeval@okhdfcbank"
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
                  Required for Unlock
                </span>
              </div>

              <div className="relative">
                <input
                  id="signup-pin"
                  type={showSignupPin ? "text" : "password"}
                  maxLength={4}
                  inputMode="numeric"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="w-full py-2.5 pl-4 pr-10 text-center text-lg font-bold bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none tracking-[0.3em] font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPin(!showSignupPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8] cursor-pointer p-1"
                  title={showSignupPin ? "Hide PIN" : "Show PIN"}
                  aria-label={showSignupPin ? "Hide PIN" : "Show PIN"}
                >
                  {showSignupPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-[#5F6368] text-center">
                Enter your secret 4-digit PIN. You will need this to unlock your account.
              </p>
            </div>

            {/* Create Account Action */}
            <button
              id="btn-signup-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{isSubmitting ? "Creating & Syncing Khata..." : "Create Account & Start Khata"}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Bottom Switch Link */}
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
                <span>Log In & Restore Backup</span>
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
                <span>Create New Account</span>
                <ChevronRight size={13} />
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
