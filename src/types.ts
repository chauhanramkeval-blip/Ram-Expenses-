export type StandardExpenseCategory =
  | "Chai & Street Food"
  | "Kirana & Groceries"
  | "Commute & Auto/Metro"
  | "Food Delivery & Dining"
  | "Bills & Mobile Recharge"
  | "Rent & Home Maintenance"
  | "Shopping & E-commerce"
  | "Investments & SIP"
  | "Healthcare & Medicine"
  | "Entertainment & OTT"
  | "Education & Learning"
  | "Family, Gifts & Puja"
  | "Other Spends";

export type ExpenseCategory = StandardExpenseCategory | (string & {});

export type StandardIncomeCategory =
  | "Salary & Bonus"
  | "Freelance & Consulting"
  | "Business & Trading"
  | "Investments & Dividends"
  | "Rental & Property"
  | "Gifts & Cashback"
  | "Interest & FD"
  | "Other Income";

export type IncomeCategory = StandardIncomeCategory | (string & {});

export type PaymentMode =
  | "UPI"
  | "Cash"
  | "Debit / Credit Card"
  | "Net Banking"
  | "Bank Transfer"
  | "Cheque"
  | "Wallet";

export type IncomeStreamType = "salary_bonus" | "extra_income";

export interface Expense {
  id: string;
  userId?: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  notes?: string;
  merchantOrLocation?: string;
  isRecurring?: boolean;
  syncedAt?: string;
}

export interface Income {
  id: string;
  userId?: string;
  title: string;
  amount: number;
  category: IncomeCategory;
  streamType?: IncomeStreamType;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD
  time?: string;
  notes?: string;
  sourceOrClient?: string;
  isRecurring?: boolean;
  syncedAt?: string;
}

export interface CategoryMeta {
  id: ExpenseCategory;
  name: string;
  iconName: string;
  color: string; // Google Material color
  bgColor: string;
  borderColor: string;
  description: string;
  defaultQuickAmounts: number[];
  isCustom?: boolean;
}

export interface IncomeCategoryMeta {
  id: IncomeCategory;
  name: string;
  iconName: string;
  streamType: IncomeStreamType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  defaultQuickAmounts: number[];
  isCustom?: boolean;
}

export interface DailyAdviceData {
  title: string;
  punchline: string;
  detailedAdvice: string;
  actionableStep: string;
  potentialSavingsInRupees: string;
  categoryTag: string;
}

export interface SpendingAnalysisData {
  overallHealthScore: number;
  healthGrade: "Excellent" | "Good" | "Needs Attention" | "Critical";
  topSpendingCategory: string;
  topSpendingInsight: string;
  spendingLeaks: string[];
  smartIndianTips: string[];
  monthlyProjection: string;
  summaryVerdict: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface UserBudget {
  monthlyBudget: number;
  monthlyIncome?: number;
  targetSavingsPercent: number;
  currency: string;
  salaryDay: number;
}

export interface AppSecuritySettings {
  isEnabled: boolean;
  pinCode: string; // 4-digit PIN
  isBiometricEnabled: boolean;
  autoLockMinutes: number; // 0 = immediately, 1, 5, 15, 30
  securityQuestion?: string;
  securityAnswer?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  upiId?: string;
  avatarColor?: string;
  accountType?: "Personal" | "Business / Shop" | "Household & Family";
  joinedDate: string;
  lastLogin?: string;
  authProvider?: "google" | "email" | "phone" | "pin";
  pin?: string; // 4-digit PIN for quick profile switch & lock (e.g. "1234")
  password?: string; // Password (e.g. "khata123")
  securityQuestion?: string;
  securityAnswer?: string;
}

// ==========================================
// 4-STEP RUNTIME PERMISSION ARCHITECTURE TYPES
// ==========================================

export type PermissionType =
  | "camera"
  | "microphone"
  | "geolocation"
  | "notifications"
  | "media"
  | "storage"
  | "sms"
  | "call_logs";

export type PermissionStateStatus = "granted" | "denied" | "prompt" | "unsupported";

export type PermissionStepStage = "declare" | "check" | "request" | "handle_result";

export interface PermissionDeclaration {
  type: PermissionType;
  name: string;
  title: string;
  shortLabel: string;
  category:
    | "Hardware & Media"
    | "Location & Spatial"
    | "System Alerts"
    | "Storage & Files"
    | "Communications & SMS";
  iconName: string;
  osPromptReason: string;
  description: string;
  benefits: string[];
  rationale: string;
  fallbackAction: string;
  fallbackLabel: string;
  manifestDeclared: boolean;
  framePermissionRequired: boolean;
}

export interface PermissionStatusInfo {
  type: PermissionType;
  status: PermissionStateStatus;
  lastChecked: string;
  canRequest: boolean;
  errorMessage?: string;
}

export interface PermissionFlowState {
  isOpen: boolean;
  stage: PermissionStepStage;
  permissionType: PermissionType | null;
  status: PermissionStateStatus;
  rationaleTitle?: string;
  rationaleMessage?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

// Bank Transaction SMS Entry Interface (HDFC, SBI, ICICI, Axis, Paytm, GPay, etc.)
export interface BankSmsTransaction {
  id: string;
  sender: string; // e.g. "HDFCBK", "SBIINB", "ICICIB", "AXISBK", "PAYTM"
  bankName: string; // e.g. "HDFC Bank", "State Bank of India"
  accountOrCard: string; // e.g. "A/c **4589" or "Card **1023"
  amount: number;
  type: "debit" | "credit";
  merchantOrPayee: string; // e.g. "Swiggy", "Blinkit", "Zomato", "Indian Oil", "Rohan Verma"
  rawText: string;
  timestamp: string;
  category: string;
  paymentMode: "UPI" | "Debit / Credit Card" | "Net Banking" | "Cash";
  imported?: boolean;
}

// Call / Contacts Log Interface for Expense Reconciliation & Split Khata
export interface CallLogContact {
  id: string;
  name: string;
  phone: string;
  callType?: "incoming" | "outgoing" | "missed";
  duration?: string;
  timestamp: string;
  suggestedAction?: "log_payment" | "split_expense" | "request_upi";
  upiId?: string;
  recentTransactionsCount?: number;
}

// Storage Quota & Media File Info
export interface StorageQuotaInfo {
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
  isPersisted: boolean;
  receiptImagesCount: number;
  totalLedgerRecords: number;
}

// User Address Schema
export interface UserAddress {
  id: string;
  userId: string;
  tag: "Home" | "Work" | "Shop / Business" | "Branch" | "Other";
  fullAddress: string;
  streetOrArea: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Call History Sync Record
export interface CallHistoryRecord {
  id: string;
  userId: string;
  contactName: string;
  phoneNumberMasked: string;
  phoneNumberHash: string;
  callType: "incoming" | "outgoing" | "missed" | "rejected";
  callDurationSeconds: number;
  timestamp: string;
  associatedKhataAmount?: number;
  reconciledWithExpenseId?: string;
  notes?: string;
  syncedAt: string;
}

// Permission State & Audit Sync Record
export interface PermissionAuditRecord {
  id: string;
  userId: string;
  platform: "android" | "web" | "ios";
  deviceModel?: string;
  osVersion?: string;
  permissions: Record<
    PermissionType,
    {
      status: PermissionStateStatus;
      grantedAt?: string;
      revokedAt?: string;
      lastRequestedAt?: string;
      reasonShown?: string;
    }
  >;
  updatedAt: string;
}

// Media Record (Receipts, Bill Photos, Invoices)
export interface MediaRecord {
  id: string;
  userId: string;
  expenseId?: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storagePath?: string;
  thumbnailDataUrl?: string;
  ocrExtractedAmount?: number;
  ocrExtractedMerchant?: string;
  ocrExtractedDate?: string;
  uploadedAt: string;
}



