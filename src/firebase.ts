import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import appletConfig from "../firebase-applet-config.json";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const LOCAL_STORAGE_CUSTOM_FIREBASE_KEY = "khata_custom_firebase_config_v1";

// Default placeholder config or loaded from provisioning
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: appletConfig?.apiKey || "AIzaSy_YOUR_API_KEY_HERE",
  authDomain: appletConfig?.authDomain || "your-app.firebaseapp.com",
  projectId: appletConfig?.projectId || "your-project-id",
  storageBucket: appletConfig?.storageBucket || "your-app.firebasestorage.app",
  messagingSenderId: appletConfig?.messagingSenderId || "123456789012",
  appId: appletConfig?.appId || "1:123456789012:web:abcdef123456",
  firestoreDatabaseId: appletConfig?.firestoreDatabaseId || "",
};

/**
 * Retrieves the active Firebase configuration (user custom override or default)
 */
export const getActiveFirebaseConfig = (): FirebaseConfig => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_FIREBASE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load custom Firebase config from localStorage", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
};

/**
 * Checks if the configuration has non-placeholder valid values
 */
export const isFirebaseConfigValid = (config?: FirebaseConfig): boolean => {
  const cfg = config || getActiveFirebaseConfig();
  if (!cfg) return false;
  if (!cfg.apiKey || cfg.apiKey.includes("YOUR_API_KEY") || cfg.apiKey.trim() === "") {
    return false;
  }
  if (!cfg.projectId || cfg.projectId.includes("your-project") || cfg.projectId.trim() === "") {
    return false;
  }
  return true;
};

/**
 * Saves custom user credentials
 */
export const saveCustomFirebaseConfig = (config: FirebaseConfig) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_FIREBASE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save custom Firebase config", e);
  }
};

/**
 * Clears custom credentials back to app default
 */
export const resetCustomFirebaseConfig = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_CUSTOM_FIREBASE_KEY);
  } catch (e) {
    console.error("Failed to reset custom Firebase config", e);
  }
};

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let lastInitConfigKey: string = "";

/**
 * Safely initializes and returns Firebase App and Firestore instances without crashing
 */
export const getFirebaseInstances = (): {
  app: FirebaseApp | null;
  db: Firestore | null;
  isValid: boolean;
  error: string | null;
} => {
  const config = getActiveFirebaseConfig();
  const configKey = `${config.projectId}_${config.apiKey}_${config.firestoreDatabaseId || ""}`;

  if (!isFirebaseConfigValid(config)) {
    return {
      app: null,
      db: null,
      isValid: false,
      error: "Firebase credentials are not configured or contain placeholder values.",
    };
  }

  if (cachedApp && cachedDb && lastInitConfigKey === configKey) {
    return { app: cachedApp, db: cachedDb, isValid: true, error: null };
  }

  try {
    const existingApps = getApps();
    let app: FirebaseApp;
    if (existingApps.length > 0) {
      app = getApp();
    } else {
      app = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });
    }

    // Initialize Firestore with specific database ID if available
    let db: Firestore;
    if (config.firestoreDatabaseId && config.firestoreDatabaseId.trim() !== "") {
      db = getFirestore(app, config.firestoreDatabaseId.trim());
    } else {
      db = getFirestore(app);
    }

    cachedApp = app;
    cachedDb = db;
    lastInitConfigKey = configKey;

    return { app, db, isValid: true, error: null };
  } catch (err: any) {
    console.error("Firebase initialization failed safely:", err);
    return {
      app: null,
      db: null,
      isValid: false,
      error: err?.message || "Failed to initialize Firebase connection.",
    };
  }
};

export const getFirestoreDb = (): Firestore | null => {
  const { db } = getFirebaseInstances();
  return db;
};
