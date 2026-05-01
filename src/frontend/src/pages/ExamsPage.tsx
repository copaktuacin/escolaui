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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isDemoMode } from "@/lib/demoMode";
import { withDelay } from "@/lib/mockData";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  PlusCircle,
  Trash2,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ExamStatus = "Scheduled" | "Ongoing" | "Completed";

/** Matches the .NET CreateExamRequest DTO exactly (PascalCase). */
type CreateExamRequest = {
  Name: string;
  Term: string;
  ClassId?: number;
  StartDate?: string; // ISO "YYYY-MM-DD"
  EndDate?: string; // ISO "YYYY-MM-DD"
};

type Exam = {
  id: string;
  name: string;
  term: string;
  subject?: string;
  classId: number;
  sectionId?: number;
  startDate?: string;
  endDate?: string;
  /** Legacy fields kept for display only (may come from backend) */
  date?: string;
  duration?: number;
  maxMarks?: number;
  status: ExamStatus;
};

type ExamResult = {
  studentId: number;
  studentName: string;
  marks: number;
  maxMarks: number;
  grade: string;
  status: "Pass" | "Fail";
};

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_EXAMS: Exam[] = [
  {
    id: "EX-001",
    name: "Mid-Term Mathematics",
    term: "Term 1",
    subject: "Mathematics",
    classId: 10,
    sectionId: 1,
    startDate: "2026-04-20",
    endDate: "2026-04-20",
    date: "2026-04-20",
    duration: 120,
    maxMarks: 100,
    status: "Scheduled",
  },
  {
    id: "EX-002",
    name: "Physics Unit Test 2",
    term: "Term 1",
    subject: "Physics",
    classId: 10,
    sectionId: 1,
    startDate: "2026-04-18",
    endDate: "2026-04-18",
    date: "2026-04-18",
    duration: 90,
    maxMarks: 50,
    status: "Completed",
  },
  {
    id: "EX-003",
    name: "English Literature Exam",
    term: "Term 1",
    subject: "English",
    classId: 9,
    sectionId: 1,
    startDate: "2026-04-15",
    endDate: "2026-04-15",
    date: "2026-04-15",
    duration: 180,
    maxMarks: 100,
    status: "Completed",
  },
  {
    id: "EX-004",
    name: "Chemistry Mid-Term",
    term: "Term 2",
    subject: "Chemistry",
    classId: 11,
    startDate: "2026-04-25",
    endDate: "2026-04-26",
    date: "2026-04-25",
    duration: 120,
    maxMarks: 100,
    status: "Scheduled",
  },
  {
    id: "EX-005",
    name: "Biology Practical",
    term: "Term 2",
    subject: "Biology",
    classId: 9,
    startDate: "2026-04-22",
    endDate: "2026-04-22",
    date: "2026-04-22",
    duration: 60,
    maxMarks: 30,
    status: "Ongoing",
  },
];

const MOCK_RESULTS: ExamResult[] = [
  {
    studentId: 101,
    studentName: "Aiden Clarke",
    marks: 88,
    maxMarks: 100,
    grade: "A",
    status: "Pass",
  },
  {
    studentId: 102,
    studentName: "Blessing Nwosu",
    marks: 72,
    maxMarks: 100,
    grade: "B+",
    status: "Pass",
  },
  {
    studentId: 103,
    studentName: "Chidera Obi",
    marks: 91,
    maxMarks: 100,
    grade: "A+",
    status: "Pass",
  },
  {
    studentId: 104,
    studentName: "Diana Petrov",
    marks: 65,
    maxMarks: 100,
    grade: "B",
    status: "Pass",
  },
  {
    studentId: 105,
    studentName: "Elijah Santos",
    marks: 45,
    maxMarks: 100,
    grade: "D",
    status: "Fail",
  },
  {
    studentId: 106,
    studentName: "Fatima Al-Hassan",
    marks: 79,
    maxMarks: 100,
    grade: "B+",
    status: "Pass",
  },
];

const CLASS_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
const TERM_OPTIONS = ["Term 1", "Term 2", "Term 3", "Final"];

// ─── Status / Style config ─────────────────────────────────────────────────────

const statusConfig: Record<
  ExamStatus,
  {
    label: string;
    className: string;
    dot: string;
    cardBorder: string;
    cardBg: string;
  }
> = {
  Scheduled: {
    label: "Scheduled",
    className: "bg-primary/10 text-primary border-primary/30",
    dot: "bg-primary",
    cardBorder: "border-border",
    cardBg: "",
  },
  Ongoing: {
    label: "Ongoing",
    className: "bg-warning/10 text-warning border-warning/30",
    dot: "bg-warning animate-pulse",
    cardBorder: "border-warning/40",
    cardBg: "bg-warning/5",
  },
  Completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/30",
    dot: "bg-success",
    cardBorder: "border-success/20",
    cardBg: "",
  },
};

const subjectColorMap: Record<string, { badge: string; icon: string }> = {
  Mathematics: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "bg-blue-100",
  },
  Physics: {
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    icon: "bg-orange-100",
  },
  Chemistry: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "bg-emerald-100",
  },
  English: {
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "bg-purple-100",
  },
  Biology: {
    badge: "bg-green-50 text-green-700 border-green-200",
    icon: "bg-green-100",
  },
};
const defaultSubjectColor = {
  badge: "bg-muted/30 text-muted-foreground border-border",
  icon: "bg-muted/30",
};

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "text-success font-bold";
  if (grade.startsWith("B")) return "text-primary font-semibold";
  if (grade.startsWith("C")) return "text-warning font-semibold";
  return "text-destructive font-semibold";
}

// ─── Data hooks ────────────────────────────────────────────────────────────────

function useExams(params: { classId?: number; status?: string }) {
  return useQuery<Exam[]>({
    queryKey: ["exams", params.classId, params.status],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        let filtered = MOCK_EXAMS;
        if (params.classId)
          filtered = filtered.filter((e) => e.classId === params.classId);
        if (params.status && params.status !== "all")
          filtered = filtered.filter((e) => e.status === params.status);
        return filtered;
      }
      const qs = new URLSearchParams();
      if (params.classId) qs.set("classId", String(params.classId));
      if (params.status && params.status !== "all")
        qs.set("status", params.status);
      const res = await api.get<{ data: Exam[] }>(`/exams?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load exams");
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object))
        return (raw as { data: Exam[] }).data;
      return (raw as Exam[]) ?? [];
    },
  });
}

function useExamResults(examId: string | null) {
  return useQuery<ExamResult[]>({
    queryKey: ["exam-results", examId],
    queryFn: async () => {
      if (!examId) return [];
      if (isDemoMode()) {
        await withDelay(null, 400);
        return MOCK_RESULTS;
      }
      const res = await api.get<{ data: ExamResult[] }>(
        `/exams/${examId}/results`,
      );
      if (!res.success) throw new Error(res.error ?? "Failed to load results");
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object))
        return (raw as { data: ExamResult[] }).data;
      return (raw as ExamResult[]) ?? [];
    },
    enabled: !!examId,
  });
}

function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateExamRequest): Promise<{ id: string }> => {
      if (isDemoMode()) {
        await withDelay(null, 600);
        return { id: `EX-${Date.now()}` };
      }
      const res = await api.post<{ id: string }>("/exams", payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to create exam");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

// ─── Add Exam Form types ────────────────────────────────────────────────────────

type AddExamForm = {
  name: string;
  term: string;
  classId: string;
  startDate: string;
  endDate: string;
};

const EMPTY_EXAM_FORM: AddExamForm = {
  name: "",
  term: "Term 1",
  classId: "10",
  startDate: "",
  endDate: "",
};

// ─── AddExamDialog ─────────────────────────────────────────────────────────────

function AddExamDialog({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateExam();
  const [form, setForm] = useState<AddExamForm>(EMPTY_EXAM_FORM);

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Exam name is required");
      return;
    }
    if (!form.term) {
      toast.error("Term is required");
      return;
    }

    // Build PascalCase payload, omitting empty optional fields
    const payload: CreateExamRequest = {
      Name: form.name.trim(),
      Term: form.term,
    };
    if (form.classId && form.classId !== "")
      payload.ClassId = Number(form.classId);
    if (form.startDate) payload.StartDate = form.startDate;
    if (form.endDate) payload.EndDate = form.endDate;

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Exam scheduled successfully");
        setForm(EMPTY_EXAM_FORM);
        onClose();
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function handleClose() {
    setForm(EMPTY_EXAM_FORM);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md glass-elevated rounded-2xl"
        data-ocid="exams.add.dialog"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-[oklch(0.55_0.15_275)] rounded-t-2xl" />
        <DialogHeader className="pt-2">
          <DialogTitle className="font-display flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-3.5 h-3.5 text-primary" />
            </div>
            Schedule New Exam
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Exam Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Exam Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Mid-Term Mathematics"
              className="input-premium rounded-xl"
              data-ocid="exams.add.name.input"
            />
          </div>

          {/* Term + Class */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Term <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.term}
                onValueChange={(v) => setForm((f) => ({ ...f, term: v }))}
              >
                <SelectTrigger
                  className="input-premium rounded-xl"
                  data-ocid="exams.add.term.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Class
              </Label>
              <Select
                value={form.classId}
                onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}
              >
                <SelectTrigger
                  className="input-premium rounded-xl"
                  data-ocid="exams.add.class.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((c) => (
                    <SelectItem key={c} value={String(c)}>
                      Class {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Start Date
              </Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className="input-premium rounded-xl"
                data-ocid="exams.add.start_date.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                End Date
              </Label>
              <Input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
                className="input-premium rounded-xl"
                data-ocid="exams.add.end_date.input"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-xl"
            data-ocid="exams.add.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createMutation.isPending || !form.name.trim() || !form.term
            }
            className="rounded-xl btn-school-primary btn-press"
            data-ocid="exams.add.submit_button"
          >
            {createMutation.isPending ? "Scheduling…" : "Schedule Exam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const classParam = classFilter !== "all" ? Number(classFilter) : undefined;
  const { data: exams, isLoading } = useExams({
    classId: classParam,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const resultsQuery = useExamResults(selectedExamId);

  const examList = exams ?? [];
  const totalExams = examList.length;
  const completedCount = examList.filter(
    (e) => e.status === "Completed",
  ).length;
  const scheduledCount = examList.filter(
    (e) => e.status === "Scheduled",
  ).length;
  const ongoingCount = examList.filter((e) => e.status === "Ongoing").length;

  const summaryCards = [
    {
      label: "Total Exams",
      value: totalExams,
      icon: BookOpen,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: "Scheduled",
      value: scheduledCount,
      icon: Calendar,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: "Ongoing",
      value: ongoingCount,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/20",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/20",
    },
  ];

  const selectedExam = examList.find((e) => e.id === selectedExamId);

  /** Display date: prefer startDate, fall back to legacy date field */
  function displayDate(exam: Exam): string {
    const raw = exam.startDate || exam.date;
    if (!raw) return "—";
    return new Date(`${raw}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shadow-subtle">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
                Examinations
              </h1>
              <span className="badge-premium bg-primary/10 text-primary border border-primary/20">
                {totalExams}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Schedule and manage examinations, view results
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2 rounded-xl btn-school-primary btn-press shadow-card shrink-0"
          onClick={() => setAddOpen(true)}
          data-ocid="exams.add.open_modal_button"
        >
          <PlusCircle className="w-4 h-4" /> Schedule Exam
        </Button>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.3 }}
            className={`card-premium bg-card rounded-2xl border ${card.border} shadow-card p-5 relative overflow-hidden`}
          >
            <div
              className={`absolute inset-0 ${card.bg} opacity-25 pointer-events-none`}
            />
            <div className="relative">
              <div
                className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <p className="text-3xl font-bold font-display text-foreground leading-none mb-1">
                  {card.value}
                </p>
              )}
              <p className="text-xs text-muted-foreground font-medium">
                {card.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="schedule">
        <TabsList
          className="bg-card border border-border shadow-card rounded-xl p-1"
          data-ocid="exams.tab"
        >
          <TabsTrigger
            value="schedule"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Exam Schedule
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Results
          </TabsTrigger>
        </TabsList>

        {/* ── Schedule Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="schedule" className="mt-5 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger
                className="w-36 rounded-xl input-premium"
                data-ocid="exams.class.select"
              >
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASS_OPTIONS.map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-36 rounded-xl input-premium"
                data-ocid="exams.status.select"
              >
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exam Cards Grid */}
          {isLoading ? (
            <div
              className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
              data-ocid="exams.loading_state"
            >
              {[1, 2, 3, 4].map((k) => (
                <Skeleton key={`sk-${k}`} className="h-52 rounded-2xl" />
              ))}
            </div>
          ) : examList.length === 0 ? (
            <div
              className="text-center py-20 text-muted-foreground"
              data-ocid="exams.empty_state"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 opacity-30" />
              </div>
              <p className="font-semibold text-foreground">No exams found</p>
              <p className="text-sm mt-1">
                Schedule your first exam to get started.
              </p>
              <Button
                size="sm"
                className="mt-4 gap-2 btn-school-primary"
                onClick={() => setAddOpen(true)}
                data-ocid="exams.empty_add.button"
              >
                <PlusCircle className="w-4 h-4" /> Schedule Exam
              </Button>
            </div>
          ) : (
            <div
              className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
              data-ocid="exams.table"
            >
              {examList.map((exam, i) => {
                const sc = statusConfig[exam.status];
                const subjectStyle = exam.subject
                  ? (subjectColorMap[exam.subject] ?? defaultSubjectColor)
                  : defaultSubjectColor;
                const isOngoing = exam.status === "Ongoing";
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`card-premium relative bg-card rounded-2xl border shadow-card overflow-hidden flex flex-col ${sc.cardBorder} ${sc.cardBg} ${
                      isOngoing
                        ? "shadow-[0_0_0_2px_oklch(0.78_0.17_65/0.3),0_4px_16px_oklch(0.78_0.17_65/0.15)]"
                        : ""
                    }`}
                    data-ocid={`exams.item.${i + 1}`}
                  >
                    {/* Top accent bar */}
                    <div
                      className={`h-1 w-full ${isOngoing ? "bg-warning" : exam.status === "Completed" ? "bg-success" : "bg-primary"}`}
                    />

                    <div className="p-5 flex flex-col gap-4 flex-1">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm leading-snug font-display line-clamp-2">
                            {exam.name}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {exam.subject && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${subjectStyle.badge}`}
                              >
                                {exam.subject}
                              </span>
                            )}
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border bg-muted/30 text-muted-foreground border-border">
                              {exam.term}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`badge-premium flex items-center gap-1.5 flex-shrink-0 border ${sc.className}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />
                          {sc.label}
                        </span>
                      </div>

                      {/* Meta grid */}
                      <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="w-6 h-6 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <span>{displayDate(exam)}</span>
                        </div>
                        {exam.duration !== undefined && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-6 h-6 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <span>{exam.duration} min</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="w-6 h-6 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <span>
                            Class {exam.classId}
                            {exam.sectionId ? ` — Sec ${exam.sectionId}` : ""}
                          </span>
                        </div>
                        {exam.maxMarks !== undefined && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-6 h-6 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                              <Trophy className="w-3.5 h-3.5" />
                            </div>
                            <span>{exam.maxMarks} marks</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-auto pt-1">
                        {exam.status === "Completed" && (
                          <Button
                            size="sm"
                            variant={
                              selectedExamId === exam.id ? "default" : "outline"
                            }
                            className="flex-1 h-8 text-xs gap-1.5 rounded-xl btn-press"
                            onClick={() =>
                              setSelectedExamId(
                                selectedExamId === exam.id ? null : exam.id,
                              )
                            }
                            data-ocid={`exams.results_button.${i + 1}`}
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            {selectedExamId === exam.id
                              ? "Hide Results"
                              : "View Results"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-primary shrink-0"
                          onClick={() => toast.info("Edit coming soon")}
                          data-ocid={`exams.edit_button.${i + 1}`}
                          aria-label="Edit exam"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => toast.info("Delete coming soon")}
                          data-ocid={`exams.delete_button.${i + 1}`}
                          aria-label="Delete exam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Results Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="results" className="mt-5">
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground font-display">
                  Exam Results
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedExam
                    ? `Showing results for: ${selectedExam.name}`
                    : "Select a completed exam from the Schedule tab to view results"}
                </p>
              </div>
              {selectedExam && (
                <span
                  className={`badge-premium flex items-center gap-1.5 border ${statusConfig[selectedExam.status].className}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedExam.status].dot}`}
                  />
                  {selectedExam.subject ?? selectedExam.term}
                </span>
              )}
            </div>

            {!selectedExamId ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="exams.results.empty_state"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Edit2 className="w-8 h-8 opacity-30" />
                </div>
                <p className="font-semibold text-foreground">
                  No exam selected
                </p>
                <p className="text-sm mt-1">
                  Click "View Results" on a completed exam in the Schedule tab.
                </p>
              </div>
            ) : resultsQuery.isLoading ? (
              <div
                className="p-6 space-y-3"
                data-ocid="exams.results.loading_state"
              >
                {[1, 2, 3, 4].map((k) => (
                  <Skeleton key={k} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="w-12 font-semibold">#</TableHead>
                      <TableHead className="font-semibold">
                        Student Name
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Marks
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        %
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Grade
                      </TableHead>
                      <TableHead className="font-semibold">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(resultsQuery.data ?? []).map((r, i) => {
                      const pct = Math.round((r.marks / r.maxMarks) * 100);
                      return (
                        <TableRow
                          key={r.studentId}
                          className="stagger-item table-row-hover"
                          data-ocid={`exams.result.item.${i + 1}`}
                        >
                          <TableCell className="text-muted-foreground text-sm font-medium">
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  r.status === "Pass"
                                    ? "bg-success/15 text-success"
                                    : "bg-destructive/15 text-destructive"
                                }`}
                              >
                                {r.studentName
                                  .split(" ")
                                  .map((p) => p[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <span className="font-semibold text-foreground text-sm">
                                {r.studentName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-mono">
                            {r.marks} / {r.maxMarks}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct >= 70 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold tabular-nums">
                                {pct}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`text-sm ${gradeColor(r.grade)}`}>
                              {r.grade}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs font-semibold ${
                                r.status === "Pass"
                                  ? "bg-success/10 text-success border-success/30"
                                  : "bg-destructive/10 text-destructive border-destructive/30"
                              }`}
                            >
                              {r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AddExamDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </motion.div>
  );
}
