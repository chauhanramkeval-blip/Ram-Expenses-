import * as XLSX from "xlsx";
import { Expense, Income, UserAccount } from "../types";

export interface ExportRecord {
  id: string;
  date: string;
  time: string;
  type: "Expense" | "Income";
  category: string;
  title: string;
  paymentMethod: string;
  amount: number;
  merchantOrSource: string;
  notes: string;
}

/**
 * Accurately extracts time string from transaction
 */
function extractTime(item: { time?: string; date?: string; syncedAt?: string }): string {
  if (item.time && item.time.trim()) {
    // If it's already HH:mm or HH:mm:ss or 12h format
    const t = item.time.trim();
    if (/^\d{1,2}:\d{2}/.test(t)) {
      return t;
    }
  }

  // Try extracting from ISO date if present
  if (item.date && item.date.includes("T")) {
    try {
      const d = new Date(item.date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
      }
    } catch {
      // ignore
    }
  }

  if (item.syncedAt) {
    try {
      const d = new Date(item.syncedAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
      }
    } catch {
      // ignore
    }
  }

  return "12:00 PM";
}

/**
 * Formats a transaction or expense item into standard export record
 */
export function formatExpenseForExport(exp: Expense): ExportRecord {
  const timeStr = extractTime(exp);
  const dateOnly = exp.date ? exp.date.split("T")[0] : new Date().toISOString().split("T")[0];

  return {
    id: exp.id || "",
    date: dateOnly,
    time: timeStr,
    type: "Expense",
    category: exp.category || "General",
    title: exp.title || exp.merchantOrLocation || "Expense",
    paymentMethod: exp.paymentMode || "UPI",
    amount: Number(exp.amount) || 0,
    merchantOrSource: exp.merchantOrLocation || "",
    notes: exp.notes || "",
  };
}

/**
 * Formats an income item into standard export record
 */
export function formatIncomeForExport(inc: Income): ExportRecord {
  const timeStr = extractTime(inc);
  const dateOnly = inc.date ? inc.date.split("T")[0] : new Date().toISOString().split("T")[0];

  return {
    id: inc.id || "",
    date: dateOnly,
    time: timeStr,
    type: "Income",
    category: inc.category || "Salary & Wages",
    title: inc.title || inc.sourceOrClient || "Income",
    paymentMethod: inc.paymentMode || "Bank Transfer",
    amount: Number(inc.amount) || 0,
    merchantOrSource: inc.sourceOrClient || "",
    notes: inc.notes || "",
  };
}

/**
 * Sanitizes cell value to prevent Excel formula injection (=, +, -, @)
 */
function sanitizeFormulaInjection(value: any): any {
  if (typeof value === "string") {
    if (value.startsWith("=") || value.startsWith("+") || value.startsWith("-") || value.startsWith("@")) {
      return `'${value}`;
    }
  }
  return value;
}

/**
 * Escapes a cell value for standard RFC 4180 CSV formatting
 */
function escapeCSVCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  let str = String(value);
  // Protect against formula injection in CSV
  if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export interface ExportOptions {
  expenses?: Expense[];
  incomes?: Income[];
  user?: UserAccount | null;
  filterScopeName?: string;
  segment?: "expenses" | "income" | "all";
  format?: "xlsx" | "csv";
}

/**
 * Generates and triggers download of authentic native Excel (.xlsx) or CSV file.
 * Creates structured multi-tab worksheets for Excel with auto-sized columns,
 * summary calculations, and proper numeric formatting.
 */
export function exportTransactionsToExcel({
  expenses = [],
  incomes = [],
  user,
  filterScopeName,
  segment = "all",
  format = "xlsx",
}: ExportOptions): { success: boolean; filename: string; count: number } {
  const expenseRecords: ExportRecord[] = [];
  const incomeRecords: ExportRecord[] = [];

  if (segment === "expenses" || segment === "all") {
    expenses.forEach((e) => expenseRecords.push(formatExpenseForExport(e)));
  }

  if (segment === "income" || segment === "all") {
    incomes.forEach((i) => incomeRecords.push(formatIncomeForExport(i)));
  }

  const allRecords = [...expenseRecords, ...incomeRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalCount = allRecords.length;
  const rawUserName = user?.name?.trim() || "User";
  const sanitizedUserName = rawUserName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "") || "Khata_User";
  const currentDateStr = new Date().toISOString().split("T")[0];

  // If CSV format is explicitly requested
  if (format === "csv") {
    const csvHeaders = [
      "Date",
      "Time",
      "Type",
      "Category",
      "Title/Description",
      "Payment Mode",
      "Amount (INR)",
      "Merchant / Source",
      "Notes",
    ];

    const csvRows: string[] = [csvHeaders.map((h) => `"${h}"`).join(",")];

    for (const rec of allRecords) {
      const row = [
        escapeCSVCell(rec.date),
        escapeCSVCell(rec.time),
        escapeCSVCell(rec.type),
        escapeCSVCell(rec.category),
        escapeCSVCell(rec.title),
        escapeCSVCell(rec.paymentMethod),
        rec.amount,
        escapeCSVCell(rec.merchantOrSource),
        escapeCSVCell(rec.notes),
      ];
      csvRows.push(row.join(","));
    }

    // Totals row
    const totalSpent = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalEarned = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
    const netBalance = totalEarned - totalSpent;

    csvRows.push("");
    csvRows.push(
      [
        `"TOTAL SUMMARY"`,
        `""`,
        `""`,
        `""`,
        `"Total Spends: INR ${totalSpent} | Total Income: INR ${totalEarned} | Net Balance: INR ${netBalance}"`,
        `"Records: ${totalCount}"`,
        netBalance,
        `"Khata Daily Expense Tracker"`,
        `""`,
      ].join(",")
    );

    const csvContent = "\uFEFF" + csvRows.join("\r\n");
    const filename = `Khata_${segment === "expenses" ? "Expenses" : segment === "income" ? "Income" : "Statement"}_${sanitizedUserName}_${currentDateStr}.csv`;

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
      count: totalCount,
    };
  }

  // Standard / Default: Native Microsoft Excel (.xlsx) Workbook with multiple worksheets
  const wb = XLSX.utils.book_new();

  // 1. "All Transactions" Sheet
  const allTxData = allRecords.map((r, idx) => ({
    "Sl. No": idx + 1,
    "Date": r.date,
    "Time": r.time,
    "Type": r.type,
    "Title / Description": sanitizeFormulaInjection(r.title),
    "Category": sanitizeFormulaInjection(r.category),
    "Payment Mode": sanitizeFormulaInjection(r.paymentMethod),
    "Expense Amount (INR)": r.type === "Expense" ? r.amount : 0,
    "Income Amount (INR)": r.type === "Income" ? r.amount : 0,
    "Net Impact (INR)": r.type === "Income" ? r.amount : -r.amount,
    "Merchant / Client Source": sanitizeFormulaInjection(r.merchantOrSource),
    "Notes": sanitizeFormulaInjection(r.notes),
  }));

  const wsAll = XLSX.utils.json_to_sheet(allTxData);
  // Auto-size columns
  wsAll["!cols"] = [
    { wch: 8 },  // Sl. No
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 10 }, // Type
    { wch: 30 }, // Title
    { wch: 22 }, // Category
    { wch: 18 }, // Payment Mode
    { wch: 20 }, // Expense Amount
    { wch: 20 }, // Income Amount
    { wch: 16 }, // Net Impact
    { wch: 26 }, // Merchant
    { wch: 30 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, wsAll, "All Transactions");

  // 2. "Expenses" Sheet (if expenses exist)
  if (expenseRecords.length > 0) {
    const expenseData = expenseRecords.map((e, idx) => ({
      "Sl. No": idx + 1,
      "Date": e.date,
      "Time": e.time,
      "Expense Item": sanitizeFormulaInjection(e.title),
      "Category": sanitizeFormulaInjection(e.category),
      "Payment Mode": sanitizeFormulaInjection(e.paymentMethod),
      "Amount (INR)": e.amount,
      "Merchant / Location": sanitizeFormulaInjection(e.merchantOrSource),
      "Notes": sanitizeFormulaInjection(e.notes),
    }));

    const wsExpenses = XLSX.utils.json_to_sheet(expenseData);
    wsExpenses["!cols"] = [
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 30 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 26 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses Only");
  }

  // 3. "Income" Sheet (if incomes exist)
  if (incomeRecords.length > 0) {
    const incomeData = incomeRecords.map((i, idx) => ({
      "Sl. No": idx + 1,
      "Date": i.date,
      "Time": i.time,
      "Income Title": sanitizeFormulaInjection(i.title),
      "Category": sanitizeFormulaInjection(i.category),
      "Deposit Mode": sanitizeFormulaInjection(i.paymentMethod),
      "Amount (INR)": i.amount,
      "Employer / Client Source": sanitizeFormulaInjection(i.merchantOrSource),
      "Notes": sanitizeFormulaInjection(i.notes),
    }));

    const wsIncomes = XLSX.utils.json_to_sheet(incomeData);
    wsIncomes["!cols"] = [
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 30 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 26 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsIncomes, "Income Only");
  }

  // 4. "Category Summary" Sheet
  const categorySpendMap: Record<string, { total: number; count: number }> = {};
  expenseRecords.forEach((e) => {
    const cat = e.category || "Other Spends";
    if (!categorySpendMap[cat]) categorySpendMap[cat] = { total: 0, count: 0 };
    categorySpendMap[cat].total += e.amount;
    categorySpendMap[cat].count += 1;
  });

  const categoryIncomeMap: Record<string, { total: number; count: number }> = {};
  incomeRecords.forEach((i) => {
    const cat = i.category || "Other Income";
    if (!categoryIncomeMap[cat]) categoryIncomeMap[cat] = { total: 0, count: 0 };
    categoryIncomeMap[cat].total += i.amount;
    categoryIncomeMap[cat].count += 1;
  });

  const summaryData: any[] = [];
  summaryData.push({
    "Summary Section": "=== EXPENSE CATEGORY BREAKDOWN ===",
    "Category Name": "",
    "Transaction Count": "",
    "Total Amount (INR)": "",
  });

  Object.entries(categorySpendMap)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, stats]) => {
      summaryData.push({
        "Summary Section": "Expense",
        "Category Name": cat,
        "Transaction Count": stats.count,
        "Total Amount (INR)": stats.total,
      });
    });

  summaryData.push({
    "Summary Section": "=== INCOME CATEGORY BREAKDOWN ===",
    "Category Name": "",
    "Transaction Count": "",
    "Total Amount (INR)": "",
  });

  Object.entries(categoryIncomeMap)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, stats]) => {
      summaryData.push({
        "Summary Section": "Income",
        "Category Name": cat,
        "Transaction Count": stats.count,
        "Total Amount (INR)": stats.total,
      });
    });

  const totalSpent = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalEarned = incomeRecords.reduce((sum, r) => sum + r.amount, 0);

  summaryData.push({
    "Summary Section": "=== GRAND TOTALS ===",
    "Category Name": "",
    "Transaction Count": "",
    "Total Amount (INR)": "",
  });
  summaryData.push({
    "Summary Section": "Total Income",
    "Category Name": "All Sources",
    "Transaction Count": incomeRecords.length,
    "Total Amount (INR)": totalEarned,
  });
  summaryData.push({
    "Summary Section": "Total Expenses",
    "Category Name": "All Categories",
    "Transaction Count": expenseRecords.length,
    "Total Amount (INR)": totalSpent,
  });
  summaryData.push({
    "Summary Section": "Net Savings / Balance",
    "Category Name": "Net Balance",
    "Transaction Count": totalCount,
    "Total Amount (INR)": totalEarned - totalSpent,
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary["!cols"] = [
    { wch: 32 },
    { wch: 26 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Category Summary");

  // Output filename
  const filename = `Khata_${segment === "expenses" ? "Expenses" : segment === "income" ? "Income" : "Financial_Statement"}_${sanitizedUserName}_${currentDateStr}.xlsx`;

  // Write file buffer and trigger download in browser
  XLSX.writeFile(wb, filename);

  return {
    success: true,
    filename,
    count: totalCount,
  };
}
