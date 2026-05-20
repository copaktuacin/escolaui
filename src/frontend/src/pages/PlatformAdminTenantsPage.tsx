import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  type Tenant,
  adminGetTenants,
  adminUpdateTenant,
  resolveTenantId,
} from "../lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
  Basic: "bg-blue-900/30 text-blue-400 border-blue-700/40",
  Standard: "bg-violet-900/30 text-violet-400 border-violet-700/40",
  Premium: "bg-amber-900/30 text-amber-400 border-amber-700/40",
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
        PLAN_STYLES[plan] ?? PLAN_STYLES.Basic
      }`}
    >
      {plan || "—"}
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

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

/**
 * Normalize a raw API tenant — maps PascalCase .NET field names to camelCase.
 * Preserves all original fields so resolveTenantId still works on the result.
 */
function normalizeTenant(raw: unknown): Tenant {
  const r = raw as Record<string, unknown>;
  const id = Number(resolveTenantId(r) ?? 0);
  return {
    ...r,
    id,
    schoolName: (r.SchoolName as string) ?? (r.schoolName as string) ?? "",
    adminEmail:
      (r.AdminEmail as string) ??
      (r.Email as string) ??
      (r.adminEmail as string) ??
      "",
    subscriptionPlan: ((r.SubscriptionPlan as string) ??
      (r.subscriptionPlan as string) ??
      "") as "Basic" | "Standard" | "Premium",
    isActive: Boolean(
      (r.IsActive as unknown) ?? (r.isActive as unknown) ?? false,
    ),
    createdAt:
      (r.CreatedAt as string) ??
      (r.createdAt as string) ??
      new Date().toISOString(),
    principalName:
      (r.PrincipalName as string) ?? (r.principalName as string) ?? undefined,
    schoolUsername:
      (r.SchoolUsername as string) ??
      (r.schoolUsername as string) ??
      (r.AdminUsername as string) ??
      undefined,
  } as Tenant;
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

  // Flash from add-school page
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
      const res = await adminGetTenants(1, 100);
      if (!res.success) {
        setError(res.error ?? "Failed to load schools.");
        return;
      }
      const rawList: unknown[] = Array.isArray(res.data)
        ? (res.data as unknown[])
        : Array.isArray((res.data as { data?: unknown[] })?.data)
          ? (res.data as { data: unknown[] }).data
          : [];
      if (rawList.length > 0) {
        console.log("[EscolaUI] First tenant raw:", JSON.stringify(rawList[0]));
      }
      setTenants(rawList.map(normalizeTenant));
    } catch {
      setError("Failed to load schools.");
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
    const id = resolveTenantId(tenant);
    if (!id) {
      console.error(
        "[EscolaUI] Toggle: tenant ID missing",
        JSON.stringify(tenant),
      );
      setFeedback("Error: Could not determine school ID");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    const newActive = !tenant.isActive;
    // Optimistic
    setTenants((prev) =>
      prev.map((t) =>
        resolveTenantId(t) === id ? { ...t, isActive: newActive } : t,
      ),
    );
    try {
      const res = await adminUpdateTenant(id, { IsActive: newActive });
      if (!res.success) {
        setTenants((prev) =>
          prev.map((t) =>
            resolveTenantId(t) === id ? { ...t, isActive: !newActive } : t,
          ),
        );
        setFeedback(`Error: ${res.error ?? "Failed to update"}`);
        setTimeout(() => setFeedback(null), 6000);
        return;
      }
      setFeedback(
        `${tenant.schoolName} ${newActive ? "activated" : "deactivated"}`,
      );
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setTenants((prev) =>
        prev.map((t) =>
          resolveTenantId(t) === id ? { ...t, isActive: !newActive } : t,
        ),
      );
      setFeedback(
        `Error: ${err instanceof Error ? err.message : "Failed to update"}`,
      );
      setTimeout(() => setFeedback(null), 6000);
    }
  }

  function handleViewDetails(tenant: Tenant) {
    const id = resolveTenantId(tenant);
    if (!id) {
      console.error(
        "[EscolaUI] View details: tenant ID missing",
        JSON.stringify(tenant),
      );
      setFeedback(
        "Error: Cannot navigate — school ID is missing. Check console.",
      );
      setTimeout(() => setFeedback(null), 6000);
      return;
    }
    navigate({ to: "/platform-admin/schools/$id", params: { id } });
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
            Create, activate, and manage all school profiles
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

      {/* Feedback */}
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
            placeholder="Search by name or email…"
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
          <span style={{ color: "#f87171", fontSize: "1.5rem" }}>⛔</span>
          <p
            className="text-sm font-semibold mt-3"
            style={{ color: "#f1f5f9" }}
          >
            {error.includes("Access denied")
              ? "Access Denied"
              : "Failed to load schools"}
          </p>
          <p className="text-xs mt-2 max-w-sm" style={{ color: "#64748b" }}>
            {error}
          </p>
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
          {filtered.map((tenant, i) => {
            const raw = tenant as unknown as Record<string, unknown>;
            const principalName =
              (raw.PrincipalName as string) ??
              (raw.principalName as string) ??
              "—";
            return (
              <div
                key={resolveTenantId(tenant) ?? i}
                className="rounded-2xl border p-4 transition-all hover:shadow-lg hover:border-indigo-900/50"
                style={{ background: "#1a2234", borderColor: "#1e293b" }}
                data-ocid={`tenants.row.item.${i + 1}`}
              >
                {/* School header */}
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
                    <p
                      className="text-[11px] truncate"
                      style={{ color: "#475569" }}
                    >
                      {tenant.adminEmail}
                    </p>
                  </div>
                  <PlanBadge plan={tenant.subscriptionPlan} />
                </button>

                {/* Details */}
                <div className="space-y-1 mb-3">
                  <p className="text-xs" style={{ color: "#475569" }}>
                    <span style={{ color: "#64748b" }}>Principal: </span>
                    {principalName}
                  </p>
                  <p className="text-xs" style={{ color: "#475569" }}>
                    Created{" "}
                    {new Date(tenant.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: "#1e293b" }}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(tenant)}
                      className="relative w-9 h-5 rounded-full transition-colors focus:outline-none"
                      style={{
                        background: tenant.isActive ? "#10b981" : "#374151",
                      }}
                      aria-label={
                        tenant.isActive
                          ? "Deactivate school"
                          : "Activate school"
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
            );
          })}
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
