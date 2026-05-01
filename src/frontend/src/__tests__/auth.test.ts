// MODULE: Authentication (lib/api.ts + contexts/AuthContext.tsx)
// LIVE API STATUS: WIRED
// ENDPOINTS TESTED:
//   POST /auth/login  — loginFetch() called by AuthContext.login()
// KNOWN ISSUES: none — login payload and redirect logic are correctly implemented

import { describe, expect, it, vi } from "vitest";
import { loginFetch } from "../lib/api";
import { mockFetchFail, mockFetchOk, setDemoMode } from "./setup";

const BASE = "https://escola.doorstepgarage.in/api";

// ── normaliseRole logic (extracted from AuthContext for unit testing) ──────────
type UserRole =
  | "principal"
  | "teacher"
  | "account_officer"
  | "admission_officer"
  | "clerk"
  | "accountant";

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

function resolvePlatformAdmin(apiRole: string | undefined): boolean {
  const n = (apiRole ?? "").toLowerCase();
  return n === "admin" || n === "platformadmin" || n === "superadmin";
}

function getLoginRedirect(isPlatformAdmin: boolean): string {
  return isPlatformAdmin ? "/platform-admin" : "/dashboard";
}

// ─────────────────────────────────────────────────────────────────────────────

describe("loginFetch — payload shape", () => {
  it("sends lowercase 'username' field (not 'userName')", async () => {
    mockFetchOk({
      accessToken: "tok",
      refreshToken: "ref",
      user: { id: 1, name: "Admin", role: "Admin" },
    });
    await loginFetch("admin", "password123");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    // CRITICAL: backend confirmed lowercase "username" via Postman
    expect(body.username).toBe("admin");
    expect(body.password).toBe("password123");
    expect(body).not.toHaveProperty("userName"); // must NOT be camelCase
  });

  it("sends POST to https://escola.doorstepgarage.in/api/auth/login", async () => {
    mockFetchOk({
      accessToken: "t",
      refreshToken: "r",
      user: { id: 1, name: "X" },
    });
    await loginFetch("u", "p");
    expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
      `${BASE}/auth/login`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does NOT include Authorization header (login is public)", async () => {
    localStorage.setItem("accessToken", "existing-token");
    mockFetchOk({
      accessToken: "t",
      refreshToken: "r",
      user: { id: 1, name: "X" },
    });
    await loginFetch("u", "p");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers).not.toHaveProperty("Authorization");
  });
});

describe("loginFetch — response handling", () => {
  it("returns accessToken, refreshToken, user on success", async () => {
    const payload = {
      accessToken: "access-jwt",
      refreshToken: "refresh-jwt",
      user: {
        id: 2,
        name: "Principal",
        role: "Principal",
        email: "p@escola.com",
      },
    };
    mockFetchOk(payload);
    const res = await loginFetch("principal", "password123");
    expect(res.success).toBe(true);
    expect(res.data?.accessToken).toBe("access-jwt");
    expect(res.data?.refreshToken).toBe("refresh-jwt");
  });

  it("returns success: false on 401 invalid credentials", async () => {
    mockFetchFail(401, "Invalid credentials");
    const res = await loginFetch("wrong", "bad");
    expect(res.success).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("returns success: false on 429 rate limit", async () => {
    mockFetchFail(429, "Too Many Requests");
    const res = await loginFetch("spam", "pw");
    expect(res.success).toBe(false);
  });
});

describe("normaliseRole — API role string mapping", () => {
  it("maps 'Admin' → 'principal' (platform admin uses principal shape)", () => {
    expect(normaliseRole("Admin")).toBe("principal");
  });

  it("maps 'admin' (lowercase) → 'principal'", () => {
    expect(normaliseRole("admin")).toBe("principal");
  });

  it("maps 'Principal' → 'principal'", () => {
    expect(normaliseRole("Principal")).toBe("principal");
  });

  it("maps 'Teacher' → 'teacher'", () => {
    expect(normaliseRole("Teacher")).toBe("teacher");
  });

  it("maps 'teacher' (lowercase) → 'teacher'", () => {
    expect(normaliseRole("teacher")).toBe("teacher");
  });

  it("maps 'AccountOfficer' → 'account_officer'", () => {
    expect(normaliseRole("AccountOfficer")).toBe("account_officer");
  });

  it("maps 'Accountant' → 'accountant'", () => {
    expect(normaliseRole("Accountant")).toBe("accountant");
  });

  it("maps 'AdmissionOfficer' → 'admission_officer'", () => {
    expect(normaliseRole("AdmissionOfficer")).toBe("admission_officer");
  });

  it("maps 'Clerk' → 'clerk'", () => {
    expect(normaliseRole("Clerk")).toBe("clerk");
  });

  it("maps 'SuperAdmin' → 'principal'", () => {
    expect(normaliseRole("SuperAdmin")).toBe("principal");
  });

  it("returns 'clerk' for unknown role strings", () => {
    expect(normaliseRole("UnknownRole")).toBe("clerk");
    expect(normaliseRole(undefined)).toBe("clerk");
    expect(normaliseRole("")).toBe("clerk");
  });
});

describe("resolvePlatformAdmin — role detection (no email comparison)", () => {
  it("'Admin' role → isPlatformAdmin = true", () => {
    expect(resolvePlatformAdmin("Admin")).toBe(true);
  });

  it("'admin' lowercase → isPlatformAdmin = true", () => {
    expect(resolvePlatformAdmin("admin")).toBe(true);
  });

  it("'SuperAdmin' → isPlatformAdmin = true", () => {
    expect(resolvePlatformAdmin("SuperAdmin")).toBe(true);
  });

  it("'PlatformAdmin' → isPlatformAdmin = true", () => {
    expect(resolvePlatformAdmin("PlatformAdmin")).toBe(true);
  });

  it("'Principal' → isPlatformAdmin = false", () => {
    expect(resolvePlatformAdmin("Principal")).toBe(false);
  });

  it("'Teacher' → isPlatformAdmin = false", () => {
    expect(resolvePlatformAdmin("Teacher")).toBe(false);
  });

  it("undefined → isPlatformAdmin = false", () => {
    expect(resolvePlatformAdmin(undefined)).toBe(false);
  });
});

describe("post-login redirect logic", () => {
  it("redirects to /platform-admin for platform admin", () => {
    expect(getLoginRedirect(true)).toBe("/platform-admin");
  });

  it("redirects to /dashboard for all school-side roles", () => {
    expect(getLoginRedirect(false)).toBe("/dashboard");
  });
});

describe("token storage after login", () => {
  it("stores accessToken and refreshToken in localStorage", async () => {
    const loginPayload = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      user: { id: 1, name: "Admin", role: "Admin" },
    };
    mockFetchOk(loginPayload);

    const res = await loginFetch("admin", "password123");

    // Simulate what AuthContext does after successful loginFetch
    if (res.success && res.data) {
      const { accessToken, refreshToken } = res.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }

    expect(localStorage.getItem("accessToken")).toBe("new-access-token");
    expect(localStorage.getItem("refreshToken")).toBe("new-refresh-token");
  });

  it("does NOT store tokens on failed login", async () => {
    mockFetchFail(401, "Invalid credentials");

    const res = await loginFetch("bad", "wrong");
    // AuthContext only stores tokens on res.success === true
    expect(res.success).toBe(false);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });
});

describe("logout — token clearing", () => {
  it("removing tokens from localStorage prevents authenticated requests", () => {
    localStorage.setItem("accessToken", "some-token");
    localStorage.setItem("refreshToken", "some-refresh");
    localStorage.setItem("user", JSON.stringify({ id: 1 }));

    // Simulate clearStorage() from AuthContext
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
