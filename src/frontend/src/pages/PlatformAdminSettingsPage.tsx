import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2,
  RefreshCw,
  Save,
  Settings2,
  WifiOff,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { getApiBaseUrl, isDemoMode } from "../lib/demoMode";

// ─── localStorage keys ───────────────────────────────────────────────────────

const LS_API_URL = "escolaui_api_url";
const LS_DEMO_OVERRIDE = "escolaui_demo_override";
const LS_TENANT_OVERRIDE = "escolaui_tenant_override";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readStorage(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

type ConnectionStatus = "idle" | "testing" | "ok" | "error";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminSettingsPage() {
  const [apiUrl, setApiUrl] = useState<string>(
    () => readStorage(LS_API_URL) || getApiBaseUrl(),
  );
  const [demoOverride, setDemoOverride] = useState<boolean>(
    () => readStorage(LS_DEMO_OVERRIDE) === "true" || isDemoMode(),
  );
  const [tenantOverride, setTenantOverride] = useState<string>(() =>
    readStorage(LS_TENANT_OVERRIDE),
  );
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("idle");

  async function testConnection() {
    setConnStatus("testing");
    try {
      // Temporarily write the URL so api.ts picks it up
      localStorage.setItem(LS_API_URL, apiUrl.trim());
      // Use /TenantSettings/config as connection test — it's AllowAnonymous and always responds if server is up
      const res = await api.get<unknown>("/TenantSettings/config");
      if (res.success) {
        setConnStatus("ok");
        toast.success("Connection successful! API is reachable.");
      } else {
        setConnStatus("error");
        toast.error(
          `API responded with error: ${res.error ?? "Unknown error"}`,
        );
      }
    } catch {
      setConnStatus("error");
      toast.error("Could not connect to the API. Check the URL and try again.");
    }
  }

  function saveSettings() {
    try {
      if (apiUrl.trim()) {
        localStorage.setItem(LS_API_URL, apiUrl.trim());
      } else {
        localStorage.removeItem(LS_API_URL);
      }

      if (demoOverride) {
        localStorage.setItem(LS_DEMO_OVERRIDE, "true");
      } else {
        localStorage.setItem(LS_DEMO_OVERRIDE, "false");
      }

      if (tenantOverride.trim()) {
        localStorage.setItem(LS_TENANT_OVERRIDE, tenantOverride.trim());
      } else {
        localStorage.removeItem(LS_TENANT_OVERRIDE);
      }

      toast.success("Settings saved. Reloading to apply…", {
        id: "settings-saved",
        duration: 2000,
      });
      // Full reload so all contexts re-initialize with the new settings
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error("Failed to save settings. Storage may be unavailable.");
    }
  }

  function resetToDefaults() {
    localStorage.removeItem(LS_API_URL);
    localStorage.removeItem(LS_DEMO_OVERRIDE);
    localStorage.removeItem(LS_TENANT_OVERRIDE);
    toast.success("Settings cleared. Reloading…", { duration: 1500 });
    setTimeout(() => window.location.reload(), 1500);
  }

  const envApiUrl =
    import.meta.env.VITE_API_BASE_URL || "https://escola.doorstepgarage.in/api";
  const envDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const envTenantId = import.meta.env.VITE_TENANT_ID || "";

  return (
    <div className="space-y-6 max-w-2xl" data-ocid="platform-settings.page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">System Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure API connectivity and demo/live mode without a rebuild.
          Settings are stored in your browser's localStorage and override
          build-time env variables.
        </p>
      </div>

      {/* Demo Mode card */}
      <Card
        className="bg-card border border-border"
        data-ocid="platform-settings.demo_mode.card"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Demo Mode</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, all API calls are bypassed and mock data is used.
            Perfect for demonstrations and evaluation without a backend.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm font-medium">Enable Demo Mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {envDemoMode
                  ? "Also forced ON by VITE_DEMO_MODE build var."
                  : "Override build-time setting via localStorage."}
              </p>
            </div>
            <Switch
              checked={demoOverride}
              onCheckedChange={setDemoOverride}
              data-ocid="platform-settings.demo_mode.switch"
            />
          </div>

          {demoOverride && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{
                background: "oklch(0.85 0.15 85 / 0.1)",
                border: "1px solid oklch(0.75 0.18 85 / 0.2)",
                color: "oklch(0.55 0.16 85)",
              }}
            >
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              Demo mode is ON — API calls are bypassed. All data is simulated.
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Configuration card */}
      <Card
        className={`bg-card border border-border ${demoOverride ? "opacity-60" : ""}`}
        data-ocid="platform-settings.api.card"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm text-foreground">
              API Configuration
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {demoOverride
              ? "Demo mode is ON — these settings are ignored while demo mode is active."
              : "Set the backend API URL for live data integration."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="api-url" className="text-sm">
              API Base URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => {
                  setApiUrl(e.target.value);
                  setConnStatus("idle");
                }}
                placeholder={envApiUrl}
                disabled={demoOverride}
                className="font-mono text-xs flex-1"
                data-ocid="platform-settings.api_url.input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={
                  demoOverride || connStatus === "testing" || !apiUrl.trim()
                }
                className="gap-1.5 text-xs h-9 flex-shrink-0"
                data-ocid="platform-settings.test_connection.button"
              >
                {connStatus === "testing" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : connStatus === "ok" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                {connStatus === "testing"
                  ? "Testing…"
                  : connStatus === "ok"
                    ? "Connected"
                    : "Test"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Build-time default:{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">
                {envApiUrl}
              </code>
            </p>
            {connStatus === "error" && (
              <p
                className="text-xs text-destructive"
                data-ocid="platform-settings.connection.error_state"
              >
                Connection failed. Check the URL is correct and the server is
                reachable.
              </p>
            )}
            {connStatus === "ok" && (
              <p
                className="text-xs text-green-600 dark:text-green-400"
                data-ocid="platform-settings.connection.success_state"
              >
                API is reachable and responding.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenant ID card */}
      <Card
        className="bg-card border border-border"
        data-ocid="platform-settings.tenant.card"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm text-foreground">
              Tenant Override
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Override which tenant/school profile is loaded. Useful for testing
            different school configurations in the same browser.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tenant-id" className="text-sm">
              Tenant ID
            </Label>
            <Input
              id="tenant-id"
              value={tenantOverride}
              onChange={(e) => setTenantOverride(e.target.value)}
              placeholder={envTenantId || "e.g. demo-escola, demo-riverside"}
              className="font-mono text-xs"
              data-ocid="platform-settings.tenant_id.input"
            />
            <p className="text-[11px] text-muted-foreground">
              Leave blank to use build-time{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">
                VITE_TENANT_ID
              </code>{" "}
              or subdomain detection.
            </p>
          </div>

          {/* Demo tenant shortcuts */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">
              Demo tenant IDs:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "demo-escola",
                "demo-city-academy",
                "demo-sunrise",
                "demo-greenfield",
                "demo-riverside",
              ].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTenantOverride(id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    tenantOverride === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  data-ocid={`platform-settings.tenant_shortcut.${id}.button`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current effective settings */}
      <Card
        className="bg-muted/40 border border-border"
        data-ocid="platform-settings.current.card"
      >
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Current Effective Settings
          </p>
          <div className="space-y-2">
            {[
              {
                label: "Demo Mode",
                value: isDemoMode() ? "ON (active)" : "OFF",
                highlight: isDemoMode(),
              },
              {
                label: "API Base URL",
                value: getApiBaseUrl(),
                highlight: false,
              },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 text-xs"
              >
                <span className="text-muted-foreground">{label}</span>
                <span
                  className={`font-mono truncate max-w-[240px] text-right ${
                    highlight
                      ? "text-yellow-600 dark:text-yellow-400 font-semibold"
                      : "text-foreground"
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            These reflect the current runtime values. Save + reload to update
            after changes.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          className="text-xs gap-1.5"
          data-ocid="platform-settings.reset.button"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset to Defaults
        </Button>
        <Button
          onClick={saveSettings}
          className="gap-2"
          data-ocid="platform-settings.save.button"
        >
          <Save className="w-4 h-4" />
          Save &amp; Reload
        </Button>
      </div>
    </div>
  );
}
