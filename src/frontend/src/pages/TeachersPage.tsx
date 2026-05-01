import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  type CreateTeacherRequest,
  type UpdateTeacherRequest,
  useCreateTeacher,
  useTeacherDetail,
  useTeachers,
  useUpdateTeacher,
} from "@/hooks/useQueries";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  Pencil,
  PlusCircle,
  Search,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 15;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
];

const SUBJECT_CHIP_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getSubjectChipColor(subject: string) {
  return SUBJECT_CHIP_COLORS[
    subject.charCodeAt(0) % SUBJECT_CHIP_COLORS.length
  ];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "Active")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-subtle">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    );
  if (status === "OnLeave")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-subtle">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        On Leave
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Inactive
    </span>
  );
}

// ─── Float Input ──────────────────────────────────────────────────────────────

function FloatInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  ocid,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  ocid?: string;
  hint?: string;
}) {
  const id = `fi-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <div className="relative group">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? " "}
          data-ocid={ocid}
          className="peer w-full h-12 rounded-xl border border-input bg-background/70 px-3 pt-5 pb-1.5 text-sm text-foreground placeholder-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-subtle group-hover:border-border/80"
        />
        <label
          htmlFor={id}
          className="absolute left-3 top-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pointer-events-none transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-primary"
        >
          {label}
        </label>
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground mt-1 px-1">{hint}</p>
      )}
    </div>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

const T_SK_WIDTHS = ["w-20", "w-32", "w-28", "w-24", "w-14", "w-16", "w-12"];
const T_SK_KEYS = [
  "t-emp",
  "t-name",
  "t-qual",
  "t-subj",
  "t-stat",
  "t-join",
  "t-act",
];

function TeacherSkeletonRow({ rowIdx }: { rowIdx: number }) {
  return (
    <TableRow
      className="border-b border-border/50"
      data-ocid="teachers.loading_state"
    >
      {T_SK_KEYS.map((key, j) => (
        <TableCell key={`${key}-${rowIdx}`} className="py-3">
          <div
            className={`h-5 rounded-lg bg-muted/60 animate-pulse ${T_SK_WIDTHS[j] ?? "w-20"}`}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── View Teacher Dialog ───────────────────────────────────────────────────────

function ViewTeacherDialog({
  teacherId,
  open,
  onClose,
}: { teacherId: number | null; open: boolean; onClose: () => void }) {
  const { data, isLoading } = useTeacherDetail(teacherId ?? 0);
  const [tab, setTab] = useState<"overview" | "roster">("overview");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-border/60"
        style={{ boxShadow: "var(--shadow-modal)" }}
        data-ocid="teachers.view.dialog"
      >
        <div
          className="px-6 pt-6 pb-4 border-b border-border/60"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--primary)/0.08), oklch(var(--primary)/0.03) 60%, transparent)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Teacher Profile
            </DialogTitle>
          </DialogHeader>
        </div>

        {isLoading || !data ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <ScrollArea className="max-h-[68vh]">
            <div className="p-6 space-y-5">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/6 to-transparent shadow-subtle">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-card font-display font-bold text-xl ${getAvatarColor(data.fullName)}`}
                >
                  {getInitials(data.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-semibold text-foreground text-base leading-tight">
                    {data.fullName}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">
                    {data.employeeCode}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={data.status} />
                  </div>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1.5">
                {(["overview", "roster"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-150 ${tab === t ? "bg-primary text-primary-foreground shadow-card" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                  >
                    {t === "roster"
                      ? `Roster (${data.roster.length})`
                      : "Overview"}
                  </button>
                ))}
              </div>

              {tab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Qualification",
                        value: data.qualification ?? "–",
                      },
                      {
                        label: "Join Date",
                        value: data.joinDate
                          ? new Date(data.joinDate).toLocaleDateString()
                          : "–",
                      },
                      { label: "Status", value: data.status },
                      {
                        label: "Created",
                        value: new Date(data.createdAt).toLocaleDateString(),
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="p-3 rounded-xl bg-muted/40 border border-border/50"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          {label}
                        </p>
                        <p className="font-medium text-foreground text-sm">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  {data.subjects.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="w-4 h-4 text-primary/70" />
                          <span className="font-display font-semibold text-foreground text-sm">
                            Subjects
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {data.subjects.map((s) => (
                            <span
                              key={s}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getSubjectChipColor(s)}`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab === "roster" && (
                <div className="space-y-2">
                  {data.roster.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 opacity-30 mx-auto mb-2" />
                      <p className="text-sm">No students assigned</p>
                    </div>
                  ) : (
                    data.roster.map((r) => (
                      <div
                        key={r.studentId}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-display font-bold text-[10px] ${getAvatarColor(r.studentName)}`}
                          >
                            {getInitials(r.studentName)}
                          </div>
                          <span className="font-medium text-foreground text-sm">
                            {r.studentName}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md">
                          {r.classId ? `C${r.classId}` : ""}
                          {r.sectionId ? `-${r.sectionId}` : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
            data-ocid="teachers.view.close_button"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Teacher Dialog ───────────────────────────────────────────────────────

function EditTeacherDialog({
  teacherId,
  open,
  onClose,
}: { teacherId: number | null; open: boolean; onClose: () => void }) {
  const { data, isLoading } = useTeacherDetail(teacherId ?? 0);
  const updateMutation = useUpdateTeacher();
  const [form, setForm] = useState<UpdateTeacherRequest>({});

  const effectiveForm: UpdateTeacherRequest = {
    qualification: form.qualification ?? data?.qualification ?? "",
    status: form.status ?? data?.status ?? "Active",
    joinDate: form.joinDate ?? data?.joinDate ?? "",
  };

  function handleSave() {
    if (!teacherId) return;
    updateMutation.mutate(
      { id: teacherId, body: effectiveForm },
      {
        onSuccess: () => {
          toast.success("Teacher updated");
          setForm({});
          onClose();
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setForm({});
          onClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-border/60"
        style={{ boxShadow: "var(--shadow-modal)" }}
        data-ocid="teachers.edit.dialog"
      >
        <div
          className="px-6 pt-6 pb-4 border-b border-border/60"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--primary)/0.08), oklch(var(--primary)/0.03) 60%, transparent)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Edit Teacher
            </DialogTitle>
          </DialogHeader>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <FloatInput
              label="Qualification"
              value={effectiveForm.qualification ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, qualification: v }))}
              placeholder="e.g. B.Sc. Education"
              ocid="teachers.edit.qualification.input"
            />
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Status
              </p>
              <Select
                value={effectiveForm.status ?? "Active"}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger
                  className="h-12 rounded-xl"
                  data-ocid="teachers.edit.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="OnLeave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FloatInput
              label="Join Date"
              type="date"
              value={effectiveForm.joinDate ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, joinDate: v }))}
              ocid="teachers.edit.join_date.input"
            />
          </div>
        )}

        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setForm({});
              onClose();
            }}
            className="rounded-xl"
            data-ocid="teachers.edit.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
            className="rounded-xl shadow-card btn-school-primary"
            data-ocid="teachers.edit.save_button"
          >
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Teacher Dialog ───────────────────────────────────────────────────────

type AddForm = {
  userId: string;
  employeeCode: string;
  qualification: string;
  joinDate: string;
};
const EMPTY_ADD_FORM: AddForm = {
  userId: "",
  employeeCode: "",
  qualification: "",
  joinDate: new Date().toISOString().split("T")[0],
};

function AddTeacherDialog({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateTeacher();
  const [form, setForm] = useState<AddForm>(EMPTY_ADD_FORM);

  function handleSubmit() {
    if (!form.employeeCode.trim()) {
      toast.error("Employee code is required");
      return;
    }
    if (!form.joinDate) {
      toast.error("Join date is required");
      return;
    }
    const payload: CreateTeacherRequest = {
      userId: form.userId ? Number(form.userId) : 0,
      employeeCode: form.employeeCode.trim(),
      qualification: form.qualification.trim() || undefined,
      joinDate: form.joinDate,
    };
    createMutation.mutate(payload, {
      onSuccess: (res) => {
        toast.success(`Teacher added — ID: ${res.teacherId}`);
        setForm(EMPTY_ADD_FORM);
        onClose();
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setForm(EMPTY_ADD_FORM);
          onClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-border/60"
        style={{ boxShadow: "var(--shadow-modal)" }}
        data-ocid="teachers.add.dialog"
      >
        <div
          className="px-6 pt-6 pb-4 border-b border-border/60"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--primary)/0.08), oklch(var(--primary)/0.03) 60%, transparent)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Add New Teacher
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <FloatInput
            label="User ID (from system)"
            type="number"
            value={form.userId}
            onChange={(v) => setForm((f) => ({ ...f, userId: v }))}
            placeholder="e.g. 6"
            ocid="teachers.add.user_id.input"
            hint="Create the user account first under Admin → Users"
          />
          <FloatInput
            label="Employee Code *"
            value={form.employeeCode}
            onChange={(v) => setForm((f) => ({ ...f, employeeCode: v }))}
            placeholder="e.g. EMP006"
            ocid="teachers.add.employee_code.input"
          />
          <FloatInput
            label="Qualification"
            value={form.qualification}
            onChange={(v) => setForm((f) => ({ ...f, qualification: v }))}
            placeholder="e.g. B.Sc. Education, M.Ed."
            ocid="teachers.add.qualification.input"
          />
          <FloatInput
            label="Join Date *"
            type="date"
            value={form.joinDate}
            onChange={(v) => setForm((f) => ({ ...f, joinDate: v }))}
            ocid="teachers.add.join_date.input"
          />
        </div>

        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setForm(EMPTY_ADD_FORM);
              onClose();
            }}
            className="rounded-xl"
            data-ocid="teachers.add.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createMutation.isPending ||
              !form.employeeCode.trim() ||
              !form.joinDate
            }
            className="rounded-xl shadow-card btn-school-primary"
            data-ocid="teachers.add.submit_button"
          >
            {createMutation.isPending ? "Adding…" : "Add Teacher"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const { data, isLoading } = useTeachers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
  const updateMutation = useUpdateTeacher();

  const teachers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleDeactivateConfirm() {
    if (!deactivateTarget) return;
    updateMutation.mutate(
      { id: deactivateTarget.id, body: { status: "Inactive" } },
      {
        onSuccess: () => {
          toast.success(`${deactivateTarget.name} deactivated`);
          setDeactivateTarget(null);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              Teachers
            </h1>
            {total > 0 && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 shadow-subtle"
              >
                {total.toLocaleString()}
              </motion.span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage teacher profiles, assignments, and qualifications
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2 h-9 shadow-card btn-school-primary rounded-xl hover:shadow-elevated transition-all active:scale-95"
          onClick={() => setAddOpen(true)}
          data-ocid="teachers.add.open_modal_button"
        >
          <PlusCircle className="w-4 h-4" /> Add Teacher
        </Button>
      </div>

      {/* ── Glass Search Bar ────────────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-border/60 p-4 shadow-subtle">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or employee code…"
            className="w-full pl-9 pr-3 h-10 rounded-xl border border-input bg-background/70 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-subtle"
            data-ocid="teachers.search.search_input"
          />
        </div>
      </div>

      {/* ── Table Card ──────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        {/* Table header bar */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-gradient-to-r from-muted/40 via-muted/20 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-foreground text-sm">
              Teacher Records
              <span className="ml-2 text-muted-foreground font-normal text-xs">
                ({total})
              </span>
            </h2>
          </div>
          {isLoading && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Loading…
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table data-ocid="teachers.table">
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/60">
                {[
                  "Employee Code",
                  "Full Name",
                  "Qualification",
                  "Subjects",
                  "Status",
                  "Joined",
                  "Actions",
                ].map((h, i) => (
                  <TableHead
                    key={h}
                    className={`text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3 ${i === 2 ? "hidden md:table-cell" : ""} ${i === 3 ? "hidden lg:table-cell" : ""} ${i === 5 ? "hidden sm:table-cell" : ""} ${i === 6 ? "text-right pr-5" : ""}`}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [0, 1, 2, 3, 4].map((k) => (
                  <TeacherSkeletonRow key={`t-skel-${k}`} rowIdx={k} />
                ))
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div
                      className="text-center py-16 text-muted-foreground"
                      data-ocid="teachers.empty_state"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4 shadow-subtle"
                      >
                        <GraduationCap className="w-8 h-8 opacity-40" />
                      </motion.div>
                      <p className="text-sm font-semibold font-display text-foreground mb-1">
                        No teachers found
                      </p>
                      <p className="text-xs">
                        {search
                          ? "Try adjusting your search"
                          : "Add your first teacher to get started"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {teachers.map((t, i) => (
                    <motion.tr
                      key={t.teacherId}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className={`group border-b border-border/40 transition-colors hover:bg-primary/4 ${i % 2 === 1 ? "bg-muted/10" : ""}`}
                      data-ocid={`teachers.item.${(page - 1) * PAGE_SIZE + i + 1}`}
                    >
                      {/* Employee Code */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md border border-border/40">
                          {t.employeeCode}
                        </span>
                      </td>
                      {/* Full Name + Avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-subtle font-display font-bold text-xs ${getAvatarColor(t.fullName)}`}
                          >
                            {getInitials(t.fullName)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm leading-tight">
                              {t.fullName}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Qualification */}
                      <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground max-w-[180px]">
                        <span className="truncate block">
                          {t.qualification ?? "–"}
                        </span>
                      </td>
                      {/* Subjects */}
                      <td className="hidden lg:table-cell px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSubjectChipColor("staff")}`}
                          >
                            Staff
                          </span>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      {/* Joined */}
                      <td className="hidden sm:table-cell px-4 py-3 text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => setViewId(t.teacherId)}
                            data-ocid={`teachers.view_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => setEditId(t.teacherId)}
                            data-ocid={`teachers.edit_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          {t.status === "Active" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 rounded-lg text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setDeactivateTarget({
                                  id: t.teacherId,
                                  name: t.fullName,
                                })
                              }
                              data-ocid={`teachers.deactivate_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-border/60 bg-muted/10 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {total > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()} teachers`
              : "No teachers"}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg shadow-subtle"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              data-ocid="teachers.pagination_prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, k) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + k;
              return (
                <button
                  key={`pg-${p}`}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-8 min-w-[2rem] px-2 rounded-lg text-xs font-semibold transition-all ${p === page ? "bg-primary text-primary-foreground shadow-card" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {p}
                </button>
              );
            })}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg shadow-subtle"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              data-ocid="teachers.pagination_next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddTeacherDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <ViewTeacherDialog
        teacherId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
      <EditTeacherDialog
        teacherId={editId}
        open={editId !== null}
        onClose={() => setEditId(null)}
      />

      <AlertDialog
        open={deactivateTarget !== null}
        onOpenChange={(v) => !v && setDeactivateTarget(null)}
      >
        <AlertDialogContent
          className="rounded-2xl"
          style={{ boxShadow: "var(--shadow-modal)" }}
          data-ocid="teachers.deactivate.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Deactivate Teacher
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>{deactivateTarget?.name}</strong>? Their access will be
              revoked automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              data-ocid="teachers.deactivate.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={handleDeactivateConfirm}
              data-ocid="teachers.deactivate.confirm_button"
            >
              {updateMutation.isPending ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
