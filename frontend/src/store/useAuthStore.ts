import { create } from "zustand";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string | null;
  avatar: string | null;
  cover?: string | null;
  isVerified: boolean;
  isOnboarded: boolean;
  bio?: string | null;
  role?: string | null;
  location?: string | null;
  skills?: string | null;
  socialLinks?: { platform: string; url: string }[] | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start true while we check session
  setAuth: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout fetch error:", error);
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  checkAuth: async () => {
    try {
      let res = await fetch("/api/auth/me");
      
      // If unauthorized, try to refresh
      if (res.status === 401) {
        const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
        if (refreshRes.ok) {
          // Retry me
          res = await fetch("/api/auth/me");
        } else {
          // Refresh failed, clear session
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
      }

      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
