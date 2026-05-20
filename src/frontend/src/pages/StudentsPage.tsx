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
  useAcademicYears,
  useClasses,
  useCreateStudent,
  useDeleteStudent,
  useStudents,
  useUpdateStudent,
} from "@/hooks/useQueries";
import type {
  ClassDto,
  CreateStudentRequest,
  SectionDto,
} from "@/hooks/useQueries";
import { getAcademicYearId, isCurrentYear } from "@/hooks/useQueries";
import { api } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Robust list extractor — handles ALL .NET envelope shapes ────────────────

function extractList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const keys = [
      "data",
      "Data",
      "items",
      "Items",
      "sections",
      "Sections",
      "value",
      "Value",
      "results",
      "Results",
      "list",
      "List",
      "records",
      "Records",
    ];
    for (const k of keys) {
      const v = (raw as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as T[];
    }
    const vals = Object.values(raw as object);
    if (vals.length === 1 && Array.isArray(vals[0])) return vals[0] as T[];
  }
  return [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClassId(c: ClassDto): number {
  // classId is the primary key returned by /classes/academicYear/{id}
  return c.classId ?? c.ClassId ?? c.Id ?? c.id ?? 0;
}
function getClassName(c: ClassDto): string {
  return c.className ?? c.ClassName ?? String(getClassId(c));
}
function getSectionName(s: SectionDto): string {
  return s.SectionName ?? s.sectionName ?? "";
}

const SELECT_CLASS =
  "w-full h-10 px-3 rounded-xl border border-input bg-background/70 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

// ─── Add Student Form ──────────────────────────────────────────────────────────

type AddFormState = {
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  RollNumber: string;
  Section: string;
};

const EMPTY_FORM: AddFormState = {
  FirstName: "",
  LastName: "",
  DateOfBirth: "",
  RollNumber: "",
  Section: "",
};

function AddStudentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  // CONTROLLED class dropdown — state is the sole source of truth
  const [selectedClassId, setSelectedClassId] = useState("");
  // CONTROLLED section dropdown — value from state
  const [selectedSection, setSelectedSection] = useState("");

  // Self-loaded classes state
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [classesStatus, setClassesStatus] = useState<
    "idle" | "loading" | "no-year" | "error" | "done"
  >("idle");
  const [classesMessage, setClassesMessage] = useState("");

  const [sections, setSections] = useState<SectionDto[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const createMutation = useCreateStudent();

  // ── Step 1: On mount (and whenever dialog opens) → fetch academic years → current year → classes ──
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setClassesStatus("loading");
    setClassesMessage("");
    setClasses([]);

    (async () => {
      try {
        // Fetch academic years
        const yearsRes = await api.get<unknown>("/academic-years");
        console.log("[AddStudent] raw academic years response:", yearsRes);

        if (!yearsRes.success) {
          if (!cancelled) {
            setClassesStatus("error");
            setClassesMessage(
              `Failed to load academic years: ${yearsRes.error ?? "unknown"}`,
            );
          }
          return;
        }

        const yearsArr = extractList<Record<string, unknown>>(yearsRes.data);
        console.log("[AddStudent] academic years array:", yearsArr);

        if (yearsArr.length === 0) {
          if (!cancelled) {
            setClassesStatus("no-year");
            setClassesMessage(
              "No academic years found — run School Setup first",
            );
          }
          return;
        }

        // Find current year (case-insensitive)
        const currentYear =
          yearsArr.find((y) => {
            const r = y as Record<string, unknown>;
            return (
              r.IsCurrent === true ||
              r.isCurrent === true ||
              r.is_current === true ||
              r.IS_CURRENT === true
            );
          }) ?? yearsArr[0];

        console.log("[AddStudent] resolved current year:", currentYear);

        const _cy = currentYear as Record<string, unknown>;
        const yearId =
          (_cy.academicYearId as number | undefined) ??
          (_cy.AcademicYearId as number | undefined) ??
          (_cy.Id as number | undefined) ??
          (_cy.id as number | undefined) ??
          (_cy.yearId as number | undefined) ??
          (_cy.YearId as number | undefined);

        console.log("[AddStudent] resolved year ID:", yearId);

        if (!yearId) {
          if (!cancelled) {
            setClassesStatus("no-year");
            setClassesMessage(
              "No current academic year found — run School Setup first",
            );
          }
          return;
        }

        // Fetch classes for current academic year
        const classesRes = await api.get<unknown>(
          `/classes/academicYear/${yearId}`,
        );
        console.log("[AddStudent] raw classes response:", classesRes);

        if (!classesRes.success) {
          if (!cancelled) {
            setClassesStatus("error");
            setClassesMessage(
              `Failed to load classes: ${classesRes.error ?? "unknown"}`,
            );
          }
          return;
        }

        const classesArr = extractList<ClassDto>(classesRes.data);
        console.log("[AddStudent] resolved classes array:", classesArr);

        if (!cancelled) {
          setClasses(classesArr);
          setClassesStatus("done");
          if (classesArr.length === 0) {
            setClassesMessage(
              "No classes for current year — add classes in School Setup",
            );
          }
        }
      } catch (err) {
        console.error("[AddStudent] class-loading error:", err);
        if (!cancelled) {
          setClassesStatus("error");
          setClassesMessage(
            err instanceof Error
              ? err.message
              : "Unexpected error loading classes",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setSections([]);
      setSelectedSection("");
      setSelectedClassId("");
    }
  }, [open]);

  // ── Step 2: Fetch sections whenever selectedClassId changes ──
  useEffect(() => {
    if (!selectedClassId || Number(selectedClassId) <= 0) {
      setSections([]);
      setSelectedSection("");
      setSectionsLoading(false);
      return;
    }
    let cancelled = false;
    setSections([]);
    setSelectedSection("");
    setSectionsLoading(true);
    api
      .get<unknown>(`/sections/Class/${Number(selectedClassId)}`)
      .then((res) => {
        console.log(
          `[AddStudent] raw sections response (classId=${selectedClassId}):`,
          res,
        );
        if (!cancelled) {
          setSections(extractList<SectionDto>(res.data));
        }
      })
      .catch((err) => {
        console.error("[AddStudent] sections fetch error:", err);
        if (!cancelled) setSections([]);
      })
      .finally(() => {
        if (!cancelled) setSectionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClassId]);

  function handleSubmit() {
    if (!form.FirstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!form.LastName.trim()) {
      toast.error("Last name is required");
      return;
    }
    const classIdNum = Number.parseInt(selectedClassId, 10);
    if (!selectedClassId || Number.isNaN(classIdNum) || classIdNum === 0) {
      toast.error("Please select a class");
      return;
    }
    const payload: CreateStudentRequest = {
      FirstName: form.FirstName.trim(),
      LastName: form.LastName.trim(),
      DateOfBirth: form.DateOfBirth,
      ClassId: classIdNum,
      Section: selectedSection,
      RollNumber: form.RollNumber.trim(),
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Student added successfully");
        onClose();
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  // Derive class dropdown label
  const classDropdownLabel = (() => {
    if (classesStatus === "loading") return "Loading classes…";
    if (classesStatus === "no-year" || classesStatus === "error")
      return classesMessage || "Setup required";
    if (classesStatus === "done" && classes.length === 0)
      return classesMessage || "No classes found";
    return "— Select a Class —";
  })();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-border/60"
        data-ocid="students.add.dialog"
      >
        <div className="px-6 pt-6 pb-4 border-b border-border/60 bg-gradient-to-r from-primary/8 to-transparent">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Add New Student
            </DialogTitle>
          </DialogHeader>
        </div>

        {(classesStatus === "no-year" || classesStatus === "error") && (
          <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
            ⚠️ {classesMessage}
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="add-first-name"
              >
                First Name *
              </label>
              <input
                type="text"
                value={form.FirstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, FirstName: e.target.value }))
                }
                placeholder="First name"
                className={SELECT_CLASS}
                data-ocid="students.add.first_name.input"
                id="add-first-name"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="add-last-name"
              >
                Last Name *
              </label>
              <input
                type="text"
                value={form.LastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, LastName: e.target.value }))
                }
                placeholder="Last name"
                className={SELECT_CLASS}
                data-ocid="students.add.last_name.input"
                id="add-last-name"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="add-dob"
              >
                Date of Birth
              </label>
              <input
                type="date"
                value={form.DateOfBirth}
                onChange={(e) =>
                  setForm((f) => ({ ...f, DateOfBirth: e.target.value }))
                }
                className={SELECT_CLASS}
                data-ocid="students.add.dob.input"
                id="add-dob"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="add-roll"
              >
                Roll Number
              </label>
              <input
                type="text"
                value={form.RollNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, RollNumber: e.target.value }))
                }
                placeholder="e.g. 001"
                className={SELECT_CLASS}
                data-ocid="students.add.roll_number.input"
                id="add-roll"
              />
            </div>
            {/* CONTROLLED class dropdown — self-loaded, value drives DOM */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="add-class"
              >
                Class *
              </label>
              <select
                id="add-class"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className={SELECT_CLASS}
                data-ocid="students.add.class.select"
              >
                {classesStatus === "loading" ? (
                  <option value="">Loading classes…</option>
                ) : classes.length === 0 ? (
                  <option value="">{classDropdownLabel}</option>
                ) : (
                  <>
                    <option value="">— Select a Class —</option>
                    {classes.map((c) => (
                      <option key={getClassId(c)} value={String(getClassId(c))}>
                        {getClassName(c)}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            {/* CONTROLLED section dropdown — populated via extractList after class selection */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="add-section"
              >
                Section
              </label>
              <select
                id="add-section"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className={SELECT_CLASS}
                data-ocid="students.add.section.select"
              >
                {sectionsLoading ? (
                  <option value="">Loading sections…</option>
                ) : !selectedClassId ? (
                  <option value="">Select class first</option>
                ) : sections.length === 0 ? (
                  <option value="">No sections found</option>
                ) : (
                  <>
                    <option value="">— Select Section —</option>
                    {sections.map((s) => {
                      const name = getSectionName(s);
                      return (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
            data-ocid="students.add.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createMutation.isPending ||
              !form.FirstName.trim() ||
              !form.LastName.trim()
            }
            className="rounded-xl shadow-card"
            data-ocid="students.add.submit_button"
          >
            {createMutation.isPending ? "Adding…" : "Add Student"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Student Dialog ──────────────────────────────────────────────────────

type EditFormState = {
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  RollNumber: string;
  ClassId: string;
  Section: string;
};

function EditStudentDialog({
  studentId,
  initialData,
  open,
  onClose,
  classes,
}: {
  studentId: number;
  initialData: {
    FirstName?: string;
    LastName?: string;
    DateOfBirth?: string;
    RollNumber?: string;
    ClassId?: number;
    Section?: string;
  };
  open: boolean;
  onClose: () => void;
  classes: ClassDto[];
}) {
  const updateMutation = useUpdateStudent();
  // CONTROLLED state for class and section — no refs
  const [selectedClassId, setSelectedClassId] = useState(
    initialData.ClassId ? String(initialData.ClassId) : "",
  );
  const [selectedSection, setSelectedSection] = useState(
    initialData.Section ?? "",
  );
  const [form, setForm] = useState<EditFormState>({
    FirstName: initialData.FirstName ?? "",
    LastName: initialData.LastName ?? "",
    DateOfBirth: initialData.DateOfBirth ?? "",
    RollNumber: initialData.RollNumber ?? "",
    ClassId: initialData.ClassId ? String(initialData.ClassId) : "",
    Section: initialData.Section ?? "",
  });
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Fetch sections for a class id string
  const fetchSections = useCallback(async (classId: string) => {
    const id = Number(classId);
    if (!classId || id <= 0) {
      setSections([]);
      setSectionsLoading(false);
      return;
    }
    setSectionsLoading(true);
    try {
      const res = await api.get<unknown>(`/sections/Class/${id}`);
      console.log("[EditStudent] sections raw:", res.data);
      if (res.success) {
        setSections(extractList<SectionDto>(res.data));
      } else {
        setSections([]);
      }
    } catch {
      setSections([]);
    } finally {
      setSectionsLoading(false);
    }
  }, []);

  // Load sections when class changes (including initial pre-fill)
  useEffect(() => {
    if (selectedClassId) {
      void fetchSections(selectedClassId);
    } else {
      setSections([]);
      setSectionsLoading(false);
    }
  }, [selectedClassId, fetchSections]);

  function handleSave() {
    if (!form.FirstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!form.LastName.trim()) {
      toast.error("Last name is required");
      return;
    }
    updateMutation.mutate(
      {
        id: studentId,
        payload: {
          name: `${form.FirstName.trim()} ${form.LastName.trim()}`,
          dob: form.DateOfBirth,
          rollNo: form.RollNumber.trim(),
          classId: selectedClassId ? Number(selectedClassId) : undefined,
          sectionId: selectedSection || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Student updated");
          onClose();
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-border/60"
        data-ocid="students.edit.dialog"
      >
        <div className="px-6 pt-6 pb-4 border-b border-border/60 bg-gradient-to-r from-primary/8 to-transparent">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Edit Student
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="edit-first-name"
              >
                First Name *
              </label>
              <input
                type="text"
                value={form.FirstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, FirstName: e.target.value }))
                }
                className={SELECT_CLASS}
                data-ocid="students.edit.first_name.input"
                id="edit-first-name"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="edit-last-name"
              >
                Last Name *
              </label>
              <input
                type="text"
                value={form.LastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, LastName: e.target.value }))
                }
                className={SELECT_CLASS}
                data-ocid="students.edit.last_name.input"
                id="edit-last-name"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="edit-dob"
              >
                Date of Birth
              </label>
              <input
                type="date"
                value={form.DateOfBirth}
                onChange={(e) =>
                  setForm((f) => ({ ...f, DateOfBirth: e.target.value }))
                }
                className={SELECT_CLASS}
                data-ocid="students.edit.dob.input"
                id="edit-dob"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="edit-roll"
              >
                Roll Number
              </label>
              <input
                type="text"
                value={form.RollNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, RollNumber: e.target.value }))
                }
                className={SELECT_CLASS}
                data-ocid="students.edit.roll_number.input"
                id="edit-roll"
              />
            </div>
            {/* CONTROLLED class dropdown — value={selectedClassId}, onChange sets state */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="edit-class"
              >
                Class
              </label>
              <select
                id="edit-class"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSection("");
                }}
                className={SELECT_CLASS}
                data-ocid="students.edit.class.select"
              >
                <option value="">-- Select Class --</option>
                {classes.map((c) => (
                  <option key={getClassId(c)} value={String(getClassId(c))}>
                    {getClassName(c)}
                  </option>
                ))}
              </select>
            </div>
            {/* CONTROLLED section dropdown — populated by extractList after class selection */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="edit-section"
              >
                Section
              </label>
              <select
                id="edit-section"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className={SELECT_CLASS}
                data-ocid="students.edit.section.select"
              >
                <option value="">
                  {sectionsLoading
                    ? "Loading…"
                    : !selectedClassId
                      ? "Select class first"
                      : sections.length === 0
                        ? "No sections found"
                        : "-- Select Section --"}
                </option>
                {sections.map((s) => {
                  const name = getSectionName(s);
                  return (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
            data-ocid="students.edit.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-xl shadow-card"
            data-ocid="students.edit.save_button"
          >
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [classFilterId, setClassFilterId] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    id: number;
    data: {
      FirstName?: string;
      LastName?: string;
      DateOfBirth?: string;
      RollNumber?: string;
      ClassId?: number;
      Section?: string;
    };
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Filter toolbar section list (loaded from API when class filter changes)
  const [filterSections, setFilterSections] = useState<SectionDto[]>([]);
  // UNCONTROLLED filter class select ref
  const filterClassRef = useRef<HTMLSelectElement>(null);
  const filterSectionRef = useRef<HTMLSelectElement>(null);

  // Classes and students from hooks — filtered to current academic year
  const { data: academicYears = [], isLoading: yearsLoading } =
    useAcademicYears();
  const currentYearId = useMemo((): number | undefined => {
    if (academicYears.length === 0) return undefined;
    // API returns academicYearId (camelCase) — use helper that checks all variants
    const current = academicYears.find(isCurrentYear);
    if (current) {
      const id = getAcademicYearId(current);
      if (id > 0) return id;
    }
    const first = academicYears[0];
    const firstId = first ? getAcademicYearId(first) : 0;
    return firstId > 0 ? firstId : undefined;
  }, [academicYears]);
  const { data: classesData, isLoading: classesLoading } =
    useClasses(currentYearId);
  const classes = classesData ?? [];
  // Combined loading: still fetching if years or classes are in flight
  const _classesLoadingCombined =
    yearsLoading || (!!currentYearId && classesLoading);

  const { data: studentsData, isLoading } = useStudents({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    classId: classFilterId || undefined,
    section: sectionFilter || undefined,
  });

  const students = studentsData?.data ?? [];
  const total = studentsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const deleteMutation = useDeleteStudent();

  // Load filter sections when classFilterId changes
  useEffect(() => {
    if (!classFilterId) {
      setFilterSections([]);
      return;
    }
    (async () => {
      try {
        const { api } = await import("@/lib/api");
        const res = await api.get<unknown>(`/sections/Class/${classFilterId}`);
        if (res.success && res.data) {
          const raw = res.data;
          const arr = Array.isArray(raw)
            ? raw
            : ((Object.values(raw as Record<string, unknown>).find(
                Array.isArray,
              ) as SectionDto[]) ?? []);
          setFilterSections(arr as SectionDto[]);
        } else setFilterSections([]);
      } catch {
        setFilterSections([]);
      }
    })();
  }, [classFilterId]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
              Students
            </h1>
            {total > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {total.toLocaleString()}
              </span>
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
              className="gap-2 rounded-xl h-9"
              data-ocid="students.bulk_import.button"
            >
              <Upload className="w-4 h-4" /> Bulk Import
            </Button>
          </Link>
          <Button
            size="sm"
            className="gap-2 rounded-xl h-9 shadow-card"
            onClick={() => setAddOpen(true)}
            data-ocid="students.add.open_modal_button"
          >
            <PlusCircle className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-subtle flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name…"
            className="w-full pl-9 pr-3 h-10 rounded-xl border border-input bg-background/70 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            data-ocid="students.search.search_input"
          />
        </div>
        {/* UNCONTROLLED class filter */}
        <select
          ref={filterClassRef}
          defaultValue=""
          onChange={(e) => {
            setClassFilterId(e.target.value);
            setSectionFilter("");
            setPage(1);
            if (filterSectionRef.current) filterSectionRef.current.value = "";
          }}
          className="h-10 px-3 rounded-xl border border-input bg-background/70 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-w-[140px]"
          data-ocid="students.class.select"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={getClassId(c)} value={String(getClassId(c))}>
              {getClassName(c)}
            </option>
          ))}
        </select>
        {/* UNCONTROLLED section filter */}
        <select
          ref={filterSectionRef}
          defaultValue=""
          onChange={(e) => {
            setSectionFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 rounded-xl border border-input bg-background/70 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-w-[140px] disabled:opacity-50"
          data-ocid="students.section.select"
        >
          <option value="">All Sections</option>
          {filterSections.map((s) => {
            const name = getSectionName(s);
            return (
              <option key={name} value={name}>
                {name}
              </option>
            );
          })}
        </select>
        {(classFilterId || sectionFilter || search) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setClassFilterId("");
              setSectionFilter("");
              setPage(1);
              if (filterClassRef.current) filterClassRef.current.value = "";
              if (filterSectionRef.current) filterSectionRef.current.value = "";
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            data-ocid="students.clear_filters.button"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/20">
          <h2 className="font-display font-semibold text-foreground text-sm">
            Student Records
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
          <Table data-ocid="students.table">
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/60">
                {["Roll No.", "Full Name", "Class", "Section", "Actions"].map(
                  (h, i) => (
                    <TableHead
                      key={h}
                      className={`text-[10px] uppercase tracking-widest font-bold text-muted-foreground py-3 ${
                        i === 4 ? "text-right pr-5" : ""
                      }`}
                    >
                      {h}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [0, 1, 2, 3, 4].map((k) => (
                  <TableRow
                    key={`skel-${k}`}
                    data-ocid="students.loading_state"
                  >
                    {["w-20", "w-36", "w-16", "w-16", "w-20"].map((w) => (
                      <TableCell key={`sk-${k}-${w}`} className="py-3">
                        <Skeleton className={`h-5 rounded-lg ${w}`} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div
                      className="text-center py-16"
                      data-ocid="students.empty_state"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-semibold font-display text-foreground">
                        No students found
                      </p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        {search || classFilterId
                          ? "Try adjusting your search or filters"
                          : "Add your first student to get started"}
                      </p>
                      {!search && !classFilterId && (
                        <Button
                          size="sm"
                          className="mt-4 rounded-xl gap-2 shadow-card"
                          onClick={() => setAddOpen(true)}
                          data-ocid="students.empty_state_add_button"
                        >
                          <PlusCircle className="w-4 h-4" /> Add First Student
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s, i) => (
                  <TableRow
                    key={s.studentId}
                    className={`group border-b border-border/40 hover:bg-primary/4 transition-colors ${
                      i % 2 === 1 ? "bg-muted/10" : ""
                    }`}
                    data-ocid={`students.item.${(page - 1) * PAGE_SIZE + i + 1}`}
                  >
                    <TableCell className="px-4 py-3">
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">
                        {s.enrollmentNo || s.studentId}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-foreground text-sm">
                      {s.fullName}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {s.classId ? (
                        <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg">
                          {/* Try to show class name from loaded classes list */}
                          {getClassName(
                            classes.find((c) => getClassId(c) === s.classId) ??
                              ({
                                Id: s.classId,
                                ClassName: `Class ${s.classId}`,
                              } as ClassDto),
                          )}
                        </span>
                      ) : (
                        "–"
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                      {s.sectionId || "–"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                          onClick={() =>
                            setEditTarget({
                              id: s.studentId,
                              data: {
                                FirstName: s.fullName.split(" ")[0] ?? "",
                                LastName:
                                  s.fullName.split(" ").slice(1).join(" ") ??
                                  "",
                                DateOfBirth: s.dateOfBirth ?? "",
                                RollNumber: s.enrollmentNo ?? "",
                                ClassId: s.classId,
                                Section: s.sectionId ?? "",
                              },
                            })
                          }
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-border/60 flex items-center justify-between bg-muted/10">
          <p className="text-xs text-muted-foreground">
            {total > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()}`
              : "No students"}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              data-ocid="students.pagination_prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, k) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + k;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 min-w-[2rem] px-2 rounded-lg text-xs font-semibold transition-all ${
                    p === page
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              data-ocid="students.pagination_next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Add Dialog ─────────────────────────────────────────────────────── */}
      <AddStudentDialog open={addOpen} onClose={() => setAddOpen(false)} />

      {/* ── Edit Dialog ────────────────────────────────────────────────────── */}
      {editTarget && (
        <EditStudentDialog
          key={editTarget.id}
          studentId={editTarget.id}
          initialData={
            editTarget.data as {
              FirstName?: string;
              LastName?: string;
              DateOfBirth?: string;
              RollNumber?: string;
              ClassId?: number;
              Section?: string;
            }
          }
          open
          onClose={() => setEditTarget(null)}
          classes={classes}
        />
      )}

      {/* ── Delete Dialog ──────────────────────────────────────────────────── */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent
          className="rounded-2xl"
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
