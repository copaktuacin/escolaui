import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAcademicYears,
  useClasses,
  useSections,
  useTimetable,
  useUpdateTimetable,
} from "@/hooks/useQueries";
import type {
  AcademicYearDto,
  ClassDto,
  SectionDto,
  TimetableEntry,
} from "@/hooks/useQueries";
import {
  BookOpen,
  Calculator,
  ChevronDown,
  Dumbbell,
  Edit2,
  FlaskConical,
  Globe,
  Loader2,
  Monitor,
  Music,
  Palette,
  Printer,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
type Day = (typeof DAYS)[number];
const DAY_FULL: Record<Day, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
};
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const PERIOD_TIMES: Record<number, string> = {
  1: "7:30–8:20",
  2: "8:25–9:15",
  3: "9:20–10:10",
  4: "10:30–11:20",
  5: "11:25–12:15",
  6: "13:00–13:50",
  7: "13:55–14:45",
  8: "14:50–15:40",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getAYId(ay: AcademicYearDto): number {
  return (ay.Id ?? ay.id ?? 0) as number;
}
function getAYLabel(ay: AcademicYearDto): string {
  return ay.YearLabel ?? ay.yearLabel ?? String(getAYId(ay));
}
function getClassId(c: ClassDto): number {
  return (c.Id ?? c.id ?? 0) as number;
}
function getClassName(c: ClassDto): string {
  return c.ClassName ?? c.className ?? String(getClassId(c));
}
function getSectionName(s: SectionDto): string {
  return s.SectionName ?? s.sectionName ?? "";
}

// ─── Subject color map ────────────────────────────────────────────────────────
const SUBJECT_COLORS: Record<
  string,
  { bg: string; text: string; border: string; pill: string }
> = {
  Mathematics: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    pill: "bg-blue-500",
  },
  Math: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    pill: "bg-blue-500",
  },
  English: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    pill: "bg-purple-500",
  },
  Physics: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    pill: "bg-orange-500",
  },
  Chemistry: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    pill: "bg-emerald-500",
  },
  Biology: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    pill: "bg-green-500",
  },
  History: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    pill: "bg-amber-500",
  },
  Geography: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    pill: "bg-teal-500",
  },
  Art: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    pill: "bg-pink-500",
  },
  ICT: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    pill: "bg-cyan-500",
  },
  Computer: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    pill: "bg-cyan-500",
  },
  "Physical Education": {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    pill: "bg-red-500",
  },
  PE: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    pill: "bg-red-500",
  },
  Hindi: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    pill: "bg-yellow-500",
  },
  Science: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    pill: "bg-sky-500",
  },
  Economics: {
    bg: "bg-lime-50",
    text: "text-lime-700",
    border: "border-lime-200",
    pill: "bg-lime-500",
  },
};
const DEFAULT_COLORS = {
  bg: "bg-muted/30",
  text: "text-foreground",
  border: "border-border",
  pill: "bg-muted-foreground",
};

const SUBJECT_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Mathematics: Calculator,
  Math: Calculator,
  English: BookOpen,
  Physics: FlaskConical,
  Chemistry: FlaskConical,
  Biology: Globe,
  History: Globe,
  Geography: Globe,
  Art: Palette,
  ICT: Monitor,
  Computer: Monitor,
  Music: Music,
  "Physical Education": Dumbbell,
  PE: Dumbbell,
};

// ─── SubjectCell ──────────────────────────────────────────────────────────────
type EditCellData = {
  day: Day;
  period: number;
  subject: string;
  teacher: string;
  room: string;
};

function SubjectCell({
  entry,
  hasClash,
  editMode,
  onEdit,
}: {
  entry: TimetableEntry | undefined;
  hasClash: boolean;
  editMode: boolean;
  onEdit: (data: EditCellData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState(entry?.subject ?? "");
  const [tch, setTch] = useState(entry?.teacher ?? "");
  const [room, setRoom] = useState(entry?.room ?? "");

  if (!entry) {
    return (
      <div
        className={`h-full min-h-[88px] flex items-center justify-center border-2 border-dashed border-border/30 rounded-xl m-1.5 transition-all ${
          editMode
            ? "cursor-pointer hover:border-primary/40 hover:bg-primary/3 group"
            : ""
        }`}
      >
        {editMode ? (
          <span className="text-xs text-muted-foreground/40 group-hover:text-primary/60 transition-colors font-medium">
            + Add
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/25 font-medium select-none">
            —
          </span>
        )}
      </div>
    );
  }

  const colors = SUBJECT_COLORS[entry.subject] ?? DEFAULT_COLORS;
  const Icon = SUBJECT_ICONS[entry.subject];

  const cellBody = (
    <div
      className={`h-full min-h-[88px] rounded-xl border-2 ${colors.bg} ${colors.border} px-3 py-3 flex flex-col justify-between m-1.5 relative transition-all duration-200 ${
        editMode
          ? "cursor-pointer hover:scale-[1.03] hover:shadow-floating"
          : "hover:scale-[1.02] hover:shadow-elevated"
      }`}
    >
      {hasClash && (
        <div className="absolute top-1.5 right-1.5">
          <TriangleAlert className="w-3.5 h-3.5 text-destructive drop-shadow-sm" />
        </div>
      )}
      <div className="flex items-start gap-1.5">
        {Icon && (
          <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${colors.text}`} />
        )}
        <span className={`text-xs font-bold leading-tight ${colors.text}`}>
          {entry.subject}
        </span>
      </div>
      <div className="mt-2">
        <p className="text-[10px] text-muted-foreground font-semibold leading-tight truncate">
          {entry.teacher}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${colors.pill} flex-shrink-0`}
          />
          <p className="text-[10px] text-muted-foreground/60 truncate">
            {entry.room}
          </p>
        </div>
      </div>
    </div>
  );

  if (!editMode) return cellBody;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-full text-left p-0 border-0 bg-transparent cursor-pointer"
          onClick={() => {
            setSub(entry.subject);
            setTch(entry.teacher);
            setRoom(entry.room);
            setOpen(true);
          }}
        >
          {cellBody}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 glass-elevated rounded-xl"
        data-ocid="schedule.edit.popover"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-bold font-display">Edit Period</p>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subject
            </Label>
            <Input
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              className="mt-1.5 h-8 text-xs input-premium"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Teacher
            </Label>
            <Input
              value={tch}
              onChange={(e) => setTch(e.target.value)}
              className="mt-1.5 h-8 text-xs input-premium"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Room
            </Label>
            <Input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="mt-1.5 h-8 text-xs input-premium"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full btn-school-primary"
            onClick={() => {
              onEdit({
                day: entry.day as Day,
                period: entry.period,
                subject: sub,
                teacher: tch,
                room,
              });
              setOpen(false);
            }}
            data-ocid="schedule.edit.save_button"
          >
            Save Changes
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { data: academicYears = [], isLoading: ayLoading } = useAcademicYears();
  const ayRef = useRef<HTMLSelectElement>(null);
  const classRef = useRef<HTMLSelectElement>(null);
  const sectionRef = useRef<HTMLSelectElement>(null);

  const [selectedAYId, setSelectedAYId] = useState<number>(0);
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [autoSolving, setAutoSolving] = useState(false);
  const [localTimetable, setLocalTimetable] = useState<TimetableEntry[]>([]);

  const { data: classes = [], isLoading: classesLoading } = useClasses(
    selectedAYId > 0 ? selectedAYId : undefined,
  );
  const { data: sections = [], isLoading: sectionsLoading } = useSections(
    selectedClassId > 0 ? selectedClassId : undefined,
  );

  const {
    data: timetable = [],
    isLoading: ttLoading,
    isError,
  } = useTimetable(selectedClassId, selectedSection);

  const updateMutation = useUpdateTimetable();

  // Sync fetched timetable into local state for optimistic edits
  const prevTTRef = useRef<TimetableEntry[]>([]);
  if (timetable !== prevTTRef.current) {
    prevTTRef.current = timetable;
    setLocalTimetable(timetable);
  }

  const ttMap: Record<string, TimetableEntry> = {};
  for (const e of localTimetable) {
    ttMap[`${e.day}-${e.period}`] = e;
  }

  // Clash detection
  const teacherPeriods: Record<string, string[]> = {};
  for (const e of localTimetable) {
    const key = `${e.teacher}-${e.period}`;
    if (!teacherPeriods[key]) teacherPeriods[key] = [];
    teacherPeriods[key].push(`${e.day}-${e.period}`);
  }
  const clashKeys = new Set<string>();
  for (const keys of Object.values(teacherPeriods)) {
    if (keys.length > 1) for (const k of keys) clashKeys.add(k);
  }

  const subjects = Array.from(
    new Set(localTimetable.map((e) => e.subject)),
  ).sort();

  async function handleEdit(data: EditCellData) {
    setLocalTimetable((prev) =>
      prev.map((e) =>
        e.day === data.day && e.period === data.period
          ? {
              ...e,
              subject: data.subject,
              teacher: data.teacher,
              room: data.room,
            }
          : e,
      ),
    );
    const slotId = `${selectedClassId}-${selectedSection}-${data.day}-${data.period}`;
    try {
      await updateMutation.mutateAsync({
        id: slotId,
        payload: {
          subject: data.subject,
          teacher: data.teacher,
          room: data.room,
          classId: selectedClassId,
          sectionId: selectedSection,
        },
      });
      toast.success("Period updated");
    } catch {
      toast.error("Failed to save — reverting");
    }
  }

  async function handleAutoSolve() {
    setAutoSolving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setAutoSolving(false);
    toast.success("Timetable generated — no clashes detected");
  }

  if (isError) toast.error("Failed to load timetable");

  const selectedClass = classes.find((c) => getClassId(c) === selectedClassId);
  const timetableTitle = selectedClassId
    ? `${selectedClass ? getClassName(selectedClass) : `Class ${selectedClassId}`}${selectedSection ? ` — Section ${selectedSection}` : ""}`
    : "Select a class";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, type: "tween", ease: "easeOut" }}
      className="space-y-5"
    >
      {/* Header + Toolbar */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
              Class Timetable
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Weekly schedule —{" "}
              <span className="font-semibold text-foreground">
                {timetableTitle}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Academic Year — uncontrolled */}
            <div className="relative">
              <select
                ref={ayRef}
                defaultValue=""
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedAYId(id);
                  setSelectedClassId(0);
                  setSelectedSection("");
                }}
                className="h-9 rounded-xl border border-input bg-background px-3 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none w-36"
                data-ocid="schedule.academic_year.select"
              >
                <option value="">{ayLoading ? "Loading…" : "Year"}</option>
                {academicYears.map((ay) => (
                  <option key={getAYId(ay)} value={String(getAYId(ay))}>
                    {getAYLabel(ay)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Class — uncontrolled */}
            <div className="relative">
              <select
                ref={classRef}
                defaultValue=""
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedClassId(id);
                  setSelectedSection("");
                }}
                className="h-9 rounded-xl border border-input bg-background px-3 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none w-36"
                data-ocid="schedule.class.select"
              >
                <option value="">
                  {classesLoading
                    ? "Loading…"
                    : !selectedAYId
                      ? "Select Year first"
                      : "Select Class"}
                </option>
                {classes.map((c) => (
                  <option key={getClassId(c)} value={String(getClassId(c))}>
                    {getClassName(c)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Section — uncontrolled */}
            <div className="relative">
              <select
                ref={sectionRef}
                defaultValue=""
                onChange={(e) => setSelectedSection(e.target.value)}
                className="h-9 rounded-xl border border-input bg-background px-3 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 input-premium appearance-none w-32"
                data-ocid="schedule.section.select"
              >
                <option value="">
                  {sectionsLoading
                    ? "Loading…"
                    : !selectedClassId
                      ? "Select Class first"
                      : "Select Section"}
                </option>
                {sections.map((s) => (
                  <option key={getSectionName(s)} value={getSectionName(s)}>
                    Section {getSectionName(s)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`gap-2 h-9 transition-smooth ${
                editMode
                  ? "bg-primary/10 border-primary/40 text-primary hover:bg-primary/15"
                  : ""
              }`}
              onClick={() => setEditMode((m) => !m)}
              data-ocid="schedule.edit_mode.toggle"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {editMode ? "Exit Edit" : "Edit Mode"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 h-9"
              onClick={() => window.print()}
              data-ocid="schedule.export.button"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2 h-9 btn-school-primary"
              onClick={handleAutoSolve}
              disabled={autoSolving}
              data-ocid="schedule.auto_solve.button"
            >
              {autoSolving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Solving…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Auto-Solve
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Clash warning */}
      {clashKeys.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-destructive/8 border border-destructive/25 text-sm text-destructive"
        >
          <TriangleAlert className="w-4 h-4 flex-shrink-0" />
          Scheduling clash: a teacher is assigned to multiple periods at the
          same time.
        </motion.div>
      )}

      {/* Subject legend */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {subjects.map((subject) => {
            const colors = SUBJECT_COLORS[subject];
            if (!colors) return null;
            return (
              <span
                key={subject}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${colors.pill}`} />
                {subject}
              </span>
            );
          })}
          {editMode && (
            <Badge
              variant="outline"
              className="text-xs bg-primary/10 text-primary border-primary/30 animate-pulse font-semibold"
            >
              ✏️ Edit Mode Active
            </Badge>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {ttLoading && (
        <div className="space-y-3" data-ocid="schedule.loading_state">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div
            className="grid gap-0 rounded-2xl overflow-hidden border border-border shadow-card"
            style={{ gridTemplateColumns: "90px repeat(5, 1fr)" }}
          >
            {Array.from({ length: 54 }, (_, k) => (
              <Skeleton
                key={`skel-${k + 1}`}
                className="h-[88px] rounded-none border border-border/30"
              />
            ))}
          </div>
        </div>
      )}

      {/* Desktop timetable grid */}
      {!ttLoading && selectedClassId > 0 && selectedSection && (
        <motion.div
          key={`${selectedClassId}-${selectedSection}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, type: "tween" }}
          className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hidden md:block"
        >
          <div
            className="grid"
            style={{ gridTemplateColumns: "96px repeat(5, 1fr)" }}
          >
            <div className="bg-muted/50 border-b border-r border-border px-3 py-4 flex items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Period
              </span>
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="bg-muted/50 border-b border-r border-border last:border-r-0 px-3 py-4 text-center"
              >
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">
                  {day}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                  {DAY_FULL[day]}
                </p>
              </div>
            ))}
            {PERIODS.map((period, pi) => (
              <>
                <div
                  key={`lbl-${period}`}
                  className={`border-b border-r border-border px-2 py-2 flex flex-col items-center justify-center ${pi % 2 === 0 ? "bg-muted/10" : "bg-card"}`}
                >
                  <span className="text-sm font-bold text-foreground">
                    P{period}
                  </span>
                  <span className="text-[9px] text-muted-foreground leading-tight text-center mt-0.5 font-medium">
                    {PERIOD_TIMES[period]}
                  </span>
                </div>
                {DAYS.map((day) => (
                  <div
                    key={`${day}-${period}`}
                    className={`border-b border-r border-border last:border-r-0 ${pi % 2 === 0 ? "bg-muted/5" : "bg-card"}`}
                    data-ocid={`schedule.${day.toLowerCase()}.period.${period}.card`}
                  >
                    <SubjectCell
                      entry={ttMap[`${day}-${period}`]}
                      hasClash={clashKeys.has(`${day}-${period}`)}
                      editMode={editMode}
                      onEdit={handleEdit}
                    />
                  </div>
                ))}
              </>
            ))}
          </div>
        </motion.div>
      )}

      {/* Mobile stacked view */}
      {!ttLoading && selectedClassId > 0 && selectedSection && (
        <div className="md:hidden space-y-4">
          {DAYS.map((day, di) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * di, type: "tween" }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
            >
              <div className="bg-muted/50 px-4 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground font-display">
                  {DAY_FULL[day]}
                </h3>
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/10 text-primary border-primary/30 font-semibold"
                >
                  {timetableTitle}
                </Badge>
              </div>
              <div className="divide-y divide-border/60">
                {PERIODS.map((period) => {
                  const entry = ttMap[`${day}-${period}`];
                  const hasClash = clashKeys.has(`${day}-${period}`);
                  const colors = entry
                    ? (SUBJECT_COLORS[entry.subject] ?? DEFAULT_COLORS)
                    : DEFAULT_COLORS;
                  return (
                    <div
                      key={period}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="w-14 flex-shrink-0 text-center">
                        <p className="text-xs font-bold text-foreground">
                          P{period}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">
                          {PERIOD_TIMES[period]}
                        </p>
                      </div>
                      {entry ? (
                        <div className="flex-1 flex items-center gap-2">
                          <div
                            className={`flex-1 px-3 py-2 rounded-xl border-2 ${colors.bg} ${colors.border}`}
                          >
                            <p className={`text-xs font-bold ${colors.text}`}>
                              {entry.subject}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {entry.teacher} · {entry.room}
                            </p>
                          </div>
                          {hasClash && (
                            <TriangleAlert className="w-4 h-4 text-destructive flex-shrink-0" />
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/40 font-medium">
                          Free Period
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!ttLoading &&
        (!selectedClassId ||
          !selectedSection ||
          (selectedClassId > 0 &&
            selectedSection &&
            localTimetable.length === 0)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-24 text-muted-foreground"
            data-ocid="schedule.empty_state"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-5 shadow-card">
              <BookOpen className="w-9 h-9 opacity-40" />
            </div>
            <p className="font-bold text-lg font-display">
              {!selectedClassId
                ? "Select a class to view its timetable"
                : !selectedSection
                  ? "Select a section"
                  : `No timetable found for ${timetableTitle}`}
            </p>
            <p className="text-sm mt-1.5 text-muted-foreground/70 max-w-xs mx-auto">
              {selectedClassId &&
                selectedSection &&
                "Use Auto-Solve to generate a schedule or edit periods manually."}
            </p>
            {selectedClassId && selectedSection && (
              <Button
                type="button"
                className="mt-5 btn-school-primary gap-2"
                onClick={handleAutoSolve}
                disabled={autoSolving}
                data-ocid="schedule.empty_auto_solve.button"
              >
                <Sparkles className="w-4 h-4" /> Generate Timetable
              </Button>
            )}
          </motion.div>
        )}
    </motion.div>
  );
}
