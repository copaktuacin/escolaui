/**
 * Demo mode utilities — zero network calls when active.
 * Activated by:
 *   1. VITE_DEMO_MODE=true (build-time env)
 *   2. URL param ?demo=true
 *   3. localStorage key 'escolaui_demo_override' === 'true' (runtime settings toggle)
 */

export function isDemoMode(): boolean {
  if (import.meta.env.VITE_DEMO_MODE === "true") return true;
  if (typeof window !== "undefined") {
    // URL param check
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "true") return true;
    // Runtime localStorage override (set by Settings page)
    try {
      const override = localStorage.getItem("escolaui_demo_override");
      if (override === "true") return true;
      if (override === "false") return false;
    } catch {
      // ignore storage errors
    }
  }
  return false;
}

export function getDemoTenantId(): string {
  if (typeof window !== "undefined") {
    // Runtime tenant override
    try {
      const override = localStorage.getItem("escolaui_tenant_override");
      if (override?.trim()) return override.trim();
    } catch {
      // ignore
    }
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get("tenantId");
    if (tenantId) return tenantId;
  }
  return import.meta.env.VITE_TENANT_ID || "demo-escola";
}

/**
 * Returns the effective API base URL, checking localStorage override first.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    try {
      const override = localStorage.getItem("escolaui_api_url");
      if (override?.trim()) return override.trim();
    } catch {
      // ignore
    }
  }
  return (
    import.meta.env.VITE_API_BASE_URL || "https://escola.doorstepgarage.in/api"
  );
}
