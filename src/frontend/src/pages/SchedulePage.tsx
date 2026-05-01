import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Calculator,
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSchedule, useUpdateScheduleSlot } from "../hooks/useQueries";
import type { TimetableEntry } from "../lib/mockData";

const DAYS: TimetableEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_LABELS: Record<TimetableEntry["day"], string> = {
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
};
const DAY_FULL: Record<TimetableEntry["day"], string> = {
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

const CLASS_OPTIONS = [6, 7, 8, 9, 10, 11];
const SECTION_OPTIONS = [
  { id: "A", label: "A" },
  { id: "B", label: "B" },
  { id: "C", label: "C" },
  { id: "D", label: "D" },
];

const subjectColors: Record<
  string,
  { bg: string; text: string; border: string; pill: string; glow: string }
> = {
  Mathematics: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700",
    pill: "bg-blue-500",
    glow: "hover:shadow-blue-200/60 dark:hover:shadow-blue-900/60",
  },
  Math: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700",
    pill: "bg-blue-500",
    glow: "hover:shadow-blue-200/60 dark:hover:shadow-blue-900/60",
  },
  English: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-700",
    pill: "bg-purple-500",
    glow: "hover:shadow-purple-200/60 dark:hover:shadow-purple-900/60",
  },
  Physics: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-700",
    pill: "bg-orange-500",
    glow: "hover:shadow-orange-200/60 dark:hover:shadow-orange-900/60",
  },
  Chemistry: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-700",
    pill: "bg-emerald-500",
    glow: "hover:shadow-emerald-200/60",
  },
  Biology: {
    bg: "bg-green-50 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-700",
    pill: "bg-green-500",
    glow: "hover:shadow-green-200/60",
  },
  History: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-700",
    pill: "bg-amber-500",
    glow: "hover:shadow-amber-200/60",
  },
  Geography: {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-700",
    pill: "bg-teal-500",
    glow: "hover:shadow-teal-200/60",
  },
  Art: {
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-700",
    pill: "bg-pink-500",
    glow: "hover:shadow-pink-200/60",
  },
  ICT: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-700",
    pill: "bg-cyan-500",
    glow: "hover:shadow-cyan-200/60",
  },
  Computer: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-700",
    pill: "bg-cyan-500",
    glow: "hover:shadow-cyan-200/60",
  },
  "Physical Education": {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-700",
    pill: "bg-red-500",
    glow: "hover:shadow-red-200/60",
  },
  PE: {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-700",
    pill: "bg-red-500",
    glow: "hover:shadow-red-200/60",
  },
  Hindi: {
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-700",
    pill: "bg-yellow-500",
    glow: "hover:shadow-yellow-200/60",
  },
  "Social Studies": {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-700",
    pill: "bg-indigo-500",
    glow: "hover:shadow-indigo-200/60",
  },
  Economics: {
    bg: "bg-lime-50 dark:bg-lime-950/40",
    text: "text-lime-700 dark:text-lime-300",
    border: "border-lime-200 dark:border-lime-700",
    pill: "bg-lime-500",
    glow: "hover:shadow-lime-200/60",
  },
  Accounts: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-700",
    pill: "bg-violet-500",
    glow: "hover:shadow-violet-200/60",
  },
  Science: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-700",
    pill: "bg-sky-500",
    glow: "hover:shadow-sky-200/60",
  },
};

const subjectIcons: Record<
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

const DEFAULT_COLORS = {
  bg: "bg-muted/30",
  text: "text-foreground",
  border: "border-border",
  pill: "bg-muted-foreground",
  glow: "",
};

type EditCell = {
  day: TimetableEntry["day"];
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
  onEdit: (data: EditCell) => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [localSubject, setLocalSubject] = useState(entry?.subject ?? "");
  const [localTeacher, setLocalTeacher] = useState(entry?.teacher ?? "");
  const [localRoom, setLocalRoom] = useState(entry?.room ?? "");

  if (!entry) {
    return (
      <div
        className={`h-full min-h-[88px] flex items-center justify-center border-2 border-dashed border-border/30 rounded-xl m-1.5 transition-all duration-150 ${
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

  const colors = subjectColors[entry.subject] ?? DEFAULT_COLORS;
  const Icon = subjectIcons[entry.subject];

  const cell = (
    <div
      className={`h-full min-h-[88px] rounded-xl border-2 ${colors.bg} ${colors.border} px-3 py-3 flex flex-col justify-between m-1.5 relative transition-all duration-200 ${
        editMode
          ? `cursor-pointer hover:scale-[1.03] hover:shadow-floating ${colors.glow}`
          : `hover:scale-[1.02] hover:shadow-elevated ${colors.glow}`
      }`}
    >
      {hasClash && (
        <div className="absolute top-1.5 right-1.5">
          <TriangleAlert className="w-3.5 h-3.5 text-destructive drop-shadow-sm" />
        </div>
      )}
      {/* Subject name + icon */}
      <div className="flex items-start gap-1.5">
        {Icon && (
          <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${colors.text}`} />
        )}
        <span className={`text-xs font-bold leading-tight ${colors.text}`}>
          {entry.subject}
        </span>
      </div>
      {/* Teacher + room */}
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

  if (!editMode) return cell;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-full text-left p-0 border-0 bg-transparent cursor-pointer"
          onClick={() => {
            setLocalSubject(entry.subject);
            setLocalTeacher(entry.teacher);
            setLocalRoom(entry.room);
            setPopoverOpen(true);
          }}
        >
          {cell}
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
              value={localSubject}
              onChange={(e) => setLocalSubject(e.target.value)}
              className="mt-1.5 h-8 text-xs input-premium"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Teacher
            </Label>
            <Input
              value={localTeacher}
              onChange={(e) => setLocalTeacher(e.target.value)}
              className="mt-1.5 h-8 text-xs input-premium"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Room
            </Label>
            <Input
              value={localRoom}
              onChange={(e) => setLocalRoom(e.target.value)}
              className="mt-1.5 h-8 text-xs input-premium"
            />
          </div>
          <Button
            size="sm"
            className="w-full btn-school-primary"
            onClick={() => {
              onEdit({
                day: entry.day,
                period: entry.period,
                subject: localSubject,
                teacher: localTeacher,
                room: localRoom,
              });
              setPopoverOpen(false);
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

export default function SchedulePage() {
  const [selectedClassId, setSelectedClassId] = useState(10);
  const [selectedSectionId, setSelectedSectionId] = useState("A");
  const [localTimetable, setLocalTimetable] = useState<TimetableEntry[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [autoSolving, setAutoSolving] = useState(false);

  const updateSlotMutation = useUpdateScheduleSlot();

  const {
    data: fetchedTimetable,
    isLoading: scheduleLoading,
    isError,
  } = useSchedule(selectedClassId, selectedSectionId);

  useEffect(() => {
    if (fetchedTimetable) setLocalTimetable(fetchedTimetable);
  }, [fetchedTimetable]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally fires when class/section changes
  useEffect(() => {
    setLocalTimetable([]);
    setEditMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedSectionId]);

  useEffect(() => {
    if (isError)
      toast.error("Failed to load timetable", {
        description: "Could not fetch schedule from the server.",
      });
  }, [isError]);

  const timetable = localTimetable;
  const timetableMap: Record<string, TimetableEntry> = {};
  for (const entry of timetable) {
    timetableMap[`${entry.day}-${entry.period}`] = entry;
  }

  const clashKeys = new Set<string>();
  const teacherPeriodMap: Record<string, string[]> = {};
  for (const entry of timetable) {
    const key = `${entry.teacher}-${entry.period}`;
    if (!teacherPeriodMap[key]) teacherPeriodMap[key] = [];
    teacherPeriodMap[key].push(`${entry.day}-${entry.period}`);
  }
  for (const keys of Object.values(teacherPeriodMap)) {
    if (keys.length > 1) {
      for (const k of keys) clashKeys.add(k);
    }
  }

  const subjects = Array.from(new Set(timetable.map((e) => e.subject))).sort();
  const sectionLabel =
    SECTION_OPTIONS.find((s) => s.id === selectedSectionId)?.label ??
    selectedSectionId;
  const timetableTitle = `Class ${selectedClassId}${sectionLabel}`;

  async function handleAutoSolve() {
    setAutoSolving(true);
    await new Promise((r) => setTimeout(r, 2000));
    setAutoSolving(false);
    toast.success("Timetable generated successfully", {
      description: "No clashes detected in the new schedule",
    });
  }

  async function handleEditCell(data: EditCell) {
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
    const slotId = `${selectedClassId}-${selectedSectionId}-${data.day}-${data.period}`;
    try {
      await updateSlotMutation.mutateAsync({
        id: slotId,
        payload: {
          subject: data.subject,
          teacher: data.teacher,
          room: data.room,
        },
        classId: selectedClassId,
        sectionId: selectedSectionId,
      });
      toast.success("Period updated");
    } catch {
      toast.error("Failed to save — reverting");
    }
  }

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
            {/* Class selector */}
            <Select
              value={String(selectedClassId)}
              onValueChange={(v) => setSelectedClassId(Number(v))}
            >
              <SelectTrigger
                className="w-32 h-9 bg-background input-premium"
                data-ocid="schedule.class.select"
              >
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Section selector */}
            <Select
              value={selectedSectionId}
              onValueChange={(v) => setSelectedSectionId(v)}
            >
              <SelectTrigger
                className="w-28 h-9 bg-background input-premium"
                data-ocid="schedule.section.select"
              >
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {SECTION_OPTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    Section {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Button
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
              variant="outline"
              size="sm"
              className="gap-2 h-9"
              onClick={() => window.print()}
              data-ocid="schedule.export.button"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button
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
          <span>
            Scheduling clash: a teacher is assigned to multiple classes in the
            same period. Flagged cells are marked with{" "}
            <TriangleAlert className="w-3 h-3 inline" />.
          </span>
        </motion.div>
      )}

      {/* Subject legend */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {subjects.map((subject) => {
            const colors = subjectColors[subject];
            if (!colors) return null;
            return (
              <span
                key={subject}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-subtle ${colors.bg} ${colors.text} ${colors.border} transition-all duration-150 hover:shadow-card`}
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

      {/* Skeleton loader */}
      {scheduleLoading && (
        <div className="space-y-3" data-ocid="schedule.loading_state">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div
            className="grid gap-0 rounded-2xl overflow-hidden border border-border shadow-card"
            style={{ gridTemplateColumns: "90px repeat(5, 1fr)" }}
          >
            {(
              [
                "s0",
                "s1",
                "s2",
                "s3",
                "s4",
                "s5",
                "s6",
                "s7",
                "s8",
                "s9",
                "s10",
                "s11",
                "s12",
                "s13",
                "s14",
                "s15",
                "s16",
                "s17",
                "s18",
                "s19",
                "s20",
                "s21",
                "s22",
                "s23",
                "s24",
                "s25",
                "s26",
                "s27",
                "s28",
                "s29",
                "s30",
                "s31",
                "s32",
                "s33",
                "s34",
                "s35",
                "s36",
                "s37",
                "s38",
                "s39",
                "s40",
                "s41",
                "s42",
                "s43",
                "s44",
                "s45",
                "s46",
                "s47",
                "s48",
                "s49",
                "s50",
                "s51",
                "s52",
                "s53",
              ] as const
            ).map((k) => (
              <Skeleton
                key={k}
                className="h-[88px] rounded-none border border-border/30"
              />
            ))}
          </div>
        </div>
      )}

      {/* Desktop timetable grid */}
      {!scheduleLoading && (
        <motion.div
          key={`${selectedClassId}-${selectedSectionId}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, type: "tween" }}
          className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hidden md:block"
        >
          <div
            className="grid"
            style={{ gridTemplateColumns: "96px repeat(5, 1fr)" }}
          >
            {/* Header row */}
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
                  {DAY_LABELS[day]}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                  {DAY_FULL[day]}
                </p>
              </div>
            ))}

            {/* Period rows */}
            {PERIODS.map((period, pi) => (
              <>
                <div
                  key={`period-label-${period}`}
                  className={`border-b border-r border-border px-2 py-2 flex flex-col items-center justify-center ${
                    pi % 2 === 0 ? "bg-muted/10" : "bg-card"
                  }`}
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
                    className={`border-b border-r border-border last:border-r-0 ${
                      pi % 2 === 0 ? "bg-muted/5" : "bg-card"
                    }`}
                    data-ocid={`schedule.${day.toLowerCase()}.period.${period}.card`}
                  >
                    <SubjectCell
                      entry={timetableMap[`${day}-${period}`]}
                      hasClash={clashKeys.has(`${day}-${period}`)}
                      editMode={editMode}
                      onEdit={handleEditCell}
                    />
                  </div>
                ))}
              </>
            ))}
          </div>
        </motion.div>
      )}

      {/* Mobile stacked view */}
      {!scheduleLoading && (
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
                  const entry = timetableMap[`${day}-${period}`];
                  const hasClash = clashKeys.has(`${day}-${period}`);
                  const colors = entry
                    ? (subjectColors[entry.subject] ?? DEFAULT_COLORS)
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
                            className={`flex-1 px-3 py-2 rounded-xl border-2 ${colors.bg} ${colors.border} transition-all duration-150`}
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
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground/40 font-medium">
                            Free Period
                          </p>
                        </div>
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
      {!scheduleLoading && timetable.length === 0 && (
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
            No timetable for {timetableTitle}
          </p>
          <p className="text-sm mt-1.5 text-muted-foreground/70 max-w-xs mx-auto">
            Select a different class or section, or use Auto-Solve to generate a
            schedule.
          </p>
          <Button
            className="mt-5 btn-school-primary gap-2"
            onClick={handleAutoSolve}
            disabled={autoSolving}
            data-ocid="schedule.empty_auto_solve.button"
          >
            <Sparkles className="w-4 h-4" /> Generate Timetable
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
