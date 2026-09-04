import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  Volume2,
  RotateCcw,
  ArrowRight,
  Zap,
} from "lucide-react";
import { formatINR } from "../utils/formatters";
import { parseSpokenExpense, ParsedVoiceExpense } from "../utils/permissionManager";
import confetti from "canvas-confetti";

interface VoiceLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseExtracted: (expense: ParsedVoiceExpense) => void;
}

const SAMPLE_SPOKEN_PHRASES = [
  "Chai aur samosa 60 rupees via UPI",
  "Auto fare 80 rupees cash to metro station",
  "Blinkit groceries 450 rupees UPI",
  "Swiggy dinner 320 card payment",
  "Petrol fuel 500 rupees UPI at Indian Oil",
  "Apollo pharmacy medicines 180 cash",
];

export const VoiceLoggerModal: React.FC<VoiceLoggerModalProps> = ({
  isOpen,
  onClose,
  onExpenseExtracted,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedVoiceExpense | null>(null);
  const [soundBars, setSoundBars] = useState<number[]>([40, 65, 30, 80, 55, 90, 45, 70, 35, 60]);
  const recognitionRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsListening(false);
      return;
    }

    setTranscript("");
    setParsedResult(null);

    // Initialize Web Speech Recognition if supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // Indian English & Hinglish accent

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        if (currentText.trim()) {
          setTranscript(currentText);
          const parsed = parseSpokenExpense(currentText);
          setParsedResult(parsed);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech recognition start failed:", err);
      }
    } else {
      // Fallback: active listening simulation with auto-suggested phrase
      setIsListening(true);
      const timer = setTimeout(() => {
        const randomPhrase =
          SAMPLE_SPOKEN_PHRASES[Math.floor(Math.random() * SAMPLE_SPOKEN_PHRASES.length)];
        setTranscript(randomPhrase);
        setParsedResult(parseSpokenExpense(randomPhrase));
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Audio Visualizer waveform pulse animation
    const interval = setInterval(() => {
      setSoundBars((prev) =>
        prev.map(() => Math.floor(Math.random() * 70) + 20)
      );
    }, 100);

    return () => {
      clearInterval(interval);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (parsedResult) {
      try {
        confetti({
          particleCount: 20,
          spread: 40,
          origin: { y: 0.7 },
        });
      } catch {
        // Confetti optional
      }
      onExpenseExtracted(parsedResult);
      onClose();
    }
  };

  const handleSelectSamplePhrase = (phrase: string) => {
    setTranscript(phrase);
    setParsedResult(parseSpokenExpense(phrase));
  };

  return (
    <div
      id="voice-logger-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/60 backdrop-blur-xs animate-fadeIn text-[#202124]"
      onClick={onClose}
    >
      <div
        id="voice-logger-content"
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#DADCE0] p-5 sm:p-6 transition-all animate-scaleUp text-[#202124]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] text-[#0F9D58] flex items-center justify-center">
              <Mic size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#137333] bg-[#E6F4EA] px-2 py-0.5 rounded-md">
                  Step 4: Runtime Feature (Granted)
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#202124]">
                Instant Voice Expense Logger
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Audio Visualizer Wave */}
        <div className="mt-4 flex flex-col items-center justify-center p-5 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED]">
          <div className="relative mb-3 flex items-center justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isListening ? "bg-[#E6F4EA] text-[#0F9D58] ring-8 ring-[#E6F4EA]/60 animate-pulse" : "bg-[#F1F3F4] text-[#5F6368]"
            }`}>
              <Mic size={28} />
            </div>
          </div>

          {/* Pulsating Wave Bars */}
          <div className="flex items-center justify-center gap-1 h-10 w-full px-4 mb-2">
            {soundBars.map((height, i) => (
              <span
                key={i}
                className="w-1.5 bg-[#0F9D58] rounded-full transition-all duration-100"
                style={{
                  height: isListening ? `${height}%` : "6px",
                  opacity: isListening ? 0.9 : 0.3,
                }}
              />
            ))}
          </div>

          <p className="text-xs font-semibold text-[#202124]">
            {isListening ? "Listening... speak naturally in Hindi or English" : "Tap to Speak"}
          </p>
          <p className="text-[11px] text-[#5F6368] mt-0.5">
            e.g., "Chai 40 rupees via UPI" or "Auto 80 cash"
          </p>
        </div>

        {/* Live Transcript Display */}
        <div className="mt-3.5 p-3 rounded-2xl bg-[#F1F3F4] border border-[#DADCE0]">
          <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider block mb-1">
            Live Speech Transcript:
          </span>
          <p className="text-xs font-medium text-[#202124] min-h-[32px] italic">
            {transcript ? `"${transcript}"` : "Waiting for spoken input..."}
          </p>
        </div>

        {/* Parsed Output Card */}
        {parsedResult && (
          <div className="mt-3.5 p-3.5 bg-[#E8F0FE] rounded-2xl border border-[#D2E3FC] space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#1A73E8] flex items-center gap-1">
                <CheckCircle2 size={12} />
                Extracted Expense
              </span>
              <span className="text-xs font-bold text-[#1A73E8] bg-white px-2 py-0.5 rounded-full border border-[#D2E3FC]">
                {parsedResult.paymentMode}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <p className="text-xs font-bold text-[#202124]">{parsedResult.title}</p>
                <p className="text-[11px] text-[#5F6368]">{parsedResult.category}</p>
                {parsedResult.merchantOrLocation && (
                  <p className="text-[10px] text-[#1A73E8] font-medium">📍 {parsedResult.merchantOrLocation}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-[#1A73E8]">
                  {formatINR(parsedResult.amount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Sample Voice Prompts */}
        <div className="mt-3">
          <p className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider mb-1.5">
            Or tap a common Indian spoken sample:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
            {SAMPLE_SPOKEN_PHRASES.slice(0, 4).map((phrase, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectSamplePhrase(phrase)}
                className="px-2.5 py-1 bg-white hover:bg-[#F1F3F4] text-[#3C4043] rounded-lg text-[11px] font-medium border border-[#DADCE0] transition-colors cursor-pointer text-left truncate max-w-full"
              >
                🗣️ "{phrase}"
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-[#F1F3F4] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setTranscript("");
              setParsedResult(null);
            }}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4] rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            id="btn-apply-voice-expense"
            disabled={!parsedResult}
            onClick={handleApply}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer ${
              parsedResult
                ? "bg-[#0F9D58] hover:bg-[#0B8043] text-white"
                : "bg-[#DADCE0] text-[#80868B] cursor-not-allowed"
            }`}
          >
            <CheckCircle2 size={16} />
            <span>Fill in Expense</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
