import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  type CreateTenantPayload,
  type Tenant,
  adminCreateTenant,
} from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

// ─── Shared style constants ───────────────────────────────────────────────────

const inputClass =
  "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500/40";
const inputStyle = {
  background: "#0f172a",
  borderColor: "#334155",
  color: "#e2e8f0",
};

const PLANS: Array<"Basic" | "Standard" | "Premium"> = [
  "Basic",
  "Standard",
  "Premium",
];

const PLAN_STYLES: Record<string, string> = {
  Basic: "bg-blue-900/30 text-blue-400 border-blue-700/40",
  Standard: "bg-violet-900/30 text-violet-400 border-violet-700/40",
  Premium: "bg-amber-900/30 text-amber-400 border-amber-700/40",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  SchoolName: string;
  SchoolAcronym: string;
  Address: string;
  Phone: string;
  Email: string;
  Motto: string;
  Website: string;
  Logo: string;
  SubscriptionPlan: string;
  PrincipalName: string;
  PrincipalUsername: string;
  PrincipalEmail: string;
  PrincipalPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{ color: "#f87171", fontSize: "11px", marginTop: "4px" }}>
      {msg}
    </p>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
      style={{ color: "#94a3b8" }}
    >
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminAddSchoolPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    SchoolName: "",
    SchoolAcronym: "",
    Address: "",
    Phone: "",
    Email: "",
    Motto: "",
    Website: "",
    Logo: "",
    SubscriptionPlan: "Basic",
    PrincipalName: "",
    PrincipalUsername: "",
    PrincipalEmail: "",
    PrincipalPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    setApiError(null);
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.SchoolName.trim()) e.SchoolName = "School name is required";
    if (!form.Email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email))
      e.Email = "Valid school email is required";
    if (form.SchoolAcronym.length > 10) e.SchoolAcronym = "Max 10 characters";
    if (form.Phone.length > 20) e.Phone = "Max 20 characters";
    if (form.Address.length > 500) e.Address = "Max 500 characters";
    if (form.Website.length > 500) e.Website = "Max 500 characters";
    if (form.Logo.length > 500) e.Logo = "Max 500 characters";
    if (form.Motto.length > 300) e.Motto = "Max 300 characters";
    if (!form.PrincipalName.trim())
      e.PrincipalName = "Principal name is required";
    if (!form.PrincipalUsername.trim())
      e.PrincipalUsername = "Username is required";
    else if (form.PrincipalUsername.length < 3)
      e.PrincipalUsername = "Username must be at least 3 characters";
    else if (/\s/.test(form.PrincipalUsername))
      e.PrincipalUsername = "Username must not contain spaces";
    if (
      !form.PrincipalEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.PrincipalEmail)
    )
      e.PrincipalEmail = "Valid principal email is required";
    if (!form.PrincipalPassword || form.PrincipalPassword.length < 6)
      e.PrincipalPassword = "Password must be at least 6 characters";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setApiError(null);

    const payload: CreateTenantPayload = {
      SchoolName: form.SchoolName.trim(),
      Email: form.Email.trim(),
      PrincipalName: form.PrincipalName.trim(),
      PrincipalUsername: form.PrincipalUsername.trim(),
      PrincipalEmail: form.PrincipalEmail.trim(),
      PrincipalPassword: form.PrincipalPassword,
      RoleId: 1,
    };
    if (form.SchoolAcronym.trim())
      payload.SchoolAcronym = form.SchoolAcronym.trim();
    if (form.Address.trim()) payload.Address = form.Address.trim();
    if (form.Phone.trim()) payload.Phone = form.Phone.trim();
    if (form.Motto.trim()) payload.Motto = form.Motto.trim();
    if (form.Website.trim()) payload.Website = form.Website.trim();
    if (form.Logo.trim()) payload.Logo = form.Logo.trim();
    if (form.SubscriptionPlan) payload.SubscriptionPlan = form.SubscriptionPlan;

    try {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 700));
        // In demo mode — navigate back with a success message encoded in the URL
        navigate({
          to: "/platform-admin/schools",
          search: { created: form.SchoolName.trim() } as Record<string, string>,
        });
        return;
      }
      const res = await adminCreateTenant(payload);
      if (!res.success) throw new Error(res.error ?? "Failed to create school");
      const created = res.data as Tenant;
      navigate({
        to: "/platform-admin/schools",
        search: { created: created.schoolName } as Record<string, string>,
      });
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Failed to create school",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: "720px" }} data-ocid="add_school.page">
      {/* Page header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate({ to: "/platform-admin/schools" })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5"
          style={{ borderColor: "#334155", color: "#94a3b8" }}
          data-ocid="add_school.back.button"
        >
          {/* Left arrow */}
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
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
            Add New School
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Register a new school tenant and create the principal login
          </p>
        </div>
      </div>

      {/* Form card */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: "#1a2234", borderColor: "#1e293b" }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* API error banner */}
          {apiError && (
            <div
              className="p-3 rounded-lg text-sm border"
              style={{
                background: "rgba(248,113,113,0.08)",
                borderColor: "rgba(248,113,113,0.25)",
                color: "#f87171",
              }}
              data-ocid="add_school.error_state"
            >
              {apiError}
            </div>
          )}

          {/* ── School Information ─────────────────────────────────── */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: "#6366f1" }}
            >
              School Information
            </p>
            <div className="space-y-4">
              {/* School Name */}
              <div>
                <SectionLabel>School Name *</SectionLabel>
                <input
                  type="text"
                  value={form.SchoolName}
                  onChange={(e) => setField("SchoolName", e.target.value)}
                  placeholder="e.g. Springfield High School"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.SchoolName ? "#f87171" : "#334155",
                  }}
                  data-ocid="add_school.school_name.input"
                />
                <FieldError msg={errors.SchoolName} />
              </div>

              {/* Acronym + Phone */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <SectionLabel>School Acronym</SectionLabel>
                  <input
                    type="text"
                    value={form.SchoolAcronym}
                    onChange={(e) => setField("SchoolAcronym", e.target.value)}
                    placeholder="e.g. SHS"
                    maxLength={10}
                    className={inputClass}
                    style={{
                      ...inputStyle,
                      borderColor: errors.SchoolAcronym ? "#f87171" : "#334155",
                    }}
                    data-ocid="add_school.school_acronym.input"
                  />
                  <p
                    style={{
                      color: "#475569",
                      fontSize: "11px",
                      marginTop: "2px",
                    }}
                  >
                    Max 10 characters
                  </p>
                  <FieldError msg={errors.SchoolAcronym} />
                </div>
                <div>
                  <SectionLabel>Phone</SectionLabel>
                  <input
                    type="text"
                    value={form.Phone}
                    onChange={(e) => setField("Phone", e.target.value)}
                    placeholder="+1 555 000 0000"
                    maxLength={20}
                    className={inputClass}
                    style={{
                      ...inputStyle,
                      borderColor: errors.Phone ? "#f87171" : "#334155",
                    }}
                    data-ocid="add_school.phone.input"
                  />
                  <FieldError msg={errors.Phone} />
                </div>
              </div>

              {/* Admin Email */}
              <div>
                <SectionLabel>Admin Email *</SectionLabel>
                <input
                  type="email"
                  value={form.Email}
                  onChange={(e) => setField("Email", e.target.value)}
                  placeholder="admin@school.edu"
                  maxLength={256}
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.Email ? "#f87171" : "#334155",
                  }}
                  data-ocid="add_school.admin_email.input"
                />
                <FieldError msg={errors.Email} />
              </div>

              {/* Address */}
              <div>
                <SectionLabel>Address</SectionLabel>
                <textarea
                  value={form.Address}
                  onChange={(e) => setField("Address", e.target.value)}
                  placeholder="123 School Lane, City, Country"
                  maxLength={500}
                  rows={2}
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.Address ? "#f87171" : "#334155",
                    resize: "vertical",
                  }}
                  data-ocid="add_school.address.input"
                />
                <FieldError msg={errors.Address} />
              </div>

              {/* Website + Logo */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <SectionLabel>Website URL</SectionLabel>
                  <input
                    type="text"
                    value={form.Website}
                    onChange={(e) => setField("Website", e.target.value)}
                    placeholder="https://school.edu"
                    maxLength={500}
                    className={inputClass}
                    style={{
                      ...inputStyle,
                      borderColor: errors.Website ? "#f87171" : "#334155",
                    }}
                    data-ocid="add_school.website.input"
                  />
                  <FieldError msg={errors.Website} />
                </div>
                <div>
                  <SectionLabel>Logo URL</SectionLabel>
                  <input
                    type="text"
                    value={form.Logo}
                    onChange={(e) => setField("Logo", e.target.value)}
                    placeholder="https://school.edu/logo.png"
                    maxLength={500}
                    className={inputClass}
                    style={{
                      ...inputStyle,
                      borderColor: errors.Logo ? "#f87171" : "#334155",
                    }}
                    data-ocid="add_school.logo.input"
                  />
                  <FieldError msg={errors.Logo} />
                </div>
              </div>

              {/* Motto */}
              <div>
                <SectionLabel>School Motto</SectionLabel>
                <input
                  type="text"
                  value={form.Motto}
                  onChange={(e) => setField("Motto", e.target.value)}
                  placeholder="e.g. Knowledge is Power"
                  maxLength={300}
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.Motto ? "#f87171" : "#334155",
                  }}
                  data-ocid="add_school.motto.input"
                />
                <FieldError msg={errors.Motto} />
              </div>

              {/* Subscription Plan */}
              <div>
                <SectionLabel>Subscription Plan</SectionLabel>
                <div className="flex gap-2 flex-wrap">
                  {PLANS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setField("SubscriptionPlan", p)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        form.SubscriptionPlan === p
                          ? PLAN_STYLES[p]
                          : "border-gray-700 text-gray-500 hover:text-gray-300 bg-transparent"
                      }`}
                      data-ocid={`add_school.plan.${p.toLowerCase()}.button`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #334155", paddingTop: "4px" }} />

          {/* ── Principal Details ──────────────────────────────────── */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: "#6366f1" }}
            >
              Principal Details
            </p>
            <div className="space-y-4">
              {/* Principal Name */}
              <div>
                <SectionLabel>Principal Name *</SectionLabel>
                <input
                  type="text"
                  value={form.PrincipalName}
                  onChange={(e) => setField("PrincipalName", e.target.value)}
                  placeholder="e.g. Dr. Jane Smith"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.PrincipalName ? "#f87171" : "#334155",
                  }}
                  data-ocid="add_school.principal_name.input"
                />
                <FieldError msg={errors.PrincipalName} />
              </div>

              {/* Principal Username */}
              <div>
                <SectionLabel>Username (for login) *</SectionLabel>
                <input
                  type="text"
                  value={form.PrincipalUsername}
                  onChange={(e) =>
                    setField("PrincipalUsername", e.target.value)
                  }
                  placeholder="e.g. jsmith.principal"
                  autoComplete="off"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.PrincipalUsername
                      ? "#f87171"
                      : "#334155",
                  }}
                  data-ocid="add_school.principal_username.input"
                />
                <p
                  style={{
                    color: "#475569",
                    fontSize: "11px",
                    marginTop: "3px",
                  }}
                >
                  This is what the principal uses to sign in — must be different
                  from their name.
                </p>
                <FieldError msg={errors.PrincipalUsername} />
              </div>

              {/* Principal Email */}
              <div>
                <SectionLabel>Principal Email *</SectionLabel>
                <input
                  type="email"
                  value={form.PrincipalEmail}
                  onChange={(e) => setField("PrincipalEmail", e.target.value)}
                  placeholder="principal@school.edu"
                  maxLength={256}
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.PrincipalEmail ? "#f87171" : "#334155",
                  }}
                  data-ocid="add_school.principal_email.input"
                />
                <FieldError msg={errors.PrincipalEmail} />
              </div>

              {/* Principal Password */}
              <div>
                <SectionLabel>Principal Password *</SectionLabel>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.PrincipalPassword}
                    onChange={(e) =>
                      setField("PrincipalPassword", e.target.value)
                    }
                    placeholder="Min 6 characters"
                    minLength={6}
                    className={inputClass}
                    style={{
                      ...inputStyle,
                      borderColor: errors.PrincipalPassword
                        ? "#f87171"
                        : "#334155",
                      paddingRight: "40px",
                    }}
                    data-ocid="add_school.principal_password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
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
                    data-ocid="add_school.principal_password_toggle.button"
                  >
                    {showPassword ? (
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
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
                        width="16"
                        height="16"
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
                <FieldError msg={errors.PrincipalPassword} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex gap-3 pt-2"
            style={{ borderTop: "1px solid #1e293b" }}
          >
            <button
              type="button"
              onClick={() => navigate({ to: "/platform-admin/schools" })}
              className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5"
              style={{
                background: "transparent",
                borderColor: "#334155",
                color: "#64748b",
              }}
              data-ocid="add_school.cancel_button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: submitting ? "#4338ca" : "#4f46e5",
                color: "#fff",
                opacity: submitting ? 0.8 : 1,
              }}
              data-ocid="add_school.submit_button"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    style={{
                      display: "inline-block",
                      width: "14px",
                      height: "14px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Creating School…
                </span>
              ) : (
                "Create School"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Spin keyframe via style tag */}
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
