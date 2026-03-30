import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@escola.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setIsLoading(true);
    setError("");
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      navigate({ to: "/dashboard" });
    } else {
      setError(result.error || "Login failed. Please try again.");
    }
  };

  return (
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
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@escola.com"
                className="h-10"
                autoComplete="email"
                data-ocid="login.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 pr-10"
                  autoComplete="current-password"
                  data-ocid="login.input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Demo credentials
            </p>
            <p className="text-xs text-foreground">
              Email:{" "}
              <span className="font-mono font-semibold">admin@escola.com</span>
            </p>
            <p className="text-xs text-foreground">
              Password:{" "}
              <span className="font-mono font-semibold">password123</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
