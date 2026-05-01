import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  type ReminderLog,
  type Tenant,
  adminGetReminderLog,
  adminGetTenants,
  adminResetPassword,
  adminSendReminders,
  adminUpdateTenant,
} from "../lib/api";
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
];

const MOCK_REMINDER_LOG: ReminderLog[] = [
  {
    id: 1,
    sentAt: "2026-04-20T10:00:00Z",
    sentBy: "admin",
    message: "Your subscription payment is overdue. Please renew immediately.",
    recipients: [{ tenantId: 3, schoolName: "Lakewood International" }],
    sentCount: 1,
    status: "Delivered",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
  Basic: "bg-blue-900/30 text-blue-400 border border-blue-700/40",
  Standard: "bg-violet-900/30 text-violet-400 border border-violet-700/40",
  Premium: "bg-amber-900/30 text-amber-400 border border-amber-700/40",
};

const PLANS: Array<"Basic" | "Standard" | "Premium"> = [
  "Basic",
  "Standard",
  "Premium",
];

const inputClass =
  "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500/40";
const inputStyle = {
  background: "#0f172a",
  borderColor: "#334155",
  color: "#e2e8f0",
};

type Tab = "overview" | "subscription" | "principal" | "reminders";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span
        className="text-xs font-semibold uppercase tracking-wide w-32 flex-shrink-0 mt-0.5"
        style={{ color: "#64748b" }}
      >
        {label}
      </span>
      <span
        className="text-sm break-words min-w-0"
        style={{ color: "#e2e8f0" }}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Extract the real numeric ID from a raw API tenant object using a catch-all scan.
 * Logs the full raw object so the exact field name is always visible in the console.
 * Priority: keys containing 'tenant'+'id' > 'school'+'id' > any key ending in 'id' > any key containing 'id' > first positive int.
 */
function getTenantId(tenant: Tenant): number | null {
  const raw = tenant as unknown as Record<string, unknown>;
  console.log(
    "[EscolaUI] getTenantId (detail) — raw tenant object:",
    JSON.stringify(raw),
  );

  const keys = Object.keys(raw);

  const isPositiveInt = (v: unknown): v is number => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 && Math.floor(n) === n;
  };

  // Tier 1: key contains both 'tenant' and 'id'
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

  // Tier 2: key contains both 'school' and 'id'
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

  // Tier 3: key ends with or equals 'id'
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

  // Tier 4: any key containing 'id'
  for (const k of keys) {
    if (k.toLowerCase().includes("id") && isPositiveInt(raw[k])) {
      console.log(
        `[EscolaUI] getTenantId — resolved via tier-4 key "${k}":`,
        raw[k],
      );
      return raw[k] as number;
    }
  }

  // Tier 5: fallback — first positive integer in the object
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
    "[EscolaUI] getTenantId — no numeric ID found. Full object:",
    JSON.stringify(raw),
  );
  return null;
}

/**
 * Normalize a raw API tenant object so that `id` is always the real numeric ID.
 * Also normalizes field names from PascalCase (.NET) to camelCase (frontend).
 */
function normalizeTenant(raw: Tenant): Tenant {
  const r = raw as unknown as Record<string, unknown>;
  const realId = getTenantId(raw);

  // Map .NET PascalCase → camelCase for all fields the frontend reads
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

export default function PlatformAdminSchoolDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };

  // Guard: if the ID param is missing or literally "undefined", redirect back
  const rawId = params.id;
  const schoolId =
    rawId && rawId !== "undefined" && rawId !== "null" ? Number(rawId) : null;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Reminder state
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderMsg, setReminderMsg] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderFeedback, setReminderFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Principal reset password state
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPw, setResettingPw] = useState(false);
  const [pwFeedback, setPwFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Subscription state
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [planFeedback, setPlanFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Status toggle
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [toggleFeedback, setToggleFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Redirect immediately if the route param is invalid
  useEffect(() => {
    if (!schoolId || !Number.isFinite(schoolId) || schoolId <= 0) {
      console.error(
        "[EscolaUI] SchoolDetailPage: invalid or missing school ID in URL param:",
        rawId,
        "— redirecting back to schools list.",
      );
      navigate({ to: "/platform-admin/schools" });
    }
  }, [schoolId, rawId, navigate]);

  // ── Fetch tenant ──────────────────────────────────────────────────────────
  const fetchTenant = useCallback(async () => {
    if (!schoolId || !Number.isFinite(schoolId) || schoolId <= 0) return;

    setLoading(true);
    setError(null);
    try {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 300));
        const found = MOCK_TENANTS.find((t) => t.id === schoolId);
        if (!found) {
          setError("School not found");
          return;
        }
        setTenant(found);
        setSelectedPlan(found.subscriptionPlan);
      } else {
        const res = await adminGetTenants(1, 200);
        if (!res.success) {
          setError(res.error ?? "Failed to load school");
          return;
        }
        const rawList: Tenant[] = Array.isArray(
          (res.data as { data?: Tenant[] })?.data,
        )
          ? (res.data as { data: Tenant[] }).data
          : Array.isArray(res.data)
            ? (res.data as unknown as Tenant[])
            : [];

        // Log the raw list to help diagnose field-name issues
        if (rawList.length > 0) {
          console.log(
            "[EscolaUI] SchoolDetail: looking for schoolId =",
            schoolId,
            "in",
            rawList.length,
            "tenants. First raw item:",
            JSON.stringify(rawList[0]),
          );
        }

        const normalizedList = rawList.map(normalizeTenant);
        const found = normalizedList.find((t) => t.id === schoolId);
        if (!found) {
          console.warn(
            "[EscolaUI] School with id",
            schoolId,
            "not found. Available normalized IDs:",
            normalizedList.map((t) => t.id),
            "— raw list logged above for reference.",
          );
          setError(
            `School not found (ID: ${String(schoolId)}). Check browser console for full raw tenant objects and available IDs.`,
          );
          return;
        }
        setTenant(found);
        setSelectedPlan(found.subscriptionPlan);
      }
    } catch {
      setError("Failed to load school details");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  // ── Fetch reminders for this tenant ──────────────────────────────────────
  const fetchReminders = useCallback(async () => {
    if (!schoolId) return;
    setReminderLoading(true);
    try {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 200));
        setReminders(
          MOCK_REMINDER_LOG.filter((r) =>
            r.recipients.some((rec) => rec.tenantId === schoolId),
          ),
        );
      } else {
        const res = await adminGetReminderLog(1, 100);
        if (res.success) {
          const all: ReminderLog[] = Array.isArray(
            (res.data as { data?: ReminderLog[] })?.data,
          )
            ? (res.data as { data: ReminderLog[] }).data
            : [];
          setReminders(
            all.filter((r) =>
              r.recipients?.some((rec) => rec.tenantId === schoolId),
            ),
          );
        }
      }
    } finally {
      setReminderLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (activeTab === "reminders") fetchReminders();
  }, [activeTab, fetchReminders]);

  // ── Toggle active/inactive ────────────────────────────────────────────────
  async function handleToggleStatus() {
    if (!tenant) return;
    const tenantId = getTenantId(tenant);
    if (!tenantId) {
      setToggleFeedback({
        type: "error",
        text: "Cannot toggle — school ID is missing",
      });
      setTimeout(() => setToggleFeedback(null), 4000);
      return;
    }

    setTogglingStatus(true);
    setToggleFeedback(null);
    const newActive = !tenant.isActive;

    // Optimistic update
    setTenant((t) => (t ? { ...t, isActive: newActive } : t));

    try {
      if (!isDemoMode()) {
        console.log(
          "[EscolaUI] Toggling tenant",
          tenantId,
          "to IsActive:",
          newActive,
        );
        const res = await adminUpdateTenant(tenantId, { isActive: newActive });
        if (!res.success) {
          // Revert on failure
          setTenant((t) => (t ? { ...t, isActive: !newActive } : t));
          const errorDetail = res.error ?? "Failed to update status";
          setToggleFeedback({ type: "error", text: errorDetail });
          setTimeout(() => setToggleFeedback(null), 6000);
          return;
        }
      }
      setToggleFeedback({
        type: "success",
        text: `School ${newActive ? "activated" : "deactivated"} successfully`,
      });
      setTimeout(() => setToggleFeedback(null), 3000);
    } catch (err) {
      // Revert on exception
      setTenant((t) => (t ? { ...t, isActive: !newActive } : t));
      setToggleFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update status",
      });
      setTimeout(() => setToggleFeedback(null), 6000);
    } finally {
      setTogglingStatus(false);
    }
  }

  // ── Change subscription plan ──────────────────────────────────────────────
  async function handleChangePlan() {
    if (!tenant || selectedPlan === tenant.subscriptionPlan) return;
    const tenantId = getTenantId(tenant);
    if (!tenantId) return;

    setUpdatingPlan(true);
    setPlanFeedback(null);
    try {
      if (!isDemoMode()) {
        // Try dedicated subscription endpoint first
        const subRes = await import("../lib/api").then(({ api }) =>
          api.put<{ success: boolean }>(
            `/TenantSettings/admin/tenants/${tenantId}/subscription`,
            { plan: selectedPlan, status: "Active" },
          ),
        );
        if (!subRes.success) {
          // On 404 or any error, fall back to the general update endpoint
          const fallback = await adminUpdateTenant(tenantId, {
            subscriptionPlan: selectedPlan as "Basic" | "Standard" | "Premium",
          });
          if (!fallback.success) throw new Error(fallback.error ?? "Failed");
        }
      }
      setTenant((t) =>
        t
          ? {
              ...t,
              subscriptionPlan: selectedPlan as
                | "Basic"
                | "Standard"
                | "Premium",
            }
          : t,
      );
      setPlanFeedback({
        type: "success",
        text: `Subscription updated to ${selectedPlan}`,
      });
      setTimeout(() => setPlanFeedback(null), 3000);
    } catch (err) {
      setPlanFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setUpdatingPlan(false);
    }
  }

  // ── Reset principal password ──────────────────────────────────────────────
  async function handleResetPassword() {
    if (!tenant || !newPassword || newPassword.length < 6) {
      setPwFeedback({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }
    const tenantId = getTenantId(tenant);
    if (!tenantId) return;

    setResettingPw(true);
    setPwFeedback(null);
    try {
      if (!isDemoMode()) {
        const res = await adminResetPassword(tenantId, newPassword);
        if (!res.success) {
          // Graceful 404 handling
          const is404 =
            res.error?.includes("Not Found") || res.error?.includes("404");
          if (is404) {
            setPwFeedback({
              type: "error",
              text: "Password reset endpoint not yet available on the server — contact your backend team",
            });
            return;
          }
          throw new Error(res.error ?? "Failed");
        }
      }
      setPwFeedback({ type: "success", text: "Password reset successfully" });
      setNewPassword("");
      setTimeout(() => setPwFeedback(null), 4000);
    } catch (err) {
      setPwFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setResettingPw(false);
    }
  }

  // ── Send reminder ─────────────────────────────────────────────────────────
  async function handleSendReminder() {
    if (!tenant || !reminderMsg.trim()) return;
    const tenantId = getTenantId(tenant);
    if (!tenantId) return;

    setSendingReminder(true);
    setReminderFeedback(null);
    try {
      if (!isDemoMode()) {
        const res = await adminSendReminders([tenantId], reminderMsg.trim());
        if (!res.success) throw new Error(res.error ?? "Failed");
      }
      setReminderMsg("");
      setReminderFeedback({
        type: "success",
        text: "Reminder sent successfully",
      });
      setTimeout(() => {
        setReminderFeedback(null);
        fetchReminders();
      }, 2000);
    } catch (err) {
      setReminderFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setSendingReminder(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // If schoolId is invalid, show redirect message while useEffect fires
  if (!schoolId || !Number.isFinite(schoolId) || schoolId <= 0) {
    return (
      <div
        className="rounded-2xl p-10 flex flex-col items-center text-center border"
        style={{ background: "#1a2234", borderColor: "#1e293b" }}
        data-ocid="school_detail.error_state"
      >
        <p className="text-sm font-semibold mb-2" style={{ color: "#f1f5f9" }}>
          Invalid school ID
        </p>
        <p className="text-xs mb-4" style={{ color: "#64748b" }}>
          The URL contains an invalid or missing school ID. Redirecting…
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/platform-admin/schools" })}
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={{
            background: "#1e293b",
            borderColor: "#334155",
            color: "#94a3b8",
          }}
        >
          ← Back to Schools
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-ocid="school_detail.loading_state">
        <div
          className="h-8 w-48 rounded-lg animate-pulse mb-6"
          style={{ background: "#1a2234" }}
        />
        <div
          className="h-44 rounded-2xl animate-pulse"
          style={{ background: "#1a2234" }}
        />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div
        className="rounded-2xl p-10 flex flex-col items-center text-center border"
        style={{ background: "#1a2234", borderColor: "#1e293b" }}
        data-ocid="school_detail.error_state"
      >
        <p className="text-sm font-semibold mb-2" style={{ color: "#f1f5f9" }}>
          {error ?? "School not found"}
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/platform-admin/schools" })}
          className="mt-3 px-4 py-2 rounded-lg text-sm font-medium border"
          style={{
            background: "#1e293b",
            borderColor: "#334155",
            color: "#94a3b8",
          }}
        >
          ← Back to Schools
        </button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "subscription", label: "Subscription" },
    { id: "principal", label: "Principal" },
    { id: "reminders", label: "Reminders" },
  ];

  return (
    <div data-ocid="school_detail.page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate({ to: "/platform-admin/schools" })}
          className="self-start flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5"
          style={{ borderColor: "#334155", color: "#94a3b8" }}
          data-ocid="school_detail.back.button"
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Schools
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* School avatar */}
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              }}
            >
              {tenant.schoolName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>
                {tenant.schoolName}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    tenant.isActive
                      ? "bg-emerald-900/40 text-emerald-400 border border-emerald-700/50"
                      : "bg-gray-800 text-gray-500 border border-gray-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${tenant.isActive ? "bg-emerald-400" : "bg-gray-600"}`}
                  />
                  {tenant.isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${PLAN_STYLES[tenant.subscriptionPlan] ?? PLAN_STYLES.Basic}`}
                >
                  {tenant.subscriptionPlan}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle active button */}
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5"
            style={{
              borderColor: tenant.isActive
                ? "rgba(248,113,113,0.3)"
                : "rgba(52,211,153,0.3)",
              color: tenant.isActive ? "#f87171" : "#34d399",
            }}
            data-ocid="school_detail.toggle_status.button"
          >
            {togglingStatus ? "…" : tenant.isActive ? "Deactivate" : "Activate"}
          </button>
          {toggleFeedback && (
            <span
              className="text-[11px] font-medium"
              style={{
                color:
                  toggleFeedback.type === "success" ? "#34d399" : "#f87171",
              }}
              data-ocid={
                toggleFeedback.type === "success"
                  ? "school_detail.toggle.success_state"
                  : "school_detail.toggle.error_state"
              }
            >
              {toggleFeedback.text}
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl border"
        style={{ background: "#1a2234", borderColor: "#1e293b" }}
        role="tablist"
        data-ocid="school_detail.tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={
              activeTab === tab.id
                ? { background: "#4f46e5", color: "#fff" }
                : { background: "transparent", color: "#64748b" }
            }
            data-ocid={`school_detail.tab.${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: "#1a2234", borderColor: "#1e293b" }}
      >
        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-5" data-ocid="school_detail.overview.panel">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#6366f1" }}
            >
              School Profile
            </p>
            <div className="space-y-3">
              <InfoRow label="School Name" value={tenant.schoolName} />
              <InfoRow label="Email" value={tenant.adminEmail} />
              <InfoRow label="Domain" value={tenant.domain} />
              <InfoRow label="Plan" value={tenant.subscriptionPlan} />
              <InfoRow label="School ID" value={String(tenant.id)} />
              <InfoRow
                label="Created"
                value={new Date(tenant.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
              {tenant.nextBillingDate && (
                <InfoRow
                  label="Next Billing"
                  value={new Date(tenant.nextBillingDate).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                />
              )}
              {(tenant.outstandingAmount ?? 0) > 0 && (
                <div className="flex gap-3">
                  <span
                    className="text-xs font-semibold uppercase tracking-wide w-32 flex-shrink-0 mt-0.5"
                    style={{ color: "#64748b" }}
                  >
                    Outstanding
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#f87171" }}
                  >
                    ₹{(tenant.outstandingAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Subscription ─────────────────────────────────────────────────── */}
        {activeTab === "subscription" && (
          <div
            className="space-y-6"
            data-ocid="school_detail.subscription.panel"
          >
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#6366f1" }}
            >
              Subscription Management
            </p>

            {/* Current plan */}
            <div
              className="p-4 rounded-xl border"
              style={{ background: "#111827", borderColor: "#1e293b" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "#64748b" }}
              >
                Current Plan
              </p>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${PLAN_STYLES[tenant.subscriptionPlan] ?? PLAN_STYLES.Basic}`}
                >
                  {tenant.subscriptionPlan}
                </span>
                {(tenant.outstandingAmount ?? 0) > 0 && (
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#f87171" }}
                  >
                    ⚠ ₹{(tenant.outstandingAmount ?? 0).toLocaleString()}{" "}
                    outstanding
                  </span>
                )}
              </div>
              {tenant.nextBillingDate && (
                <p className="text-xs mt-2" style={{ color: "#475569" }}>
                  Next billing:{" "}
                  {new Date(tenant.nextBillingDate).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
              )}
            </div>

            {/* Change plan */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#94a3b8" }}
              >
                Change Plan
              </p>
              <div className="flex gap-2 flex-wrap mb-3">
                {PLANS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPlan(p)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      selectedPlan === p
                        ? PLAN_STYLES[p]
                        : "border-gray-700 text-gray-500 hover:text-gray-300 bg-transparent"
                    }`}
                    data-ocid={`school_detail.plan.${p.toLowerCase()}.button`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {planFeedback && (
                <p
                  className="text-xs mb-3"
                  style={{
                    color:
                      planFeedback.type === "success" ? "#34d399" : "#f87171",
                  }}
                  data-ocid={
                    planFeedback.type === "success"
                      ? "school_detail.plan.success_state"
                      : "school_detail.plan.error_state"
                  }
                >
                  {planFeedback.text}
                </p>
              )}
              <button
                type="button"
                onClick={handleChangePlan}
                disabled={
                  updatingPlan || selectedPlan === tenant.subscriptionPlan
                }
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background:
                    selectedPlan === tenant.subscriptionPlan || updatingPlan
                      ? "#1e293b"
                      : "#4f46e5",
                  color:
                    selectedPlan === tenant.subscriptionPlan || updatingPlan
                      ? "#475569"
                      : "#fff",
                }}
                data-ocid="school_detail.change_plan.button"
              >
                {updatingPlan ? "Updating…" : "Update Plan"}
              </button>
            </div>
          </div>
        )}

        {/* ── Principal ────────────────────────────────────────────────────── */}
        {activeTab === "principal" && (
          <div className="space-y-6" data-ocid="school_detail.principal.panel">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#6366f1" }}
            >
              Principal Account
            </p>

            {/* Info */}
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{ background: "#111827", borderColor: "#1e293b" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                >
                  P
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#f1f5f9" }}
                  >
                    Principal
                  </p>
                  <p className="text-xs" style={{ color: "#64748b" }}>
                    {tenant.adminEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Reset password */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#94a3b8" }}
              >
                Reset Principal Password
              </p>
              {pwFeedback && (
                <p
                  className="text-xs mb-3"
                  style={{
                    color:
                      pwFeedback.type === "success" ? "#34d399" : "#f87171",
                  }}
                  data-ocid={
                    pwFeedback.type === "success"
                      ? "school_detail.pw_reset.success_state"
                      : "school_detail.pw_reset.error_state"
                  }
                >
                  {pwFeedback.text}
                </p>
              )}
              <div className="flex gap-3">
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className={inputClass}
                    style={{ ...inputStyle, paddingRight: "40px" }}
                    data-ocid="school_detail.new_password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showNewPassword ? (
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resettingPw || !newPassword}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
                  style={{
                    background:
                      resettingPw || !newPassword ? "#1e293b" : "#d97706",
                    color: resettingPw || !newPassword ? "#475569" : "#fff",
                  }}
                  data-ocid="school_detail.reset_password.button"
                >
                  {resettingPw ? "Resetting…" : "Reset"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Reminders ────────────────────────────────────────────────────── */}
        {activeTab === "reminders" && (
          <div className="space-y-6" data-ocid="school_detail.reminders.panel">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#6366f1" }}
            >
              Payment Reminders
            </p>

            {/* Send new reminder */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "#94a3b8" }}
              >
                Send New Reminder
              </p>
              <textarea
                value={reminderMsg}
                onChange={(e) => setReminderMsg(e.target.value)}
                placeholder="Type a payment reminder message…"
                rows={3}
                className={inputClass}
                style={{ ...inputStyle, resize: "vertical" }}
                data-ocid="school_detail.reminder_message.textarea"
              />
              {reminderFeedback && (
                <p
                  className="text-xs mt-2"
                  style={{
                    color:
                      reminderFeedback.type === "success"
                        ? "#34d399"
                        : "#f87171",
                  }}
                  data-ocid={
                    reminderFeedback.type === "success"
                      ? "school_detail.reminder.success_state"
                      : "school_detail.reminder.error_state"
                  }
                >
                  {reminderFeedback.text}
                </p>
              )}
              <button
                type="button"
                onClick={handleSendReminder}
                disabled={sendingReminder || !reminderMsg.trim()}
                className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background:
                    sendingReminder || !reminderMsg.trim()
                      ? "#1e293b"
                      : "#4f46e5",
                  color:
                    sendingReminder || !reminderMsg.trim() ? "#475569" : "#fff",
                }}
                data-ocid="school_detail.send_reminder.button"
              >
                {sendingReminder ? "Sending…" : "Send Reminder"}
              </button>
            </div>

            {/* Reminder log for this school */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#94a3b8" }}
              >
                Reminder History
              </p>
              {reminderLoading ? (
                <div
                  className="space-y-2"
                  data-ocid="school_detail.reminders.loading_state"
                >
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="h-16 rounded-xl animate-pulse"
                      style={{ background: "#111827" }}
                    />
                  ))}
                </div>
              ) : reminders.length === 0 ? (
                <div
                  className="p-6 rounded-xl text-center border"
                  style={{ background: "#111827", borderColor: "#1e293b" }}
                  data-ocid="school_detail.reminders.empty_state"
                >
                  <p className="text-sm" style={{ color: "#64748b" }}>
                    No reminders sent to this school yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reminders.map((r, i) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl border"
                      style={{ background: "#111827", borderColor: "#1e293b" }}
                      data-ocid={`school_detail.reminder.item.${i + 1}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm" style={{ color: "#e2e8f0" }}>
                          {r.message}
                        </p>
                        <span
                          className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            r.status === "Delivered"
                              ? "bg-emerald-900/40 text-emerald-400"
                              : r.status === "Failed"
                                ? "bg-red-900/40 text-red-400"
                                : "bg-amber-900/40 text-amber-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[11px]" style={{ color: "#475569" }}>
                        Sent by {r.sentBy} —{" "}
                        {new Date(r.sentAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
