import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UpdateOnlineClassRequest } from "@/hooks/useQueries";
import { api } from "@/lib/api";
import { isDemoMode } from "@/lib/demoMode";
import { getSessions, updateSession } from "@/lib/onlineClassesStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Camera,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Link2,
  Mic,
  MicOff,
  MonitorPlay,
  Play,
  PlusCircle,
  Radio,
  Square,
  Users,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type OnlineSession = {
  id: string;
  title: string;
  subject: string;
  teacher?: string;
  day?: string;
  time?: string;
  duration?: string;
  joinUrl?: string;
  joinLink?: string;
  scheduledAt?: string;
  platform?: string;
  teacherId?: number;
  subjectId?: number;
  classId?: number;
  sectionId?: number;
  status: "live" | "scheduled" | "ended" | "Live" | "Scheduled" | "Ended";
  recordingUrl?: string;
  participants?: number;
};

// Normalise backend status variants to lowercase for display logic
function normStatus(
  s: OnlineSession["status"],
): "live" | "scheduled" | "ended" {
  const lower = s.toLowerCase() as "live" | "scheduled" | "ended";
  return lower;
}

const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PLATFORMS = ["Zoom", "Google Meet", "Microsoft Teams", "Jitsi", "Other"];

type StatusKey = "live" | "scheduled" | "ended";
const statusStyles: Record<
  StatusKey,
  { badge: string; label: string; dot: string; glow: string }
> = {
  live: {
    badge: "bg-success/15 text-success border-success/30",
    label: "Live",
    dot: "bg-success animate-pulse",
    glow: "shadow-[0_0_0_2px_oklch(0.72_0.19_145/0.35),0_4px_16px_oklch(0.72_0.19_145/0.2)]",
  },
  scheduled: {
    badge: "bg-primary/10 text-primary border-primary/30",
    label: "Upcoming",
    dot: "bg-primary/60",
    glow: "",
  },
  ended: {
    badge: "bg-muted text-muted-foreground border-border",
    label: "Ended",
    dot: "bg-muted-foreground/40",
    glow: "",
  },
};

const EMPTY_CREATE_FORM = {
  subject: "",
  title: "",
  day: "Monday",
  time: "",
  duration: "",
  joinUrl: "",
};

// Edit form state — mirrors UpdateOnlineClassRequest + display fields
type EditFormState = {
  Title: string;
  SubjectId: string;
  ClassId: string;
  SectionId: string;
  ScheduledAt: string;
  Platform: string;
  TeacherId: string;
  Status: string;
};

const EMPTY_EDIT_FORM: EditFormState = {
  Title: "",
  SubjectId: "",
  ClassId: "",
  SectionId: "",
  ScheduledAt: "",
  Platform: "",
  TeacherId: "",
  Status: "",
};

// ── Stat card for page header ──────────────────────────────────────────────
function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border shadow-subtle">
      <div
        className={`w-6 h-6 rounded-lg flex items-center justify-center ${color}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-xs font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function useOnlineSessions() {
  return useQuery<OnlineSession[]>({
    queryKey: ["online-classes"],
    queryFn: async () => {
      if (isDemoMode()) {
        const sessions = getSessions();
        return sessions.map((s) => ({
          ...s,
          title: s.title ?? s.subject,
          joinUrl: s.joinLink,
        }));
      }
      const res = await api.get<OnlineSession[]>("/online-classes");
      if (!res.success) throw new Error(res.error ?? "Failed to load sessions");
      return res.data ?? [];
    },
  });
}

export default function OnlineClassesPage() {
  const qc = useQueryClient();
  const { data: sessions = [], isLoading } = useOnlineSessions();
  const [sessionActive, setSessionActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CREATE_FORM);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});

  // Edit modal state
  const [editSession, setEditSession] = useState<OnlineSession | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_EDIT_FORM);

  const liveSessions = sessions.filter((s) => normStatus(s.status) === "live");
  const upcomingSessions = sessions.filter(
    (s) => normStatus(s.status) === "scheduled",
  );
  const byDay = DAYS_FULL.map((day) => ({
    day,
    sessions: sessions.filter(
      (s) => s.day === day || s.day?.toLowerCase() === day.toLowerCase(),
    ),
  }));

  // ── Create mutation ─────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: typeof EMPTY_CREATE_FORM) => {
      if (isDemoMode())
        return {
          id: `demo-${Date.now()}`,
          ...data,
          status: "scheduled" as const,
        };
      const res = await api.post<OnlineSession>("/online-classes", {
        title: data.subject,
        subject: data.subject,
        day: data.day,
        time: data.time,
        duration: data.duration,
        joinUrl: data.joinUrl,
        status: "Scheduled",
      });
      if (!res.success)
        throw new Error(res.error ?? "Failed to create session");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["online-classes"] });
      toast.success("Session created successfully");
      setAddOpen(false);
      setForm(EMPTY_CREATE_FORM);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Update mutation (new DTO) ────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: string; data: UpdateOnlineClassRequest }) => {
      if (isDemoMode()) {
        // Map new DTO fields to store fields
        const storeStatus = data.Status?.toLowerCase() as
          | "live"
          | "scheduled"
          | "ended"
          | undefined;
        updateSession(id, {
          ...(storeStatus ? { status: storeStatus } : {}),
          ...(data.Title ? { title: data.Title } : {}),
          ...(data.Platform ? { platform: data.Platform } : {}),
          ...(data.TeacherId ? { teacherId: data.TeacherId } : {}),
          ...(data.SubjectId ? { subjectId: data.SubjectId } : {}),
          ...(data.ClassId ? { classId: data.ClassId } : {}),
          ...(data.SectionId ? { sectionId: data.SectionId } : {}),
          ...(data.ScheduledAt ? { scheduledAt: data.ScheduledAt } : {}),
        });
        return;
      }
      const res = await api.put<OnlineSession>(`/online-classes/${id}`, data);
      if (!res.success)
        throw new Error(res.error ?? "Failed to update session");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["online-classes"] });
      toast.success("Session updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Delete mutation ──────────────────────────────────────────────────────
  const _deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode()) return;
      const res = await api.delete(`/online-classes/${id}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to delete session");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["online-classes"] });
      toast.info("Session removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleJoin(s: OnlineSession) {
    const url = s.joinUrl ?? s.joinLink;
    if (!url) {
      toast.error("No meeting link has been set for this class yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleSaveUrl(sessionId: string) {
    const url = urlInputs[sessionId];
    if (url === undefined) return;
    // joinUrl is display-only, not part of PUT DTO — store locally only
    if (isDemoMode()) {
      updateSession(sessionId, { joinLink: url });
      qc.invalidateQueries({ queryKey: ["online-classes"] });
    }
  }

  function handleAddSession() {
    if (!form.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    createMutation.mutate(form);
  }

  function openEditModal(s: OnlineSession) {
    setEditSession(s);
    setEditForm({
      Title: s.title ?? s.subject ?? "",
      SubjectId: s.subjectId != null ? String(s.subjectId) : "",
      ClassId: s.classId != null ? String(s.classId) : "",
      SectionId: s.sectionId != null ? String(s.sectionId) : "",
      ScheduledAt: s.scheduledAt
        ? // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
          s.scheduledAt.slice(0, 16)
        : "",
      Platform: s.platform ?? "",
      TeacherId: s.teacherId != null ? String(s.teacherId) : "",
      Status:
        normStatus(s.status) === "live"
          ? "Live"
          : normStatus(s.status) === "ended"
            ? "Ended"
            : "Scheduled",
    });
  }

  function handleSaveEdit() {
    if (!editSession) return;
    // Build payload with only changed/filled fields
    const payload: UpdateOnlineClassRequest = {};
    if (editForm.Title.trim()) payload.Title = editForm.Title.trim();
    if (editForm.SubjectId.trim())
      payload.SubjectId = Number(editForm.SubjectId);
    if (editForm.ClassId.trim()) payload.ClassId = Number(editForm.ClassId);
    if (editForm.SectionId.trim())
      payload.SectionId = Number(editForm.SectionId);
    if (editForm.ScheduledAt.trim())
      payload.ScheduledAt = new Date(editForm.ScheduledAt).toISOString();
    if (editForm.Platform.trim()) payload.Platform = editForm.Platform.trim();
    if (editForm.TeacherId.trim())
      payload.TeacherId = Number(editForm.TeacherId);
    if (editForm.Status) payload.Status = editForm.Status;

    updateMutation.mutate({ id: editSession.id, data: payload });
    setEditSession(null);
  }

  function handleLiveToggle(s: OnlineSession, checked: boolean) {
    updateMutation.mutate({
      id: s.id,
      data: { Status: checked ? "Live" : "Scheduled" },
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, type: "tween", ease: "easeOut" }}
      className="space-y-6"
    >
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shadow-subtle">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
                Online Classes
              </h1>
              <p className="text-xs text-muted-foreground">
                Virtual sessions, live controls &amp; recordings
              </p>
            </div>
          </div>
          {!isLoading && (
            <div className="flex flex-wrap gap-2 ml-13">
              <StatPill
                icon={Radio}
                label="live"
                value={liveSessions.length}
                color="bg-success/10 text-success"
              />
              <StatPill
                icon={BookOpen}
                label="upcoming"
                value={upcomingSessions.length}
                color="bg-primary/10 text-primary"
              />
              <StatPill
                icon={Users}
                label="total"
                value={sessions.length}
                color="bg-muted text-muted-foreground"
              />
            </div>
          )}
        </div>
        <Button
          className="gap-2 shrink-0 btn-school-primary btn-press shadow-card"
          onClick={() => setAddOpen(true)}
          data-ocid="online_classes.add.open_modal_button"
        >
          <PlusCircle className="w-4 h-4" /> Add Session
        </Button>
      </div>

      {/* ── Live sessions banner ───────────────────────────────────────── */}
      <AnimatePresence>
        {liveSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl bg-success/10 border border-success/25 shadow-card"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-success/5 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-2">
              <span className="status-indicator live" />
              <span className="text-sm font-bold text-success">
                {liveSessions.length} session
                {liveSessions.length > 1 ? "s" : ""} live
              </span>
            </div>
            <div className="relative flex flex-wrap gap-2">
              {liveSessions.map((s) => (
                <span
                  key={s.id}
                  className="badge-premium bg-success/15 text-success border border-success/30"
                >
                  {s.subject ?? s.title}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Session Dialog ─────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="sm:max-w-md glass-elevated rounded-2xl"
          data-ocid="online_classes.add.dialog"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-success to-primary rounded-t-2xl" />
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 pt-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Video className="w-3.5 h-3.5 text-primary" />
              </div>
              New Online Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Subject *
                </Label>
                <Input
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="e.g. Mathematics"
                  className="input-premium rounded-xl"
                  data-ocid="online_classes.subject.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Day
                </Label>
                <Select
                  value={form.day}
                  onValueChange={(v) => setForm((f) => ({ ...f, day: v }))}
                >
                  <SelectTrigger
                    className="rounded-xl input-premium"
                    data-ocid="online_classes.day.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_FULL.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Time
                </Label>
                <Input
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                  placeholder="8:00 AM"
                  className="input-premium rounded-xl"
                  data-ocid="online_classes.time.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Duration
                </Label>
                <Input
                  value={form.duration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration: e.target.value }))
                  }
                  placeholder="60 min"
                  className="input-premium rounded-xl"
                  data-ocid="online_classes.duration.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Meeting URL (optional)
              </Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.joinUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, joinUrl: e.target.value }))
                  }
                  placeholder="https://zoom.us/j/..."
                  className="pl-10 input-premium rounded-xl"
                  data-ocid="online_classes.joinurl.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(false)}
              className="rounded-xl"
              data-ocid="online_classes.add.cancel_button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddSession}
              disabled={createMutation.isPending}
              className="rounded-xl btn-school-primary"
              data-ocid="online_classes.add.confirm_button"
            >
              {createMutation.isPending ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Session Modal ─────────────────────────────────────────── */}
      <Dialog
        open={!!editSession}
        onOpenChange={(open) => {
          if (!open) setEditSession(null);
        }}
      >
        <DialogContent
          className="sm:max-w-lg glass-elevated rounded-2xl"
          data-ocid="online_classes.edit.dialog"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary rounded-t-2xl" />
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 pt-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Edit2 className="w-3.5 h-3.5 text-primary" />
              </div>
              Edit Session
              {editSession && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  — {editSession.subject ?? editSession.title}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Title
              </Label>
              <Input
                value={editForm.Title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, Title: e.target.value }))
                }
                placeholder="Session title"
                className="input-premium rounded-xl"
                data-ocid="online_classes.edit.title.input"
              />
            </div>

            {/* SubjectId + Platform */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Subject ID
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.SubjectId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, SubjectId: e.target.value }))
                  }
                  placeholder="e.g. 3"
                  className="input-premium rounded-xl"
                  data-ocid="online_classes.edit.subject_id.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Platform
                </Label>
                <Select
                  value={editForm.Platform}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, Platform: v }))
                  }
                >
                  <SelectTrigger
                    className="rounded-xl input-premium"
                    data-ocid="online_classes.edit.platform.select"
                  >
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ClassId + SectionId */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Class ID
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.ClassId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, ClassId: e.target.value }))
                  }
                  placeholder="e.g. 10"
                  className="input-premium rounded-xl"
                  data-ocid="online_classes.edit.class_id.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Section ID
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.SectionId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, SectionId: e.target.value }))
                  }
                  placeholder="e.g. 1"
                  className="input-premium rounded-xl"
                  data-ocid="online_classes.edit.section_id.input"
                />
              </div>
            </div>

            {/* TeacherId + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Teacher ID
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.TeacherId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, TeacherId: e.target.value }))
                  }
                  placeholder="e.g. 5"
                  className="input-premium rounded-xl"
                  data-ocid="online_classes.edit.teacher_id.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </Label>
                <Select
                  value={editForm.Status}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, Status: v }))
                  }
                >
                  <SelectTrigger
                    className="rounded-xl input-premium"
                    data-ocid="online_classes.edit.status.select"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="Ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ScheduledAt */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Scheduled At
              </Label>
              <Input
                type="datetime-local"
                value={editForm.ScheduledAt}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, ScheduledAt: e.target.value }))
                }
                className="input-premium rounded-xl"
                data-ocid="online_classes.edit.scheduled_at.input"
              />
            </div>

            {/* Join URL — display only, not sent in PUT */}
            {editSession && (editSession.joinUrl || editSession.joinLink) && (
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Meeting URL (display only)
                </p>
                <p className="text-xs text-foreground truncate font-mono">
                  {editSession.joinUrl ?? editSession.joinLink}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Join URL is set via the session list below — not part of this
                  form.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditSession(null)}
              className="rounded-xl gap-1.5"
              data-ocid="online_classes.edit.cancel_button"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              className="rounded-xl btn-school-primary"
              data-ocid="online_classes.edit.save_button"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <Tabs defaultValue="schedule">
        <TabsList
          className="bg-card border border-border shadow-card rounded-xl p-1"
          data-ocid="online_classes.tab"
        >
          <TabsTrigger
            value="schedule"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm"
          >
            Student Schedule
          </TabsTrigger>
          <TabsTrigger
            value="teacher"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm"
          >
            Teacher Controls
          </TabsTrigger>
          <TabsTrigger
            value="recordings"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm"
          >
            Recordings
          </TabsTrigger>
        </TabsList>

        {/* ── Student Schedule Tab ───────────────────────────────────── */}
        <TabsContent value="schedule" className="mt-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-32 rounded-2xl"
                  data-ocid="online_classes.loading_state"
                />
              ))}
            </div>
          ) : (
            byDay.map((group, gi) => (
              <motion.div
                key={group.day}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05, type: "tween" }}
                className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
              >
                <div className="bg-muted/40 px-5 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm font-display text-foreground">
                    {group.day}
                  </h3>
                  <Badge variant="outline" className="text-xs badge-premium">
                    {group.sessions.length} session
                    {group.sessions.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                {group.sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 px-5 py-5 italic">
                    No sessions scheduled
                  </p>
                ) : (
                  <div className="divide-y divide-border/60">
                    {group.sessions.map((s, si) => {
                      const url = s.joinUrl ?? s.joinLink;
                      const ns = normStatus(s.status);
                      const isJoinable = ns === "live" && !!url;
                      const st = statusStyles[ns];
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (gi * 5 + si) * 0.03 }}
                          className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all duration-200 ${
                            ns === "live"
                              ? `bg-success/5 ${st.glow}`
                              : "hover:bg-muted/20"
                          }`}
                          data-ocid={`online_classes.item.${gi * 5 + si + 1}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${st.dot}`}
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate font-display">
                                {s.subject ?? s.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {[s.teacher, s.time, s.duration]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {s.participants != null && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3.5 h-3.5" />{" "}
                                {s.participants}
                              </span>
                            )}
                            {ns === "live" ? (
                              <span className="badge-premium bg-success/15 text-success border border-success/30 flex items-center gap-1.5">
                                <span className="status-indicator live" />
                                LIVE
                              </span>
                            ) : (
                              <Badge
                                variant="outline"
                                className={`text-xs ${st.badge}`}
                              >
                                {st.label}
                              </Badge>
                            )}
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="sm"
                                      variant={
                                        isJoinable ? "default" : "outline"
                                      }
                                      className={`text-xs h-8 gap-1.5 rounded-xl btn-press ${
                                        isJoinable
                                          ? "bg-success hover:bg-success/90 text-white border-success shadow-card"
                                          : "opacity-60"
                                      }`}
                                      disabled={!isJoinable}
                                      onClick={() => handleJoin(s)}
                                      data-ocid={`online_classes.join.${gi * 5 + si + 1}.button`}
                                    >
                                      <ExternalLink className="w-3 h-3" /> Join
                                      Class
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {!isJoinable && (
                                  <TooltipContent
                                    side="top"
                                    className="text-xs max-w-[160px] text-center"
                                  >
                                    {!url
                                      ? "No meeting link set yet"
                                      : "Class is not live yet"}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            {!isJoinable && ns !== "ended" && (
                              <span className="text-xs text-muted-foreground/70 italic">
                                {!url ? "Link not set" : "Not live yet"}
                              </span>
                            )}
                            {ns === "ended" && s.recordingUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-8 gap-1 rounded-xl"
                                onClick={() =>
                                  window.open(s.recordingUrl, "_blank")
                                }
                                data-ocid={`online_classes.recording.${gi * 5 + si + 1}.button`}
                              >
                                <Play className="w-3 h-3" /> Recording
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* ── Teacher Controls Tab ───────────────────────────────────── */}
        <TabsContent value="teacher" className="mt-6 space-y-6">
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Session control panel */}
            <div className="card-premium bg-card rounded-2xl border border-border shadow-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground font-display text-sm">
                    Active Session
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Manage your live class
                  </p>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  sessionActive
                    ? "border-success/30 bg-success/8 shadow-[0_0_0_1px_oklch(0.72_0.19_145/0.3)]"
                    : "border-border bg-muted/30"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${sessionActive ? "bg-success animate-pulse" : "bg-muted-foreground/30"}`}
                />
                <p
                  className={`text-sm font-semibold ${sessionActive ? "text-success" : "text-muted-foreground"}`}
                >
                  {sessionActive ? "Session Active" : "No Active Session"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {!sessionActive ? (
                  <Button
                    className="gap-2 w-full btn-school-primary btn-press"
                    onClick={() => {
                      setSessionActive(true);
                      toast.success("Session started");
                    }}
                    data-ocid="online_classes.start_session.button"
                  >
                    <Video className="w-4 h-4" /> Start Session
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="gap-2 w-full btn-press"
                    onClick={() => {
                      setSessionActive(false);
                      toast.info("Session ended");
                    }}
                    data-ocid="online_classes.stop_session.button"
                  >
                    <Square className="w-4 h-4" /> Stop Session
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="gap-2 w-full rounded-xl btn-press"
                  onClick={() => {
                    setMuted((m) => !m);
                    toast.info(muted ? "Unmuted all" : "Muted all");
                  }}
                  data-ocid="online_classes.mute_all.button"
                >
                  {muted ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                  {muted ? "Unmute All" : "Mute All"}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 w-full rounded-xl btn-press"
                  onClick={() => toast.info("Share screen started")}
                  data-ocid="online_classes.share_screen.button"
                >
                  <Camera className="w-4 h-4" /> Share Screen
                </Button>
              </div>
            </div>

            {/* Upcoming sessions quick list */}
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground font-display">
                  Upcoming &amp; Live
                </h2>
                <Badge variant="outline" className="text-xs">
                  {
                    sessions.filter((s) => normStatus(s.status) !== "ended")
                      .length
                  }{" "}
                  active
                </Badge>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions
                    .filter((s) => normStatus(s.status) !== "ended")
                    .slice(0, 4)
                    .map((s) => {
                      const ns = normStatus(s.status);
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                            ns === "live"
                              ? "border-success/30 bg-success/5 shadow-[0_0_0_1px_oklch(0.72_0.19_145/0.2)]"
                              : "border-border bg-muted/20 hover:bg-muted/40"
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusStyles[ns].dot}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate font-display">
                              {s.subject ?? s.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {s.time ?? s.scheduledAt ?? s.day ?? "–"}
                            </p>
                          </div>
                          {ns === "live" ? (
                            <span className="badge-premium bg-success/15 text-success border border-success/30 flex items-center gap-1.5">
                              <span className="status-indicator live" />
                              LIVE
                            </span>
                          ) : (
                            <Badge
                              variant="outline"
                              className={`text-xs shrink-0 ${statusStyles[ns].badge}`}
                            >
                              {statusStyles[ns].label}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  {sessions.filter((s) => normStatus(s.status) !== "ended")
                    .length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No upcoming sessions
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Session management — URL input + Live toggle + Edit button */}
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground font-display">
                  All Sessions
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set meeting URLs, toggle live status, and edit session details
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {sessions.length} total
              </Badge>
            </div>
            <div className="divide-y divide-border/60">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="online_classes.sessions.empty_state"
                >
                  <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    No sessions yet — add one to get started
                  </p>
                </div>
              ) : (
                sessions.map((s, i) => {
                  const urlVal =
                    urlInputs[s.id] ?? s.joinUrl ?? s.joinLink ?? "";
                  const ns = normStatus(s.status);
                  const isLive = ns === "live";
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 transition-all duration-300 ${
                        isLive
                          ? "bg-success/5 border-l-2 border-l-success"
                          : "hover:bg-muted/10"
                      }`}
                      data-ocid={`online_classes.session.item.${i + 1}`}
                    >
                      {/* Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusStyles[ns].dot}`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate font-display">
                            {s.subject ?? s.title}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-muted-foreground">
                              {[s.day, s.time].filter(Boolean).join(" · ") ||
                                "No time set"}
                            </p>
                            {s.platform && (
                              <span className="text-xs badge-premium bg-muted text-muted-foreground border border-border">
                                {s.platform}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* URL input (display/local only — not sent in PUT) */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative flex-1">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          <input
                            type="url"
                            value={urlVal}
                            onChange={(e) =>
                              setUrlInputs((prev) => ({
                                ...prev,
                                [s.id]: e.target.value,
                              }))
                            }
                            onBlur={() => handleSaveUrl(s.id)}
                            placeholder="Paste Zoom/Meet/Teams URL..."
                            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-border bg-muted/30 outline-none focus:ring-2 focus:ring-primary/30 input-premium transition-all"
                            data-ocid={`online_classes.url.${i + 1}.input`}
                          />
                        </div>
                      </div>
                      {/* Live toggle + Edit button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isLive}
                            onCheckedChange={(checked) =>
                              handleLiveToggle(s, checked)
                            }
                            data-ocid={`online_classes.live.${i + 1}.toggle`}
                          />
                          <span
                            className={`text-xs font-bold flex items-center gap-1.5 ${isLive ? "text-success" : "text-muted-foreground"}`}
                          >
                            {isLive && (
                              <span className="status-indicator live" />
                            )}
                            {isLive ? "Live" : "Go Live"}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 rounded-xl btn-press"
                          onClick={() => openEditModal(s)}
                          aria-label="Edit session"
                          data-ocid={`online_classes.edit.${i + 1}.edit_button`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Recordings Tab ─────────────────────────────────────────── */}
        <TabsContent value="recordings" className="mt-6">
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/20">
              <h2 className="font-semibold text-foreground font-display">
                Past Recordings
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Access recordings from completed sessions
              </p>
            </div>
            <div className="divide-y divide-border/60">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : sessions.filter((s) => normStatus(s.status) === "ended")
                  .length === 0 ? (
                <div
                  className="text-center py-16 text-muted-foreground"
                  data-ocid="online_classes.recordings.empty_state"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                    <MonitorPlay className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="font-semibold text-base text-foreground">
                    No recordings yet
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground/70">
                    Completed sessions will appear here
                  </p>
                </div>
              ) : (
                sessions
                  .filter((s) => normStatus(s.status) === "ended")
                  .map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
                      data-ocid={`online_classes.recording.item.${i + 1}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MonitorPlay className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate font-display">
                          {s.subject ?? s.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[s.day, s.time].filter(Boolean).join(" · ") ||
                            "Completed"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusStyles.ended.badge}`}
                      >
                        Ended
                      </Badge>
                      {s.recordingUrl ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs rounded-xl btn-press"
                          onClick={() => window.open(s.recordingUrl, "_blank")}
                          data-ocid={`online_classes.play.${i + 1}.button`}
                        >
                          <Play className="w-3.5 h-3.5" /> Play
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 opacity-40" /> No
                          recording
                        </span>
                      )}
                    </motion.div>
                  ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
