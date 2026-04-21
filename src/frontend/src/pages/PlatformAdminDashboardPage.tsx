import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  PauseCircle,
  TrendingUp,
} from "lucide-react";
import { isDemoMode } from "../lib/demoMode";
import {
  DEMO_REMINDERS,
  DEMO_TENANTS,
  type PaymentReminder,
  type SubscriptionStatus,
  type Tenant,
} from "../lib/mockData";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async (): Promise<{
      tenants: Tenant[];
      reminders: PaymentReminder[];
    }> => {
      if (isDemoMode()) {
        return { tenants: DEMO_TENANTS, reminders: DEMO_REMINDERS };
      }
      return { tenants: DEMO_TENANTS, reminders: DEMO_REMINDERS };
    },
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  loading?: boolean;
}) {
  return (
    <Card className="bg-card border border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            )}
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: accent }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  Active: {
    label: "Active",
    color: "oklch(0.72 0.19 145 / 0.15)",
    icon: CheckCircle2,
  },
  Overdue: {
    label: "Overdue",
    color: "oklch(0.63 0.23 25 / 0.15)",
    icon: AlertCircle,
  },
  DueSoon: {
    label: "Due Soon",
    color: "oklch(0.78 0.17 65 / 0.15)",
    icon: TrendingUp,
  },
  Paused: {
    label: "Paused",
    color: "oklch(0.55 0.03 240 / 0.15)",
    icon: PauseCircle,
  },
};

const STATUS_BADGE_CLASS: Record<SubscriptionStatus, string> = {
  Active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  DueSoon:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Paused: "bg-secondary text-secondary-foreground",
};

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE_CLASS[status]}`}
    >
      {status === "DueSoon" ? "Due Soon" : status}
    </span>
  );
}

function ReminderRow({
  reminder,
  index,
}: { reminder: PaymentReminder; index: number }) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0"
      data-ocid={`dashboard.reminder.item.${index}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {reminder.tenantName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {reminder.recipientEmail}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-muted-foreground hidden sm:block">
          {new Date(reminder.sentAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <Badge
          variant="outline"
          className="text-[11px] capitalize border-green-500/30 text-green-700 bg-green-50"
        >
          {reminder.status}
        </Badge>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminDashboardPage() {
  const { data, isLoading } = usePlatformStats();

  const tenants = data?.tenants ?? [];
  const reminders = data?.reminders ?? [];

  const totalTenants = tenants.length;
  const activeSubscriptions = tenants.filter(
    (t) => t.subscriptionStatus === "Active",
  ).length;
  const overduePayments = tenants.filter(
    (t) => t.subscriptionStatus === "Overdue",
  ).length;
  const monthlyRevenue = tenants
    .filter(
      (t) => t.billingCycle === "monthly" && t.subscriptionStatus === "Active",
    )
    .reduce((s, t) => s + t.amountDue, 0);

  const statusCounts: Record<SubscriptionStatus, number> = {
    Active: tenants.filter((t) => t.subscriptionStatus === "Active").length,
    Overdue: tenants.filter((t) => t.subscriptionStatus === "Overdue").length,
    DueSoon: tenants.filter((t) => t.subscriptionStatus === "DueSoon").length,
    Paused: tenants.filter((t) => t.subscriptionStatus === "Paused").length,
  };

  const recentReminders = [...reminders]
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6" data-ocid="platform_dashboard.page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Platform Overview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor all tenants, subscriptions, and platform activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tenants"
          value={totalTenants}
          icon={Building2}
          accent="oklch(0.42 0.14 255)"
          loading={isLoading}
        />
        <StatCard
          label="Active Subscriptions"
          value={activeSubscriptions}
          icon={CheckCircle2}
          accent="oklch(0.55 0.19 145)"
          loading={isLoading}
        />
        <StatCard
          label="Overdue Payments"
          value={overduePayments}
          icon={AlertCircle}
          accent="oklch(0.55 0.23 25)"
          loading={isLoading}
        />
        <StatCard
          label="Monthly Revenue"
          value={`$${monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          accent="oklch(0.62 0.17 65)"
          loading={isLoading}
        />
      </div>

      {/* Quick Actions */}
      <div
        className="flex flex-wrap gap-3"
        data-ocid="platform_dashboard.quick_actions"
      >
        <Button
          asChild
          className="gap-2"
          data-ocid="platform_dashboard.go_to_subscriptions.button"
        >
          <Link to="/platform-admin/subscriptions">
            <CreditCard className="w-4 h-4" />
            View Subscriptions
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="gap-2"
          data-ocid="platform_dashboard.send_reminders.button"
        >
          <Link to="/platform-admin/reminders">
            <Bell className="w-4 h-4" />
            Send Reminders
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Status Breakdown */}
        <Card
          className="bg-card border border-border"
          data-ocid="platform_dashboard.status_breakdown.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Subscription Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading
              ? [1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-12 w-full rounded-lg" />
                ))
              : (
                  Object.entries(statusCounts) as [SubscriptionStatus, number][]
                ).map(([status, count]) => {
                  const cfg = STATUS_CONFIG[status];
                  const pct =
                    totalTenants > 0
                      ? Math.round((count / totalTenants) * 100)
                      : 0;
                  return (
                    <div
                      key={status}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: cfg.color }}
                      data-ocid={`platform_dashboard.status.${status.toLowerCase()}.card`}
                    >
                      <cfg.icon className="w-4 h-4 flex-shrink-0 text-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {cfg.label}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {count}
                          </span>
                        </div>
                        <div className="w-full bg-black/10 rounded-full h-1.5 mt-1.5">
                          <div
                            className="h-1.5 rounded-full bg-foreground/30 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
          </CardContent>
        </Card>

        {/* Recent Reminders */}
        <Card
          className="bg-card border border-border"
          data-ocid="platform_dashboard.recent_reminders.card"
        >
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Recent Reminders
            </CardTitle>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs gap-1 h-7"
              data-ocid="platform_dashboard.view_all_reminders.button"
            >
              <Link to="/platform-admin/reminder-log">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div
                className="space-y-3"
                data-ocid="platform_dashboard.reminders.loading_state"
              >
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-12 w-full" />
                ))}
              </div>
            ) : recentReminders.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-8 text-center"
                data-ocid="platform_dashboard.reminders.empty_state"
              >
                <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No reminders sent yet
                </p>
              </div>
            ) : (
              <div>
                {recentReminders.map((r, i) => (
                  <ReminderRow key={r.id} reminder={r} index={i + 1} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tenant status at-a-glance */}
      {!isLoading && tenants.length > 0 && (
        <Card
          className="bg-card border border-border"
          data-ocid="platform_dashboard.tenant_overview.card"
        >
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Tenant Overview
            </CardTitle>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs gap-1 h-7"
              data-ocid="platform_dashboard.view_all_tenants.button"
            >
              <Link to="/platform-admin/tenants">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tenants.map((tenant, i) => (
                <div
                  key={tenant.id}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  data-ocid={`platform_dashboard.tenant.item.${i + 1}`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
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
                    <p className="text-xs text-muted-foreground">
                      {tenant.plan} · {tenant.billingCycle}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-foreground hidden sm:block">
                      ${tenant.amountDue.toLocaleString()}
                    </span>
                    <SubscriptionStatusBadge
                      status={tenant.subscriptionStatus}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
