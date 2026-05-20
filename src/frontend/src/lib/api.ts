// API client for EscolaUI
// BASE_URL is the one permitted constant.
const BASE_URL = "https://escola.doorstepgarage.in/api";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  PrincipalName: string;
  PrincipalEmail: string;
  PrincipalPassword: string;
  SchoolUsername: string;
  RoleId: 1;
};

export type UpdateTenantPayload = {
  IsActive?: boolean;
  isActive?: boolean;
  SubscriptionPlan?: string;
  subscriptionPlan?: string;
  Domain?: string;
  domain?: string;
  AdminEmail?: string;
  adminEmail?: string;
  SchoolName?: string;
  schoolName?: string;
  PrincipalName?: string;
  principalName?: string;
  SchoolUsername?: string;
  schoolUsername?: string;
  AdminPhone?: string;
  adminPhone?: string;
  PrincipalMobileNo?: string;
  principalMobileNo?: string;
  PrincipalUserName?: string;
  principalUserName?: string;
};

export type User = {
  id: string;
  username: string;
  role: string;
  tenantId?: string | null;
  schoolId?: string | null;
  isPlatformAdmin: boolean;
  displayName?: string;
};

export type SchoolProfile = {
  schoolName?: string;
  logoUrl?: string;
  motto?: string;
  primaryColor?: string;
};

export type DashboardStats = {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSections: number;
  presentToday?: number;
  absentToday?: number;
  totalFeeCollected?: number;
  pendingFees?: number;
  totalAdmissions?: number;
  pendingAdmissions?: number;
  upcomingExams?: number;
  activeOnlineClasses?: number;
  unreadNotifications?: number;
};

export type Tenant = {
  id: number;
  schoolName: string;
  adminEmail: string;
  domain?: string;
  subscriptionPlan: string;
  isActive: boolean;
  createdAt: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  outstandingAmount?: number;
  principalName?: string;
  schoolUsername?: string;
  adminPhone?: string;
  principalEmail?: string;
  /** New fields returned by GET /api/school/profileByID?id={id} */
  principalMobileNo?: string;
  principalUserName?: string;
};

export type Subscription = {
  id: number;
  tenantId: number;
  schoolName: string;
  plan: string;
  status: string;
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
  status: string;
};

export type PaymentSummary = {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
};

// Legacy alias types — keep so existing pages don't break
export type ApiTenant = Tenant;
export type ApiSubscription = Subscription;
export type ApiReminderLog = ReminderLog;

// ─── Token helpers ────────────────────────────────────────────────────────────

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

// ─── Response helpers ─────────────────────────────────────────────────────────

/**
 * Unwrap common .NET response envelope shapes.
 * Returns the actual items array / object regardless of how it is wrapped.
 */
export function unwrapResponse<T>(json: unknown): T {
  if (json === null || json === undefined) return [] as unknown as T;
  if (Array.isArray(json)) return json as T;
  const j = json as Record<string, unknown>;
  // Ordered preference: data, Data, items, Items, value, Value
  for (const key of ["data", "Data", "items", "Items", "value", "Value"]) {
    if (key in j && j[key] !== undefined) return j[key] as T;
  }
  return json as T;
}

/**
 * Extract a tenant/school ID from any PascalCase or camelCase shape.
 * Returns the first truthy value as a string, or null.
 */
export function resolveTenantId(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const keys = ["Id", "TenantId", "SchoolId", "id", "tenantId", "schoolId"];
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v);
    }
  }
  // Fallback: scan all numeric fields
  for (const v of Object.values(o)) {
    if (typeof v === "number" && v > 0) return String(v);
  }
  return null;
}

// ─── publicFetch — zero headers, only for /TenantSettings/config ──────────────

export async function publicFetch<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── authFetch — attaches Bearer, retries once on 401 ────────────────────────

async function doRefresh(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    const at =
      (json.accessToken as string | undefined) ??
      ((json.data as Record<string, unknown> | undefined)?.accessToken as
        | string
        | undefined);
    const newRt =
      (json.refreshToken as string | undefined) ??
      ((json.data as Record<string, unknown> | undefined)?.refreshToken as
        | string
        | undefined);
    if (at) {
      localStorage.setItem("accessToken", at);
      if (newRt) localStorage.setItem("refreshToken", newRt);
      return at;
    }
    return null;
  } catch {
    return null;
  }
}

async function authFetch(
  method: string,
  path: string,
  body?: unknown,
  retry = true,
): Promise<ApiResponse<unknown>> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { success: false, data: null, error: "Network error" };
  }

  if (res.status === 401 && retry && !path.startsWith("/auth/")) {
    const newToken = await doRefresh();
    if (newToken) return authFetch(method, path, body, false);
    clearTokens();
    window.dispatchEvent(new Event("auth:logout"));
    return { success: false, data: null, error: "Unauthorized" };
  }

  if (res.status === 403) {
    let msg = "Forbidden — insufficient permissions";
    try {
      const j = (await res.json()) as Record<string, unknown>;
      msg = (j.message as string) || (j.title as string) || msg;
    } catch {
      /* empty */
    }
    return { success: false, data: null, error: msg };
  }

  if (res.status === 204) return { success: true, data: null, error: null };

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as Record<string, unknown>;
      msg = (j.message as string) || (j.title as string) || msg;
    } catch {
      /* empty */
    }
    return { success: false, data: null, error: msg };
  }

  try {
    const json = await res.json();
    if (json === null || json === undefined)
      return { success: true, data: null, error: null };
    // Only unwrap { data: T, meta: ... } envelope when there is ALSO a meta field.
    // Without meta, keep the full response so list endpoints can extract total/count.
    if (typeof json === "object" && !Array.isArray(json)) {
      const j = json as Record<string, unknown>;
      if ("data" in j && "meta" in j) {
        return {
          success: true,
          data: j.data as unknown,
          error: null,
          meta: j.meta as PaginatedMeta | undefined,
        };
      }
    }
    return { success: true, data: json, error: null };
  } catch {
    return { success: true, data: null, error: null };
  }
}

// ─── api / publicApi objects ──────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => authFetch("GET", path) as Promise<ApiResponse<T>>,
  post: <T>(path: string, body?: unknown) =>
    authFetch("POST", path, body) as Promise<ApiResponse<T>>,
  put: <T>(path: string, body?: unknown) =>
    authFetch("PUT", path, body) as Promise<ApiResponse<T>>,
  delete: <T>(path: string) =>
    authFetch("DELETE", path) as Promise<ApiResponse<T>>,
};

export const publicApi = {
  get: async <T>(path: string): Promise<ApiResponse<T>> => {
    try {
      const json = await publicFetch<T>(path);
      return { success: true, data: json, error: null };
    } catch (e) {
      return { success: false, data: null, error: String(e) };
    }
  },
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function loginFetch(
  username: string,
  password: string,
): Promise<ApiResponse<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = (await res.json()) as Record<string, unknown>;
        msg = (j.message as string) || (j.error as string) || msg;
      } catch {
        /* empty */
      }
      return { success: false, data: null, error: msg };
    }
    const json = (await res.json()) as Record<string, unknown>;
    return { success: true, data: json, error: null };
  } catch {
    return { success: false, data: null, error: "Network error" };
  }
}

export async function refreshTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, unknown>;
    const at =
      (j.accessToken as string | undefined) ??
      ((j.data as Record<string, unknown> | undefined)?.accessToken as
        | string
        | undefined);
    const newRt =
      (j.refreshToken as string | undefined) ??
      ((j.data as Record<string, unknown> | undefined)?.refreshToken as
        | string
        | undefined);
    if (at) {
      setTokens(at, newRt ?? rt);
      return { accessToken: at, refreshToken: newRt ?? rt };
    }
    return null;
  } catch {
    return null;
  }
}

export async function logoutFetch(): Promise<void> {
  const rt = getRefreshToken();
  try {
    await api.post("/auth/logout", rt ? { refreshToken: rt } : undefined);
  } catch {
    /* empty */
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ApiResponse<{ message: string }>> {
  return api.post<{ message: string }>("/auth/change-password", {
    currentPassword,
    newPassword,
  });
}

// ─── Admin API helpers ─────────────────────────────────────────────────────────

export async function adminGetTenants(page = 1, limit = 20) {
  return api.get<{ data: Tenant[]; total: number }>(
    `/TenantSettings/admin/tenants?page=${page}&limit=${limit}`,
  );
}

export async function adminCreateTenant(payload: CreateTenantPayload) {
  return api.post<Tenant>("/TenantSettings/admin/tenants", payload);
}

export async function adminUpdateTenant(
  id: string | number,
  payload: UpdateTenantPayload,
) {
  return api.put<Tenant>(`/TenantSettings/admin/tenants/${id}`, payload);
}

export async function adminToggleActive(
  id: string | number,
  isActive: boolean,
) {
  return api.put<Tenant>(`/TenantSettings/admin/tenants/${id}`, {
    IsActive: isActive,
  });
}

export async function adminGetPaymentSummary() {
  return api.get<PaymentSummary>("/TenantSettings/admin/payments-summary");
}

export async function adminSendReminders(
  tenantIds: (string | number)[],
  message: string,
) {
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

export async function adminResetPrincipalPassword(
  id: string | number,
  newPassword: string,
) {
  return api.post<{ success: boolean }>(
    `/TenantSettings/admin/tenants/${id}/reset-password`,
    { newPassword },
  );
}

export async function adminUpdateSubscription(
  id: string | number,
  payload: { plan: string; expiryDate: string; status: string },
) {
  return api.put<Subscription>(
    `/TenantSettings/admin/tenants/${id}/subscription`,
    payload,
  );
}

export async function adminGetTenantDetail(id: string | number) {
  return api.get<Tenant>(`/TenantSettings/admin/tenants/${id}`);
}

// ─── Legacy aliases ────────────────────────────────────────────────────────────

export async function adminResetPassword(
  tenantId: number,
  newPassword: string,
) {
  return adminResetPrincipalPassword(tenantId, newPassword);
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

export async function getSuperAdminTenants(page = 1, limit = 20) {
  return adminGetTenants(page, limit);
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
  return adminGetSubscriptions(page, limit, status ?? "");
}

export async function getPaymentSummary() {
  return adminGetPaymentSummary();
}

export async function adminGetSubscriptionPlans() {
  return adminGetPaymentSummary();
}

export async function sendPaymentReminders(
  tenantIds: number[],
  message: string,
) {
  return adminSendReminders(tenantIds, message);
}

export async function getReminderLog(page = 1, limit = 50) {
  return adminGetReminderLog(page, limit);
}

export async function resetPrincipalPassword(
  tenantId: number,
  newPassword: string,
) {
  return adminResetPrincipalPassword(tenantId, newPassword);
}

/** createSuperAdminTenant — legacy alias kept for backwards compat */
export async function createSuperAdminTenant(data: CreateTenantPayload) {
  return adminCreateTenant(data);
}

export const RATE_LIMIT_EVENT = "escola:rate-limit";
