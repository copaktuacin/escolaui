/**
 * SchoolSetupPage — Three-step wizard for Academic Year, Class, and Section.
 *
 * CRITICAL: All dropdowns are UNCONTROLLED. The browser DOM is the sole source
 * of truth for dropdown selections. No useEffect, no data-loading callback, and
 * no re-render may ever reset a dropdown value.
 *
 * Pattern used:
 *   <select defaultValue="" onChange={e => setSelectedId(e.target.value)}>
 *
 * The select element is ALWAYS mounted (never conditionally rendered inside a
 * loading branch) so the browser preserves the chosen option even while new
 * data loads around it.
 */

import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  GraduationCap,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type AcademicYear = {
  // Primary ID field returned by this API: { academicYearId: 16, ... }
  academicYearId?: number;
  AcademicYearId?: number;
  // Fallback ID fields
  id?: number;
  Id?: number;
  yearLabel?: string;
  YearLabel?: string;
  startDate?: string;
  StartDate?: string;
  endDate?: string;
  EndDate?: string;
  isCurrent?: boolean;
  IsCurrent?: boolean;
  is_current?: boolean;
};

type ClassItem = {
  // Primary ID returned by /classes/academicYear/{id}
  classId?: number;
  ClassId?: number;
  // Legacy fallback fields
  id?: number;
  Id?: number;
  className?: string;
  ClassName?: string;
  gradeLevel?: number;
  GradeLevel?: number;
  academicYearId?: number;
  AcademicYearId?: number;
};

type SectionItem = {
  id?: number;
  Id?: number;
  sectionName?: string;
  SectionName?: string;
  classId?: number;
  ClassId?: number;
  capacity?: number;
  Capacity?: number;
};

type Step = "academic-year" | "class" | "section";

const STEPS: {
  id: Step;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "academic-year", label: "Academic Year", icon: Calendar },
  { id: "class", label: "Class", icon: GraduationCap },
  { id: "section", label: "Section", icon: LayoutGrid },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Handles all .NET response envelopes — extended key list + single-value object fallback. */
function extractList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    for (const key of [
      "data",
      "Data",
      "items",
      "Items",
      "academicYears",
      "AcademicYears",
      "classes",
      "Classes",
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
    ]) {
      if (key in r && Array.isArray(r[key])) return r[key] as T[];
    }
    // single-value object fallback: if only one key and it's an array
    const vals = Object.values(r);
    if (vals.length === 1 && Array.isArray(vals[0])) return vals[0] as T[];
  }
  return [];
}

/** @deprecated use extractList */
const extractArray = extractList;

function resolveItemId(obj: Record<string, unknown>): number {
  // Priority: classId/ClassId first (primary key from /classes/academicYear/ endpoint),
  // then sectionId/SectionId, then generic Id/id,
  // then academicYearId (must NOT be used for class objects — listed last).
  return (
    (obj.classId as number | undefined) ??
    (obj.ClassId as number | undefined) ??
    (obj.sectionId as number | undefined) ??
    (obj.SectionId as number | undefined) ??
    (obj.Id as number | undefined) ??
    (obj.id as number | undefined) ??
    (obj.ID as number | undefined) ??
    (obj.AcademicYearId as number | undefined) ??
    (obj.academicYearId as number | undefined) ??
    0
  );
}

/**
 * Dedicated resolver for AcademicYear objects.
 * The API returns { academicYearId: 16, isCurrent: true, ... } — academicYearId
 * is the primary key and must be checked FIRST before generic Id/id fallbacks.
 */
function resolveAcademicYearId(yr: AcademicYear): number {
  return (
    (yr.academicYearId as number | undefined) ??
    (yr.AcademicYearId as number | undefined) ??
    (yr.Id as number | undefined) ??
    (yr.id as number | undefined) ??
    0
  );
}

function resolveYearLabel(yr: AcademicYear): string {
  return yr.YearLabel ?? yr.yearLabel ?? String(yr.Id ?? yr.id ?? "Unknown");
}

function resolveClassName(cls: ClassItem): string {
  return (
    cls.className ??
    cls.ClassName ??
    String(cls.classId ?? cls.ClassId ?? cls.Id ?? cls.id ?? "")
  );
}

function resolveSectionName(sec: SectionItem): string {
  return sec.SectionName ?? sec.sectionName ?? String(sec.Id ?? sec.id ?? "");
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 bg-muted/40 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function ListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm">
      <span className="text-red-700">Failed to load records.</span>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 transition-colors"
        data-ocid="list.retry.button"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    </div>
  );
}

function ListEmpty({ message }: { message: string }) {
  return (
    <div
      className="px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground"
      data-ocid="list.empty_state"
    >
      {message}
    </div>
  );
}

const SELECT_CLASS =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 transition-colors";

const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 transition-colors";

const LABEL_CLASS =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

// ─── Step 1: Academic Year ─────────────────────────────────────────────────────

function AcademicYearStep({ onNext }: { onNext: () => void }) {
  // Form fields (controlled text inputs are fine — they're not dropdowns)
  const [yearLabel, setYearLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successCount, setSuccessCount] = useState(0);

  // List state
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [listStatus, setListStatus] = useState<"loading" | "ok" | "error">(
    "loading",
  );

  async function loadYears() {
    setListStatus("loading");
    try {
      const res = await api.get<unknown>("/academic-years");
      setYears(res.success ? extractArray<AcademicYear>(res.data) : []);
      setListStatus(res.success ? "ok" : "error");
    } catch {
      setListStatus("error");
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    void loadYears();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!yearLabel.trim()) {
      setError("Year Label is required.");
      return;
    }
    if (!startDate) {
      setError("Start Date is required.");
      return;
    }
    if (!endDate) {
      setError("End Date is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/academic-years", {
        YearLabel: yearLabel.trim(),
        StartDate: startDate,
        EndDate: endDate,
        IsCurrent: isCurrent,
      });
      if (!res.success) {
        const msg = res.error ?? "Failed to create academic year.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success(`Academic Year "${yearLabel}" created!`);
      setSuccessCount((c) => c + 1);
      setYearLabel("");
      setStartDate("");
      setEndDate("");
      setIsCurrent(false);
      void loadYears(); // refresh list only
    } catch {
      const msg = "Unexpected error. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Guidance */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900">
              Start here — create an Academic Year first
            </h3>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Academic Year is the foundation. Every Class belongs to an
              Academic Year, and every Section belongs to a Class. Create at
              least one Academic Year before adding Classes or Sections.
            </p>
          </div>
        </div>
      </div>

      {successCount > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">
            {successCount} academic year{successCount > 1 ? "s" : ""} created.
            Create another or move to Step 2.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="ay-label" className={LABEL_CLASS}>
            Year Label <span className="text-red-500">*</span>
          </label>
          <input
            id="ay-label"
            type="text"
            value={yearLabel}
            onChange={(e) => setYearLabel(e.target.value)}
            maxLength={100}
            placeholder="e.g. 2024-2025"
            className={INPUT_CLASS}
            data-ocid="academic_year.year_label.input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ay-start" className={LABEL_CLASS}>
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              id="ay-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={INPUT_CLASS}
              data-ocid="academic_year.start_date.input"
            />
          </div>
          <div>
            <label htmlFor="ay-end" className={LABEL_CLASS}>
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              id="ay-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={INPUT_CLASS}
              data-ocid="academic_year.end_date.input"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl">
          <input
            type="checkbox"
            id="ay-is-current"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600"
            data-ocid="academic_year.is_current.checkbox"
          />
          <div>
            <label
              htmlFor="ay-is-current"
              className="text-sm font-semibold text-foreground cursor-pointer"
            >
              Mark as Current Academic Year
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Used as default when selecting year in other forms.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl"
            data-ocid="academic_year.error_state"
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-smooth btn-press disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
            data-ocid="academic_year.submit_button"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {loading ? "Creating..." : "Create Academic Year"}
          </button>
          {successCount > 0 && (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-accent transition-colors"
              data-ocid="academic_year.next_step.button"
            >
              Next: Create Class <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Existing records */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Existing Academic Years
        </p>
        {listStatus === "loading" && <ListSkeleton />}
        {listStatus === "error" && (
          <ListError onRetry={() => void loadYears()} />
        )}
        {listStatus === "ok" && years.length === 0 && (
          <ListEmpty message="No academic years yet — create one above." />
        )}
        {listStatus === "ok" && years.length > 0 && (
          <div className="space-y-2" data-ocid="academic_year.list">
            {years.map((yr, i) => {
              const id = resolveAcademicYearId(yr);
              const label = resolveYearLabel(yr);
              const start = yr.StartDate ?? yr.startDate ?? "";
              const end = yr.EndDate ?? yr.endDate ?? "";
              const current = yr.IsCurrent ?? yr.isCurrent ?? false;
              return (
                <div
                  key={id || i}
                  className="flex items-center gap-3 px-4 py-2.5 bg-background border border-border rounded-xl"
                  data-ocid={`academic_year.list.item.${i + 1}`}
                >
                  <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {label}
                    </p>
                    {(start || end) && (
                      <p className="text-xs text-muted-foreground">
                        {start} — {end}
                      </p>
                    )}
                  </div>
                  {current && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Class ─────────────────────────────────────────────────────────────

function ClassStep({
  onNext,
  onGoToStep,
}: {
  onNext: () => void;
  onGoToStep: (step: Step) => void;
}) {
  // CONTROLLED: selectedAcademicYearId is the single source of truth.
  // Only the onChange handler (and the auto-select effect below) may write it.
  // Data-loading functions NEVER touch this state variable.
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");

  const [className, setClassName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successCount, setSuccessCount] = useState(0);

  // Academic years list — NEVER writes to selectedAcademicYearId
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [yearsError, setYearsError] = useState("");

  // Classes list (filtered by selected year)
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState("");

  async function loadYears() {
    setYearsLoading(true);
    setYearsError("");
    try {
      const res = await api.get<unknown>("/academic-years");
      console.log("[ClassStep] academic years raw response:", res);
      if (res.success) {
        const arr = extractArray<AcademicYear>(res.data);
        console.log("[ClassStep] academic years parsed:", arr);
        setYears(arr);
      } else {
        setYearsError(res.error ?? "Failed to load academic years.");
      }
    } catch (err) {
      console.error("[ClassStep] failed to load academic years:", err);
      setYearsError("Failed to load academic years. Please refresh.");
    } finally {
      setYearsLoading(false);
    }
  }

  async function loadClasses(yearId: string) {
    if (!yearId) {
      setClasses([]);
      return;
    }
    setClassesLoading(true);
    setClassesError("");
    try {
      const res = await api.get<unknown>(`/classes/academicYear/${yearId}`);
      if (res.success) {
        setClasses(extractArray<ClassItem>(res.data));
      } else {
        setClassesError(res.error ?? "Failed to load classes.");
      }
    } catch {
      setClassesError("Failed to load classes.");
    } finally {
      setClassesLoading(false);
    }
  }

  // Load years once on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    void loadYears();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select: seed selectedAcademicYearId from API once, only if user hasn't
  // chosen yet AND the result would be a valid non-zero ID.
  // Uses a ref so the effect only fires once — subsequent years reloads never
  // overwrite the user's explicit selection.
  const autoSelectedRef = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    // Guard: already auto-selected, or user already picked something, or no years yet
    if (autoSelectedRef.current || selectedAcademicYearId || years.length === 0)
      return;
    // Prefer the year marked as current
    const current = years.find((yr) => yr.IsCurrent ?? yr.isCurrent);
    const pick = current ?? years[0];
    if (pick) {
      const id = String(resolveAcademicYearId(pick));
      if (id && id !== "0") {
        console.log("[ClassStep] auto-selecting academic year id:", id);
        autoSelectedRef.current = true;
        setSelectedAcademicYearId(id);
      }
    }
  }, [years]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload classes whenever selectedAcademicYearId changes (driven only by user interaction or auto-select)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (selectedAcademicYearId) void loadClasses(selectedAcademicYearId);
    else setClasses([]);
  }, [selectedAcademicYearId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handler for academic year dropdown — sets selectedAcademicYearId from user interaction
  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedAcademicYearId(e.target.value);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");

    if (!className.trim()) {
      setError("Class Name is required.");
      return;
    }

    // Validation: only check that the string is non-empty.
    // parseInt happens at payload build time — do not combine with validation.
    if (!selectedAcademicYearId) {
      setError("Please select an Academic Year.");
      return;
    }
    const ayId = Number.parseInt(selectedAcademicYearId, 10);
    if (Number.isNaN(ayId) || ayId <= 0) {
      setError(
        `Invalid Academic Year (got "${selectedAcademicYearId}"). Please re-select from the dropdown.`,
      );
      return;
    }

    const grade = gradeLevel ? Number.parseInt(gradeLevel, 10) : undefined;
    if (
      grade !== undefined &&
      (Number.isNaN(grade) || grade < 1 || grade > 12)
    ) {
      setError("Grade Level must be between 1 and 12.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        ClassName: className.trim(),
        AcademicYearId: ayId,
      };
      if (grade !== undefined) body.GradeLevel = grade;

      const res = await api.post("/classes", body);
      if (!res.success) {
        const msg = res.error ?? "Failed to create class.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success(`Class "${className}" created!`);
      setSuccessCount((c) => c + 1);
      setClassName("");
      setGradeLevel("");
      // INTENTIONALLY not clearing selectedAcademicYearId — user stays on same year
      void loadClasses(selectedAcademicYearId);
    } catch {
      const msg = "Unexpected error. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // No academic years at all
  if (!yearsLoading && !yearsError && years.length === 0) {
    return (
      <div
        className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col items-center text-center gap-4"
        data-ocid="class.no_academic_years.empty_state"
      >
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-900 mb-1">
            Academic Year Required
          </h3>
          <p className="text-xs text-amber-700 leading-relaxed">
            Create an Academic Year first (Step 1). Classes belong to an
            Academic Year.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onGoToStep("academic-year")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-smooth btn-press"
          style={{ background: "var(--color-primary)" }}
          data-ocid="class.go_to_step1.button"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Step 1: Academic Year
        </button>
      </div>
    );
  }

  const selectedYearObj = years.find(
    (yr) => String(resolveAcademicYearId(yr)) === selectedAcademicYearId,
  );

  return (
    <div className="space-y-6">
      {/* Guidance */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <GraduationCap className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-violet-900">
              Select an Academic Year first, then create Classes
            </h3>
            <p className="text-xs text-violet-700 mt-1 leading-relaxed">
              A Class (e.g. &quot;Grade 6&quot;, &quot;Form 2&quot;) belongs to
              a specific Academic Year. After creating classes you will add
              Sections to each class in Step 3.
            </p>
          </div>
        </div>
      </div>

      {yearsError && (
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <span className="text-amber-800">{yearsError}</span>
          <button
            type="button"
            onClick={() => void loadYears()}
            className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {successCount > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">
            {successCount} class{successCount > 1 ? "es" : ""} created. Create
            another or move to Step 3.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/*
          Academic Year — CONTROLLED: value={selectedAcademicYearId} + onChange.
          Using a controlled select ensures the React state always matches the
          displayed option. Auto-select effect seeds the value from the API when
          the user hasn't chosen yet. The loading spinner is a sibling — the
          select itself is never toggled with disabled={yearsLoading}.
        */}
        <div>
          <label htmlFor="cls-year" className={LABEL_CLASS}>
            Academic Year <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="cls-year"
              value={selectedAcademicYearId}
              onChange={handleYearChange}
              className={SELECT_CLASS}
              data-ocid="class.academic_year_id.select"
            >
              <option value="">
                {yearsLoading
                  ? "Loading academic years…"
                  : "— Select Academic Year —"}
              </option>
              {years.map((yr) => {
                const id = resolveAcademicYearId(yr);
                return (
                  <option key={id} value={String(id)}>
                    {resolveYearLabel(yr)}
                  </option>
                );
              })}
            </select>
            {yearsLoading && (
              <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          {selectedAcademicYearId && selectedYearObj && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected: <strong>{resolveYearLabel(selectedYearObj)}</strong>
            </p>
          )}
          {selectedAcademicYearId && !selectedYearObj && (
            <p className="text-xs text-muted-foreground mt-1">
              Academic Year ID: <strong>{selectedAcademicYearId}</strong>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cls-name" className={LABEL_CLASS}>
            Class Name <span className="text-red-500">*</span>
          </label>
          <input
            id="cls-name"
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            maxLength={100}
            placeholder="e.g. Grade 6, Form 2, Class X"
            className={INPUT_CLASS}
            data-ocid="class.class_name.input"
          />
        </div>

        <div>
          <label htmlFor="cls-grade" className={LABEL_CLASS}>
            Grade Level{" "}
            <span className="text-muted-foreground/60">(optional, 1–12)</span>
          </label>
          <input
            id="cls-grade"
            type="number"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            min={1}
            max={12}
            placeholder="e.g. 6"
            className={INPUT_CLASS}
            data-ocid="class.grade_level.input"
          />
        </div>

        {error && (
          <div
            className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl"
            data-ocid="class.error_state"
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-smooth btn-press disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
            data-ocid="class.submit_button"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {loading ? "Creating..." : "Create Class"}
          </button>
          {successCount > 0 && (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-accent transition-colors"
              data-ocid="class.next_step.button"
            >
              Next: Create Section <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Existing classes for selected year */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {selectedAcademicYearId
            ? "Classes for selected Academic Year"
            : "All Classes (select a year to filter)"}
        </p>
        {!selectedAcademicYearId && (
          <ListEmpty message="Select an Academic Year above to see its classes." />
        )}
        {selectedAcademicYearId && classesLoading && <ListSkeleton />}
        {selectedAcademicYearId && classesError && (
          <ListError onRetry={() => void loadClasses(selectedAcademicYearId)} />
        )}
        {selectedAcademicYearId &&
          !classesLoading &&
          !classesError &&
          classes.length === 0 && (
            <ListEmpty message="No classes for this year yet — create one above." />
          )}
        {selectedAcademicYearId &&
          !classesLoading &&
          !classesError &&
          classes.length > 0 && (
            <div className="space-y-2" data-ocid="class.list">
              {classes.map((cls, i) => {
                const id = resolveItemId(
                  cls as unknown as Record<string, unknown>,
                );
                return (
                  <div
                    key={id || i}
                    className="flex items-center gap-3 px-4 py-2.5 bg-background border border-border rounded-xl"
                    data-ocid={`class.list.item.${i + 1}`}
                  >
                    <GraduationCap className="w-4 h-4 text-violet-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {resolveClassName(cls)}
                      </p>
                      {(cls.GradeLevel ?? cls.gradeLevel) !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Grade {cls.GradeLevel ?? cls.gradeLevel}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}

// ─── Step 3: Section ───────────────────────────────────────────────────────────

function SectionStep({
  onDone,
  onGoToStep,
}: {
  onDone: () => void;
  onGoToStep: (step: Step) => void;
}) {
  // selectedClassId is controlled state — the ONLY source of truth.
  // No ref needed; the useEffect below watches the state directly.
  const [selectedClassId, setSelectedClassId] = useState("");

  const [sectionName, setSectionName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successCount, setSuccessCount] = useState(0);

  // Classes list — fetched once, NEVER touches selectedClassId
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState("");

  // Sections list — loaded when user picks a class
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Track whether the classes list has been populated at least once
  const classesLoadedRef = useRef(false);

  /**
   * Load classes filtered by the current academic year (IsCurrent === true).
   * This prevents "Class not found or does not belong to your school" errors
   * caused by sending a classId from a different academic year.
   * Pattern mirrors ClassStep.loadClasses which already does this correctly.
   */
  async function loadClasses() {
    setClassesLoading(true);
    setClassesError("");
    try {
      // Step 1: Find the current academic year.
      const yearsRes = await api.get<unknown>("/academic-years");
      let currentYearId: number | null = null;
      if (yearsRes.success) {
        const years = extractList<AcademicYear>(yearsRes.data);
        // Prefer year marked IsCurrent, fall back to first year in list.
        const current = years.find((yr) => yr.IsCurrent ?? yr.isCurrent);
        const pick = current ?? years[0];
        if (pick) {
          currentYearId = resolveAcademicYearId(pick) || null;
          console.log("[SectionStep] using academicYearId:", currentYearId);
        }
      }

      // Step 2: Fetch classes filtered by current year (or all if year unknown).
      const classesUrl = currentYearId
        ? `/classes/academicYear/${currentYearId}`
        : "/classes";
      const res = await api.get<unknown>(classesUrl);
      if (res.success) {
        const arr = extractList<ClassItem>(res.data);
        setClasses(arr);
        classesLoadedRef.current = true;
        // NOTE: deliberately do NOT touch selectedClassId here.
        // If the user has already picked a class, that selection must survive
        // this data reload. The "class not found" error from the API means
        // we are now filtering by current academic year correctly, so any
        // previously cached class ID from a different year simply won't appear
        // in the dropdown — the user will see the right classes and can pick again.
      } else {
        const msg = res.error ?? "Failed to load classes.";
        setClassesError(msg);
        toast.error(msg);
      }
    } catch {
      const msg = "Failed to load classes. Please refresh.";
      setClassesError(msg);
      toast.error(msg);
    } finally {
      setClassesLoading(false);
    }
  }

  async function loadSections(classId: string) {
    const numId = Number.parseInt(classId, 10);
    if (!classId || Number.isNaN(numId) || numId <= 0) {
      setSections([]);
      return;
    }
    setSectionsLoading(true);
    try {
      const res = await api.get<unknown>(`/sections/Class/${numId}`);
      console.log("[SectionStep] sections raw response:", res.data);
      setSections(res.success ? extractList<SectionItem>(res.data) : []);
    } catch {
      setSections([]);
    } finally {
      setSectionsLoading(false);
    }
  }

  // Load classes once on mount — NEVER resets selectedClassId
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    void loadClasses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load sections whenever selectedClassId changes.
  // Reads selectedClassId from state — always up to date after React batches the setState.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (selectedClassId) void loadSections(selectedClassId);
    else setSections([]);
  }, [selectedClassId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handler for class dropdown — ONLY place that sets selectedClassId.
  function handleClassChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    console.log("[SectionStep] class changed to:", val);
    setSelectedClassId(val);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");

    // selectedClassId state is always in sync with the DOM (controlled select).
    const effectiveClassId = selectedClassId;

    if (classes.length === 0) {
      setError("No classes available. Please create a Class first (Step 2).");
      return;
    }
    if (!effectiveClassId || effectiveClassId === "0") {
      setError("Please select a Class.");
      return;
    }
    if (!sectionName.trim()) {
      setError("Section Name is required.");
      return;
    }

    const classId = Number.parseInt(effectiveClassId, 10);
    if (Number.isNaN(classId) || classId <= 0) {
      setError("Invalid class selection.");
      return;
    }

    const cap = capacity ? Number.parseInt(capacity, 10) : undefined;
    if (cap !== undefined && (Number.isNaN(cap) || cap < 1 || cap > 1000)) {
      setError("Capacity must be between 1 and 1000.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        SectionName: sectionName.trim(),
        ClassId: classId,
      };
      if (cap !== undefined) body.Capacity = cap;

      const res = await api.post("/sections", body);
      if (!res.success) {
        const msg = res.error ?? "Failed to create section.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success(`Section "${sectionName}" created!`);
      setSuccessCount((c) => c + 1);
      setSectionName("");
      setCapacity("");
      setError("");
      // Reload sections for current class — selectedClassId is NOT touched
      void loadSections(effectiveClassId);
    } catch {
      const msg = "Unexpected error. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // Show blocker only if classes have loaded and there are none
  if (
    !classesLoading &&
    classesLoadedRef.current &&
    !classesError &&
    classes.length === 0
  ) {
    return (
      <div
        className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col items-center text-center gap-4"
        data-ocid="section.no_classes.empty_state"
      >
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-900 mb-1">
            Class Required
          </h3>
          <p className="text-xs text-amber-700 leading-relaxed">
            Create a Class first (Step 2). Sections belong to a Class.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onGoToStep("class")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-smooth btn-press"
          style={{ background: "var(--color-primary)" }}
          data-ocid="section.go_to_step2.button"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Step 2: Class
        </button>
      </div>
    );
  }

  const selectedClassObj = classes.find(
    (cls) =>
      String(resolveItemId(cls as unknown as Record<string, unknown>)) ===
      selectedClassId,
  );

  return (
    <div className="space-y-6">
      {/* Guidance */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <LayoutGrid className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">
              Select a Class to add Sections to it
            </h3>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              Sections divide a Class into groups (e.g. Section A, B, C).
              Students are assigned to a class and section when enrolled.
            </p>
          </div>
        </div>
      </div>

      {classesError && (
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <span className="text-amber-800">{classesError}</span>
          <button
            type="button"
            onClick={() => void loadClasses()}
            className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {successCount > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">
            {successCount} section{successCount > 1 ? "s" : ""} created. Create
            another or finish setup.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/*
          Class — CONTROLLED with value={selectedClassId} + onChange.
          Using a controlled select ensures selectedClassId state always
          matches the DOM value. The onChange handler is the single source
          of truth for selectedClassId. The useEffect watching selectedClassId
          triggers the section fetch — fetch is never called inside onChange.
          Loading indicator is a sibling — the select itself is never
          toggled with disabled={classesLoading}.
        */}
        <div>
          <label htmlFor="sec-class" className={LABEL_CLASS}>
            Class <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="sec-class"
              value={selectedClassId}
              onChange={handleClassChange}
              className={SELECT_CLASS}
              data-ocid="section.class_id.select"
            >
              <option value="">
                {classesLoading ? "— Loading classes… —" : "— Select a Class —"}
              </option>
              {classes.map((cls) => {
                const id = resolveItemId(
                  cls as unknown as Record<string, unknown>,
                );
                return (
                  <option key={id} value={String(id)}>
                    {resolveClassName(cls)}
                  </option>
                );
              })}
            </select>
            {classesLoading && (
              <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          {selectedClassId && selectedClassObj && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected class:{" "}
              <strong>{resolveClassName(selectedClassObj)}</strong>
            </p>
          )}
          {selectedClassId && !selectedClassObj && (
            <p className="text-xs text-muted-foreground mt-1">
              Class ID: <strong>{selectedClassId}</strong>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="sec-name" className={LABEL_CLASS}>
            Section Name <span className="text-red-500">*</span>
          </label>
          <input
            id="sec-name"
            type="text"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            maxLength={100}
            placeholder="e.g. A, B, Morning Shift, Division 1"
            className={INPUT_CLASS}
            data-ocid="section.section_name.input"
          />
        </div>

        <div>
          <label htmlFor="sec-capacity" className={LABEL_CLASS}>
            Capacity{" "}
            <span className="text-muted-foreground/60">(optional, 1–1000)</span>
          </label>
          <input
            id="sec-capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min={1}
            max={1000}
            placeholder="e.g. 40"
            className={INPUT_CLASS}
            data-ocid="section.capacity.input"
          />
        </div>

        {error && (
          <div
            className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl"
            data-ocid="section.error_state"
          >
            {error}
            {classes.length === 0 && (
              <button
                type="button"
                onClick={() => onGoToStep("class")}
                className="ml-2 underline font-semibold"
              >
                Go to Step 2
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-smooth btn-press disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
            data-ocid="section.submit_button"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {loading ? "Creating..." : "Create Section"}
          </button>
          {successCount > 0 && (
            <button
              type="button"
              onClick={onDone}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-smooth btn-press"
              style={{ background: "#22c55e" }}
              data-ocid="section.finish_setup.button"
            >
              <CheckCircle className="w-4 h-4" /> Finish Setup
            </button>
          )}
        </div>
      </form>

      {/* Sections for selected class */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {selectedClassId
            ? "Sections for selected Class"
            : "Select a class above to see its sections"}
        </p>
        {!selectedClassId && (
          <ListEmpty message="Select a class to view its sections." />
        )}
        {selectedClassId && sectionsLoading && <ListSkeleton />}
        {selectedClassId && !sectionsLoading && sections.length === 0 && (
          <ListEmpty message="No sections for this class yet — create one above." />
        )}
        {selectedClassId && !sectionsLoading && sections.length > 0 && (
          <div className="space-y-2" data-ocid="section.list">
            {sections.map((sec, i) => {
              const id = resolveItemId(
                sec as unknown as Record<string, unknown>,
              );
              const cap = sec.Capacity ?? sec.capacity;
              return (
                <div
                  key={id || i}
                  className="flex items-center gap-3 px-4 py-2.5 bg-background border border-border rounded-xl"
                  data-ocid={`section.list.item.${i + 1}`}
                >
                  <LayoutGrid className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {resolveSectionName(sec)}
                    </p>
                    {cap !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Capacity: {cap}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Setup Overview Card ──────────────────────────────────────────────────────

function SetupOverview({ onGoToStep }: { onGoToStep: (step: Step) => void }) {
  const [counts, setCounts] = useState({
    years: null as number | null,
    classes: null as number | null,
    sections: null as number | null,
  });

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [yr, cl, sc] = await Promise.all([
          api.get<unknown>("/academic-years"),
          api.get<unknown>("/classes"),
          api.get<unknown>("/sections"),
        ]);
        setCounts({
          years: yr.success ? extractArray<AcademicYear>(yr.data).length : 0,
          classes: cl.success ? extractArray<ClassItem>(cl.data).length : 0,
          sections: sc.success ? extractArray<SectionItem>(sc.data).length : 0,
        });
      } catch {
        setCounts({ years: 0, classes: 0, sections: 0 });
      }
    }
    void fetchCounts();
  }, []);

  const items = [
    {
      step: "academic-year" as Step,
      label: "Academic Year",
      desc: "School year (e.g. 2024-2025). All classes belong to a year.",
      count: counts.years,
      color: "blue",
      icon: Calendar,
    },
    {
      step: "class" as Step,
      label: "Class",
      desc: "Add classes under an academic year (e.g. Grade 6, Form 2).",
      count: counts.classes,
      color: "violet",
      icon: GraduationCap,
    },
    {
      step: "section" as Step,
      label: "Section",
      desc: "Divide each class into sections (e.g. Section A, B, C).",
      count: counts.sections,
      color: "emerald",
      icon: LayoutGrid,
    },
  ];

  const colors: Record<
    string,
    { bg: string; icon: string; text: string; border: string; badge: string }
  > = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      text: "text-blue-900",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-700",
    },
    violet: {
      bg: "bg-violet-50",
      icon: "text-violet-600",
      text: "text-violet-900",
      border: "border-violet-200",
      badge: "bg-violet-100 text-violet-700",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      text: "text-emerald-900",
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
    },
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const c = colors[item.color];
        const Icon = item.icon;
        return (
          <div
            key={item.step}
            className={`${c.bg} ${c.border} border rounded-xl p-4 flex items-center gap-4`}
          >
            <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-background shadow-sm">
              <span className="text-xs font-bold text-muted-foreground">
                {idx + 1}
              </span>
            </div>
            <Icon className={`w-5 h-5 ${c.icon} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold ${c.text}`}>
                  {item.label}
                </p>
                {item.count !== null && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}
                  >
                    {item.count} created
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {item.desc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(item.step)}
              className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              data-ocid={`setup_guide.${item.step}.button`}
            >
              Add <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SchoolSetupPage() {
  const [activeStep, setActiveStep] = useState<Step>("academic-year");
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  const [showDone, setShowDone] = useState(false);

  function goToStep(step: Step) {
    setActiveStep(step);
  }

  function markDone(step: Step) {
    setCompletedSteps((prev) => new Set([...prev, step]));
  }

  if (showDone) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-card rounded-2xl border border-border shadow-card p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(34,197,94,0.12)" }}
          >
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold font-display text-foreground mb-2">
            School Setup Complete!
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            You have successfully set up Academic Year, Classes, and Sections.
            You can now enroll students, assign teachers, and start managing
            your school.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/dashboard">
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-smooth"
                style={{ background: "var(--color-primary)" }}
                data-ocid="setup_done.go_to_dashboard.button"
              >
                Go to Dashboard
              </button>
            </Link>
            <button
              type="button"
              onClick={() => {
                setShowDone(false);
                goToStep("academic-year");
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-accent transition-colors"
              data-ocid="setup_done.setup_more.button"
            >
              Set Up More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard">
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="setup.back_to_dashboard.button"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">
          School Setup
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your school in three steps: Academic Year → Class → Section.
          Each step depends on the previous one.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen
            className="w-4 h-4"
            style={{ color: "var(--color-primary)" }}
          />
          <h2 className="font-semibold font-display text-foreground text-sm">
            Setup Guide &amp; Status
          </h2>
        </div>
        <SetupOverview onGoToStep={goToStep} />
      </div>

      {/* Stepper */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border">
          {STEPS.map((step, idx) => {
            const isActive = activeStep === step.id;
            const isDone = completedSteps.has(step.id);
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-colors border-b-2 ${
                  isActive
                    ? "border-[var(--color-primary)] text-foreground bg-muted/30"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                }`}
                data-ocid={`setup.step_${idx + 1}.tab`}
              >
                {isDone ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive ? "text-white" : "bg-muted text-muted-foreground"
                    }`}
                    style={
                      isActive ? { background: "var(--color-primary)" } : {}
                    }
                  >
                    {idx + 1}
                  </span>
                )}
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Breadcrumb */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
            {STEPS.map((s, i) => (
              <span key={s.id} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <span
                  className={
                    activeStep === s.id ? "font-semibold text-foreground" : ""
                  }
                >
                  {s.label}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Step content — ALL THREE steps are ALWAYS mounted; inactive ones hidden via CSS */}
        {/* This preserves DOM state (including <select> chosen option) when switching tabs */}
        <div className="px-6 pb-6">
          <div
            className={activeStep === "academic-year" ? undefined : "hidden"}
          >
            <AcademicYearStep
              onNext={() => {
                markDone("academic-year");
                goToStep("class");
              }}
            />
          </div>
          <div className={activeStep === "class" ? undefined : "hidden"}>
            <ClassStep
              onNext={() => {
                markDone("class");
                goToStep("section");
              }}
              onGoToStep={goToStep}
            />
          </div>
          <div className={activeStep === "section" ? undefined : "hidden"}>
            <SectionStep
              onDone={() => {
                markDone("section");
                setShowDone(true);
              }}
              onGoToStep={goToStep}
            />
          </div>
        </div>

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const idx = STEPS.findIndex((s) => s.id === activeStep);
              if (idx > 0) goToStep(STEPS[idx - 1].id);
            }}
            disabled={activeStep === "academic-year"}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            data-ocid="setup.prev_step.button"
          >
            <ArrowLeft className="w-4 h-4" /> Previous Step
          </button>
          <p className="text-xs text-muted-foreground">
            Step {STEPS.findIndex((s) => s.id === activeStep) + 1} of{" "}
            {STEPS.length}
          </p>
          <button
            type="button"
            onClick={() => {
              const idx = STEPS.findIndex((s) => s.id === activeStep);
              if (idx < STEPS.length - 1) goToStep(STEPS[idx + 1].id);
            }}
            disabled={activeStep === "section"}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            data-ocid="setup.next_step.button"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
