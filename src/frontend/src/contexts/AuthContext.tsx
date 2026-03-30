import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

export type UserRole =
  | "admin"
  | "principal"
  | "teacher"
  | "account_officer"
  | "admission_officer"
  | "clerk"
  | "accountant";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

type AuthContextType = AuthState & {
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: Record<string, User> = {
  "admin@escola.com": {
    id: "usr-001",
    name: "Dr. Sarah Evans",
    email: "admin@escola.com",
    role: "admin",
  },
  "principal@escola.com": {
    id: "usr-002",
    name: "Mr. David Okonkwo",
    email: "principal@escola.com",
    role: "principal",
  },
  "teacher@escola.com": {
    id: "usr-003",
    name: "Mrs. Grace Okafor",
    email: "teacher@escola.com",
    role: "teacher",
  },
  "admissions@escola.com": {
    id: "usr-004",
    name: "Ms. Amara Nwosu",
    email: "admissions@escola.com",
    role: "admission_officer",
  },
  "accounts@escola.com": {
    id: "usr-005",
    name: "Mr. James Bello",
    email: "accounts@escola.com",
    role: "account_officer",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userStr = localStorage.getItem("user");
    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("escola:logout", handler);
    return () => window.removeEventListener("escola:logout", handler);
  });

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 800));

    const demoUser = DEMO_USERS[email.toLowerCase()];
    if (demoUser && password === "password123") {
      const accessToken = `mock-access-token-${Date.now()}`;
      const refreshToken = `mock-refresh-token-${Date.now()}`;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(demoUser));
      setState({
        user: demoUser,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    }
    return {
      success: false,
      error:
        "Invalid credentials. Demo accounts: admin@escola.com | principal@escola.com | teacher@escola.com | admissions@escola.com | accounts@escola.com (all use password123)",
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;
    const newToken = `mock-access-token-${Date.now()}`;
    localStorage.setItem("accessToken", newToken);
    setState((s) => ({ ...s, accessToken: newToken }));
    return true;
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, refreshAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
