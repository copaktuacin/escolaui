import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { type Tenant, adminGetTenants, adminUpdateTenant } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

// ─── Demo data ────────────────────────────────────────────────────────────────

const MOCK_TENANTS: Tenant[] = [
  {
    id: 1,
    schoolName: "Springfield Academy",
    adminEmail: "admin@springfield.edu",
    domain: "springfield.escolaui.com",
    subscriptionPlan: "Premium",
    isActive: true,
    createdAt: "2024-09-01T00:00:00Z",
    nextBillingDate: "2026-05-01T00:00:00Z",
  },
  {
    id: 2,
    schoolName: "Riverside Public School",
    adminEmail: "admin@riverside.edu",
    domain: "riverside.escolaui.com",
    subscriptionPlan: "Standard",
    isActive: true,
    createdAt: "2024-11-15T00:00:00Z",
    nextBillingDate: "2026-05-15T00:00:00Z",
  },
  {
    id: 3,
    schoolName: "Lakewood International",
    adminEmail: "admin@lakewood.edu",
    subscriptionPlan: "Basic",
    isActive: false,
    createdAt: "2025-01-10T00:00:00Z",
    nextBillingDate: "2026-04-10T00:00:00Z",
    outstandingAmount: 2400,
  },
  {
    id: 4,
    schoolName: "Greenhill Primary",
    adminEmail: "admin@greenhill.edu",
    subscriptionPlan: "Standard",
    isActive: true,
    createdAt: "2025-03-20T00:00:00Z",
    nextBillingDate: "2026-06-20T00:00:00Z",
  },
  {
    id: 5,
    schoolName: "Westbrook High School",
    adminEmail: "admin@westbrook.edu",
    subscriptionPlan: "Premium",
    isActive: true,
    createdAt: "2025-04-01T00:00:00Z",
    nextBillingDate: "2026-05-25T00:00:00Z",
  },
];

let demoStore: Tenant[] = [...MOCK_TENANTS];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
  Basic: "bg-blue-900/30 text-blue-400 border-blue-700/40",
  Standard: "bg-violet-900/30 text-violet-400 border-violet-700/40",
  Premium: "bg-amber-900/30 text-amber-400 border-amber-700/40",
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${PLAN_STYLES[plan] ?? PLAN_STYLES.Basic}`}
    >
      {plan}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        active
          ? "bg-emerald-900/40 text-emerald-400 border border-emerald-700/50"
          : "bg-gray-800 text-gray-500 border border-gray-700"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-gray-600"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

/**
 * Extract the real numeric ID from a tenant object using a catch-all scan.
 * Logs the full raw object to the console so the exact field name is always visible.
 * Priority: keys containing 'tenant'+'id' > keys containing 'school'+'id' > any key containing 'id' with a positive int > first positive int in the object.
 */
function getTenantId(tenant: Tenant): number | null {
  const raw = tenant as unknown as Record<string, unknown>;
  console.log(
    "[EscolaUI] getTenantId — raw tenant object:",
    JSON.stringify(raw),
  );

  const keys = Object.keys(raw);

  // Helper: is a value a positive finite integer?
  const isPositiveInt = (v: unknown): v is number => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 && Math.floor(n) === n;
  };

  // Tier 1: key contains both 'tenant' and 'id' (case-insensitive)
  for (const k of keys) {
    const kl = k.toLowerCase();
    if (kl.includes("tenant") && kl.includes("id") && isPositiveInt(raw[k])) {
      console.log(
        `[EscolaUI] getTenantId — resolved via tier-1 key "${k}":`,
        raw[k],
      );
      return raw[k] as number;
    }
  }

  // Tier 2: key contains both 'school' and 'id' (case-insensitive)
  for (const k of keys) {
    const kl = k.toLowerCase();
    if (kl.includes("school") && kl.includes("id") && isPositiveInt(raw[k])) {
      console.log(
        `[EscolaUI] getTenantId — resolved via tier-2 key "${k}":`,
        raw[k],
      );
      return raw[k] as number;
    }
  }

  // Tier 3: any key that ends with or equals 'id' (case-insensitive) with a positive int
  for (const k of keys) {
    const kl = k.toLowerCase();
    if ((kl === "id" || kl.endsWith("id")) && isPositiveInt(raw[k])) {
      console.log(
        `[EscolaUI] getTenantId — resolved via tier-3 key "${k}":`,
        raw[k],
      );
      return raw[k] as number;
    }
  }

  // Tier 4: any key containing 'id' (case-insensitive) with a positive int
  for (const k of keys) {
    if (k.toLowerCase().includes("id") && isPositiveInt(raw[k])) {
      console.log(
        `[EscolaUI] getTenantId — resolved via tier-4 key "${k}":`,
        raw[k],
      );
      return raw[k] as number;
    }
  }

  // Tier 5: fallback — first positive integer value in the entire object
  for (const k of keys) {
    if (isPositiveInt(raw[k])) {
      console.log(
        `[EscolaUI] getTenantId — resolved via fallback key "${k}":`,
        raw[k],
      );
      return raw[k] as number;
    }
  }

  console.error(
    "[EscolaUI] getTenantId — could not find any numeric ID. Full object:",
    JSON.stringify(raw),
  );
  return null;
}

/**
 * Normalize a raw API tenant object so that `id` is always populated.
 * Also maps .NET PascalCase field names to camelCase.
 */
function normalizeTenant(raw: Tenant): Tenant {
  const r = raw as unknown as Record<string, unknown>;
  const realId = getTenantId(raw);
  if (realId === null) {
    console.warn(
      "[EscolaUI] Tenant object has no valid ID:",
      JSON.stringify(raw),
    );
  }
  return {
    id: realId ?? 0,
    schoolName: (r.SchoolName as string) ?? (r.schoolName as string) ?? "",
    adminEmail:
      (r.AdminEmail as string) ??
      (r.Email as string) ??
      (r.adminEmail as string) ??
      "",
    domain: ((r.Domain as string) ?? (r.domain as string)) || undefined,
    subscriptionPlan: ((r.SubscriptionPlan as string) ??
      (r.subscriptionPlan as string) ??
      "Basic") as "Basic" | "Standard" | "Premium",
    isActive: (r.IsActive as boolean) ?? (r.isActive as boolean) ?? false,
    createdAt:
      (r.CreatedAt as string) ??
      (r.createdAt as string) ??
      new Date().toISOString(),
    nextBillingDate:
      ((r.NextBillingDate as string) ?? (r.nextBillingDate as string)) ||
      undefined,
    outstandingAmount:
      ((r.OutstandingAmount as number) ?? (r.outstandingAmount as number)) ||
      undefined,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminTenantsPage() {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Check for success flash from the add school page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const created = params.get("created");
    if (created) {
      setFeedback(`${created} created successfully`);
      setTimeout(() => setFeedback(null), 4000);
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 400));
        setTenants([...demoStore]);
      } else {
        const res = await adminGetTenants(1, 100);
        if (!res.success) {
          setError(res.error ?? "Failed to load schools. Please try again.");
          setLoading(false);
          return;
        }
        // Normalize: handle both { data: Tenant[] } envelope and plain Tenant[]
        const rawList: Tenant[] = Array.isArray(
          (res.data as { data?: Tenant[] })?.data,
        )
          ? (res.data as { data: Tenant[] }).data
          : Array.isArray(res.data)
            ? (res.data as unknown as Tenant[])
            : [];

        // Log first item to help diagnose field-name mismatches
        if (rawList.length > 0) {
          console.log(
            "[EscolaUI] First tenant from API (raw):",
            JSON.stringify(rawList[0]),
          );
        }

        setTenants(rawList.map(normalizeTenant));
      }
    } catch {
      setError("Failed to load schools. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const filtered = tenants.filter((t) => {
    const matchSearch =
      !search.trim() ||
      t.schoolName.toLowerCase().includes(search.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? t.isActive : !t.isActive);
    return matchSearch && matchStatus;
  });

  async function handleToggleActive(tenant: Tenant) {
    const tenantId = getTenantId(tenant);
    if (!tenantId) {
      setFeedback(
        "Error: Could not determine school ID — cannot toggle status",
      );
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    const newActive = !tenant.isActive;

    // Optimistic update immediately
    setTenants((prev) =>
      prev.map((t) => (t.id === tenant.id ? { ...t, isActive: newActive } : t)),
    );

    if (isDemoMode()) {
      demoStore = demoStore.map((t) =>
        t.id === tenant.id ? { ...t, isActive: newActive } : t,
      );
      setFeedback(
        `${tenant.schoolName} ${newActive ? "activated" : "deactivated"}`,
      );
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    console.log(
      "[EscolaUI] Toggling tenant",
      tenantId,
      "to IsActive:",
      newActive,
    );

    try {
      const res = await adminUpdateTenant(tenantId, { isActive: newActive });
      if (!res.success) {
        // Revert on failure
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenant.id ? { ...t, isActive: !newActive } : t,
          ),
        );
        const errorDetail = res.error ?? "Failed to update";
        setFeedback(`Error: ${errorDetail}`);
        setTimeout(() => setFeedback(null), 6000);
        return;
      }
      setFeedback(
        `${tenant.schoolName} ${newActive ? "activated" : "deactivated"}`,
      );
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      // Revert on exception
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id ? { ...t, isActive: !newActive } : t,
        ),
      );
      setFeedback(
        `Error: ${err instanceof Error ? err.message : "Failed to update"}`,
      );
      setTimeout(() => setFeedback(null), 6000);
    }
  }

  function handleViewDetails(tenant: Tenant) {
    const tenantId = getTenantId(tenant);
    if (!tenantId) {
      const raw = JSON.stringify(tenant);
      console.error(
        "[EscolaUI] handleViewDetails — no numeric ID found in tenant object. Full raw object:",
        raw,
        "\nCheck the browser console above for which key was scanned.",
      );
      setFeedback(
        "Error: Could not find school ID. Check browser console — raw object logged for debugging.",
      );
      setTimeout(() => setFeedback(null), 6000);
      return;
    }
    navigate({
      to: "/platform-admin/schools/$id",
      params: { id: String(tenantId) },
    });
  }

  return (
    <div className="space-y-6" data-ocid="tenant_management.page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
            School Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Create, activate, and manage all school profiles (tenants)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchTenants}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{
              background: "#1e293b",
              borderColor: "#334155",
              color: "#94a3b8",
            }}
            data-ocid="tenants.refresh.button"
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/platform-admin/schools/new" })}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "#4f46e5", color: "#fff" }}
            data-ocid="tenants.create.button"
          >
            + New School
          </button>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          className="px-4 py-2.5 rounded-lg text-sm font-medium border"
          style={{
            background: feedback.startsWith("Error")
              ? "rgba(248,113,113,0.1)"
              : "rgba(52,211,153,0.1)",
            borderColor: feedback.startsWith("Error")
              ? "rgba(248,113,113,0.25)"
              : "rgba(52,211,153,0.25)",
            color: feedback.startsWith("Error") ? "#f87171" : "#34d399",
          }}
          data-ocid="tenants.feedback.toast"
        >
          {feedback}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "#475569" }}
          >
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by school name or email…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
            style={{
              background: "#1e293b",
              borderColor: "#334155",
              color: "#e2e8f0",
            }}
            data-ocid="tenants.search.input"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === f
                  ? "text-white"
                  : "border text-gray-500 hover:text-gray-300"
              }`}
              style={
                statusFilter === f
                  ? { background: "#4f46e5" }
                  : { background: "#1e293b", borderColor: "#334155" }
              }
              data-ocid={`tenants.filter.${f}.tab`}
            >
              {f === "all"
                ? `All (${tenants.length})`
                : f === "active"
                  ? `Active (${tenants.filter((t) => t.isActive).length})`
                  : `Inactive (${tenants.filter((t) => !t.isActive).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center text-center border"
          style={{ background: "#1a2234", borderColor: "#1e293b" }}
          data-ocid="tenants.error_state"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: "rgba(248,113,113,0.15)" }}
          >
            <span style={{ color: "#f87171", fontSize: "1.5rem" }}>⛔</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
            {error.startsWith("Access denied")
              ? "Access Denied"
              : "Failed to load schools"}
          </p>
          <p className="text-xs mt-2 max-w-sm" style={{ color: "#64748b" }}>
            {error}
          </p>
          {error.startsWith("Access denied") ? (
            <p
              className="text-xs mt-3 px-4 py-2.5 rounded-lg border"
              style={{
                color: "#94a3b8",
                borderColor: "#334155",
                background: "#1e293b",
              }}
            >
              Log in as <strong style={{ color: "#e2e8f0" }}>admin</strong> with
              your SuperAdmin credentials.
            </p>
          ) : (
            <button
              type="button"
              onClick={fetchTenants}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium border"
              style={{
                background: "#1e293b",
                borderColor: "#334155",
                color: "#94a3b8",
              }}
              data-ocid="tenants.retry.button"
            >
              Retry
            </button>
          )}
        </div>
      ) : loading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="tenants.loading_state"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl animate-pulse"
              style={{ background: "#1a2234" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center text-center border"
          style={{ background: "#1a2234", borderColor: "#1e293b" }}
          data-ocid="tenants.empty_state"
        >
          <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
            {search ? "No schools match your search" : "No school profiles yet"}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => navigate({ to: "/platform-admin/schools/new" })}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#4f46e5", color: "#fff" }}
              data-ocid="tenants.empty_create.button"
            >
              Create First School
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tenant, i) => (
            <div
              key={tenant.id || i}
              className="rounded-2xl border p-4 transition-all hover:shadow-lg hover:border-indigo-900/50"
              style={{ background: "#1a2234", borderColor: "#1e293b" }}
              data-ocid={`tenants.row.item.${i + 1}`}
            >
              {/* School identity — clickable to detail */}
              <button
                type="button"
                onClick={() => handleViewDetails(tenant)}
                className="w-full text-left flex items-start gap-3 mb-3 hover:opacity-90 transition-opacity"
                data-ocid={`tenants.view_detail.${i + 1}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  }}
                >
                  {initials(tenant.schoolName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "#f1f5f9" }}
                  >
                    {tenant.schoolName}
                  </p>
                  {tenant.domain && (
                    <p
                      className="text-[11px] truncate"
                      style={{ color: "#475569" }}
                    >
                      {tenant.domain}
                    </p>
                  )}
                </div>
                <PlanBadge plan={tenant.subscriptionPlan} />
              </button>

              <div className="space-y-1.5 mb-3">
                <p className="text-xs truncate" style={{ color: "#475569" }}>
                  ✉ {tenant.adminEmail}
                </p>
                <p className="text-xs" style={{ color: "#475569" }}>
                  Created{" "}
                  {new Date(tenant.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {(tenant.outstandingAmount ?? 0) > 0 && (
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#f87171" }}
                  >
                    ⚠ Outstanding: ₹
                    {(tenant.outstandingAmount ?? 0).toLocaleString()}
                  </p>
                )}
              </div>

              <div
                className="flex items-center justify-between pt-3 border-t"
                style={{ borderColor: "#1e293b" }}
              >
                {/* Active toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(tenant)}
                    className="relative w-9 h-5 rounded-full transition-colors focus:outline-none"
                    style={{
                      background: tenant.isActive ? "#10b981" : "#374151",
                    }}
                    aria-label={
                      tenant.isActive ? "Deactivate school" : "Activate school"
                    }
                    data-ocid={`tenants.active_toggle.${i + 1}`}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{
                        transform: tenant.isActive
                          ? "translateX(16px)"
                          : "translateX(0)",
                      }}
                    />
                  </button>
                  <StatusBadge active={tenant.isActive} />
                </div>

                {/* View Details link */}
                <button
                  type="button"
                  onClick={() => handleViewDetails(tenant)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors hover:bg-indigo-900/20"
                  style={{ borderColor: "#4f46e5", color: "#818cf8" }}
                  data-ocid={`tenants.view_detail_btn.${i + 1}`}
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tenants.length > 0 && (
        <p className="text-xs px-1" style={{ color: "#475569" }}>
          {filtered.length} of {tenants.length} school
          {tenants.length !== 1 ? "s" : ""} shown
        </p>
      )}
    </div>
  );
}
