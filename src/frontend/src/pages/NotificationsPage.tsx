import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useQueries";
import type { NotificationDto } from "@/hooks/useQueries";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  Info,
  Mail,
  MessageSquare,
  Send,
  Smartphone,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterTab = "all" | "unread" | "payment" | "system" | "general";

// ─── Icon map by type ─────────────────────────────────────────────────────────
const ICON_MAP = {
  info: { Icon: Info, bg: "bg-blue-100", color: "text-blue-600" },
  warning: { Icon: AlertTriangle, bg: "bg-amber-100", color: "text-amber-600" },
  success: {
    Icon: CheckCircle2,
    bg: "bg-emerald-100",
    color: "text-emerald-600",
  },
  error: { Icon: XCircle, bg: "bg-red-100", color: "text-red-600" },
  payment: { Icon: CreditCard, bg: "bg-purple-100", color: "text-purple-600" },
  system: { Icon: Bell, bg: "bg-muted", color: "text-muted-foreground" },
};

const STATUS_BADGE: Record<string, string> = {
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function formatDate(n: NotificationDto): string {
  const raw = n.date ?? n.createdAt;
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return raw.split("T")[0];
  }
}

// ─── Send notification mutation ───────────────────────────────────────────────
function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      subject: string;
      message: string;
      recipientType: string;
      channel: string[];
    }) => {
      const res = await api.post<unknown>("/notifications/send", payload);
      if (!res.success)
        throw new Error((res as { error?: string }).error ?? "Failed to send");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications({
    page: 1,
    limit: 30,
  });
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllRead();
  const sendMutation = useSendNotification();

  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [channels, setChannels] = useState({
    sms: true,
    email: true,
    push: false,
  });

  const unreadCount = notifications.filter((n) => n.read === false).length;

  const filtered = notifications.filter((n) => {
    if (filterTab === "all") return true;
    if (filterTab === "unread") return n.read === false;
    if (filterTab === "payment") return n.type === "payment";
    if (filterTab === "system")
      return n.type === "system" || n.type === "error";
    if (filterTab === "general")
      return n.type === "info" || n.type === "success";
    return true;
  });

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "payment", label: "Payment" },
    { key: "system", label: "System" },
    { key: "general", label: "General" },
  ];

  function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error("Fill in title and message");
      return;
    }
    const selectedChannels = Object.entries(channels)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selectedChannels.length === 0) {
      toast.error("Select at least one delivery channel");
      return;
    }
    sendMutation.mutate(
      {
        subject: title.trim(),
        message: message.trim(),
        recipientType: recipient,
        channel: selectedChannels,
      },
      {
        onSuccess: () => {
          toast.success("Notification sent", { description: title });
          setTitle("");
          setMessage("");
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-card">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="badge-premium bg-primary text-primary-foreground text-[10px] px-2.5 py-0.5">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Send and manage notifications to parents and staff
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 transition-smooth hover:shadow-card"
            onClick={() =>
              markAllReadMutation.mutate(undefined, {
                onSuccess: () => toast.success("All marked as read"),
                onError: (e: Error) => toast.error(e.message),
              })
            }
            disabled={markAllReadMutation.isPending}
            data-ocid="notifications.mark_all_read.button"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Compose Panel */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-card p-6 space-y-5 hover:shadow-elevated transition-smooth"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Send className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-foreground">
              Compose Notification
            </h2>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fee Payment Reminder"
              className="input-premium"
              data-ocid="notifications.title.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Message
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="input-premium resize-none"
              data-ocid="notifications.message.textarea"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recipients
            </Label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium"
              data-ocid="notifications.recipients.select"
            >
              <option value="all">All Parents</option>
              <option value="class">By Class</option>
              <option value="individual">Individual</option>
            </select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Delivery Channels
            </Label>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {[
                {
                  key: "sms" as const,
                  label: "SMS",
                  desc: "Mobile text message",
                  icon: MessageSquare,
                },
                {
                  key: "email" as const,
                  label: "Email",
                  desc: "Email inbox",
                  icon: Mail,
                },
                {
                  key: "push" as const,
                  label: "Push",
                  desc: "App notification",
                  icon: Smartphone,
                },
              ].map(({ key, label, desc, icon: Icon }) => (
                <div
                  key={key}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-fast"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {desc}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={channels[key]}
                    onCheckedChange={(v) =>
                      setChannels((c) => ({ ...c, [key]: v }))
                    }
                    data-ocid={`notifications.${key}.switch`}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            type="button"
            className="w-full gap-2 btn-press transition-smooth shadow-card hover:shadow-elevated btn-school-primary"
            onClick={handleSend}
            disabled={sendMutation.isPending}
            data-ocid="notifications.send.button"
          >
            {sendMutation.isPending ? (
              <>
                <Bell className="w-4 h-4 animate-pulse" /> Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send Notification
              </>
            )}
          </Button>
        </motion.div>

        {/* Notifications List Panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3 bg-card rounded-2xl border border-border shadow-card overflow-hidden"
        >
          {/* Filter Tabs */}
          <div className="px-6 pt-5 pb-0 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground">
                Notification History
              </h2>
              <span className="text-xs text-muted-foreground">
                {filtered.length} records
              </span>
            </div>
            <div
              className="flex gap-0 -mb-px overflow-x-auto"
              data-ocid="notifications.filter.tabs"
            >
              {filterTabs.map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilterTab(key)}
                  data-ocid={`notifications.filter.tab.${key}`}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 flex items-center gap-1.5 ${
                    filterTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {count !== undefined && count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        filterTab === key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-border">
            {isLoading ? (
              ["a", "b", "c", "d"].map((k) => (
                <div
                  key={k}
                  className="px-6 py-4 flex gap-4 items-start"
                  data-ocid="notifications.loading_state"
                >
                  <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 text-center"
                data-ocid="notifications.empty_state"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-foreground text-sm">
                  No notifications
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filterTab === "unread"
                    ? "All caught up!"
                    : "No notifications in this category"}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filtered.map((n, i) => {
                  const iconType = (n.type as keyof typeof ICON_MAP) ?? "info";
                  const { Icon, bg, color } =
                    ICON_MAP[iconType] ?? ICON_MAP.info;
                  const isUnread = n.read === false;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                      transition={{ delay: i * 0.04 }}
                      className={`group px-6 py-4 flex gap-4 items-start transition-all hover:bg-muted/20 ${
                        isUnread
                          ? "bg-primary/[0.03] border-l-4 border-l-primary"
                          : ""
                      }`}
                      data-ocid={`notifications.item.${i + 1}`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}
                      >
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-semibold leading-tight truncate ${
                              isUnread
                                ? "text-foreground"
                                : "text-foreground/80"
                            }`}
                          >
                            {n.title ?? n.subject ?? "—"}
                          </p>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {formatDate(n)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {n.status && (
                            <span
                              className={`badge-premium text-[10px] px-2 py-0.5 border ${STATUS_BADGE[n.status] ?? "bg-muted text-muted-foreground border-border"}`}
                            >
                              {n.status}
                            </span>
                          )}
                          {n.channel?.map((ch) => (
                            <span
                              key={ch}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
                            >
                              {ch}
                            </span>
                          ))}
                          {n.recipients && (
                            <span className="text-[11px] text-muted-foreground">
                              → {n.recipients}
                            </span>
                          )}
                          {isUnread && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                        {isUnread && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 hover:bg-primary/10 text-primary"
                            onClick={() =>
                              markReadMutation.mutate(n.id, {
                                onSuccess: () =>
                                  toast.success("Marked as read"),
                                onError: (e: Error) => toast.error(e.message),
                              })
                            }
                            disabled={markReadMutation.isPending}
                            data-ocid={`notifications.mark_read.${i + 1}.button`}
                          >
                            <CheckCheck className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-fast"
                          aria-label="Dismiss"
                          data-ocid={`notifications.delete.${i + 1}.delete_button`}
                          onClick={() => toast.info("Notification dismissed")}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
