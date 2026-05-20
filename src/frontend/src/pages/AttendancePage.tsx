import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  QrCode,
  RefreshCw,
  Save,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAcademicYears,
  useAttendance,
  useClasses,
  useSections,
  useStudents,
  useSubmitAttendance,
} from "../hooks/useQueries";
import type {
  AcademicYearDto,
  ClassDto,
  SectionDto,
} from "../hooks/useQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = "Present" | "Absent" | "Late";

const STATUS_OPTIONS: AttendanceStatus[] = ["Present", "Absent", "Late"];

const statusConfig: Record<
  AttendanceStatus,
  {
    label: string;
    activeClass: string;
    inactiveClass: string;
    dot: string;
    rowBg: string;
    summaryBg: string;
    summaryText: string;
    summaryBorder: string;
  }
> = {
  Present: {
    label: "Present",
    activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-sm",
    inactiveClass:
      "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50",
    dot: "bg-emerald-500",
    rowBg: "",
    summaryBg: "bg-emerald-50",
    summaryText: "text-emerald-700",
    summaryBorder: "border-emerald-200",
  },
  Absent: {
    label: "Absent",
    activeClass: "bg-red-500 text-white border-red-500 shadow-sm",
    inactiveClass:
      "border-border text-muted-foreground hover:border-red-400 hover:text-red-600 hover:bg-red-50",
    dot: "bg-red-500",
    rowBg: "bg-red-500/5",
    summaryBg: "bg-red-50",
    summaryText: "text-red-700",
    summaryBorder: "border-red-200",
  },
  Late: {
    label: "Late",
    activeClass: "bg-amber-500 text-white border-amber-500 shadow-sm",
    inactiveClass:
      "border-border text-muted-foreground hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50",
    dot: "bg-amber-500",
    rowBg: "bg-amber-500/5",
    summaryBg: "bg-amber-50",
    summaryText: "text-amber-700",
    summaryBorder: "border-amber-200",
  },
};

const avatarColors = [
  "bg-primary/20 text-primary",
  "bg-emerald-500/20 text-emerald-600",
  "bg-amber-500/20 text-amber-600",
  "bg-red-500/20 text-red-600",
  "bg-purple-500/20 text-purple-600",
  "bg-cyan-500/20 text-cyan-600",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function getDtoId(dto: AcademicYearDto | ClassDto | SectionDto): number {
  return (dto as { Id?: number }).Id ?? (dto as { id?: number }).id ?? 0;
}

function getAcademicYearLabel(dto: AcademicYearDto): string {
  return dto.YearLabel ?? dto.yearLabel ?? String(getDtoId(dto));
}

function getClassName(dto: ClassDto): string {
  return dto.ClassName ?? dto.className ?? `Class ${getDtoId(dto)}`;
}

function getSectionName(dto: SectionDto): string {
  return dto.SectionName ?? dto.sectionName ?? `Section ${getDtoId(dto)}`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function AttendanceRowSkeleton() {
  return (
    <div className="p-5 space-y-3" data-ocid="attendance.loading_state">
      {[1, 2, 3, 4, 5].map((k) => (
        <div key={k} className="flex items-center gap-4 px-2">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AttendancePage() {
  const today = new Date().toISOString().split("T")[0];

  // ── Filter state (uncontrolled refs drive selects) ────────────────────────
  const [date, setDate] = useState(today);

  // Selected IDs (committed on "Load Attendance")
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  // Committed values (what the current attendance grid is for)
  const [committedClassId, setCommittedClassId] = useState<string>("");
  const [committedSection, setCommittedSection] = useState<string>("");
  const [committedDate, setCommittedDate] = useState("");

  // Track whether user has loaded attendance at least once
  const [hasLoaded, setHasLoaded] = useState(false);

  // Uncontrolled dropdown refs (immune to React state resets)
  const yearSelectRef = useRef<HTMLSelectElement>(null);
  const classSelectRef = useRef<HTMLSelectElement>(null);
  const sectionSelectRef = useRef<HTMLSelectElement>(null);

  // Attendance marks
  const [localAttendance, setLocalAttendance] = useState<
    Record<string, AttendanceStatus>
  >({});

  // QR
  const [qrInput, setQrInput] = useState("");
  const [scanHistory, setScanHistory] = useState<
    { id: string; name: string; time: string }[]
  >([]);

  // ── Data fetches ──────────────────────────────────────────────────────────
  const yearsQuery = useAcademicYears();
  const classesQuery = useClasses(
    selectedYearId ? Number(selectedYearId) : undefined,
  );
  const sectionsQuery = useSections(
    selectedClassId ? Number(selectedClassId) : undefined,
  );

  // Students: always fetch for current committed class/section
  const studentsQuery = useStudents(
    committedClassId && committedSection
      ? {
          classId: Number(committedClassId),
          section: committedSection,
          limit: 200,
        }
      : undefined,
  );

  // Existing attendance records
  const attendanceQuery = useAttendance(
    committedClassId,
    committedSection,
    committedDate,
  );

  const submitMutation = useSubmitAttendance();

  // ── Reset classes when year changes ──────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    setSelectedClassId("");
    setSelectedSection("");
    if (classSelectRef.current) classSelectRef.current.value = "";
    if (sectionSelectRef.current) sectionSelectRef.current.value = "";
  }, [selectedYearId]);

  // ── Reset sections when class changes ────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    setSelectedSection("");
    if (sectionSelectRef.current) sectionSelectRef.current.value = "";
  }, [selectedClassId]);

  // ── Pre-fill existing attendance ──────────────────────────────────────────
  useEffect(() => {
    if (attendanceQuery.data && attendanceQuery.data.length > 0) {
      const map: Record<string, AttendanceStatus> = {};
      for (const r of attendanceQuery.data) {
        if (r.studentId) {
          const raw = r.status ?? "Present";
          const normalized =
            raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
          map[String(r.studentId)] =
            (normalized as AttendanceStatus) in statusConfig
              ? (normalized as AttendanceStatus)
              : "Present";
        }
      }
      setLocalAttendance(map);
    }
  }, [attendanceQuery.data]);

  // ── Normalize students ────────────────────────────────────────────────────
  const students = (studentsQuery.data?.data ?? []).map((s) => ({
    id: String(s.studentId),
    name: s.fullName,
    rollNo: s.enrollmentNo || String(s.studentId),
  }));

  const total = students.length;
  const counts = students.reduce(
    (acc, s) => {
      const status: AttendanceStatus = localAttendance[s.id] ?? "Present";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    { Present: 0, Absent: 0, Late: 0 } as Record<AttendanceStatus, number>,
  );
  const presentPct = total > 0 ? Math.round((counts.Present / total) * 100) : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedYearId(e.target.value);
  }

  function handleClassChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedClassId(e.target.value);
  }

  function handleSectionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedSection(e.target.value);
  }

  function handleLoad() {
    const classId = classSelectRef.current?.value ?? selectedClassId;
    const section = sectionSelectRef.current?.value ?? selectedSection;
    if (!classId) {
      toast.error("Please select a class");
      return;
    }
    if (!section) {
      toast.error("Please select a section");
      return;
    }
    setLocalAttendance({});
    setCommittedClassId(classId);
    setCommittedSection(section);
    setCommittedDate(date);
    setHasLoaded(true);
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setLocalAttendance((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAllPresent() {
    const map: Record<string, AttendanceStatus> = {};
    for (const s of students) map[s.id] = "Present";
    setLocalAttendance(map);
    toast.success(`All ${students.length} students marked Present`);
  }

  async function handleSubmit() {
    if (!committedClassId || !committedSection) {
      toast.error("Load attendance before saving");
      return;
    }
    const records = students.map((s) => ({
      studentId: s.id,
      status: (localAttendance[s.id] ?? "Present").toLowerCase() as
        | "present"
        | "absent"
        | "late",
    }));
    try {
      await submitMutation.mutateAsync({
        date: committedDate,
        classId: Number(committedClassId),
        sectionId: committedSection,
        records,
      });
      toast.success("Attendance saved!", {
        description: `${counts.Present} present · ${counts.Absent} absent · ${counts.Late} late`,
      });
    } catch (err) {
      toast.error("Failed to save attendance", {
        description: (err as Error).message,
      });
    }
  }

  function handleQrScan() {
    const trimmed = qrInput.trim();
    if (!trimmed) return;
    const student = students.find(
      (s) => s.id === trimmed || s.rollNo === trimmed,
    );
    if (!student) {
      toast.error(`Student ID "${trimmed}" not found in this class`);
      return;
    }
    setStatus(student.id, "Present");
    setScanHistory((prev) => [
      {
        id: student.id,
        name: student.name,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
    toast.success(`${student.name} marked Present via QR`);
    setQrInput("");
  }

  // ── Helper: selected class name label ─────────────────────────────────────
  const selectedClassLabel = committedClassId
    ? (classesQuery.data?.find(
        (c) => String(getDtoId(c)) === committedClassId,
      ) ?? null)
    : null;
  const gridLabel = selectedClassLabel
    ? `${getClassName(selectedClassLabel)} — ${committedSection}`
    : "Attendance";

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statCards = [
    {
      label: "Total",
      value: total,
      icon: Users,
      color: "text-primary",
      iconBg: "bg-primary/10",
      border: "border-primary/15",
    },
    {
      label: "Present",
      value: counts.Present,
      icon: CheckCircle2,
      color: "text-emerald-600",
      iconBg: "bg-emerald-100",
      border: "border-emerald-200",
    },
    {
      label: "Absent",
      value: counts.Absent,
      icon: XCircle,
      color: "text-red-600",
      iconBg: "bg-red-100",
      border: "border-red-200",
    },
    {
      label: "Late",
      value: counts.Late,
      icon: Clock,
      color: "text-amber-600",
      iconBg: "bg-amber-100",
      border: "border-amber-200",
    },
  ];

  const isGridLoading = studentsQuery.isPending && hasLoaded;
  const canLoad =
    !!(selectedClassId || classSelectRef.current?.value) &&
    !!(selectedSection || sectionSelectRef.current?.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, type: "tween", ease: "easeOut" }}
      className="space-y-6"
    >
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
            Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hasLoaded && committedClassId
              ? `Marking for ${gridLabel}`
              : "Select class and section to begin"}
          </p>
        </div>
      </div>

      {/* ── Step 1: Selector Panel ────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
            1
          </div>
          <h2 className="text-sm font-bold text-foreground">
            Select Class &amp; Section
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Academic Year */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              htmlFor="att-year"
            >
              Academic Year
            </label>
            <div className="relative">
              <select
                ref={yearSelectRef}
                defaultValue=""
                onChange={handleYearChange}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-muted/30 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 appearance-none transition-shadow"
                data-ocid="attendance.year.select"
                id="att-year"
              >
                <option value="">All Years</option>
                {(yearsQuery.data ?? []).map((y) => (
                  <option key={getDtoId(y)} value={String(getDtoId(y))}>
                    {getAcademicYearLabel(y)}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground rotate-90 pointer-events-none" />
            </div>
          </div>

          {/* Class */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              htmlFor="att-class"
            >
              Class <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                ref={classSelectRef}
                defaultValue=""
                onChange={handleClassChange}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-muted/30 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 appearance-none transition-shadow"
                data-ocid="attendance.class.select"
                id="att-class"
              >
                <option value="">Select class…</option>
                {(classesQuery.data ?? []).map((c) => (
                  <option key={getDtoId(c)} value={String(getDtoId(c))}>
                    {getClassName(c)}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground rotate-90 pointer-events-none" />
            </div>
            {classesQuery.isPending && (
              <p className="text-xs text-muted-foreground">Loading classes…</p>
            )}
          </div>

          {/* Section */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              htmlFor="att-section"
            >
              Section <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                ref={sectionSelectRef}
                defaultValue=""
                onChange={handleSectionChange}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-muted/30 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 appearance-none transition-shadow"
                data-ocid="attendance.section.select"
                id="att-section"
              >
                <option value="">Select section…</option>
                {(sectionsQuery.data ?? []).map((sec) => (
                  <option key={getDtoId(sec)} value={getSectionName(sec)}>
                    {getSectionName(sec)}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground rotate-90 pointer-events-none" />
            </div>
            {sectionsQuery.isPending && selectedClassId && (
              <p className="text-xs text-muted-foreground">Loading sections…</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="att-date"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Date
            </label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-muted/30">
              <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
              <input
                id="att-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 text-sm bg-transparent text-foreground outline-none min-w-0"
                data-ocid="attendance.date.input"
              />
            </div>
          </div>

          {/* Load button */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-transparent uppercase tracking-wide select-none"
              htmlFor="att-load-btn"
            >
              &nbsp;
            </label>
            <Button
              type="button"
              onClick={handleLoad}
              disabled={!canLoad}
              className="w-full h-10 btn-school-primary gap-2"
              data-ocid="attendance.load.button"
            >
              {isGridLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> Load Attendance
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Summary Strip (only after first load) ─────────────────────────── */}
      {hasLoaded && !isGridLoading && total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-3 border border-white/30 shadow-card flex items-center gap-4 flex-wrap"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary" />
            {total} students · {gridLabel}
          </div>
          <div className="flex-1 h-px bg-border" />
          {STATUS_OPTIONS.map((s) => (
            <span
              key={s}
              className={`badge-premium ${statusConfig[s].summaryBg} ${statusConfig[s].summaryText} border ${statusConfig[s].summaryBorder} gap-1.5`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusConfig[s].dot}`}
              />
              {counts[s]} {statusConfig[s].label}
            </span>
          ))}
          <div className="text-xs font-bold text-primary">
            {presentPct}% Attendance
          </div>
        </motion.div>
      )}

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      {hasLoaded && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, type: "tween" }}
              className={`bg-card rounded-2xl border ${card.border} shadow-card p-5 relative overflow-hidden hover-lift card-premium`}
              data-ocid={`attendance.${card.label.toLowerCase()}.card`}
            >
              <div
                className={`absolute top-0 right-0 w-16 h-16 rounded-full ${card.iconBg} blur-2xl opacity-50 translate-x-4 -translate-y-4`}
              />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {card.label}
                  </p>
                  {isGridLoading ? (
                    <Skeleton className="h-9 w-14 mt-1" />
                  ) : (
                    <p
                      className={`text-4xl font-bold text-foreground mt-1 font-display ${card.color}`}
                    >
                      {card.value}
                    </p>
                  )}
                  {card.label === "Present" && !isGridLoading && total > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {presentPct}% rate
                    </p>
                  )}
                </div>
                <div
                  className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="daily">
        <TabsList className="bg-muted/60 p-1" data-ocid="attendance.tab">
          <TabsTrigger value="daily">Daily Marking</TabsTrigger>
          <TabsTrigger value="qr">QR / Biometric</TabsTrigger>
        </TabsList>

        {/* ── Daily Marking Tab ──────────────────────────────────────────── */}
        <TabsContent value="daily" className="mt-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, type: "tween" }}
            className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
          >
            {/* Card header */}
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted/30 to-transparent flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-foreground font-display">
                  {hasLoaded ? gridLabel : "Daily Attendance"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasLoaded && committedDate
                    ? new Date(committedDate).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Select class and section, then click Load Attendance"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasLoaded && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-card font-mono"
                  >
                    {students.length} students
                  </Badge>
                )}
                {students.length > 0 && !isGridLoading && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={markAllPresent}
                    className="text-xs h-8 gap-1.5 rounded-xl hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-fast"
                    data-ocid="attendance.mark_all_present.button"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark All Present
                  </Button>
                )}
              </div>
            </div>

            {/* Step 2 body */}
            {!hasLoaded ? (
              <div
                className="text-center py-20 text-muted-foreground"
                data-ocid="attendance.prompt_state"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 opacity-30" />
                </div>
                <p className="font-bold text-base text-foreground">
                  No attendance loaded yet
                </p>
                <p className="text-sm mt-1 text-muted-foreground/70">
                  Choose a class and section above, then click Load Attendance.
                </p>
              </div>
            ) : isGridLoading ? (
              <AttendanceRowSkeleton />
            ) : students.length === 0 ? (
              <div
                className="text-center py-20 text-muted-foreground"
                data-ocid="attendance.empty_state"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 opacity-30" />
                </div>
                <p className="font-bold text-base text-foreground">
                  No students found
                </p>
                <p className="text-sm mt-1 text-muted-foreground/70">
                  No students enrolled in this class and section.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {students.map((student, i) => {
                  const status: AttendanceStatus =
                    localAttendance[student.id] ?? "Present";
                  const colorCls = avatarColors[i % avatarColors.length];
                  const cfg = statusConfig[status];
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.025 * i, type: "tween" }}
                      className={`flex items-center gap-4 px-6 py-3.5 table-row-hover stagger-item transition-colors ${cfg.rowBg}`}
                      data-ocid={`attendance.item.${i + 1}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-xl ${colorCls} flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-subtle`}
                      >
                        {getInitials(student.name)}
                      </div>

                      {/* Name + roll */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          #{String(student.rollNo).padStart(2, "0")}
                        </p>
                      </div>

                      {/* Status buttons */}
                      <div className="flex items-center gap-1.5">
                        {STATUS_OPTIONS.map((s) => {
                          const sCfg = statusConfig[s];
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(student.id, s)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                                status === s
                                  ? sCfg.activeClass
                                  : sCfg.inactiveClass
                              }`}
                              data-ocid={`attendance.${s.toLowerCase()}.toggle`}
                            >
                              {sCfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Footer: summary + sticky save */}
            {hasLoaded && (
              <div className="sticky bottom-0 px-6 py-4 bg-card border-t border-border shadow-subtle flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {STATUS_OPTIONS.map((s) => (
                    <span
                      key={s}
                      className={`badge-premium ${statusConfig[s].summaryBg} ${statusConfig[s].summaryText} border ${statusConfig[s].summaryBorder} gap-1.5`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig[s].dot}`}
                      />
                      {counts[s]} {statusConfig[s].label}
                    </span>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || students.length === 0}
                  className="gap-2 btn-school-primary hover-lift flex-shrink-0"
                  data-ocid="attendance.submit_button"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Attendance
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ── QR Tab ──────────────────────────────────────────────────────── */}
        <TabsContent value="qr" className="mt-5">
          <div className="grid lg:grid-cols-2 gap-5">
            {/* QR scan input */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground font-display">
                    QR / Biometric Scan
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Scan or paste a student ID to mark Present
                  </p>
                </div>
              </div>
              {!hasLoaded && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Load a class first from Step 1 above to enable QR scanning.
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQrScan()}
                  placeholder="Scan or paste student ID…"
                  disabled={!hasLoaded}
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow input-premium disabled:opacity-50"
                  data-ocid="attendance.qr.input"
                />
                <Button
                  type="button"
                  onClick={handleQrScan}
                  disabled={!hasLoaded}
                  className="btn-school-primary rounded-xl"
                  data-ocid="attendance.qr.submit_button"
                >
                  Mark Present
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Tip: Enter the student enrollment number or ID.
              </p>
            </div>

            {/* Scan history */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-6">
              <h2 className="font-bold text-foreground font-display mb-4">
                Scan History
              </h2>
              {scanHistory.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="attendance.qr.empty_state"
                >
                  <QrCode className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No scans yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Scanned students will appear here in real-time
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scanHistory.map((s, i) => (
                    <motion.div
                      key={`${s.id}-${i}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/30 border border-border/50 hover-lift card-premium"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {s.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {s.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          Present
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
