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
import {
  useClasses,
  useOnlineClasses,
  useSections,
  useUpdateOnlineClass,
} from "@/hooks/useQueries";
import type {
  ClassDto,
  OnlineClassDto,
  SectionDto,
  UpdateOnlineClassRequest,
} from "@/hooks/useQueries";
import {
  ChevronDown,
  Edit2,
  ExternalLink,
  Radio,
  Users,
  Video,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─── Acceptable hardcoded constants ──────────────────────────────────────────
const PLATFORMS = ["Zoom", "Google Meet", "Microsoft Teams", "Jitsi", "Other"];
const STATUS_OPTIONS = ["Scheduled", "Live", "Ended"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getClassId(c: ClassDto): number {
  return (c.Id ?? c.id ?? 0) as number;
}
function getClassName(c: ClassDto): string {
  return c.ClassName ?? c.className ?? String(getClassId(c));
}
function getSectionName(s: SectionDto): string {
  return s.SectionName ?? s.sectionName ?? "";
}

function normStatus(s: string): "live" | "scheduled" | "ended" {
  const lower = s.toLowerCase();
  if (lower === "live") return "live";
  if (lower === "ended") return "ended";
  return "scheduled";
}

const STATUS_STYLE: Record<
  "live" | "scheduled" | "ended",
  { badge: string; label: string; dot: string }
> = {
  live: {
    badge: "bg-success/15 text-success border-success/30",
    label: "Live",
    dot: "bg-success animate-pulse",
  },
  scheduled: {
    badge: "bg-primary/10 text-primary border-primary/30",
    label: "Upcoming",
    dot: "bg-primary/60",
  },
  ended: {
    badge: "bg-muted text-muted-foreground border-border",
    label: "Ended",
    dot: "bg-muted-foreground/40",
  },
};

function formatScheduled(s?: string): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────
function EditDialog({
  session,
  onClose,
}: { session: OnlineClassDto; onClose: () => void }) {
  const updateMutation = useUpdateOnlineClass();
  const { data: classes = [], isLoading: classesLoading } = useClasses();

  const [title, setTitle] = useState(session.title ?? "");
  const [subjectId, setSubjectId] = useState(
    (session as Record<string, unknown>).subjectId != null
      ? String((session as Record<string, unknown>).subjectId)
      : "",
  );
  const [scheduledAt, setScheduledAt] = useState(
    session.scheduledAt ? session.scheduledAt.slice(0, 16) : "",
  );
  const [teacherId, setTeacherId] = useState(
    (session as Record<string, unknown>).teacherId != null
      ? String((session as Record<string, unknown>).teacherId)
      : "",
  );

  // Uncontrolled for class, section, platform, status
  const platformRef = useRef<HTMLSelectElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);
  const classRef = useRef<HTMLSelectElement>(null);
  const sectionRef = useRef<HTMLSelectElement>(null);

  const [selectedClassId, setSelectedClassId] = useState<number>(
    (session as Record<string, unknown>).classId != null
      ? Number((session as Record<string, unknown>).classId)
      : 0,
  );
  const { data: sections = [], isLoading: sectionsLoading } = useSections(
    selectedClassId > 0 ? selectedClassId : undefined,
  );

  function handleSave() {
    const platform = platformRef.current?.value ?? "";
    const status = statusRef.current?.value ?? "";
    const classIdVal = classRef.current?.value ?? "";
    const sectionVal = sectionRef.current?.value ?? "";

    const payload: UpdateOnlineClassRequest = {};
    if (title.trim()) payload.Title = title.trim();
    if (subjectId.trim()) payload.SubjectId = Number(subjectId);
    if (classIdVal) payload.ClassId = Number(classIdVal);
    if (sectionVal) payload.SectionId = Number(sectionVal) || undefined;
    if (scheduledAt.trim())
      payload.ScheduledAt = new Date(scheduledAt).toISOString();
    if (platform) payload.Platform = platform;
    if (teacherId.trim()) payload.TeacherId = Number(teacherId);
    if (status) payload.Status = status;

    updateMutation.mutate(
      { id: session.id, data: payload },
      {
        onSuccess: () => {
          toast.success("Session updated");
          onClose();
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
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
            <span className="text-sm font-normal text-muted-foreground ml-1">
              — {session.title ?? session.subject}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                placeholder="e.g. 3"
                className="input-premium rounded-xl"
                data-ocid="online_classes.edit.subject_id.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Platform
              </Label>
              <div className="relative">
                <select
                  ref={platformRef}
                  defaultValue={
                    ((session as Record<string, unknown>).platform as string) ??
                    ""
                  }
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none"
                  data-ocid="online_classes.edit.platform.select"
                >
                  <option value="">Select platform</option>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Class + Section — uncontrolled */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Class
              </Label>
              <div className="relative">
                <select
                  ref={classRef}
                  defaultValue={
                    selectedClassId > 0 ? String(selectedClassId) : ""
                  }
                  disabled={classesLoading}
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none"
                  data-ocid="online_classes.edit.class.select"
                >
                  <option value="">
                    {classesLoading ? "Loading..." : "Select class"}
                  </option>
                  {classes.map((c) => (
                    <option key={getClassId(c)} value={String(getClassId(c))}>
                      {getClassName(c)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Section
              </Label>
              <div className="relative">
                <select
                  ref={sectionRef}
                  defaultValue=""
                  disabled={sectionsLoading || !selectedClassId}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none"
                  data-ocid="online_classes.edit.section.select"
                >
                  <option value="">
                    {sectionsLoading ? "Loading..." : "Select section"}
                  </option>
                  {sections.map((s) => (
                    <option key={getSectionName(s)} value={getSectionName(s)}>
                      Section {getSectionName(s)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
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
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="e.g. 5"
                className="input-premium rounded-xl"
                data-ocid="online_classes.edit.teacher_id.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </Label>
              <div className="relative">
                <select
                  ref={statusRef}
                  defaultValue={(session.status as string) ?? "Scheduled"}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none"
                  data-ocid="online_classes.edit.status.select"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Scheduled At */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Scheduled At
            </Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input-premium rounded-xl"
              data-ocid="online_classes.edit.scheduled_at.input"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl gap-1.5"
            data-ocid="online_classes.edit.cancel_button"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-xl btn-school-primary"
            data-ocid="online_classes.edit.save_button"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OnlineClassesPage() {
  const { data: sessions = [], isLoading } = useOnlineClasses({
    page: 1,
    limit: 20,
  });
  const updateMutation = useUpdateOnlineClass();
  const [editTarget, setEditTarget] = useState<OnlineClassDto | null>(null);

  const liveSessions = sessions.filter(
    (s) => normStatus(s.status as string) === "live",
  );
  const upcomingSessions = sessions.filter(
    (s) => normStatus(s.status as string) === "scheduled",
  );

  function handleLiveToggle(s: OnlineClassDto, checked: boolean) {
    updateMutation.mutate(
      { id: s.id, data: { Status: checked ? "Live" : "Scheduled" } },
      {
        onSuccess: () =>
          toast.success(
            checked ? "Session marked Live" : "Session marked Scheduled",
          ),
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  function handleJoin(s: OnlineClassDto) {
    const url =
      ((s as Record<string, unknown>).joinUrl as string | undefined) ??
      ((s as Record<string, unknown>).joinLink as string | undefined);
    if (!url) {
      toast.error("No meeting link has been set for this class yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, type: "tween", ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold">
              <Radio className="w-3.5 h-3.5" /> {liveSessions.length} live
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Users className="w-3.5 h-3.5" /> {upcomingSessions.length}{" "}
              upcoming
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border-border text-muted-foreground text-xs font-semibold">
              <Video className="w-3.5 h-3.5" /> {sessions.length} total
            </span>
          </div>
        )}
      </div>

      {/* Live banner */}
      {liveSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-2xl bg-success/10 border border-success/25 shadow-card"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-bold text-success">
              {liveSessions.length} session
              {liveSessions.length !== 1 ? "s" : ""} live
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
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

      {/* Sessions Table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground font-display">
              All Sessions
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toggle live status and edit session details
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {sessions.length} total
          </Badge>
        </div>

        {isLoading ? (
          <div
            className="p-5 space-y-3"
            data-ocid="online_classes.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground"
            data-ocid="online_classes.empty_state"
          >
            <Radio className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-foreground">No sessions found</p>
            <p className="text-sm mt-1">
              Online class sessions from your backend will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" data-ocid="online_classes.table">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold">Platform</TableHead>
                  <TableHead className="font-semibold">Scheduled At</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">
                    Live
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s, i) => {
                  const ns = normStatus(s.status as string);
                  const st = STATUS_STYLE[ns];
                  const isLive = ns === "live";
                  const joinUrl =
                    ((s as Record<string, unknown>).joinUrl as
                      | string
                      | undefined) ??
                    ((s as Record<string, unknown>).joinLink as
                      | string
                      | undefined);
                  return (
                    <TableRow
                      key={s.id}
                      className={`table-row-hover stagger-item ${
                        isLive ? "bg-success/5 border-l-2 border-l-success" : ""
                      }`}
                      data-ocid={`online_classes.item.${i + 1}`}
                    >
                      <TableCell className="font-semibold text-sm text-foreground max-w-[180px] truncate">
                        {s.title ?? s.subject ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.subject ?? "—"}
                      </TableCell>
                      <TableCell>
                        {(s as Record<string, unknown>).platform ? (
                          <span className="text-xs badge-premium bg-muted text-muted-foreground border border-border">
                            {(s as Record<string, unknown>).platform as string}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatScheduled(s.scheduledAt)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`badge-premium flex items-center gap-1.5 w-fit border text-xs ${st.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${st.dot}`}
                          />
                          {st.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={isLive}
                          onCheckedChange={(checked) =>
                            handleLiveToggle(s, checked)
                          }
                          data-ocid={`online_classes.live.${i + 1}.toggle`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {joinUrl && ns === "live" && (
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs gap-1 rounded-lg bg-success hover:bg-success/90 text-white border-success px-2"
                              onClick={() => handleJoin(s)}
                              data-ocid={`online_classes.join.${i + 1}.button`}
                            >
                              <ExternalLink className="w-3 h-3" /> Join
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary"
                            onClick={() => setEditTarget(s)}
                            aria-label="Edit session"
                            data-ocid={`online_classes.edit_button.${i + 1}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {editTarget && (
        <EditDialog session={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </motion.div>
  );
}
