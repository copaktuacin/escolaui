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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Bell,
  Building2,
  CheckCheck,
  Mail,
  MessageSquare,
  Send,
  Smartphone,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
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
};

const MOCK_HISTORY: NotificationRecord[] = [
  {
    id: "n1",
    date: "2026-03-28",
    title: "End-of-Term Exam Schedule",
    channel: ["SMS", "Email"],
    recipients: "All Parents",
    status: "delivered",
  },
  {
    id: "n2",
    date: "2026-03-26",
    title: "Fee Payment Reminder",
    channel: ["Push", "Email"],
    recipients: "Class 10A",
    status: "delivered",
  },
  {
    id: "n3",
    date: "2026-03-25",
    title: "Sports Day Announcement",
    channel: ["SMS"],
    recipients: "All Parents",
    status: "pending",
  },
  {
    id: "n4",
    date: "2026-03-22",
    title: "Attendance Alert — 3 Absences",
    channel: ["SMS", "Push"],
    recipients: "Individual",
    status: "delivered",
  },
  {
    id: "n5",
    date: "2026-03-20",
    title: "Parent-Teacher Meeting",
    channel: ["Email"],
    recipients: "Class 11B",
    status: "failed",
  },
  {
    id: "n6",
    date: "2026-03-18",
    title: "Holiday Notice",
    channel: ["SMS", "Email", "Push"],
    recipients: "All Parents",
    status: "delivered",
  },
];

const statusBadge: Record<NotificationRecord["status"], string> = {
  delivered: "bg-success/10 text-success border-success/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  pending: "bg-warning/10 text-warning border-warning/30",
};

// Map demo admin emails to tenantId
const DEMO_ADMIN_TENANT_MAP: Record<string, string> = {
  "admin@escolamodel.edu.ng": "demo-escola",
  "admin@cityacademy.edu": "demo-city-academy",
  "contact@sunriseintl.edu": "demo-sunrise",
  "hello@greenfieldhs.edu": "demo-greenfield",
  "info@riversideacademy.edu": "demo-riverside",
  // The platform admin (admin@escola.com) maps to demo-escola for demo purposes
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
      if (isDemoMode()) {
        return withDelay(platformAdminNotifications[tenantId] ?? []);
      }
      // In live mode, you'd call an endpoint; fallback to empty
      return [];
    },
  });
}

type Tab = "broadcast" | "platform";

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: history = [], isLoading } = useNotifications();
  const tenantId = useTenantId(user?.email);
  const isPlatformAdmin = user?.email === "admin@escola.com";
  // Tenant admins: role=admin but NOT the platform admin
  const isTenantAdmin = user?.role === "admin" && !isPlatformAdmin;

  const { data: platformNotifs = [] } = usePlatformNotifications(tenantId);
  const unreadPlatformCount = platformNotifs.filter((n) => !n.read).length;

  const [activeTab, setActiveTab] = useState<Tab>("broadcast");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [channels, setChannels] = useState({
    sms: true,
    email: true,
    push: false,
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
      toast.success("Notification sent successfully", { description: title });
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
      toast.info("Notification deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function formatDate(n: NotificationRecord) {
    return n.date ?? (n.createdAt ? n.createdAt.split("T")[0] : "–");
  }

  function formatDateTime(iso: string) {
    try {
      return new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Send SMS, email, and push notifications to parents and staff
        </p>
      </div>

      {/* Tabs — only show Platform tab for tenant admins */}
      {isTenantAdmin && (
        <div
          className="flex gap-1 p-1 bg-muted rounded-lg w-fit"
          data-ocid="notifications.tabs"
        >
          <button
            type="button"
            onClick={() => setActiveTab("broadcast")}
            data-ocid="notifications.tab.broadcast"
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
              activeTab === "broadcast"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Broadcast
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("platform")}
            data-ocid="notifications.tab.platform"
            className={`relative px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
              activeTab === "platform"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Platform Notifications
            {unreadPlatformCount > 0 && (
              <Badge className="h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground border-0">
                {unreadPlatformCount}
              </Badge>
            )}
          </button>
        </div>
      )}

      {/* Platform Notifications Panel */}
      {isTenantAdmin && activeTab === "platform" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">
                Messages from Platform Admin
              </h2>
              {unreadPlatformCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/30 text-xs"
                >
                  {unreadPlatformCount} unread
                </Badge>
              )}
            </div>
            {unreadPlatformCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
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
            <div
              className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center text-center"
              data-ocid="notifications.platform.empty_state"
            >
              <Bell className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">
                No platform notifications
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Messages from the platform admin will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {platformNotifs.map((notif, i) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-card rounded-xl border transition-all duration-150 p-4 flex gap-4 ${
                    !notif.read
                      ? "border-primary/30 shadow-sm"
                      : "border-border"
                  }`}
                  data-ocid={`notifications.platform.item.${i + 1}`}
                >
                  {/* Unread indicator dot */}
                  <div className="flex-shrink-0 pt-1">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 ${
                        !notif.read ? "bg-primary" : "bg-muted-foreground/20"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-primary/8 text-primary border-primary/25 flex items-center gap-1"
                        >
                          <Building2 className="w-2.5 h-2.5" />
                          From: Platform Admin
                        </Badge>
                        {!notif.read && (
                          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatDateTime(notif.sentAt)}
                      </span>
                    </div>

                    <p className="text-sm text-foreground leading-relaxed">
                      {notif.message}
                    </p>

                    {!notif.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/8"
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
            </div>
          )}
        </motion.div>
      )}

      {/* Broadcast Panel */}
      {(!isTenantAdmin || activeTab === "broadcast") && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Compose Panel */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
            <h2 className="font-semibold text-foreground">
              Compose Notification
            </h2>

            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fee Payment Reminder"
                data-ocid="notifications.title.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                data-ocid="notifications.message.textarea"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Recipients</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger data-ocid="notifications.recipients.select">
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
              <Label className="text-xs">Channels</Label>
              {(
                [
                  { key: "sms" as const, label: "SMS", icon: MessageSquare },
                  { key: "email" as const, label: "Email", icon: Mail },
                  {
                    key: "push" as const,
                    label: "Push Notification",
                    icon: Smartphone,
                  },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm">{label}</span>
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

            <Button
              className="w-full gap-2"
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
          </div>

          {/* History Table */}
          <div className="lg:col-span-3 bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">
                Notification History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="notifications.history.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Channels
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    (["a", "b", "c", "d"] as const).map((k) => (
                      <TableRow key={`sk-${k}`}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-8" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div
                          className="text-center py-8 text-muted-foreground"
                          data-ocid="notifications.empty_state"
                        >
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No notifications sent yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((n, i) => (
                      <TableRow
                        key={n.id}
                        className={n.read === false ? "bg-primary/3" : ""}
                        data-ocid={`notifications.item.${i + 1}`}
                      >
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(n)}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {n.title ?? n.subject}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {n.channel.map((ch) => (
                              <Badge
                                key={ch}
                                variant="outline"
                                className="text-[10px] px-1.5"
                              >
                                {ch}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`capitalize text-xs ${statusBadge[n.status]}`}
                          >
                            {n.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {n.read === false && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2"
                                onClick={() => markReadMutation.mutate(n.id)}
                                data-ocid={`notifications.mark_read.${i + 1}.button`}
                              >
                                Mark read
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteMutation.mutate(n.id)}
                              data-ocid={`notifications.delete.${i + 1}.delete_button`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
