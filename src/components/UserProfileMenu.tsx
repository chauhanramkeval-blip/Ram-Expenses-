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
  Lock,
  X,
  KeyRound,
} from "lucide-react";
import { UserAccount } from "../types";
import { getInitials } from "../utils/auth";
import { ErrorBoundary } from "./ErrorBoundary";

interface UserProfileMenuProps {
  currentUser?: UserAccount | null;
  allUsers?: UserAccount[];
  onSwitchUser?: (user: UserAccount) => void;
  onOpenEditProfile?: () => void;
  onOpenSecurityModal?: () => void;
  onOpenBackupModal?: () => void;
  onOpenFirebaseSync?: () => void;
  onLogout?: () => void;
  onOpenNewAccountModal?: () => void;
  onLockSession?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = (props) => {
  return (
    <ErrorBoundary fallbackTitle="Profile Menu Unavailable" fallbackMessage="Could not load profile menu.">
      <UserProfileMenuContent {...props} />
    </ErrorBoundary>
  );
};

const UserProfileMenuContent: React.FC<UserProfileMenuProps> = ({
  currentUser,
  allUsers = [],
  onSwitchUser = (_user: UserAccount) => {},
  onOpenEditProfile = () => {},
  onOpenSecurityModal = () => {},
  onOpenBackupModal,
  onOpenFirebaseSync,
  onLogout = () => {},
  onOpenNewAccountModal = () => {},
  onLockSession,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Safe fallback current user
  const safeUser: UserAccount = currentUser || {
    id: "user-default",
    name: "Ramkeval Chauhan",
    email: "chauhanramkeval@gmail.com",
    phone: "+91 98765 43210",
    upiId: "ramkeval@okhdfcbank",
    avatarColor: "#1A73E8",
    accountType: "Personal",
    joinedDate: "Today",
    lastLogin: "Active",
    authProvider: "google",
    pin: "1234",
  };

  const safeAllUsers: UserAccount[] = Array.isArray(allUsers) && allUsers.length > 0 ? allUsers : [safeUser];

  // Close when pressing Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const initials = getInitials(safeUser?.name || "User");
  const firstName = (safeUser?.name || "User").trim().split(/\s+/)[0] || "User";

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Header Profile Trigger Capsule */}
      <button
        id="btn-user-profile-menu"
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-2 sm:pr-2.5 bg-[#F1F3F4] hover:bg-[#E8EAED] rounded-full transition-all border border-[#DADCE0] hover:border-[#BDC1C6] cursor-pointer shadow-2xs"
        title={`Logged in as ${safeUser?.name || "User"} (${safeUser?.email || ""})`}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs relative shrink-0"
          style={{ backgroundColor: safeUser?.avatarColor || "#1A73E8" }}
        >
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#34A853] border-2 border-white rounded-full"></span>
        </div>
        <span className="text-xs font-bold text-[#202124] max-w-[80px] sm:max-w-[110px] truncate hidden xs:inline-block">
          {firstName}
        </span>
        <ChevronDown size={14} className={`text-[#5F6368] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* User Profile & Account Switcher Modal / Responsive Bottom Sheet */}
      {isOpen && (
        <div
          id="user-profile-backdrop"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#202124]/60 backdrop-blur-xs animate-fadeIn text-[#202124]"
          onClick={handleClose}
        >
          <div
            id="user-profile-dropdown-card"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8EAED] p-4 sm:p-5 space-y-3.5 animate-scaleUp"
          >
            {/* Modal Header with Close Button */}
            <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#202124]">Khata Account & Profile</h3>
                  <p className="text-[11px] text-[#5F6368]">Manage ledger & switch profiles</p>
                </div>
              </div>
              <button
                id="btn-close-profile-modal"
                type="button"
                onClick={handleClose}
                className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Active User Card Header */}
            <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-xs shrink-0"
                  style={{ backgroundColor: safeUser?.avatarColor || "#1A73E8" }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-bold text-[#202124] truncate">
                      {safeUser?.name || "User"}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-bold border border-[#D2E3FC] shrink-0">
                      {safeUser?.accountType || "Personal"}
                    </span>
                  </div>
                  <p className="text-xs text-[#5F6368] truncate flex items-center gap-1 mt-0.5">
                    <Mail size={12} className="text-[#80868B] shrink-0" />
                    <span className="truncate">{safeUser?.email || "No email"}</span>
                  </p>
                  {safeUser?.phone && (
                    <p className="text-[11px] text-[#5F6368] truncate flex items-center gap-1 mt-0.5">
                      <Phone size={11} className="text-[#80868B] shrink-0" />
                      <span>{safeUser.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {safeUser?.upiId && (
                <div className="pt-2 border-t border-[#E8EAED] flex items-center justify-between text-xs text-[#5F6368]">
                  <span className="flex items-center gap-1">
                    <QrCode size={13} className="text-[#1A73E8]" />
                    <span>UPI VPA:</span>
                  </span>
                  <span className="font-mono font-medium text-[#202124] text-xs bg-white px-2 py-0.5 rounded border border-[#E8EAED]">
                    {safeUser.upiId}
                  </span>
                </div>
              )}
            </div>

            {/* Switch Accounts List */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#5F6368] uppercase tracking-wider flex items-center gap-1">
                  <Lock size={12} className="text-[#1A73E8]" />
                  <span>Switch Profile (PIN Protected)</span>
                </span>
                <button
                  type="button"
                  id="btn-add-another-account"
                  onClick={() => {
                    handleClose();
                    onOpenNewAccountModal();
                  }}
                  className="text-xs font-bold text-[#1A73E8] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <UserPlus size={13} />
                  <span>+ Add New</span>
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {safeAllUsers.map((u) => {
                  const isActive = u.id === safeUser.id;
                  const uInitials = getInitials(u?.name || "User");
                  return (
                    <button
                      key={u.id}
                      id={`btn-switch-user-${u.id}`}
                      type="button"
                      onClick={() => {
                        handleClose();
                        if (!isActive) {
                          onSwitchUser(u);
                        }
                      }}
                      title={isActive ? "Active Account" : `Switch to ${u?.name || "Account"} (Requires Authentication)`}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#E8F0FE] text-[#1A73E8] font-bold border border-[#D2E3FC]"
                          : "hover:bg-[#F1F3F4] text-[#202124] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                          style={{ backgroundColor: u.avatarColor || "#1A73E8" }}
                        >
                          {uInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                            <span>{u.name || "User"}</span>
                            {!isActive && <Lock size={11} className="text-[#80868B] shrink-0" />}
                          </div>
                          <div className="text-[11px] text-[#5F6368] truncate">{u.email || ""}</div>
                        </div>
                      </div>
                      {isActive ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-[#1A73E8]">
                          <Check size={16} className="text-[#1A73E8] shrink-0" />
                          <span className="hidden xs:inline">Active</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-[#1A73E8] bg-[#E8F0FE] px-2 py-0.5 rounded-md shrink-0 border border-[#D2E3FC]">
                          Verify PIN
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings & Privacy Shortcuts */}
            <div className="space-y-1 pt-2 border-t border-[#F1F3F4]">
              {onLockSession && (
                <button
                  id="btn-lock-session-menu-item"
                  type="button"
                  onClick={() => {
                    handleClose();
                    onLockSession();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] rounded-xl transition-colors cursor-pointer border border-[#D2E3FC]"
                >
                  <Lock size={15} className="text-[#1A73E8]" />
                  <span>Lock Active Session Now</span>
                </button>
              )}

              <button
                id="btn-edit-profile-menu-item"
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenEditProfile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
              >
                <User size={15} className="text-[#1A73E8]" />
                <span>Edit Profile & Credentials</span>
              </button>

              {onOpenFirebaseSync && (
                <button
                  id="btn-firebase-sync-menu-item"
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenFirebaseSync();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
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
                    handleClose();
                    onOpenBackupModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
                >
                  <Mail size={15} className="text-[#1A73E8]" />
                  <span>Export / Email Backup</span>
                </button>
              )}

              <button
                id="btn-security-menu-item"
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenSecurityModal();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
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
                  handleClose();
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-[#C5221F] bg-[#FCE8E6] hover:bg-[#FAD2CF] rounded-xl transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>Log out of Khata</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
