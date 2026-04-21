import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Link2,
  Pencil,
  PlusCircle,
  Save,
  Search,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

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

// Subject/class options for filter dropdowns (display labels)
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

// ─── Online Classes Tab (unchanged from original) ─────────────────────────────

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
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="flex-1">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" /> Online Class Sessions
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paste meeting URLs and update session status for students
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setAddOpen(true)}
            data-ocid="teacher.online_classes.open_modal_button"
          >
            <PlusCircle className="w-4 h-4" /> Add Session
          </Button>
        </div>

        {addOpen && (
          <div className="p-5 border-b border-border bg-muted/20 space-y-3">
            <h3 className="text-sm font-medium">New Session</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Subject *</Label>
                <Input
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="e.g. Mathematics"
                  className="h-8 text-xs"
                  data-ocid="teacher.add_session.subject.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teacher *</Label>
                <Input
                  value={form.teacher}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, teacher: e.target.value }))
                  }
                  placeholder="e.g. Mr. Adebayo"
                  className="h-8 text-xs"
                  data-ocid="teacher.add_session.teacher.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Day</Label>
                <Select
                  value={form.day}
                  onValueChange={(v) => setForm((f) => ({ ...f, day: v }))}
                >
                  <SelectTrigger
                    className="h-8 text-xs"
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
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                  placeholder="8:00 AM"
                  className="h-8 text-xs"
                  data-ocid="teacher.add_session.time.input"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Meeting URL (optional)</Label>
                <Input
                  value={form.joinLink}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, joinLink: e.target.value }))
                  }
                  placeholder="https://zoom.us/j/..."
                  className="h-8 text-xs"
                  data-ocid="teacher.add_session.joinlink.input"
                />
              </div>
            </div>
            <div className="flex gap-2">
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
                data-ocid="teacher.add_session.submit_button"
              >
                {createMutation.isPending ? "Creating..." : "Create Session"}
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table data-ocid="teacher.online_classes.table">
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden md:table-cell">Day</TableHead>
                <TableHead className="hidden sm:table-cell">Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Meeting URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                (["a", "b", "c"] as const).map((k) => (
                  <TableRow key={`sk-${k}`}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground text-sm py-10"
                    data-ocid="teacher.online_classes.empty_state"
                  >
                    No sessions yet. Click "Add Session" to get started.
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
                      data-ocid={`teacher.online_classes.item.${i + 1}`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.subject}</p>
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
                            className="h-7 text-xs w-28"
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
                              className="h-7 text-xs pl-7"
                              data-ocid={`teacher.online_classes.url.${i + 1}.input`}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 flex-shrink-0"
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
                              className="h-7 w-7 p-0"
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

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-3">
        <h2 className="font-semibold text-foreground flex-1 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Teachers
          {total > 0 && (
            <Badge variant="secondary" className="text-xs">
              {total}
            </Badge>
          )}
        </h2>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search name or code…"
            className="pl-8 h-8 text-xs"
            data-ocid="teacher.list.search_input"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table data-ocid="teacher.list.table">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Employee Code</TableHead>
              <TableHead className="hidden md:table-cell">
                Qualification
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((k) => (
                <TableRow key={k}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground text-sm py-10"
                  data-ocid="teacher.list.empty_state"
                >
                  No teachers found.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((t, i) => (
                <TableRow
                  key={t.teacherId}
                  data-ocid={`teacher.list.item.${i + 1}`}
                >
                  <TableCell className="font-medium">{t.fullName}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {t.employeeCode}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {t.qualification ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${t.status === "Active" ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground"}`}
                    >
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => onSelect(t.teacherId)}
                      data-ocid={`teacher.list.view.${i + 1}.button`}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-border flex items-center justify-between">
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
      <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (!teacher) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={onBack}
          className="gap-1 -ml-1"
          data-ocid="teacher.detail.back_button"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">
            {teacher.fullName}
          </h2>
          <p className="text-xs text-muted-foreground">
            {teacher.employeeCode} · Joined {teacher.joinDate ?? "—"}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${teacher.status === "Active" ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground"}`}
        >
          {teacher.status}
        </Badge>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Profile</h3>
          <dl className="space-y-2">
            {[
              { label: "Qualification", value: teacher.qualification },
              { label: "User ID", value: String(teacher.userId) },
              { label: "Employee Code", value: teacher.employeeCode },
              { label: "Join Date", value: teacher.joinDate },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-2 text-sm">
                <dt className="text-muted-foreground w-32 flex-shrink-0">
                  {label}
                </dt>
                <dd className="font-medium">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>

          <div className="pt-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Subjects Assigned
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {teacher.subjects.length > 0 ? (
                teacher.subjects.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  No subjects assigned
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Roster */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Student Roster
          </h3>
          {teacher.roster.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No students assigned.
            </p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">Class</TableHead>
                    <TableHead className="text-xs">Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacher.roster.map((r, i) => (
                    <TableRow
                      key={r.studentId}
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
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="p-5 border-b border-border flex flex-wrap items-center gap-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2 flex-1">
          <BookOpen className="w-4 h-4 text-primary" /> Gradebook
        </h2>
        <div className="flex flex-wrap gap-2">
          <Select
            value={String(filterClass ?? "")}
            onValueChange={(v) => setFilterClass(v ? Number(v) : undefined)}
          >
            <SelectTrigger
              className="w-28 h-8 text-xs"
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
              className="w-32 h-8 text-xs"
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
              className="w-24 h-8 text-xs"
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
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Marks per Term</TableHead>
              <TableHead className="text-right">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4].map((k) => (
                <TableRow key={k}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground text-sm py-10"
                  data-ocid="teacher.gradebook.empty_state"
                >
                  No gradebook data for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry, i) => (
                <TableRow
                  key={entry.studentId}
                  data-ocid={`teacher.gradebook.item.${i + 1}`}
                >
                  <TableCell className="font-medium">
                    {entry.studentName}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {entry.marks.map((m) => (
                        <span
                          key={m.term}
                          className="inline-flex items-center gap-1 text-xs bg-muted/60 rounded px-2 py-0.5"
                        >
                          <span className="text-muted-foreground">
                            {m.term}:
                          </span>
                          <span className="font-semibold">{m.score}</span>
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold ${
                        entry.grade.startsWith("A")
                          ? "bg-success/10 text-success border-success/30"
                          : entry.grade.startsWith("B")
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {entry.grade}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
  const [showCreateForm, setShowCreateForm] = useState(false);

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
          setShowCreateForm(false);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Form */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <h2 className="font-semibold text-foreground flex-1">
            Create Lesson Plan
          </h2>
          <Button
            size="sm"
            variant={showCreateForm ? "outline" : "default"}
            className="gap-2"
            onClick={() => setShowCreateForm((v) => !v)}
            data-ocid="teacher.lesson_plan.toggle_button"
          >
            <PlusCircle className="w-4 h-4" />
            {showCreateForm ? "Cancel" : "New Plan"}
          </Button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleLpSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Subject *</Label>
                <Select
                  value={lpForm.subjectId}
                  onValueChange={(v) =>
                    setLpForm((f) => ({ ...f, subjectId: v }))
                  }
                >
                  <SelectTrigger
                    className="h-8 text-xs"
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
                <Label className="text-xs font-medium">Class *</Label>
                <Select
                  value={lpForm.classId}
                  onValueChange={(v) =>
                    setLpForm((f) => ({ ...f, classId: v }))
                  }
                >
                  <SelectTrigger
                    className="h-8 text-xs"
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

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Lesson Date *</Label>
                <Input
                  type="date"
                  value={lpForm.lessonDate}
                  onChange={(e) =>
                    setLpForm((f) => ({ ...f, lessonDate: e.target.value }))
                  }
                  className="h-8 text-xs"
                  data-ocid="teacher.lesson_plan.date.input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Learning Objectives</Label>
              <Textarea
                value={lpForm.objectives}
                onChange={(e) =>
                  setLpForm((f) => ({ ...f, objectives: e.target.value }))
                }
                placeholder="e.g. Students will understand quadratic equations and their applications"
                className="min-h-[72px] text-xs resize-none"
                data-ocid="teacher.lesson_plan.objectives.textarea"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Lesson Content</Label>
              <Textarea
                value={lpForm.content}
                onChange={(e) =>
                  setLpForm((f) => ({ ...f, content: e.target.value }))
                }
                placeholder="e.g. Introduction to ax² + bx + c = 0, graphical solutions, worked examples"
                className="min-h-[72px] text-xs resize-none"
                data-ocid="teacher.lesson_plan.content.textarea"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Resources</Label>
              <Input
                value={lpForm.resources}
                onChange={(e) =>
                  setLpForm((f) => ({ ...f, resources: e.target.value }))
                }
                placeholder="e.g. Textbook chapter 4, Graph paper, Calculator"
                className="h-8 text-xs"
                data-ocid="teacher.lesson_plan.resources.input"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setLpForm(EMPTY_LP_FORM);
                  setShowCreateForm(false);
                }}
                data-ocid="teacher.lesson_plan.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createLessonPlan.isPending}
                data-ocid="teacher.lesson_plan.submit_button"
              >
                {createLessonPlan.isPending ? "Saving…" : "Save Lesson Plan"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Weekly Timetable Grid */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Weekly Planner</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click a cell to add or edit a lesson entry
          </p>
        </div>
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[640px]"
            style={{ gridTemplateColumns: "80px repeat(5, 1fr)" }}
          >
            <div className="bg-muted/40 border-b border-r border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
              Period
            </div>
            {DAYS.map((d) => (
              <div
                key={d}
                className="bg-muted/40 border-b border-r last:border-r-0 border-border px-3 py-2 text-center text-xs font-bold text-foreground"
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
                  <span className="text-xs font-bold">{period}</span>
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
                        <div className="h-full rounded-md bg-primary/5 border border-primary/20 p-2 flex flex-col justify-between">
                          <p className="text-xs font-semibold text-primary leading-tight">
                            {lesson.subject}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {lesson.topic}
                          </p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="text-[10px] text-primary/60 hover:text-primary underline text-left"
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
                              className="w-60"
                              data-ocid="teacher.planner.popover"
                            >
                              <div className="space-y-3">
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
                                  className="h-7 text-xs"
                                />
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
                                  className="h-7 text-xs"
                                />
                                <Button
                                  size="sm"
                                  className="w-full"
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
                              className="w-full h-full flex items-center justify-center text-muted-foreground/30 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                              onClick={() =>
                                setEditLesson({ key, subject: "", topic: "" })
                              }
                              data-ocid="teacher.planner.add.button"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-60"
                            data-ocid="teacher.planner.popover"
                          >
                            <div className="space-y-3">
                              <p className="text-sm font-medium">Add Lesson</p>
                              <div>
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
                                  className="mt-1 h-7 text-xs"
                                />
                              </div>
                              <div>
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
                                  className="mt-1 h-7 text-xs"
                                />
                              </div>
                              <Button
                                size="sm"
                                className="w-full"
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherPage() {
  // Use teacherId=1 as the "current teacher" for gradebook/lesson plan hooks
  // In live mode this should come from the auth context
  const CURRENT_TEACHER_ID = 1;

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
      <div>
        <h1 className="text-xl font-bold text-foreground">Teacher Portal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Teacher directory, gradebook, lesson planning, and online class
          management
        </p>
      </div>

      <Tabs defaultValue="teachers">
        <TabsList data-ocid="teacher.tab">
          <TabsTrigger value="teachers" data-ocid="teacher.tab.teachers">
            Teachers
          </TabsTrigger>
          <TabsTrigger value="gradebook" data-ocid="teacher.tab.gradebook">
            Gradebook
          </TabsTrigger>
          <TabsTrigger value="planner" data-ocid="teacher.tab.planner">
            Lesson Planner
          </TabsTrigger>
          <TabsTrigger value="online" data-ocid="teacher.tab.online">
            Online Classes
          </TabsTrigger>
        </TabsList>

        {/* Teachers List / Detail */}
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

        {/* Gradebook — wired to CURRENT_TEACHER_ID with filters */}
        <TabsContent value="gradebook" className="mt-6">
          <GradebookTab teacherId={CURRENT_TEACHER_ID} />
        </TabsContent>

        {/* Lesson Planner — create form + timetable grid */}
        <TabsContent value="planner" className="mt-6">
          <LessonPlannerTab teacherId={CURRENT_TEACHER_ID} />
        </TabsContent>

        {/* Online Classes */}
        <TabsContent value="online" className="mt-6">
          <OnlineClassesTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
