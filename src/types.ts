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
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  notes?: string;
  merchantOrLocation?: string;
  isRecurring?: boolean;
}

export interface Income {
  id: string;
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
}

