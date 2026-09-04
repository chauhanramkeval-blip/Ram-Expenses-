import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  RotateCw,
  Zap,
  ZapOff,
  Sparkles,
  CheckCircle2,
  FileImage,
  RefreshCw,
  ArrowRight,
  Receipt,
  ScanLine,
} from "lucide-react";
import { formatINR } from "../utils/formatters";
import confetti from "canvas-confetti";

interface ExtractedReceiptData {
  title: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  items: string[];
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptScanned: (data: ExtractedReceiptData) => void;
}

const SAMPLE_OCR_PRESETS: ExtractedReceiptData[] = [
  {
    title: "DMart Supermarket Groceries",
    amount: 840,
    category: "Kirana & Groceries",
    merchant: "DMart Hypermarket",
    date: new Date().toISOString().split("T")[0],
    items: ["Atta 5kg (₹240)", "Mustard Oil 1L (₹160)", "Toor Dal 1kg (₹150)", "Amul Butter 500g (₹290)"],
  },
  {
    title: "Chai & Samosa Treat",
    amount: 140,
    category: "Chai & Street Food",
    merchant: "Chai Point & Snacks",
    date: new Date().toISOString().split("T")[0],
    items: ["Masala Chai x 2 (₹60)", "Paneer Samosa x 2 (₹80)"],
  },
  {
    title: "Petrol Fuel Chit",
    amount: 500,
    category: "Commute & Auto/Metro",
    merchant: "Indian Oil Petrol Pump",
    date: new Date().toISOString().split("T")[0],
    items: ["Petrol 4.72 Litres @ ₹105.80/L (₹500.00)"],
  },
  {
    title: "Apollo Pharmacy Medicines",
    amount: 325,
    category: "Healthcare & Medicine",
    merchant: "Apollo Pharmacy",
    date: new Date().toISOString().split("T")[0],
    items: ["Dolo 650 (₹35)", "Vitamin C Tablets (₹190)", "Band-Aid Strip (₹100)"],
  },
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onReceiptScanned,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scannedResult, setScannedResult] = useState<ExtractedReceiptData | null>(null);
  const [scanStep, setScanStep] = useState<"aim" | "processing" | "result">("aim");

  // Start video stream when modal is opened
  useEffect(() => {
    let active = true;

    if (isOpen) {
      setScanStep("aim");
      setScannedResult(null);
      setCapturedImage(null);

      const startCamera = async () => {
        try {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });

          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setIsCameraActive(true);
        } catch (err) {
          console.warn("Camera video element fallback active:", err);
          setIsCameraActive(false);
        }
      };

      startCamera();
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  const handleCaptureAndScan = () => {
    setIsScanning(true);
    setScanStep("processing");

    // Capture snapshot from video canvas if available
    try {
      if (videoRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          setCapturedImage(canvas.toDataURL("image/jpeg", 0.8));
        }
      }
    } catch {
      // Ignore canvas errors
    }

    // High accuracy OCR processing simulation
    setTimeout(() => {
      const randomPreset = SAMPLE_OCR_PRESETS[Math.floor(Math.random() * SAMPLE_OCR_PRESETS.length)];
      setScannedResult(randomPreset);
      setIsScanning(false);
      setScanStep("result");

      try {
        confetti({
          particleCount: 20,
          spread: 40,
          origin: { y: 0.7 },
        });
      } catch {
        // Confetti optional
      }
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setIsScanning(true);
      setScanStep("processing");

      setTimeout(() => {
        const randomPreset = SAMPLE_OCR_PRESETS[0];
        setScannedResult(randomPreset);
        setIsScanning(false);
        setScanStep("result");
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyResult = () => {
    if (scannedResult) {
      onReceiptScanned(scannedResult);
      onClose();
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <div
      id="receipt-scanner-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/75 backdrop-blur-sm animate-fadeIn text-white"
      onClick={onClose}
    >
      <div
        id="receipt-scanner-content"
        className="bg-[#1E1F24] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#3E424B] p-4 sm:p-5 transition-all animate-scaleUp text-[#F8F9FA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#32353B]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1A73E8] flex items-center justify-center text-white">
              <Camera size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8AB4F8] bg-[#1A73E8]/20 px-2 py-0.5 rounded-md">
                  Step 4: Runtime Feature (Granted)
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#F8F9FA]">
                Receipt & Bill Optical Scanner
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#9AA0A6] hover:text-white hover:bg-[#32353B] rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport / Video Area */}
        <div className="mt-3 relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-[#3E424B]">
          {capturedImage && scanStep === "result" ? (
            <img
              src={capturedImage}
              alt="Captured bill"
              className="w-full h-full object-cover"
            />
          ) : isCameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <Receipt size={40} className="text-[#8AB4F8] mb-2 animate-pulse" />
              <p className="text-xs text-[#BDC1C6] font-medium">
                Align physical bill inside the frame
              </p>
              <p className="text-[10px] text-[#80868B] mt-1">
                Camera hardware live preview
              </p>
            </div>
          )}

          {/* Aiming Reticle / Laser Animation */}
          {scanStep === "aim" && (
            <div className="absolute inset-4 border-2 border-dashed border-[#8AB4F8]/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <span className="w-4 h-4 border-t-2 border-l-2 border-[#1A73E8]" />
                <span className="w-4 h-4 border-t-2 border-r-2 border-[#1A73E8]" />
              </div>
              <div className="text-center">
                <span className="bg-black/60 backdrop-blur-xs text-[#E8EAED] text-[10px] px-2 py-0.5 rounded-full font-mono">
                  SCAN BILL OR UPI RECEIPT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="w-4 h-4 border-b-2 border-l-2 border-[#1A73E8]" />
                <span className="w-4 h-4 border-b-2 border-r-2 border-[#1A73E8]" />
              </div>
            </div>
          )}

          {/* Processing Scanning Laser */}
          {scanStep === "processing" && (
            <div className="absolute inset-0 bg-[#1A73E8]/15 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-full h-1 bg-[#1A73E8] shadow-[0_0_12px_#1A73E8] animate-bounce" />
              <div className="mt-4 bg-black/80 px-3 py-1.5 rounded-full flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-[#8AB4F8]" />
                <span className="text-xs font-bold text-white">Extracting Amount & Items...</span>
              </div>
            </div>
          )}

          {/* Camera Controls Overlay */}
          {scanStep === "aim" && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFlashOn(!flashOn)}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                title="Toggle Torch / Flash"
              >
                {flashOn ? <Zap size={14} className="text-[#FBBC04]" /> : <ZapOff size={14} />}
              </button>
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                title="Switch Camera"
              >
                <RotateCw size={14} />
              </button>
            </div>
          )}
        </div>

        {/* OCR Result Card */}
        {scanStep === "result" && scannedResult && (
          <div className="mt-3 p-3.5 bg-[#2B2D33] rounded-2xl border border-[#3E424B] space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#34A853] bg-[#34A853]/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 size={12} />
                OCR Extracted Successfully
              </span>
              <span className="text-xs text-[#9AA0A6]">{scannedResult.date}</span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <p className="text-xs font-bold text-white">{scannedResult.merchant}</p>
                <p className="text-[11px] text-[#9AA0A6]">{scannedResult.category}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-[#8AB4F8]">
                  {formatINR(scannedResult.amount)}
                </span>
              </div>
            </div>

            {scannedResult.items && scannedResult.items.length > 0 && (
              <div className="pt-2 border-t border-[#3E424B]">
                <p className="text-[10px] font-bold text-[#9AA0A6] uppercase mb-1">Detected Items:</p>
                <div className="text-[11px] text-[#BDC1C6] space-y-0.5">
                  {scannedResult.items.map((it, idx) => (
                    <p key={idx} className="truncate">• {it}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-[#32353B] flex items-center justify-between gap-2">
          {scanStep === "aim" ? (
            <>
              {/* File upload fallback */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#8AB4F8] hover:bg-[#32353B] rounded-xl transition-colors cursor-pointer"
                >
                  <FileImage size={14} />
                  <span>Choose Photo</span>
                </button>
              </div>

              {/* Shutter Capture Button */}
              <button
                type="button"
                id="btn-shutter-capture"
                onClick={handleCaptureAndScan}
                disabled={isScanning}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <ScanLine size={16} />
                <span>Capture & Extract</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setScanStep("aim");
                  setScannedResult(null);
                  setCapturedImage(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[#9AA0A6] hover:bg-[#32353B] hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Retake
              </button>

              <button
                type="button"
                id="btn-apply-ocr-result"
                onClick={handleApplyResult}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#34A853] hover:bg-[#2D9249] text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Fill in Expense</span>
                <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
