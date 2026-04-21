import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Eye,
  Send,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { isDemoMode } from "../lib/demoMode";
import {
  DEMO_REMINDERS,
  DEMO_TENANTS,
  type PaymentReminder,
  type PlatformNotification,
  type SubscriptionStatus,
  type Tenant,
  platformAdminNotifications,
  withDelay,
} from "../lib/mockData";

// ─── In-memory state for demo ─────────────────────────────────────────────────

// Mutable reference so new reminders persist across re-renders in demo mode
const demoRemindersStore: PaymentReminder[] = [...DEMO_REMINDERS];

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useTenants() {
  return useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      if (isDemoMode()) return DEMO_TENANTS;
      return DEMO_TENANTS;
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type TenantFilter = "all" | "Overdue" | "DueSoon";

const FILTER_OPTIONS: { label: string; value: TenantFilter }[] = [
  { label: "Show All", value: "all" },
  { label: "Overdue Only", value: "Overdue" },
  { label: "Due Soon", value: "DueSoon" },
];

const STATUS_BADGE_STYLES: Record<SubscriptionStatus, string> = {
  Active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  DueSoon:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Paused: "bg-secondary text-secondary-foreground",
};

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE_STYLES[status]}`}
    >
      {status === "DueSoon" ? "Due Soon" : status}
    </span>
  );
}

function buildMessage(tenant: Tenant): string {
  const date = new Date(tenant.nextPaymentDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `Dear ${tenant.schoolName} Admin,\n\nThis is a reminder that your subscription payment of $${tenant.amountDue.toLocaleString()} is due on ${date}. Please ensure timely payment to avoid service interruption.\n\nThank you.`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminRemindersPage() {
  const { data: tenants = [], isLoading } = useTenants();
  const qc = useQueryClient();

  const [tenantFilter, setTenantFilter] = useState<TenantFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const visibleTenants = useMemo(() => {
    if (tenantFilter === "all") return tenants;
    return tenants.filter((t) => t.subscriptionStatus === tenantFilter);
  }, [tenants, tenantFilter]);

  function handleFilterChange(filter: TenantFilter) {
    setTenantFilter(filter);
    setSelected(new Set());
  }

  // Build preview message for first selected tenant
  const firstSelected = tenants.find((t) => selected.has(t.id));
  const previewMessage = firstSelected
    ? customMessage || buildMessage(firstSelected)
    : customMessage || "Select a tenant to preview the message.";

  function toggleAll() {
    if (selected.size === visibleTenants.length && visibleTenants.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleTenants.map((t) => t.id)));
    }
  }

  function toggleTenant(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allChecked =
    visibleTenants.length > 0 && selected.size === visibleTenants.length;
  const someChecked =
    selected.size > 0 && selected.size < visibleTenants.length;

  async function handleSend() {
    if (selected.size === 0) return;
    setIsSending(true);
    setSent(false);

    const selectedTenants = tenants.filter((t) => selected.has(t.id));

    if (isDemoMode()) {
      await withDelay(null, 1200);

      for (const tenant of selectedTenants) {
        const msg = customMessage.trim() || buildMessage(tenant);
        const now = new Date().toISOString();

        // Add to reminder log
        const newReminder: PaymentReminder = {
          id: `REM-${Date.now()}-${tenant.id}`,
          tenantId: tenant.id,
          tenantName: tenant.schoolName,
          recipientEmail: tenant.adminEmail,
          message: msg,
          sentAt: now,
          status: "sent",
        };
        demoRemindersStore.unshift(newReminder);
        DEMO_REMINDERS.unshift(newReminder);

        // Add platform notification for tenant admin
        const newNotif: PlatformNotification = {
          id: `PNOTIF-${Date.now()}-${tenant.id}`,
          message: `Payment reminder: ${msg.slice(0, 120)}…`,
          sentAt: now,
          read: false,
          from: "platform",
        };
        if (!platformAdminNotifications[tenant.id]) {
          platformAdminNotifications[tenant.id] = [];
        }
        platformAdminNotifications[tenant.id].unshift(newNotif);
      }

      setIsSending(false);
      setSent(true);
      setSelected(new Set());
      setCustomMessage("");
      qc.invalidateQueries({ queryKey: ["platform-reminders"] });
      qc.invalidateQueries({ queryKey: ["platform-notifications"] });
      toast.success(
        `Reminder sent to ${selectedTenants.length} school${selectedTenants.length !== 1 ? "s" : ""}`,
        {
          description:
            "In-app notifications have been delivered to all selected tenant admins.",
        },
      );
      setTimeout(() => setSent(false), 4000);
      return;
    }

    // Live API path (placeholder)
    toast.success(
      `Reminder sent to ${selectedTenants.length} school${selectedTenants.length !== 1 ? "s" : ""}`,
    );
    setIsSending(false);
    setSelected(new Set());
    setCustomMessage("");
  }

  return (
    <div className="space-y-6" data-ocid="reminders.page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Send Payment Reminder
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Select tenants and send in-app payment reminders with a personalized
          message
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Left: Tenant Selection */}
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFilterChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tenantFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-ocid={`reminders.filter.${opt.value}.tab`}
              >
                {opt.label}
                <span className="ml-1.5 opacity-70">
                  (
                  {opt.value === "all"
                    ? tenants.length
                    : tenants.filter((t) => t.subscriptionStatus === opt.value)
                        .length}
                  )
                </span>
              </button>
            ))}
          </div>

          {/* Selected count badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              {selected.size > 0 ? (
                <Badge
                  className="gap-1 text-xs"
                  data-ocid="reminders.selected_count.badge"
                >
                  {selected.size} tenant{selected.size !== 1 ? "s" : ""}{" "}
                  selected
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No tenants selected
                </span>
              )}
            </div>
          </div>

          <Card className="bg-card border border-border overflow-hidden">
            {/* Select All */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
              <Checkbox
                id="select-all"
                checked={allChecked}
                onCheckedChange={toggleAll}
                ref={(el) => {
                  if (el)
                    (
                      el as HTMLButtonElement & { indeterminate?: boolean }
                    ).indeterminate = someChecked;
                }}
                data-ocid="reminders.select_all.checkbox"
              />
              <Label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer select-none"
              >
                Select All ({visibleTenants.length})
              </Label>
            </div>

            {/* Tenant list */}
            <CardContent className="p-0">
              {isLoading ? (
                <div
                  className="divide-y divide-border"
                  data-ocid="reminders.tenants.loading_state"
                >
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3 px-4 py-3">
                      <Skeleton className="w-4 h-4 rounded" />
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : visibleTenants.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-12 text-center"
                  data-ocid="reminders.tenants.empty_state"
                >
                  <AlertCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No tenants match this filter
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {visibleTenants.map((tenant, i) => {
                    const isChecked = selected.has(tenant.id);
                    return (
                      <button
                        key={tenant.id}
                        type="button"
                        className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/20 text-left ${
                          isChecked ? "bg-primary/5" : ""
                        }`}
                        data-ocid={`reminders.tenant.item.${i + 1}`}
                        onClick={() => toggleTenant(tenant.id)}
                      >
                        <Checkbox
                          id={`tenant-cb-${tenant.id}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleTenant(tenant.id)}
                          data-ocid={`reminders.tenant.checkbox.${i + 1}`}
                        />
                        <div
                          className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                          style={{ backgroundColor: tenant.primaryColor }}
                        >
                          {tenant.schoolName
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {tenant.schoolName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {tenant.adminEmail}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-semibold text-foreground hidden sm:block">
                            ${tenant.amountDue.toLocaleString()}
                          </span>
                          <SubscriptionStatusBadge
                            status={tenant.subscriptionStatus}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Message & Send */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Message editor */}
          <Card className="bg-card border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Reminder Message
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Leave blank to auto-generate a personalized message per school
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Dear [School Name] Admin, This is a reminder that your subscription payment of [Amount] is due on [Date]. Please ensure timely payment to avoid service interruption. Thank you."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className="resize-none text-sm"
                data-ocid="reminders.message.textarea"
              />
              {customMessage.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1.5 text-right">
                  {customMessage.length} chars
                </p>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-muted/30 border border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Message Preview (in-app notification)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-card border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs font-semibold text-primary">
                    EscolaUI Platform
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    just now
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {previewMessage}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                This notification will appear in the tenant admin's notification
                inbox.
              </p>
            </CardContent>
          </Card>

          {/* Send button */}
          <Button
            className="w-full gap-2 h-10"
            disabled={selected.size === 0 || isSending}
            onClick={handleSend}
            data-ocid="reminders.send.button"
          >
            {isSending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Sending…
              </>
            ) : sent ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Sent!
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Reminder
                {selected.size > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[11px] bg-white/20 text-white border-0"
                  >
                    {selected.size}
                  </Badge>
                )}
              </>
            )}
          </Button>

          {selected.size === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Select at least one tenant to send a reminder
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
