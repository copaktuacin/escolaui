import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  CreditCard,
  PauseCircle,
  Search,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";
import {
  type SubscriptionStatus,
  type Tenant,
  demoTenantsStore,
  withDelay,
} from "../lib/mockData";

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useTenants() {
  return useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      if (isDemoMode()) return withDelay([...demoTenantsStore]);
      const res = await api.get<Tenant[]>("/tenants");
      if (!res.success) throw new Error(res.error ?? "Failed to load tenants");
      return res.data ?? [];
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SortKey =
  | "schoolName"
  | "subscriptionStatus"
  | "nextPaymentDate"
  | "amountDue";
type SortDir = "asc" | "desc";

const STATUS_FILTERS: { label: string; value: SubscriptionStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "Active" },
  { label: "Overdue", value: "Overdue" },
  { label: "Due Soon", value: "DueSoon" },
  { label: "Paused", value: "Paused" },
];

const SUBSCRIPTION_STATUS_STYLES: Record<
  SubscriptionStatus,
  {
    bg: string;
    text: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  Active: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    icon: CheckCircle2,
  },
  Overdue: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    icon: AlertCircle,
  },
  DueSoon: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
    icon: TrendingUp,
  },
  Paused: {
    bg: "bg-secondary dark:bg-secondary",
    text: "text-secondary-foreground",
    icon: PauseCircle,
  },
};

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const s = SUBSCRIPTION_STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}
    >
      <s.icon className="w-3 h-3" />
      {status === "DueSoon" ? "Due Soon" : status}
    </span>
  );
}

function SortButton({
  label,
  sortKey,
  current,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
      data-ocid={`subscriptions.sort.${sortKey}.button`}
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${active ? "text-primary" : ""}`} />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminSubscriptionsPage() {
  const { data: tenants = [], isLoading } = useTenants();
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("subscriptionStatus");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let result = [...tenants];
    if (statusFilter !== "all") {
      result = result.filter((t) => t.subscriptionStatus === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.schoolName.toLowerCase().includes(q) ||
          t.adminEmail.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "schoolName") {
        cmp = a.schoolName.localeCompare(b.schoolName);
      } else if (sortKey === "subscriptionStatus") {
        const order: SubscriptionStatus[] = [
          "Overdue",
          "DueSoon",
          "Active",
          "Paused",
        ];
        cmp =
          order.indexOf(a.subscriptionStatus) -
          order.indexOf(b.subscriptionStatus);
      } else if (sortKey === "nextPaymentDate") {
        cmp =
          new Date(a.nextPaymentDate).getTime() -
          new Date(b.nextPaymentDate).getTime();
      } else if (sortKey === "amountDue") {
        cmp = a.amountDue - b.amountDue;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [tenants, statusFilter, search, sortKey, sortDir]);

  // Summary stats
  const totalRevenue = tenants.reduce(
    (s, t) => s + (t.subscriptionStatus !== "Paused" ? t.amountDue : 0),
    0,
  );

  return (
    <div className="space-y-6" data-ocid="subscriptions.page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Subscription Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            View and monitor all tenant subscription plans and billing status
          </p>
        </div>
      </div>

      {/* Summary strip */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            ["Active", "Overdue", "DueSoon", "Paused"] as SubscriptionStatus[]
          ).map((s) => {
            const count = tenants.filter(
              (t) => t.subscriptionStatus === s,
            ).length;
            const style = SUBSCRIPTION_STATUS_STYLES[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                  statusFilter === s
                    ? "ring-2 ring-primary border-primary"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
                data-ocid={`subscriptions.filter_card.${s.toLowerCase()}`}
              >
                <p className="text-xs text-muted-foreground">
                  {s === "DueSoon" ? "Due Soon" : s}
                </p>
                <p className={`text-xl font-bold mt-0.5 ${style.text}`}>
                  {count}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search school name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="subscriptions.search.input"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-ocid={`subscriptions.status_filter.${f.value}.tab`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border border-border overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-border bg-muted/30 px-4 py-2.5 hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.2fr_1.2fr] gap-4 items-center">
          <SortButton
            label="School Name"
            sortKey="schoolName"
            current={sortKey}
            onSort={handleSort}
          />
          <span className="text-xs font-medium text-muted-foreground">
            Admin Email
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Plan
          </span>
          <SortButton
            label="Amount Due"
            sortKey="amountDue"
            current={sortKey}
            onSort={handleSort}
          />
          <SortButton
            label="Next Payment"
            sortKey="nextPaymentDate"
            current={sortKey}
            onSort={handleSort}
          />
          <SortButton
            label="Status"
            sortKey="subscriptionStatus"
            current={sortKey}
            onSort={handleSort}
          />
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="divide-y divide-border"
              data-ocid="subscriptions.loading_state"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="px-4 py-3 flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="subscriptions.empty_state"
            >
              <CreditCard className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">
                No tenants match your filters
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search or status filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setStatusFilter("all");
                  setSearch("");
                }}
                data-ocid="subscriptions.clear_filters.button"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((tenant, i) => (
                <div
                  key={tenant.id}
                  className="px-4 py-3 grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1.2fr_1.2fr] gap-2 md:gap-4 items-center hover:bg-muted/20 transition-colors"
                  data-ocid={`subscriptions.row.item.${i + 1}`}
                >
                  {/* School */}
                  <div className="flex items-center gap-2.5 min-w-0">
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
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {tenant.schoolName}
                      </p>
                      <p className="text-xs text-muted-foreground md:hidden truncate">
                        {tenant.adminEmail}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <p className="text-xs text-muted-foreground truncate hidden md:block">
                    {tenant.adminEmail}
                  </p>

                  {/* Plan */}
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className="text-[11px] capitalize"
                    >
                      {tenant.plan}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground capitalize hidden lg:inline">
                      · {tenant.billingCycle}
                    </span>
                  </div>

                  {/* Amount */}
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    ${tenant.amountDue.toLocaleString()}
                  </p>

                  {/* Next Payment */}
                  <p className="text-xs text-muted-foreground">
                    {new Date(tenant.nextPaymentDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </p>

                  {/* Status */}
                  <SubscriptionStatusBadge status={tenant.subscriptionStatus} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer summary */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>
            {filtered.length} tenant{filtered.length !== 1 ? "s" : ""} shown
          </span>
          <span className="font-semibold text-foreground">
            Total pending: ${totalRevenue.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
