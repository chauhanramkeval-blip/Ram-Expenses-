import React, { useState } from "react";
import { X, UserPlus, Sparkles, Building2, User, Mail, Phone, Lock, KeyRound } from "lucide-react";
import { UserAccount } from "../types";
import { ErrorBoundary } from "./ErrorBoundary";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (user: UserAccount) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <ErrorBoundary fallbackTitle="Add Account Error" fallbackMessage="Could not load add account dialog.">
      <AddAccountModalContent {...props} />
    </ErrorBoundary>
  );
};

const AddAccountModalContent: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("1234");
  const [password, setPassword] = useState("khata123");
  const [accountType, setAccountType] = useState<"Personal" | "Business / Shop" | "Household & Family">(
    "Household & Family"
  );
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter a name for the new Khata account.");
      return;
    }

    if (pin && pin.length !== 4) {
      setErrorMsg("Security PIN must be exactly 4 digits.");
      return;
    }

    const newUser: UserAccount = {
      id: "user-" + Date.now(),
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, "")}@khata.in`,
      phone: phone.trim() || "+91 98000 00000",
      avatarColor:
        accountType === "Business / Shop"
          ? "#188038"
          : accountType === "Household & Family"
          ? "#E37400"
          : "#1A73E8",
      accountType,
      joinedDate: "Today",
      lastLogin: "Just now",
      authProvider: "pin",
      pin: pin || "1234",
      password: password || "khata123",
      securityQuestion: "What is your favorite city?",
      securityAnswer: "Mumbai",
    };

    onAddAccount(newUser);
    onClose();
  };

  return (
    <div
      id="add-account-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/50 backdrop-blur-xs animate-fadeIn text-[#202124]"
      onClick={onClose}
    >
      <div
        id="add-account-card"
        className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8EAED] p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold shadow-2xs">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#202124]">Add New Khata Account</h3>
              <p className="text-xs text-[#5F6368]">Create a dedicated personal, shop, or family ledger</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Name */}
          <div>
            <label className="text-xs font-semibold text-[#5F6368] block mb-1">
              Account / Ledger Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma, Kirana Store, Flat 302 Spends"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-[#5F6368] block mb-1">
              Email (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="family@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-[#5F6368] block mb-1">
              Mobile Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
              />
            </div>
          </div>

          {/* Security PIN & Password Setup */}
          <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-3">
            <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
              <Lock size={14} className="text-[#1A73E8]" />
              <span>Profile Protection & Credentials</span>
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-[#5F6368] block mb-1">
                  4-Digit PIN *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5F6368]" size={14} />
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="1234"
                    className="w-full pl-8 pr-2 py-1.5 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#5F6368] block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5F6368]" size={14} />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="khata123"
                    className="w-full pl-8 pr-2 py-1.5 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none font-mono"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[#80868B]">
              This PIN will be required when switching to this ledger account.
            </p>
          </div>

          {/* Khata Type */}
          <div>
            <label className="text-xs font-semibold text-[#5F6368] block mb-1">
              Khata Ledger Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "Personal", label: "Personal", desc: "Daily living" },
                { id: "Household & Family", label: "Family", desc: "Shared home" },
                { id: "Business / Shop", label: "Business", desc: "Shop & GST" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAccountType(t.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    accountType === t.id
                      ? "bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] font-bold shadow-2xs"
                      : "bg-[#F8F9FA] border-[#E8EAED] text-[#5F6368] hover:bg-[#F1F3F4]"
                  }`}
                >
                  <span className="block text-xs font-semibold">{t.label}</span>
                  <span className="text-[10px] opacity-75">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && <p className="text-xs font-semibold text-[#C5221F]">{errorMsg}</p>}

          <div className="pt-3 border-t border-[#F1F3F4] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-create-new-account"
              className="px-5 py-2 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
