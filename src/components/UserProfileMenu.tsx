import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Mail,
  Phone,
  QrCode,
  Cloud,
  Lock,
  X,
  Trash2,
  Edit3,
  AlertTriangle,
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
  onOpenPermissionsHub?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: (user: UserAccount) => void;
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
  onOpenEditProfile = () => {},
  onOpenSecurityModal = () => {},
  onOpenBackupModal,
  onOpenFirebaseSync,
  onOpenPermissionsHub,
  onLogout = () => {},
  onDeleteAccount,
  onLockSession,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Safe fallback current user using dynamic active user's actual profile name
  const safeUser: UserAccount = currentUser || {
    id: "user-default",
    name: "Your Name",
    email: "",
    phone: "",
    upiId: "",
    avatarColor: "#1A73E8",
    accountType: "Personal",
    joinedDate: "Today",
    lastLogin: "Active",
    authProvider: "pin",
    pin: "1234",
  };

  // Dynamic user display name with fallback to "Your Name"
  const displayName = safeUser?.name?.trim() || "Your Name";
  const initials = getInitials(displayName);
  const firstName = displayName.split(/\s+/)[0] || "Your Name";

  // Close when pressing Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showDeleteConfirm]);


  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    setIsOpen(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDeleteAccount) {
        await onDeleteAccount(safeUser);
      }
      handleClose();
    } catch (err) {
      console.error("Failed to delete account:", err);
      setIsDeleting(false);
    }
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

      {/* User Profile Modal / Responsive Bottom Sheet */}
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
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8EAED] p-4 sm:p-5 space-y-3.5 animate-scaleUp"
          >
            {/* Modal Header with Close Button */}
            <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#202124]">Khata Account & Profile</h3>
                  <p className="text-[11px] text-[#5F6368]">Active profile & security options</p>
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

            {/* Current Logged-In User Profile Card */}
            <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-3">
              <div className="flex items-start gap-3.5">
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xs shrink-0"
                  style={{ backgroundColor: safeUser?.avatarColor || "#1A73E8" }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-base font-bold text-[#202124] truncate">
                      {displayName}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-bold border border-[#D2E3FC] shrink-0">
                      {safeUser?.accountType || "Personal"}
                    </span>
                  </div>

                  <p className="text-xs text-[#5F6368] truncate flex items-center gap-1.5 mt-1">
                    <Mail size={13} className="text-[#80868B] shrink-0" />
                    <span className="truncate">{safeUser?.email || "No email"}</span>
                  </p>

                  {safeUser?.phone && (
                    <p className="text-xs text-[#5F6368] truncate flex items-center gap-1.5 mt-0.5">
                      <Phone size={13} className="text-[#80868B] shrink-0" />
                      <span>{safeUser.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {safeUser?.upiId && (
                <div className="pt-2.5 border-t border-[#E8EAED] flex items-center justify-between text-xs text-[#5F6368]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <QrCode size={14} className="text-[#1A73E8]" />
                    <span>UPI ID / VPA:</span>
                  </span>
                  <span className="font-mono font-medium text-[#202124] text-xs bg-white px-2.5 py-1 rounded-lg border border-[#DADCE0] shadow-2xs">
                    {safeUser.upiId}
                  </span>
                </div>
              )}

              {/* Edit Profile Option directly below Profile Details */}
              <div className="pt-2 border-t border-[#E8EAED]">
                <button
                  id="btn-edit-profile-menu-item"
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenEditProfile();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-[#1A73E8] bg-white hover:bg-[#E8F0FE] border border-[#D2E3FC] rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <Edit3 size={14} className="text-[#1A73E8]" />
                  <span>Edit Profile & Security Credentials</span>
                </button>
              </div>
            </div>

            {/* Quick Security & Tools Actions */}
            <div className="space-y-1 pt-1 border-t border-[#F1F3F4]">
              {onLockSession && (
                <button
                  id="btn-lock-session-menu-item"
                  type="button"
                  onClick={() => {
                    handleClose();
                    onLockSession();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE]/70 hover:bg-[#D2E3FC] rounded-xl transition-colors cursor-pointer border border-[#D2E3FC]"
                >
                  <Lock size={15} className="text-[#1A73E8]" />
                  <span>Lock Active Session with PIN</span>
                </button>
              )}

              {onOpenSecurityModal && (
                <button
                  id="btn-security-menu-item"
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenSecurityModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
                >
                  <ShieldCheck size={15} className="text-[#188038]" />
                  <span>App Lock & Biometrics Configuration</span>
                </button>
              )}

              {onOpenFirebaseSync && (
                <button
                  id="btn-firebase-sync-menu-item"
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenFirebaseSync();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
                >
                  <Cloud size={15} className="text-[#1A73E8]" />
                  <span>Cloud Backup & Sync</span>
                </button>
              )}

              {onOpenPermissionsHub && (
                <button
                  id="btn-permissions-hub-menu-item"
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenPermissionsHub();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
                >
                  <ShieldCheck size={15} className="text-[#1A73E8]" />
                  <span>Runtime Permissions Hub (4-Step)</span>
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#202124] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
                >
                  <Mail size={15} className="text-[#1A73E8]" />
                  <span>Export / Email Backup</span>
                </button>
              )}
            </div>

            {/* Confirmation Dialog for Delete Account */}
            {showDeleteConfirm ? (
              <div className="p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="text-[#DC2626] shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-[#991B1B]">Permanently Delete Account?</h4>
                    <p className="text-[11px] text-[#B91C1C] mt-0.5 leading-relaxed">
                      Are you sure you want to permanently delete this account? All associated expenses, incomes, and custom budget settings will be completely erased.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    id="btn-cancel-delete-account"
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold text-[#4B5563] bg-white border border-[#D1D5DB] rounded-xl hover:bg-[#F3F4F6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-delete-account"
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="flex-1 py-1.5 px-3 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete Permanently"}
                  </button>
                </div>
              </div>
            ) : (
              /* Action Buttons: Log Out & Delete Profile */
              <div className="pt-2 border-t border-[#F1F3F4] space-y-2">
                {/* 1. Log Out Button */}
                <button
                  id="btn-logout-khata"
                  type="button"
                  onClick={() => {
                    handleClose();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <LogOut size={16} />
                  <span>Log Out of Session</span>
                </button>

                {/* 2. Delete Profile / Account Button */}
                <button
                  id="btn-delete-profile-khata"
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-[#DC2626] bg-white hover:bg-[#FEE2E2]/60 border border-[#FCA5A5] rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>Delete Profile / Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
