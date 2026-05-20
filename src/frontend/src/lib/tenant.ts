/**
 * Multi-tenant support — resolves tenant ID from:
 * 1. localStorage 'escolaui_tenant_override' (runtime settings)
 * 2. VITE_TENANT_ID env var
 * 3. Subdomain of hostname (e.g. 'school1' from 'school1.escolaui.com')
 * 4. null — no hardcoded fallback school name
 */
import { isDemoMode } from "./demoMode";

export function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0];
  const parts = host.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (!["www", "app", "localhost", "127"].includes(sub)) {
      return sub;
    }
  }
  return null;
}

function resolve(): string | null {
  // 0. Runtime localStorage override
  if (typeof window !== "undefined") {
    try {
      const override = localStorage.getItem("escolaui_tenant_override");
      if (override?.trim()) return override.trim();
    } catch {
      /* ignore */
    }
  }
  // 1. Explicit env var
  if (import.meta.env.VITE_TENANT_ID) {
    return import.meta.env.VITE_TENANT_ID as string;
  }
  // 2. Demo mode — return null (no hardcoded demo school name)
  if (isDemoMode()) return null;
  // 3. Subdomain extraction
  if (typeof window !== "undefined") {
    const sub = extractSubdomain(window.location.hostname);
    if (sub) return sub;
  }
  // 4. No fallback — return null
  return null;
}

let _tenantId: string | null | undefined = undefined;

export function getTenantId(): string | null {
  if (_tenantId === undefined) {
    _tenantId = resolve();
  }
  return _tenantId;
}

export function resolveTenantId(): string | null {
  return resolve();
}
