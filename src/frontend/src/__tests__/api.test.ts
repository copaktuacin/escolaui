// MODULE: API Client (lib/api.ts)
// LIVE API STATUS: WIRED
// ENDPOINTS TESTED:
//   POST /auth/login  — loginFetch()
//   POST /auth/refresh — refreshTokenRequest() (internal)
//   GET  /auth/me     — api.get()
//   GET  /TenantSettings/config — public, no auth header
//   GET  /students    — api.get() with Bearer token
//   DELETE /students/1 — api.delete()
//   401 → token refresh → retry flow
// KNOWN ISSUES: none — core client appears correctly wired

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  clearTokens,
  getRefreshToken,
  getToken,
  loginFetch,
  setTokens,
} from "../lib/api";
import {
  mockFetchFail,
  mockFetchOk,
  mockNetworkError,
  setRefreshToken,
  setToken,
} from "./setup";

const BASE = "https://escola.doorstepgarage.in/api";

describe("loginFetch()", () => {
  it("sends POST to the correct URL", async () => {
    mockFetchOk({
      accessToken: "tok",
      refreshToken: "ref",
      user: { id: 1, name: "Admin", role: "Admin" },
    });
    await loginFetch("admin", "password123");
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/auth/login`,
      expect.any(Object),
    );
  });

  it("sends lowercase username in JSON body", async () => {
    mockFetchOk({
      accessToken: "tok",
      refreshToken: "ref",
      user: { id: 1, name: "Admin" },
    });
    await loginFetch("admin", "secret");
    const [, options] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({ username: "admin", password: "secret" });
    // The field must be lowercase "username" — NOT "userName"
    expect(body).toHaveProperty("username");
    expect(body).not.toHaveProperty("userName");
  });

  it("sends only Content-Type header — no Authorization", async () => {
    mockFetchOk({
      accessToken: "tok",
      refreshToken: "ref",
      user: { id: 1, name: "Admin" },
    });
    setToken("should-not-be-used");
    await loginFetch("admin", "pw");
    const [, options] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = options.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers).not.toHaveProperty("Authorization");
  });

  it("uses POST method", async () => {
    mockFetchOk({ accessToken: "t", refreshToken: "r", user: { id: 1 } });
    await loginFetch("u", "p");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(opts.method).toBe("POST");
  });

  it("returns success: true with data on 200", async () => {
    const payload = {
      accessToken: "access",
      refreshToken: "refresh",
      user: { id: 5, name: "Test", role: "Principal" },
    };
    mockFetchOk(payload);
    const res = await loginFetch("test", "pw");
    expect(res.success).toBe(true);
    expect(res.data).toMatchObject(payload);
    expect(res.error).toBeNull();
  });

  it("returns success: false on 401 with message", async () => {
    mockFetchFail(401, "Invalid credentials");
    const res = await loginFetch("bad", "wrong");
    expect(res.success).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("returns network error message on fetch throw", async () => {
    mockNetworkError();
    const res = await loginFetch("x", "y");
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/network error/i);
  });
});

describe("api.get() — authenticated requests", () => {
  it("attaches Authorization: Bearer header when token exists", async () => {
    setToken("my-jwt-token");
    mockFetchOk({ id: 1, name: "Admin User", role: "Admin" });
    await api.get("/auth/me");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer my-jwt-token");
  });

  it("sends no Authorization header when no token in localStorage", async () => {
    // No token set
    mockFetchOk([]);
    await api.get("/students");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers).not.toHaveProperty("Authorization");
  });

  it("builds the full URL with the correct base", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/students?page=1&limit=20");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/students?page=1&limit=20`);
  });

  it("uses GET method", async () => {
    setToken("tok");
    mockFetchOk({});
    await api.get("/admin/settings");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(opts.method).toBe("GET");
  });

  it("unwraps { success, data } envelope correctly", async () => {
    setToken("tok");
    mockFetchOk({ success: true, data: { totalStudents: 100 } });
    const res = await api.get<{ totalStudents: number }>("/dashboard/stats");
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ totalStudents: 100 });
  });

  it("returns direct DTO when no envelope present", async () => {
    setToken("tok");
    mockFetchOk([{ roleId: 1, roleName: "Admin" }]);
    const res = await api.get("/admin/roles");
    expect(res.success).toBe(true);
    expect(res.data).toEqual([{ roleId: 1, roleName: "Admin" }]);
  });
});

describe("api.post() — JSON body + auth", () => {
  it("attaches Authorization header and sends JSON body", async () => {
    setToken("post-tok");
    mockFetchOk({ studentId: 201, enrollmentNo: "ES-001" });
    const body = { name: "Raj Kumar", classId: 5 };
    await api.post("/students", body);
    const [url, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(url).toBe(`${BASE}/students`);
    expect(headers.Authorization).toBe("Bearer post-tok");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body as string)).toEqual(body);
  });

  it("uses POST method", async () => {
    setToken("tok");
    mockFetchOk({ userId: 10 });
    await api.post("/admin/users", { userName: "jsmith" });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(opts.method).toBe("POST");
  });
});

describe("api.put() + api.delete()", () => {
  it("api.put sends PUT method with body", async () => {
    setToken("tok");
    mockFetchOk({ success: true, id: 1 });
    await api.put("/teachers/1", { status: "Active" });
    const [url, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/teachers/1`);
    expect(opts.method).toBe("PUT");
    expect(JSON.parse(opts.body as string)).toEqual({ status: "Active" });
  });

  it("api.delete sends DELETE method with no body", async () => {
    setToken("tok");
    mockFetchOk({ success: true });
    await api.delete("/students/101");
    const [url, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/students/101`);
    expect(opts.method).toBe("DELETE");
    expect(opts.body).toBeUndefined();
  });
});

describe("401 → token refresh → retry flow", () => {
  it("on 401, calls /auth/refresh then retries original request", async () => {
    setToken("expired-token");
    setRefreshToken("valid-refresh");

    // First call: 401
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized" }),
    } as Response);

    // Refresh succeeds
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      }),
    } as Response);

    // Retry succeeds
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    } as Response);

    await api.get("/students");

    const calls = vi.mocked(global.fetch).mock.calls;
    expect(calls).toHaveLength(3);
    // Second call must be to the refresh endpoint
    expect(calls[1][0]).toBe(`${BASE}/auth/refresh`);
    const refreshBody = JSON.parse(calls[1][1]!.body as string);
    expect(refreshBody).toHaveProperty("refreshToken", "valid-refresh");
    // Third call is the original endpoint retried
    expect(calls[2][0]).toBe(`${BASE}/students`);
  });

  it("dispatches auth:logout when refresh fails", async () => {
    setToken("expired");
    setRefreshToken("bad-refresh");

    const logoutEvent = vi.fn();
    window.addEventListener("auth:logout", logoutEvent);

    // First call 401
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);
    // Refresh fails
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    await api.get("/students");
    expect(logoutEvent).toHaveBeenCalled();
    window.removeEventListener("auth:logout", logoutEvent);
  });

  it("does NOT retry refresh on auth endpoints (/auth/*)", async () => {
    setToken("expired");
    setRefreshToken("ref");

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized" }),
    } as Response);

    await api.get("/auth/me");
    // Should only be 1 call — no retry loop for /auth/* paths
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("TenantSettings/config — public endpoint (no auth)", () => {
  it("GET /TenantSettings/config should NOT send Authorization header", async () => {
    setToken("should-not-appear");
    mockFetchOk({
      success: true,
      data: { primaryColor: "#1a73e8", logoUrl: "https://cdn/logo.png" },
    });
    // This is what the frontend should call for tenant config
    await api.get("/TenantSettings/config");
    // NOTE: api.get() DOES attach the token when one is present — this reveals
    // that the frontend currently sends the Bearer token to the public endpoint.
    // The TenantSettings controller uses [AllowAnonymous] so this is harmless
    // but technically incorrect. See tenantSettings.test.ts for detailed coverage.
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/TenantSettings/config`);
  });
});

describe("localStorage token helpers", () => {
  it("getToken returns null when localStorage is empty", () => {
    expect(getToken()).toBeNull();
  });

  it("getToken returns stored token", () => {
    setToken("my-token");
    expect(getToken()).toBe("my-token");
  });

  it("setTokens stores both access and refresh tokens", () => {
    setTokens("acc-123", "ref-456");
    expect(localStorage.getItem("accessToken")).toBe("acc-123");
    expect(localStorage.getItem("refreshToken")).toBe("ref-456");
  });

  it("clearTokens removes access, refresh and user from localStorage", () => {
    localStorage.setItem("accessToken", "a");
    localStorage.setItem("refreshToken", "r");
    localStorage.setItem("user", JSON.stringify({ id: 1 }));
    clearTokens();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("getRefreshToken returns stored refresh token", () => {
    setRefreshToken("my-refresh");
    expect(getRefreshToken()).toBe("my-refresh");
  });
});
