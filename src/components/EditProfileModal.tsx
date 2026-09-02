import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, QrCode, Building2, Check, Palette, Lock, KeyRound, Eye, EyeOff } from "lucide-react";
import { UserAccount } from "../types";
import { ErrorBoundary } from "./ErrorBoundary";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onSaveProfile: (updated: UserAccount) => void;
  onLogout?: () => void;
}

const AVATAR_COLORS = [
  "#1A73E8", // Google Blue
  "#EA4335", // Google Red
  "#FBBC04", // Google Yellow
  "#34A853", // Google Green
  "#9334E6", // Purple
  "#E37400", // Warm Orange
  "#00796B", // Teal
  "#202124", // Slate Dark
];

export const EditProfileModal: React.FC<EditProfileModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <ErrorBoundary fallbackTitle="Edit Profile Error" fallbackMessage="Unable to display edit profile modal.">
      <EditProfileModalContent {...props} />
    </ErrorBoundary>
  );
};

const EditProfileModalContent: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
}) => {
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [upiId, setUpiId] = useState(currentUser?.upiId || "");
  const [pin, setPin] = useState(currentUser?.pin || "1234");
  const [showPin, setShowPin] = useState(false);
  const [password, setPassword] = useState(currentUser?.password || "khata");
  const [accountType, setAccountType] = useState<"Personal" | "Business / Shop" | "Household & Family">(
    currentUser?.accountType || "Personal"
  );
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || "#1A73E8");

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setUpiId(currentUser.upiId || "");
      setPin(currentUser.pin || "1234");
      setPassword(currentUser.password || "khata");
      setAccountType(currentUser.accountType || "Personal");
      setAvatarColor(currentUser.avatarColor || "#1A73E8");
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const baseUser = currentUser || {
      id: "user-" + Date.now(),
      joinedDate: "Today",
      lastLogin: "Active",
      authProvider: "pin",
    };

    const updated: UserAccount = {
      ...baseUser,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, "")}@khata.in`,
      phone: phone.trim(),
      upiId: upiId.trim(),
      pin: pin.trim() || "1234",
      password: password.trim() || "khata",
      accountType,
      avatarColor,
    };

    onSaveProfile(updated);
    onClose();
  };

  return (
    <div
      id="edit-profile-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/50 backdrop-blur-xs animate-fadeIn text-[#202124]"
      onClick={onClose}
    >
      <div
        id="edit-profile-card"
        className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8EAED] p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xs text-lg"
              style={{ backgroundColor: avatarColor }}
            >
              {name ? name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h3 className="font-bold text-base text-[#202124]">Edit Profile & Khata Info</h3>
              <p className="text-xs text-[#5F6368]">Update your personal or business ledger details</p>
            </div>
          </div>
          <button
            id="btn-close-edit-profile"
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Color Picker */}
          <div>
            <label className="text-xs font-semibold text-[#5F6368] flex items-center gap-1.5 mb-1.5">
              <Palette size={14} className="text-[#1A73E8]" />
              <span>Theme / Avatar Color</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    avatarColor === c ? "ring-2 ring-offset-2 ring-[#1A73E8] scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {avatarColor === c && <Check size={14} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-[#5F6368] block mb-1">
              Full Name / Ledger Holder *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
              <input
                id="input-profile-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramkeval Chauhan"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="text-xs font-semibold text-[#5F6368] block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
              <input
                id="input-profile-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chauhanramkeval@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs font-semibold text-[#5F6368] block mb-1">
              Mobile Number (+91)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
              <input
                id="input-profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
              />
            </div>
          </div>

          {/* UPI ID */}
          <div>
            <label className="text-xs font-semibold text-[#5F6368] block mb-1">
              Default UPI ID / VPA
            </label>
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" size={16} />
              <input
                id="input-profile-upi"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="name@okhdfcbank / paytm"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
              />
            </div>
          </div>

          {/* Security PIN & Password Setup */}
          <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-3">
            <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
              <Lock size={14} className="text-[#1A73E8]" />
              <span>Security PIN & Password</span>
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-[#5F6368] block mb-1">
                  4-Digit PIN *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5F6368]" size={14} />
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    inputMode="numeric"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="1234"
                    className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-white text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none font-mono tracking-widest text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8] cursor-pointer"
                    title={showPin ? "Hide PIN" : "Show PIN"}
                    aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
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
              This PIN will be requested when logging in or switching to your account.
            </p>
          </div>

          {/* Account / Khata Type */}
          <div>
            <label className="text-xs font-semibold text-[#5F6368] block mb-1">
              Khata Type
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

          {/* Actions */}
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
              id="btn-save-profile"
              className="px-5 py-2 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-full shadow-xs transition-colors cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
