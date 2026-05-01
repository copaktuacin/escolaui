/**
 * LoginPage — ZERO Radix UI, ZERO shadcn, ZERO AnimatePresence,
 * ZERO asChild, ZERO Slot, ZERO lucide-react imports.
 *
 * Only: React, useState, plain HTML elements, Tailwind CSS, inline SVG icons.
 * This file is intentionally self-contained to eliminate ALL React.Children.only triggers.
 */
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSchoolProfile } from "../contexts/SchoolProfileContext";
import { api } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

// ─── Inline SVG icons (no lucide-react, no @radix-ui) ───────────────────────

function IconEye() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconGraduationCap() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconAlertCircle() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconLoader() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ─── Forgot password modal (plain HTML only) ─────────────────────────────────

type ForgotState = "idle" | "loading" | "success" | "error";

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<ForgotState>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    setMessage("");

    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 700));
      setMessage(
        "If this email is registered, a reset link has been sent. (Demo — no email sent.)",
      );
      setState("success");
      return;
    }

    try {
      const res = await api.post<{ message: string }>("/auth/forgot-password", {
        email,
      });
      if (res.success) {
        setMessage(res.data?.message ?? "Reset link sent.");
        setState("success");
      } else {
        setMessage(res.error ?? "Something went wrong.");
        setState("error");
      }
    } catch {
      setMessage("Unable to connect. Please try again.");
      setState("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-ocid="forgot_password.dialog"
    >
      {/* Overlay — plain div, no Radix Dialog */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close dialog"
        className="absolute inset-0"
        style={{
          background: "rgba(8,14,28,0.78)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3
              className="text-base font-semibold font-display"
              style={{ color: "#fff" }}
            >
              Reset your password
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Enter your email to receive a reset link
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }}
            aria-label="Close"
            data-ocid="forgot_password.close_button"
          >
            <IconClose />
          </button>
        </div>

        {state !== "success" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
              }}
              autoComplete="email"
              data-ocid="forgot_password.input"
            />

            {state === "error" && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
                data-ocid="forgot_password.error_state"
              >
                <span style={{ color: "#f87171", flexShrink: 0, marginTop: 2 }}>
                  <IconAlertCircle />
                </span>
                <p className="text-sm" style={{ color: "#fca5a5" }}>
                  {message}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                data-ocid="forgot_password.cancel_button"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={state === "loading" || !email}
                className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "rgba(59,130,246,0.9)", color: "#fff" }}
                data-ocid="forgot_password.submit_button"
              >
                {state === "loading" ? <IconLoader /> : "Send reset link"}
              </button>
            </div>
          </form>
        ) : (
          <div
            className="flex flex-col items-center text-center gap-3 py-4"
            data-ocid="forgot_password.success_state"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.2)" }}
            >
              <span style={{ color: "#4ade80" }}>
                <IconCheckCircle />
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#fff" }}>
                Check your inbox
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {message}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              data-ocid="forgot_password.close_button"
            >
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Demo user list ───────────────────────────────────────────────────────────

const DEMO_CREDENTIALS = [
  {
    username: "admin",
    label: "Platform Admin",
    role: "SuperAdmin",
    color: "rgba(139,92,246,0.15)",
    roleColor: "#a78bfa",
  },
  {
    username: "principal",
    label: "Principal",
    role: "School Admin",
    color: "rgba(59,130,246,0.15)",
    roleColor: "#60a5fa",
  },
  {
    username: "teacher",
    label: "Teacher",
    role: "Staff",
    color: "rgba(34,197,94,0.15)",
    roleColor: "#4ade80",
  },
  {
    username: "admissions",
    label: "Admissions Officer",
    role: "Staff",
    color: "rgba(234,179,8,0.15)",
    roleColor: "#fbbf24",
  },
  {
    username: "accounts",
    label: "Accounts Officer",
    role: "Staff",
    color: "rgba(239,68,68,0.15)",
    roleColor: "#f87171",
  },
];

const STATS = [
  { value: "2,450+", label: "Students" },
  { value: "187", label: "Teachers" },
  { value: "96.2%", label: "Attendance" },
  { value: "16", label: "Modules" },
];

const FEATURES = [
  "16 Modules",
  "Role-Based Access",
  "Live API",
  "Multi-Tenant",
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const { profile } = useSchoolProfile();
  const navigate = useNavigate();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  // Redirect if already authenticated — use useEffect to avoid render-phase navigation
  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = user.isPlatformAdmin ? "/platform-admin" : "/dashboard";
      navigate({ to: dest });
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated && user) {
    return null;
  }

  const schoolName = profile.schoolName || "EscolaUI";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setIsLoading(true);
    setError("");
    const result = await login(username, password);
    setIsLoading(false);
    if (result.success && result.redirectTo) {
      navigate({ to: result.redirectTo as "/platform-admin" | "/dashboard" });
    } else if (!result.success) {
      setError(result.error || "Login failed. Please try again.");
    }
  };

  return (
    <>
      {/* Full-viewport layout */}
      <div
        className="min-h-screen flex overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.11 0.04 245) 0%, oklch(0.15 0.07 258) 40%, oklch(0.19 0.09 268) 70%, oklch(0.14 0.05 280) 100%)",
        }}
      >
        {/* Ambient orbs */}
        <div
          className="fixed pointer-events-none"
          style={{
            top: "-20%",
            left: "-10%",
            width: "60%",
            height: "60%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, oklch(0.35 0.14 258 / 0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="fixed pointer-events-none"
          style={{
            bottom: "-15%",
            right: "-5%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, oklch(0.45 0.18 278 / 0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* ── Left branding panel (desktop) ────────────────────────────────── */}
        <div className="hidden lg:flex w-[56%] flex-col justify-between p-14 relative overflow-hidden">
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10">
            {/* Logo row */}
            <div className="flex items-center gap-3.5 mb-14">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt={schoolName}
                  className="w-12 h-12 rounded-2xl object-contain"
                  style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }}
                >
                  <span style={{ color: "#fff" }}>
                    <IconGraduationCap />
                  </span>
                </div>
              )}
              <div>
                <span
                  className="text-xl font-bold font-display tracking-tight"
                  style={{ color: "#fff" }}
                >
                  {schoolName}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[10px] tracking-widest uppercase"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    School Management
                  </span>
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl xl:text-6xl font-bold leading-[1.08] tracking-tight font-display mb-4"
              style={{ color: "#fff" }}
            >
              Manage your school
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg, rgba(147,197,253,0.95) 0%, rgba(196,181,253,0.9) 50%, rgba(167,243,208,0.85) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                with confidence.
              </span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-[420px]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Admissions, attendance, fees, exams, timetables, and staff
              management — all in one platform.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-8">
              {FEATURES.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-4 gap-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-4 text-center"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <p
                  className="text-2xl font-bold font-display"
                  style={{ color: "#fff" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right login panel ─────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
          <div className="w-full max-w-[420px] relative z-10">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden mb-8">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt={schoolName}
                  className="w-9 h-9 rounded-xl object-contain"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <span
                    style={{
                      color: "#fff",
                      transform: "scale(0.8)",
                      display: "flex",
                    }}
                  >
                    <IconGraduationCap />
                  </span>
                </div>
              )}
              <span
                className="font-bold font-display"
                style={{ color: "#fff" }}
              >
                {schoolName}
              </span>
            </div>

            {/* Login card */}
            <div
              className="rounded-2xl p-8"
              style={{
                background: "rgba(255,255,255,0.09)",
                backdropFilter: "blur(24px) saturate(1.7)",
                WebkitBackdropFilter: "blur(24px) saturate(1.7)",
                border: error
                  ? "1px solid rgba(239,68,68,0.3)"
                  : "1px solid rgba(255,255,255,0.18)",
                boxShadow:
                  "0 20px 40px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.12)",
                transition: "border-color 300ms",
              }}
            >
              {/* Card header */}
              <div className="flex items-start gap-4 mb-7">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(59,130,246,0.25)",
                    border: "1px solid rgba(59,130,246,0.35)",
                  }}
                >
                  <span style={{ color: "#93c5fd" }}>
                    <IconShield />
                  </span>
                </div>
                <div>
                  <h2
                    className="text-2xl font-bold font-display tracking-tight leading-tight"
                    style={{ color: "#fff" }}
                  >
                    Welcome back
                  </h2>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Sign in to access your school portal
                  </p>
                </div>
              </div>

              {/* ── Form — plain HTML only ── */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                data-ocid="login.modal"
              >
                {/* Username field */}
                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Username
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="Enter your username"
                    className="w-full h-12 px-4 rounded-xl text-sm focus:outline-none transition-all duration-200"
                    style={{
                      background: error
                        ? "rgba(239,68,68,0.08)"
                        : "rgba(255,255,255,0.08)",
                      border: error
                        ? "1px solid rgba(239,68,68,0.5)"
                        : "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                    }}
                    onFocus={(e) => {
                      if (!error) {
                        e.currentTarget.style.border =
                          "1px solid rgba(255,255,255,0.5)";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(255,255,255,0.08)";
                      }
                    }}
                    onBlur={(e) => {
                      if (!error) {
                        e.currentTarget.style.border =
                          "1px solid rgba(255,255,255,0.15)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                    data-ocid="login.input"
                  />
                </div>

                {/* Password field */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full h-12 px-4 pr-12 rounded-xl text-sm focus:outline-none transition-all duration-200"
                      style={{
                        background: error
                          ? "rgba(239,68,68,0.08)"
                          : "rgba(255,255,255,0.08)",
                        border: error
                          ? "1px solid rgba(239,68,68,0.5)"
                          : "1px solid rgba(255,255,255,0.15)",
                        color: "#fff",
                      }}
                      onFocus={(e) => {
                        if (!error) {
                          e.currentTarget.style.border =
                            "1px solid rgba(255,255,255,0.5)";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(255,255,255,0.08)";
                        }
                      }}
                      onBlur={(e) => {
                        if (!error) {
                          e.currentTarget.style.border =
                            "1px solid rgba(255,255,255,0.15)";
                          e.currentTarget.style.boxShadow = "none";
                        }
                      }}
                      data-ocid="login.password_input"
                    />
                    {/* Show/hide toggle — plain button, no lucide, no Radix */}
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        background: "rgba(255,255,255,0.05)",
                      }}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      data-ocid="login.password_toggle"
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs font-medium transition-opacity duration-150 hover:opacity-70"
                    style={{ color: "#93c5fd" }}
                    data-ocid="login.forgot_password_button"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error message — plain conditional, NO AnimatePresence */}
                {error && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-xl"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                    data-ocid="login.error_state"
                  >
                    <span
                      style={{ color: "#f87171", flexShrink: 0, marginTop: 2 }}
                    >
                      <IconAlertCircle />
                    </span>
                    <p className="text-sm" style={{ color: "#fca5a5" }}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit button — plain HTML button, no shadcn, no motion.button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 mt-2"
                  style={{
                    background: "var(--color-primary)",
                    color: "var(--color-primary-foreground, #fff)",
                    boxShadow: isLoading
                      ? "none"
                      : "0 4px 20px var(--color-primary-light), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading)
                      e.currentTarget.style.background =
                        "var(--color-primary-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading)
                      e.currentTarget.style.background = "var(--color-primary)";
                  }}
                  data-ocid="login.submit_button"
                >
                  {isLoading ? (
                    <>
                      <IconLoader />
                      Signing in...
                    </>
                  ) : (
                    `Sign in to ${schoolName}`
                  )}
                </button>
              </form>
            </div>

            {/* Demo credentials panel — always visible for easy testing */}
            <div
              className="mt-4 rounded-2xl p-4"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#4ade80",
                    animation: "pulse 2s infinite",
                  }}
                />
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Quick sign-in (demo)
                </p>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                {DEMO_CREDENTIALS.map(
                  ({ username: u, label, role, color, roleColor }) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => {
                        setUsername(u);
                        setPassword("123456");
                        setError("");
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 text-left"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                      data-ocid={`login.demo_user.${u}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold uppercase"
                          style={{ background: color, color: roleColor }}
                        >
                          {u.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span
                            className="font-mono text-xs font-bold"
                            style={{ color: "#fff" }}
                          >
                            {u}
                          </span>
                          <span
                            className="text-xs ml-1.5"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            {label}
                          </span>
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: color,
                          color: roleColor,
                          border: `1px solid ${roleColor}30`,
                        }}
                      >
                        {role}
                      </span>
                    </button>
                  ),
                )}
              </div>
              <p
                className="text-[10px] mt-3 pt-2.5"
                style={{
                  color: "rgba(255,255,255,0.3)",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Password:{" "}
                <span
                  className="font-mono font-bold"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  123456
                </span>{" "}
                for all accounts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot password modal — plain conditional, NO AnimatePresence */}
      {showForgot && (
        <ForgotPasswordModal onClose={() => setShowForgot(false)} />
      )}
    </>
  );
}
