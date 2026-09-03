import { Expense, Income, UserAccount } from "../types";

export interface ExportRecord {
  date: string;
  time: string;
  type: "Expense" | "Income";
  category: string;
  title: string;
  paymentMethod: string;
  amount: number;
  notes: string;
}

/**
 * Formats a transaction or expense item into standard Excel export record
 */
export function formatExpenseForExport(exp: Expense): ExportRecord {
  // Extract or derive time
  let timeStr = "12:00 PM";
  if (exp.date && exp.date.includes("T")) {
    try {
      const d = new Date(exp.date);
      if (!isNaN(d.getTime())) {
        timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      }
    } catch {
      timeStr = "12:00 PM";
    }
  } else if (exp.syncedAt) {
    try {
      const d = new Date(exp.syncedAt);
      if (!isNaN(d.getTime())) {
        timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      }
    } catch {
      timeStr = "12:00 PM";
    }
  }

  // Format date to YYYY-MM-DD
  let dateOnly = exp.date ? exp.date.split("T")[0] : new Date().toISOString().split("T")[0];

  return {
    date: dateOnly,
    time: timeStr,
    type: "Expense",
    category: exp.category || "General",
    title: exp.title || exp.merchantOrLocation || "Expense",
    paymentMethod: exp.paymentMode || "UPI",
    amount: exp.amount || 0,
    notes: [exp.merchantOrLocation ? `Merchant: ${exp.merchantOrLocation}` : "", exp.notes || ""]
      .filter(Boolean)
      .join(" | "),
  };
}

/**
 * Formats an income item into standard Excel export record
 */
export function formatIncomeForExport(inc: Income): ExportRecord {
  let timeStr = inc.time || "12:00 PM";
  if (inc.date && inc.date.includes("T")) {
    try {
      const d = new Date(inc.date);
      if (!isNaN(d.getTime())) {
        timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      }
    } catch {
      timeStr = inc.time || "12:00 PM";
    }
  } else if (inc.syncedAt) {
    try {
      const d = new Date(inc.syncedAt);
      if (!isNaN(d.getTime())) {
        timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      }
    } catch {
      timeStr = inc.time || "12:00 PM";
    }
  }

  let dateOnly = inc.date ? inc.date.split("T")[0] : new Date().toISOString().split("T")[0];

  return {
    date: dateOnly,
    time: timeStr,
    type: "Income",
    category: inc.category || "Salary & Wages",
    title: inc.title || inc.sourceOrClient || "Income",
    paymentMethod: inc.paymentMode || "Bank Transfer",
    amount: inc.amount || 0,
    notes: [inc.sourceOrClient ? `Source: ${inc.sourceOrClient}` : "", inc.notes || ""]
      .filter(Boolean)
      .join(" | "),
  };
}

/**
 * Escapes a cell value for CSV formatting
 */
function escapeCSVCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates and triggers download of Excel-compatible CSV file with UTF-8 BOM
 */
export function exportTransactionsToExcel({
  expenses = [],
  incomes = [],
  user,
  filterScopeName,
  segment = "all",
}: {
  expenses?: Expense[];
  incomes?: Income[];
  user?: UserAccount | null;
  filterScopeName?: string;
  segment?: "expenses" | "income" | "all";
}): { success: boolean; filename: string; count: number } {
  const records: ExportRecord[] = [];

  if (segment === "expenses" || segment === "all") {
    expenses.forEach((e) => records.push(formatExpenseForExport(e)));
  }

  if (segment === "income" || segment === "all") {
    incomes.forEach((i) => records.push(formatIncomeForExport(i)));
  }

  // Sort records by date descending
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Define headers exactly matching user prompt:
  // Date | Time | Type (Expense/Income) | Category | Title/Description | Payment Method | Amount (₹) | Notes
  const headers = [
    "Date",
    "Time",
    "Type (Expense/Income)",
    "Category",
    "Title/Description",
    "Payment Method",
    "Amount (₹)",
    "Notes",
  ];

  const csvRows: string[] = [];
  csvRows.push(headers.map((h) => `"${h}"`).join(","));

  for (const rec of records) {
    const row = [
      escapeCSVCell(rec.date),
      escapeCSVCell(rec.time),
      escapeCSVCell(rec.type),
      escapeCSVCell(rec.category),
      escapeCSVCell(rec.title),
      escapeCSVCell(rec.paymentMethod),
      rec.amount, // Raw number for Excel calculations
      escapeCSVCell(rec.notes),
    ];
    csvRows.push(row.join(","));
  }

  // Append a summary row at the bottom
  const totalAmount = records.reduce((sum, r) => (r.type === "Expense" ? sum - r.amount : sum + r.amount), 0);
  const totalSpent = records.filter((r) => r.type === "Expense").reduce((sum, r) => sum + r.amount, 0);
  const totalEarned = records.filter((r) => r.type === "Income").reduce((sum, r) => sum + r.amount, 0);

  csvRows.push("");
  csvRows.push(
    [
      `"SUMMARY"`,
      `""`,
      `""`,
      `""`,
      `"Total Spends: ₹${totalSpent} | Total Income: ₹${totalEarned} | Net: ₹${totalAmount}"`,
      `"Total Count"`,
      records.length,
      `"Generated via Khata India Daily Expense Tracker"`,
    ].join(",")
  );

  // Use UTF-8 BOM (\uFEFF) so Excel, Google Sheets, and mobile apps open with clean encoding
  const csvContent = "\uFEFF" + csvRows.join("\r\n");

  // Determine user display name for file name format: Expenses_[UserName]_[CurrentDate].csv
  const rawUserName = user?.name?.trim() || "Your_Name";
  const sanitizedUserName = rawUserName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
  const currentDateStr = new Date().toISOString().split("T")[0];

  const filename = `Expenses_${sanitizedUserName || "User"}_${currentDateStr}.csv`;

  // Create blob and trigger instant download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filename,
    count: records.length,
  };
}
