import React, { useEffect, useState } from "react";
import { Download, FileSpreadsheet, CheckCircle2, ArrowRight, Smartphone, AlertCircle, RefreshCw } from "lucide-react";

interface WebDownloadLandingProps {
  token: string;
  onNavigateHome?: () => void;
}

export const WebDownloadLanding: React.FC<WebDownloadLandingProps> = ({ token, onNavigateHome }) => {
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState<{
    filename: string;
    mimeType: string;
    fileSizeBytes: number;
    expiresAt: number;
    directDownloadUrl: string;
  } | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadUrl = `/api/download/file/${encodeURIComponent(token)}`;

  useEffect(() => {
    if (!token) {
      setError("No download token provided.");
      setLoading(false);
      return;
    }

    // Fetch file metadata from server
    fetch(`/api/download/info/${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Download link is expired or invalid.");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setFileInfo(data);
          setLoading(false);

          // Auto-trigger download in external browser after brief delay
          setTimeout(() => {
            triggerDirectDownload(data.directDownloadUrl || downloadUrl);
          }, 400);
        } else {
          setError(data.error || "File download record not found.");
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load download information.");
        setLoading(false);
      });
  }, [token]);

  const triggerDirectDownload = (urlToFetch: string) => {
    try {
      const link = document.createElement("a");
      link.href = urlToFetch;
      link.setAttribute("download", fileInfo?.filename || "Khata_Export.xlsx");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1000);
      setDownloadStarted(true);
    } catch (e) {
      console.warn("Direct trigger error:", e);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleOpenApp = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] flex flex-col justify-between items-center p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-[#E8EAED] flex items-center justify-center text-[#1A73E8] font-bold text-xl">
            ₹
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#202124]">Ram Expenses</h1>
            <p className="text-[11px] text-[#5F6368]">Chrome External Download Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#137333] bg-[#E6F4EA] px-2.5 py-1 rounded-full border border-[#CEEAD6]">
          <CheckCircle2 size={13} />
          <span>Verified Secure</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md my-auto py-6">
        <div className="bg-white rounded-3xl shadow-xl border border-[#E8EAED] p-6 sm:p-7 space-y-5 text-center">
          {loading ? (
            <div className="py-10 space-y-3">
              <RefreshCw size={36} className="animate-spin text-[#1A73E8] mx-auto" />
              <p className="text-sm font-semibold text-[#5F6368]">Preparing your download in Chrome...</p>
            </div>
          ) : error ? (
            <div className="py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FCE8E6] text-[#EA4335] flex items-center justify-center mx-auto border border-[#FAD2CF]">
                <AlertCircle size={30} />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#202124]">Download Unavailable</h2>
                <p className="text-xs text-[#5F6368] leading-relaxed">{error}</p>
              </div>
              <button
                type="button"
                onClick={handleOpenApp}
                className="w-full py-3 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone size={16} />
                <span>Return to Ram Expenses App</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Icon */}
              <div className="w-16 h-16 rounded-3xl bg-[#E6F4EA] text-[#137333] flex items-center justify-center mx-auto border border-[#CEEAD6] shadow-sm">
                <FileSpreadsheet size={32} />
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#202124] break-all">{fileInfo?.filename || "Khata_Statement.xlsx"}</h2>
                <p className="text-xs text-[#5F6368]">
                  {fileInfo?.fileSizeBytes ? formatFileSize(fileInfo.fileSizeBytes) : "Ready for download"} • Authentic Financial Export
                </p>
              </div>

              {/* Success Banner */}
              <div className="p-3.5 bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] rounded-2xl text-xs font-medium space-y-1">
                <div className="flex items-center justify-center gap-1.5 font-bold">
                  <CheckCircle2 size={16} className="text-[#1A73E8]" />
                  <span>{downloadStarted ? "Download Triggered in Chrome" : "File Ready for Download"}</span>
                </div>
                <p className="text-[11px] text-[#5F6368]">
                  Check your Chrome notification bar or Downloads folder.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <a
                  id="btn-manual-direct-download"
                  href={downloadUrl}
                  download={fileInfo?.filename || "Khata_Export.xlsx"}
                  onClick={() => setDownloadStarted(true)}
                  className="w-full py-3 bg-[#137333] hover:bg-[#0D652D] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer no-underline"
                >
                  <Download size={16} />
                  <span>Download Again / Save File</span>
                </a>

                <button
                  type="button"
                  id="btn-return-to-app-from-download"
                  onClick={handleOpenApp}
                  className="w-full py-3 bg-white hover:bg-[#F8F9FA] text-[#202124] font-bold text-xs sm:text-sm rounded-full border border-[#DADCE0] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Smartphone size={16} className="text-[#1A73E8]" />
                  <span>Return to Ram Expenses App</span>
                  <ArrowRight size={14} className="text-[#5F6368]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md pb-2 text-center">
        <p className="text-[11px] text-[#80868B]">
          Ram Expenses • Encrypted Offline & Cloud Financial Ledger
        </p>
      </div>
    </div>
  );
};
