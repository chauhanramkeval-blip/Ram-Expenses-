import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, doc, getDocFromServer } from "firebase/firestore";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import appletConfig from "../firebase-applet-config.json";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
}

export const FIREBASE_AUTH_HANDLER_URL = "https://potent-crossbar-wtvkm.firebaseapp.com/__/auth/handler";

const LOCAL_STORAGE_CUSTOM_FIREBASE_KEY = "khata_custom_firebase_config_v1";

// Default standard Firebase configuration
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: appletConfig?.apiKey || "AIzaSyANlA5P0E9CdFAZdU4im_wCEtWCOuh0MiE",
  authDomain: appletConfig?.authDomain || "potent-crossbar-wtvkm.firebaseapp.com",
  projectId: appletConfig?.projectId || "potent-crossbar-wtvkm",
  storageBucket: appletConfig?.storageBucket || "potent-crossbar-wtvkm.firebasestorage.app",
  messagingSenderId: appletConfig?.messagingSenderId || "614702205249",
  appId: appletConfig?.appId || "1:614702205249:web:19b32e4b9710e3d8a979c0",
  firestoreDatabaseId: appletConfig?.firestoreDatabaseId || "ai-studio-khatadailyexpens-0f48481c-7d95-47ea-9afe-1cee316e57ec",
  oAuthClientId: appletConfig?.oAuthClientId || "614702205249-g9lsbllrcsog7m56pr3g2frkhj9qid78.apps.googleusercontent.com",
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
        return {
          ...DEFAULT_FIREBASE_CONFIG,
          ...parsed,
          authDomain: DEFAULT_FIREBASE_CONFIG.authDomain,
        };
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
let cachedAuth: Auth | null = null;
let lastInitConfigKey: string = "";

/**
 * Safely initializes and returns Firebase App, Firestore and Auth instances without crashing
 */
export const getFirebaseInstances = (): {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
  isValid: boolean;
  error: string | null;
} => {
  const config = getActiveFirebaseConfig();
  const configKey = `${config.projectId}_${config.apiKey}_${config.firestoreDatabaseId || ""}`;

  if (!isFirebaseConfigValid(config)) {
    return {
      app: null,
      db: null,
      auth: null,
      isValid: false,
      error: "Firebase credentials are not configured or contain placeholder values.",
    };
  }

  if (cachedApp && cachedDb && cachedAuth && lastInitConfigKey === configKey) {
    return { app: cachedApp, db: cachedDb, auth: cachedAuth, isValid: true, error: null };
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

    const auth = getAuth(app);

    cachedApp = app;
    cachedDb = db;
    cachedAuth = auth;
    lastInitConfigKey = configKey;

    return { app, db, auth, isValid: true, error: null };
  } catch (err: any) {
    console.error("Firebase initialization failed safely:", err);
    return {
      app: null,
      db: null,
      auth: null,
      isValid: false,
      error: err?.message || "Failed to initialize Firebase connection.",
    };
  }
};

export const getFirestoreDb = (): Firestore | null => {
  const { db } = getFirebaseInstances();
  return db;
};

export const getFirebaseAuth = (): Auth | null => {
  const { auth } = getFirebaseInstances();
  return auth;
};

/**
 * Builds the standard Google Auth Provider configured for clean Web-based authentication
 */
export const createGoogleAuthProvider = (): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });
  return provider;
};

/**
 * Sign in using Firebase Google Auth with popup
 */
export const signInWithGooglePopup = async (): Promise<{
  success: boolean;
  firebaseUser?: FirebaseUser;
  error?: string;
}> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, error: "Firebase Authentication is not ready." };
  }
  try {
    const provider = createGoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { success: true, firebaseUser: result.user };
  } catch (err: any) {
    console.warn("Google Sign-In Popup prompt:", err);
    return {
      success: false,
      error: err?.message || "Google sign-in popup was cancelled or failed.",
    };
  }
};

/**
 * Sign in using standard Web-based OAuth redirect (fallback)
 */
export const signInWithGoogleRedirect = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, error: "Firebase Authentication is not ready." };
  }
  try {
    const provider = createGoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    return { success: true };
  } catch (err: any) {
    console.warn("Google Sign-In redirect error:", err);
    return {
      success: false,
      error: err?.message || "Google sign-in redirect failed.",
    };
  }
};

/**
 * Checks for any pending OAuth redirect result after page load
 */
export const checkGoogleRedirectResult = async (): Promise<{
  success: boolean;
  firebaseUser?: FirebaseUser;
  error?: string;
}> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, error: "Firebase Authentication is not ready." };
  }
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return { success: true, firebaseUser: result.user };
    }
    return { success: false };
  } catch (err: any) {
    console.warn("Google redirect check notice:", err);
    return {
      success: false,
      error: err?.message || "Redirect authentication could not be completed.",
    };
  }
};

/**
 * Sign out of Firebase Auth
 */
export const signOutFirebase = async (): Promise<boolean> => {
  const auth = getFirebaseAuth();
  if (!auth) return true;
  try {
    await fbSignOut(auth);
    return true;
  } catch (err) {
    console.error("Firebase signOut error", err);
    return false;
  }
};

/**
 * Subscribe to persistent Firebase Auth state changes
 */
export const subscribeToFirebaseAuthState = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * Test server connection to Firestore
 */
export async function testFirestoreConnection() {
  const db = getFirestoreDb();
  if (!db) return;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore connection check: Client offline.");
    }
  }
}

