import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  type PaymentSummary,
  type Tenant,
  adminGetPaymentSummary,
  adminGetReminderLog,
  adminGetTenants,
  resolveTenantId,
} from "../lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  isCurrency,
}: {
  label: string;
  value: number;
  color: string;
  isCurrency?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5 border"
      style={{ background: "#1e293b", borderColor: "#334155" }}
      data-ocid={`platform_dashboard.kpi_${label.toLowerCase().replace(/\s+/g, "_")}.card`}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: "#94a3b8" }}
      >
        {label}
      </p>
      <p className="text-3xl font-bold mt-1.5 tabular-nums" style={{ color }}>
        {isCurrency ? `₹${value.toLocaleString()}` : value.toLocaleString()}
      </p>
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        active
          ? "bg-emerald-900/40 text-emerald-400 border border-emerald-700/50"
          : "bg-gray-800 text-gray-500 border border-gray-700"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          active ? "bg-emerald-400" : "bg-gray-600"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

type RecentReminder = {
  id: number;
  schoolNames: string;
  sentAt: string;
  status: string;
  count: number;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [reminders, setReminders] = useState<RecentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, tenantsRes, remindersRes] = await Promise.all([
        adminGetPaymentSummary(),
        adminGetTenants(1, 5),
        adminGetReminderLog(1, 5),
      ]);

      // Tenant errors are critical — surface them
      if (!tenantsRes.success && tenantsRes.error?.includes("Access denied")) {
        setError(tenantsRes.error);
      }

      // Payment summary: 404 is graceful
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data as PaymentSummary);
      }

      // Tenants: handle both array and wrapped envelope
      const rawTenants = Array.isArray(tenantsRes.data)
        ? (tenantsRes.data as Tenant[])
        : Array.isArray((tenantsRes.data as { data?: Tenant[] })?.data)
          ? (tenantsRes.data as { data: Tenant[] }).data
          : [];
      setTenants(rawTenants);

      // Reminder log: graceful 404
      if (remindersRes.success && remindersRes.data) {
        const rawLogs = Array.isArray(remindersRes.data)
          ? (remindersRes.data as Record<string, unknown>[])
          : Array.isArray((remindersRes.data as { data?: unknown[] })?.data)
            ? (remindersRes.data as { data: Record<string, unknown>[] }).data
            : [];
        setReminders(
          rawLogs.slice(0, 5).map((r) => ({
            id: Number(r.id ?? r.Id ?? 0),
            schoolNames:
              [
                ...(((r.recipients ?? r.Recipients) as {
                  schoolName?: string;
                }[]) ?? []),
              ]
                .map((x) => x.schoolName ?? "")
                .filter(Boolean)
                .join(", ") || "—",
            sentAt: String(r.sentAt ?? r.SentAt ?? ""),
            status: String(r.status ?? r.Status ?? "Sent"),
            count: Number(r.sentCount ?? r.SentCount ?? 1),
          })),
        );
      }
    } catch {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    {
      label: "Total Payments",
      value: summary?.totalPayments ?? 0,
      color: "#60a5fa",
    },
    {
      label: "Total Amount",
      value: summary?.totalAmount ?? 0,
      color: "#a78bfa",
      isCurrency: true,
    },
    {
      label: "Successful",
      value: summary?.successfulPayments ?? 0,
      color: "#34d399",
    },
    { label: "Failed", value: summary?.failedPayments ?? 0, color: "#f87171" },
    {
      label: "Pending",
      value: summary?.pendingPayments ?? 0,
      color: "#fbbf24",
    },
  ];

  return (
    <div className="space-y-7" data-ocid="platform_dashboard.page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
            Platform Administration
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Welcome back, {user?.username ?? "Admin"} — monitor all tenants and
            platform activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(52,211,153,0.1)",
              border: "1px solid rgba(52,211,153,0.25)",
              color: "#34d399",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            System Online
          </span>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
            style={{
              background: "#1e293b",
              borderColor: "#334155",
              color: "#94a3b8",
            }}
            data-ocid="platform_dashboard.refresh.button"
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl p-4 border"
          style={{
            background: "rgba(248,113,113,0.08)",
            borderColor: "rgba(248,113,113,0.25)",
          }}
          data-ocid="platform_dashboard.error_state"
        >
          <p className="text-sm font-semibold" style={{ color: "#fca5a5" }}>
            {error.includes("Access denied")
              ? "Access Denied — SuperAdmin Required"
              : "Failed to load dashboard"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#f87171" }}>
            {error}
          </p>
        </div>
      )}

      {/* KPI cards */}
      {loading ? (
        <div
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
          data-ocid="platform_dashboard.kpis.loading_state"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-24 rounded-xl animate-pulse"
              style={{ background: "#1e293b" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {statCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div
        className="flex flex-wrap gap-3"
        data-ocid="platform_dashboard.quick_actions"
      >
        <a
          href="/platform-admin/schools"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "#4f46e5", color: "#fff" }}
          data-ocid="platform_dashboard.manage_tenants.button"
        >
          🏫 Manage Schools
        </a>
        <a
          href="/platform-admin/subscriptions"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
          style={{
            background: "#1e293b",
            borderColor: "#334155",
            color: "#94a3b8",
          }}
          data-ocid="platform_dashboard.go_to_subscriptions.button"
        >
          💳 View Subscriptions
        </a>
        <a
          href="/platform-admin/reminders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
          style={{
            background: "#1e293b",
            borderColor: "#334155",
            color: "#94a3b8",
          }}
          data-ocid="platform_dashboard.send_reminders.button"
        >
          🔔 Send Reminders
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Schools */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "#1a2234", borderColor: "#1e293b" }}
          data-ocid="platform_dashboard.recent_tenants.card"
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "#1e293b" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
              Recent Schools
            </h2>
            <a
              href="/platform-admin/schools"
              className="text-xs"
              style={{ color: "#6366f1" }}
            >
              View all →
            </a>
          </div>
          <div className="p-2">
            {loading ? (
              <div data-ocid="platform_dashboard.tenants.loading_state">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="flex items-center gap-3 p-3 rounded-lg"
                  >
                    <div
                      className="w-8 h-8 rounded-lg animate-pulse"
                      style={{ background: "#1e293b" }}
                    />
                    <div className="flex-1 space-y-1.5">
                      <div
                        className="h-3.5 w-32 rounded animate-pulse"
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
            ) : tenants.length === 0 ? (
              <div
                className="flex flex-col items-center py-8 text-center"
                data-ocid="platform_dashboard.tenants.empty_state"
              >
                <p className="text-sm" style={{ color: "#475569" }}>
                  No schools yet
                </p>
                <a
                  href="/platform-admin/schools"
                  className="mt-2 text-xs"
                  style={{ color: "#6366f1" }}
                >
                  Create first school →
                </a>
              </div>
            ) : (
              tenants.map((t, i) => {
                const raw = t as unknown as Record<string, unknown>;
                const principalName =
                  (raw.PrincipalName as string) ??
                  (raw.principalName as string) ??
                  "—";
                const username =
                  (raw.SchoolUsername as string) ??
                  (raw.schoolUsername as string) ??
                  (raw.AdminUsername as string) ??
                  "—";
                const initials = t.schoolName
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("");
                return (
                  <div
                    key={resolveTenantId(t) ?? i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/5"
                    data-ocid={`platform_dashboard.tenant.item.${i + 1}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "#e2e8f0" }}
                      >
                        {t.schoolName}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap mt-0.5">
                        <span
                          className="text-[11px]"
                          style={{ color: "#64748b" }}
                        >
                          <span style={{ color: "#94a3b8" }}>Principal:</span>{" "}
                          {principalName}
                        </span>
                        <span
                          className="text-[11px]"
                          style={{ color: "#64748b" }}
                        >
                          <span style={{ color: "#94a3b8" }}>User:</span>{" "}
                          {username}
                        </span>
                      </div>
                    </div>
                    <StatusDot active={t.isActive} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Reminders */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "#1a2234", borderColor: "#1e293b" }}
          data-ocid="platform_dashboard.recent_reminders.card"
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "#1e293b" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
              Recent Reminders
            </h2>
            <a
              href="/platform-admin/reminder-log"
              className="text-xs"
              style={{ color: "#6366f1" }}
            >
              View all →
            </a>
          </div>
          <div className="p-2">
            {loading ? (
              <div data-ocid="platform_dashboard.reminders.loading_state">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="flex items-center gap-3 p-3 rounded-lg"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div
                        className="h-3.5 w-40 rounded animate-pulse"
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
            ) : reminders.length === 0 ? (
              <div
                className="flex flex-col items-center py-8 text-center"
                data-ocid="platform_dashboard.reminders.empty_state"
              >
                <p className="text-sm" style={{ color: "#475569" }}>
                  No reminders sent yet
                </p>
                <a
                  href="/platform-admin/reminders"
                  className="mt-2 text-xs"
                  style={{ color: "#6366f1" }}
                >
                  Send first reminder →
                </a>
              </div>
            ) : (
              reminders.map((r, i) => (
                <div
                  key={r.id}
                  className="px-3 py-2.5 rounded-lg transition-colors hover:bg-white/5"
                  data-ocid={`platform_dashboard.reminder.item.${i + 1}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "#e2e8f0" }}
                    >
                      {r.schoolNames}
                    </p>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{
                        background: "rgba(52,211,153,0.1)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.2)",
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: "#475569" }}
                  >
                    {r.sentAt
                      ? new Date(r.sentAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}{" "}
                    · {r.count} recipient{r.count !== 1 ? "s" : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending alert */}
      {!loading && (summary?.pendingPayments ?? 0) > 0 && (
        <div
          className="rounded-2xl p-4 flex items-center justify-between gap-4 border"
          style={{
            background: "rgba(251,191,36,0.06)",
            borderColor: "rgba(251,191,36,0.2)",
          }}
          data-ocid="platform_dashboard.pending_actions.card"
        >
          <div className="flex items-center gap-3">
            <span style={{ color: "#fbbf24", fontSize: "1.25rem" }}>⚠</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
                {summary?.pendingPayments} pending payment
                {(summary?.pendingPayments ?? 0) !== 1 ? "s" : ""}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                Send reminders to collect outstanding payments
              </p>
            </div>
          </div>
          <a
            href="/platform-admin/reminders"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors"
            style={{ background: "#d97706", color: "#fff" }}
            data-ocid="platform_dashboard.send_overdue_reminders.button"
          >
            Send Reminders
          </a>
        </div>
      )}
    </div>
  );
}
