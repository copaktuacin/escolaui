// API client for EscolaUI
//
// Single base URL for ALL endpoints (auth + data):
//   https://escola.doorstepgarage.in/api
//
// Login payload uses lowercase "username" (confirmed working in Postman).

const API_BASE_URL = "https://escola.doorstepgarage.in/api";

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: PaginatedMeta;
};

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginatedMeta;
};

const ERROR_CODES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  422: "Validation Error",
  429: "Too Many Requests",
  500: "Server Error",
};

export function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
}

export function clearTokens(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

/**
 * Dedicated login fetch — bypasses the generic request() wrapper.
 * - Uses API_BASE_URL: POST https://escola.doorstepgarage.in/api/auth/login
 * - Sends ONLY Content-Type header (no Authorization)
 * - Payload uses lowercase "username" (confirmed working in Postman)
 */
export async function loginFetch(
  username: string,
  password: string,
): Promise<
  ApiResponse<{ accessToken: string; refreshToken: string; user: unknown }>
> {
  const url = `${API_BASE_URL}/auth/login`;
  const body = JSON.stringify({ username, password });

  console.log("[EscolaUI] LOGIN →", url);
  console.log("[EscolaUI] LOGIN payload:", { username, password: "***" });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (err) {
    console.error("[EscolaUI] LOGIN network error:", err);
    return {
      success: false,
      data: null,
      error: "Network error — unable to reach the server.",
    };
  }

  console.log("[EscolaUI] LOGIN response status:", res.status);

  if (!res.ok) {
    let errMsg = ERROR_CODES[res.status] || `HTTP ${res.status}`;
    try {
      const json = await res.json();
      console.error("[EscolaUI] LOGIN error body:", json);
      errMsg = json.message || json.error || errMsg;
    } catch {
      // no body
    }
    return { success: false, data: null, error: errMsg };
  }

  try {
    const json = await res.json();
    console.log("[EscolaUI] LOGIN success, user:", json?.user);
    return { success: true, data: json, error: null };
  } catch (err) {
    console.error("[EscolaUI] LOGIN JSON parse error:", err);
    return {
      success: false,
      data: null,
      error: "Invalid response from server.",
    };
  }
}

/**
 * Plain-fetch token refresh — NO Authorization header.
 * Exported so AuthContext can call it directly without going through api.post().
 */
export async function refreshTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const storedRefreshToken = getRefreshToken();
  if (!storedRefreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const newAccessToken: string | undefined =
      json.accessToken ?? json.data?.accessToken;
    const newRefreshToken: string | undefined =
      json.refreshToken ?? json.data?.refreshToken;
    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
      if (newRefreshToken)
        localStorage.setItem("refreshToken", newRefreshToken);
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken ?? storedRefreshToken,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function refreshTokenRequest(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const newAccessToken: string | undefined =
      json.accessToken ?? json.data?.accessToken;
    const newRefreshToken: string | undefined =
      json.refreshToken ?? json.data?.refreshToken;
    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
      if (newRefreshToken)
        localStorage.setItem("refreshToken", newRefreshToken);
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generic request() for all authenticated endpoints.
 * Attaches Bearer token; retries once after token refresh on 401.
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = true,
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Debug logging: always log URL, token presence, and method for admin paths
  const isAdminPath =
    path.includes("/TenantSettings/admin/") || path.includes("/admin/tenants");
  if (isAdminPath || !token) {
    console.log(
      `[EscolaUI] API ${method} ${API_BASE_URL}${path}`,
      token ? "HAS_TOKEN" : "NO_TOKEN",
    );
  }
  if (!token && isAdminPath) {
    console.warn(
      "[EscolaUI] WARNING: Admin API call with NO access token — request will be rejected by server.",
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return {
      success: false,
      data: null,
      error: "Network error — unable to reach the server.",
    };
  }

  // Log response status for admin paths or errors
  if (isAdminPath || !res.ok) {
    console.log(`[EscolaUI] API ${method} ${path} → HTTP ${res.status}`);
  }

  if (res.status === 401 && retry && !path.startsWith("/auth/")) {
    console.log(
      "[EscolaUI] 401 received — attempting token refresh for:",
      path,
    );
    const newToken = await refreshTokenRequest();
    if (newToken) {
      console.log("[EscolaUI] Token refreshed, retrying:", path);
      return request<T>(method, path, body, false);
    }
    console.warn("[EscolaUI] Token refresh failed — logging out");
    clearTokens();
    window.dispatchEvent(new Event("auth:logout"));
    return { success: false, data: null, error: ERROR_CODES[401] };
  }

  // 403: log full details to help diagnose token/role issues
  if (res.status === 403) {
    console.error(
      `[EscolaUI] 403 Forbidden on ${method} ${path}.`,
      token ? "Token WAS sent." : "NO TOKEN was sent.",
      "Check that the token belongs to a SuperAdmin user and has not expired.",
    );
    const is403AdminPath = isAdminPath;
    const msg403 = is403AdminPath
      ? "Access denied — the server rejected the request (403). Check browser console for debug info."
      : "Forbidden — you do not have permission to perform this action.";
    try {
      const json = await res.json();
      console.error("[EscolaUI] 403 response body:", json);
      return {
        success: false,
        data: null,
        error: json.message || json.title || msg403,
      };
    } catch {
      return { success: false, data: null, error: msg403 };
    }
  }

  if (!res.ok) {
    const errorMsg = ERROR_CODES[res.status] || `HTTP ${res.status}`;
    try {
      const json = await res.json();
      const detail =
        json.message || json.title || json.error || JSON.stringify(json);
      return {
        success: false,
        data: null,
        error: `HTTP ${res.status}: ${detail}`,
      };
    } catch {
      return {
        success: false,
        data: null,
        error: `HTTP ${res.status}: ${errorMsg}`,
      };
    }
  }

  if (res.status === 204) {
    return { success: true, data: null, error: null };
  }

  // Any 2xx status is a success — do NOT gate on a "success" field in the
  // response body.  .NET APIs often return 200 with { IsActive: true, ... }
  // or even an empty body — both are valid successes.
  try {
    const json = await res.json();
    // If the response is literally empty or not a JSON object, still success
    if (json === null || json === undefined) {
      return { success: true, data: null, error: null };
    }
    // Unwrap envelope shape { data: T, meta: ... } if present
    if (
      typeof json === "object" &&
      "data" in json &&
      (json as Record<string, unknown>).data !== undefined
    ) {
      return {
        success: true,
        data: (json as { data: T }).data,
        error: null,
        meta: (json as { meta?: PaginatedMeta }).meta,
      };
    }
    return { success: true, data: json as T, error: null };
  } catch {
    // Response body is empty / not JSON — still a success for 2xx
    return { success: true, data: null, error: null };
  }
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

/**
 * Public (no-auth) API helper.
 * Use for AllowAnonymous endpoints like GET /TenantSettings/config.
 * ZERO headers — not even Content-Type — to avoid any 401.
 */
async function publicRequest<T>(path: string): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    // Bare fetch with NO headers — AllowAnonymous endpoint
    res = await fetch(`${API_BASE_URL}${path}`);
  } catch {
    return {
      success: false,
      data: null,
      error: "Network error — unable to reach the server.",
    };
  }

  if (!res.ok) {
    const errorMsg = ERROR_CODES[res.status] || `HTTP ${res.status}`;
    try {
      const json = await res.json();
      return { success: false, data: null, error: json.message || errorMsg };
    } catch {
      return { success: false, data: null, error: errorMsg };
    }
  }

  if (res.status === 204) {
    return { success: true, data: null, error: null };
  }

  try {
    const json = await res.json();
    if (json === null || json === undefined) {
      return { success: true, data: null, error: null };
    }
    if (
      typeof json === "object" &&
      "data" in json &&
      (json as Record<string, unknown>).data !== undefined
    ) {
      return {
        success: true,
        data: (json as { data: T }).data,
        error: null,
        meta: (json as { meta?: PaginatedMeta }).meta,
      };
    }
    return { success: true, data: json as T, error: null };
  } catch {
    return { success: true, data: null, error: null };
  }
}

export const publicApi = {
  get: <T>(path: string) => publicRequest<T>(path),
};

export const RATE_LIMIT_EVENT = "escola:rate-limit";

// ─── SuperAdmin API Types ─────────────────────────────────────────────────────

export type Tenant = {
  id: number;
  schoolName: string;
  adminEmail: string;
  domain?: string;
  subscriptionPlan: "Basic" | "Standard" | "Premium";
  isActive: boolean;
  createdAt: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  outstandingAmount?: number;
};

export type Subscription = {
  id: number;
  tenantId: number;
  schoolName: string;
  plan: "Basic" | "Standard" | "Premium";
  status: "Active" | "Paused" | "Overdue";
  startDate: string;
  nextBillingDate: string;
  amount: number;
  outstandingAmount: number;
};

export type ReminderLog = {
  id: number;
  sentAt: string;
  sentBy: string;
  message: string;
  recipients: { tenantId: number; schoolName: string }[];
  sentCount: number;
  status: "Delivered" | "Partial" | "Failed";
};

export type PaymentSummary = {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
};

export type CreateTenantPayload = {
  SchoolName: string;
  SchoolAcronym?: string;
  Address?: string;
  Phone?: string;
  Email: string;
  Motto?: string;
  Website?: string;
  Logo?: string;
  SubscriptionPlan?: string;
  PrincipalName: string; // Required — display name
  PrincipalUsername?: string; // Login username (separate from display name)
  PrincipalEmail: string; // Required, email
  PrincipalPassword: string; // Required
  RoleId?: number; // Role ID assigned to the principal (1 = school admin)
};

export type UpdateTenantPayload = {
  isActive?: boolean;
  subscriptionPlan?: "Basic" | "Standard" | "Premium";
  domain?: string;
  adminEmail?: string;
  schoolName?: string;
};

// ─── SuperAdmin API Functions ─────────────────────────────────────────────────
// All use the authenticated api helper (attaches Bearer token automatically).

export async function adminGetTenants(page = 1, limit = 20) {
  return api.get<{
    data: Tenant[];
    total: number;
    page: number;
    limit: number;
  }>(`/TenantSettings/admin/tenants?page=${page}&limit=${limit}`);
}

export async function adminCreateTenant(payload: CreateTenantPayload) {
  return api.post<Tenant>("/TenantSettings/admin/tenants", payload);
}

export async function adminUpdateTenant(
  id: number,
  payload: UpdateTenantPayload,
) {
  // .NET backend expects PascalCase field names.
  // When only toggling IsActive, send ONLY that field — no extra fields.
  const body: Record<string, unknown> = {};
  if (payload.isActive !== undefined) body.IsActive = payload.isActive;
  if (payload.subscriptionPlan !== undefined)
    body.SubscriptionPlan = payload.subscriptionPlan;
  if (payload.domain !== undefined) body.Domain = payload.domain;
  if (payload.adminEmail !== undefined) body.AdminEmail = payload.adminEmail;
  if (payload.schoolName !== undefined) body.SchoolName = payload.schoolName;

  console.log(
    `[EscolaUI] adminUpdateTenant — PUT /TenantSettings/admin/tenants/${id}`,
    "payload:",
    JSON.stringify(body),
  );

  return api.put<{ IsActive?: boolean }>(
    `/TenantSettings/admin/tenants/${id}`,
    body,
  );
}

export async function adminGetSubscriptions(page = 1, limit = 20, status = "") {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) params.set("status", status);
  return api.get<{ data: Subscription[]; total: number }>(
    `/TenantSettings/admin/subscriptions?${params}`,
  );
}

export async function adminGetPaymentSummary() {
  // Correct URL: /payments-summary (hyphen, confirmed by user)
  return api.get<PaymentSummary>("/TenantSettings/admin/payments-summary");
}

/**
 * Alias for adminGetPaymentSummary — fetches subscription plan data from
 * GET /api/TenantSettings/admin/payments-summary
 */
export async function adminGetSubscriptionPlans() {
  return api.get<PaymentSummary>("/TenantSettings/admin/payments-summary");
}

export async function adminSendReminders(tenantIds: number[], message: string) {
  return api.post<{ success: boolean; sentCount: number }>(
    "/TenantSettings/admin/reminders",
    { tenantIds, message },
  );
}

export async function adminGetReminderLog(page = 1, limit = 20) {
  return api.get<{ data: ReminderLog[]; total: number }>(
    `/TenantSettings/admin/reminders?page=${page}&limit=${limit}`,
  );
}

export async function adminResetPassword(
  tenantId: number,
  newPassword: string,
) {
  return api.post<{ success: boolean }>(
    `/TenantSettings/admin/tenants/${tenantId}/reset-password`,
    { newPassword },
  );
}

/**
 * Change password for the currently logged-in user.
 * POST /auth/change-password — requires Bearer token.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ApiResponse<{ message: string }>> {
  return api.post<{ message: string }>("/auth/change-password", {
    currentPassword,
    newPassword,
  });
}

// ─── Legacy aliases (used by non-platform-admin pages) ───────────────────────
// Keep old names so school-side modules don't break.

export type ApiTenant = {
  id: number;
  tenantId?: number;
  schoolName: string;
  adminEmail: string;
  subscriptionPlan: string;
  isActive: boolean;
  createdAt: string;
  domain?: string | null;
};

export type ApiSubscription = {
  id: number;
  tenantId: number;
  schoolName: string;
  plan: string;
  amountDue: number;
  amount?: number;
  nextPaymentDate?: string;
  nextBillingDate?: string;
  status: "Active" | "Overdue" | "DueSoon" | "Paused";
  billingCycle?: string;
};

export type ApiReminderLog = {
  id?: number;
  reminderId?: number;
  schoolName: string;
  sentAt: string;
  message: string;
  status: "sent" | "failed" | "pending" | "Delivered" | "Partial" | "Failed";
};

export async function getSuperAdminTenants(page = 1, limit = 20) {
  return adminGetTenants(page, limit) as Promise<
    ApiResponse<{ data: ApiTenant[]; total: number }>
  >;
}

export async function createSuperAdminTenant(data: {
  schoolName: string;
  adminEmail: string;
  adminPassword: string;
  subscriptionPlan: string;
  domain?: string;
}) {
  return api.post<Tenant>("/TenantSettings/admin/tenants", data);
}

export async function updateSuperAdminTenant(
  tenantId: number,
  data: UpdateTenantPayload,
) {
  return adminUpdateTenant(tenantId, data);
}

export async function getSuperAdminSubscriptions(
  page = 1,
  limit = 50,
  status?: string,
) {
  return api.get<{ data: ApiSubscription[]; total: number }>(
    `/TenantSettings/admin/subscriptions?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`,
  );
}

export async function getPaymentSummary() {
  return adminGetPaymentSummary();
}

export async function sendPaymentReminders(
  tenantIds: number[],
  message: string,
) {
  return adminSendReminders(tenantIds, message);
}

export async function getReminderLog(page = 1, limit = 50) {
  return api.get<{ data: ApiReminderLog[]; total: number }>(
    `/TenantSettings/admin/reminders?page=${page}&limit=${limit}`,
  );
}

export async function resetPrincipalPassword(
  tenantId: number,
  newPassword: string,
) {
  return adminResetPassword(tenantId, newPassword);
}
