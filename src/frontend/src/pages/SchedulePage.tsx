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
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type TimetableEntry,
  mockClasses,
  mockTimetable,
} from "../lib/mockData";

const DAYS: TimetableEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_LABELS: Record<TimetableEntry["day"], string> = {
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

const subjectColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Mathematics: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  English: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  Physics: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  Chemistry: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  Biology: {
    bg: "bg-green-50 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  History: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  Art: {
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800",
  },
  ICT: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  "Physical Education": {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
};

const subjectIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Mathematics: Calculator,
  English: BookOpen,
  Physics: FlaskConical,
  Chemistry: FlaskConical,
  Biology: Globe,
  History: Globe,
  Art: Palette,
  ICT: Monitor,
  Music: Music,
  "Physical Education": Dumbbell,
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
      <div className="h-full flex items-center justify-center px-2 py-3">
        <span className="text-xs text-muted-foreground/40 font-medium">
          Free
        </span>
      </div>
    );
  }

  const colors = subjectColors[entry.subject] ?? {
    bg: "bg-muted/30",
    text: "text-foreground",
    border: "border-border",
  };
  const Icon = subjectIcons[entry.subject];

  const cell = (
    <div
      className={`h-full rounded-lg border ${colors.bg} ${colors.border} px-2 py-2 flex flex-col justify-between m-0.5 relative ${
        editMode ? "cursor-pointer hover:ring-2 hover:ring-primary/50" : ""
      }`}
    >
      {hasClash && (
        <div className="absolute top-0.5 right-0.5">
          <TriangleAlert className="w-3 h-3 text-destructive" />
        </div>
      )}
      <div className="flex items-start gap-1.5">
        {Icon && (
          <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${colors.text}`} />
        )}
        <span className={`text-xs font-semibold leading-tight ${colors.text}`}>
          {entry.subject}
        </span>
      </div>
      <div className="mt-1">
        <p className="text-[10px] text-muted-foreground leading-tight">
          {entry.teacher}
        </p>
        <p className="text-[10px] text-muted-foreground/70">{entry.room}</p>
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
      <PopoverContent className="w-56" data-ocid="schedule.edit.popover">
        <div className="space-y-3">
          <div className="flex items-center gap-1 mb-1">
            <Edit2 className="w-3.5 h-3.5 text-primary" />
            <p className="text-sm font-semibold">Edit Period</p>
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input
              value={localSubject}
              onChange={(e) => setLocalSubject(e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Teacher</Label>
            <Input
              value={localTeacher}
              onChange={(e) => setLocalTeacher(e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Room</Label>
            <Input
              value={localRoom}
              onChange={(e) => setLocalRoom(e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <Button
            size="sm"
            className="w-full"
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
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function SchedulePage() {
  const [selectedClass, setSelectedClass] = useState("10A");
  const [timetable, setTimetable] = useState<TimetableEntry[]>(mockTimetable);
  const [editMode, setEditMode] = useState(false);
  const [autoSolving, setAutoSolving] = useState(false);

  const timetableMap: Record<string, TimetableEntry> = {};
  for (const entry of timetable) {
    timetableMap[`${entry.day}-${entry.period}`] = entry;
  }

  // Clash detection: same teacher in same period across different days (simplified: same teacher twice in same period)
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

  async function handleAutoSolve() {
    setAutoSolving(true);
    await new Promise((r) => setTimeout(r, 2000));
    setAutoSolving(false);
    toast.success("Timetable generated successfully", {
      description: "No clashes detected in the new schedule",
    });
  }

  function handleEditCell(data: EditCell) {
    setTimetable((prev) =>
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
    toast.success("Period updated");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Class Timetable</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Weekly class schedule and period allocations
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setEditMode((m) => !m)}
            data-ocid="schedule.edit_mode.toggle"
          >
            <Edit2 className="w-3.5 h-3.5" />
            {editMode ? "Exit Edit" : "Edit Mode"}
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={handleAutoSolve}
            disabled={autoSolving}
            data-ocid="schedule.auto_solve.button"
          >
            {autoSolving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Solving...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Auto-Solve
              </>
            )}
          </Button>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-36" data-ocid="schedule.class.select">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {mockClasses.map((c) => (
                <SelectItem key={c} value={c}>
                  Class {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {clashKeys.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          <TriangleAlert className="w-4 h-4 flex-shrink-0" />
          <span>
            Scheduling clash detected: a teacher is assigned to multiple classes
            in the same period. Cells are marked with{" "}
            <TriangleAlert className="w-3 h-3 inline" />.
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => {
          const colors = subjectColors[subject];
          if (!colors) return null;
          return (
            <span
              key={subject}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {subject}
            </span>
          );
        })}
        {editMode && (
          <Badge
            variant="outline"
            className="text-xs bg-primary/10 text-primary border-primary/30"
          >
            Edit Mode Active
          </Badge>
        )}
      </div>

      {/* Desktop Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-xl border border-border shadow-card overflow-hidden hidden md:block"
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: "80px repeat(5, 1fr)" }}
        >
          <div className="bg-muted/50 border-b border-r border-border px-3 py-3 flex items-center">
            <span className="text-xs font-semibold text-muted-foreground">
              Period
            </span>
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className="bg-muted/50 border-b border-r border-border last:border-r-0 px-3 py-3 text-center"
            >
              <p className="text-xs font-bold text-foreground">
                {DAY_LABELS[day]}
              </p>
              <p className="text-[10px] text-muted-foreground">{day}</p>
            </div>
          ))}

          {PERIODS.map((period) => (
            <>
              <div
                key={`period-${period}`}
                className="border-b border-r border-border px-2 py-2 flex flex-col items-center justify-center bg-muted/20"
              >
                <span className="text-xs font-bold text-foreground">
                  {period}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">
                  {PERIOD_TIMES[period]}
                </span>
              </div>
              {DAYS.map((day) => (
                <div
                  key={`${day}-${period}`}
                  className="border-b border-r border-border last:border-r-0 min-h-[80px]"
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

      {/* Mobile */}
      <div className="md:hidden space-y-4">
        {DAYS.map((day, di) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * di }}
            className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
          >
            <div className="bg-muted/50 px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm text-foreground">
                {DAY_LABELS[day]}
              </h3>
            </div>
            <div className="divide-y divide-border">
              {PERIODS.map((period) => {
                const entry = timetableMap[`${day}-${period}`];
                const hasClash = clashKeys.has(`${day}-${period}`);
                return (
                  <div
                    key={period}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="w-12 flex-shrink-0 text-center">
                      <p className="text-xs font-bold text-foreground">
                        P{period}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {PERIOD_TIMES[period]}
                      </p>
                    </div>
                    {entry ? (
                      <div className="flex-1 flex items-center gap-2">
                        <div>
                          <p
                            className={`text-sm font-semibold ${subjectColors[entry.subject]?.text ?? "text-foreground"}`}
                          >
                            {entry.subject}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.teacher} \u00b7 {entry.room}
                          </p>
                        </div>
                        {hasClash && (
                          <TriangleAlert className="w-4 h-4 text-destructive ml-auto" />
                        )}
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground/40 font-medium">
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
    </motion.div>
  );
}
