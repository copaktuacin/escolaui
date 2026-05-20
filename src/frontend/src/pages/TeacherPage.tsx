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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  type CreateLessonPlanRequest,
  useCreateLessonPlan,
  useTeacherDetail,
  useTeacherGradebook,
  useTeachers,
} from "@/hooks/useQueries";
import { api } from "@/lib/api";
import { isDemoMode } from "@/lib/demoMode";
import { withDelay } from "@/lib/mockData";
import {
  type VirtualSession,
  addSession,
  deleteSession,
  getSessions,
  updateSession,
} from "@/lib/onlineClassesStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Link2,
  Pencil,
  PlusCircle,
  Save,
  Search,
  Star,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

// ─── DTOs ────────────────────────────────────────────────────────────────────

type TeacherSubjectAllocationDto = {
  teacherSubjectAllocationId: number;
  teacherId: number;
  teacherName: string;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  classId: number;
  className: string;
  isActive: boolean;
  createTs: string;
};

type ClassTeacherDto = {
  classTeacherId: number;
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  isActive: boolean;
  createTs: string;
};

type TimetableSlot = {
  period: number;
  day: string;
  subjectName?: string;
  className?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = [1, 2, 3, 4, 5, 6];
const PERIOD_LABELS: Record<number, string> = {
  1: "7:30",
  2: "8:30",
  3: "9:30",
  4: "10:30",
  5: "11:30",
  6: "13:00",
};

const SUBJECT_OPTIONS = [
  { id: 1, name: "Mathematics" },
  { id: 2, name: "Physics" },
  { id: 3, name: "English" },
  { id: 4, name: "Chemistry" },
  { id: 5, name: "Biology" },
  { id: 6, name: "History" },
];
const CLASS_OPTIONS = [
  { id: 5, name: "Class 5" },
  { id: 6, name: "Class 6" },
  { id: 10, name: "Class 10" },
  { id: 11, name: "Class 11" },
];
const TERM_OPTIONS = ["Q1", "Q2", "Q3", "Q4", "Term 1", "Term 2", "Term 3"];

const TIMETABLE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIMETABLE_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const PERIOD_TIMES: Record<number, string> = {
  1: "7:30",
  2: "8:25",
  3: "9:20",
  4: "10:30",
  5: "11:25",
  6: "13:00",
  7: "13:55",
  8: "14:50",
};
const DAY_MAP: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
};

// ─── Grade chip color helper ──────────────────────────────────────────────────

function gradeColor(grade: string): string {
  if (grade.startsWith("A"))
    return "bg-emerald-500/10 text-emerald-600 border-emerald-300/40";
  if (grade.startsWith("B"))
    return "bg-sky-500/10 text-sky-600 border-sky-300/40";
  if (grade.startsWith("C"))
    return "bg-amber-500/10 text-amber-700 border-amber-300/40";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

// ─── My Teacher Dashboard ────────────────────────────────────────────────────

function useClassTeacher(teacherId: string | null) {
  return useQuery<ClassTeacherDto | null>({
    queryKey: ["class-teacher", teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      const res = await api.get<unknown>(
        `/class-teachers?teacherId=${teacherId}`,
      );
      if (!res.success) return null;
      const raw = res.data;
      if (Array.isArray(raw)) {
        const match = (raw as ClassTeacherDto[]).find(
          (r) => String(r.teacherId) === String(teacherId) && r.isActive,
        );
        return match ?? null;
      }
      const unwrapped =
        (raw as Record<string, unknown>)?.data ??
        (raw as Record<string, unknown>)?.Data;
      if (Array.isArray(unwrapped)) {
        const match = (unwrapped as ClassTeacherDto[]).find(
          (r) => String(r.teacherId) === String(teacherId) && r.isActive,
        );
        return match ?? null;
      }
      return null;
    },
    enabled: !!teacherId,
  });
}

function useMySubjects(teacherId: string | null) {
  return useQuery<TeacherSubjectAllocationDto[]>({
    queryKey: ["teacher-subject-allocations", teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      const res = await api.get<unknown>(
        `/teacher-subject-allocations?teacherId=${teacherId}`,
      );
      if (!res.success) return [];
      const raw = res.data;
      if (Array.isArray(raw)) return raw as TeacherSubjectAllocationDto[];
      const data =
        (raw as Record<string, unknown>)?.data ??
        (raw as Record<string, unknown>)?.Data;
      if (Array.isArray(data)) return data as TeacherSubjectAllocationDto[];
      return [];
    },
    enabled: !!teacherId,
  });
}

function useMyTimetable(teacherId: string | null) {
  return useQuery<TimetableSlot[]>({
    queryKey: ["teacher-timetable", teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      const res = await api.get<unknown>(`/timetable?teacherId=${teacherId}`);
      if (!res.success) return [];
      const raw = res.data;
      if (Array.isArray(raw)) return raw as TimetableSlot[];
      const data =
        (raw as Record<string, unknown>)?.data ??
        (raw as Record<string, unknown>)?.Data;
      if (Array.isArray(data)) return data as TimetableSlot[];
      return [];
    },
    enabled: !!teacherId,
  });
}

function MyTeacherDashboard({ teacherId }: { teacherId: string }) {
  const { data: classTeacher, isLoading: ctLoading } =
    useClassTeacher(teacherId);
  const { data: subjects = [], isLoading: subjectsLoading } =
    useMySubjects(teacherId);
  const { data: timetableSlots = [], isLoading: ttLoading } =
    useMyTimetable(teacherId);

  // Build timetable grid: { "Mon-1": slot, ... }
  const ttGrid = timetableSlots.reduce<Record<string, TimetableSlot>>(
    (acc, slot) => {
      const dayKey = DAY_MAP[slot.day] ?? slot.day.slice(0, 3);
      const key = `${dayKey}-${slot.period}`;
      acc[key] = slot;
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      {/* Class Teacher Badge */}
      {ctLoading ? (
        <Skeleton className="h-20 rounded-2xl" />
      ) : classTeacher ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.97 0.05 85), oklch(0.95 0.08 80))",
          }}
          data-ocid="teacher.dashboard.class_teacher_badge"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-400/20 border border-amber-400/40 flex-shrink-0">
              <Star className="w-6 h-6 text-amber-600 fill-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-0.5">
                Class Teacher
              </p>
              <h2 className="text-xl font-bold font-display text-amber-900 leading-tight">
                You are the Class Teacher of{" "}
                <span className="text-amber-700">{classTeacher.className}</span>
              </h2>
            </div>
            <Award className="w-10 h-10 text-amber-300/80 hidden sm:block flex-shrink-0" />
          </div>
        </motion.div>
      ) : null}

      {/* My Subjects */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20 flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-primary-light)" }}
          >
            <BookOpen
              className="w-4 h-4"
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold font-display text-foreground">
              My Subjects
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Classes and subjects assigned to you
            </p>
          </div>
          {subjects.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {subjects.length}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table data-ocid="teacher.dashboard.subjects.table">
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Class
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Subject
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Code
                </TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectsLoading ? (
                [1, 2, 3].map((k) => (
                  <TableRow key={k}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-10 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : subjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground text-sm py-12"
                    data-ocid="teacher.dashboard.subjects.empty_state"
                  >
                    <BookOpen className="w-9 h-9 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No subjects assigned yet</p>
                    <p className="text-xs mt-1">Contact your administrator.</p>
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((s, i) => (
                  <TableRow
                    key={s.teacherSubjectAllocationId}
                    className="table-row-hover"
                    data-ocid={`teacher.dashboard.subjects.item.${i + 1}`}
                  >
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {s.className}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-sm text-foreground">
                      {s.subjectName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.subjectCode}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          onClick={() =>
                            window.location.assign(
                              `/attendance?classId=${s.classId}`,
                            )
                          }
                          data-ocid={`teacher.dashboard.subjects.attendance.${i + 1}.button`}
                        >
                          <Users className="w-3 h-3" /> Attendance
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1.5 btn-press"
                          style={{ background: "var(--color-primary)" }}
                          onClick={() =>
                            window.location.assign(
                              `/exams?classId=${s.classId}&subjectId=${s.subjectId}`,
                            )
                          }
                          data-ocid={`teacher.dashboard.subjects.marks.${i + 1}.button`}
                        >
                          <Award className="w-3 h-3" /> Marks
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

      {/* My Timetable */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20 flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-primary-light)" }}
          >
            <CalendarDays
              className="w-4 h-4"
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold font-display text-foreground">
              My Timetable
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your weekly teaching schedule
            </p>
          </div>
        </div>

        {ttLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[640px]"
              style={{ gridTemplateColumns: "72px repeat(5, 1fr)" }}
              data-ocid="teacher.dashboard.timetable"
            >
              {/* Header row */}
              <div className="bg-muted/40 border-b border-r border-border px-2 py-2.5 text-xs font-semibold text-muted-foreground text-center">
                Period
              </div>
              {TIMETABLE_DAYS.map((d) => (
                <div
                  key={d}
                  className="bg-muted/40 border-b border-r last:border-r-0 border-border px-3 py-2.5 text-center text-xs font-bold text-foreground"
                >
                  {d}
                </div>
              ))}
              {/* Data rows */}
              {TIMETABLE_PERIODS.map((period) => (
                <>
                  <div
                    key={`lbl-${period}`}
                    className="border-b border-r border-border px-2 py-3 flex flex-col items-center justify-center bg-muted/20"
                  >
                    <span className="text-xs font-bold text-foreground">
                      {period}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {PERIOD_TIMES[period]}
                    </span>
                  </div>
                  {TIMETABLE_DAYS.map((day) => {
                    const key = `${day}-${period}`;
                    const slot = ttGrid[key];
                    return (
                      <div
                        key={key}
                        className="border-b border-r last:border-r-0 border-border min-h-[64px] p-1.5"
                      >
                        {slot ? (
                          <div
                            className="h-full rounded-lg p-2 flex flex-col justify-between"
                            style={{
                              background: "var(--color-primary-light)",
                              border: "1px solid var(--color-primary)",
                            }}
                          >
                            <p
                              className="text-xs font-semibold leading-tight"
                              style={{ color: "var(--color-primary)" }}
                            >
                              {slot.subjectName ?? "—"}
                            </p>
                            {slot.className && (
                              <p className="text-[10px] text-muted-foreground">
                                {slot.className}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        )}

        {!ttLoading && timetableSlots.length === 0 && (
          <div
            className="text-center py-10 text-muted-foreground text-sm"
            data-ocid="teacher.dashboard.timetable.empty_state"
          >
            <CalendarDays className="w-9 h-9 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium">No timetable assigned yet</p>
            <p className="text-xs mt-1">
              Contact your administrator to set up your schedule.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Online Classes Tab ───────────────────────────────────────────────────────

type NewSessionForm = {
  subject: string;
  teacher: string;
  day: string;
  time: string;
  duration: string;
  joinLink: string;
};

const EMPTY_FORM: NewSessionForm = {
  subject: "",
  teacher: "",
  day: "Monday",
  time: "",
  duration: "",
  joinLink: "",
};

function useTeacherSessions() {
  return useQuery<VirtualSession[]>({
    queryKey: ["teacher-sessions"],
    queryFn: async () => {
      if (isDemoMode()) return withDelay(getSessions());
      const res = await api.get<VirtualSession[]>("/online-classes");
      if (!res.success) throw new Error(res.error ?? "Failed to load sessions");
      return (res.data ?? []).map(
        (s: VirtualSession & { joinUrl?: string }) => ({
          ...s,
          joinLink: s.joinUrl ?? s.joinLink,
        }),
      );
    },
  });
}

function statusVariant(status: string): string {
  if (status === "live")
    return "bg-emerald-500/10 text-emerald-600 border-emerald-300/40";
  if (status === "ended") return "bg-muted text-muted-foreground border-border";
  return "bg-sky-500/10 text-sky-600 border-sky-300/40";
}

function OnlineClassesTab() {
  const qc = useQueryClient();
  const { data: sessions = [], isLoading } = useTeacherSessions();
  const [editingLinks, setEditingLinks] = useState<Record<string, string>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<NewSessionForm>(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: async (data: NewSessionForm) => {
      if (isDemoMode()) {
        addSession({ ...data, participants: 0, status: "scheduled" });
        return;
      }
      const res = await api.post("/online-classes", {
        title: data.subject,
        subject: data.subject,
        day: data.day,
        time: data.time,
        duration: data.duration,
        joinUrl: data.joinLink,
        status: "scheduled",
      });
      if (!res.success) throw new Error(res.error ?? "Failed to create");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-sessions"] });
      toast.success("Session created");
      setAddOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<VirtualSession & { joinUrl?: string }>;
    }) => {
      if (isDemoMode()) {
        updateSession(id, data);
        return;
      }
      const res = await api.put(`/online-classes/${id}`, data);
      if (!res.success) throw new Error(res.error ?? "Failed to update");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-sessions"] });
      toast.success("Session updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode()) {
        deleteSession(id);
        return;
      }
      const res = await api.delete(`/online-classes/${id}`);
      if (!res.success) throw new Error(res.error ?? "Failed to delete");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-sessions"] });
      toast.info("Session removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleLinkSave(id: string) {
    const url = editingLinks[id] ?? "";
    updateMutation.mutate({ id, data: { joinLink: url, joinUrl: url } });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20 flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-primary-light)" }}
          >
            <Video
              className="w-4 h-4"
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold font-display text-foreground">
              Online Class Sessions
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paste meeting URLs and update session status for students
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 btn-press hover-lift"
            style={{ background: "var(--color-primary)" }}
            onClick={() => setAddOpen(true)}
            data-ocid="teacher.online_classes.open_modal_button"
          >
            <PlusCircle className="w-4 h-4" /> Add Session
          </Button>
        </div>

        {/* Add Session Panel */}
        {addOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-5 border-b border-border bg-muted/20 space-y-4"
          >
            <h3 className="text-sm font-semibold font-display text-foreground">
              New Session
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Subject *</Label>
                <Input
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="e.g. Mathematics"
                  data-ocid="teacher.add_session.subject.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Teacher *</Label>
                <Input
                  value={form.teacher}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, teacher: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="e.g. Mr. Adebayo"
                  data-ocid="teacher.add_session.teacher.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Day</Label>
                <Select
                  value={form.day}
                  onValueChange={(v) => setForm((f) => ({ ...f, day: v }))}
                >
                  <SelectTrigger
                    className="input-premium"
                    data-ocid="teacher.add_session.day.select"
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
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Time</Label>
                <Input
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="8:00 AM"
                  data-ocid="teacher.add_session.time.input"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">
                  Meeting URL (optional)
                </Label>
                <Input
                  value={form.joinLink}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, joinLink: e.target.value }))
                  }
                  className="input-premium"
                  placeholder="https://zoom.us/j/..."
                  data-ocid="teacher.add_session.joinlink.input"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddOpen(false)}
                data-ocid="teacher.add_session.cancel_button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending}
                className="btn-press"
                style={{ background: "var(--color-primary)" }}
                data-ocid="teacher.add_session.submit_button"
              >
                {createMutation.isPending ? "Creating..." : "Create Session"}
              </Button>
            </div>
          </motion.div>
        )}

        <div className="overflow-x-auto">
          <Table data-ocid="teacher.online_classes.table">
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Subject
                </TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-xs uppercase tracking-wide">
                  Day
                </TableHead>
                <TableHead className="hidden sm:table-cell font-semibold text-xs uppercase tracking-wide">
                  Time
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Meeting URL
                </TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                (["a", "b", "c"] as const).map((k) => (
                  <TableRow key={`sk-${k}`}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground text-sm py-14"
                    data-ocid="teacher.online_classes.empty_state"
                  >
                    <Video className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No sessions yet</p>
                    <p className="text-xs mt-1">
                      Click "Add Session" to get started
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s, i) => {
                  const editingUrl =
                    editingLinks[s.id] !== undefined
                      ? editingLinks[s.id]
                      : s.joinLink;
                  return (
                    <TableRow
                      key={s.id}
                      className="table-row-hover"
                      data-ocid={`teacher.online_classes.item.${i + 1}`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm">{s.subject}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {s.day}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {s.day}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {s.time}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={s.status}
                          onValueChange={(v) =>
                            updateMutation.mutate({
                              id: s.id,
                              data: { status: v as VirtualSession["status"] },
                            })
                          }
                        >
                          <SelectTrigger
                            className={`h-7 text-xs w-28 border rounded-full px-3 ${statusVariant(s.status)}`}
                            data-ocid={`teacher.online_classes.status.${i + 1}.select`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="ended">Ended</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60" />
                            <Input
                              value={editingUrl}
                              onChange={(e) =>
                                setEditingLinks((prev) => ({
                                  ...prev,
                                  [s.id]: e.target.value,
                                }))
                              }
                              placeholder="No URL set"
                              className="h-7 text-xs pl-7 input-premium"
                              data-ocid={`teacher.online_classes.url.${i + 1}.input`}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 flex-shrink-0 hover:bg-primary/10"
                            onClick={() => handleLinkSave(s.id)}
                            data-ocid={`teacher.online_classes.save_url.${i + 1}.button`}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {s.joinLink && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                              onClick={() =>
                                window.open(
                                  s.joinLink,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                              data-ocid={`teacher.online_classes.preview_link.${i + 1}.button`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteMutation.mutate(s.id)}
                            data-ocid={`teacher.online_classes.delete.${i + 1}.button`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Teacher List ─────────────────────────────────────────────────────────────

function TeacherList({ onSelect }: { onSelect: (id: number) => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useTeachers({ page, limit, search });
  const teachers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="p-5 border-b border-border bg-muted/20 flex items-center gap-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-primary-light)" }}
        >
          <Users
            className="w-4 h-4"
            style={{ color: "var(--color-primary)" }}
          />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold font-display text-foreground flex items-center gap-2">
            Teachers
            {total > 0 && (
              <Badge variant="secondary" className="text-xs">
                {total}
              </Badge>
            )}
          </h2>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or code…"
            className="pl-8 h-8 text-xs input-premium"
            data-ocid="teacher.list.search_input"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table data-ocid="teacher.list.table">
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Name
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Employee Code
              </TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-xs uppercase tracking-wide">
                Qualification
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Status
              </TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((k) => (
                <TableRow key={k}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-10 rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground text-sm py-14"
                  data-ocid="teacher.list.empty_state"
                >
                  <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="font-medium">No teachers found</p>
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((t, i) => (
                <TableRow
                  key={t.teacherId}
                  className="table-row-hover"
                  data-ocid={`teacher.list.item.${i + 1}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0"
                        style={{ background: "var(--color-primary)" }}
                      >
                        {t.fullName[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm">
                        {t.fullName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {t.employeeCode}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {t.qualification ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`badge-premium border text-xs ${t.status === "Active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-300/40" : "bg-muted text-muted-foreground border-border"}`}
                    >
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 hover:bg-primary/10 hover:text-primary"
                      onClick={() => onSelect(t.teacherId)}
                      data-ocid={`teacher.list.view.${i + 1}.button`}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-border flex items-center justify-between bg-muted/10">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              data-ocid="teacher.list.pagination_prev"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              data-ocid="teacher.list.pagination_next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher Detail ────────────────────────────────────────────────────────────

function TeacherDetail({
  teacherId,
  onBack,
}: { teacherId: number; onBack: () => void }) {
  const { data: teacher, isLoading } = useTeacherDetail(teacherId);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (!teacher) return null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="p-5 border-b border-border bg-muted/20 flex items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={onBack}
          className="gap-1 -ml-1 hover:bg-primary/10 hover:text-primary"
          data-ocid="teacher.detail.back_button"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0"
          style={{ background: "var(--color-primary)" }}
        >
          {teacher.fullName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold font-display text-foreground truncate">
            {teacher.fullName}
          </h2>
          <p className="text-xs text-muted-foreground">
            {teacher.employeeCode} · Joined {teacher.joinDate ?? "—"}
          </p>
        </div>
        <span
          className={`badge-premium border text-xs ${teacher.status === "Active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-300/40" : "bg-muted text-muted-foreground"}`}
        >
          {teacher.status}
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" /> Profile
          </h3>
          <dl className="space-y-3">
            {[
              { label: "Qualification", value: teacher.qualification },
              { label: "User ID", value: String(teacher.userId) },
              { label: "Employee Code", value: teacher.employeeCode },
              { label: "Join Date", value: teacher.joinDate },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3 items-start">
                <dt className="text-xs text-muted-foreground w-32 flex-shrink-0 pt-0.5">
                  {label}
                </dt>
                <dd className="font-medium text-sm text-foreground">
                  {value ?? "—"}
                </dd>
              </div>
            ))}
          </dl>

          <div className="pt-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Subjects Assigned
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {teacher.subjects.length > 0 ? (
                teacher.subjects.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No subjects assigned
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Student Roster
          </h3>
          {teacher.roster.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No students assigned.
            </p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">
                      Student
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Class
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Section
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacher.roster.map((r, i) => (
                    <TableRow
                      key={r.studentId}
                      className="table-row-hover"
                      data-ocid={`teacher.detail.roster.item.${i + 1}`}
                    >
                      <TableCell className="text-sm font-medium">
                        {r.studentName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.classId ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.sectionId ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Gradebook Tab ────────────────────────────────────────────────────────────

function GradebookTab({ teacherId }: { teacherId: number }) {
  const [filterClass, setFilterClass] = useState<number | undefined>(undefined);
  const [filterSubject, setFilterSubject] = useState<number | undefined>(
    undefined,
  );
  const [filterTerm, setFilterTerm] = useState<string | undefined>(undefined);

  const { data, isLoading } = useTeacherGradebook(teacherId, {
    class: filterClass,
    subject: filterSubject,
    term: filterTerm,
  });
  const entries = data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Students", value: entries.length, icon: Users },
          {
            label: "A Grades",
            value: entries.filter((e) => e.grade.startsWith("A")).length,
            icon: Award,
          },
          {
            label: "Avg Score",
            value:
              entries.length > 0
                ? Math.round(
                    entries.reduce(
                      (sum, e) =>
                        sum + (e.marks[e.marks.length - 1]?.score ?? 0),
                      0,
                    ) / entries.length,
                  )
                : "—",
            icon: BookOpen,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--color-primary-light)" }}
            >
              <Icon
                className="w-4 h-4"
                style={{ color: "var(--color-primary)" }}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-bold text-lg text-foreground leading-none">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="font-semibold font-display text-foreground">
              Gradebook
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={String(filterClass ?? "")}
              onValueChange={(v) => setFilterClass(v ? Number(v) : undefined)}
            >
              <SelectTrigger
                className="w-28 h-8 text-xs input-premium"
                data-ocid="teacher.gradebook.class.select"
              >
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {CLASS_OPTIONS.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(filterSubject ?? "")}
              onValueChange={(v) => setFilterSubject(v ? Number(v) : undefined)}
            >
              <SelectTrigger
                className="w-32 h-8 text-xs input-premium"
                data-ocid="teacher.gradebook.subject.select"
              >
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {SUBJECT_OPTIONS.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterTerm ?? ""}
              onValueChange={(v) => setFilterTerm(v || undefined)}
            >
              <SelectTrigger
                className="w-24 h-8 text-xs input-premium"
                data-ocid="teacher.gradebook.term.select"
              >
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Terms</SelectItem>
                {TERM_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table data-ocid="teacher.gradebook.table">
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Student
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Marks per Term
                </TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">
                  Grade
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4].map((k) => (
                  <TableRow key={k}>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-10 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground text-sm py-14"
                    data-ocid="teacher.gradebook.empty_state"
                  >
                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No gradebook data</p>
                    <p className="text-xs mt-1">Try adjusting the filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry, i) => (
                  <TableRow
                    key={entry.studentId}
                    className="table-row-hover stagger-item"
                    data-ocid={`teacher.gradebook.item.${i + 1}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                          style={{ background: "var(--color-primary)" }}
                        >
                          {entry.studentName[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">
                          {entry.studentName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {entry.marks.map((m) => (
                          <span
                            key={m.term}
                            className="inline-flex items-center gap-1 text-xs rounded-lg px-2 py-1 bg-muted/60 border border-border"
                          >
                            <span className="text-muted-foreground">
                              {m.term}:
                            </span>
                            <span className="font-bold text-foreground">
                              {m.score}
                            </span>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`badge-premium border text-xs font-bold ${gradeColor(entry.grade)}`}
                      >
                        {entry.grade}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Lesson Plan Tab ──────────────────────────────────────────────────────────

type LessonEntry = { subject: string; topic: string };

const initialLessons: Record<string, LessonEntry | null> = {
  "Mon-1": { subject: "Quadratic Equations", topic: "Factorisation" },
  "Mon-3": { subject: "Trigonometry", topic: "SOHCAHTOA intro" },
  "Tue-2": { subject: "Statistics", topic: "Mean & Median" },
  "Wed-4": { subject: "Algebra", topic: "Simultaneous Equations" },
  "Thu-1": { subject: "Geometry", topic: "Circle theorems" },
  "Fri-3": { subject: "Number Theory", topic: "HCF & LCM" },
};

type LessonPlanFormState = {
  subjectId: string;
  classId: string;
  lessonDate: string;
  objectives: string;
  content: string;
  resources: string;
};

const EMPTY_LP_FORM: LessonPlanFormState = {
  subjectId: "",
  classId: "",
  lessonDate: "",
  objectives: "",
  content: "",
  resources: "",
};

function LessonPlannerTab({ teacherId }: { teacherId: number }) {
  const [lessons, setLessons] =
    useState<Record<string, LessonEntry | null>>(initialLessons);
  const [editLesson, setEditLesson] = useState<{
    key: string;
    subject: string;
    topic: string;
  } | null>(null);
  const [lpForm, setLpForm] = useState<LessonPlanFormState>(EMPTY_LP_FORM);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const createLessonPlan = useCreateLessonPlan();

  function saveLocalLesson() {
    if (!editLesson) return;
    setLessons((prev) => ({
      ...prev,
      [editLesson.key]: {
        subject: editLesson.subject,
        topic: editLesson.topic,
      },
    }));
    setEditLesson(null);
  }

  function handleLpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lpForm.subjectId || !lpForm.classId || !lpForm.lessonDate) {
      toast.error("Subject, Class, and Lesson Date are required.");
      return;
    }
    const body: CreateLessonPlanRequest = {
      subjectId: Number(lpForm.subjectId),
      classId: Number(lpForm.classId),
      lessonDate: lpForm.lessonDate,
      objectives: lpForm.objectives || undefined,
      content: lpForm.content || undefined,
      resources: lpForm.resources || undefined,
    };
    createLessonPlan.mutate(
      { teacherId, body },
      {
        onSuccess: (data) => {
          toast.success(`Lesson plan created (ID: ${data.lessonPlanId})`);
          setLpForm(EMPTY_LP_FORM);
          setShowCreateDialog(false);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <div className="space-y-5">
      {/* Lesson Plan List header */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20 flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-primary-light)" }}
          >
            <BookOpen
              className="w-4 h-4"
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold font-display text-foreground">
              Lesson Plans
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create and manage structured lesson plans via API
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 btn-press hover-lift"
            style={{ background: "var(--color-primary)" }}
            onClick={() => setShowCreateDialog(true)}
            data-ocid="teacher.lesson_plan.toggle_button"
          >
            <PlusCircle className="w-4 h-4" /> New Lesson Plan
          </Button>
        </div>

        {/* Preview cards of current week */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(initialLessons).map(([key, lesson], i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-muted/30 rounded-xl border border-border p-3 space-y-1 hover-lift cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {key.replace("-", " · P")}
                </span>
                <Clock className="w-3 h-3 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                {lesson?.subject}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {lesson?.topic}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20">
          <h2 className="font-semibold font-display text-foreground">
            Weekly Planner Grid
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click a cell to add or edit a lesson entry
          </p>
        </div>
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[640px]"
            style={{ gridTemplateColumns: "80px repeat(5, 1fr)" }}
          >
            <div className="bg-muted/40 border-b border-r border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground">
              Period
            </div>
            {DAYS.map((d) => (
              <div
                key={d}
                className="bg-muted/40 border-b border-r last:border-r-0 border-border px-3 py-2.5 text-center text-xs font-bold text-foreground"
              >
                {d}
              </div>
            ))}
            {PERIODS.map((period) => (
              <>
                <div
                  key={`p-${period}`}
                  className="border-b border-r border-border px-2 py-3 flex flex-col items-center justify-center bg-muted/20"
                >
                  <span className="text-xs font-bold text-foreground">
                    {period}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {PERIOD_LABELS[period]}
                  </span>
                </div>
                {DAYS.map((day) => {
                  const key = `${day}-${period}`;
                  const lesson = lessons[key];
                  return (
                    <div
                      key={key}
                      className="border-b border-r last:border-r-0 border-border min-h-[72px] p-1"
                    >
                      {lesson ? (
                        <div
                          className="h-full rounded-lg p-2 flex flex-col justify-between transition-all hover:shadow-card"
                          style={{
                            background: "var(--color-primary-light)",
                            borderColor: "var(--color-primary)",
                            border: "1px solid",
                          }}
                        >
                          <p
                            className="text-xs font-semibold leading-tight"
                            style={{ color: "var(--color-primary)" }}
                          >
                            {lesson.subject}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {lesson.topic}
                          </p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="text-[10px] underline text-left transition-colors"
                                style={{ color: "var(--color-primary)" }}
                                onClick={() =>
                                  setEditLesson({
                                    key,
                                    subject: lesson.subject,
                                    topic: lesson.topic,
                                  })
                                }
                                data-ocid="teacher.planner.edit.button"
                              >
                                edit
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-60 shadow-floating"
                              data-ocid="teacher.planner.popover"
                            >
                              <div className="space-y-3">
                                <p className="text-sm font-semibold">
                                  Edit Lesson
                                </p>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Subject</Label>
                                  <Input
                                    value={
                                      editLesson?.key === key
                                        ? editLesson.subject
                                        : lesson.subject
                                    }
                                    onChange={(e) =>
                                      setEditLesson((el) =>
                                        el
                                          ? { ...el, subject: e.target.value }
                                          : null,
                                      )
                                    }
                                    className="input-premium"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Topic</Label>
                                  <Input
                                    value={
                                      editLesson?.key === key
                                        ? editLesson.topic
                                        : lesson.topic
                                    }
                                    onChange={(e) =>
                                      setEditLesson((el) =>
                                        el
                                          ? { ...el, topic: e.target.value }
                                          : null,
                                      )
                                    }
                                    className="input-premium"
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  className="w-full btn-press"
                                  style={{ background: "var(--color-primary)" }}
                                  onClick={saveLocalLesson}
                                  data-ocid="teacher.planner.save_button"
                                >
                                  Save
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="w-full h-full flex items-center justify-center text-muted-foreground/30 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                              onClick={() =>
                                setEditLesson({ key, subject: "", topic: "" })
                              }
                              data-ocid="teacher.planner.add.button"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-60 shadow-floating"
                            data-ocid="teacher.planner.popover"
                          >
                            <div className="space-y-3">
                              <p className="text-sm font-semibold">
                                Add Lesson
                              </p>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Subject</Label>
                                <Input
                                  value={
                                    editLesson?.key === key
                                      ? editLesson.subject
                                      : ""
                                  }
                                  onChange={(e) =>
                                    setEditLesson((el) =>
                                      el
                                        ? { ...el, subject: e.target.value }
                                        : {
                                            key,
                                            subject: e.target.value,
                                            topic: "",
                                          },
                                    )
                                  }
                                  className="input-premium"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Topic</Label>
                                <Input
                                  value={
                                    editLesson?.key === key
                                      ? editLesson.topic
                                      : ""
                                  }
                                  onChange={(e) =>
                                    setEditLesson((el) =>
                                      el
                                        ? { ...el, topic: e.target.value }
                                        : {
                                            key,
                                            subject: "",
                                            topic: e.target.value,
                                          },
                                    )
                                  }
                                  className="input-premium"
                                />
                              </div>
                              <Button
                                size="sm"
                                className="w-full btn-press"
                                style={{ background: "var(--color-primary)" }}
                                onClick={saveLocalLesson}
                                data-ocid="teacher.planner.save_button"
                              >
                                Add Lesson
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Create Lesson Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent
          className="glass-elevated border-white/20 shadow-modal max-w-lg"
          data-ocid="teacher.lesson_plan.dialog"
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--color-primary-light)" }}
              >
                <BookOpen
                  className="w-5 h-5"
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
              <div>
                <DialogTitle className="font-display">
                  Create Lesson Plan
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Saved via POST /teachers/{teacherId}/lesson-plan
                </p>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <form onSubmit={handleLpSubmit} className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Subject *</Label>
                <Select
                  value={lpForm.subjectId}
                  onValueChange={(v) =>
                    setLpForm((f) => ({ ...f, subjectId: v }))
                  }
                >
                  <SelectTrigger
                    className="input-premium"
                    data-ocid="teacher.lesson_plan.subject.select"
                  >
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Class *</Label>
                <Select
                  value={lpForm.classId}
                  onValueChange={(v) =>
                    setLpForm((f) => ({ ...f, classId: v }))
                  }
                >
                  <SelectTrigger
                    className="input-premium"
                    data-ocid="teacher.lesson_plan.class.select"
                  >
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Lesson Date *</Label>
              <Input
                type="date"
                value={lpForm.lessonDate}
                onChange={(e) =>
                  setLpForm((f) => ({ ...f, lessonDate: e.target.value }))
                }
                className="input-premium"
                data-ocid="teacher.lesson_plan.date.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Learning Objectives
              </Label>
              <Textarea
                value={lpForm.objectives}
                onChange={(e) =>
                  setLpForm((f) => ({ ...f, objectives: e.target.value }))
                }
                placeholder="e.g. Students will understand quadratic equations and their applications"
                className="min-h-[80px] text-sm resize-none input-premium"
                data-ocid="teacher.lesson_plan.objectives.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Lesson Content
              </Label>
              <Textarea
                value={lpForm.content}
                onChange={(e) =>
                  setLpForm((f) => ({ ...f, content: e.target.value }))
                }
                placeholder="e.g. Introduction to ax² + bx + c = 0, graphical solutions"
                className="min-h-[80px] text-sm resize-none input-premium"
                data-ocid="teacher.lesson_plan.content.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Resources</Label>
              <Input
                value={lpForm.resources}
                onChange={(e) =>
                  setLpForm((f) => ({ ...f, resources: e.target.value }))
                }
                className="input-premium"
                placeholder="e.g. Textbook chapter 4, Graph paper"
                data-ocid="teacher.lesson_plan.resources.input"
              />
            </div>
            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLpForm(EMPTY_LP_FORM);
                  setShowCreateDialog(false);
                }}
                data-ocid="teacher.lesson_plan.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLessonPlan.isPending}
                className="btn-press gap-2"
                style={{ background: "var(--color-primary)" }}
                data-ocid="teacher.lesson_plan.submit_button"
              >
                <Save className="w-4 h-4" />
                {createLessonPlan.isPending ? "Saving…" : "Save Lesson Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherPage() {
  const { user } = useAuth();
  const isTeacherRole = user?.role === "teacher";
  const teacherId = user?.id ?? null;

  const CURRENT_TEACHER_ID = teacherId ? Number(teacherId) : 1;
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
    null,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            {isTeacherRole
              ? `Welcome, ${user?.name ?? user?.username ?? "Teacher"}`
              : "Teacher Portal"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacherRole
              ? "Your assigned classes, subjects, and weekly timetable"
              : "Teacher directory, gradebook, lesson planning, and online class management"}
          </p>
        </div>
        {isDemoMode() && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Demo Mode
          </span>
        )}
      </div>

      {/* Teacher Dashboard — shown only when teacher role logs in */}
      {isTeacherRole && teacherId && (
        <MyTeacherDashboard teacherId={teacherId} />
      )}

      <Tabs defaultValue={isTeacherRole ? "online" : "teachers"}>
        <TabsList
          className="border-b border-border rounded-none bg-transparent p-0 h-auto gap-0"
          data-ocid="teacher.tab"
        >
          {[
            ...(!isTeacherRole
              ? [{ value: "teachers", label: "Teachers", icon: Users }]
              : []),
            { value: "gradebook", label: "Gradebook", icon: BookOpen },
            { value: "planner", label: "Lesson Planner", icon: GraduationCap },
            { value: "online", label: "Online Classes", icon: Video },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:text-foreground px-5 py-3 text-sm font-medium text-muted-foreground transition-colors gap-2"
              data-ocid={`teacher.tab.${value}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {!isTeacherRole && (
          <TabsContent value="teachers" className="mt-6">
            {selectedTeacherId !== null ? (
              <TeacherDetail
                teacherId={selectedTeacherId}
                onBack={() => setSelectedTeacherId(null)}
              />
            ) : (
              <TeacherList onSelect={setSelectedTeacherId} />
            )}
          </TabsContent>
        )}

        <TabsContent value="gradebook" className="mt-6">
          <GradebookTab teacherId={CURRENT_TEACHER_ID} />
        </TabsContent>

        <TabsContent value="planner" className="mt-6">
          <LessonPlannerTab teacherId={CURRENT_TEACHER_ID} />
        </TabsContent>

        <TabsContent value="online" className="mt-6">
          <OnlineClassesTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
