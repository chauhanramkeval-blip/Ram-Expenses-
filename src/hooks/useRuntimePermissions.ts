import { useState, useEffect, useCallback } from "react";
import {
  PermissionType,
  PermissionStateStatus,
  PermissionStatusInfo,
  PermissionFlowState,
} from "../types";
import {
  DECLARED_PERMISSIONS,
  checkRuntimePermission,
  checkAllRuntimePermissions,
  requestRuntimePermission,
} from "../utils/permissionManager";

export function useRuntimePermissions() {
  const [permissions, setPermissions] = useState<Record<PermissionType, PermissionStatusInfo>>({
    camera: {
      type: "camera",
      status: "prompt",
      lastChecked: "",
      canRequest: true,
    },
    microphone: {
      type: "microphone",
      status: "prompt",
      lastChecked: "",
      canRequest: true,
    },
    geolocation: {
      type: "geolocation",
      status: "prompt",
      lastChecked: "",
      canRequest: true,
    },
    notifications: {
      type: "notifications",
      status: "prompt",
      lastChecked: "",
      canRequest: true,
    },
    media: {
      type: "media",
      status: "prompt",
      lastChecked: "",
      canRequest: true,
    },
    storage: {
      type: "storage",
      status: "prompt",
      lastChecked: "",
      canRequest: true,
    },
    sms: {
      type: "sms",
      status: "prompt",
      lastChecked: "",
      canRequest: true,
    },
    call_logs: {
      type: "call_logs",
      status: "prompt",
      lastChecked: "",
      canRequest: true,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [deniedModalOpen, setDeniedModalOpen] = useState(false);
  const [deniedPermissionType, setDeniedPermissionType] = useState<PermissionType | null>(null);
  const [deniedErrorMessage, setDeniedErrorMessage] = useState<string | undefined>();
  const [deniedFallbackCallback, setDeniedFallbackCallback] = useState<(() => void) | undefined>();

  // Refresh all permissions
  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await checkAllRuntimePermissions();
      setPermissions(results);
    } catch (err) {
      console.error("Failed to check runtime permissions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial check and on window focus
  useEffect(() => {
    refreshPermissions();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshPermissions();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [refreshPermissions]);

  /**
   * The 4-Step Runtime Architecture Executor:
   * 1. Declare -> verifies permission is declared
   * 2. Check -> queries current permission state
   * 3. Request -> triggers OS prompt if not granted
   * 4. Handle Result -> on Allow, executes onGranted; on Deny, triggers rationale/settings modal + onDenied fallback
   */
  const executeWithPermission = useCallback(
    async (
      type: PermissionType,
      onGranted: (streamOrData?: any) => void,
      onDeniedFallback?: () => void
    ) => {
      // Step 1: Declare check
      const decl = DECLARED_PERMISSIONS[type];
      if (!decl) {
        console.error(`Permission ${type} is not declared in registry!`);
        return;
      }

      // Step 2: Check current status
      const currentCheck = await checkRuntimePermission(type);
      setPermissions((prev) => ({ ...prev, [type]: currentCheck }));

      if (currentCheck.status === "granted") {
        // Already granted: directly proceed to step 4 (success outcome)
        if (type === "camera" || type === "microphone") {
          // Acquire fresh media stream
          const reqRes = await requestRuntimePermission(type);
          onGranted(reqRes.stream);
        } else if (type === "geolocation") {
          const reqRes = await requestRuntimePermission(type);
          onGranted(reqRes.coordinates);
        } else {
          onGranted();
        }
        return;
      }

      // Step 3: Request (Trigger OS Prompt)
      setIsLoading(true);
      try {
        const reqResult = await requestRuntimePermission(type);

        // Update stored permission status
        const updatedStatus = await checkRuntimePermission(type);
        setPermissions((prev) => ({
          ...prev,
          [type]: {
            ...updatedStatus,
            status: reqResult.status,
          },
        }));

        // Step 4: Handle Result
        if (reqResult.granted) {
          // User clicked "Allow"
          if (type === "camera" || type === "microphone") {
            onGranted(reqResult.stream);
          } else if (type === "geolocation") {
            onGranted(reqResult.coordinates);
          } else {
            onGranted();
          }
        } else {
          // User clicked "Deny" or blocked by OS/browser
          setDeniedPermissionType(type);
          setDeniedErrorMessage(reqResult.error);
          setDeniedFallbackCallback(() => onDeniedFallback);
          setDeniedModalOpen(true);
          if (onDeniedFallback) {
            // Optional callback hook
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setDeniedPermissionType(type);
        setDeniedErrorMessage(msg);
        setDeniedFallbackCallback(() => onDeniedFallback);
        setDeniedModalOpen(true);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const closeDeniedModal = useCallback(() => {
    setDeniedModalOpen(false);
    setDeniedPermissionType(null);
    setDeniedErrorMessage(undefined);
    setDeniedFallbackCallback(undefined);
  }, []);

  return {
    permissions,
    isLoading,
    refreshPermissions,
    executeWithPermission,
    deniedModalOpen,
    deniedPermissionType,
    deniedErrorMessage,
    deniedFallbackCallback,
    closeDeniedModal,
  };
}
