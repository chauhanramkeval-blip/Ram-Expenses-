import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleSoftReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[220px] w-full max-w-lg mx-auto my-6 p-5 sm:p-6 bg-white rounded-3xl border border-[#FAD2CF] shadow-lg flex flex-col items-center text-center animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-[#FCE8E6] text-[#EA4335] flex items-center justify-center mb-3.5 shadow-xs">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#202124]">
            {this.props.fallbackTitle || "Something went wrong"}
          </h3>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 mb-4 max-w-sm">
            {this.props.fallbackMessage ||
              "An unexpected error occurred while rendering this section. Your Khata data remains safe."}
          </p>

          {this.state.error && (
            <div className="w-full bg-[#F8F9FA] rounded-xl p-2.5 mb-4 text-left border border-[#E8EAED] max-h-24 overflow-y-auto">
              <p className="text-[11px] font-mono text-[#C5221F] break-all">
                {this.state.error.toString()}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            <button
              type="button"
              onClick={this.handleSoftReset}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-full shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#202124] text-xs font-semibold rounded-full transition-colors cursor-pointer"
            >
              <Home size={14} />
              <span>Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
