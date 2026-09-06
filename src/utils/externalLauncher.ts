/**
 * External Chrome Browser Launcher & Authentication Handshake Utilities
 * Provides seamless Intent-based launching of Google Chrome for Android/Mobile,
 * authenticated token-based file downloads, and Web Auth session handover.
 */

import { UserAccount } from "../types";

export interface StagedDownloadResponse {
  success: boolean;
  token: string;
  filename: string;
  downloadUrl: string;
  webDownloadUrl: string;
  expiresAt: number;
}

export interface WebAuthSession {
  ticket: string;
  authCode: string;
  webLoginUrl: string;
  expiresAt: number;
}

/**
 * Detects if the current environment is an Android device, WebView, or Capacitor/Cordova app
 */
export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /android/i.test(ua);
}

export function isMobileOrWebView(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isCapacitor = (window as any).Capacitor !== undefined;
  const isCordova = (window as any).cordova !== undefined;
  const isAndroidWebView = /wv|Version\/[\d.]+/i.test(ua) && /Android/i.test(ua);
  return isMobile || isCapacitor || isCordova || isAndroidWebView;
}

/**
 * Converts a relative or absolute URL into a full qualified URL with current origin
 */
export function getAbsoluteUrl(relativeOrAbsoluteUrl: string): string {
  if (relativeOrAbsoluteUrl.startsWith("http://") || relativeOrAbsoluteUrl.startsWith("https://")) {
    return relativeOrAbsoluteUrl;
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const path = relativeOrAbsoluteUrl.startsWith("/") ? relativeOrAbsoluteUrl : `/${relativeOrAbsoluteUrl}`;
  return `${origin}${path}`;
}

/**
 * Constructs a clean standard HTTPS URL for external web navigation
 */
export function buildExternalWebUrl(targetUrl: string): string {
  return getAbsoluteUrl(targetUrl);
}

/**
 * Opens a URL in the web browser using standard Web / Capacitor APIs
 * Ensures standard HTTPS URLs are used rather than unhandled intent schemes.
 */
export function openInExternalChromeBrowser(targetUrl: string): { success: boolean; method: string } {
  const fullUrl = getAbsoluteUrl(targetUrl);

  if (typeof window === "undefined") {
    return { success: false, method: "server_environment" };
  }

  // 1. Try Capacitor Browser plugin if present in mobile wrapper
  try {
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.Browser?.open) {
      cap.Plugins.Browser.open({ url: fullUrl, windowName: "_blank" });
      return { success: true, method: "capacitor_browser_plugin" };
    }
  } catch (e) {
    console.warn("Capacitor Browser plugin attempt:", e);
  }

  // 2. Standard Web popup / new tab via window.open
  try {
    const win = window.open(fullUrl, "_blank", "noopener,noreferrer");
    if (win) {
      return { success: true, method: "window_open_blank" };
    }
  } catch (winErr) {
    console.warn("window.open(_blank) failed:", winErr);
  }

  // 3. Fallback: window.open with '_system'
  try {
    const win = window.open(fullUrl, "_system");
    if (win) {
      return { success: true, method: "window_open_system" };
    }
  } catch (winErr2) {
    console.warn("window.open(_system) failed:", winErr2);
  }

  // 4. Ultimate standard fallback: smooth direct web navigation
  try {
    window.location.assign(fullUrl);
    return { success: true, method: "location_assign" };
  } catch (locErr) {
    console.error("All external launcher methods failed:", locErr);
    return { success: false, method: "failed" };
  }
}

/**
 * Converts a Blob to a Base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      // Strip data: prefix for raw base64
      const base64Data = res.split(",")[1] || res;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Stages a file to the backend server and generates a signed temporary download token
 */
export async function stageDownloadFile(params: {
  filename: string;
  mimeType: string;
  data: string; // Base64 string or UTF-8 text
  isBase64?: boolean;
  userId?: string;
}): Promise<StagedDownloadResponse> {
  const response = await fetch("/api/download/stage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: params.filename,
      mimeType: params.mimeType,
      data: params.data,
      isBase64: params.isBase64 ?? true,
      userId: params.userId || "khata-user",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to stage download on server (${response.status})`);
  }

  return await response.json();
}

/**
 * Universal File Download via External Chrome Browser:
 * Stages the file on the backend with an authenticated short-lived token
 * and launches the download URL in the external Google Chrome browser.
 */
export async function deliverFileViaExternalChrome(
  blob: Blob,
  filename: string,
  mimeType: string,
  userId?: string
): Promise<{ success: boolean; action: "external_chrome" | "downloaded"; filename: string; url: string; error?: string }> {
  try {
    // 1. Convert blob to Base64
    const base64Data = await blobToBase64(blob);

    // 2. Stage download on server to receive secure download token
    const staged = await stageDownloadFile({
      filename,
      mimeType,
      data: base64Data,
      isBase64: true,
      userId,
    });

    if (!staged.success || !staged.downloadUrl) {
      throw new Error("Server did not return a valid download token.");
    }

    // 3. Build the full download link (direct file attachment endpoint or web viewer fallback)
    const directFileUrl = getAbsoluteUrl(staged.downloadUrl);
    const webViewerUrl = getAbsoluteUrl(staged.webDownloadUrl);

    // 4. Launch in external Chrome browser via Intent
    openInExternalChromeBrowser(staged.webDownloadUrl || staged.downloadUrl);

    return {
      success: true,
      action: "external_chrome",
      filename,
      url: directFileUrl,
    };
  } catch (err: any) {
    console.warn("External Chrome staging failed, falling back to local Blob download:", err);

    // Fallback: local Blob download in case server is unavailable
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (document.body.contains(link)) document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch {}
      }, 1500);

      return {
        success: true,
        action: "downloaded",
        filename,
        url: "",
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        action: "downloaded",
        filename,
        url: "",
        error: fallbackErr?.message || err?.message || "Download failed",
      };
    }
  }
}

/**
 * Creates a Web Login Ticket session for Chrome authentication
 */
export async function createWebAuthTicket(userHint?: string): Promise<WebAuthSession> {
  const response = await fetch("/api/auth/web-ticket/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userHint: userHint || "" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create web auth ticket (${response.status})`);
  }

  const data = await response.json();
  return {
    ticket: data.ticket,
    authCode: data.authCode,
    webLoginUrl: data.webLoginUrl,
    expiresAt: data.expiresAt,
  };
}

/**
 * Launches Chrome for Web Login
 */
export function launchChromeWebLogin(ticket: string): { success: boolean; webLoginUrl: string } {
  const webLoginUrl = getAbsoluteUrl(`/web-login?ticket=${encodeURIComponent(ticket)}`);
  openInExternalChromeBrowser(webLoginUrl);
  return { success: true, webLoginUrl };
}

/**
 * Polls the backend for completion of web login ticket
 */
export async function checkWebAuthStatus(ticket: string): Promise<{
  status: "pending" | "authenticated" | "consumed" | "expired";
  user?: UserAccount;
  authCode?: string;
}> {
  try {
    const res = await fetch(`/api/auth/web-ticket/status/${encodeURIComponent(ticket)}`);
    if (!res.ok) {
      return { status: "pending" };
    }
    const data = await res.json();
    return {
      status: data.status,
      user: data.user,
      authCode: data.authCode,
    };
  } catch (err) {
    return { status: "pending" };
  }
}

/**
 * Verifies a 6-digit confirmation code entered from Chrome
 */
export async function verifyWebAuthCode(authCode: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const cleanCode = authCode.replace(/\D/g, "").trim();
    if (cleanCode.length !== 6) {
      return { success: false, error: "Please enter a valid 6-digit confirmation code." };
    }

    const res = await fetch("/api/auth/web-ticket/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authCode: cleanCode }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Invalid or expired confirmation code." };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to verify confirmation code." };
  }
}

/**
 * Marks a web login ticket as completed (called by web login portal in Chrome)
 */
export async function completeWebAuthTicket(ticket: string, user: UserAccount): Promise<{
  success: boolean;
  authCode: string;
  deepLinkUrl: string;
  intentUrl: string;
}> {
  const res = await fetch("/api/auth/web-ticket/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket, user }),
  });

  if (!res.ok) {
    throw new Error(`Failed to complete web authentication ticket (${res.status})`);
  }

  return await res.json();
}
