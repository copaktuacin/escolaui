import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

// ---- Forgot-password sub-component ----

type ForgotState = "idle" | "loading" | "success" | "error";

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [fpEmail, setFpEmail] = useState("");
  const [fpState, setFpState] = useState<ForgotState>("idle");
  const [fpMessage, setFpMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpEmail) return;
    setFpState("loading");
    setFpMessage("");

    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 800));
      setFpMessage(
        "If this email is registered, a reset link has been sent. (Demo — no email is actually sent.)",
      );
      setFpState("success");
      return;
    }

    try {
      const res = await api.post<{ message: string }>("/auth/forgot-password", {
        email: fpEmail,
      });
      if (res.success && res.data) {
        setFpMessage(res.data.message);
        setFpState("success");
      } else {
        setFpMessage(res.error ?? "Something went wrong. Please try again.");
        setFpState("error");
      }
    } catch {
      setFpMessage("Unable to connect. Please try again.");
      setFpState("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-ocid="forgot_password.dialog"
    >
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">
            Reset your password
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
            data-ocid="forgot_password.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {fpState !== "success" ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fp-email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="fp-email"
                  type="email"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="h-10"
                  autoComplete="email"
                  data-ocid="forgot_password.input"
                />
              </div>

              {fpState === "error" && (
                <div
                  className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  data-ocid="forgot_password.error_state"
                >
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{fpMessage}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-9"
                  onClick={onClose}
                  data-ocid="forgot_password.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-9"
                  disabled={fpState === "loading" || !fpEmail}
                  data-ocid="forgot_password.submit_button"
                >
                  {fpState === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div
            className="flex flex-col items-center text-center gap-3 py-2"
            data-ocid="forgot_password.success_state"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-foreground">{fpMessage}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onClose}
              data-ocid="forgot_password.close_button"
            >
              Back to sign in
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---- Main login page ----

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const { user } = useAuth();

  if (isAuthenticated && user) {
    const dest = user.role === "admin" ? "/platform-admin" : "/dashboard";
    navigate({ to: dest });
    return null;
  }

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
    if (result.success) {
      navigate({
        to:
          (result.redirectTo as "/platform-admin" | "/dashboard") ??
          "/dashboard",
      });
    } else {
      setError(result.error || "Login failed. Please try again.");
    }
  };

  return (
    <>
      <div className="min-h-screen flex">
        {/* Left panel – brand */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.2 0.04 240) 0%, oklch(0.35 0.1 255) 100%)",
          }}
        >
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                EscolaUI
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Manage your school
              <br />
              with confidence.
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-md">
              A unified platform for admissions, attendance, fees, exams,
              timetables, and staff management.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              "2,450 Students",
              "187 Teachers",
              "96.2% Attendance",
              "$112K Fees Collected",
            ].map((stat) => (
              <div key={stat} className="bg-white/10 rounded-xl p-4">
                <p className="text-white font-semibold text-sm">{stat}</p>
              </div>
            ))}
          </div>

          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
        </motion.div>

        {/* Right panel – form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <div className="flex items-center gap-2 lg:hidden mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">EscolaUI</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Sign in to your account
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Central High School Admin Portal
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              data-ocid="login.modal"
            >
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="h-10"
                  autoComplete="username"
                  data-ocid="login.input"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors underline-offset-2 hover:underline"
                    data-ocid="login.forgot_password_button"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 pr-10"
                    autoComplete="current-password"
                    data-ocid="login.password_input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  data-ocid="login.error_state"
                >
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 font-semibold"
                disabled={isLoading}
                data-ocid="login.submit_button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                    in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-xl bg-accent border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Demo credentials
              </p>
              <div className="space-y-1">
                {[
                  { username: "admin", label: "Platform Admin" },
                  { username: "principal", label: "Principal" },
                  { username: "teacher", label: "Teacher" },
                  { username: "admissions", label: "Admissions Officer" },
                  { username: "accounts", label: "Accounts Officer" },
                ].map(({ username: u, label }) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUsername(u)}
                    className="w-full text-left text-xs px-2 py-1 rounded hover:bg-background/60 transition-colors flex items-center justify-between gap-2 group"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-semibold text-foreground group-hover:text-primary transition-colors">
                      {u}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                Password:{" "}
                <span className="font-mono font-semibold text-foreground">
                  password123
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Forgot password modal */}
      <AnimatePresence>
        {showForgot && (
          <ForgotPasswordModal onClose={() => setShowForgot(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
