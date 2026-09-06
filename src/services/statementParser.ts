import { Expense, Income, PaymentMode } from "../types";
import { CATEGORY_LIST, INCOME_CATEGORY_LIST } from "../data/categories";

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
  fallbackUsed?: boolean;
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
 * Client-Side Smart Category Inferencer
 */
function inferCategoryAndMode(
  description: string,
  type: "INCOME" | "EXPENSE"
): { category: string; paymentMode: string } {
  const d = description.toLowerCase();

  // Infer payment mode
  let paymentMode = "UPI";
  if (d.includes("upi") || d.includes("gpay") || d.includes("phonepe") || d.includes("paytm") || d.includes("qr")) {
    paymentMode = "UPI";
  } else if (d.includes("card") || d.includes("pos") || d.includes("visa") || d.includes("mastercard") || d.includes("rupay")) {
    paymentMode = "Debit / Credit Card";
  } else if (d.includes("neft") || d.includes("rtgs") || d.includes("imps") || d.includes("netbanking") || d.includes("transfer")) {
    paymentMode = "Net Banking";
  } else if (d.includes("cash") || d.includes("atm") || d.includes("wdl")) {
    paymentMode = "Cash";
  } else if (d.includes("cheque") || d.includes("chq") || d.includes("clearing")) {
    paymentMode = "Cheque";
  }

  // Infer category
  if (type === "INCOME") {
    if (d.includes("salary") || d.includes("payroll") || d.includes("wages") || d.includes("corp") || d.includes("pvt ltd")) {
      return { category: "Salary & Bonus", paymentMode };
    }
    if (d.includes("interest") || d.includes("dividend") || d.includes("fd") || d.includes("rd") || d.includes("mutual fund")) {
      return { category: "Interest & Investments", paymentMode };
    }
    if (d.includes("consulting") || d.includes("freelance") || d.includes("client") || d.includes("retainer") || d.includes("upwork")) {
      return { category: "Freelance & Consulting", paymentMode };
    }
    if (d.includes("refund") || d.includes("cashback") || d.includes("reversal") || d.includes("reward")) {
      return { category: "Refunds & Cashbacks", paymentMode };
    }
    return { category: "Other Income", paymentMode };
  }

  // EXPENSE
  if (d.includes("swiggy") || d.includes("zomato") || d.includes("restaurant") || d.includes("cafe") || d.includes("chai") || d.includes("mcdonald") || d.includes("kfc") || d.includes("pizza") || d.includes("dhaba")) {
    return { category: "Food Delivery & Dining", paymentMode };
  }
  if (d.includes("blinkit") || d.includes("zepto") || d.includes("instamart") || d.includes("dmart") || d.includes("grocer") || d.includes("kirana") || d.includes("supermarket") || d.includes("bigbasket") || d.includes("nature basket")) {
    return { category: "Kirana & Groceries", paymentMode };
  }
  if (d.includes("uber") || d.includes("ola") || d.includes("rapido") || d.includes("metro") || d.includes("auto") || d.includes("fuel") || d.includes("petrol") || d.includes("diesel") || d.includes("indian oil") || d.includes("hpcl") || d.includes("bpcl") || d.includes("irctc")) {
    return { category: "Commute & Auto/Metro", paymentMode };
  }
  if (d.includes("bescom") || d.includes("tata power") || d.includes("airtel") || d.includes("jio") || d.includes("broadband") || d.includes("electricity") || d.includes("water") || d.includes("gas") || d.includes("recharge") || d.includes("billdesk")) {
    return { category: "Bills & Mobile Recharge", paymentMode };
  }
  if (d.includes("amazon") || d.includes("flipkart") || d.includes("myntra") || d.includes("ajio") || d.includes("tata cliq") || d.includes("nykaa") || d.includes("shopping") || d.includes("mall")) {
    return { category: "Shopping & E-commerce", paymentMode };
  }
  if (d.includes("rent") || d.includes("landlord") || d.includes("maintenance") || d.includes("housing")) {
    return { category: "House Rent & Maintenance", paymentMode };
  }
  if (d.includes("pharmacy") || d.includes("apollo") || d.includes("1mg") || d.includes("hospital") || d.includes("clinic") || d.includes("doctor") || d.includes("medical")) {
    return { category: "Health & Medicines", paymentMode };
  }
  if (d.includes("sip") || d.includes("zerodha") || d.includes("groww") || d.includes("kuvera") || d.includes("upstox") || d.includes("mutual fund") || d.includes("ppf") || d.includes("nps")) {
    return { category: "Investments & Gold", paymentMode };
  }
  if (d.includes("netflix") || d.includes("spotify") || d.includes("hotstar") || d.includes("prime") || d.includes("cinema") || d.includes("pvr") || d.includes("inox") || d.includes("bookmyshow")) {
    return { category: "Entertainment & OTT", paymentMode };
  }
  if (d.includes("school") || d.includes("college") || d.includes("fees") || d.includes("udemy") || d.includes("coursera") || d.includes("tuition")) {
    return { category: "Education & Courses", paymentMode };
  }

  return { category: "Other Spends", paymentMode };
}

/**
 * Client-Side PDF Text Extractor (Lightweight & Resilient)
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjs = await import("pdfjs-dist");

    // Configure worker source gracefully
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || "4.10.38"}/pdf.worker.min.mjs`;
    }

    const loadingTask = (pdfjs as any).getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = "";

    const maxPages = Math.min(pdf.numPages, 10); // Process up to 10 pages
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
      fullText += `\n--- Page ${pageNum} ---\n` + pageText;
    }

    if (fullText.trim().length > 20) {
      return fullText;
    }
  } catch (pdfErr) {
    console.warn("pdfjs-dist extraction notice:", pdfErr);
  }

  // Fallback: binary string stream reader for unencrypted standard text PDF streams
  try {
    const textData = await file.text();
    // Extract text in parentheses (Tj / TJ text operators)
    const matches = textData.match(/\(([^()]{2,100})\)\s*Tj/g);
    if (matches && matches.length > 5) {
      return matches.map((m) => m.replace(/^$$\s*|\s*$$ Tj$/g, "")).join(" ");
    }
  } catch (rawErr) {
    console.warn("Raw stream extract fallback error:", rawErr);
  }

  return "";
}

/**
 * Client-Side CSV & Tabular Text Parser for Indian Bank Formats
 */
export function parseCsvTransactions(csvContent: string): ParsedStatementTransaction[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Detect header index
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const lineLower = lines[i].toLowerCase();
    if (
      (lineLower.includes("date") || lineLower.includes("txn")) &&
      (lineLower.includes("narration") || lineLower.includes("description") || lineLower.includes("particular") || lineLower.includes("details") || lineLower.includes("remark"))
    ) {
      headerIndex = i;
      headers = parseCsvLine(lines[i]).map((h) => h.toLowerCase().trim());
      break;
    }
  }

  // If no header found, assume standard default column layout
  if (headerIndex === -1) {
    headerIndex = 0;
    headers = ["date", "narration", "ref", "withdrawal", "deposit", "balance"];
  }

  // Find column positions
  const dateCol = headers.findIndex((h) => h.includes("date") || h.includes("txn dt") || h.includes("value dt"));
  const descCol = headers.findIndex((h) => h.includes("narration") || h.includes("description") || h.includes("particular") || h.includes("detail") || h.includes("remark") || h.includes("name"));
  const debitCol = headers.findIndex((h) => h.includes("withdraw") || h.includes("debit") || h.includes("dr") || h.includes("outflow"));
  const creditCol = headers.findIndex((h) => h.includes("deposit") || h.includes("credit") || h.includes("cr") || h.includes("inflow"));
  const amountCol = headers.findIndex((h) => h === "amount" || h.includes("txn amount") || h.includes("total"));
  const typeCol = headers.findIndex((h) => h === "type" || h.includes("cr/dr") || h.includes("d/c") || h.includes("mode"));

  const transactions: ParsedStatementTransaction[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 2) continue;

    // Extract raw fields
    const rawDate = (dateCol >= 0 && row[dateCol]) ? row[dateCol] : "";
    const rawDesc = (descCol >= 0 && row[descCol]) ? row[descCol] : row[1] || "";
    const rawDebit = (debitCol >= 0 && row[debitCol]) ? cleanNumeric(row[debitCol]) : 0;
    const rawCredit = (creditCol >= 0 && row[creditCol]) ? cleanNumeric(row[creditCol]) : 0;
    const rawAmount = (amountCol >= 0 && row[amountCol]) ? cleanNumeric(row[amountCol]) : 0;
    const rawType = (typeCol >= 0 && row[typeCol]) ? row[typeCol].toUpperCase().trim() : "";

    let type: "INCOME" | "EXPENSE" = "EXPENSE";
    let amount = 0;

    if (rawCredit > 0 && rawDebit === 0) {
      type = "INCOME";
      amount = rawCredit;
    } else if (rawDebit > 0) {
      type = "EXPENSE";
      amount = rawDebit;
    } else if (rawAmount > 0) {
      amount = rawAmount;
      if (rawType.includes("CR") || rawType.includes("CREDIT") || rawType.includes("DEP") || rawType.includes("INC")) {
        type = "INCOME";
      } else {
        type = "EXPENSE";
      }
    } else {
      // Check description keywords if positive or negative
      const descLower = rawDesc.toLowerCase();
      if (descLower.includes("cr ") || descLower.includes("credited") || descLower.includes("deposit") || descLower.includes("salary")) {
        type = "INCOME";
      }
    }

    if (amount <= 0 && rawDebit === 0 && rawCredit === 0 && rawAmount === 0) {
      continue;
    }

    const date = normalizeDate(rawDate, todayStr);
    const cleanDesc = rawDesc.replace(/\s+/g, " ").trim() || "Bank Transaction";
    const { category, paymentMode } = inferCategoryAndMode(cleanDesc, type);

    transactions.push({
      id: `stmt_csv_${i}_${Date.now()}`,
      date,
      description: cleanDesc,
      type,
      amount: Math.round(amount * 100) / 100,
      category,
      payment_mode: paymentMode,
    });
  }

  return transactions;
}

/**
 * Parses free-text statement content (e.g. extracted from PDF text)
 */
export function parseRawTextStatement(text: string): ParsedStatementTransaction[] {
  const transactions: ParsedStatementTransaction[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 5);
  const todayStr = new Date().toISOString().split("T")[0];

  // Regex pattern matching Indian bank statement lines:
  // e.g. "01/09/2026 UPI-SWIGGY-12345 450.00 DR 12450.00"
  // or "2026-09-02 SALARY CREDIT 85000.00 CR"
  const dateRegex = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}-\d{2}-\d{2})/;
  const amountRegex = /([\d,]+\.\d{2}|\b\d{2,8}\b)/g;

  let index = 0;
  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) continue;

    const amounts = line.match(amountRegex);
    if (!amounts || amounts.length === 0) continue;

    const parsedDate = normalizeDate(dateMatch[1], todayStr);
    const lineUpper = line.toUpperCase();

    // Determine Credit vs Debit
    const isCredit =
      lineUpper.includes(" CR") ||
      lineUpper.includes("CREDIT") ||
      lineUpper.includes("DEPOSIT") ||
      lineUpper.includes("SALARY") ||
      lineUpper.includes("REFUND") ||
      lineUpper.includes("INWARD");

    const isDebit =
      lineUpper.includes(" DR") ||
      lineUpper.includes("DEBIT") ||
      lineUpper.includes("WITHDRAWAL") ||
      lineUpper.includes("PAID") ||
      lineUpper.includes("OUTWARD");

    const type: "INCOME" | "EXPENSE" = isCredit && !isDebit ? "INCOME" : "EXPENSE";

    // Select primary transaction amount (not closing balance)
    let amount = 0;
    const cleanNumbers = amounts.map((a) => cleanNumeric(a)).filter((n) => n > 0 && n < 10000000);
    if (cleanNumbers.length > 0) {
      amount = cleanNumbers[0];
    }

    if (amount <= 0) continue;

    // Clean narration
    let desc = line
      .replace(dateRegex, "")
      .replace(amountRegex, "")
      .replace(/\b(CR|DR|UPI|NEFT|IMPS|RTGS|TRANSFER|DEPOSIT|WITHDRAWAL)\b/gi, "")
      .replace(/[\s\-_/|:,]+/g, " ")
      .trim();

    if (!desc || desc.length < 2) {
      desc = type === "INCOME" ? "Direct Credit" : "Bank Debit";
    }

    const { category, paymentMode } = inferCategoryAndMode(desc, type);

    transactions.push({
      id: `stmt_txt_${index++}_${Date.now()}`,
      date: parsedDate,
      description: desc,
      type,
      amount: Math.round(amount * 100) / 100,
      category,
      payment_mode: paymentMode,
    });
  }

  return transactions;
}

// Helpers
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((r) => r.replace(/^"+|"+$/g, "").trim());
}

function cleanNumeric(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : Math.abs(val);
  const str = String(val || "").replace(/[^\d.]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
}

function normalizeDate(rawDate: string, defaultDate: string): string {
  if (!rawDate) return defaultDate;
  const clean = rawDate.trim();

  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Parse generic date
  const parsed = new Date(clean);
  return !isNaN(parsed.getTime()) ? parsed.toISOString().split("T")[0] : defaultDate;
}

/**
 * Main Bank Statement Parser Function
 * Combines Safe API handling, Gemini AI extraction, and Client-Side PDF/CSV fallback
 */
export async function parseBankStatement(
  file: File,
  existingExpenses: Expense[] = [],
  existingIncomes: Income[] = [],
  userId?: string
): Promise<ParseStatementResult> {
  const fileName = file.name;
  const isCsv = fileName.toLowerCase().endsWith(".csv") || file.type === "text/csv";
  const isPdf = fileName.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

  let fileBase64 = "";
  let csvText = "";

  // 1. Prepare file payload
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

  let serverTransactions: ParsedStatementTransaction[] = [];
  let apiCallSucceeded = false;

  // 2. Safe API call to backend Gemini route
  try {
    const response = await fetch("/api/gemini/parse-statement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        mimeType: file.type || (isCsv ? "text/csv" : isPdf ? "application/pdf" : "image/jpeg"),
        fileBase64,
        csvText,
        userId,
      }),
    });

    const rawText = await response.text();

    if (!response.ok) {
      if (rawText.trim().startsWith("<")) {
        console.warn(`[Khata API] Server returned HTML (${response.status}). Engaging client-side extractor.`);
      } else {
        console.warn(`[Khata API] Server error (${response.status}): ${rawText.slice(0, 150)}`);
      }
    } else {
      if (rawText.trim().startsWith("<")) {
        console.warn("[Khata API] Server returned HTML instead of JSON. Engaging client-side extractor.");
      } else {
        const data = JSON.parse(rawText);
        if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
          serverTransactions = data.transactions;
          apiCallSucceeded = true;
        }
      }
    }
  } catch (fetchErr: any) {
    console.warn("[Khata API] Statement parse fetch failed, switching to client parser:", fetchErr?.message || fetchErr);
  }

  // 3. Client-Side Fallback if server returned HTML / failed
  let finalTransactions = serverTransactions;

  if (!apiCallSucceeded || finalTransactions.length === 0) {
    console.log("[Khata Parser] Running high-speed client-side extraction engine...");

    if (isCsv) {
      finalTransactions = parseCsvTransactions(csvText);
    } else if (isPdf) {
      const extractedText = await extractTextFromPdf(file);
      if (extractedText && extractedText.trim().length > 20) {
        finalTransactions = parseRawTextStatement(extractedText);
      }
    }

    // If still empty and sample was requested, provide safe structured sample items
    if (finalTransactions.length === 0 && (fileName.toLowerCase().includes("sample") || fileName.toLowerCase().includes("demo"))) {
      const today = new Date().toISOString().split("T")[0];
      finalTransactions = [
        {
          id: `demo_1_${Date.now()}`,
          date: today,
          description: "Monthly Salary Credit (Google India)",
          type: "INCOME",
          amount: 85000,
          category: "Salary & Bonus",
          payment_mode: "Net Banking",
        },
        {
          id: `demo_2_${Date.now()}`,
          date: today,
          description: "Swiggy Bangalore Food Order",
          type: "EXPENSE",
          amount: 450,
          category: "Food Delivery & Dining",
          payment_mode: "UPI",
        },
        {
          id: `demo_3_${Date.now()}`,
          date: today,
          description: "Blinkit Daily Groceries",
          type: "EXPENSE",
          amount: 780,
          category: "Kirana & Groceries",
          payment_mode: "UPI",
        },
        {
          id: `demo_4_${Date.now()}`,
          date: today,
          description: "BESCOM Electricity Bill",
          type: "EXPENSE",
          amount: 1850,
          category: "Bills & Mobile Recharge",
          payment_mode: "Net Banking",
        },
        {
          id: `demo_5_${Date.now()}`,
          date: today,
          description: "Freelance UI UX Consulting",
          type: "INCOME",
          amount: 22500,
          category: "Freelance & Consulting",
          payment_mode: "Bank Transfer",
        },
      ];
    }
  }

  // 4. Attach duplicate detection & default selection
  const processedTransactions = finalTransactions.map((tx) => {
    const dup = checkDuplicate(tx, existingExpenses, existingIncomes);
    return {
      ...tx,
      isDuplicate: dup.isDuplicate,
      duplicateReason: dup.reason,
      selected: !dup.isDuplicate,
    };
  });

  const incomes = processedTransactions.filter((t) => t.type === "INCOME");
  const expenses = processedTransactions.filter((t) => t.type === "EXPENSE");

  return {
    success: processedTransactions.length > 0,
    fileName,
    totalExtracted: processedTransactions.length,
    transactions: processedTransactions,
    incomesCount: incomes.length,
    expensesCount: expenses.length,
    incomesTotal: incomes.reduce((s, t) => s + (Number(t.amount) || 0), 0),
    expensesTotal: expenses.reduce((s, t) => s + (Number(t.amount) || 0), 0),
    fallbackUsed: !apiCallSucceeded,
  };
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
