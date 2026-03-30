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
import { Bell, Mail, MessageSquare, Send, Smartphone } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type NotificationRecord = {
  id: string;
  date: string;
  title: string;
  channel: string[];
  recipients: string;
  status: "delivered" | "failed" | "pending";
};

const mockHistory: NotificationRecord[] = [
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

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [channels, setChannels] = useState({
    sms: true,
    email: true,
    push: false,
  });
  const [history, setHistory] = useState<NotificationRecord[]>(mockHistory);
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in title and message");
      return;
    }
    const selectedChannels = Object.entries(channels)
      .filter(([, v]) => v)
      .map(([k]) => k.toUpperCase());
    if (selectedChannels.length === 0) {
      toast.error("Select at least one channel");
      return;
    }
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    const newRecord: NotificationRecord = {
      id: `n${history.length + 1}`,
      date: new Date().toISOString().split("T")[0],
      title,
      channel: selectedChannels,
      recipients:
        recipient === "all"
          ? "All Parents"
          : recipient === "class"
            ? "By Class"
            : "Individual",
      status: "delivered",
    };
    setHistory((prev) => [newRecord, ...prev]);
    toast.success(`Notification sent to ${newRecord.recipients}`, {
      description: title,
    });
    setTitle("");
    setMessage("");
    setIsSending(false);
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
            {[
              { key: "sms" as const, label: "SMS", icon: MessageSquare },
              { key: "email" as const, label: "Email", icon: Mail },
              {
                key: "push" as const,
                label: "Push Notification",
                icon: Smartphone,
              },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between py-1">
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
            onClick={handleSend}
            disabled={isSending}
            data-ocid="notifications.send.button"
          >
            {isSending ? (
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
                  <TableHead className="hidden sm:table-cell">
                    Recipients
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
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
                      data-ocid={`notifications.item.${i + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {n.date}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {n.title}
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
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {n.recipients}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize text-xs ${statusBadge[n.status]}`}
                        >
                          {n.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
