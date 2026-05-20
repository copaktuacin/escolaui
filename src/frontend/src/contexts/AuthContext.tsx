import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, clearTokens, loginFetch, refreshTokens } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole =
  | "principal"
  | "teacher"
  | "account_officer"
  | "admission_officer"
  | "clerk"
  | "accountant";

type User = {
  id: string;
  /** Display name from API — never hardcoded */
  name: string;
  /** Login username from the form — always preserved */
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  /**
   * True ONLY when API role is "superadmin" or "platformadmin" (case-insensitive).
   * Platform admin users go to /platform-admin.
   * School-side users (Principal etc.) go to /dashboard.
   */
  isPlatformAdmin: boolean;
  /** TenantId / SchoolId from login response */
  tenantId?: string | null;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * True only for platform/super admin — case-insensitive.
 * NEVER treat plain "admin", "principal", or school roles as platform admin.
 */
function resolvePlatformAdmin(role: string | undefined): boolean {
  const r = (role ?? "").toLowerCase();
  return r === "superadmin" || r === "platformadmin";
}

/** Normalise API role string → UserRole (school-side) */
function normaliseRole(raw: string | undefined): UserRole {
  const map: Record<string, UserRole> = {
    Admin: "principal",
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

/** Parse any raw API response object into a User. */
function parseUserFromResponse(
  raw: Record<string, unknown>,
  loginUsername: string,
): User {
  // The API may return the user under .user, .User, .data, .Data, or at root
  const userObj: Record<string, unknown> =
    (raw.user as Record<string, unknown>) ??
    (raw.User as Record<string, unknown>) ??
    (raw.data as Record<string, unknown>) ??
    (raw.Data as Record<string, unknown>) ??
    raw;

  // Extract ID
  const id = String(
    userObj.id ?? userObj.Id ?? userObj.userId ?? userObj.UserId ?? 0,
  );

  // Extract role
  const rawRole = String(
    userObj.role ?? userObj.Role ?? userObj.userRole ?? userObj.UserRole ?? "",
  );

  // Extract tenantId
  const rawTenantId =
    userObj.tenantId ??
    userObj.TenantId ??
    userObj.schoolId ??
    userObj.SchoolId;
  const tenantId =
    rawTenantId !== undefined && rawTenantId !== null
      ? String(rawTenantId)
      : null;

  // Extract display name — never hardcode; fall back to login username
  const GENERIC = new Set(["user", "unknown", ""]);
  const rawName = String(
    userObj.displayName ??
      userObj.DisplayName ??
      userObj.fullName ??
      userObj.FullName ??
      userObj.name ??
      userObj.Name ??
      "",
  ).trim();
  const name = GENERIC.has(rawName.toLowerCase())
    ? loginUsername
    : rawName || loginUsername;

  // Extract email
  const email = String(
    userObj.email ?? userObj.Email ?? userObj.username ?? "",
  );

  const isPlatformAdmin = resolvePlatformAdmin(rawRole);
  const role = normaliseRole(rawRole);

  return {
    id,
    name,
    username: loginUsername,
    email,
    role,
    avatar: userObj.avatar as string | undefined,
    isPlatformAdmin,
    tenantId,
  };
}

function getLoginRedirect(user: User): string {
  return user.isPlatformAdmin ? "/platform-admin" : "/dashboard";
}

function clearStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // On mount: restore session from localStorage, validate with /auth/me
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
            const user: User = {
              ...parsed,
              isPlatformAdmin:
                parsed.isPlatformAdmin === true ||
                resolvePlatformAdmin(parsed.role),
            };
            setState({
              user,
              accessToken,
              refreshToken: refreshToken ?? null,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch {
            /* ignore */
          }
        }
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      // Live mode: validate via GET /auth/me
      try {
        const res = await api.get<Record<string, unknown>>("/auth/me");
        if (res.success && res.data) {
          // Re-parse from /auth/me to get fresh name/role
          const storedUsername = userStr
            ? (JSON.parse(userStr) as User).username
            : "";
          const user = parseUserFromResponse(res.data, storedUsername);
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
        // Network failure — restore from localStorage but re-derive isPlatformAdmin
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr) as User;
            const isPlatformAdmin =
              parsed.isPlatformAdmin === true ||
              resolvePlatformAdmin(parsed.role);
            const user: User = { ...parsed, isPlatformAdmin };
            setState({
              user,
              accessToken,
              refreshToken: refreshToken ?? null,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch {
            /* ignore */
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
      // In demo mode there is no real user DB — build a minimal user from
      // the supplied username so the UI is always fully dynamic.
      const DEMO_ROLE_MAP: Record<string, UserRole> = {
        admin: "principal",
        principal: "principal",
        teacher: "teacher",
        admissions: "admission_officer",
        accounts: "account_officer",
      };
      const isAdmin = username.toLowerCase() === "admin";
      const role: UserRole = DEMO_ROLE_MAP[username.toLowerCase()] ?? "clerk";
      if (password === "password123" || password === "123456") {
        const demoUser: User = {
          id: `demo-${username}`,
          name: username,
          username,
          email: `${username}@escola.local`,
          role,
          isPlatformAdmin: isAdmin,
          tenantId: isAdmin ? null : "demo-tenant",
        };
        const accessToken = `demo-access-${Date.now()}`;
        const refreshToken = `demo-refresh-${Date.now()}`;
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
          "Invalid credentials. Demo: admin/principal/teacher/admissions/accounts with password123",
      };
    }

    // Live mode
    const res = await loginFetch(username, password);
    if (res.success && res.data) {
      const raw = res.data as Record<string, unknown>;
      const user = parseUserFromResponse(raw, username);

      // Extract tokens — handle both flat and nested shapes
      const at =
        (raw.accessToken as string | undefined) ??
        ((raw.data as Record<string, unknown> | undefined)?.accessToken as
          | string
          | undefined) ??
        "";
      const rt =
        (raw.refreshToken as string | undefined) ??
        ((raw.data as Record<string, unknown> | undefined)?.refreshToken as
          | string
          | undefined) ??
        "";

      if (at) {
        localStorage.setItem("accessToken", at);
        localStorage.setItem("refreshToken", rt);
      }
      localStorage.setItem("user", JSON.stringify(user));
      setState({
        user,
        accessToken: at,
        refreshToken: rt,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true, redirectTo: getLoginRedirect(user) };
    }

    return {
      success: false,
      error: res.error ?? "Login failed. Please check your credentials.",
    };
  }, []);

  const logout = useCallback(async () => {
    if (!isDemoMode()) {
      const rt = localStorage.getItem("refreshToken");
      if (rt) {
        api.post("/auth/logout", { refreshToken: rt }).catch(() => {});
      }
    }
    clearTokens();
    clearStorage();
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    window.location.href = "/login";
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (isDemoMode()) {
      const t = `demo-access-${Date.now()}`;
      localStorage.setItem("accessToken", t);
      setState((s) => ({ ...s, accessToken: t }));
      return true;
    }
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
      /* ignore */
    }
    return false;
  }, []);

  // Listen for 401-cascade logout events from the API client
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
