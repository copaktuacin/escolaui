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
  type CreateStudentRequest,
  type UpdateStudentRequest,
  useCreateStudent,
  useDeleteStudent,
  useStudentDetail,
  useStudents,
  useUpdateStudent,
} from "@/hooks/useQueries";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Mail,
  MapPin,
  Pencil,
  Phone,
  PlusCircle,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 10;
const CLASS_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
const SECTION_OPTIONS = [1, 2, 3, 4];
const STATUS_OPTIONS = ["all", "Active", "Inactive"] as const;

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type AddForm = {
  name: string;
  rollNo: string;
  classId: string;
  sectionId: string;
  dob: string;
  gender: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
};

const EMPTY_ADD_FORM: AddForm = {
  name: "",
  rollNo: "",
  classId: "10",
  sectionId: "",
  dob: "",
  gender: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-subtle">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
      {status || "Inactive"}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  ocid?: string;
}) {
  const id = `fi-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
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
  );
}

// ─── Shimmer Skeleton Row ─────────────────────────────────────────────────────

const SKELETON_WIDTHS = [
  "w-24",
  "w-32",
  "w-16",
  "w-16",
  "w-12",
  "w-14",
  "w-10",
];
const SKELETON_KEYS = [
  "sk-enr",
  "sk-name",
  "sk-cls",
  "sk-sec",
  "sk-gen",
  "sk-stat",
  "sk-act",
];

function SkeletonRow({ rowIdx }: { rowIdx: number }) {
  return (
    <TableRow
      className="border-b border-border/50"
      data-ocid="students.loading_state"
    >
      {SKELETON_KEYS.map((key, j) => (
        <TableCell key={`${key}-${rowIdx}`} className="py-3">
          <div
            className={`h-5 rounded-lg bg-muted/60 animate-pulse ${SKELETON_WIDTHS[j] ?? "w-20"}`}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── View Dialog ──────────────────────────────────────────────────────────────

function ViewStudentDialog({
  studentId,
  open,
  onClose,
}: { studentId: number | null; open: boolean; onClose: () => void }) {
  const { data, isLoading } = useStudentDetail(studentId ?? 0);
  const [parentTab, setParentTab] = useState(0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-border/60"
        style={{ boxShadow: "var(--shadow-modal)" }}
        data-ocid="students.view.dialog"
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 border-b border-border/60"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--primary)/0.08), oklch(var(--primary)/0.03) 60%, transparent)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-foreground">
              Student Profile
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
              {/* Identity card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/6 to-transparent shadow-subtle">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-card font-display font-bold text-xl ${getAvatarColor(data.fullName)}`}
                >
                  {getInitials(data.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-semibold text-foreground text-base leading-tight truncate">
                    {data.fullName}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">
                    {data.enrollmentNo}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={data.status} />
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Class",
                    value: data.classId ? `Class ${data.classId}` : "–",
                  },
                  {
                    label: "Section",
                    value: data.sectionId ? `Section ${data.sectionId}` : "–",
                  },
                  {
                    label: "Gender",
                    value:
                      data.gender === "M"
                        ? "Male"
                        : data.gender === "F"
                          ? "Female"
                          : (data.gender ?? "–"),
                  },
                  { label: "Date of Birth", value: data.dateOfBirth ?? "–" },
                  { label: "Status", value: data.status },
                  {
                    label: "Enrolled",
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

              {data.address && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/50 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary/70" />
                  <span className="text-muted-foreground">{data.address}</span>
                </div>
              )}

              {data.parents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-primary/70" />
                      <span className="font-display font-semibold text-foreground text-sm">
                        Parents / Guardians
                      </span>
                    </div>
                    <div className="flex gap-1.5 mb-3">
                      {data.parents.map((p, i) => (
                        <button
                          key={p.parentId}
                          type="button"
                          onClick={() => setParentTab(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${parentTab === i ? "bg-primary text-primary-foreground shadow-card" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                        >
                          {p.fullName.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                    {data.parents[parentTab] && (
                      <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                        <p className="font-semibold text-foreground text-sm">
                          {data.parents[parentTab].fullName}
                        </p>
                        {data.parents[parentTab].phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 text-primary/60" />
                            <span>{data.parents[parentTab].phone}</span>
                          </div>
                        )}
                        {data.parents[parentTab].email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3.5 h-3.5 text-primary/60" />
                            <span>{data.parents[parentTab].email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
            data-ocid="students.view.close_button"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditStudentDialog({
  studentId,
  open,
  onClose,
}: { studentId: number | null; open: boolean; onClose: () => void }) {
  const { data, isLoading } = useStudentDetail(studentId ?? 0);
  const updateMutation = useUpdateStudent();
  const [form, setForm] = useState<UpdateStudentRequest>({});

  const effectiveForm: UpdateStudentRequest = {
    name: form.name ?? data?.fullName ?? "",
    rollNo: form.rollNo ?? "",
    classId: form.classId ?? data?.classId ?? undefined,
    sectionId: form.sectionId ?? data?.sectionId ?? undefined,
    dob: form.dob ?? data?.dateOfBirth ?? "",
    gender: form.gender ?? data?.gender ?? "",
    status: form.status ?? data?.status ?? "Active",
  };

  function handleSave() {
    if (!studentId) return;
    updateMutation.mutate(
      { id: studentId, payload: effectiveForm },
      {
        onSuccess: () => {
          toast.success("Student updated successfully");
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
        className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-border/60"
        style={{ boxShadow: "var(--shadow-modal)" }}
        data-ocid="students.edit.dialog"
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
              Edit Student
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
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FloatInput
                label="Full Name"
                value={effectiveForm.name ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Full name"
                ocid="students.edit.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Class
              </p>
              <Select
                value={
                  effectiveForm.classId !== undefined
                    ? String(effectiveForm.classId)
                    : ""
                }
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, classId: Number(v) }))
                }
              >
                <SelectTrigger
                  className="h-12 rounded-xl"
                  data-ocid="students.edit.class.select"
                >
                  <SelectValue placeholder="Select class" />
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
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Section
              </p>
              <Select
                value={
                  effectiveForm.sectionId !== undefined
                    ? String(effectiveForm.sectionId)
                    : ""
                }
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, sectionId: v || undefined }))
                }
              >
                <SelectTrigger
                  className="h-12 rounded-xl"
                  data-ocid="students.edit.section.select"
                >
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Section {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Gender
              </p>
              <Select
                value={effectiveForm.gender ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}
              >
                <SelectTrigger
                  className="h-12 rounded-xl"
                  data-ocid="students.edit.gender.select"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  data-ocid="students.edit.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <FloatInput
                label="Date of Birth"
                type="date"
                value={effectiveForm.dob ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, dob: v }))}
                ocid="students.edit.dob.input"
              />
            </div>
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
            data-ocid="students.edit.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
            className="rounded-xl shadow-card btn-school-primary"
            data-ocid="students.edit.save_button"
          >
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [form, setForm] = useState<AddForm>(EMPTY_ADD_FORM);
  const [parentInfoTab, setParentInfoTab] = useState(0);

  const classParam = classFilter !== "all" ? Number(classFilter) : undefined;
  const sectionParam = sectionFilter !== "all" ? sectionFilter : undefined;

  const { data, isLoading } = useStudents({
    class: classParam,
    section: sectionParam,
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
  const students = (data?.data ?? []).filter(
    (s) => statusFilter === "all" || s.status === statusFilter,
  );
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const createMutation = useCreateStudent();
  const deleteMutation = useDeleteStudent();

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }
  function handleClassChange(val: string) {
    setClassFilter(val);
    setPage(1);
  }
  function handleSectionChange(val: string) {
    setSectionFilter(val);
    setPage(1);
  }

  function handleAddSubmit() {
    if (!form.name.trim()) {
      toast.error("Full name is required");
      return;
    }
    const payload: CreateStudentRequest = {
      name: form.name.trim(),
      rollNo: form.rollNo.trim() || undefined,
      classId: Number(form.classId),
      sectionId: form.sectionId || undefined,
      dob: form.dob || undefined,
      gender: form.gender || undefined,
      parentInfo:
        form.parentName || form.parentPhone || form.parentEmail
          ? {
              name: form.parentName || undefined,
              phone: form.parentPhone || undefined,
              email: form.parentEmail || undefined,
            }
          : undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: (res) => {
        toast.success(`Student added — Enrollment No: ${res.enrollmentNo}`);
        setAddOpen(false);
        setForm(EMPTY_ADD_FORM);
        setParentInfoTab(0);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.name} removed`);
        setDeleteTarget(null);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  const activeFilters = [
    classFilter !== "all",
    sectionFilter !== "all",
    statusFilter !== "all",
  ].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
              Students
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
            View and manage all enrolled students
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/students/bulk-import">
            <Button
              size="sm"
              variant="outline"
              className="gap-2 rounded-xl h-9 border-border/60 hover:border-primary/40 transition-all"
              data-ocid="students.bulk_import.button"
            >
              <Upload className="w-4 h-4" /> Bulk Import
            </Button>
          </Link>
          <Button
            size="sm"
            className="gap-2 rounded-xl h-9 shadow-card btn-school-primary hover:shadow-elevated transition-all active:scale-95"
            onClick={() => setAddOpen(true)}
            data-ocid="students.add.open_modal_button"
          >
            <PlusCircle className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </div>

      {/* ── Glass Toolbar ───────────────────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-border/60 p-4 space-y-3 shadow-subtle">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search by name or enrollment no…"
              className="w-full pl-9 pr-3 h-10 rounded-xl border border-input bg-background/70 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-subtle"
              data-ocid="students.search.search_input"
            />
          </div>
          {/* Class filter */}
          <Select value={classFilter} onValueChange={handleClassChange}>
            <SelectTrigger
              className="w-36 h-10 rounded-xl shadow-subtle"
              data-ocid="students.class.select"
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
          {/* Section filter */}
          <Select value={sectionFilter} onValueChange={handleSectionChange}>
            <SelectTrigger
              className="w-36 h-10 rounded-xl shadow-subtle"
              data-ocid="students.section.select"
            >
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {SECTION_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  Section {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Active filter indicator */}
          {activeFilters > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Filter className="w-3 h-3" /> {activeFilters} filter
              {activeFilters > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {/* Status pills */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pr-1">
            Status
          </span>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              data-ocid={`students.status.${s.toLowerCase()}.toggle`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary shadow-card"
                  : "bg-background/80 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground hover:bg-background"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Card ─────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        {/* Table header bar */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-gradient-to-r from-muted/40 via-muted/20 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-foreground text-sm">
              Student Records
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
          <Table data-ocid="students.table">
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/60">
                {[
                  "Enrollment No.",
                  "Full Name",
                  "Class",
                  "Section",
                  "Gender",
                  "Status",
                  "Actions",
                ].map((h, i) => (
                  <TableHead
                    key={h}
                    className={`text-[10px] uppercase tracking-widest font-bold text-muted-foreground py-3 ${i === 3 ? "hidden sm:table-cell" : ""} ${i === 4 ? "hidden md:table-cell" : ""} ${i === 6 ? "text-right pr-5" : ""}`}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [0, 1, 2, 3, 4].map((k) => (
                  <SkeletonRow key={`skel-${k}`} rowIdx={k} />
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div
                      className="text-center py-16 text-muted-foreground"
                      data-ocid="students.empty_state"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4 shadow-subtle"
                      >
                        <UserPlus className="w-8 h-8 opacity-40" />
                      </motion.div>
                      <p className="text-sm font-semibold font-display text-foreground">
                        No students found
                      </p>
                      <p className="text-xs mt-1 text-muted-foreground/70">
                        Try adjusting your search or filters
                      </p>
                      <Button
                        size="sm"
                        className="mt-4 rounded-xl gap-2 shadow-card"
                        onClick={() => setAddOpen(true)}
                        data-ocid="students.empty_state_add_button"
                      >
                        <PlusCircle className="w-4 h-4" /> Add First Student
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {students.map((s, i) => (
                    <motion.tr
                      key={s.studentId}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className={`group border-b border-border/40 transition-colors hover:bg-primary/4 ${i % 2 === 1 ? "bg-muted/10" : ""}`}
                      data-ocid={`students.item.${(page - 1) * PAGE_SIZE + i + 1}`}
                    >
                      {/* Enrollment No */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">
                          {s.enrollmentNo}
                        </span>
                      </td>
                      {/* Full Name + Avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-subtle font-display font-bold text-[11px] ${getAvatarColor(s.fullName)}`}
                          >
                            {getInitials(s.fullName)}
                          </div>
                          <span className="font-semibold text-foreground text-sm leading-tight">
                            {s.fullName}
                          </span>
                        </div>
                      </td>
                      {/* Class */}
                      <td className="px-4 py-3">
                        {s.classId ? (
                          <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg">
                            Class {s.classId}
                          </span>
                        ) : (
                          "–"
                        )}
                      </td>
                      {/* Section */}
                      <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">
                        {s.sectionId ? `Section ${s.sectionId}` : "–"}
                      </td>
                      {/* Gender */}
                      <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                        {s.gender === "M"
                          ? "Male"
                          : s.gender === "F"
                            ? "Female"
                            : (s.gender ?? "–")}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => setViewId(s.studentId)}
                            data-ocid={`students.view_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => setEditId(s.studentId)}
                            data-ocid={`students.edit_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              setDeleteTarget({
                                id: s.studentId,
                                name: s.fullName,
                              })
                            }
                            data-ocid={`students.delete_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
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
        <div className="px-5 py-3.5 border-t border-border/60 flex items-center justify-between bg-muted/10">
          <p className="text-xs text-muted-foreground">
            {total > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()} students`
              : "No students"}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg shadow-subtle"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              data-ocid="students.pagination_prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, k) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + k;
              return (
                <button
                  type="button"
                  key={p}
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
              data-ocid="students.pagination_next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Add Student Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={addOpen}
        onOpenChange={(v) => {
          if (!v) {
            setAddOpen(false);
            setForm(EMPTY_ADD_FORM);
            setParentInfoTab(0);
          } else setAddOpen(true);
        }}
      >
        <DialogContent
          className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-border/60"
          style={{ boxShadow: "var(--shadow-modal)" }}
          data-ocid="students.add.dialog"
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
                Add New Student
              </DialogTitle>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[72vh]">
            <div className="p-6 space-y-5">
              {/* Student Info Section */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Personal Information
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FloatInput
                      label="Full Name *"
                      value={form.name}
                      onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                      placeholder="e.g. Aiden Clarke"
                      ocid="students.add.name.input"
                    />
                  </div>
                  <FloatInput
                    label="Roll No."
                    value={form.rollNo}
                    onChange={(v) => setForm((f) => ({ ...f, rollNo: v }))}
                    placeholder="e.g. STU-001"
                    ocid="students.add.roll_no.input"
                  />
                  <FloatInput
                    label="Date of Birth"
                    type="date"
                    value={form.dob}
                    onChange={(v) => setForm((f) => ({ ...f, dob: v }))}
                    ocid="students.add.dob.input"
                  />
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      Class *
                    </p>
                    <Select
                      value={form.classId}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, classId: v }))
                      }
                    >
                      <SelectTrigger
                        className="h-12 rounded-xl"
                        data-ocid="students.add.class.select"
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
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      Section
                    </p>
                    <Select
                      value={form.sectionId}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, sectionId: v }))
                      }
                    >
                      <SelectTrigger
                        className="h-12 rounded-xl"
                        data-ocid="students.add.section.select"
                      >
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTION_OPTIONS.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            Section {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      Gender
                    </p>
                    <Select
                      value={form.gender}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, gender: v }))
                      }
                    >
                      <SelectTrigger
                        className="h-12 rounded-xl"
                        data-ocid="students.add.gender.select"
                      >
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="my-1" />

              {/* Parent Info */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Parent / Guardian Info
                </p>
                <div className="flex gap-1.5 mb-4">
                  {["Guardian"].map((tab, idx) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setParentInfoTab(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${parentInfoTab === idx ? "bg-primary text-primary-foreground shadow-card" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FloatInput
                      label="Parent / Guardian Name"
                      value={form.parentName}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, parentName: v }))
                      }
                      placeholder="e.g. Charles Clarke"
                      ocid="students.add.parent_name.input"
                    />
                  </div>
                  <FloatInput
                    label="Phone"
                    value={form.parentPhone}
                    onChange={(v) => setForm((f) => ({ ...f, parentPhone: v }))}
                    placeholder="+91 900 000 0000"
                    ocid="students.add.parent_phone.input"
                  />
                  <FloatInput
                    label="Email"
                    type="email"
                    value={form.parentEmail}
                    onChange={(v) => setForm((f) => ({ ...f, parentEmail: v }))}
                    placeholder="parent@email.com"
                    ocid="students.add.parent_email.input"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setForm(EMPTY_ADD_FORM);
              }}
              className="rounded-xl"
              data-ocid="students.add.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubmit}
              disabled={createMutation.isPending || !form.name.trim()}
              className="rounded-xl shadow-card btn-school-primary"
              data-ocid="students.add.submit_button"
            >
              {createMutation.isPending ? "Adding…" : "Add Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <ViewStudentDialog
        studentId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
      <EditStudentDialog
        studentId={editId}
        open={editId !== null}
        onClose={() => setEditId(null)}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent
          className="rounded-2xl"
          style={{ boxShadow: "var(--shadow-modal)" }}
          data-ocid="students.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Remove Student
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              data-ocid="students.delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={handleDeleteConfirm}
              data-ocid="students.delete.confirm_button"
            >
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
