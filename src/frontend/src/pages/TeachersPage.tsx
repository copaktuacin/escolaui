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
  type TeacherListItemDto,
  useCreateTeacher,
  useDeleteTeacher,
  useTeacherDetail,
  useTeachers,
  useUpdateTeacher,
} from "@/hooks/useQueries";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fmtDate(val?: string | null) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return val;
  }
}

// ─── Floating label input ─────────────────────────────────────────────────────

function FloatInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  ocid,
  required,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  ocid?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="relative group">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        data-ocid={ocid}
        disabled={disabled}
        className="peer w-full h-12 rounded-xl border border-input bg-background/70 px-3 pt-5 pb-1.5 text-sm text-foreground placeholder-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-subtle group-hover:border-border/80 disabled:opacity-50"
      />
      <label
        htmlFor={id}
        className="absolute left-3 top-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pointer-events-none transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-primary"
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
    </div>
  );
}

// ─── Password field (plain HTML — no component library) ───────────────────────

function PasswordInput({
  id,
  label,
  value,
  onChange,
  ocid,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  ocid?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative group">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        data-ocid={ocid}
        className="peer w-full h-12 rounded-xl border border-input bg-background/70 px-3 pt-5 pb-1.5 pr-16 text-sm text-foreground placeholder-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-subtle group-hover:border-border/80"
      />
      <label
        htmlFor={id}
        className="absolute left-3 top-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pointer-events-none transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-primary"
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-1"
        data-ocid={`${ocid ?? id}.toggle`}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

const COL_WIDTHS = ["w-20", "w-36", "w-32", "w-24", "w-20", "w-12"];

function SkeletonRow({ idx }: { idx: number }) {
  return (
    <TableRow data-ocid="teachers.loading_state">
      {COL_WIDTHS.map((w) => (
        <TableCell key={`sk-${idx}-${w}`} className="py-3">
          <div className={`h-5 rounded-lg bg-muted/60 animate-pulse ${w}`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── View dialog ──────────────────────────────────────────────────────────────

function ViewDialog({
  teacher,
  open,
  onClose,
}: {
  teacher: TeacherListItemDto | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: detail, isLoading } = useTeacherDetail(teacher?.teacherId ?? 0);
  const r = detail as
    | (typeof detail & { email?: string; phone?: string })
    | undefined;

  const fields = teacher
    ? [
        { label: "Employee Code", value: teacher.employeeCode || "—" },
        { label: "Email", value: r?.email ?? teacher.email ?? "—" },
        { label: "Phone", value: r?.phone ?? teacher.phone ?? "—" },
        { label: "Qualification", value: r?.qualification ?? "—" },
        { label: "Join Date", value: fmtDate(r?.joinDate ?? teacher.joinDate) },
        { label: "Status", value: r?.status ?? teacher.status },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-border/60"
        data-ocid="teachers.view.dialog"
      >
        <div className="px-6 pt-6 pb-4 border-b border-border/60 bg-gradient-to-r from-primary/8 to-transparent">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Teacher Profile
            </DialogTitle>
          </DialogHeader>
        </div>

        {isLoading && !teacher ? (
          <div
            className="p-6 space-y-3"
            data-ocid="teachers.view.loading_state"
          >
            {[1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : teacher ? (
          <ScrollArea className="max-h-[65vh]">
            <div className="p-6 space-y-5">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/6 to-transparent">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-display font-bold text-xl ${avatarColor(teacher.fullName)}`}
                >
                  {initials(teacher.fullName)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-foreground text-base leading-tight">
                    {teacher.fullName}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">
                    {teacher.employeeCode}
                  </p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2">
                {fields.map(({ label, value }) => (
                  <div
                    key={label}
                    className="p-3 rounded-xl bg-muted/40 border border-border/50"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {label}
                    </p>
                    <p className="font-medium text-foreground text-sm break-all">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div
            className="p-6 text-center text-muted-foreground text-sm"
            data-ocid="teachers.view.error_state"
          >
            No teacher data available.
          </div>
        )}

        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex justify-end">
          <Button
            type="button"
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

// ─── Add dialog ─────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateTeacherRequest = {
  FullName: "",
  Email: "",
  Phone: "",
  EmployeeCode: "",
  Password: "",
  JoinDate: "",
};

function AddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateTeacher();
  const [form, setForm] = useState<CreateTeacherRequest>({ ...EMPTY_FORM });

  function field(key: keyof CreateTeacherRequest) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  function handleClose() {
    setForm({ ...EMPTY_FORM });
    onClose();
  }

  function handleSubmit() {
    if (!form.FullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (!form.Email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!form.Phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    if (!form.EmployeeCode.trim()) {
      toast.error("Employee Code is required");
      return;
    }
    if (!form.Password) {
      toast.error("Password is required");
      return;
    }

    const payload: CreateTeacherRequest = {
      FullName: form.FullName.trim(),
      Email: form.Email.trim(),
      Phone: form.Phone.trim(),
      EmployeeCode: form.EmployeeCode.trim(),
      Password: form.Password,
    };
    if (form.JoinDate) payload.JoinDate = form.JoinDate;

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Teacher added successfully");
        handleClose();
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-border/60"
        data-ocid="teachers.add.dialog"
      >
        <div className="px-6 pt-6 pb-4 border-b border-border/60 bg-gradient-to-r from-primary/8 to-transparent">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Add New Teacher
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-4">
            <FloatInput
              id="add-fullname"
              label="Full Name"
              value={form.FullName}
              onChange={field("FullName")}
              ocid="teachers.add.full_name.input"
              required
            />
            <FloatInput
              id="add-email"
              label="Email"
              type="email"
              value={form.Email}
              onChange={field("Email")}
              ocid="teachers.add.email.input"
              required
            />
            <FloatInput
              id="add-phone"
              label="Phone"
              value={form.Phone}
              onChange={field("Phone")}
              ocid="teachers.add.phone.input"
              required
            />
            <FloatInput
              id="add-empcode"
              label="Employee Code"
              value={form.EmployeeCode}
              onChange={field("EmployeeCode")}
              ocid="teachers.add.employee_code.input"
              required
            />
            <FloatInput
              id="add-joindate"
              label="Join Date"
              type="date"
              value={form.JoinDate ?? ""}
              onChange={field("JoinDate")}
              ocid="teachers.add.join_date.input"
            />
            <PasswordInput
              id="add-password"
              label="Password"
              value={form.Password}
              onChange={field("Password")}
              ocid="teachers.add.password.input"
              required
            />
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="rounded-xl"
            data-ocid="teachers.add.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="rounded-xl"
            data-ocid="teachers.add.submit_button"
          >
            {createMutation.isPending ? "Adding…" : "Add Teacher"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Subject assignment types ────────────────────────────────────────────────

type TeacherSubjectAllocationDto = {
  teacherSubjectAllocationId: number;
  teacherId: number;
  teacherName?: string;
  subjectId: number;
  subjectName: string;
  subjectCode?: string;
  classId: number;
  className: string;
  isActive?: boolean;
  createTs?: string;
};

type SubjectDto = {
  subjectId: number;
  subjectName: string;
  subjectCode?: string;
};

type ClassDto = {
  classId: number;
  className: string;
  gradeLevel?: number;
  academicYearId?: number;
};

const BASE = "https://escola.doorstepgarage.in/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token =
    localStorage.getItem("authToken") ?? localStorage.getItem("token") ?? "";
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  // Unwrap { success, data: [...] } envelope
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
}

// ─── Subject Assignments section ──────────────────────────────────────────────

function SubjectAssignmentsSection({ teacherId }: { teacherId: number }) {
  const [assignments, setAssignments] = useState<TeacherSubjectAllocationDto[]>(
    [],
  );
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectDto[]>([]);

  const [selClassId, setSelClassId] = useState("");
  const [selSubjectId, setSelSubjectId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    try {
      const data = await apiFetch<TeacherSubjectAllocationDto[]>(
        `/teacher-subject-allocations?teacherId=${teacherId}`,
      );
      setAssignments(Array.isArray(data) ? data : []);
    } catch {
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  }, [teacherId]);

  // Load current academic year → classes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const years =
          await apiFetch<{ academicYearId: number; isCurrent: boolean }[]>(
            "/academic-years",
          );
        const arr = Array.isArray(years) ? years : [];
        const current = arr.find((y) => y.isCurrent) ?? arr[0];
        if (!current || cancelled) return;
        const cls = await apiFetch<ClassDto[]>(
          `/classes/academicYear/${current.academicYearId}`,
        );
        if (!cancelled) setClasses(Array.isArray(cls) ? cls : []);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load all subjects
  useEffect(() => {
    let cancelled = false;
    apiFetch<SubjectDto[]>("/subjects")
      .then((data) => {
        if (!cancelled) setSubjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        /* silent */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load assignments on mount
  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // When class changes, load filtered subjects for that class
  useEffect(() => {
    if (!selClassId) {
      setFilteredSubjects(subjects);
      setSelSubjectId("");
      return;
    }
    setSelSubjectId("");
    let cancelled = false;
    (async () => {
      try {
        const allocs = await apiFetch<{ subjectId: number }[]>(
          `/subject-allocations?classId=${selClassId}`,
        );
        const arr = Array.isArray(allocs) ? allocs : [];
        const ids = new Set(arr.map((a) => a.subjectId));
        const filtered = subjects.filter((s) => ids.has(s.subjectId));
        if (!cancelled)
          setFilteredSubjects(filtered.length > 0 ? filtered : subjects);
      } catch {
        if (!cancelled) setFilteredSubjects(subjects);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selClassId, subjects]);

  async function handleAdd() {
    if (!selClassId || !selSubjectId) {
      toast.error("Please select both a class and a subject");
      return;
    }
    setAdding(true);
    try {
      const token =
        localStorage.getItem("authToken") ??
        localStorage.getItem("token") ??
        "";
      const res = await fetch(`${BASE}/teacher-subject-allocations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          teacherId,
          subjectId: Number(selSubjectId),
          classId: Number(selClassId),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Subject assignment added");
      setSelClassId("");
      setSelSubjectId("");
      await loadAssignments();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add assignment");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(allocationId: number) {
    setRemovingId(allocationId);
    try {
      const token =
        localStorage.getItem("authToken") ??
        localStorage.getItem("token") ??
        "";
      const res = await fetch(
        `${BASE}/teacher-subject-allocations/${allocationId}`,
        {
          method: "DELETE",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Assignment removed");
      await loadAssignments();
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to remove assignment",
      );
    } finally {
      setRemovingId(null);
    }
  }

  const displaySubjects = selClassId ? filteredSubjects : subjects;

  return (
    <div className="border border-border/60 rounded-2xl overflow-hidden">
      {/* Section header */}
      <div className="px-4 py-3 bg-gradient-to-r from-primary/8 to-transparent border-b border-border/60 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-primary flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <h4 className="text-sm font-semibold font-display text-foreground">
          Subject Assignments
        </h4>
        {loadingAssignments && (
          <span className="ml-auto text-[10px] text-muted-foreground animate-pulse">
            Loading…
          </span>
        )}
      </div>

      {/* Assignment table */}
      <div className="overflow-x-auto">
        {assignments.length === 0 && !loadingAssignments ? (
          <div
            className="py-8 text-center"
            data-ocid="teachers.edit.assignments.empty_state"
          >
            <p className="text-sm text-muted-foreground">
              No subject assignments yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Use the form below to add assignments.
            </p>
          </div>
        ) : (
          <table
            className="w-full text-sm"
            data-ocid="teachers.edit.assignments.table"
          >
            <thead>
              <tr className="bg-muted/20 border-b border-border/50">
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-2.5">
                  Class
                </th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-2.5">
                  Subject
                </th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-2.5 hidden sm:table-cell">
                  Code
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, idx) => (
                <tr
                  key={a.teacherSubjectAllocationId}
                  className={`border-b border-border/30 ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
                  data-ocid={`teachers.edit.assignments.item.${idx + 1}`}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground text-sm">
                    {a.className}
                  </td>
                  <td className="px-4 py-2.5 text-foreground text-sm">
                    {a.subjectName}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs hidden sm:table-cell">
                    {a.subjectCode ? (
                      <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">
                        {a.subjectCode}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(a.teacherSubjectAllocationId)}
                      disabled={removingId === a.teacherSubjectAllocationId}
                      className="text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-destructive/10"
                      data-ocid={`teachers.edit.assignments.delete_button.${idx + 1}`}
                    >
                      {removingId === a.teacherSubjectAllocationId
                        ? "Removing…"
                        : "Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add assignment row */}
      <div
        className="px-4 py-3.5 border-t border-border/60 bg-muted/10 space-y-3"
        data-ocid="teachers.edit.assignments.add_row"
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Add Assignment
        </p>
        <div className="flex flex-wrap gap-2">
          {/* Class dropdown */}
          <select
            value={selClassId}
            onChange={(e) => setSelClassId(e.target.value)}
            className="flex-1 min-w-[130px] h-9 rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            data-ocid="teachers.edit.assignments.class.select"
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.classId} value={String(c.classId)}>
                {c.className}
              </option>
            ))}
          </select>

          {/* Subject dropdown */}
          <select
            value={selSubjectId}
            onChange={(e) => setSelSubjectId(e.target.value)}
            className="flex-1 min-w-[130px] h-9 rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            data-ocid="teachers.edit.assignments.subject.select"
          >
            <option value="">Select subject…</option>
            {displaySubjects.map((s) => (
              <option key={s.subjectId} value={String(s.subjectId)}>
                {s.subjectName}
                {s.subjectCode ? ` (${s.subjectCode})` : ""}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !selClassId || !selSubjectId}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-ocid="teachers.edit.assignments.add_button"
          >
            {adding ? "Adding…" : "+ Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit dialog ───────────────────────────────────────────────────────────────

type EditForm = {
  FullName: string;
  Email: string;
  Phone: string;
  EmployeeCode: string;
  JoinDate: string;
  Password: string;
};

function EditDialog({
  teacher,
  open,
  onClose,
}: {
  teacher: TeacherListItemDto | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: detail } = useTeacherDetail(teacher?.teacherId ?? 0);
  const updateMutation = useUpdateTeacher();
  const populated = useRef(false);

  const [form, setForm] = useState<EditForm>({
    FullName: "",
    Email: "",
    Phone: "",
    EmployeeCode: "",
    JoinDate: "",
    Password: "",
  });

  // Populate immediately from the list item when dialog opens
  useEffect(() => {
    if (!teacher || !open || populated.current) return;
    populated.current = true;
    setForm({
      FullName: teacher.fullName ?? "",
      Email: teacher.email ?? "",
      Phone: teacher.phone ?? "",
      EmployeeCode: teacher.employeeCode ?? "",
      JoinDate: (teacher.joinDate ?? "").slice(0, 10),
      Password: "",
    });
  }, [teacher, open]);

  // Refine with detail data (email/phone from detail if available)
  useEffect(() => {
    if (!detail) return;
    const r = detail as typeof detail & { email?: string; phone?: string };
    setForm((prev) => ({
      ...prev,
      Email: r.email ?? prev.Email,
      Phone: r.phone ?? prev.Phone,
      EmployeeCode: r.employeeCode ?? prev.EmployeeCode,
      JoinDate: r.joinDate ? r.joinDate.slice(0, 10) : prev.JoinDate,
    }));
  }, [detail]);

  function handleClose() {
    populated.current = false;
    setForm({
      FullName: "",
      Email: "",
      Phone: "",
      EmployeeCode: "",
      JoinDate: "",
      Password: "",
    });
    onClose();
  }

  function field(key: keyof EditForm) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  function handleSave() {
    if (!teacher) return;
    if (!form.FullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (!form.Email.trim()) {
      toast.error("Email is required");
      return;
    }

    const body: Record<string, string> = {
      FullName: form.FullName.trim(),
      Email: form.Email.trim(),
      Phone: form.Phone.trim(),
      EmployeeCode: form.EmployeeCode.trim(),
    };
    if (form.JoinDate) body.JoinDate = form.JoinDate;
    // Only include Password if user actually typed one
    if (form.Password.trim()) body.Password = form.Password;

    updateMutation.mutate(
      { id: teacher.teacherId, body },
      {
        onSuccess: () => {
          toast.success("Teacher updated successfully");
          handleClose();
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="sm:max-w-xl rounded-2xl p-0 overflow-hidden border border-border/60"
        data-ocid="teachers.edit.dialog"
      >
        <div className="px-6 pt-6 pb-4 border-b border-border/60 bg-gradient-to-r from-primary/8 to-transparent">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Edit Teacher
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[72vh]">
          <div className="p-6 space-y-5">
            {/* Teacher details */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Teacher Details
              </p>
              <FloatInput
                id="edit-fullname"
                label="Full Name"
                value={form.FullName}
                onChange={field("FullName")}
                ocid="teachers.edit.full_name.input"
                required
              />
              <FloatInput
                id="edit-email"
                label="Email"
                type="email"
                value={form.Email}
                onChange={field("Email")}
                ocid="teachers.edit.email.input"
                required
              />
              <FloatInput
                id="edit-phone"
                label="Phone"
                value={form.Phone}
                onChange={field("Phone")}
                ocid="teachers.edit.phone.input"
              />
              <FloatInput
                id="edit-empcode"
                label="Employee Code"
                value={form.EmployeeCode}
                onChange={field("EmployeeCode")}
                ocid="teachers.edit.employee_code.input"
              />
              <FloatInput
                id="edit-joindate"
                label="Join Date"
                type="date"
                value={form.JoinDate}
                onChange={field("JoinDate")}
                ocid="teachers.edit.join_date.input"
              />
              <PasswordInput
                id="edit-password"
                label="New Password (leave blank to keep current)"
                value={form.Password}
                onChange={field("Password")}
                ocid="teachers.edit.password.input"
              />
            </div>

            {/* Subject assignments */}
            {teacher && (
              <SubjectAssignmentsSection teacherId={teacher.teacherId} />
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="rounded-xl"
            data-ocid="teachers.edit.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-xl"
            data-ocid="teachers.edit.save_button"
          >
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [viewTeacher, setViewTeacher] = useState<TeacherListItemDto | null>(
    null,
  );
  const [editTeacher, setEditTeacher] = useState<TeacherListItemDto | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<TeacherListItemDto | null>(
    null,
  );

  const { data, isLoading } = useTeachers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
  const deleteMutation = useDeleteTeacher();

  const teachers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.teacherId, {
      onSuccess: () => {
        toast.success(`${deleteTarget.fullName} deleted`);
        setDeleteTarget(null);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              Teachers
            </h1>
            {total > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {total.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage teacher profiles, assignments, and contact details
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-2 h-9 rounded-xl"
          onClick={() => setAddOpen(true)}
          data-ocid="teachers.add.open_modal_button"
        >
          + Add Teacher
        </Button>
      </div>

      {/* Search */}
      <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-subtle">
        <div className="relative max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, email or employee code…"
            className="w-full pl-9 pr-3 h-10 rounded-xl border border-input bg-background/70 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            data-ocid="teachers.search.search_input"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-gradient-to-r from-muted/40 via-muted/20 to-transparent">
          <h2 className="font-display font-semibold text-foreground text-sm">
            Teacher Records
            <span className="ml-2 text-muted-foreground font-normal text-xs">
              ({total})
            </span>
          </h2>
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
                  "Email",
                  "Phone",
                  "Join Date",
                  "Actions",
                ].map((h, i) => (
                  <TableHead
                    key={h}
                    className={`text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3 ${
                      i === 2 ? "hidden md:table-cell" : ""
                    } ${i === 3 ? "hidden lg:table-cell" : ""} ${
                      i === 4 ? "hidden sm:table-cell" : ""
                    } ${i === 5 ? "text-right pr-5" : ""}`}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [0, 1, 2, 3, 4].map((k) => <SkeletonRow key={k} idx={k} />)
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div
                      className="text-center py-16 text-muted-foreground"
                      data-ocid="teachers.empty_state"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 opacity-40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
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
                teachers.map((t, i) => (
                  <TableRow
                    key={t.teacherId}
                    className={`border-b border-border/40 transition-colors hover:bg-primary/4 group ${
                      i % 2 === 1 ? "bg-muted/10" : ""
                    }`}
                    data-ocid={`teachers.item.${(page - 1) * PAGE_SIZE + i + 1}`}
                  >
                    {/* Employee Code */}
                    <TableCell className="px-4 py-3">
                      <span className="font-mono text-[11px] bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md border border-border/40">
                        {t.employeeCode || "—"}
                      </span>
                    </TableCell>

                    {/* Full Name + avatar */}
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-bold text-xs ${avatarColor(t.fullName)}`}
                        >
                          {initials(t.fullName)}
                        </div>
                        <span className="font-semibold text-foreground text-sm leading-tight">
                          {t.fullName}
                        </span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground max-w-[180px]">
                      <span className="truncate block">{t.email || "—"}</span>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="hidden lg:table-cell px-4 py-3 text-sm text-muted-foreground">
                      {t.phone || "—"}
                    </TableCell>

                    {/* Join Date */}
                    <TableCell className="hidden sm:table-cell px-4 py-3 text-xs text-muted-foreground">
                      {fmtDate(t.joinDate)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                        {/* View */}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                          onClick={() => setViewTeacher(t)}
                          data-ocid={`teachers.view_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                          aria-label="View teacher"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Button>

                        {/* Edit */}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                          onClick={() => setEditTeacher(t)}
                          data-ocid={`teachers.edit_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                          aria-label="Edit teacher"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Button>

                        {/* Delete */}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(t)}
                          data-ocid={`teachers.delete_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                          aria-label="Delete teacher"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
              type="button"
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              data-ocid="teachers.pagination_prev"
            >
              &#8249;
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, k) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + k;
              return (
                <button
                  key={`pg-${p}`}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-8 min-w-[2rem] px-2 rounded-lg text-xs font-semibold transition-all ${
                    p === page
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              data-ocid="teachers.pagination_next"
            >
              &#8250;
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddDialog open={addOpen} onClose={() => setAddOpen(false)} />

      <ViewDialog
        teacher={viewTeacher}
        open={viewTeacher !== null}
        onClose={() => setViewTeacher(null)}
      />

      <EditDialog
        teacher={editTeacher}
        open={editTeacher !== null}
        onClose={() => setEditTeacher(null)}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent
          className="rounded-2xl"
          data-ocid="teachers.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Teacher
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>{deleteTarget?.fullName}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              data-ocid="teachers.delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={handleDeleteConfirm}
              data-ocid="teachers.delete.confirm_button"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
