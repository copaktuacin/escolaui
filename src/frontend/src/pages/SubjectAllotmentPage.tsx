import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  BookMarked,
  BookOpen,
  Layers,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, unwrapResponse } from "../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type AcademicYear = {
  academicYearId: number;
  yearLabel: string;
  isCurrent: boolean;
};

type ClassItem = {
  classId: number;
  className: string;
  gradeLevel?: number;
};

type SubjectDto = {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
};

type SubjectAllocationDto = {
  subjectAllocationId: number;
  classId: number;
  className?: string;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  isActive: boolean;
  // UI-only metadata (stored locally, not from API)
  allocationType?: "compulsory" | "optional";
  optionalGroup?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractArray<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  const obj = raw as Record<string, unknown>;
  // Unwrap .NET success envelope
  if ("success" in obj && "data" in obj && Array.isArray(obj.data))
    return obj.data as T[];
  const arr = unwrapResponse<T[]>(raw);
  return Array.isArray(arr) ? arr : [];
}

// ─── SubjectAllotmentPage ─────────────────────────────────────────────────────

export default function SubjectAllotmentPage() {
  // ── Academic year / class state ──────────────────────────────────────────
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Use a ref to hold the selected classId — never driven by any effect,
  // only by the user's own onChange. This avoids the "snap back" problem.
  const classIdRef = useRef<number>(0);
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedClassName, setSelectedClassName] = useState("");

  // ── Allocations ──────────────────────────────────────────────────────────
  const [allocations, setAllocations] = useState<SubjectAllocationDto[]>([]);
  const [loadingAlloc, setLoadingAlloc] = useState(false);

  // ── Subjects master ──────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // ── Add-subject form ─────────────────────────────────────────────────────
  const [subjectSearch, setSubjectSearch] = useState("");
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectDto | null>(
    null,
  );
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [allocType, setAllocType] = useState<"compulsory" | "optional">(
    "compulsory",
  );
  const [optionalGroup, setOptionalGroup] = useState("");
  const [adding, setAdding] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Step 1: Load academic years → find current ──────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/academic-years");
        const years = extractArray<AcademicYear>(res.data);
        const current = years.find((y) => y.isCurrent) ?? years[0] ?? null;
        setCurrentYear(current);
      } catch {
        toast.error("Failed to load academic years");
      }
    })();
  }, []);

  // ─── Step 2: Load classes for current academic year ──────────────────────
  useEffect(() => {
    if (!currentYear) return;
    setLoadingClasses(true);
    (async () => {
      try {
        const res = await api.get(
          `/classes/academicYear/${currentYear.academicYearId}`,
        );
        // Classes endpoint returns a plain array (no wrapper)
        const raw = res.data;
        const list: ClassItem[] = Array.isArray(raw)
          ? (raw as ClassItem[])
          : extractArray<ClassItem>(raw);
        setClasses(list);
      } catch {
        toast.error("Failed to load classes");
      } finally {
        setLoadingClasses(false);
      }
    })();
  }, [currentYear]);

  // ─── Step 3: Load subjects master once ───────────────────────────────────
  useEffect(() => {
    setLoadingSubjects(true);
    (async () => {
      try {
        const res = await api.get("/subjects");
        const list = extractArray<SubjectDto>(res.data);
        setSubjects(list);
      } catch {
        // Subjects may 404 if endpoint not yet ready — silently ignore
      } finally {
        setLoadingSubjects(false);
      }
    })();
  }, []);

  // ─── Load allocations when class is selected ─────────────────────────────
  function loadAllocations(classId: number) {
    if (!classId) return;
    setLoadingAlloc(true);
    setAllocations([]);
    (async () => {
      try {
        const res = await api.get(`/subject-allocations?classId=${classId}`);
        const list = extractArray<SubjectAllocationDto>(res.data);
        setAllocations(list);
      } catch {
        toast.error("Failed to load subject allocations");
      } finally {
        setLoadingAlloc(false);
      }
    })();
  }

  // ─── Class selection handler (only user-driven) ───────────────────────────
  function handleClassChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value);
    classIdRef.current = id;
    setSelectedClassId(id);
    const cls = classes.find((c) => c.classId === id);
    setSelectedClassName(cls?.className ?? "");
    setAllocations([]);
    if (id > 0) loadAllocations(id);
  }

  // ─── Close subject dropdown on outside click ─────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        subjectDropdownRef.current &&
        !subjectDropdownRef.current.contains(e.target as Node)
      )
        setShowSubjectDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Subject search filter ────────────────────────────────────────────────
  const filteredSubjects = subjects.filter(
    (s) =>
      s.subjectName.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.subjectCode.toLowerCase().includes(subjectSearch.toLowerCase()),
  );
  const isCreatingNew =
    subjectSearch.trim().length > 0 &&
    !filteredSubjects.some(
      (s) => s.subjectName.toLowerCase() === subjectSearch.toLowerCase(),
    );

  function handleSelectSubject(s: SubjectDto) {
    setSelectedSubject(s);
    setSubjectSearch(s.subjectName);
    setShowSubjectDropdown(false);
  }

  function handleSubjectSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSubjectSearch(e.target.value);
    setSelectedSubject(null);
    setShowSubjectDropdown(true);
  }

  // ─── Remove allocation ────────────────────────────────────────────────────
  async function handleRemove(allocId: number) {
    try {
      const res = await api.delete(`/subject-allocations/${allocId}`);
      if (res.success) {
        setAllocations((prev) =>
          prev.filter((a) => a.subjectAllocationId !== allocId),
        );
        toast.success("Subject removed from class");
      } else {
        toast.error(res.error ?? "Failed to remove subject");
      }
    } catch {
      toast.error("Network error removing subject");
    }
  }

  // ─── Add allocation ───────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error("Please select a class first");
      return;
    }

    setAdding(true);
    try {
      let subjectId: number | null = selectedSubject?.subjectId ?? null;

      // If no existing subject selected, create a new one inline
      if (!subjectId) {
        const nameToCreate = newSubjectName.trim() || subjectSearch.trim();
        const codeToCreate = newSubjectCode.trim();
        if (!nameToCreate) {
          toast.error("Please enter a subject name or pick one from the list");
          setAdding(false);
          return;
        }
        const createRes = await api.post<SubjectDto>("/subjects", {
          subjectName: nameToCreate,
          subjectCode: codeToCreate || nameToCreate.slice(0, 6).toUpperCase(),
        });
        if (!createRes.success || !createRes.data) {
          toast.error(createRes.error ?? "Failed to create subject");
          setAdding(false);
          return;
        }
        const created = createRes.data as SubjectDto;
        subjectId = created.subjectId;
        setSubjects((prev) => [...prev, created]);
      }

      // POST to subject-allocations
      const allocRes = await api.post<SubjectAllocationDto>(
        "/subject-allocations",
        {
          classId: selectedClassId,
          subjectId,
        },
      );

      if (allocRes.success) {
        // Refresh the list
        loadAllocations(selectedClassId);
        // Reset form
        setSubjectSearch("");
        setSelectedSubject(null);
        setNewSubjectName("");
        setNewSubjectCode("");
        setAllocType("compulsory");
        setOptionalGroup("");
        toast.success("Subject added to class");
      } else {
        toast.error(allocRes.error ?? "Failed to add subject");
      }
    } catch {
      toast.error("Network error adding subject");
    } finally {
      setAdding(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="max-w-5xl mx-auto space-y-6"
      data-ocid="subject_allotment.page"
    >
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Subject Allotment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assign subjects to classes. Mark each as Compulsory or Optional and
            group optional subjects for student selection.
          </p>
        </div>
        {currentYear && (
          <Badge
            variant="outline"
            className="text-xs font-semibold px-3 py-1.5 flex-shrink-0"
            style={{
              borderColor: "var(--color-primary-light)",
              color: "var(--color-primary)",
              background: "var(--color-primary-light)",
            }}
          >
            <BookOpen className="w-3 h-3 mr-1.5" />
            {currentYear.yearLabel}
          </Badge>
        )}
      </div>

      {/* ── Class Selector ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Select Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Label
                htmlFor="class-select"
                className="text-xs font-medium text-muted-foreground mb-1.5 block"
              >
                Class
              </Label>
              <select
                id="class-select"
                value={selectedClassId}
                onChange={handleClassChange}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground"
                data-ocid="subject_allotment.class.select"
              >
                <option value={0}>
                  {loadingClasses
                    ? "Loading classes…"
                    : classes.length === 0
                      ? "No classes found"
                      : "— Select a class —"}
                </option>
                {classes.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.className}
                  </option>
                ))}
              </select>
            </div>

            {selectedClassId > 0 && (
              <div className="mt-5 text-xs text-muted-foreground">
                Showing subjects for{" "}
                <span className="font-semibold text-foreground">
                  {selectedClassName}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClassId > 0 && (
        <>
          {/* ── Allocated Subjects Table ──────────────────────────────────── */}
          <Card data-ocid="subject_allotment.allocations.card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-primary" />
                Allocated Subjects
                {!loadingAlloc && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {allocations.length} subject
                    {allocations.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAlloc ? (
                <div
                  className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm"
                  data-ocid="subject_allotment.loading_state"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading allocations…
                </div>
              ) : allocations.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-12 text-center px-6"
                  data-ocid="subject_allotment.empty_state"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "var(--color-muted)" }}
                  >
                    <BookOpen
                      className="w-5 h-5"
                      style={{ color: "var(--color-muted-foreground)" }}
                    />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No subjects allocated to this class yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add subjects using the form below
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm"
                    data-ocid="subject_allotment.allocations.table"
                  >
                    <thead>
                      <tr
                        className="border-b"
                        style={{
                          background: "var(--color-muted)",
                          borderColor: "var(--color-border)",
                        }}
                      >
                        <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Subject Name
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Code
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Type
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Optional Group
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((alloc, idx) => (
                        <tr
                          key={alloc.subjectAllocationId}
                          className="border-b transition-colors hover:bg-muted/40"
                          style={{ borderColor: "var(--color-border)" }}
                          data-ocid={`subject_allotment.item.${idx + 1}`}
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {alloc.subjectName}
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs px-2 py-0.5 rounded font-mono bg-muted text-muted-foreground">
                              {alloc.subjectCode || "—"}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className="text-[11px] font-semibold"
                              style={
                                alloc.allocationType === "optional"
                                  ? {
                                      borderColor: "oklch(0.7 0.18 50 / 0.4)",
                                      color: "oklch(0.6 0.18 50)",
                                      background: "oklch(0.7 0.18 50 / 0.1)",
                                    }
                                  : {
                                      borderColor: "var(--color-primary-light)",
                                      color: "var(--color-primary)",
                                      background: "var(--color-primary-light)",
                                    }
                              }
                            >
                              {alloc.allocationType === "optional"
                                ? "Optional"
                                : "Compulsory"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {alloc.optionalGroup || "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemove(alloc.subjectAllocationId)
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              aria-label={`Remove ${alloc.subjectName}`}
                              data-ocid={`subject_allotment.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Add Subject Form ──────────────────────────────────────────── */}
          <Card data-ocid="subject_allotment.add_form.card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Add Subject to {selectedClassName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-5">
                {/* Subject picker */}
                <div>
                  <Label
                    htmlFor="subject-search"
                    className="text-sm font-medium text-foreground mb-1.5 block"
                  >
                    Subject{" "}
                    <span className="text-muted-foreground font-normal text-xs">
                      (pick existing or type to create new)
                    </span>
                  </Label>
                  <div className="relative" ref={subjectDropdownRef}>
                    <Input
                      id="subject-search"
                      value={subjectSearch}
                      onChange={handleSubjectSearchChange}
                      onFocus={() => setShowSubjectDropdown(true)}
                      placeholder={
                        loadingSubjects
                          ? "Loading subjects…"
                          : "Search or type subject name…"
                      }
                      className="w-full max-w-sm"
                      autoComplete="off"
                      data-ocid="subject_allotment.subject.search_input"
                    />
                    {selectedSubject && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubject(null);
                          setSubjectSearch("");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground"
                        aria-label="Clear subject"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {showSubjectDropdown &&
                      (filteredSubjects.length > 0 || isCreatingNew) && (
                        <div
                          className="absolute top-full left-0 mt-1 w-full max-w-sm z-50 rounded-xl shadow-floating overflow-hidden"
                          style={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                          }}
                          data-ocid="subject_allotment.subject.dropdown"
                        >
                          <div className="max-h-48 overflow-y-auto py-1">
                            {filteredSubjects.map((s) => (
                              <button
                                key={s.subjectId}
                                type="button"
                                onClick={() => handleSelectSubject(s)}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                              >
                                <span className="font-medium text-foreground">
                                  {s.subjectName}
                                </span>
                                <code className="text-[11px] text-muted-foreground font-mono">
                                  {s.subjectCode}
                                </code>
                              </button>
                            ))}
                            {isCreatingNew && (
                              <>
                                {filteredSubjects.length > 0 && (
                                  <Separator className="my-1" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewSubjectName(subjectSearch.trim());
                                    setShowSubjectDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                                >
                                  <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                  <span>
                                    Create{" "}
                                    <span className="font-semibold text-foreground">
                                      &quot;{subjectSearch.trim()}&quot;
                                    </span>
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* If creating new: show code field */}
                  {(isCreatingNew || newSubjectName) && !selectedSubject && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 max-w-xs">
                        <Label
                          htmlFor="new-subject-name"
                          className="text-xs font-medium text-muted-foreground mb-1 block"
                        >
                          Subject Name (new)
                        </Label>
                        <Input
                          id="new-subject-name"
                          value={newSubjectName || subjectSearch}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="e.g. Mathematics"
                          className="h-8 text-sm"
                          data-ocid="subject_allotment.new_subject_name.input"
                        />
                      </div>
                      <div className="w-32">
                        <Label
                          htmlFor="new-subject-code"
                          className="text-xs font-medium text-muted-foreground mb-1 block"
                        >
                          Subject Code
                        </Label>
                        <Input
                          id="new-subject-code"
                          value={newSubjectCode}
                          onChange={(e) =>
                            setNewSubjectCode(e.target.value.toUpperCase())
                          }
                          placeholder="MATH"
                          maxLength={10}
                          className="h-8 text-sm uppercase"
                          data-ocid="subject_allotment.new_subject_code.input"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Type toggle */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Type
                  </Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllocType("compulsory")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                      style={
                        allocType === "compulsory"
                          ? {
                              background: "var(--color-primary-light)",
                              color: "var(--color-primary)",
                              borderColor: "var(--color-primary)",
                            }
                          : {
                              background: "transparent",
                              color: "var(--color-muted-foreground)",
                              borderColor: "var(--color-border)",
                            }
                      }
                      data-ocid="subject_allotment.type_compulsory.toggle"
                    >
                      Compulsory
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocType("optional")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                      style={
                        allocType === "optional"
                          ? {
                              background: "oklch(0.7 0.18 50 / 0.12)",
                              color: "oklch(0.6 0.18 50)",
                              borderColor: "oklch(0.7 0.18 50 / 0.5)",
                            }
                          : {
                              background: "transparent",
                              color: "var(--color-muted-foreground)",
                              borderColor: "var(--color-border)",
                            }
                      }
                      data-ocid="subject_allotment.type_optional.toggle"
                    >
                      Optional
                    </button>
                  </div>
                </div>

                {/* Optional group — only shown when Optional is selected */}
                {allocType === "optional" && (
                  <div className="max-w-xs">
                    <Label
                      htmlFor="optional-group"
                      className="text-sm font-medium text-foreground mb-1.5 block"
                    >
                      Optional Group
                      <span className="text-muted-foreground font-normal text-xs ml-2">
                        (subjects with the same group name are presented as a
                        choice)
                      </span>
                    </Label>
                    <Input
                      id="optional-group"
                      value={optionalGroup}
                      onChange={(e) => setOptionalGroup(e.target.value)}
                      placeholder="e.g. Language, Second Language…"
                      data-ocid="subject_allotment.optional_group.input"
                    />
                  </div>
                )}

                <Separator />

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    disabled={adding}
                    className="gap-2"
                    data-ocid="subject_allotment.add.submit_button"
                  >
                    {adding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {adding ? "Adding…" : "Add Subject"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Subject will be added to{" "}
                    <span className="font-medium text-foreground">
                      {selectedClassName}
                    </span>
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ── Bulk Add Section ──────────────────────────────────────────── */}
          <BulkAddSection
            classId={selectedClassId}
            className={selectedClassName}
            subjects={subjects}
            onSuccess={() => loadAllocations(selectedClassId)}
          />
        </>
      )}
    </div>
  );
}

// ─── BulkAddSection ───────────────────────────────────────────────────────────

function BulkAddSection({
  classId,
  className,
  subjects,
  onSuccess,
}: {
  classId: number;
  className: string;
  subjects: SubjectDto[];
  onSuccess: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkAdding, setBulkAdding] = useState(false);

  function toggleSubject(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkAdd() {
    if (selected.size === 0) {
      toast.error("Select at least one subject");
      return;
    }
    setBulkAdding(true);
    try {
      const res = await api.post("/subject-allocations/bulk", {
        classId,
        subjectIds: Array.from(selected),
      });
      if (res.success) {
        toast.success(
          `${selected.size} subject${selected.size !== 1 ? "s" : ""} added to ${className}`,
        );
        setSelected(new Set());
        onSuccess();
      } else {
        toast.error(res.error ?? "Bulk add failed");
      }
    } catch {
      toast.error("Network error during bulk add");
    } finally {
      setBulkAdding(false);
    }
  }

  if (subjects.length === 0) return null;

  return (
    <Card data-ocid="subject_allotment.bulk_add.card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Bulk Add Subjects
          <span className="text-xs font-normal text-muted-foreground ml-1">
            — select multiple from subject master
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {subjects.map((s) => (
            <button
              key={s.subjectId}
              type="button"
              onClick={() => toggleSubject(s.subjectId)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left"
              style={
                selected.has(s.subjectId)
                  ? {
                      background: "var(--color-primary-light)",
                      borderColor: "var(--color-primary)",
                      color: "var(--color-primary)",
                    }
                  : {
                      background: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-foreground)",
                    }
              }
              data-ocid={`subject_allotment.bulk.item.${s.subjectId}`}
            >
              <span
                className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                style={
                  selected.has(s.subjectId)
                    ? {
                        background: "var(--color-primary)",
                        borderColor: "var(--color-primary)",
                        color: "white",
                      }
                    : {
                        background: "transparent",
                        borderColor: "var(--color-border)",
                      }
                }
              >
                {selected.has(s.subjectId) ? "✓" : ""}
              </span>
              <span className="truncate">{s.subjectName}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleBulkAdd}
            disabled={bulkAdding || selected.size === 0}
            className="gap-2"
            data-ocid="subject_allotment.bulk_add.submit_button"
          >
            {bulkAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {bulkAdding
              ? "Adding…"
              : `Add ${selected.size > 0 ? selected.size : ""} Selected`}
          </Button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
