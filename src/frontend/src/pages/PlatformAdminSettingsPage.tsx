import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2,
  Database,
  FlaskConical,
  RefreshCw,
  Save,
  Server,
  Settings2,
  Shield,
  WifiOff,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { isDemoMode } from "../lib/demoMode";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = "https://escola.doorstepgarage.in/api";
const LS_DEMO_OVERRIDE = "escolaui_demo_override";
const LS_TENANT_OVERRIDE = "escolaui_tenant_override";

const DEMO_TENANT_SHORTCUTS = [
  "demo-escola",
  "demo-city-academy",
  "demo-sunrise",
  "demo-greenfield",
  "demo-riverside",
];

const DEMO_CREDENTIALS = [
  {
    username: "admin",
    password: "123456 or password123",
    role: "Platform Admin (SuperAdmin)",
  },
  {
    username: "principal",
    password: "password123",
    role: "Principal / School Admin",
  },
  { username: "teacher", password: "password123", role: "Teacher" },
  {
    username: "admissions",
    password: "password123",
    role: "Admission Officer",
  },
  { username: "accounts", password: "password123", role: "Account Officer" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readStorage(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

type ConnectionStatus = "idle" | "testing" | "ok" | "error";

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  icon: Icon,
  iconColor,
  borderColor,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  borderColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl glass-dark border ${borderColor} overflow-hidden`}
    >
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/30 flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-800/80 border ${borderColor}`}
        >
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminSettingsPage() {
  const [demoOverride, setDemoOverride] = useState<boolean>(
    () => readStorage(LS_DEMO_OVERRIDE) === "true" || isDemoMode(),
  );
  const [tenantOverride, setTenantOverride] = useState<string>(() =>
    readStorage(LS_TENANT_OVERRIDE),
  );
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("idle");
  const [lastTested, setLastTested] = useState<Date | null>(null);

  const envDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const envTenantId = import.meta.env.VITE_TENANT_ID || "";

  async function testConnection() {
    setConnStatus("testing");
    try {
      // Bare fetch with NO headers — AllowAnonymous endpoint
      const res = await fetch(`${API_BASE}/TenantSettings/config`);
      if (res.ok) {
        setConnStatus("ok");
        setLastTested(new Date());
        toast.success("Connection successful! API is reachable.");
      } else {
        setConnStatus("error");
        toast.error(`API responded with HTTP ${res.status}`);
      }
    } catch {
      setConnStatus("error");
      toast.error("Could not connect to the API. Check network and try again.");
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(LS_DEMO_OVERRIDE, demoOverride ? "true" : "false");
      if (tenantOverride.trim())
        localStorage.setItem(LS_TENANT_OVERRIDE, tenantOverride.trim());
      else localStorage.removeItem(LS_TENANT_OVERRIDE);
      localStorage.removeItem("escolaui_api_url");
      toast.success("Settings saved. Reloading to apply…", {
        id: "settings-saved",
        duration: 2000,
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error("Failed to save settings. Storage may be unavailable.");
    }
  }

  function resetToDefaults() {
    localStorage.removeItem(LS_DEMO_OVERRIDE);
    localStorage.removeItem(LS_TENANT_OVERRIDE);
    localStorage.removeItem("escolaui_api_url");
    toast.success("Settings cleared. Reloading…", { duration: 1500 });
    setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div className="space-y-7 max-w-2xl" data-ocid="platform-settings.page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600/20 to-slate-800/10 border border-slate-600/30 flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            System Settings
          </h1>
          <p className="text-sm text-slate-400">
            Platform configuration, API connectivity, and demo mode
          </p>
        </div>
      </motion.div>

      {/* Demo Mode */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SectionCard
          title="Demo Mode"
          description="When enabled, all API calls are bypassed and mock data is used for demonstrations."
          icon={Zap}
          iconColor="text-amber-400"
          borderColor="border-amber-500/20"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-white">
                  Enable Demo Mode
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  {envDemoMode
                    ? "Also forced ON by VITE_DEMO_MODE build variable."
                    : "Override build-time setting via localStorage."}
                </p>
              </div>
              <Switch
                checked={demoOverride}
                onCheckedChange={setDemoOverride}
                className="data-[state=checked]:bg-amber-500"
                data-ocid="platform-settings.demo_mode.switch"
              />
            </div>
            {demoOverride && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400"
              >
                <FlaskConical className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Demo mode is <strong>ON</strong> — All API calls are bypassed.
                  All data is simulated local mock data.
                </span>
              </motion.div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-1">
                You can also activate demo mode by appending{" "}
                <code className="bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-300 font-mono">
                  ?demo=true
                </code>{" "}
                to any URL — no settings change required.
              </p>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* API Connectivity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <SectionCard
          title="API Connectivity"
          description="The API base URL is hardcoded to the production server. Verify server reachability here."
          icon={Server}
          iconColor="text-blue-400"
          borderColor="border-blue-500/20"
        >
          <div className="space-y-4">
            {/* URL display (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                API Base URL
              </Label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50">
                <Database className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <code className="font-mono text-xs text-slate-300 flex-1 break-all">
                  {API_BASE}
                </code>
                <span className="text-[10px] text-slate-600 flex-shrink-0">
                  read-only
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                The API base URL is hardcoded and cannot be changed through
                settings. All requests use this URL including login, student,
                teacher, and admin endpoints.
              </p>
            </div>

            {/* Test connection */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={demoOverride || connStatus === "testing"}
                className="gap-2 text-xs h-9 border-slate-600 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40"
                data-ocid="platform-settings.test_connection.button"
              >
                {connStatus === "testing" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : connStatus === "ok" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5" />
                )}
                {connStatus === "testing"
                  ? "Testing…"
                  : connStatus === "ok"
                    ? "Connected"
                    : "Test Connection"}
              </Button>
              {lastTested && (
                <span className="text-xs text-slate-500">
                  Last tested {lastTested.toLocaleTimeString()}
                </span>
              )}
            </div>

            {connStatus === "error" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400"
                data-ocid="platform-settings.connection.error_state"
              >
                <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
                Connection failed. Check that the server is reachable and CORS
                is configured correctly.
              </motion.div>
            )}
            {connStatus === "ok" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                data-ocid="platform-settings.connection.success_state"
              >
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                API is reachable and responding correctly.
              </motion.div>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* Tenant Override */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SectionCard
          title="Tenant Override"
          description="Override which tenant/school profile is loaded for testing purposes."
          icon={Shield}
          iconColor="text-violet-400"
          borderColor="border-violet-500/20"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="tenant-id"
                className="text-xs font-medium text-slate-400 uppercase tracking-wide"
              >
                Tenant ID
              </Label>
              <input
                id="tenant-id"
                value={tenantOverride}
                onChange={(e) => setTenantOverride(e.target.value)}
                placeholder={envTenantId || "e.g. demo-escola, demo-riverside"}
                className="flex h-10 w-full rounded-xl border border-slate-600/60 bg-slate-800/60 px-4 py-2 font-mono text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                data-ocid="platform-settings.tenant_id.input"
              />
              <p className="text-[11px] text-slate-600">
                Leave blank to use build-time{" "}
                <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                  VITE_TENANT_ID
                </code>{" "}
                or subdomain detection.
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 mb-2 uppercase tracking-wide">
                Demo tenant shortcuts:
              </p>
              <div className="flex flex-wrap gap-2">
                {DEMO_TENANT_SHORTCUTS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTenantOverride(id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                      tenantOverride === id
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/80 hover:text-white border border-slate-600/50"
                    }`}
                    data-ocid={`platform-settings.tenant_shortcut.${id}.button`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Demo Credentials */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <SectionCard
          title="Demo Credentials"
          description="Use these credentials to log in when Demo Mode is active."
          icon={FlaskConical}
          iconColor="text-amber-400"
          borderColor="border-amber-500/15"
        >
          <div className="rounded-xl overflow-hidden border border-slate-700/50">
            <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-0 bg-slate-800/60">
              {["Username", "Password", "Role"].map((h) => (
                <div key={h} className="px-4 py-2 border-b border-slate-700/50">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    {h}
                  </span>
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-700/30">
              {DEMO_CREDENTIALS.map((cred, i) => (
                <div
                  key={cred.username}
                  className="grid grid-cols-[1fr_1fr_1.5fr] items-center"
                  data-ocid={`platform-settings.demo_credential.item.${i + 1}`}
                >
                  <div className="px-4 py-2.5">
                    <code className="text-xs font-mono text-blue-400">
                      {cred.username}
                    </code>
                  </div>
                  <div className="px-4 py-2.5">
                    <code className="text-xs font-mono text-slate-400">
                      {cred.password}
                    </code>
                  </div>
                  <div className="px-4 py-2.5">
                    <span className="text-xs text-slate-400">{cred.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Effective settings summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="rounded-2xl glass-dark border border-slate-700/40 overflow-hidden"
          data-ocid="platform-settings.current.card"
        >
          <div className="px-5 py-3 border-b border-slate-700/40 bg-slate-800/20">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Current Effective Settings
            </p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {[
              {
                label: "Demo Mode",
                value: isDemoMode() ? "ON (active)" : "OFF",
                highlight: isDemoMode(),
              },
              { label: "API Base URL", value: API_BASE, highlight: false },
              {
                label: "Tenant ID",
                value: tenantOverride || envTenantId || "auto-detect",
                highlight: false,
              },
              {
                label: "Platform Version",
                value: "EscolaUI v3.0.0",
                highlight: false,
              },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 py-1 border-b border-slate-800/60 last:border-0"
              >
                <span className="text-xs text-slate-500">{label}</span>
                <span
                  className={`font-mono text-xs truncate max-w-[240px] text-right ${
                    highlight
                      ? "text-amber-400 font-semibold"
                      : "text-slate-300"
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4">
            <p className="text-[11px] text-slate-600">
              These reflect the current runtime values. Save + reload to update
              after changes.
            </p>
          </div>
        </div>
      </motion.div>

      <Separator className="bg-slate-800" />

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex items-center justify-between gap-3 flex-wrap"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          className="text-xs gap-1.5 border-slate-600 bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white"
          data-ocid="platform-settings.reset.button"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset to Defaults
        </Button>
        <Button
          onClick={saveSettings}
          className="gap-2 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-elevated"
          data-ocid="platform-settings.save.button"
        >
          <Save className="w-4 h-4" />
          Save &amp; Reload
        </Button>
      </motion.div>
    </div>
  );
}
