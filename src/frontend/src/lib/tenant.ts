/**
 * Multi-tenant support — resolves tenant ID from:
 * 1. localStorage 'escolaui_tenant_override' (runtime settings)
 * 2. VITE_TENANT_ID env var
 * 3. Subdomain of hostname (e.g. 'school1' from 'school1.escolaui.com')
 * 4. Falls back to 'demo-escola' in demo mode, 'default' in live mode
 */
import { isDemoMode } from "./demoMode";

export function extractSubdomain(hostname: string): string | null {
  // Strip port if present
  const host = hostname.split(":")[0];
  const parts = host.split(".");
  // Need at least 3 parts: subdomain.domain.tld
  if (parts.length >= 3) {
    const sub = parts[0];
    // Ignore common non-tenant subdomains
    if (!["www", "app", "localhost", "127"].includes(sub)) {
      return sub;
    }
  }
  return null;
}

function resolve(): string {
  // 0. Runtime localStorage override (set by Settings page)
  if (typeof window !== "undefined") {
    try {
      const override = localStorage.getItem("escolaui_tenant_override");
      if (override?.trim()) return override.trim();
    } catch {
      // ignore
    }
  }
  // 1. Explicit env var takes priority
  if (import.meta.env.VITE_TENANT_ID) {
    return import.meta.env.VITE_TENANT_ID as string;
  }
  // 2. In demo mode, always fall back to demo-escola (not a real subdomain)
  if (isDemoMode()) return "demo-escola";
  // 3. Try subdomain
  if (typeof window !== "undefined") {
    const sub = extractSubdomain(window.location.hostname);
    if (sub) return sub;
  }
  return "default";
}

// Memoized — computed once at module load
let _tenantId: string | null = null;

export function getTenantId(): string {
  if (_tenantId === null) {
    _tenantId = resolve();
  }
  return _tenantId;
}

export function resolveTenantId(): string {
  return resolve();
}
