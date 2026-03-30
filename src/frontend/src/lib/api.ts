// API client for EscolaUI - connects to external school management API

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.escolaui.example.com/v1";

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
    const newToken = json.data?.accessToken;
    if (newToken) {
      localStorage.setItem("accessToken", newToken);
      return newToken;
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
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
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

  // Handle 401 with token refresh
  if (res.status === 401 && retry) {
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
