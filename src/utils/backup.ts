import { Expense, Income, UserBudget, UserAccount, CategoryMeta, IncomeCategoryMeta } from "../types";
import { formatINR } from "./formatters";

export interface KhataFullBackupData {
  version: string;
  exportDate: string;
  app: string;
  user: UserAccount;
  budget: UserBudget;
  expenses: Expense[];
  incomes: Income[];
  customExpenseCategories?: CategoryMeta[];
  customIncomeCategories?: IncomeCategoryMeta[];
  stats: {
    totalExpensesCount: number;
    totalExpensesAmount: number;
    totalIncomesCount: number;
    totalIncomesAmount: number;
    netBalance: number;
  };
}

/**
 * Constructs the structured Khata backup data object
 */
export const createBackupObject = (
  expenses: Expense[],
  incomes: Income[],
  budget: UserBudget,
  user: UserAccount,
  customExpenseCategories?: CategoryMeta[],
  customIncomeCategories?: IncomeCategoryMeta[]
): KhataFullBackupData => {
  const totalExpensesAmount = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalIncomesAmount = incomes.reduce((acc, i) => acc + (i.amount || 0), 0);
  const netBalance = totalIncomesAmount - totalExpensesAmount;

  const now = new Date();
  const exportDate = now.toISOString();

  return {
    version: "1.0",
    exportDate,
    app: "Khata India - Smart Daily Expense & Finance Tracker",
    user,
    budget,
    expenses,
    incomes,
    customExpenseCategories,
    customIncomeCategories,
    stats: {
      totalExpensesCount: expenses.length,
      totalExpensesAmount,
      totalIncomesCount: incomes.length,
      totalIncomesAmount,
      netBalance,
    },
  };
};

/**
 * Formats a clean, readable text summary for Email body & Clipboard
 */
export const formatBackupSummaryText = (backup: KhataFullBackupData): string => {
  const dateObj = new Date(backup.exportDate);
  const formattedDate = dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate category totals
  const categoryTotals: Record<string, number> = {};
  backup.expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Payment modes breakdown
  const paymentTotals: Record<string, number> = {};
  backup.expenses.forEach((e) => {
    paymentTotals[e.paymentMode] = (paymentTotals[e.paymentMode] || 0) + e.amount;
  });

  // Recent 12 expenses
  const recentExpenses = [...backup.expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);

  const lines = [
    `=========================================`,
    `🇮🇳 KHATA INDIA - FINANCIAL DATA BACKUP`,
    `=========================================`,
    `Generated On: ${formattedDate} at ${formattedTime}`,
    `Account Name: ${backup.user.name}`,
    `Account Email: ${backup.user.email}`,
    `Ledger Type: ${backup.user.accountType || "Personal"}`,
    ...(backup.user.phone ? [`Mobile: ${backup.user.phone}`] : []),
    ...(backup.user.upiId ? [`UPI ID: ${backup.user.upiId}`] : []),
    ``,
    `-----------------------------------------`,
    `📊 OVERALL FINANCIAL SUMMARY`,
    `-----------------------------------------`,
    `• Total Expenses Logged: ${formatINR(backup.stats.totalExpensesAmount)} (${backup.stats.totalExpensesCount} items)`,
    `• Total Income Logged: ${formatINR(backup.stats.totalIncomesAmount)} (${backup.stats.totalIncomesCount} items)`,
    `• Net Khata Balance: ${formatINR(backup.stats.netBalance)}`,
    `• Monthly Spending Budget Limit: ${formatINR(backup.budget.monthlyBudget)}`,
    `• Target Savings: ${backup.budget.targetSavingsPercent || 20}%`,
    ``,
    `-----------------------------------------`,
    `🏷️ TOP EXPENSE CATEGORIES`,
    `-----------------------------------------`,
    ...sortedCategories.map(([cat, amt], idx) => {
      const pct = backup.stats.totalExpensesAmount > 0 
        ? Math.round((amt / backup.stats.totalExpensesAmount) * 100) 
        : 0;
      return `${idx + 1}. ${cat}: ${formatINR(amt)} (${pct}%)`;
    }),
    ``,
    `-----------------------------------------`,
    `💳 SPENDS BY PAYMENT MODE`,
    `-----------------------------------------`,
    ...Object.entries(paymentTotals).map(([mode, amt]) => `• ${mode}: ${formatINR(amt)}`),
    ``,
    `-----------------------------------------`,
    `📝 RECENT TRANSACTIONS (Sample)`,
    `-----------------------------------------`,
    ...recentExpenses.map(
      (e) => `• ${e.date} | ${e.category} - "${e.title}": ${formatINR(e.amount)} (${e.paymentMode})`
    ),
    ``,
    `=========================================`,
    `💾 BACKUP METADATA & RESTORE INFO`,
    `=========================================`,
    `Total Records: ${backup.expenses.length} Expenses, ${backup.incomes.length} Incomes`,
    `Backup Version: ${backup.version}`,
    `Note: You can also download the full JSON file to restore all entries anytime in Khata India.`,
    `=========================================`,
  ];

  return lines.join("\n");
};

/**
 * Triggers download of the full JSON backup file locally
 */
export const downloadJsonBackupFile = (backup: KhataFullBackupData) => {
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);

  const dateStr = new Date().toISOString().split("T")[0];
  const safeName = (backup.user.name || "khata")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_");

  link.setAttribute("download", `Khata_Backup_${safeName}_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Prepares and opens the default Email client with prefilled recipient, subject and summary body
 */
export const openEmailBackupClient = (
  backup: KhataFullBackupData,
  recipientEmail: string = "chauhanramkeval@gmail.com"
) => {
  const dateObj = new Date(backup.exportDate);
  const formattedDate = dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const subject = `App Backup - ${formattedDate}`;
  const bodyText = formatBackupSummaryText(backup);

  // Encode for mailto URI
  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(bodyText)}`;

  // Open email client via link
  const link = document.createElement("a");
  link.href = mailtoUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Validates and restores backup JSON data
 */
export const validateAndParseBackupJson = (
  jsonText: string
): { success: boolean; data?: KhataFullBackupData; error?: string } => {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Invalid JSON format." };
    }

    if (!Array.isArray(parsed.expenses)) {
      return { success: false, error: "Backup file is missing valid expenses data array." };
    }

    return {
      success: true,
      data: parsed as KhataFullBackupData,
    };
  } catch (err: any) {
    return { success: false, error: `Failed to parse backup JSON: ${err.message}` };
  }
};
