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
  useCreateExam,
  useDeleteExam,
  useExamResults,
  useExams,
  useUpdateExam,
} from "@/hooks/useQueries";
import type { ClassDto, CreateExamRequest, ExamDto } from "@/hooks/useQueries";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit2,
  PlusCircle,
  Trash2,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─── Constants (acceptable to hardcode) ─────────────────────────────────────
const TERM_OPTIONS = ["Term 1", "Term 2", "Term 3", "Final"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function resolveClassId(c: ClassDto): number {
  return (c.Id ?? c.id ?? 0) as number;
}
function resolveClassName(c: ClassDto): string {
  return c.ClassName ?? c.className ?? String(resolveClassId(c));
}
function formatDate(raw?: string): string {
  if (!raw) return "—";
  return new Date(`${raw.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<
  string,
  { badge: string; dot: string; bar: string }
> = {
  Scheduled: {
    badge: "bg-primary/10 text-primary border-primary/30",
    dot: "bg-primary",
    bar: "bg-primary",
  },
  Ongoing: {
    badge: "bg-warning/10 text-warning border-warning/30",
    dot: "bg-warning animate-pulse",
    bar: "bg-warning",
  },
  Completed: {
    badge: "bg-success/10 text-success border-success/30",
    dot: "bg-success",
    bar: "bg-success",
  },
};
const DEFAULT_STATUS_STYLE = STATUS_STYLE.Scheduled;

// ─── Add / Edit Exam Dialog ──────────────────────────────────────────────────
type DialogMode = { type: "add" } | { type: "edit"; exam: ExamDto };

function ExamFormDialog({
  mode,
  onClose,
}: { mode: DialogMode; onClose: () => void }) {
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const createMutation = useCreateExam();
  const updateMutation = useUpdateExam();

  const isEdit = mode.type === "edit";
  const exam = isEdit ? mode.exam : null;

  // Controlled name/dates; uncontrolled selects
  const [name, setName] = useState(exam?.name ?? "");
  const [startDate, setStartDate] = useState(exam?.startDate ?? "");
  const [endDate, setEndDate] = useState(exam?.endDate ?? "");

  const termRef = useRef<HTMLSelectElement>(null);
  const classRef = useRef<HTMLSelectElement>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit() {
    const term = termRef.current?.value ?? "";
    const classIdStr = classRef.current?.value ?? "";

    if (!name.trim()) {
      toast.error("Exam name is required");
      return;
    }
    if (!term) {
      toast.error("Term is required");
      return;
    }

    const payload: CreateExamRequest = { Name: name.trim(), Term: term };
    if (classIdStr && classIdStr !== "") payload.ClassId = Number(classIdStr);
    if (startDate) payload.StartDate = startDate;
    if (endDate) payload.EndDate = endDate;

    if (isEdit && exam) {
      updateMutation.mutate(
        { id: exam.id, payload },
        {
          onSuccess: () => {
            toast.success("Exam updated");
            onClose();
          },
          onError: (e: Error) => toast.error(e.message),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Exam scheduled");
          onClose();
        },
        onError: (e: Error) => toast.error(e.message),
      });
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md glass-elevated rounded-2xl"
        data-ocid={isEdit ? "exams.edit.dialog" : "exams.add.dialog"}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-[oklch(0.55_0.15_275)] rounded-t-2xl" />
        <DialogHeader className="pt-2">
          <DialogTitle className="font-display flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-3.5 h-3.5 text-primary" />
            </div>
            {isEdit ? "Edit Exam" : "Schedule New Exam"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Exam Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mid-Term Mathematics"
              className="input-premium rounded-xl"
              data-ocid={
                isEdit ? "exams.edit.name.input" : "exams.add.name.input"
              }
            />
          </div>

          {/* Term + Class */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Term <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <select
                  ref={termRef}
                  defaultValue={exam?.term ?? "Term 1"}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none"
                  data-ocid={
                    isEdit ? "exams.edit.term.select" : "exams.add.term.select"
                  }
                >
                  {TERM_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Class
              </Label>
              <div className="relative">
                <select
                  ref={classRef}
                  defaultValue={exam?.classId ? String(exam.classId) : ""}
                  disabled={classesLoading}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none"
                  data-ocid={
                    isEdit
                      ? "exams.edit.class.select"
                      : "exams.add.class.select"
                  }
                >
                  <option value="">
                    {classesLoading ? "Loading..." : "All Classes"}
                  </option>
                  {classes.map((c) => {
                    const id = resolveClassId(c);
                    return (
                      <option key={id} value={String(id)}>
                        {resolveClassName(c)}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-premium rounded-xl"
                data-ocid={
                  isEdit
                    ? "exams.edit.start_date.input"
                    : "exams.add.start_date.input"
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-premium rounded-xl"
                data-ocid={
                  isEdit
                    ? "exams.edit.end_date.input"
                    : "exams.add.end_date.input"
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
            data-ocid={
              isEdit ? "exams.edit.cancel_button" : "exams.add.cancel_button"
            }
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
            className="rounded-xl btn-school-primary btn-press"
            data-ocid={
              isEdit ? "exams.edit.save_button" : "exams.add.submit_button"
            }
          >
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Schedule Exam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────
function DeleteConfirmDialog({
  exam,
  onClose,
}: { exam: ExamDto; onClose: () => void }) {
  const deleteMutation = useDeleteExam();
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-sm glass-elevated rounded-2xl"
        data-ocid="exams.delete.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Delete Exam?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{exam.name}</strong>? This
          cannot be undone.
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-ocid="exams.delete.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() =>
              deleteMutation.mutate(exam.id, {
                onSuccess: () => {
                  toast.success("Exam deleted");
                  onClose();
                },
                onError: (e: Error) => toast.error(e.message),
              })
            }
            data-ocid="exams.delete.confirm_button"
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Results Panel ────────────────────────────────────────────────────────────
function ResultsPanel({
  examId,
  examName,
}: { examId: string; examName: string }) {
  const { data: results = [], isLoading } = useExamResults(examId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-card overflow-hidden mt-4"
    >
      <div className="px-5 py-3 bg-muted/30 border-b border-border">
        <p className="font-semibold font-display text-sm">
          Results —{" "}
          <span className="text-muted-foreground font-normal">{examName}</span>
        </p>
      </div>
      {isLoading ? (
        <div className="p-5 space-y-3" data-ocid="exams.results.loading_state">
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-10 rounded-xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div
          className="py-12 text-center text-muted-foreground text-sm"
          data-ocid="exams.results.empty_state"
        >
          No results available yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Marks</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(results as unknown[]).map((item, i) => {
                const r = item as Record<string, unknown>;
                const marks = (r.marks as number) ?? 0;
                const maxMarks = (r.maxMarks as number) ?? 100;
                const pct =
                  maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;
                const grade = (r.grade as string) ?? "";
                const status = (r.status as string) ?? "";
                const name =
                  (r.studentName as string) ?? (r.fullName as string) ?? "—";
                return (
                  <TableRow
                    key={(r.studentId as number) ?? i}
                    data-ocid={`exams.result.item.${i + 1}`}
                  >
                    <TableCell className="text-muted-foreground text-xs">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {name}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {marks}/{maxMarks}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-sm font-semibold ${pct >= 70 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive"}`}
                      >
                        {pct}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm">
                      {grade}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${status === "Pass" ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExamsPage() {
  const { data: classes = [], isLoading: classesLoading } = useClasses();

  const termFilterRef = useRef<HTMLSelectElement>(null);
  const classFilterRef = useRef<HTMLSelectElement>(null);

  const [termFilter, setTermFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamDto | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const { data: exams = [], isLoading } = useExams({
    page: 1,
    limit: 20,
    term: termFilter || undefined,
  });

  const filteredExams = classFilter
    ? exams.filter(
        (e) => e.classId != null && String(e.classId) === classFilter,
      )
    : exams;

  const total = filteredExams.length;
  const completed = filteredExams.filter(
    (e) => e.status === "Completed",
  ).length;
  const scheduled = filteredExams.filter(
    (e) => e.status === "Scheduled",
  ).length;
  const ongoing = filteredExams.filter((e) => e.status === "Ongoing").length;

  const summaryCards = [
    {
      label: "Total",
      value: total,
      icon: BookOpen,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Scheduled",
      value: scheduled,
      icon: Calendar,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Ongoing",
      value: ongoing,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  const selectedExam = filteredExams.find((e) => e.id === selectedExamId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header */}
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
                {total}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Schedule and manage examinations, view results
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-2 rounded-xl btn-school-primary btn-press shadow-card shrink-0"
          onClick={() => setDialogMode({ type: "add" })}
          data-ocid="exams.add.open_modal_button"
        >
          <PlusCircle className="w-4 h-4" /> Schedule Exam
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.3 }}
            className="card-premium bg-card rounded-2xl border border-border shadow-card p-5"
          >
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
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            ref={termFilterRef}
            defaultValue=""
            onChange={(e) => setTermFilter(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none w-36"
            data-ocid="exams.term.filter.select"
          >
            <option value="">All Terms</option>
            {TERM_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative">
          <select
            ref={classFilterRef}
            defaultValue=""
            onChange={(e) => setClassFilter(e.target.value)}
            disabled={classesLoading}
            className="h-9 rounded-xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none w-36"
            data-ocid="exams.class.filter.select"
          >
            <option value="">
              {classesLoading ? "Loading..." : "All Classes"}
            </option>
            {classes.map((c) => {
              const id = resolveClassId(c);
              return (
                <option key={id} value={String(id)}>
                  {resolveClassName(c)}
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="exams.loading_state">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
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
              type="button"
              size="sm"
              className="mt-4 gap-2 btn-school-primary"
              onClick={() => setDialogMode({ type: "add" })}
              data-ocid="exams.empty.add_button"
            >
              <PlusCircle className="w-4 h-4" /> Schedule Exam
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto" data-ocid="exams.table">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Term</TableHead>
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Start Date</TableHead>
                  <TableHead className="font-semibold">End Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam, i) => {
                  const st =
                    STATUS_STYLE[exam.status ?? ""] ?? DEFAULT_STATUS_STYLE;
                  const isSelected = selectedExamId === exam.id;
                  return (
                    <TableRow
                      key={exam.id}
                      className={`table-row-hover stagger-item ${isSelected ? "bg-primary/5" : ""}`}
                      data-ocid={`exams.item.${i + 1}`}
                    >
                      <TableCell className="font-semibold text-sm text-foreground max-w-[220px] truncate">
                        {exam.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs badge-premium bg-muted/40 text-muted-foreground border border-border px-2 py-0.5 rounded-lg">
                          {exam.term ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {exam.classId
                          ? classes.find(
                              (c) => resolveClassId(c) === exam.classId,
                            )
                            ? resolveClassName(
                                classes.find(
                                  (c) => resolveClassId(c) === exam.classId,
                                ) as ClassDto,
                              )
                            : `Class ${exam.classId}`
                          : "All"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(exam.startDate ?? exam.date)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(exam.endDate)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`badge-premium flex items-center gap-1.5 w-fit border text-xs ${st.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${st.dot}`}
                          />
                          {exam.status ?? "Scheduled"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {exam.status === "Completed" && (
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className="h-7 text-xs gap-1 rounded-lg px-2"
                              onClick={() =>
                                setSelectedExamId(isSelected ? null : exam.id)
                              }
                              data-ocid={`exams.results_button.${i + 1}`}
                            >
                              <Trophy className="w-3 h-3" />
                              {isSelected ? "Hide" : "Results"}
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary"
                            onClick={() =>
                              setDialogMode({ type: "edit", exam })
                            }
                            aria-label="Edit exam"
                            data-ocid={`exams.edit_button.${i + 1}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(exam)}
                            aria-label="Delete exam"
                            data-ocid={`exams.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Results Panel */}
      {selectedExam && selectedExamId && (
        <ResultsPanel examId={selectedExamId} examName={selectedExam.name} />
      )}

      {/* Dialogs */}
      {dialogMode && (
        <ExamFormDialog mode={dialogMode} onClose={() => setDialogMode(null)} />
      )}
      {deleteTarget && (
        <DeleteConfirmDialog
          exam={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </motion.div>
  );
}
