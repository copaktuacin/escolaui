import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

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
  /** True only for the platform super-admin (admin@escola.com).
   *  Tenant-level admins share role="admin" but must NOT access /platform-admin/* routes. */
  isPlatformAdmin?: boolean;
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
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: Record<string, User> = {
  admin: {
    id: "usr-001",
    name: "Dr. Sarah Evans",
    email: "admin@escola.com",
    role: "admin",
    isPlatformAdmin: true,
  },
  principal: {
    id: "usr-002",
    name: "Mr. David Okonkwo",
    email: "principal@escola.com",
    role: "principal",
  },
  teacher: {
    id: "usr-003",
    name: "Mrs. Grace Okafor",
    email: "teacher@escola.com",
    role: "teacher",
  },
  admissions: {
    id: "usr-004",
    name: "Ms. Amara Nwosu",
    email: "admissions@escola.com",
    role: "admission_officer",
  },
  accounts: {
    id: "usr-005",
    name: "Mr. James Bello",
    email: "accounts@escola.com",
    role: "account_officer",
  },
};

// ---- Exact DTO shapes per API spec ----

type LoginRequest = {
  userName: string;
  password: string;
};

type AuthUserDto = {
  id: number;
  name: string;
  role?: string;
  email?: string;
  avatar?: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

// Determine post-login redirect based on role
function getLoginRedirect(role: UserRole): string {
  if (role === "admin") return "/platform-admin";
  return "/dashboard";
}

/** Normalise API role string → UserRole enum */
function normaliseRole(raw: string | undefined): UserRole {
  const map: Record<string, UserRole> = {
    Admin: "admin",
    admin: "admin",
    Principal: "principal",
    principal: "principal",
    Teacher: "teacher",
    teacher: "teacher",
    AccountOfficer: "account_officer",
    account_officer: "account_officer",
    Accountant: "accountant",
    accountant: "accountant",
    AdmissionOfficer: "admission_officer",
    admission_officer: "admission_officer",
    Clerk: "clerk",
    clerk: "clerk",
  };
  return map[raw ?? ""] ?? "clerk";
}

/** Map AuthUserDto → internal User */
function dtoToUser(dto: AuthUserDto, existingEmail?: string): User {
  return {
    id: String(dto.id),
    name: dto.name,
    email: dto.email ?? existingEmail ?? "",
    role: normaliseRole(dto.role),
    avatar: dto.avatar,
    isPlatformAdmin: normaliseRole(dto.role) === "admin",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    async function init() {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const userStr = localStorage.getItem("user");

      if (!accessToken) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      if (isDemoMode()) {
        if (userStr) {
          try {
            const user = JSON.parse(userStr) as User;
            setState({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch {
            // fall through to clear
          }
        }
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      // Live mode: validate token with GET /auth/me
      // Response: AuthUserDto { id, name, role?, email?, avatar? }
      try {
        const res = await api.get<AuthUserDto>("/auth/me");
        if (res.success && res.data) {
          const user = dtoToUser(res.data);
          localStorage.setItem("user", JSON.stringify(user));
          setState({
            user,
            accessToken,
            refreshToken: refreshToken ?? null,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          clearStorage();
          setState({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch {
        if (userStr) {
          try {
            const user = JSON.parse(userStr) as User;
            setState({
              user,
              accessToken,
              refreshToken: refreshToken ?? null,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch {
            // fall through
          }
        }
        setState((s) => ({ ...s, isLoading: false }));
      }
    }

    init();
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("escola:logout", handler);
    return () => window.removeEventListener("escola:logout", handler);
  });

  const login = useCallback(async (username: string, password: string) => {
    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 600));
      const demoUser = DEMO_USERS[username.toLowerCase()];
      if (demoUser && password === "password123") {
        const accessToken = `demo-access-token-${Date.now()}`;
        const refreshToken = `demo-refresh-token-${Date.now()}`;
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
        return { success: true, redirectTo: getLoginRedirect(demoUser.role) };
      }
      return {
        success: false,
        error:
          "Invalid credentials. Demo accounts: admin | principal | teacher | admissions | accounts (all use password123)",
      };
    }

    // Live mode — POST /auth/login with { userName, password }
    const loginPayload: LoginRequest = { userName: username, password };
    try {
      const res = await api.post<LoginResponse>("/auth/login", loginPayload);
      if (res.success && res.data) {
        const { accessToken, refreshToken, user: dto } = res.data;
        const user = dtoToUser(dto, dto.email ?? username);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
        setState({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, redirectTo: getLoginRedirect(user.role) };
      }
      return {
        success: false,
        error: res.error ?? "Login failed. Please check your credentials.",
      };
    } catch {
      return {
        success: false,
        error: "Unable to connect to the server. Please try again.",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    if (!isDemoMode()) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        // POST /auth/logout with { refreshToken }
        api
          .post<{ success: boolean }>("/auth/logout", { refreshToken })
          .catch(() => {});
      }
    }
    clearStorage();
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (isDemoMode()) {
      const newToken = `demo-access-token-${Date.now()}`;
      localStorage.setItem("accessToken", newToken);
      setState((s) => ({ ...s, accessToken: newToken }));
      return true;
    }

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;
    try {
      // POST /auth/refresh with { refreshToken } → { accessToken, refreshToken }
      const res = await api.post<RefreshResponse>("/auth/refresh", {
        refreshToken,
      });
      if (res.success && res.data) {
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        setState((s) => ({
          ...s,
          accessToken: res.data!.accessToken,
          refreshToken: res.data!.refreshToken,
        }));
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, refreshAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function clearStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
