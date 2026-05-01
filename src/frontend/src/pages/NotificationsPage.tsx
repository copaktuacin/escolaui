import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { isDemoMode } from "@/lib/demoMode";
import {
  type PlatformNotification,
  platformAdminNotifications,
  withDelay,
} from "@/lib/mockData";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  Info,
  Mail,
  MessageSquare,
  Send,
  Smartphone,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type NotificationRecord = {
  id: string;
  date?: string;
  createdAt?: string;
  title: string;
  subject?: string;
  channel: string[];
  recipients?: string;
  recipientType?: string;
  status: "delivered" | "failed" | "pending";
  read?: boolean;
  type?: "info" | "warning" | "success" | "error" | "payment" | "system";
};

const MOCK_HISTORY: NotificationRecord[] = [
  {
    id: "n1",
    date: "2026-04-20",
    title: "End-of-Term Exam Schedule",
    channel: ["SMS", "Email"],
    recipients: "All Parents",
    status: "delivered",
    type: "info",
  },
  {
    id: "n2",
    date: "2026-04-18",
    title: "Fee Payment Reminder — Q2 Due",
    channel: ["Push", "Email"],
    recipients: "Class 10A",
    status: "delivered",
    type: "payment",
  },
  {
    id: "n3",
    date: "2026-04-15",
    title: "Sports Day Announcement",
    channel: ["SMS"],
    recipients: "All Parents",
    status: "pending",
    type: "info",
  },
  {
    id: "n4",
    date: "2026-04-12",
    title: "Attendance Alert — 3 Consecutive Absences",
    channel: ["SMS", "Push"],
    recipients: "Individual",
    status: "delivered",
    type: "warning",
    read: false,
  },
  {
    id: "n5",
    date: "2026-04-10",
    title: "Parent-Teacher Meeting — Friday 3PM",
    channel: ["Email"],
    recipients: "Class 11B",
    status: "failed",
    type: "error",
    read: false,
  },
  {
    id: "n6",
    date: "2026-04-08",
    title: "Public Holiday — School Closed",
    channel: ["SMS", "Email", "Push"],
    recipients: "All Parents",
    status: "delivered",
    type: "system",
  },
];

// Map demo admin emails to tenantId
const DEMO_ADMIN_TENANT_MAP: Record<string, string> = {
  "admin@escolamodel.edu.ng": "demo-escola",
  "admin@cityacademy.edu": "demo-city-academy",
  "contact@sunriseintl.edu": "demo-sunrise",
  "hello@greenfieldhs.edu": "demo-greenfield",
  "info@riversideacademy.edu": "demo-riverside",
  "admin@escola.com": "demo-escola",
};

function useTenantId(email: string | undefined): string {
  if (!email) return "demo-escola";
  return DEMO_ADMIN_TENANT_MAP[email] ?? "demo-escola";
}

function useNotifications() {
  return useQuery<NotificationRecord[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (isDemoMode()) return withDelay(MOCK_HISTORY);
      const res = await api.get<NotificationRecord[]>("/notifications?page=1");
      if (!res.success)
        throw new Error(res.error ?? "Failed to load notifications");
      return res.data ?? [];
    },
  });
}

function usePlatformNotifications(tenantId: string) {
  return useQuery<PlatformNotification[]>({
    queryKey: ["platform-notifications", tenantId],
    queryFn: async () => {
      if (isDemoMode())
        return withDelay(platformAdminNotifications[tenantId] ?? []);
      return [];
    },
  });
}

type FilterTab = "all" | "unread" | "payment" | "system" | "general";
type PanelTab = "broadcast" | "platform";

const iconMap = {
  info: { Icon: Info, bg: "bg-blue-100", color: "text-blue-600" },
  warning: { Icon: AlertTriangle, bg: "bg-amber-100", color: "text-amber-600" },
  success: {
    Icon: CheckCircle2,
    bg: "bg-emerald-100",
    color: "text-emerald-600",
  },
  error: { Icon: XCircle, bg: "bg-red-100", color: "text-red-600" },
  payment: { Icon: CreditCard, bg: "bg-purple-100", color: "text-purple-600" },
  system: { Icon: Bell, bg: "bg-slate-100", color: "text-slate-600" },
};

const statusBadge: Record<NotificationRecord["status"], string> = {
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function formatDate(n: NotificationRecord) {
  return n.date ?? (n.createdAt ? n.createdAt.split("T")[0] : "–");
}

function getRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: history = [], isLoading } = useNotifications();
  const tenantId = useTenantId(user?.email);
  const isTenantAdmin = user?.role === "principal";
  const { data: platformNotifs = [] } = usePlatformNotifications(tenantId);
  const unreadPlatformCount = platformNotifs.filter((n) => !n.read).length;
  const unreadHistoryCount = history.filter((n) => n.read === false).length;

  const [panelTab, setPanelTab] = useState<PanelTab>("broadcast");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [channels, setChannels] = useState({
    sms: true,
    email: true,
    push: false,
  });

  const filteredHistory = history.filter((n) => {
    if (filterTab === "all") return true;
    if (filterTab === "unread") return n.read === false;
    if (filterTab === "payment") return n.type === "payment";
    if (filterTab === "system")
      return n.type === "system" || n.type === "error";
    if (filterTab === "general")
      return n.type === "info" || n.type === "success";
    return true;
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !message.trim())
        throw new Error("Fill in title and message");
      const selectedChannels = Object.entries(channels)
        .filter(([, v]) => v)
        .map(([k]) => k.toUpperCase());
      if (selectedChannels.length === 0)
        throw new Error("Select at least one channel");
      if (isDemoMode()) {
        await withDelay(null, 1000);
        return { recipientType: recipient, channel: selectedChannels };
      }
      const res = await api.post("/notifications/send", {
        recipientType: recipient === "all" ? "parent" : recipient,
        channel: selectedChannels.map((c) => c.toLowerCase()),
        subject: title,
        message,
        targetIds: [],
      });
      if (!res.success) throw new Error(res.error ?? "Failed to send");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification sent", { description: title });
      setTitle("");
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode()) {
        const list = platformAdminNotifications[tenantId] ?? [];
        const notif = list.find((n) => n.id === id);
        if (notif) notif.read = true;
        return;
      }
      const res = await api.put(`/notifications/${id}/read`, {});
      if (!res.success) throw new Error(res.error ?? "Failed to mark as read");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-notifications", tenantId] });
      toast.success("Marked as read");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (isDemoMode()) {
        const list = platformAdminNotifications[tenantId] ?? [];
        for (const n of list) n.read = true;
        return;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-notifications", tenantId] });
      toast.success("All notifications marked as read");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode()) return;
      const res = await api.delete(`/notifications/${id}`);
      if (!res.success) throw new Error(res.error ?? "Failed to delete");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.info("Notification dismissed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: history.length },
    { key: "unread", label: "Unread", count: unreadHistoryCount },
    { key: "payment", label: "Payment Reminders" },
    { key: "system", label: "System" },
    { key: "general", label: "General" },
  ];

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
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-card"
            style={{ background: "var(--color-primary-light)" }}
          >
            <Bell
              className="w-5 h-5"
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
                Notifications
              </h1>
              {(unreadHistoryCount > 0 || unreadPlatformCount > 0) && (
                <span
                  className="badge-premium text-white text-[10px] px-2.5 py-0.5"
                  style={{ background: "var(--color-primary)" }}
                >
                  {unreadHistoryCount + unreadPlatformCount} unread
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Send and manage notifications to parents and staff
            </p>
          </div>
        </div>
        {unreadHistoryCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 transition-smooth hover:shadow-card"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            data-ocid="notifications.mark_all_read.button"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Panel Tabs — only for tenant admins */}
      {isTenantAdmin && (
        <div
          className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit shadow-subtle"
          data-ocid="notifications.panel.tabs"
        >
          {(["broadcast", "platform"] as PanelTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPanelTab(t)}
              data-ocid={`notifications.panel.tab.${t}`}
              className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                panelTab === t
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              {t === "broadcast" ? "Broadcast" : "Platform Messages"}
              {t === "platform" && unreadPlatformCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white bg-red-500">
                  {unreadPlatformCount}
                </span>
              )}
              {panelTab === t && (
                <motion.div
                  layoutId="panel-tab-indicator"
                  className="absolute inset-0 rounded-lg bg-card shadow-card -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Platform Notifications Panel */}
      {isTenantAdmin && panelTab === "platform" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2
                className="w-4 h-4"
                style={{ color: "var(--color-primary)" }}
              />
              <h2 className="font-semibold text-foreground">
                Messages from Platform Admin
              </h2>
              {unreadPlatformCount > 0 && (
                <span className="badge-premium bg-red-50 text-red-700 border border-red-200 text-[10px]">
                  {unreadPlatformCount} unread
                </span>
              )}
            </div>
            {unreadPlatformCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 transition-smooth hover:shadow-card"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                data-ocid="notifications.platform.mark_all_read.button"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {platformNotifs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl border border-border shadow-card p-16 flex flex-col items-center justify-center text-center"
              data-ocid="notifications.platform.empty_state"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-foreground">
                No platform notifications
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Messages from the platform admin will appear here.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {platformNotifs.map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, height: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className={`stagger-item relative bg-card rounded-2xl border transition-all duration-200 p-5 flex gap-4 hover:shadow-elevated ${
                      !notif.read ? "border-l-4 shadow-card" : "border-border"
                    }`}
                    style={
                      !notif.read
                        ? { borderLeftColor: "var(--color-primary)" }
                        : {}
                    }
                    data-ocid={`notifications.platform.item.${i + 1}`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-subtle"
                        style={{ background: "var(--color-primary-light)" }}
                      >
                        <Building2
                          className="w-5 h-5"
                          style={{ color: "var(--color-primary)" }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="badge-premium text-[10px] px-2 py-0.5"
                            style={{
                              background: "var(--color-primary-light)",
                              color: "var(--color-primary)",
                            }}
                          >
                            Platform Admin
                          </span>
                          {!notif.read && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
                              style={{ color: "var(--color-primary)" }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full inline-block bg-current animate-pulse" />
                              New
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {getRelativeTime(notif.sentAt)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs px-3 transition-fast hover:shadow-subtle"
                          style={{ color: "var(--color-primary)" }}
                          onClick={() => markReadMutation.mutate(notif.id)}
                          disabled={markReadMutation.isPending}
                          data-ocid={`notifications.platform.mark_read.${i + 1}.button`}
                        >
                          <CheckCheck className="w-3 h-3 mr-1" />
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* Broadcast Panel */}
      {(!isTenantAdmin || panelTab === "broadcast") && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Compose Panel */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-card p-6 space-y-5 hover:shadow-elevated transition-smooth"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--color-primary-light)" }}
              >
                <Send
                  className="w-4 h-4"
                  style={{ color: "var(--color-primary)" }}
                />
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

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recipients
              </Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger
                  className="input-premium"
                  data-ocid="notifications.recipients.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parents</SelectItem>
                  <SelectItem value="class">By Class</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Delivery Channels
              </Label>
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {(
                  [
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
                  ] as const
                ).map(({ key, label, desc, icon: Icon }) => (
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
              className="w-full gap-2 btn-press transition-smooth shadow-card hover:shadow-elevated"
              style={{ background: "var(--color-primary)" }}
              onClick={() => sendMutation.mutate()}
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

          {/* History Panel */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-3 bg-card rounded-2xl border border-border shadow-card overflow-hidden"
          >
            {/* Panel Header */}
            <div className="px-6 pt-5 pb-0 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-foreground">
                  Notification History
                </h2>
                <span className="text-xs text-muted-foreground">
                  {filteredHistory.length} records
                </span>
              </div>
              {/* Filter Tabs */}
              <div
                className="flex gap-0 -mb-px overflow-x-auto scrollbar-thin"
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
                        ? "border-current text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      filterTab === key
                        ? {
                            borderColor: "var(--color-primary)",
                            color: "var(--color-primary)",
                          }
                        : {}
                    }
                  >
                    {label}
                    {count !== undefined && count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          filterTab === key
                            ? "text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                        style={
                          filterTab === key
                            ? { background: "var(--color-primary)" }
                            : {}
                        }
                      >
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification List */}
            <div className="divide-y divide-border">
              {isLoading ? (
                (["sk-a", "sk-b", "sk-c", "sk-d"] as const).map((k) => (
                  <div key={k} className="px-6 py-4 flex gap-4 items-start">
                    <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : filteredHistory.length === 0 ? (
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
                  {filteredHistory.map((n, i) => {
                    const notifType = n.type ?? "info";
                    const { Icon, bg, color } =
                      iconMap[notifType] ?? iconMap.info;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                        transition={{ delay: i * 0.04 }}
                        className={`stagger-item table-row-hover group px-6 py-4 flex gap-4 items-start transition-all ${
                          n.read === false ? "bg-primary/[0.03]" : ""
                        }`}
                        style={
                          n.read === false
                            ? { borderLeft: "3px solid var(--color-primary)" }
                            : {}
                        }
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
                                n.read === false
                                  ? "text-foreground"
                                  : "text-foreground/80"
                              }`}
                            >
                              {n.title ?? n.subject}
                            </p>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                              {formatDate(n)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className={`badge-premium text-[10px] px-2 py-0.5 ${statusBadge[n.status]}`}
                            >
                              {n.status}
                            </span>
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
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                          {n.read === false && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2 hover:bg-primary/10"
                              style={{ color: "var(--color-primary)" }}
                              onClick={() => markReadMutation.mutate(n.id)}
                              data-ocid={`notifications.mark_read.${i + 1}.button`}
                            >
                              <CheckCheck className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-fast"
                            onClick={() => deleteMutation.mutate(n.id)}
                            data-ocid={`notifications.delete.${i + 1}.delete_button`}
                            aria-label="Dismiss"
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
      )}
    </motion.div>
  );
}
