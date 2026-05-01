import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, loginFetch, refreshTokens } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

export type UserRole =
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
  /**
   * True ONLY for the platform-level super-admin.
   * Determined by the role field returned from the API ("Admin" or "PlatformAdmin"),
   * NOT by email comparison.
   * Platform admin users go to /platform-admin, NOT /dashboard.
   * School-side users (including Principal) go to /dashboard.
   */
  isPlatformAdmin: boolean;
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

// Demo users reflecting the correct role structure:
// - "admin" → platform admin (isPlatformAdmin: true, no school-side access)
// - "principal" → school principal (school admin, isPlatformAdmin: false)
const DEMO_USERS: Record<string, User> = {
  admin: {
    id: "usr-001",
    name: "Dr. Sarah Evans",
    email: "admin@escola.com",
    role: "principal", // Placeholder role; isPlatformAdmin=true gates all access
    isPlatformAdmin: true,
  },
  principal: {
    id: "usr-002",
    name: "Mr. David Okonkwo",
    email: "principal@escola.com",
    role: "principal",
    isPlatformAdmin: false,
  },
  teacher: {
    id: "usr-003",
    name: "Mrs. Grace Okafor",
    email: "teacher@escola.com",
    role: "teacher",
    isPlatformAdmin: false,
  },
  admissions: {
    id: "usr-004",
    name: "Ms. Amara Nwosu",
    email: "admissions@escola.com",
    role: "admission_officer",
    isPlatformAdmin: false,
  },
  accounts: {
    id: "usr-005",
    name: "Mr. James Bello",
    email: "accounts@escola.com",
    role: "account_officer",
    isPlatformAdmin: false,
  },
};

// ---- Exact DTO shapes per API spec ----

// NOTE: Login payload uses lowercase "username" (confirmed working in Postman).
type LoginRequest = {
  username: string;
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

/**
 * Determine if a user is the platform admin purely from the API role string.
 * ONLY "superadmin" or "platformadmin" (case-insensitive) → isPlatformAdmin = true.
 * Plain "admin", "Principal", "SchoolAdmin", or any other role → isPlatformAdmin = false.
 * School admins with role "admin" in a school context must NOT be treated as platform admin.
 */
function resolvePlatformAdmin(apiRole: string | undefined): boolean {
  const normalized = (apiRole ?? "").toLowerCase();
  return normalized === "superadmin" || normalized === "platformadmin";
}

/** Normalise API role string → UserRole enum (school-side role keys only) */
function normaliseRole(raw: string | undefined): UserRole {
  const map: Record<string, UserRole> = {
    // Principal is the school admin
    Admin: "principal", // Fallback so platform admin has a valid role shape
    admin: "principal",
    SuperAdmin: "principal",
    superadmin: "principal",
    PlatformAdmin: "principal",
    platformadmin: "principal",
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
  const email = dto.email ?? existingEmail ?? "";
  const isPlatformAdmin = resolvePlatformAdmin(dto.role);
  const role = normaliseRole(dto.role);
  return {
    id: String(dto.id),
    name: dto.name,
    email,
    role,
    avatar: dto.avatar,
    isPlatformAdmin,
  };
}

// Determine post-login redirect based on user
function getLoginRedirect(user: User): string {
  if (user.isPlatformAdmin) return "/platform-admin";
  return "/dashboard";
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
            const parsed = JSON.parse(userStr) as User;
            // Re-derive isPlatformAdmin in case stored value is missing/stale
            const user: User = {
              ...parsed,
              isPlatformAdmin:
                parsed.isPlatformAdmin === true ||
                resolvePlatformAdmin(parsed.role),
            };
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
          console.log(
            "[EscolaUI] /auth/me → role:",
            res.data.role,
            "isPlatformAdmin:",
            user.isPlatformAdmin,
          );
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
        // /auth/me failed (network error etc.) — fall back to localStorage user
        // but re-derive isPlatformAdmin to guard against stale/missing flag
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr) as User;
            // Critical: always re-derive isPlatformAdmin from the stored role
            // so a page reload never silently loses platform admin access
            const isPlatformAdmin =
              parsed.isPlatformAdmin === true ||
              resolvePlatformAdmin(parsed.role);
            const user: User = { ...parsed, isPlatformAdmin };
            console.log(
              "[EscolaUI] Restored from localStorage — isPlatformAdmin:",
              isPlatformAdmin,
              "role:",
              parsed.role,
            );
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

  const login = useCallback(async (username: string, password: string) => {
    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 600));
      const demoUser = DEMO_USERS[username.toLowerCase()];
      if (demoUser && (password === "password123" || password === "123456")) {
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
        return { success: true, redirectTo: getLoginRedirect(demoUser) };
      }
      return {
        success: false,
        error:
          "Invalid credentials. Demo accounts: admin | principal | teacher | admissions | accounts (all use password: 123456 or password123)",
      };
    }

    // Live mode — POST https://escola.doorstepgarage.in/api/auth/login
    // Payload: { username, password } (lowercase "username" — confirmed in Postman)
    const loginPayload: LoginRequest = { username, password };
    try {
      console.log(
        "[EscolaUI] AuthContext.login() called with username:",
        username,
      );
      const res = await loginFetch(username, password);
      if (res.success && res.data) {
        const data = res.data as LoginResponse;
        const { accessToken, refreshToken, user: dto } = data;
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
        console.log(
          "[EscolaUI] Login successful, role:",
          user.role,
          "isPlatformAdmin:",
          user.isPlatformAdmin,
        );
        return { success: true, redirectTo: getLoginRedirect(user) };
      }
      console.error(
        "[EscolaUI] Login failed:",
        res.error,
        "payload was:",
        loginPayload,
      );
      return {
        success: false,
        error: res.error ?? "Login failed. Please check your credentials.",
      };
    } catch (err) {
      console.error("[EscolaUI] Login exception:", err);
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
    // Redirect to login — use window.location to ensure a clean navigation
    // that works regardless of which router context we're in.
    window.location.href = "/login";
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (isDemoMode()) {
      const newToken = `demo-access-token-${Date.now()}`;
      localStorage.setItem("accessToken", newToken);
      setState((s) => ({ ...s, accessToken: newToken }));
      return true;
    }

    // IMPORTANT: Must use refreshTokens() (plain fetch, no auth header).
    // Using api.post() here would attach a Bearer token and cause an infinite 401 loop.
    try {
      const tokens = await refreshTokens();
      if (tokens) {
        setState((s) => ({
          ...s,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }));
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  // Listen for programmatic logout events dispatched from the API client (e.g. 401 cascade)
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [logout]);

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
