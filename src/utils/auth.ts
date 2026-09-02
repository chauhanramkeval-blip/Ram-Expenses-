import { UserAccount } from "../types";

export const LOCAL_STORAGE_USERS_KEY = "khata_users_list_v2";
export const LOCAL_STORAGE_CURRENT_USER_KEY = "khata_current_user_v2";
export const LOCAL_STORAGE_AUTH_STATE_KEY = "khata_auth_state_v2";
export const LOCAL_STORAGE_ONBOARDING_KEY = "khata_onboarding_completed_v2";

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "user-ramkeval",
    name: "Ramkeval Chauhan",
    email: "chauhanramkeval@gmail.com",
    phone: "+91 98765 43210",
    upiId: "ramkeval@okhdfcbank",
    avatarColor: "#1A73E8",
    accountType: "Personal",
    joinedDate: "Aug 2024",
    lastLogin: "Today, Active",
    authProvider: "google",
    pin: "1234",
    password: "khata",
    securityQuestion: "What is your favorite city?",
    securityAnswer: "Mumbai",
  },
  {
    id: "user-priya",
    name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    phone: "+91 98111 22334",
    upiId: "priya@oksbi",
    avatarColor: "#E37400",
    accountType: "Household & Family",
    joinedDate: "Sep 2024",
    lastLogin: "Yesterday",
    authProvider: "email",
    pin: "2024",
    password: "priya",
    securityQuestion: "What is your pet's name?",
    securityAnswer: "Bruno",
  },
  {
    id: "user-sharmastore",
    name: "Sharma Kirana Store",
    email: "sharma.kirana@gmail.com",
    phone: "+91 99887 76655",
    upiId: "sharma.store@paytm",
    avatarColor: "#188038",
    accountType: "Business / Shop",
    joinedDate: "Jul 2024",
    lastLogin: "3 days ago",
    authProvider: "phone",
    pin: "9988",
    password: "store",
    securityQuestion: "What is the store registration code?",
    securityAnswer: "12345",
  },
];

export function getStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all loaded users have pin & password defaults
        return parsed.map((u: UserAccount, idx: number) => ({
          ...u,
          pin: u.pin || (idx === 1 ? "2024" : idx === 2 ? "9988" : "1234"),
          password: u.password || "khata",
        }));
      }
    }
  } catch (e) {
    console.error("Error reading stored users", e);
  }
  // Initialize default users
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

export function saveStoredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Error saving users", e);
  }
}

export function getStoredCurrentUser(): UserAccount {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading current user", e);
  }
  const defaultUser = DEFAULT_USERS[0];
  localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(defaultUser));
  return defaultUser;
}

export function isOnboardingCompleted(): boolean {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_ONBOARDING_KEY);
    return val === "true";
  } catch (e) {
    return false;
  }
}

export function setOnboardingCompleted(completed: boolean): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ONBOARDING_KEY, completed ? "true" : "false");
  } catch (e) {
    console.error("Error saving onboarding state", e);
  }
}

export function getStoredAuthState(): boolean {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUTH_STATE_KEY);
    if (raw !== null) {
      return raw === "true";
    }
    // If onboarding hasn't been completed yet, default to false (show signup popup)
    if (!isOnboardingCompleted()) {
      return false;
    }
  } catch (e) {
    console.error("Error reading auth state", e);
  }
  return true;
}

export function setStoredAuthState(isLoggedIn: boolean): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_AUTH_STATE_KEY, isLoggedIn ? "true" : "false");
  } catch (e) {
    console.error("Error setting auth state", e);
  }
}

export function setStoredCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error("Error saving current user", e);
  }
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "U";
  const trimmed = name.trim();
  if (!trimmed) return "U";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getUserEffectivePin(user?: UserAccount | null): string {
  if (!user) return "1234";
  return user.pin || "1234";
}

export function getUserEffectivePassword(user?: UserAccount | null): string {
  if (!user) return "khata";
  return user.password || "khata";
}

export function verifyUserPin(user?: UserAccount | null, enteredPin?: string): boolean {
  if (!enteredPin) return false;
  const expectedPin = getUserEffectivePin(user);
  return enteredPin.trim() === expectedPin.trim();
}

export function verifyUserPassword(user?: UserAccount | null, enteredPassword?: string): boolean {
  if (!enteredPassword) return false;
  const expectedPassword = getUserEffectivePassword(user);
  return (
    enteredPassword.trim().toLowerCase() === expectedPassword.trim().toLowerCase() ||
    enteredPassword.trim() === expectedPassword.trim()
  );
}

