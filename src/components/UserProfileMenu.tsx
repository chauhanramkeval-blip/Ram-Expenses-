import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  ChevronDown,
  UserPlus,
  ShieldCheck,
  Building2,
  Check,
  Mail,
  Phone,
  QrCode,
  Sparkles,
  Cloud,
} from "lucide-react";
import { UserAccount } from "../types";
import { getInitials } from "../utils/auth";

interface UserProfileMenuProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSwitchUser: (user: UserAccount) => void;
  onOpenEditProfile: () => void;
  onOpenSecurityModal: () => void;
  onOpenBackupModal?: () => void;
  onOpenFirebaseSync?: () => void;
  onLogout: () => void;
  onOpenNewAccountModal: () => void;
  onLockSession?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenEditProfile,
  onOpenSecurityModal,
  onOpenBackupModal,
  onOpenFirebaseSync,
  onLogout,
  onOpenNewAccountModal,
  onLockSession,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const initials = getInitials(currentUser.name);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Profile Trigger Capsule */}
      <button
        id="btn-user-profile-menu"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-2 sm:pr-2.5 bg-[#F1F3F4] hover:bg-[#E8EAED] rounded-full transition-all border border-[#DADCE0] hover:border-[#BDC1C6] cursor-pointer"
        title={`Logged in as ${currentUser.name} (${currentUser.email})`}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs relative"
          style={{ backgroundColor: currentUser.avatarColor || "#1A73E8" }}
        >
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#34A853] border-2 border-white rounded-full"></span>
        </div>
        <span className="text-xs font-bold text-[#202124] max-w-[90px] sm:max-w-[120px] truncate hidden xs:inline-block">
          {currentUser.name.split(" ")[0]}
        </span>
        <ChevronDown size={14} className={`text-[#5F6368] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Floating User Profile Dropdown Menu */}
      {isOpen && (
        <div
          id="user-profile-dropdown"
          className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-[#E8EAED] z-50 animate-fadeIn p-4 space-y-3.5"
        >
          {/* Active User Card Header */}
          <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-xs"
                style={{ backgroundColor: currentUser.avatarColor || "#1A73E8" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-[#202124] truncate">{currentUser.name}</h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-bold border border-[#D2E3FC] shrink-0">
                    {currentUser.accountType || "Personal"}
                  </span>
                </div>
                <p className="text-[11px] text-[#5F6368] truncate flex items-center gap-1">
                  <Mail size={11} className="text-[#80868B] shrink-0" />
                  <span className="truncate">{currentUser.email}</span>
                </p>
                {currentUser.phone && (
                  <p className="text-[10px] text-[#5F6368] truncate flex items-center gap-1">
                    <Phone size={10} className="text-[#80868B] shrink-0" />
                    <span>{currentUser.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {currentUser.upiId && (
              <div className="pt-2 border-t border-[#E8EAED] flex items-center justify-between text-[10px] text-[#5F6368]">
                <span className="flex items-center gap-1">
                  <QrCode size={11} className="text-[#1A73E8]" />
                  <span>UPI VPA:</span>
                </span>
                <span className="font-mono font-medium text-[#202124]">{currentUser.upiId}</span>
              </div>
            )}
          </div>

          {/* Switch Accounts List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider flex items-center gap-1">
                <Lock size={11} className="text-[#1A73E8]" />
                <span>Switch Profile (Secure PIN)</span>
              </span>
              <button
                type="button"
                id="btn-add-another-account"
                onClick={() => {
                  setIsOpen(false);
                  onOpenNewAccountModal();
                }}
                className="text-[11px] font-bold text-[#1A73E8] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <UserPlus size={12} />
                <span>+ Add</span>
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {allUsers.map((u) => {
                const isActive = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    id={`btn-switch-user-${u.id}`}
                    type="button"
                    onClick={() => {
                      onSwitchUser(u);
                      setIsOpen(false);
                    }}
                    title={isActive ? "Active Account" : `Switch to ${u.name} (Requires Authentication)`}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#E8F0FE] text-[#1A73E8] font-bold border border-[#D2E3FC]"
                        : "hover:bg-[#F1F3F4] text-[#202124]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: u.avatarColor || "#1A73E8" }}
                      >
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate flex items-center gap-1">
                          <span>{u.name}</span>
                          {!isActive && <Lock size={10} className="text-[#80868B] shrink-0" />}
                        </div>
                        <div className="text-[10px] text-[#5F6368] truncate">{u.email}</div>
                      </div>
                    </div>
                    {isActive ? (
                      <Check size={14} className="text-[#1A73E8] shrink-0" />
                    ) : (
                      <span className="text-[9px] font-bold text-[#1A73E8] bg-[#E8F0FE] px-1.5 py-0.5 rounded-md shrink-0">
                        Verify
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings & Privacy Shortcuts */}
          <div className="space-y-1 pt-1 border-t border-[#F1F3F4]">
            {onLockSession && (
              <button
                id="btn-lock-session-menu-item"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onLockSession();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-bold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] rounded-xl transition-colors cursor-pointer border border-[#D2E3FC]"
              >
                <Lock size={15} className="text-[#1A73E8]" />
                <span>Lock Active Session Now</span>
              </button>
            )}

            <button
              id="btn-edit-profile-menu-item"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenEditProfile();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
            >
              <User size={15} className="text-[#1A73E8]" />
              <span>Edit Profile & Credentials</span>
            </button>

            {onOpenFirebaseSync && (
              <button
                id="btn-firebase-sync-menu-item"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFirebaseSync();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
              >
                <Cloud size={15} className="text-[#1A73E8]" />
                <span>Cloud Firestore Sync</span>
              </button>
            )}

            {onOpenBackupModal && (
              <button
                id="btn-backup-menu-item"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenBackupModal();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
              >
                <Mail size={15} className="text-[#1A73E8]" />
                <span>Export / Email Backup</span>
              </button>
            )}

            <button
              id="btn-security-menu-item"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSecurityModal();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
            >
              <ShieldCheck size={15} className="text-[#188038]" />
              <span>Privacy & PIN / Biometric Lock</span>
            </button>
          </div>

          {/* Log Out Action */}
          <div className="pt-2 border-t border-[#F1F3F4]">
            <button
              id="btn-logout-khata"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#C5221F] bg-[#FCE8E6] hover:bg-[#FAD2CF] rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span>Log out of Khata</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
