import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, UserCheck, UserX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
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

type ClassDto = {
  classId: number;
  className: string;
  gradeLevel?: number;
  academicYearId: number;
};

type TeacherItem = {
  teacherId?: number;
  id?: number;
  TeacherId?: number;
  Id?: number;
  fullName?: string;
  FullName?: string;
  name?: string;
  email?: string;
  Email?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BASE = "https://escola.doorstepgarage.in/api";

function getToken(): string {
  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function unwrap(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.Data)) return r.Data;
    if (Array.isArray(r.items)) return r.items;
    if (Array.isArray(r.value)) return r.value;
  }
  return [];
}

function resolveTeacherId(t: TeacherItem): number {
  return t.teacherId ?? t.id ?? t.TeacherId ?? t.Id ?? 0;
}

function resolveTeacherName(t: TeacherItem): string {
  return t.fullName ?? t.FullName ?? t.name ?? t.email ?? t.Email ?? "";
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ClassTeacherPage() {
  useAuth();

  const [academicYearLabel, setAcademicYearLabel] = useState("");
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [assignments, setAssignments] = useState<ClassTeacherDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClass, setModalClass] = useState<ClassDto | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  // Filter
  const [filterClassId, setFilterClassId] = useState("");

  const hasFetched = useRef(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Academic years
      const ayRes = await fetch(`${BASE}/academic-years`, {
        headers: authHeaders(),
      });
      const ayJson = await ayRes.json();
      const ayArr = unwrap(ayJson) as Array<Record<string, unknown>>;
      const currentYear = ayArr.find(
        (y) => y.isCurrent === true || y.IsCurrent === true,
      );
      if (!currentYear) {
        setError(
          "No current academic year found. Please set one in School Setup.",
        );
        setLoading(false);
        return;
      }
      const academicYearId =
        currentYear.academicYearId ??
        currentYear.AcademicYearId ??
        currentYear.id ??
        currentYear.Id;
      setAcademicYearLabel(
        String(
          currentYear.yearLabel ?? currentYear.YearLabel ?? academicYearId,
        ),
      );

      // 2. Classes for current year
      const clRes = await fetch(
        `${BASE}/classes/academicYear/${academicYearId}`,
        {
          headers: authHeaders(),
        },
      );
      const clJson = await clRes.json();
      const clArr = unwrap(clJson) as ClassDto[];
      setClasses(clArr);

      // 3. Class-teacher mappings
      const ctRes = await fetch(`${BASE}/class-teachers`, {
        headers: authHeaders(),
      });
      const ctJson = await ctRes.json();
      const ctArr = unwrap(ctJson) as ClassTeacherDto[];
      setAssignments(ctArr);

      // 4. Teachers
      const tRes = await fetch(`${BASE}/teachers`, {
        headers: authHeaders(),
      });
      const tJson = await tRes.json();
      const tArr = unwrap(tJson) as TeacherItem[];
      setTeachers(tArr);
    } catch (e) {
      setError("Failed to load data. Please try again.");
      console.error("[ClassTeacherPage] load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadAll();
  }, [loadAll]);

  // Build a lookup: classId → assignment
  const assignmentMap = new Map<number, ClassTeacherDto>();
  for (const a of assignments) {
    if (a.isActive) assignmentMap.set(a.classId, a);
  }

  function openAssignModal(cls: ClassDto) {
    setModalClass(cls);
    const existing = assignmentMap.get(cls.classId);
    setSelectedTeacherId(existing ? String(existing.teacherId) : "");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalClass(null);
    setSelectedTeacherId("");
  }

  async function handleSave() {
    if (!modalClass || !selectedTeacherId) {
      toast.error("Please select a teacher.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/class-teachers`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          classId: modalClass.classId,
          teacherId: Number(selectedTeacherId),
        }),
      });
      if (res.ok) {
        toast.success(`Class teacher assigned for ${modalClass.className}.`);
        closeModal();
        await loadAll();
      } else {
        const body = await res.text();
        toast.error(`Failed to assign: ${body || res.status}`);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(assignment: ClassTeacherDto) {
    setRemoving(assignment.classTeacherId);
    try {
      const res = await fetch(
        `${BASE}/class-teachers/${assignment.classTeacherId}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        },
      );
      if (res.ok) {
        toast.success(`Class teacher removed for ${assignment.className}.`);
        await loadAll();
      } else {
        const body = await res.text();
        toast.error(`Failed to remove: ${body || res.status}`);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRemoving(null);
    }
  }

  const filteredClasses = filterClassId
    ? classes.filter((c) => String(c.classId) === filterClassId)
    : classes;

  // ─── Skeleton ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="rounded-2xl border border-border overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0"
            >
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "oklch(0.4 0.18 25 / 0.1)" }}
        >
          <UserX
            className="w-7 h-7"
            style={{ color: "var(--color-destructive)" }}
          />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {error}
        </p>
        <Button
          variant="outline"
          onClick={loadAll}
          data-ocid="class_teachers.retry_button"
        >
          Retry
        </Button>
      </div>
    );
  }

  // ─── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-primary-light)" }}
            >
              <GraduationCap
                className="w-5 h-5"
                style={{ color: "var(--color-primary)" }}
              />
            </div>
            <h1
              className="text-2xl font-bold text-foreground tracking-tight"
              data-ocid="class_teachers.page"
            >
              Class Teacher Assignment
            </h1>
          </div>
          <p className="text-sm text-muted-foreground pl-11">
            Assign one class teacher per class
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {academicYearLabel && (
            <Badge
              variant="outline"
              className="text-xs font-semibold px-3 py-1"
              style={{
                borderColor: "var(--color-primary-light)",
                color: "var(--color-primary)",
                background: "var(--color-primary-light)",
              }}
              data-ocid="class_teachers.academic_year_badge"
            >
              Academic Year: {academicYearLabel}
            </Badge>
          )}
          {classes.length > 1 && (
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="text-sm rounded-lg border border-border bg-card text-foreground px-3 py-1.5 outline-none focus:border-primary/60 transition-colors"
              data-ocid="class_teachers.filter_class.select"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.classId} value={String(c.classId)}>
                  {c.className}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table card */}
      {filteredClasses.length === 0 ? (
        <div
          className="rounded-2xl border border-border flex flex-col items-center justify-center py-20 gap-4"
          style={{ background: "var(--color-card)" }}
          data-ocid="class_teachers.empty_state"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--color-primary-light)" }}
          >
            <GraduationCap
              className="w-7 h-7"
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">
              No classes found
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please add classes in School Setup first.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl border border-border overflow-hidden"
          style={{ background: "var(--color-card)" }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-[1.5fr_2fr_2fr_auto] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-widest"
            style={{
              background: "var(--color-muted)",
              borderBottom: "1px solid var(--color-border)",
              color: "var(--color-muted-foreground)",
            }}
          >
            <span>Class</span>
            <span>Class Teacher</span>
            <span>Email</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Table rows */}
          {filteredClasses.map((cls, idx) => {
            const assignment = assignmentMap.get(cls.classId);
            const isRemoving = removing === assignment?.classTeacherId;
            return (
              <div
                key={cls.classId}
                className="grid grid-cols-[1.5fr_2fr_2fr_auto] gap-4 items-center px-5 py-3.5 transition-colors hover:bg-muted/30"
                style={{
                  borderBottom:
                    idx < filteredClasses.length - 1
                      ? "1px solid var(--color-border)"
                      : undefined,
                }}
                data-ocid={`class_teachers.row.${idx + 1}`}
              >
                {/* Class name */}
                <span className="text-sm font-semibold text-foreground truncate">
                  {cls.className}
                </span>

                {/* Teacher name */}
                <div className="flex items-center gap-2 min-w-0">
                  {assignment ? (
                    <>
                      <UserCheck
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "oklch(0.55 0.16 145)" }}
                      />
                      <span className="text-sm text-foreground truncate">
                        {assignment.teacherName}
                      </span>
                      <Badge
                        className="text-[10px] px-2 py-0.5 ml-1 flex-shrink-0"
                        style={{
                          background: "oklch(0.55 0.16 145 / 0.12)",
                          color: "oklch(0.45 0.16 145)",
                          border: "1px solid oklch(0.55 0.16 145 / 0.25)",
                        }}
                        data-ocid={`class_teachers.active_badge.${idx + 1}`}
                      >
                        Active
                      </Badge>
                    </>
                  ) : (
                    <Badge
                      className="text-[10px] px-2 py-0.5"
                      style={{
                        background: "oklch(0.78 0.17 65 / 0.12)",
                        color: "oklch(0.55 0.18 65)",
                        border: "1px solid oklch(0.75 0.18 65 / 0.25)",
                      }}
                      data-ocid={`class_teachers.unassigned_badge.${idx + 1}`}
                    >
                      Not Assigned
                    </Badge>
                  )}
                </div>

                {/* Email */}
                <span className="text-sm text-muted-foreground truncate">
                  {assignment?.teacherEmail ?? "—"}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 px-3"
                    onClick={() => openAssignModal(cls)}
                    data-ocid={`class_teachers.assign_button.${idx + 1}`}
                  >
                    {assignment ? "Change" : "Assign"}
                  </Button>
                  {assignment && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 px-2"
                      onClick={() => handleRemove(assignment)}
                      disabled={isRemoving}
                      style={{ color: "var(--color-destructive)" }}
                      data-ocid={`class_teachers.remove_button.${idx + 1}`}
                    >
                      {isRemoving ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        </span>
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign/Change Teacher Modal */}
      {modalOpen && modalClass && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
          }}
          data-ocid="class_teachers.dialog"
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-overlay overflow-hidden"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--color-primary-light)" }}
                >
                  <GraduationCap
                    className="w-4 h-4"
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {assignmentMap.has(modalClass.classId)
                      ? "Change"
                      : "Assign"}{" "}
                    Class Teacher
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {modalClass.className}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close"
                data-ocid="class_teachers.close_button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">
              {/* Class — read only */}
              <div>
                <p className="block text-sm font-medium text-foreground mb-1.5">
                  Class
                </p>
                <div
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{
                    background: "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  {modalClass.className}
                </div>
              </div>

              {/* Teacher dropdown */}
              <div>
                <label
                  htmlFor="ct-teacher"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Select Teacher{" "}
                  <span style={{ color: "var(--color-destructive)" }}>*</span>
                </label>
                <select
                  id="ct-teacher"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "var(--color-input)",
                    border: "1px solid var(--color-border)",
                    color: selectedTeacherId
                      ? "var(--color-foreground)"
                      : "var(--color-muted-foreground)",
                  }}
                  data-ocid="class_teachers.teacher.select"
                >
                  <option value="">— Choose a teacher —</option>
                  {teachers.map((t, i) => {
                    const tid = resolveTeacherId(t);
                    const tname = resolveTeacherName(t);
                    return (
                      <option key={tid || i} value={String(tid)}>
                        {tname}
                      </option>
                    );
                  })}
                </select>
                {teachers.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No teachers found. Please add teachers first.
                  </p>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div
              className="flex items-center gap-3 px-6 py-4"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: "var(--color-muted)",
                  color: "var(--color-muted-foreground)",
                  border: "1px solid var(--color-border)",
                }}
                data-ocid="class_teachers.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selectedTeacherId}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "var(--color-primary)", color: "#ffffff" }}
                data-ocid="class_teachers.confirm_button"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Assignment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
