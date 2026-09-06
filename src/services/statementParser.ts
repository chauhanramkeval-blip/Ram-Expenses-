import { Expense, Income, PaymentMode } from "../types";

export interface ParsedStatementTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  payment_mode: string;
  isDuplicate?: boolean;
  duplicateReason?: string;
  selected?: boolean;
}

export interface ParseStatementResult {
  success: boolean;
  fileName: string;
  totalExtracted: number;
  transactions: ParsedStatementTransaction[];
  incomesCount: number;
  expensesCount: number;
  incomesTotal: number;
  expensesTotal: number;
  error?: string;
  notice?: string;
}

/**
 * Checks if a parsed transaction already exists in the user's ledger
 */
export function checkDuplicate(
  tx: ParsedStatementTransaction,
  existingExpenses: Expense[],
  existingIncomes: Income[]
): { isDuplicate: boolean; reason?: string } {
  const txDate = tx.date;
  const txAmount = Math.round(tx.amount * 100) / 100;
  const txCleanDesc = (tx.description || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  if (tx.type === "EXPENSE") {
    const matched = existingExpenses.find((e) => {
      const expDate = (e.date || "").split("T")[0];
      const expAmount = Math.round((e.amount || 0) * 100) / 100;
      const expCleanTitle = (e.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const expCleanNotes = (e.notes || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const dateMatch = expDate === txDate;
      const amountMatch = Math.abs(expAmount - txAmount) < 0.01;
      const textMatch =
        expCleanTitle.includes(txCleanDesc) ||
        txCleanDesc.includes(expCleanTitle) ||
        expCleanNotes.includes(txCleanDesc);

      return dateMatch && amountMatch && (textMatch || txCleanDesc.length < 4);
    });

    if (matched) {
      return {
        isDuplicate: true,
        reason: `Matched existing expense: ₹${matched.amount} on ${matched.date} ("${matched.title}")`,
      };
    }
  } else {
    const matched = existingIncomes.find((i) => {
      const incDate = (i.date || "").split("T")[0];
      const incAmount = Math.round((i.amount || 0) * 100) / 100;
      const incCleanTitle = (i.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const incCleanSource = (i.sourceOrClient || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const dateMatch = incDate === txDate;
      const amountMatch = Math.abs(incAmount - txAmount) < 0.01;
      const textMatch =
        incCleanTitle.includes(txCleanDesc) ||
        txCleanDesc.includes(incCleanTitle) ||
        incCleanSource.includes(txCleanDesc);

      return dateMatch && amountMatch && (textMatch || txCleanDesc.length < 4);
    });

    if (matched) {
      return {
        isDuplicate: true,
        reason: `Matched existing income: ₹${matched.amount} on ${matched.date} ("${matched.title}")`,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Sends bank statement file (PDF, CSV, Image) to server Gemini AI route
 */
export async function parseBankStatement(
  file: File,
  existingExpenses: Expense[] = [],
  existingIncomes: Income[] = [],
  userId?: string
): Promise<ParseStatementResult> {
  const fileName = file.name;
  const isCsv = fileName.toLowerCase().endsWith(".csv") || file.type === "text/csv";

  let fileBase64 = "";
  let csvText = "";

  if (isCsv) {
    csvText = await file.text();
  } else {
    fileBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  const response = await fetch("/api/gemini/parse-statement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      mimeType: file.type || (isCsv ? "text/csv" : "application/pdf"),
      fileBase64,
      csvText,
      userId,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Server returned error ${response.status}: ${errText}`);
  }

  const result: ParseStatementResult = await response.json();

  // Attach duplicate detection flags and selection defaults
  if (Array.isArray(result.transactions)) {
    result.transactions = result.transactions.map((tx) => {
      const dup = checkDuplicate(tx, existingExpenses, existingIncomes);
      return {
        ...tx,
        isDuplicate: dup.isDuplicate,
        duplicateReason: dup.reason,
        selected: !dup.isDuplicate, // Selected by default only if not a duplicate
      };
    });
  }

  return result;
}

/**
 * Normalizes payment mode to app standard type
 */
export function normalizePaymentMode(modeStr: string): PaymentMode {
  const lower = (modeStr || "").toLowerCase();
  if (lower.includes("upi") || lower.includes("gpay") || lower.includes("phonepe") || lower.includes("paytm")) {
    return "UPI";
  }
  if (lower.includes("card") || lower.includes("pos") || lower.includes("debit") || lower.includes("credit")) {
    return "Debit / Credit Card";
  }
  if (lower.includes("net") || lower.includes("neft") || lower.includes("rtgs") || lower.includes("imps")) {
    return "Net Banking";
  }
  if (lower.includes("cash")) {
    return "Cash";
  }
  if (lower.includes("cheque") || lower.includes("chk")) {
    return "Cheque";
  }
  if (lower.includes("wallet")) {
    return "Wallet";
  }
  return "Bank Transfer";
}

/**
 * Converts approved parsed transactions to app Expense & Income objects
 */
export function convertParsedToLedger(
  approvedTransactions: ParsedStatementTransaction[],
  userId?: string
): { expenses: Expense[]; incomes: Income[] } {
  const newExpenses: Expense[] = [];
  const newIncomes: Income[] = [];

  for (const item of approvedTransactions) {
    const timestamp = Date.now();
    const uniqueId = `stmt_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
    const paymentMode = normalizePaymentMode(item.payment_mode);

    if (item.type === "INCOME") {
      newIncomes.push({
        id: uniqueId,
        userId: userId || "user",
        title: item.description || "Statement Inflow",
        amount: Math.abs(Number(item.amount)),
        category: item.category || "Salary & Bonus",
        paymentMode,
        date: item.date,
        time: "12:00 PM",
        sourceOrClient: item.description,
        notes: `Imported via Bank Statement AI (${item.payment_mode || "Bank"})`,
        streamType: item.category?.toLowerCase().includes("salary") ? "salary_bonus" : "extra_income",
        syncedAt: new Date().toISOString(),
      });
    } else {
      newExpenses.push({
        id: uniqueId,
        userId: userId || "user",
        title: item.description || "Statement Outflow",
        amount: Math.abs(Number(item.amount)),
        category: item.category || "Other Spends",
        paymentMode,
        date: item.date,
        time: "12:00 PM",
        merchantOrLocation: item.description,
        notes: `Imported via Bank Statement AI (${item.payment_mode || "Bank"})`,
        syncedAt: new Date().toISOString(),
      });
    }
  }

  return { expenses: newExpenses, incomes: newIncomes };
}
