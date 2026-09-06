import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, doc, getDocFromServer } from "firebase/firestore";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
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
  oAuthClientId: appletConfig?.oAuthClientId || "",
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
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
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

