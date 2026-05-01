import { useCallback, useEffect, useState } from "react";
import { type Tenant, adminGetTenants, adminSendReminders } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

// ─── Demo data ────────────────────────────────────────────────────────────────

const MOCK_TENANTS: Tenant[] = [
  {
    id: 1,
    schoolName: "Springfield Academy",
    adminEmail: "admin@springfield.edu",
    subscriptionPlan: "Premium",
    isActive: true,
    createdAt: "2024-09-01T00:00:00Z",
  },
  {
    id: 2,
    schoolName: "Riverside Public School",
    adminEmail: "admin@riverside.edu",
    subscriptionPlan: "Standard",
    isActive: true,
    createdAt: "2024-11-15T00:00:00Z",
  },
  {
    id: 3,
    schoolName: "Lakewood International",
    adminEmail: "admin@lakewood.edu",
    subscriptionPlan: "Basic",
    isActive: false,
    createdAt: "2025-01-10T00:00:00Z",
    outstandingAmount: 2400,
  },
  {
    id: 4,
    schoolName: "Greenhill Primary",
    adminEmail: "admin@greenhill.edu",
    subscriptionPlan: "Standard",
    isActive: true,
    createdAt: "2025-03-20T00:00:00Z",
  },
  {
    id: 5,
    schoolName: "Westbrook High School",
    adminEmail: "admin@westbrook.edu",
    subscriptionPlan: "Premium",
    isActive: true,
    createdAt: "2025-04-01T00:00:00Z",
    outstandingAmount: 1200,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminRemindersPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [filter, setFilter] = useState<"all" | "overdue">("all");

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 400));
        setTenants(MOCK_TENANTS);
      } else {
        const res = await adminGetTenants(1, 100);
        const d = res.data as { data?: Tenant[] } | null;
        setTenants(Array.isArray(d?.data) ? d.data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const visibleTenants =
    filter === "overdue"
      ? tenants.filter((t) => (t.outstandingAmount ?? 0) > 0 || !t.isActive)
      : tenants;

  const allChecked =
    visibleTenants.length > 0 && selected.size === visibleTenants.length;
  const someChecked =
    selected.size > 0 && selected.size < visibleTenants.length;

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(visibleTenants.map((t) => t.id)));
  }

  function toggleTenant(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllOverdue() {
    const overdueIds = tenants
      .filter((t) => (t.outstandingAmount ?? 0) > 0 || !t.isActive)
      .map((t) => t.id);
    setSelected(new Set(overdueIds));
  }

  const overdueCount = tenants.filter(
    (t) => (t.outstandingAmount ?? 0) > 0 || !t.isActive,
  ).length;

  async function handleSend() {
    if (selected.size === 0) return;
    const msg =
      message.trim() ||
      "Dear School Admin,\n\nThis is a payment reminder from EscolaUI Platform. Please ensure your subscription payment is settled at the earliest to avoid service interruption.\n\nThank you,\nEscolaUI Platform Team";
    setSending(true);
    setResult(null);
    try {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 1200));
        setResult({
          type: "success",
          text: `Reminder sent to ${selected.size} school${selected.size !== 1 ? "s" : ""} successfully (demo mode)`,
        });
        setSelected(new Set());
        setMessage("");
      } else {
        const res = await adminSendReminders(Array.from(selected), msg);
        if (!res.success) {
          // Graceful 404 handling — endpoint may not be implemented yet
          const is404 =
            res.error?.includes("Not Found") || res.error?.includes("404");
          if (is404) {
            setResult({
              type: "error",
              text: "Reminder feature not yet available on the server — contact your backend team",
            });
            return;
          }
          throw new Error(res.error ?? "Failed to send reminders");
        }
        const count =
          (res.data as { sentCount?: number })?.sentCount ?? selected.size;
        setResult({
          type: "success",
          text: `Reminders sent to ${count} school${count !== 1 ? "s" : ""} successfully`,
        });
        setSelected(new Set());
        setMessage("");
      }
    } catch (err) {
      setResult({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to send reminders",
      });
    } finally {
      setSending(false);
      setTimeout(() => setResult(null), 6000);
    }
  }

  return (
    <div className="space-y-7" data-ocid="reminders.page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
            Send Payment Reminders
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Select schools and send in-app payment reminders
          </p>
        </div>
        {overdueCount > 0 && (
          <button
            type="button"
            onClick={selectAllOverdue}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
            style={{
              background: "rgba(248,113,113,0.08)",
              borderColor: "rgba(248,113,113,0.25)",
              color: "#f87171",
            }}
            data-ocid="reminders.select_all_overdue.button"
          >
            ⚠ Select All Overdue ({overdueCount})
          </button>
        )}
      </div>

      {/* Result feedback */}
      {result && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium ${result.type === "success" ? "bg-emerald-900/20 border-emerald-700/40 text-emerald-400" : "bg-red-900/20 border-red-700/40 text-red-400"}`}
          data-ocid={`reminders.${result.type}_state`}
        >
          {result.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Left: school selection */}
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-2">
            {[
              {
                label: `All Schools (${tenants.length})`,
                value: "all" as const,
              },
              {
                label: `Overdue / Inactive (${overdueCount})`,
                value: "overdue" as const,
              },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setFilter(f.value);
                  setSelected(new Set());
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.value ? "text-white" : "border text-gray-500 hover:text-gray-300"}`}
                style={
                  filter === f.value
                    ? { background: "#4f46e5" }
                    : { background: "#1e293b", borderColor: "#334155" }
                }
                data-ocid={`reminders.filter.${f.value}.tab`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Selected count */}
          <div className="flex items-center justify-between">
            <span
              className="text-sm"
              style={{ color: selected.size > 0 ? "#818cf8" : "#475569" }}
              data-ocid="reminders.selected_count.badge"
            >
              {selected.size > 0
                ? `${selected.size} school${selected.size !== 1 ? "s" : ""} selected`
                : "No schools selected"}
            </span>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs transition-colors"
                style={{ color: "#475569" }}
                data-ocid="reminders.deselect_all.button"
              >
                Deselect all
              </button>
            )}
          </div>

          {/* School list */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "#1a2234", borderColor: "#1e293b" }}
          >
            {/* Select all header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{
                borderColor: "#1e293b",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <button
                type="button"
                onClick={toggleAll}
                className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  borderColor:
                    allChecked || someChecked ? "#6366f1" : "#334155",
                  background: allChecked ? "#6366f1" : "transparent",
                }}
                aria-label="Select all schools"
                data-ocid="reminders.select_all.checkbox"
              >
                {(allChecked || someChecked) && (
                  <span
                    style={{
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: "bold",
                    }}
                  >
                    {someChecked && !allChecked ? "−" : "✓"}
                  </span>
                )}
              </button>
              <span
                className="text-sm font-medium"
                style={{ color: "#94a3b8" }}
              >
                Select All ({visibleTenants.length})
              </span>
              {selected.size > 0 && (
                <span
                  className="ml-auto text-xs font-medium"
                  style={{ color: "#6366f1" }}
                >
                  {selected.size} selected
                </span>
              )}
            </div>

            {loading ? (
              <div data-ocid="reminders.tenants.loading_state">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="flex items-center gap-3 px-4 py-3 border-b"
                    style={{ borderColor: "#1e293b" }}
                  >
                    <div
                      className="w-4 h-4 rounded animate-pulse"
                      style={{ background: "#1e293b" }}
                    />
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
            ) : visibleTenants.length === 0 ? (
              <div
                className="flex flex-col items-center py-10 text-center"
                data-ocid="reminders.tenants.empty_state"
              >
                <p className="text-sm" style={{ color: "#475569" }}>
                  No schools match this filter
                </p>
              </div>
            ) : (
              <div>
                {visibleTenants.map((tenant, i) => {
                  const isChecked = selected.has(tenant.id);
                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => toggleTenant(tenant.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors"
                      style={{
                        borderColor: "#1e293b",
                        background: isChecked
                          ? "rgba(99,102,241,0.06)"
                          : "transparent",
                        borderLeft: isChecked
                          ? "2px solid #6366f1"
                          : "2px solid transparent",
                      }}
                      data-ocid={`reminders.tenant.item.${i + 1}`}
                    >
                      <div
                        className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          borderColor: isChecked ? "#6366f1" : "#334155",
                          background: isChecked ? "#6366f1" : "transparent",
                        }}
                        data-ocid={`reminders.tenant.checkbox.${i + 1}`}
                      >
                        {isChecked && (
                          <span
                            style={{
                              color: "#fff",
                              fontSize: "9px",
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, #4f46e5, #7c3aed)",
                        }}
                      >
                        {tenant.schoolName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: "#e2e8f0" }}
                        >
                          {tenant.schoolName}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "#475569" }}
                        >
                          {tenant.subscriptionPlan}
                          {(tenant.outstandingAmount ?? 0) > 0 &&
                            ` · Outstanding: ₹${(tenant.outstandingAmount ?? 0).toLocaleString()}`}
                        </p>
                      </div>
                      {!tenant.isActive && (
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={{
                            background: "rgba(248,113,113,0.1)",
                            color: "#f87171",
                            border: "1px solid rgba(248,113,113,0.2)",
                          }}
                        >
                          Inactive
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: message + send */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Message editor */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "#1a2234", borderColor: "#1e293b" }}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: "#1e293b" }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: "#f1f5f9" }}
              >
                Reminder Message
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                Leave blank to use a default message
              </p>
            </div>
            <div className="p-5">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Dear [School Name] Admin,&#10;&#10;This is a payment reminder..."
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500/40"
                style={{
                  background: "#0f172a",
                  borderColor: "#334155",
                  color: "#e2e8f0",
                }}
                data-ocid="reminders.message.textarea"
              />
              {message.length > 0 && (
                <p
                  className="text-xs mt-1 text-right"
                  style={{ color: "#475569" }}
                >
                  {message.length} chars
                </p>
              )}
            </div>
          </div>

          {/* Message preview */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "#0f172a", borderColor: "#1e293b" }}
          >
            <div
              className="px-5 py-3 border-b"
              style={{ borderColor: "#1e293b" }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: "#475569" }}
              >
                Message Preview
              </span>
            </div>
            <div className="p-4">
              <div
                className="rounded-xl border p-3.5"
                style={{ background: "#1e293b", borderColor: "#334155" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.2)" }}
                  >
                    <span style={{ fontSize: "10px" }}>🔔</span>
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#818cf8" }}
                  >
                    EscolaUI Platform
                  </span>
                  <span
                    className="text-[10px] ml-auto"
                    style={{ color: "#374151" }}
                  >
                    just now
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed whitespace-pre-wrap line-clamp-5"
                  style={{ color: "#94a3b8" }}
                >
                  {message.trim() ||
                    "Dear School Admin,\n\nThis is a payment reminder from EscolaUI Platform. Please ensure your subscription payment is settled at the earliest to avoid service interruption.\n\nThank you,\nEscolaUI Platform Team"}
                </p>
              </div>
            </div>
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            className="w-full h-11 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: selected.size > 0 && !sending ? "#4f46e5" : "#374151",
              color: "#fff",
            }}
            data-ocid="reminders.send.button"
          >
            {sending
              ? "Sending…"
              : selected.size > 0
                ? `Send Reminder to ${selected.size} School${selected.size !== 1 ? "s" : ""}`
                : "Select schools to send"}
          </button>

          {selected.size === 0 && (
            <p className="text-xs text-center" style={{ color: "#374151" }}>
              Select at least one school to send a reminder
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
