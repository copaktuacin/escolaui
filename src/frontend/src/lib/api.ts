// API client for EscolaUI - connects to external school management API

import { getApiBaseUrl } from "./demoMode";
import { getTenantId } from "./tenant";

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

const RATE_LIMIT_EVENT = "escola:rate-limit";

function getToken() {
  return localStorage.getItem("accessToken");
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

/** Auth endpoints must NOT include X-Tenant-ID per API spec */
function isAuthPath(path: string): boolean {
  return path.startsWith("/auth/");
}

async function refreshTokenRequest(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No X-Tenant-ID on auth endpoints
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    // Response shape: { accessToken, refreshToken }
    const newAccessToken: string | undefined = json.accessToken;
    const newRefreshToken: string | undefined = json.refreshToken;
    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = true,
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Only non-auth endpoints carry X-Tenant-ID
  if (!isAuthPath(path)) {
    headers["X-Tenant-ID"] = getTenantId();
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle rate limiting
  if (res.status === 429) {
    const limit = res.headers.get("X-RateLimit-Limit");
    const remaining = res.headers.get("X-RateLimit-Remaining");
    const reset = res.headers.get("X-RateLimit-Reset");
    window.dispatchEvent(
      new CustomEvent(RATE_LIMIT_EVENT, {
        detail: { limit, remaining, reset },
      }),
    );
    return { success: false, data: null, error: ERROR_CODES[429] };
  }

  // Handle 401 with token refresh (skip for auth paths to avoid infinite loop)
  if (res.status === 401 && retry && !isAuthPath(path)) {
    const newToken = await refreshTokenRequest();
    if (newToken) {
      return request<T>(method, path, body, false);
    }
    // Trigger logout
    window.dispatchEvent(new Event("escola:logout"));
    return { success: false, data: null, error: ERROR_CODES[401] };
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

  try {
    const json = await res.json();
    // Auth endpoints return the DTO directly (no envelope); non-auth may wrap in { data }
    return {
      success: true,
      data: json.data ?? json,
      error: null,
      meta: json.meta,
    };
  } catch {
    return { success: true, data: null, error: null };
  }
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export { RATE_LIMIT_EVENT };
