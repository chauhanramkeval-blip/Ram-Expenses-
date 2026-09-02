import React, { useState, useEffect } from "react";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Send,
  Calculator,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  IndianRupee,
} from "lucide-react";
import { Expense, DailyAdviceData, SpendingAnalysisData, ChatMessage } from "../types";
import { formatINR } from "../utils/formatters";

interface DailyAdvisorViewProps {
  expenses: Expense[];
  monthlyBudget: number;
}

export const DailyAdvisorView: React.FC<DailyAdvisorViewProps> = ({
  expenses,
  monthlyBudget,
}) => {
  // Daily Advice State
  const [dailyAdvice, setDailyAdvice] = useState<DailyAdviceData>({
    title: "Beware the Frictionless UPI Leaks",
    punchline: "₹60 daily tea & quick snacks quietly equals ₹21,900 annually.",
    detailedAdvice:
      "Because QR code scanning via GPay and PhonePe takes just 2 seconds with zero physical cash leaving your wallet, your brain doesn't register the pain of payment. Indian professionals lose an average of ₹1,500 to ₹3,500 per month on unplanned impulse tapri visits, extra samosas, and quick-delivery convenience fees.",
    actionableStep:
      "Maintain a strict daily ₹100 UPI limit for snacks, or use cash for street food to feel the spend.",
    potentialSavingsInRupees: "₹1,800 - ₹3,500 / month",
    categoryTag: "UPI Smart Spending",
  });
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  // Spending Analysis State
  const [analysis, setAnalysis] = useState<SpendingAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Interactive Chai Compounding Calculator State
  const [dailyChaiAmount, setDailyChaiAmount] = useState(50);
  const [investmentYears, setInvestmentYears] = useState(10);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: "Namaste! I'm your Khata AI Financial Advisor. Ask me anything about budgeting, saving on daily expenses, SIP investments, UPI habits, or tax strategies in India!",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Fetch Daily Advice from API
  const fetchDailyAdvice = async () => {
    setIsLoadingAdvice(true);
    try {
      const res = await fetch("/api/gemini/daily-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentMonthTotal: totalSpent,
          userContext: "Indian daily expense optimization",
        }),
      });
      const data = await res.json();
      if (data.success && data.advice) {
        setDailyAdvice(data.advice);
      }
    } catch (err) {
      console.error("Failed to fetch advice", err);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // Run Spending Analysis from API
  const runSpendingAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/gemini/analyze-spending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenses,
          monthlyBudget,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error("Failed to analyze spending", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initial load
  useEffect(() => {
    // Run analysis automatically on first visit if we have expenses
    if (expenses.length > 0 && !analysis) {
      runSpendingAnalysis();
    }
  }, [expenses.length]);

  // Send Chat message to API
  const handleSendChat = async (questionText?: string) => {
    const text = questionText || chatInput;
    if (!text.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!questionText) setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/gemini/chat-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: chatMessages,
          contextExpenses: expenses,
          monthlyBudget,
        }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply || "I am analyzing your finances.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Chat error", err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "Here is a golden Indian money principle: Automate your savings on salary day, invest in diversified index funds, and keep 3 to 6 months of essential living expenses in high-yield liquid funds.",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Chai SIP calculation: Compounding monthly investment at 12% expected return
  const monthlyChaiSavings = dailyChaiAmount * 30;
  const annualRate = 0.12;
  const monthlyRate = annualRate / 12;
  const totalMonths = investmentYears * 12;
  // Future Value of SIP: P * [((1 + r)^n - 1) / r] * (1 + r)
  const compoundFutureValue = Math.round(
    monthlyChaiSavings *
      (((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate))
  );
  const totalInvestedPrincipal = monthlyChaiSavings * totalMonths;
  const wealthGained = compoundFutureValue - totalInvestedPrincipal;

  return (
    <div id="khata-daily-advisor-page" className="space-y-6 animate-fadeIn pb-8">
      {/* 1. Daily Indian Financial Tip Card */}
      <div
        id="card-daily-finance-tip"
        className="bg-gradient-to-br from-[#FEF7E0] to-[#FFF8E7] rounded-3xl p-5 sm:p-6 border border-[#FEEFC3] shadow-xs relative overflow-hidden"
      >
        {/* Subtle decorative circles */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-[#F9AB00]/10 pointer-events-none" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F9AB00] text-white flex items-center justify-center shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B06000]">
                  Daily Indian Finance Tip
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEEFC3] text-[#B06000] border border-[#FDE293]">
                  {dailyAdvice.categoryTag}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#202124] mt-0.5">
                {dailyAdvice.title}
              </h2>
            </div>
          </div>

          <button
            id="btn-refresh-daily-advice"
            onClick={fetchDailyAdvice}
            disabled={isLoadingAdvice}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#FEEFC3] text-[#B06000] border border-[#FDE293] rounded-full text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoadingAdvice ? "animate-spin" : ""} />
            <span>New Tip</span>
          </button>
        </div>

        {/* Punchline */}
        <div className="mt-3.5 bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-[#FEEFC3] text-xs font-bold text-[#3C4043] flex items-center gap-2">
          <span className="text-[#F9AB00] text-base">💡</span>
          <span>{dailyAdvice.punchline}</span>
        </div>

        {/* Detailed Advice */}
        <p className="mt-3 text-xs sm:text-sm text-[#3C4043] leading-relaxed">
          {dailyAdvice.detailedAdvice}
        </p>

        {/* Action Step & Rupee Impact */}
        <div className="mt-4 pt-3.5 border-t border-[#FDE293]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#202124] flex items-center gap-1.5">
            <span className="font-bold text-[#1E8E3E] bg-[#E6F4EA] px-2 py-0.5 rounded-md border border-[#CEEAD6]">
              Action Today:
            </span>
            <span className="font-medium text-[#3C4043]">{dailyAdvice.actionableStep}</span>
          </div>

          <div className="text-xs font-bold text-[#B06000] bg-white px-3 py-1.5 rounded-full border border-[#FDE293] shadow-2xs shrink-0 self-start sm:self-auto">
            💰 Potential Savings: {dailyAdvice.potentialSavingsInRupees}
          </div>
        </div>
      </div>

      {/* 2. "Where Am I Spending Too Much?" AI Deep Spending Audit */}
      <div
        id="card-ai-spending-audit"
        className="bg-white rounded-3xl border border-[#E8EAED] p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F3F4] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#202124] flex items-center gap-2">
                <span>AI Spending Audit: Where is Your Money Going?</span>
              </h3>
              <p className="text-xs text-[#5F6368]">
                Automated spending leak detection tailored for Indian budgets
              </p>
            </div>
          </div>

          <button
            id="btn-reanalyze-spending"
            onClick={runSpendingAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={14} />
            <span>{isAnalyzing ? "Analyzing Expenses..." : "Re-Analyze My Khata"}</span>
          </button>
        </div>

        {/* Analysis Body */}
        {isAnalyzing ? (
          <div className="py-12 text-center text-xs text-[#5F6368] space-y-2">
            <RefreshCw size={24} className="animate-spin text-[#1A73E8] mx-auto" />
            <p className="font-medium text-[#202124]">
              Gemini AI is examining your category spends & UPI patterns...
            </p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Top Score Bar & Main Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Financial Health Score */}
              <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#E8EAED] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#5F6368] uppercase">
                    Financial Health
                  </span>
                  <div className="text-2xl font-extrabold text-[#202124] mt-0.5">
                    {analysis.overallHealthScore}/100
                  </div>
                  <span className="text-xs font-bold text-[#1E8E3E]">{analysis.healthGrade}</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#E6F4EA] text-[#137333] flex items-center justify-center font-bold text-sm border border-[#CEEAD6]">
                  {analysis.overallHealthScore}%
                </div>
              </div>

              {/* Top Spend Driver */}
              <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#E8EAED] col-span-2 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-[#5F6368] uppercase">
                  Primary Expenditure Driver
                </span>
                <div className="text-sm font-bold text-[#202124] mt-0.5">
                  {analysis.topSpendingCategory}
                </div>
                <p className="text-xs text-[#5F6368] mt-1 line-clamp-2">
                  {analysis.topSpendingInsight}
                </p>
              </div>
            </div>

            {/* Spending Leaks Box */}
            <div className="bg-[#FEF7E0]/60 p-4 rounded-2xl border border-[#FEEFC3]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#B06000] flex items-center gap-1.5 mb-2">
                <AlertCircle size={14} />
                <span>Identified Spending Leaks</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-[#3C4043]">
                {analysis.spendingLeaks.map((leak, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#EA4335] font-bold shrink-0">•</span>
                    <span>{leak}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Smart Indian Tips */}
            <div className="bg-[#E6F4EA]/60 p-4 rounded-2xl border border-[#CEEAD6]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#137333] flex items-center gap-1.5 mb-2">
                <CheckCircle size={14} />
                <span>Actionable Rupee Saving Suggestions</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {analysis.smartIndianTips.map((tip, i) => (
                  <div
                    key={i}
                    className="bg-white p-3 rounded-xl border border-[#CEEAD6] text-xs text-[#3C4043] font-medium shadow-2xs"
                  >
                    <span className="font-bold text-[#137333] block mb-1">Tip #{i + 1}</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary & Projection */}
            <div className="text-xs text-[#5F6368] bg-[#F8F9FA] p-3 rounded-xl border border-[#E8EAED] flex items-center justify-between">
              <span>{analysis.summaryVerdict}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* 3. Indian Wealth & Micro-Spend Compounding Calculator ("The Chai & Samosa Index") */}
      <div
        id="card-chai-calculator"
        className="bg-white rounded-3xl border border-[#E8EAED] p-5 sm:p-6 shadow-xs"
      >
        <div className="flex items-center gap-3 border-b border-[#F1F3F4] pb-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold">
            ☕
          </div>
          <div>
            <h3 className="font-bold text-base text-[#202124]">
              The "Chai Index" Compound Wealth Calculator
            </h3>
            <p className="text-xs text-[#5F6368]">
              See how small daily Indian micro-spends transform into massive wealth if invested in a
              Nifty 50 Index SIP (12% CAGR)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Controls (6 cols) */}
          <div className="md:col-span-6 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#3C4043] mb-1.5">
                <span>Daily Snack / Chai Spend:</span>
                <span className="text-base font-bold text-[#1A73E8]">
                  {formatINR(dailyChaiAmount)} / day
                </span>
              </div>
              <input
                id="range-daily-chai"
                type="range"
                min={20}
                max={300}
                step={10}
                value={dailyChaiAmount}
                onChange={(e) => setDailyChaiAmount(Number(e.target.value))}
                className="w-full h-2 bg-[#E8EAED] rounded-lg appearance-none cursor-pointer accent-[#1A73E8]"
              />
              <div className="flex justify-between text-[11px] text-[#5F6368] mt-1">
                <span>₹20 (1 Tapri Chai)</span>
                <span>₹100 (Chai + Samosa)</span>
                <span>₹300 (Coffee Shop)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#3C4043] mb-1.5">
                <span>Investment Horizon:</span>
                <span className="text-base font-bold text-[#1A73E8]">
                  {investmentYears} Years
                </span>
              </div>
              <input
                id="range-investment-years"
                type="range"
                min={3}
                max={25}
                step={1}
                value={investmentYears}
                onChange={(e) => setInvestmentYears(Number(e.target.value))}
                className="w-full h-2 bg-[#E8EAED] rounded-lg appearance-none cursor-pointer accent-[#1A73E8]"
              />
              <div className="flex justify-between text-[11px] text-[#5F6368] mt-1">
                <span>3 Yrs</span>
                <span>10 Yrs</span>
                <span>25 Yrs</span>
              </div>
            </div>

            <div className="text-xs text-[#5F6368] bg-[#F8F9FA] p-3 rounded-xl border border-[#E8EAED]">
              📌 Monthly SIP equivalent:{" "}
              <span className="font-bold text-[#202124]">{formatINR(monthlyChaiSavings)}/month</span>
            </div>
          </div>

          {/* Results Visual (6 cols) */}
          <div className="md:col-span-6 bg-gradient-to-br from-[#E8F0FE] to-[#F1F3F4] rounded-2xl p-5 border border-[#D2E3FC] text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1A73E8]">
              Expected Future Wealth (at 12% return)
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#1A73E8]">
              {formatINR(compoundFutureValue, true)}
            </div>
            <p className="text-xs text-[#3C4043]">
              Total Invested: <span className="font-semibold">{formatINR(totalInvestedPrincipal, true)}</span> | Pure
              Compounded Wealth:{" "}
              <span className="font-bold text-[#1E8E3E]">+{formatINR(wealthGained, true)}</span>
            </p>

            <div className="pt-2 text-[11px] text-[#5F6368] border-t border-[#D2E3FC]">
              ⚡ Cutting just 1 extra tea/snack a day and diverting it into automated SIP buys you
              financial freedom.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive "Ask Khata AI" Indian Personal Finance Chat */}
      <div
        id="card-ai-chat"
        className="bg-white rounded-3xl border border-[#E8EAED] p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold">
              💬
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#202124]">Ask Khata AI Finance Advisor</h3>
              <p className="text-[11px] text-[#5F6368]">
                Get personalized answers on Indian taxes, SIPs, emergency funds, and cutting costs
              </p>
            </div>
          </div>
        </div>

        {/* Quick prompt pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-semibold text-[#5F6368] whitespace-nowrap mr-1">
            Try asking:
          </span>
          {[
            "How to save ₹5,000 extra this month?",
            "Is ₹300/day on Swiggy too much for a ₹40k salary?",
            "What is the 50-30-20 rule in India?",
            "How much emergency fund do I need?",
          ].map((promptText, i) => (
            <button
              key={i}
              id={`btn-prompt-pill-${i}`}
              onClick={() => handleSendChat(promptText)}
              className="px-3 py-1 text-xs rounded-full bg-[#F1F3F4] hover:bg-[#E8F0FE] hover:text-[#1A73E8] text-[#3C4043] border border-[#DADCE0] whitespace-nowrap transition-colors cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[#E8EAED] max-h-80 overflow-y-auto space-y-3">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[#1A73E8] text-white rounded-br-xs font-medium"
                    : "bg-white text-[#202124] border border-[#E8EAED] rounded-bl-xs shadow-2xs"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-[#5F6368] mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex items-center gap-2 text-xs text-[#5F6368] bg-white p-3 rounded-2xl border border-[#E8EAED] max-w-xs shadow-2xs">
              <RefreshCw size={13} className="animate-spin text-[#1A73E8]" />
              <span>Khata AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChat();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-chat-query"
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your money or expense question..."
            className="flex-1 px-4 py-2.5 bg-[#F1F3F4] focus:bg-white text-xs sm:text-sm text-[#202124] rounded-full border border-[#DADCE0] focus:border-[#1A73E8] outline-none transition-all"
          />
          <button
            type="submit"
            id="btn-send-chat"
            disabled={!chatInput.trim() || isChatLoading}
            className="px-4 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Send size={14} />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
