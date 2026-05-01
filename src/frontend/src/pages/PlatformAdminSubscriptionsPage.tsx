import { useCallback, useEffect, useState } from "react";
import {
  type PaymentSummary,
  type Subscription,
  adminGetSubscriptionPlans,
  adminGetSubscriptions,
} from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

// ─── Demo data ────────────────────────────────────────────────────────────────

const MOCK_SUBS: Subscription[] = [
  {
    id: 1,
    tenantId: 1,
    schoolName: "Springfield Academy",
    plan: "Premium",
    status: "Active",
    startDate: "2024-09-01T00:00:00Z",
    nextBillingDate: "2026-05-01T00:00:00Z",
    amount: 4900,
    outstandingAmount: 0,
  },
  {
    id: 2,
    tenantId: 2,
    schoolName: "Riverside Public School",
    plan: "Standard",
    status: "Active",
    startDate: "2024-11-15T00:00:00Z",
    nextBillingDate: "2026-05-15T00:00:00Z",
    amount: 2900,
    outstandingAmount: 0,
  },
  {
    id: 3,
    tenantId: 3,
    schoolName: "Lakewood International",
    plan: "Basic",
    status: "Overdue",
    startDate: "2025-01-10T00:00:00Z",
    nextBillingDate: "2026-04-10T00:00:00Z",
    amount: 900,
    outstandingAmount: 2400,
  },
  {
    id: 4,
    tenantId: 4,
    schoolName: "Greenhill Primary",
    plan: "Standard",
    status: "Active",
    startDate: "2025-03-20T00:00:00Z",
    nextBillingDate: "2026-06-20T00:00:00Z",
    amount: 2900,
    outstandingAmount: 0,
  },
  {
    id: 5,
    tenantId: 5,
    schoolName: "Westbrook High School",
    plan: "Premium",
    status: "Paused",
    startDate: "2025-04-01T00:00:00Z",
    nextBillingDate: "2026-05-25T00:00:00Z",
    amount: 4900,
    outstandingAmount: 1200,
  },
];

const MOCK_SUMMARY: PaymentSummary = {
  totalPayments: 38,
  totalAmount: 10700,
  successfulPayments: 35,
  failedPayments: 1,
  pendingPayments: 2,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "Active" | "Paused" | "Overdue";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-900/30 text-emerald-400 border-emerald-700/40",
  Paused: "bg-gray-800 text-gray-400 border-gray-700",
  Overdue: "bg-red-900/30 text-red-400 border-red-700/40",
};

const PLAN_STYLES: Record<string, string> = {
  Basic: "text-blue-400",
  Standard: "text-violet-400",
  Premium: "text-amber-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLES[status] ?? STATUS_STYLES.Paused}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function daysUntil(dateStr: string) {
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

function DaysLeft({ date }: { date: string }) {
  const d = daysUntil(date);
  const color = d < 0 ? "#f87171" : d < 14 ? "#fbbf24" : "#34d399";
  return (
    <span className="text-xs font-semibold tabular-nums" style={{ color }}>
      {d < 0 ? `${Math.abs(d)}d overdue` : `${d}d`}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 400));
        setSubs(MOCK_SUBS);
        setSummary(MOCK_SUMMARY);
      } else {
        const [subsRes, summaryRes] = await Promise.all([
          adminGetSubscriptions(1, 100),
          adminGetSubscriptionPlans(),
        ]);
        const d = subsRes.data as { data?: Subscription[] } | null;
        setSubs(Array.isArray(d?.data) ? d.data : []);
        // Payment summary: graceful 404 — show zeroed KPIs rather than crashing
        if (summaryRes.success && summaryRes.data) {
          setSummary(summaryRes.data);
        } else {
          const is404 =
            summaryRes.error?.includes("Not Found") ||
            summaryRes.error?.includes("404");
          if (!is404) {
            console.warn(
              "[EscolaUI] Subscription plans error:",
              summaryRes.error,
            );
          }
          // Leave summary as null — KPI strip will not render
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = subs.filter((s) => {
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchSearch =
      !search.trim() ||
      s.schoolName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const STATUS_TABS: { label: string; value: StatusFilter }[] = [
    { label: `All (${subs.length})`, value: "all" },
    {
      label: `Active (${subs.filter((s) => s.status === "Active").length})`,
      value: "Active",
    },
    {
      label: `Paused (${subs.filter((s) => s.status === "Paused").length})`,
      value: "Paused",
    },
    {
      label: `Overdue (${subs.filter((s) => s.status === "Overdue").length})`,
      value: "Overdue",
    },
  ];

  const kpis = summary
    ? [
        {
          label: "Total Payments",
          value: (summary?.totalPayments ?? 0).toLocaleString(),
          color: "#60a5fa",
        },
        {
          label: "Total Amount",
          value: `₹${(summary?.totalAmount ?? 0).toLocaleString()}`,
          color: "#a78bfa",
        },
        {
          label: "Successful",
          value: (summary?.successfulPayments ?? 0).toLocaleString(),
          color: "#34d399",
        },
        {
          label: "Failed",
          value: (summary?.failedPayments ?? 0).toLocaleString(),
          color: "#f87171",
        },
        {
          label: "Pending",
          value: (summary?.pendingPayments ?? 0).toLocaleString(),
          color: "#fbbf24",
        },
      ]
    : [];

  return (
    <div className="space-y-6" data-ocid="subscriptions.page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
            Subscription Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Monitor all tenant subscription plans and billing status
          </p>
        </div>
      </div>

      {/* KPI strip */}
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
      ) : (
        <div
          className="rounded-xl p-4 border text-center"
          style={{ background: "#1e293b", borderColor: "#334155" }}
          data-ocid="subscriptions.kpis.empty_state"
        >
          <p className="text-sm" style={{ color: "#64748b" }}>
            Payment data not available yet
          </p>
        </div>
      )}

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
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === tab.value ? "text-white" : "border text-gray-500 hover:text-gray-300"}`}
              style={
                statusFilter === tab.value
                  ? { background: "#4f46e5" }
                  : { background: "#1e293b", borderColor: "#334155" }
              }
              data-ocid={`subscriptions.status_filter.${tab.value}.tab`}
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
        {/* Table header */}
        <div
          className="hidden md:grid gap-4 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wide"
          style={{
            borderColor: "#1e293b",
            color: "#475569",
            gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr 1.2fr",
          }}
        >
          <span>School</span>
          <span>Plan</span>
          <span>Amount</span>
          <span>Next Billing</span>
          <span>Days Left</span>
          <span>Status</span>
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
                <div
                  className="h-5 w-16 rounded-full animate-pulse"
                  style={{ background: "#1e293b" }}
                />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center py-16 text-center"
            data-ocid="subscriptions.empty_state"
          >
            <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
              No subscriptions match your filters
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
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
          </div>
        ) : (
          <div>
            {filtered.map((sub, i) => (
              <div
                key={sub.id}
                className="px-5 py-3.5 border-b transition-colors hover:bg-white/[0.02] grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-2 md:gap-4 items-center"
                style={{ borderColor: "#1e293b" }}
                data-ocid={`subscriptions.row.item.${i + 1}`}
              >
                {/* School */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    }}
                  >
                    {sub.schoolName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "#e2e8f0" }}
                  >
                    {sub.schoolName}
                  </p>
                </div>
                {/* Plan */}
                <span
                  className={`text-xs font-semibold ${PLAN_STYLES[sub.plan] ?? "text-gray-400"}`}
                >
                  {sub.plan}
                </span>
                {/* Amount */}
                <p
                  className="text-sm font-bold tabular-nums"
                  style={{ color: "#f1f5f9" }}
                >
                  ₹{sub.amount.toLocaleString()}
                </p>
                {/* Next billing */}
                <p className="text-xs" style={{ color: "#64748b" }}>
                  {new Date(sub.nextBillingDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {/* Days */}
                <DaysLeft date={sub.nextBillingDate} />
                {/* Status */}
                <StatusBadge status={sub.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div
          className="flex items-center justify-between text-xs px-1"
          style={{ color: "#475569" }}
        >
          <span>
            {filtered.length} tenant{filtered.length !== 1 ? "s" : ""} shown
          </span>
          {summary && (
            <span>
              Pending:{" "}
              <strong style={{ color: "#fbbf24" }}>
                {summary?.pendingPayments ?? 0} payment
                {(summary?.pendingPayments ?? 0) !== 1 ? "s" : ""}
              </strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
