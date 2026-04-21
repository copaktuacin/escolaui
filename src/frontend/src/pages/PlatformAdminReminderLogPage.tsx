import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ScrollText,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { isDemoMode } from "../lib/demoMode";
import { DEMO_REMINDERS, type PaymentReminder } from "../lib/mockData";

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useReminderLog() {
  return useQuery<PaymentReminder[]>({
    queryKey: ["platform-reminders"],
    queryFn: async () => {
      if (isDemoMode()) return [...DEMO_REMINDERS];
      return [...DEMO_REMINDERS];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DateFilter = "7days" | "30days" | "all";
type StatusFilter = "all" | "sent" | "failed" | "pending";

const DATE_FILTERS: { label: string; value: DateFilter }[] = [
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "All time", value: "all" },
];

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
  { label: "Pending", value: "pending" },
];

const STATUS_STYLES: Record<
  PaymentReminder["status"],
  { badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  sent: {
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    icon: CheckCircle2,
  },
  failed: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: AlertCircle,
  },
  pending: {
    badge:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    icon: Clock,
  },
};

function StatusBadge({ status }: { status: PaymentReminder["status"] }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${s.badge}`}
    >
      <s.icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminReminderLogPage() {
  const { data: reminders = [], isLoading } = useReminderLog();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = [...reminders].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );

    // Date filter
    if (dateFilter !== "all") {
      const now = Date.now();
      const days = dateFilter === "7days" ? 7 : 30;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      result = result.filter((r) => new Date(r.sentAt).getTime() >= cutoff);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.tenantName.toLowerCase().includes(q) ||
          r.recipientEmail.toLowerCase().includes(q),
      );
    }

    return result;
  }, [reminders, dateFilter, statusFilter, search]);

  const sentCount = reminders.filter((r) => r.status === "sent").length;
  const failedCount = reminders.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-6" data-ocid="reminder_log.page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Reminder Log</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Immutable audit trail of all payment reminders sent to tenant admins
        </p>
      </div>

      {/* Summary strip */}
      {!isLoading && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
            <ScrollText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-sm font-bold text-foreground ml-1">
              {reminders.length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400">
              Sent
            </span>
            <span className="text-sm font-bold text-green-800 dark:text-green-300 ml-1">
              {sentCount}
            </span>
          </div>
          {failedCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-400">
                Failed
              </span>
              <span className="text-sm font-bold text-red-800 dark:text-red-300 ml-1">
                {failedCount}
              </span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground italic">
            <span>Read-only audit log</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search school name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="reminder_log.search.input"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDateFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                dateFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-ocid={`reminder_log.date_filter.${f.value}.tab`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-secondary text-secondary-foreground ring-1 ring-border"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-ocid={`reminder_log.status_filter.${f.value}.tab`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border border-border overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[1.8fr_1.5fr_1fr_2fr_1fr] gap-4 items-center px-4 py-2.5 border-b border-border bg-muted/30">
          <span className="text-xs font-semibold text-muted-foreground">
            School
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            Recipient Email
          </span>
          <span className="text-xs font-semibold text-muted-foreground text-right">
            Amount
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            Message Preview
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            Status
          </span>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="divide-y divide-border"
              data-ocid="reminder_log.loading_state"
            >
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="px-4 py-4 grid grid-cols-[2fr_1.5fr_1fr_2fr_1fr] gap-4 items-center"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              data-ocid="reminder_log.empty_state"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <ScrollText className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground">
                No reminders found
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {reminders.length === 0
                  ? "No payment reminders have been sent yet. Use the Send Reminders page to get started."
                  : "No reminders match your current filters. Try adjusting them."}
              </p>
              {reminders.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setDateFilter("all");
                    setStatusFilter("all");
                    setSearch("");
                  }}
                  data-ocid="reminder_log.clear_filters.button"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((reminder, i) => (
                <div
                  key={reminder.id}
                  className="px-4 py-3 flex flex-col md:grid md:grid-cols-[1.8fr_1.5fr_1fr_2fr_1fr] gap-2 md:gap-4 md:items-center hover:bg-muted/10 transition-colors"
                  data-ocid={`reminder_log.row.item.${i + 1}`}
                >
                  {/* School + Date */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {reminder.tenantName}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDate(reminder.sentAt)}
                    </p>
                  </div>

                  {/* Email */}
                  <p className="text-xs text-muted-foreground truncate hidden md:block">
                    {reminder.recipientEmail}
                  </p>

                  {/* Mobile: email visible */}
                  <p className="text-xs text-muted-foreground truncate md:hidden">
                    {reminder.recipientEmail}
                  </p>

                  {/* Amount — extract from message if possible */}
                  <p className="text-xs font-mono text-foreground text-right hidden md:block">
                    {(() => {
                      const match = reminder.message.match(/\$[\d,]+/);
                      return match ? match[0] : "—";
                    })()}
                  </p>

                  {/* Message preview */}
                  <p className="text-xs text-muted-foreground line-clamp-2 hidden md:block">
                    {reminder.message.slice(0, 100)}
                    {reminder.message.length > 100 ? "…" : ""}
                  </p>

                  {/* Status */}
                  <div className="flex items-center gap-2 md:block">
                    <StatusBadge status={reminder.status} />
                    <Badge
                      variant="outline"
                      className="text-[10px] md:hidden mt-0"
                    >
                      {(() => {
                        const match = reminder.message.match(/\$[\d,]+/);
                        return match ? match[0] : "—";
                      })()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {reminders.length} reminder
          {reminders.length !== 1 ? "s" : ""} · Log entries are read-only
        </p>
      )}
    </div>
  );
}
