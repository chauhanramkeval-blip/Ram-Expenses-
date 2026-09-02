import { UserAccount } from "../types";

export const LOCAL_STORAGE_USERS_KEY = "khata_users_list_v2";
export const LOCAL_STORAGE_CURRENT_USER_KEY = "khata_current_user_v2";
export const LOCAL_STORAGE_AUTH_STATE_KEY = "khata_auth_state_v2";

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
  },
];

export function getStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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

export function getStoredAuthState(): boolean {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUTH_STATE_KEY);
    if (raw !== null) {
      return raw === "true";
    }
  } catch (e) {
    console.error("Error reading auth state", e);
  }
  return true; // Default logged in for seamless start
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

export function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
