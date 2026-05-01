import { useCallback, useEffect, useMemo, useState } from "react";
import { type ReminderLog, adminGetReminderLog } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

// ─── Demo data ────────────────────────────────────────────────────────────────

const MOCK_LOG: ReminderLog[] = [
  {
    id: 1,
    sentAt: "2026-04-15T10:30:00Z",
    sentBy: "Platform Admin",
    message:
      "Your subscription payment is overdue. Please settle the outstanding amount to avoid service interruption. Thank you, EscolaUI Platform Team.",
    recipients: [{ tenantId: 3, schoolName: "Lakewood International" }],
    sentCount: 1,
    status: "Delivered",
  },
  {
    id: 2,
    sentAt: "2026-04-10T09:00:00Z",
    sentBy: "Platform Admin",
    message:
      "Reminder: Your subscription renewal is due in 15 days. Please ensure your payment details are up to date to avoid service interruption.",
    recipients: [
      { tenantId: 2, schoolName: "Riverside Public School" },
      { tenantId: 5, schoolName: "Westbrook High School" },
    ],
    sentCount: 2,
    status: "Delivered",
  },
  {
    id: 3,
    sentAt: "2026-04-05T14:00:00Z",
    sentBy: "Platform Admin",
    message:
      "Final notice: Your account has an outstanding payment. Continued non-payment may result in account suspension. Please act immediately.",
    recipients: [{ tenantId: 3, schoolName: "Lakewood International" }],
    sentCount: 1,
    status: "Partial",
  },
  {
    id: 4,
    sentAt: "2026-03-28T11:15:00Z",
    sentBy: "Platform Admin",
    message:
      "Monthly subscription renewal reminder for all tenants. Please ensure your payment method is valid.",
    recipients: [
      { tenantId: 1, schoolName: "Springfield Academy" },
      { tenantId: 2, schoolName: "Riverside Public School" },
      { tenantId: 4, schoolName: "Greenhill Primary" },
    ],
    sentCount: 3,
    status: "Delivered",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DateFilter = "7days" | "30days" | "all";
type StatusFilter = "all" | "Delivered" | "Partial" | "Failed";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCSV(reminders: ReminderLog[]) {
  const header = "ID,Recipients,Sent At,Sent By,Count,Status,Message";
  const rows = reminders.map(
    (r) =>
      `${r.id},"${r.recipients.map((x) => x.schoolName).join("; ")}","${formatDate(r.sentAt)}","${r.sentBy}",${r.sentCount},${r.status},"${r.message.replace(/"/g, '""')}"`,
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reminder-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  Delivered: {
    badge: "bg-emerald-900/30 text-emerald-400 border-emerald-700/40",
    dot: "bg-emerald-400",
  },
  Partial: {
    badge: "bg-amber-900/30 text-amber-400 border-amber-700/40",
    dot: "bg-amber-400",
  },
  Failed: {
    badge: "bg-red-900/30 text-red-400 border-red-700/40",
    dot: "bg-red-400",
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.Partial;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ─── Expandable row ───────────────────────────────────────────────────────────

function ReminderRow({
  reminder,
  index,
}: {
  reminder: ReminderLog;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border-b"
      style={{ borderColor: "#1e293b" }}
      data-ocid={`reminder_log.row.item.${index + 1}`}
    >
      <button
        type="button"
        className="w-full px-5 py-3.5 flex flex-col md:grid gap-2 md:gap-4 md:items-center text-left transition-colors hover:bg-white/[0.02]"
        style={{ gridTemplateColumns: "2fr 1.2fr 1.8fr 1fr 1fr auto" }}
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        {/* Recipients */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
          >
            {reminder.sentCount}
          </div>
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "#e2e8f0" }}
          >
            {reminder.recipients.map((r) => r.schoolName).join(", ")}
          </p>
        </div>
        {/* Sent At */}
        <p className="text-xs" style={{ color: "#64748b" }}>
          {formatDate(reminder.sentAt)}
        </p>
        {/* Message preview */}
        <p
          className="text-xs hidden md:block overflow-hidden"
          style={{
            color: "#475569",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}
        >
          {reminder.message.slice(0, 80)}
          {reminder.message.length > 80 ? "…" : ""}
        </p>
        {/* Sent by */}
        <p className="text-xs hidden md:block" style={{ color: "#475569" }}>
          {reminder.sentBy}
        </p>
        {/* Status */}
        <StatusBadge status={reminder.status} />
        {/* Expand */}
        <span
          className="text-xs flex-shrink-0 transition-transform"
          style={{
            color: "#64748b",
            display: "inline-block",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-4" style={{ borderTop: "1px solid #1e293b" }}>
          <div
            className="rounded-xl p-4 mt-3 border"
            style={{ background: "#0f172a", borderColor: "#334155" }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "#475569" }}
            >
              Full Message
            </p>
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "#94a3b8" }}
            >
              {reminder.message}
            </p>
            <div
              className="mt-3 pt-3 border-t flex flex-wrap gap-2"
              style={{ borderColor: "#1e293b" }}
            >
              <span className="text-[11px]" style={{ color: "#475569" }}>
                Recipients:
              </span>
              {reminder.recipients.map((r) => (
                <span
                  key={r.tenantId}
                  className="text-[11px] px-2 py-0.5 rounded-full border"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    borderColor: "rgba(99,102,241,0.2)",
                    color: "#a5b4fc",
                  }}
                >
                  {r.schoolName}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminReminderLogPage() {
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notAvailable, setNotAvailable] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotAvailable(false);
    try {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 400));
        setReminders(MOCK_LOG);
      } else {
        const res = await adminGetReminderLog(1, 100);
        // Graceful 404 handling — endpoint may not be implemented yet
        const is404 =
          !res.success &&
          (res.error?.includes("Not Found") || res.error?.includes("404"));
        if (is404) {
          setNotAvailable(true);
          setReminders([]);
          return;
        }
        if (!res.success) {
          setError(res.error ?? "Failed to load reminder log.");
          return;
        }
        const d = res.data as { data?: ReminderLog[] } | null;
        const list = Array.isArray(d?.data)
          ? d.data
          : Array.isArray(res.data)
            ? (res.data as unknown as ReminderLog[])
            : [];
        setReminders(list);
      }
    } catch {
      setError("Failed to load reminder log. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const filtered = useMemo(() => {
    let result = [...reminders].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );
    if (dateFilter !== "all") {
      const days = dateFilter === "7days" ? 7 : 30;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      result = result.filter((r) => new Date(r.sentAt).getTime() >= cutoff);
    }
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      result = result.filter((r) =>
        r.recipients.some((x) =>
          x.schoolName.toLowerCase().includes(search.toLowerCase()),
        ),
      );
    }
    return result;
  }, [reminders, dateFilter, statusFilter, search]);

  const deliveredCount = reminders.filter(
    (r) => r.status === "Delivered",
  ).length;
  const partialCount = reminders.filter((r) => r.status === "Partial").length;
  const failedCount = reminders.filter((r) => r.status === "Failed").length;

  const DATE_FILTERS: { label: string; value: DateFilter }[] = [
    { label: "Last 7 days", value: "7days" },
    { label: "Last 30 days", value: "30days" },
    { label: "All time", value: "all" },
  ];

  const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
    { label: `All (${reminders.length})`, value: "all" },
    { label: `Delivered (${deliveredCount})`, value: "Delivered" },
    { label: `Partial (${partialCount})`, value: "Partial" },
    { label: `Failed (${failedCount})`, value: "Failed" },
  ];

  return (
    <div className="space-y-7" data-ocid="reminder_log.page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
          >
            📋
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
              Reminder Log
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
              Immutable audit trail of all payment reminders sent to tenant
              admins
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchLog}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{
              background: "#1e293b",
              borderColor: "#334155",
              color: "#94a3b8",
            }}
            data-ocid="reminder_log.refresh.button"
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
          {!loading && filtered.length > 0 && (
            <button
              type="button"
              onClick={() => exportCSV(filtered)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
              style={{
                background: "#1e293b",
                borderColor: "#334155",
                color: "#e2e8f0",
              }}
              data-ocid="reminder_log.export.button"
            >
              ↓ Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-4 rounded-xl border text-sm flex items-center gap-3"
          style={{
            background: "rgba(248,113,113,0.08)",
            borderColor: "rgba(248,113,113,0.25)",
            color: "#fca5a5",
          }}
          data-ocid="reminder_log.error_state"
        >
          <span style={{ color: "#f87171" }}>⚠</span>
          {error}
          <button
            type="button"
            onClick={fetchLog}
            className="ml-auto text-xs underline"
            style={{ color: "#f87171" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Not available banner */}
      {notAvailable && !loading && (
        <div
          className="p-5 rounded-xl border text-center"
          style={{
            background: "rgba(99,102,241,0.06)",
            borderColor: "rgba(99,102,241,0.2)",
          }}
          data-ocid="reminder_log.not_available_state"
        >
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: "#a5b4fc" }}
          >
            Reminder log not yet available
          </p>
          <p className="text-xs" style={{ color: "#475569" }}>
            This feature requires a backend update — the
            <code
              className="mx-1 px-1 py-0.5 rounded"
              style={{ background: "#1e293b", color: "#818cf8" }}
            >
              GET /api/TenantSettings/admin/reminders
            </code>
            endpoint has not been implemented yet.
          </p>
        </div>
      )}

      {/* Summary strip */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "Total",
              value: reminders.length,
              color: "#94a3b8",
              bg: "rgba(148,163,184,0.08)",
              border: "rgba(148,163,184,0.2)",
            },
            {
              label: "Delivered",
              value: deliveredCount,
              color: "#34d399",
              bg: "rgba(52,211,153,0.08)",
              border: "rgba(52,211,153,0.2)",
            },
            ...(partialCount > 0
              ? [
                  {
                    label: "Partial",
                    value: partialCount,
                    color: "#fbbf24",
                    bg: "rgba(251,191,36,0.08)",
                    border: "rgba(251,191,36,0.2)",
                  },
                ]
              : []),
            ...(failedCount > 0
              ? [
                  {
                    label: "Failed",
                    value: failedCount,
                    color: "#f87171",
                    bg: "rgba(248,113,113,0.08)",
                    border: "rgba(248,113,113,0.2)",
                  },
                ]
              : []),
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm"
              style={{
                background: item.bg,
                borderColor: item.border,
                color: item.color,
              }}
            >
              <span className="font-medium text-xs">{item.label}</span>
              <span className="font-bold">{item.value}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center self-center">
            <span className="text-xs italic" style={{ color: "#374151" }}>
              Read-only audit log
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1" style={{ maxWidth: "320px" }}>
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "#475569" }}
          >
            🔍
          </span>
          <input
            placeholder="Search school name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
            style={{
              background: "#1e293b",
              borderColor: "#334155",
              color: "#e2e8f0",
            }}
            data-ocid="reminder_log.search.input"
          />
        </div>

        {/* Date filter */}
        <div className="flex gap-2 flex-wrap">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDateFilter(f.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                dateFilter === f.value
                  ? { background: "#4f46e5", color: "#fff" }
                  : {
                      background: "#1e293b",
                      borderColor: "#334155",
                      color: "#64748b",
                      border: "1px solid #334155",
                    }
              }
              data-ocid={`reminder_log.date_filter.${f.value}.tab`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={
                statusFilter === f.value
                  ? {
                      background: "#334155",
                      color: "#f1f5f9",
                      border: "1px solid #475569",
                    }
                  : {
                      background: "#1e293b",
                      color: "#64748b",
                      border: "1px solid #334155",
                    }
              }
              data-ocid={`reminder_log.status_filter.${f.value}.tab`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "#1a2234", borderColor: "#1e293b" }}
      >
        {/* Column headers */}
        <div
          className="hidden md:grid px-5 py-3 border-b text-xs font-semibold uppercase tracking-wide"
          style={{
            gridTemplateColumns: "2fr 1.2fr 1.8fr 1fr 1fr auto",
            borderColor: "#1e293b",
            color: "#475569",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <span>Recipients</span>
          <span>Sent At</span>
          <span>Message Preview</span>
          <span>Sent By</span>
          <span>Status</span>
          <span className="w-4" />
        </div>

        {loading ? (
          <div data-ocid="reminder_log.loading_state">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="flex items-center gap-4 px-5 py-4 border-b"
                style={{ borderColor: "#1e293b" }}
              >
                <div
                  className="w-8 h-8 rounded-lg animate-pulse flex-shrink-0"
                  style={{ background: "#1e293b" }}
                />
                <div className="flex-1 space-y-1.5">
                  <div
                    className="h-3.5 w-40 rounded animate-pulse"
                    style={{ background: "#1e293b" }}
                  />
                  <div
                    className="h-3 w-56 rounded animate-pulse"
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
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="reminder_log.empty_state"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
              style={{ background: "#1e293b" }}
            >
              📭
            </div>
            <p className="text-base font-semibold" style={{ color: "#f1f5f9" }}>
              No reminders found
            </p>
            <p className="text-sm mt-1 max-w-xs" style={{ color: "#475569" }}>
              {reminders.length === 0
                ? "No payment reminders have been sent yet."
                : "No reminders match your current filters."}
            </p>
            {reminders.length > 0 && (
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-lg text-sm border"
                style={{
                  background: "#1e293b",
                  borderColor: "#334155",
                  color: "#94a3b8",
                }}
                onClick={() => {
                  setDateFilter("all");
                  setStatusFilter("all");
                  setSearch("");
                }}
                data-ocid="reminder_log.clear_filters.button"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((reminder, i) => (
              <ReminderRow key={reminder.id} reminder={reminder} index={i} />
            ))}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-center px-1" style={{ color: "#374151" }}>
          Showing {filtered.length} of {reminders.length} reminder
          {reminders.length !== 1 ? "s" : ""} · Log entries are read-only
        </p>
      )}
    </div>
  );
}
