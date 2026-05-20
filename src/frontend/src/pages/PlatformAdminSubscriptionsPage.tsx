import { useCallback, useEffect, useState } from "react";
import {
  type PaymentSummary,
  type Tenant,
  adminGetPaymentSummary,
  adminGetTenants,
  resolveTenantId,
} from "../lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
  Basic: "text-blue-400",
  Standard: "text-violet-400",
  Premium: "text-amber-400",
};

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
  } as Tenant;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminSubscriptionsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryUnavailable, setSummaryUnavailable] = useState(false);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<
    "all" | "Basic" | "Standard" | "Premium"
  >("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSummaryUnavailable(false);
    try {
      const [tenantsRes, summaryRes] = await Promise.all([
        adminGetTenants(1, 200),
        adminGetPaymentSummary(),
      ]);

      // Tenants
      const rawList: unknown[] = Array.isArray(tenantsRes.data)
        ? (tenantsRes.data as unknown[])
        : Array.isArray((tenantsRes.data as { data?: unknown[] })?.data)
          ? (tenantsRes.data as { data: unknown[] }).data
          : [];
      setTenants(rawList.map(normalizeTenant));

      // Payment summary: graceful 404
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data as PaymentSummary);
      } else {
        const is404 =
          summaryRes.error?.includes("Not Found") ||
          summaryRes.error?.includes("404");
        if (is404) setSummaryUnavailable(true);
        else
          console.warn("[EscolaUI] Payment summary error:", summaryRes.error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = tenants.filter((t) => {
    const matchSearch =
      !search.trim() ||
      t.schoolName.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || t.subscriptionPlan === planFilter;
    return matchSearch && matchPlan;
  });

  const kpis = summary
    ? [
        {
          label: "Total Payments",
          value: String(summary.totalPayments),
          color: "#60a5fa",
        },
        {
          label: "Total Amount",
          value: `₹${summary.totalAmount.toLocaleString()}`,
          color: "#a78bfa",
        },
        {
          label: "Successful",
          value: String(summary.successfulPayments),
          color: "#34d399",
        },
        {
          label: "Failed",
          value: String(summary.failedPayments),
          color: "#f87171",
        },
        {
          label: "Pending",
          value: String(summary.pendingPayments),
          color: "#fbbf24",
        },
      ]
    : [];

  const PLAN_TABS = [
    { label: `All (${tenants.length})`, value: "all" as const },
    {
      label: `Basic (${tenants.filter((t) => t.subscriptionPlan === "Basic").length})`,
      value: "Basic" as const,
    },
    {
      label: `Standard (${tenants.filter((t) => t.subscriptionPlan === "Standard").length})`,
      value: "Standard" as const,
    },
    {
      label: `Premium (${tenants.filter((t) => t.subscriptionPlan === "Premium").length})`,
      value: "Premium" as const,
    },
  ];

  return (
    <div className="space-y-6" data-ocid="subscriptions.page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
          Subscription Management
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
          Monitor all tenant subscription plans and payment data
        </p>
      </div>

      {/* KPI Strip */}
      {loading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-5 gap-3"
          data-ocid="subscriptions.kpis.loading_state"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-20 rounded-xl animate-pulse"
              style={{ background: "#1e293b" }}
            />
          ))}
        </div>
      ) : summaryUnavailable ? (
        <div
          className="rounded-xl p-4 border text-center"
          style={{ background: "#1e293b", borderColor: "#334155" }}
          data-ocid="subscriptions.kpis.empty_state"
        >
          <p className="text-sm" style={{ color: "#64748b" }}>
            Payment data not yet available from server
          </p>
        </div>
      ) : kpis.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-xl p-4 border"
              style={{ background: "#1e293b", borderColor: "#334155" }}
            >
              <p className="text-xs" style={{ color: "#64748b" }}>
                {k.label}
              </p>
              <p
                className="text-2xl font-bold mt-1 tabular-nums"
                style={{ color: k.color }}
              >
                {k.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Filters */}
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
            placeholder="Search school name…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
            style={{
              background: "#1e293b",
              borderColor: "#334155",
              color: "#e2e8f0",
            }}
            data-ocid="subscriptions.search.input"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {PLAN_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setPlanFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                planFilter === tab.value
                  ? "text-white"
                  : "border text-gray-500 hover:text-gray-300"
              }`}
              style={
                planFilter === tab.value
                  ? { background: "#4f46e5" }
                  : { background: "#1e293b", borderColor: "#334155" }
              }
              data-ocid={`subscriptions.plan_filter.${tab.value}.tab`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "#1a2234", borderColor: "#1e293b" }}
      >
        <div
          className="hidden md:grid gap-4 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wide"
          style={{
            borderColor: "#1e293b",
            color: "#475569",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
          }}
        >
          <span>School</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Created</span>
        </div>

        {loading ? (
          <div data-ocid="subscriptions.loading_state">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="flex items-center gap-4 px-5 py-4 border-b"
                style={{ borderColor: "#1e293b" }}
              >
                <div
                  className="w-8 h-8 rounded-lg animate-pulse"
                  style={{ background: "#1e293b" }}
                />
                <div className="flex-1 space-y-1.5">
                  <div
                    className="h-3.5 w-36 rounded animate-pulse"
                    style={{ background: "#1e293b" }}
                  />
                  <div
                    className="h-3 w-24 rounded animate-pulse"
                    style={{ background: "#1e293b" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center py-16 text-center"
            data-ocid="subscriptions.empty_state"
          >
            <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
              {search ? "No schools match your search" : "No schools found"}
            </p>
            {(search || planFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPlanFilter("all");
                }}
                className="mt-4 px-4 py-2 rounded-lg text-sm border"
                style={{
                  background: "#1e293b",
                  borderColor: "#334155",
                  color: "#94a3b8",
                }}
                data-ocid="subscriptions.clear_filters.button"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((t, i) => (
              <div
                key={resolveTenantId(t) ?? i}
                className="px-5 py-3.5 border-b grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-2 md:gap-4 items-center transition-colors hover:bg-white/[0.02]"
                style={{ borderColor: "#1e293b" }}
                data-ocid={`subscriptions.row.item.${i + 1}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    }}
                  >
                    {t.schoolName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "#e2e8f0" }}
                    >
                      {t.schoolName}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "#475569" }}
                    >
                      {t.adminEmail}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold ${PLAN_STYLES[t.subscriptionPlan] ?? "text-gray-400"}`}
                >
                  {t.subscriptionPlan || "—"}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit ${
                    t.isActive
                      ? "bg-emerald-900/30 text-emerald-400 border border-emerald-700/40"
                      : "bg-gray-800 text-gray-500 border border-gray-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${t.isActive ? "bg-emerald-400" : "bg-gray-600"}`}
                  />
                  {t.isActive ? "Active" : "Inactive"}
                </span>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  {new Date(t.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs px-1" style={{ color: "#475569" }}>
          {filtered.length} school{filtered.length !== 1 ? "s" : ""} shown
          {summary && (
            <>
              {" "}
              · Pending:{" "}
              <strong style={{ color: "#fbbf24" }}>
                {summary.pendingPayments}
              </strong>
            </>
          )}
        </p>
      )}
    </div>
  );
}
