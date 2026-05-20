import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  type ReminderLog,
  type Tenant,
  adminGetReminderLog,
  adminGetTenants,
  adminResetPrincipalPassword,
  adminSendReminders,
  adminUpdateSubscription,
  adminUpdateTenant,
  api,
  resolveTenantId,
} from "../lib/api";

// ─── Styles ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500/40";
const inputStyle = {
  background: "#0f172a",
  borderColor: "#334155",
  color: "#e2e8f0",
};

const PLAN_STYLES: Record<string, string> = {
  Basic: "bg-blue-900/30 text-blue-400 border border-blue-700/40",
  Standard: "bg-violet-900/30 text-violet-400 border border-violet-700/40",
  Premium: "bg-amber-900/30 text-amber-400 border border-amber-700/40",
};
const PLANS = ["Basic", "Standard", "Premium"] as const;

type Tab = "overview" | "subscription" | "principal" | "reminders";
type Feedback = { type: "success" | "error"; text: string } | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    domain: ((r.Domain as string) ?? (r.domain as string)) || undefined,
    subscriptionPlan: ((r.SubscriptionPlan as string) ??
      (r.subscriptionPlan as string) ??
      "Basic") as "Basic" | "Standard" | "Premium",
    isActive: Boolean(
      (r.IsActive as unknown) ?? (r.isActive as unknown) ?? false,
    ),
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
    principalName:
      (r.PrincipalName as string) ?? (r.principalName as string) ?? undefined,
    schoolUsername:
      (r.SchoolUsername as string) ??
      (r.schoolUsername as string) ??
      (r.AdminUsername as string) ??
      (r.adminUsername as string) ??
      undefined,
    adminPhone:
      (r.AdminPhone as string) ??
      (r.adminPhone as string) ??
      (r.PrincipalPhone as string) ??
      (r.Phone as string) ??
      (r.phone as string) ??
      undefined,
    principalEmail:
      (r.PrincipalEmail as string) ?? (r.principalEmail as string) ?? undefined,
    principalMobileNo:
      (r.PrincipalMobileNo as string) ??
      (r.principalMobileNo as string) ??
      undefined,
    principalUserName:
      (r.PrincipalUserName as string) ??
      (r.principalUserName as string) ??
      undefined,
  } as Tenant;
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminSchoolDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };

  const rawId = params.id;
  const schoolId =
    rawId && rawId !== "undefined" && rawId !== "null" ? Number(rawId) : null;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Subscription
  const [selectedPlan, setSelectedPlan] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [subStatus, setSubStatus] = useState("Active");
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [planFeedback, setPlanFeedback] = useState<Feedback>(null);

  // Principal
  const [principalName, setPrincipalName] = useState("");
  const [principalUserName, setPrincipalUserName] = useState("");
  const [principalEmail, setPrincipalEmail] = useState("");
  const [principalMobileNo, setPrincipalMobileNo] = useState("");
  const [savingPrincipal, setSavingPrincipal] = useState(false);
  const [principalFeedback, setPrincipalFeedback] = useState<Feedback>(null);

  // Password reset
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [resettingPw, setResettingPw] = useState(false);
  const [pwFeedback, setPwFeedback] = useState<Feedback>(null);

  // Status toggle
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [toggleFeedback, setToggleFeedback] = useState<Feedback>(null);

  // Reminders tab
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderMsg, setReminderMsg] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderFeedback, setReminderFeedback] = useState<Feedback>(null);

  // Pre-fill principal form when tenant loads — handle all possible API field paths
  useEffect(() => {
    if (!tenant) return;
    // Cast to access both camelCase and PascalCase fields that may come from the API
    const t = tenant as Tenant & Record<string, unknown>;
    const principalNameVal =
      (t.principalName as string | undefined) ??
      (t.PrincipalName as string | undefined) ??
      (t.Principal as string | undefined) ??
      "";
    // Prefer principalUserName (from profileByID) over legacy schoolUsername
    const usernameVal =
      (t.principalUserName as string | undefined) ??
      (t.PrincipalUserName as string | undefined) ??
      (t.schoolUsername as string | undefined) ??
      (t.SchoolUsername as string | undefined) ??
      (t.username as string | undefined) ??
      (t.Username as string | undefined) ??
      (t.adminUsername as string | undefined) ??
      (t.AdminUsername as string | undefined) ??
      "";
    const emailVal =
      (t.principalEmail as string | undefined) ??
      (t.PrincipalEmail as string | undefined) ??
      (t.adminEmail as string | undefined) ??
      (t.AdminEmail as string | undefined) ??
      (t.Email as string | undefined) ??
      (t.email as string | undefined) ??
      "";
    // Prefer principalMobileNo (from profileByID) over legacy adminPhone
    const mobileVal =
      (t.principalMobileNo as string | undefined) ??
      (t.PrincipalMobileNo as string | undefined) ??
      (t.adminPhone as string | undefined) ??
      (t.AdminPhone as string | undefined) ??
      (t.principalPhone as string | undefined) ??
      (t.PrincipalPhone as string | undefined) ??
      (t.Phone as string | undefined) ??
      (t.phone as string | undefined) ??
      (t.Mobile as string | undefined) ??
      (t.mobile as string | undefined) ??
      "";
    console.log("[EscolaUI] Principal tab pre-fill:", {
      principalNameVal,
      usernameVal,
      emailVal,
      mobileVal,
    });
    setPrincipalName(principalNameVal);
    setPrincipalUserName(usernameVal);
    setPrincipalEmail(emailVal);
    setPrincipalMobileNo(mobileVal);
    setSelectedPlan(
      (t.subscriptionPlan as string | undefined) ??
        (t.SubscriptionPlan as string | undefined) ??
        "Basic",
    );
  }, [tenant]);

  // Redirect if invalid ID
  useEffect(() => {
    if (!schoolId || !Number.isFinite(schoolId) || schoolId <= 0) {
      console.error("[EscolaUI] SchoolDetail: invalid ID in URL:", rawId);
      navigate({ to: "/platform-admin/schools" });
    }
  }, [schoolId, rawId, navigate]);

  // Fetch tenant — always enriches from profileByID regardless of whether
  // the individual tenant endpoint exists, so principal fields always bind.
  const fetchTenant = useCallback(async () => {
    if (!schoolId || !Number.isFinite(schoolId) || schoolId <= 0) return;
    setLoading(true);
    setError(null);
    try {
      // Always fetch profileByID first — it is the authoritative source for
      // principalName, principalEmail, principalMobileNo, principalUserName.
      let profileData: Record<string, unknown> = {};
      try {
        const profileRes = await api.get<Record<string, unknown>>(
          `/school/profileByID?id=${schoolId}`,
        );
        if (profileRes.success && profileRes.data) {
          profileData = profileRes.data as Record<string, unknown>;
          console.log(
            "[EscolaUI] profileByID raw:",
            JSON.stringify(profileData),
          );
        }
      } catch {
        console.warn(
          "[EscolaUI] profileByID unavailable, will use tenant list data",
        );
      }

      // Try individual tenant endpoint
      const singleRes = await api.get<Tenant>(
        `/TenantSettings/admin/tenants/${schoolId}`,
      );
      if (singleRes.success && singleRes.data) {
        // Merge: profileByID fields win for principal details (spread last)
        const merged = normalizeTenant({
          ...(singleRes.data as Record<string, unknown>),
          ...profileData,
        });
        console.log("[EscolaUI] Tenant merged:", JSON.stringify(merged));
        setTenant(merged);
        return;
      }

      // Fallback: list search
      const listRes = await adminGetTenants(1, 200);
      if (!listRes.success) {
        // If we have profileByID data, use it even without the list
        if (Object.keys(profileData).length > 0) {
          setTenant(normalizeTenant(profileData));
          return;
        }
        setError(listRes.error ?? "Failed to load school");
        return;
      }
      const rawList: unknown[] = Array.isArray(listRes.data)
        ? (listRes.data as unknown[])
        : Array.isArray((listRes.data as { data?: unknown[] })?.data)
          ? (listRes.data as { data: unknown[] }).data
          : [];
      const normalized = rawList.map(normalizeTenant);
      const found = normalized.find((t) => t.id === schoolId);
      if (found) {
        // Merge profileByID into the found tenant so principal fields are always present
        setTenant(
          normalizeTenant({
            ...(found as unknown as Record<string, unknown>),
            ...profileData,
          }),
        );
        return;
      }
      // Last resort: use profileByID data alone
      if (Object.keys(profileData).length > 0) {
        setTenant(normalizeTenant(profileData));
        return;
      }
      setError(`School not found (ID: ${String(schoolId)})`);
    } catch {
      setError("Failed to load school details");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  // Fetch reminders for this tenant
  const fetchReminders = useCallback(async () => {
    if (!schoolId) return;
    setReminderLoading(true);
    try {
      const res = await adminGetReminderLog(1, 100);
      if (res.success) {
        const all: ReminderLog[] = Array.isArray(res.data)
          ? (res.data as ReminderLog[])
          : Array.isArray((res.data as { data?: ReminderLog[] })?.data)
            ? (res.data as { data: ReminderLog[] }).data
            : [];
        setReminders(
          all.filter((r) =>
            r.recipients?.some((rec) => rec.tenantId === schoolId),
          ),
        );
      }
    } finally {
      setReminderLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (activeTab === "reminders") fetchReminders();
  }, [activeTab, fetchReminders]);

  // Toggle active status
  async function handleToggleStatus() {
    if (!tenant) return;
    const id = resolveTenantId(tenant);
    if (!id) {
      setToggleFeedback({
        type: "error",
        text: "Cannot toggle — school ID missing",
      });
      return;
    }
    setTogglingStatus(true);
    const newActive = !tenant.isActive;
    setTenant((t) => (t ? { ...t, isActive: newActive } : t));
    try {
      const res = await adminUpdateTenant(id, { IsActive: newActive });
      if (!res.success) {
        setTenant((t) => (t ? { ...t, isActive: !newActive } : t));
        setToggleFeedback({ type: "error", text: res.error ?? "Failed" });
        setTimeout(() => setToggleFeedback(null), 6000);
        return;
      }
      setToggleFeedback({
        type: "success",
        text: `School ${newActive ? "activated" : "deactivated"}`,
      });
      setTimeout(() => setToggleFeedback(null), 3000);
    } catch (err) {
      setTenant((t) => (t ? { ...t, isActive: !newActive } : t));
      setToggleFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setTogglingStatus(false);
    }
  }

  // Update subscription
  async function handleChangePlan() {
    if (!tenant) return;
    const id = resolveTenantId(tenant);
    if (!id) return;
    setUpdatingPlan(true);
    setPlanFeedback(null);
    try {
      const res = await adminUpdateSubscription(id, {
        plan: selectedPlan,
        expiryDate:
          expiryDate ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
        status: subStatus,
      });
      if (!res.success) {
        // Fallback to general update
        const fb = await adminUpdateTenant(id, {
          SubscriptionPlan: selectedPlan,
        });
        if (!fb.success) throw new Error(fb.error ?? "Failed");
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

  // Save principal
  async function handleSavePrincipal() {
    if (!tenant) return;
    // Use schoolId from URL params directly — most reliable source
    const id = schoolId ?? resolveTenantId(tenant);
    if (!id) {
      setPrincipalFeedback({
        type: "error",
        text: "Cannot save — school ID missing",
      });
      return;
    }
    setSavingPrincipal(true);
    setPrincipalFeedback(null);
    try {
      // Send all editable principal fields in both camelCase and PascalCase
      // to maximize compatibility with whatever the backend expects
      const payload: Record<string, string | undefined> = {};
      if (principalName.trim()) {
        payload.PrincipalName = principalName.trim();
      }
      if (principalUserName.trim()) {
        payload.PrincipalUserName = principalUserName.trim();
        payload.SchoolUsername = principalUserName.trim();
        payload.AdminUsername = principalUserName.trim();
      }
      if (principalEmail.trim()) {
        payload.PrincipalEmail = principalEmail.trim();
        payload.AdminEmail = principalEmail.trim();
        payload.Email = principalEmail.trim();
      }
      if (principalMobileNo.trim()) {
        payload.PrincipalMobileNo = principalMobileNo.trim();
        payload.AdminPhone = principalMobileNo.trim();
        payload.PrincipalPhone = principalMobileNo.trim();
        payload.Phone = principalMobileNo.trim();
      }
      console.log(
        `[EscolaUI] handleSavePrincipal: PUT /tenants/${id}`,
        JSON.stringify(payload),
      );
      const res = await adminUpdateTenant(
        id,
        payload as Parameters<typeof adminUpdateTenant>[1],
      );
      if (!res.success) {
        // If backend returns 404 for this endpoint, show a clear message
        const is404 =
          res.error?.includes("404") || res.error?.includes("Not Found");
        if (is404) {
          setPrincipalFeedback({
            type: "error",
            text: "Update endpoint not yet available. Your backend needs to support PUT /TenantSettings/admin/tenants/{id}.",
          });
          return;
        }
        throw new Error(res.error ?? "Failed to save");
      }
      // Update local state from the returned data if available
      if (res.data) {
        const updated = normalizeTenant(res.data);
        setTenant(updated);
      } else {
        setTenant((t) =>
          t
            ? {
                ...t,
                principalName: principalName.trim() || t.principalName,
                principalUserName:
                  principalUserName.trim() || t.principalUserName,
                schoolUsername: principalUserName.trim() || t.schoolUsername,
                adminEmail: principalEmail.trim() || t.adminEmail,
                principalEmail: principalEmail.trim() || t.principalEmail,
                principalMobileNo:
                  principalMobileNo.trim() || t.principalMobileNo,
                adminPhone: principalMobileNo.trim() || t.adminPhone,
              }
            : t,
        );
      }
      setPrincipalFeedback({
        type: "success",
        text: "Principal details saved successfully",
      });
      setTimeout(() => setPrincipalFeedback(null), 4000);
    } catch (err) {
      setPrincipalFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setSavingPrincipal(false);
    }
  }

  // Reset password
  async function handleResetPassword() {
    if (!tenant || !newPassword || newPassword.length < 6) {
      setPwFeedback({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }
    const id = resolveTenantId(tenant);
    if (!id) return;
    setResettingPw(true);
    setPwFeedback(null);
    try {
      const res = await adminResetPrincipalPassword(id, newPassword);
      if (!res.success) {
        const is404 =
          res.error?.includes("Not Found") || res.error?.includes("404");
        if (is404) {
          setPwFeedback({
            type: "error",
            text: "Password reset endpoint not yet available on the server",
          });
          return;
        }
        throw new Error(res.error ?? "Failed");
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

  // Send reminder
  async function handleSendReminder() {
    if (!tenant || !reminderMsg.trim()) return;
    const id = resolveTenantId(tenant);
    if (!id) return;
    setSendingReminder(true);
    setReminderFeedback(null);
    try {
      const res = await adminSendReminders([id], reminderMsg.trim());
      if (!res.success) throw new Error(res.error ?? "Failed");
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

  // ─── Guards / Loading states ──────────────────────────────────────────

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

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "subscription", label: "Subscription" },
    { id: "principal", label: "Principal" },
    { id: "reminders", label: "Reminders" },
  ];

  return (
    <div data-ocid="school_detail.page">
      {/* Header */}
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

        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
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

        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5"
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

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl border"
        style={{ background: "#1a2234", borderColor: "#1e293b" }}
        role="tablist"
        data-ocid="school_detail.tabs"
      >
        {TABS.map((tab) => (
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

      {/* Panel */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: "#1a2234", borderColor: "#1e293b" }}
      >
        {/* ── OVERVIEW ── */}
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
                    { year: "numeric", month: "long", day: "numeric" },
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

        {/* ── SUBSCRIPTION ── */}
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
            </div>

            <div className="space-y-4">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "#94a3b8" }}
              >
                Change Plan
              </p>
              <div className="flex gap-2 flex-wrap">
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    htmlFor="sub-expiry"
                    className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: "#94a3b8" }}
                  >
                    Expiry Date
                  </label>
                  <input
                    id="sub-expiry"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    data-ocid="school_detail.expiry_date.input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sub-status"
                    className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: "#94a3b8" }}
                  >
                    Status
                  </label>
                  <select
                    id="sub-status"
                    value={subStatus}
                    onChange={(e) => setSubStatus(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    data-ocid="school_detail.sub_status.select"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
              {planFeedback && (
                <p
                  className="text-xs"
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
                disabled={updatingPlan}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: updatingPlan ? "#1e293b" : "#4f46e5",
                  color: updatingPlan ? "#475569" : "#fff",
                }}
                data-ocid="school_detail.change_plan.button"
              >
                {updatingPlan ? "Updating…" : "Update Subscription"}
              </button>
            </div>
          </div>
        )}

        {/* ── PRINCIPAL ── */}
        {activeTab === "principal" && (
          <div className="space-y-6" data-ocid="school_detail.principal.panel">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#6366f1" }}
            >
              Principal / Admin Account
            </p>

            <div
              className="p-5 rounded-xl border space-y-4"
              style={{ background: "#111827", borderColor: "#1e293b" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pa-pname"
                    className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: "#94a3b8" }}
                  >
                    Principal Name
                  </label>
                  <input
                    id="pa-pname"
                    type="text"
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    placeholder="Full name"
                    className={inputClass}
                    style={inputStyle}
                    data-ocid="school_detail.principal_name.input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pa-uname"
                    className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: "#94a3b8" }}
                  >
                    Principal Username
                  </label>
                  <input
                    id="pa-uname"
                    type="text"
                    value={principalUserName}
                    onChange={(e) => setPrincipalUserName(e.target.value)}
                    placeholder="Login username"
                    className={inputClass}
                    style={inputStyle}
                    data-ocid="school_detail.principal_username.input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pa-email"
                    className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: "#94a3b8" }}
                  >
                    Email Address
                  </label>
                  <input
                    id="pa-email"
                    type="email"
                    value={principalEmail}
                    onChange={(e) => setPrincipalEmail(e.target.value)}
                    placeholder="principal@school.edu"
                    className={inputClass}
                    style={inputStyle}
                    data-ocid="school_detail.principal_email.input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pa-phone"
                    className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: "#94a3b8" }}
                  >
                    Principal Mobile
                  </label>
                  <input
                    id="pa-phone"
                    type="tel"
                    value={principalMobileNo}
                    onChange={(e) => setPrincipalMobileNo(e.target.value)}
                    placeholder="+91 9876543210"
                    className={inputClass}
                    style={inputStyle}
                    data-ocid="school_detail.principal_mobile.input"
                  />
                </div>
              </div>
              {principalFeedback && (
                <p
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{
                    background:
                      principalFeedback.type === "success"
                        ? "rgba(52,211,153,0.1)"
                        : "rgba(248,113,113,0.1)",
                    color:
                      principalFeedback.type === "success"
                        ? "#34d399"
                        : "#f87171",
                    border:
                      principalFeedback.type === "success"
                        ? "1px solid rgba(52,211,153,0.25)"
                        : "1px solid rgba(248,113,113,0.25)",
                  }}
                  data-ocid={
                    principalFeedback.type === "success"
                      ? "school_detail.principal.success_state"
                      : "school_detail.principal.error_state"
                  }
                >
                  {principalFeedback.text}
                </p>
              )}
              <button
                type="button"
                onClick={handleSavePrincipal}
                disabled={savingPrincipal}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                style={{
                  background: savingPrincipal ? "#1e293b" : "#4f46e5",
                  color: savingPrincipal ? "#475569" : "#fff",
                }}
                data-ocid="school_detail.save_principal.button"
              >
                {savingPrincipal ? "Saving…" : "Save Changes"}
              </button>
            </div>

            {/* Reset Password */}
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
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className={inputClass}
                    style={{ ...inputStyle, paddingRight: "40px" }}
                    data-ocid="school_detail.new_password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide" : "Show"}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPw ? (
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

        {/* ── REMINDERS ── */}
        {activeTab === "reminders" && (
          <div className="space-y-6" data-ocid="school_detail.reminders.panel">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#6366f1" }}
            >
              Payment Reminders
            </p>

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
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs" style={{ color: "#64748b" }}>
                          {new Date(r.sentAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: "rgba(52,211,153,0.1)",
                            color: "#34d399",
                            border: "1px solid rgba(52,211,153,0.2)",
                          }}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: "#e2e8f0" }}>
                        {r.message}
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
