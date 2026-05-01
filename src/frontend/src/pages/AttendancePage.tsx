import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  QrCode,
  Save,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAttendanceRecords,
  useSaveAttendance,
  useStudentsForClass,
} from "../hooks/useQueries";

type AttendanceStatus = "present" | "absent" | "late";

const statusConfig: Record<
  AttendanceStatus,
  {
    label: string;
    activeClass: string;
    inactiveClass: string;
    icon: React.ComponentType<{ className?: string }>;
    dot: string;
    rowBg: string;
    summaryBg: string;
    summaryText: string;
    summaryBorder: string;
  }
> = {
  present: {
    label: "Present",
    activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-sm",
    inactiveClass:
      "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    rowBg: "",
    summaryBg: "bg-emerald-50",
    summaryText: "text-emerald-700",
    summaryBorder: "border-emerald-200",
  },
  absent: {
    label: "Absent",
    activeClass: "bg-red-500 text-white border-red-500 shadow-sm",
    inactiveClass:
      "border-border text-muted-foreground hover:border-red-400 hover:text-red-600 hover:bg-red-50",
    icon: XCircle,
    dot: "bg-red-500",
    rowBg: "bg-red-500/3",
    summaryBg: "bg-red-50",
    summaryText: "text-red-700",
    summaryBorder: "border-red-200",
  },
  late: {
    label: "Late",
    activeClass: "bg-amber-500 text-white border-amber-500 shadow-sm",
    inactiveClass:
      "border-border text-muted-foreground hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50",
    icon: Clock,
    dot: "bg-amber-500",
    rowBg: "bg-amber-500/3",
    summaryBg: "bg-amber-50",
    summaryText: "text-amber-700",
    summaryBorder: "border-amber-200",
  },
};

type AbsenceReport = {
  studentId: string;
  name: string;
  class: string;
  totalAbsences: number;
  lastAbsent: string;
};

const absenceReports: AbsenceReport[] = [
  {
    studentId: "s1",
    name: "Adaeze Okonkwo",
    class: "10A",
    totalAbsences: 4,
    lastAbsent: "2026-03-25",
  },
  {
    studentId: "s3",
    name: "Fatima Al-Hassan",
    class: "10A",
    totalAbsences: 7,
    lastAbsent: "2026-03-28",
  },
  {
    studentId: "s5",
    name: "Amara Diallo",
    class: "10B",
    totalAbsences: 2,
    lastAbsent: "2026-03-20",
  },
  {
    studentId: "s7",
    name: "Yemi Adeyemi",
    class: "10B",
    totalAbsences: 5,
    lastAbsent: "2026-03-27",
  },
  {
    studentId: "s9",
    name: "Kola Aina",
    class: "11A",
    totalAbsences: 3,
    lastAbsent: "2026-03-22",
  },
];

const CLASS_OPTIONS = [6, 7, 8, 9, 10, 11];
const SECTION_OPTIONS = [
  { id: "A", label: "Section A" },
  { id: "B", label: "Section B" },
  { id: "C", label: "Section C" },
  { id: "D", label: "Section D" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const avatarColors = [
  "bg-primary/20 text-primary",
  "bg-emerald-500/20 text-emerald-600",
  "bg-amber-500/20 text-amber-600",
  "bg-red-500/20 text-red-600",
  "bg-purple-500/20 text-purple-600",
  "bg-cyan-500/20 text-cyan-600",
];

function AttendanceRowSkeleton() {
  return (
    <div className="p-5 space-y-3" data-ocid="attendance.loading_state">
      {[1, 2, 3, 4, 5, 6].map((k) => (
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

export default function AttendancePage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState("10");
  const [selectedSection, setSelectedSection] = useState("A");
  const [localAttendance, setLocalAttendance] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [qrInput, setQrInput] = useState("");
  const [scanHistory, setScanHistory] = useState<
    { id: string; name: string; time: string }[]
  >([]);

  const classKey = `${selectedClass}${selectedSection}`;

  const studentsQuery = useStudentsForClass(classKey);
  const attendanceQuery = useAttendanceRecords(
    date,
    selectedClass,
    selectedSection,
  );
  const saveMutation = useSaveAttendance();

  useEffect(() => {
    if (studentsQuery.error)
      toast.error("Failed to load students", {
        description: (studentsQuery.error as Error).message,
      });
    if (attendanceQuery.error)
      toast.error("Failed to load attendance records", {
        description: (attendanceQuery.error as Error).message,
      });
  }, [studentsQuery.error, attendanceQuery.error]);

  useEffect(() => {
    if (attendanceQuery.data) {
      const map: Record<string, AttendanceStatus> = {};
      for (const r of attendanceQuery.data) {
        map[r.studentId] = r.status;
      }
      setLocalAttendance(map);
    }
  }, [attendanceQuery.data]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally fires on selector changes
  useEffect(() => {
    setLocalAttendance({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSection, date]);

  const classStudents = studentsQuery.data ?? [];

  const counts = classStudents.reduce(
    (acc, s) => {
      const status = localAttendance[s.id] ?? "present";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0 } as Record<AttendanceStatus, number>,
  );

  function setStatus(studentId: string, status: AttendanceStatus) {
    setLocalAttendance((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAllPresent() {
    const map: Record<string, AttendanceStatus> = {};
    for (const s of classStudents) {
      map[s.id] = "present";
    }
    setLocalAttendance(map);
    toast.success(`All ${classStudents.length} students marked Present`);
  }

  async function handleSubmit() {
    const records = classStudents.map((s) => ({
      studentId: s.id,
      status: localAttendance[s.id] ?? "present",
    }));
    try {
      await saveMutation.mutateAsync({
        date,
        classId: Number(selectedClass),
        sectionId: selectedSection,
        records,
      });
      toast.success(`Attendance for Class ${classKey} saved!`, {
        description: `${counts.present} present · ${counts.absent} absent · ${counts.late} late`,
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
    const student = classStudents.find(
      (s) => s.id === trimmed || String(s.rollNo) === trimmed,
    );
    if (!student) {
      toast.error(`Student ID "${trimmed}" not found`);
      return;
    }
    setStatus(student.id, "present");
    setScanHistory((prev) => [
      {
        id: student.id,
        name: student.name,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
    toast.success(`${student.name} marked present via QR`);
    setQrInput("");
  }

  const total = classStudents.length;
  const presentPct = total > 0 ? Math.round((counts.present / total) * 100) : 0;

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
      value: counts.present,
      icon: CheckCircle2,
      color: "text-emerald-600",
      iconBg: "bg-emerald-100",
      border: "border-emerald-200",
    },
    {
      label: "Absent",
      value: counts.absent,
      icon: XCircle,
      color: "text-red-600",
      iconBg: "bg-red-100",
      border: "border-red-200",
    },
    {
      label: "Late",
      value: counts.late,
      icon: Clock,
      color: "text-amber-600",
      iconBg: "bg-amber-100",
      border: "border-amber-200",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, type: "tween", ease: "easeOut" }}
      className="space-y-6"
    >
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
            Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daily marking —{" "}
            <span className="font-semibold text-foreground">
              Class {classKey}
            </span>
          </p>
        </div>

        {/* ── Toolbar: date + class + section ─────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date picker — glass styled */}
          <div className="glass flex items-center gap-2 rounded-xl px-3 py-2 border border-white/30 shadow-card">
            <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm bg-transparent text-foreground outline-none min-w-[130px]"
              data-ocid="attendance.date.input"
            />
          </div>

          {/* Class selector — glass styled */}
          <div className="glass rounded-xl border border-white/30 shadow-card">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger
                className="w-28 bg-transparent border-0 shadow-none"
                data-ocid="attendance.class.select"
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
          </div>

          {/* Section selector — glass styled */}
          <div className="glass rounded-xl border border-white/30 shadow-card">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger
                className="w-28 bg-transparent border-0 shadow-none"
                data-ocid="attendance.section.select"
              >
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {SECTION_OPTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Summary Strip ─────────────────────────────────────────────────── */}
      {!studentsQuery.isPending && total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-3 border border-white/30 shadow-card flex items-center gap-4 flex-wrap"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary" />
            {total} students in Class {classKey}
          </div>
          <div className="flex-1 h-px bg-border" />
          {(["present", "absent", "late"] as AttendanceStatus[]).map((s) => (
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, type: "tween" }}
            className={`bg-card rounded-2xl border ${card.border} shadow-card p-5 relative overflow-hidden hover-lift card-premium`}
            data-ocid={`attendance.${card.label.toLowerCase().replace(/\s+/g, "_")}.card`}
          >
            <div
              className={`absolute top-0 right-0 w-16 h-16 rounded-full ${card.iconBg} blur-2xl opacity-50 translate-x-4 -translate-y-4`}
            />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  {card.label}
                </p>
                {studentsQuery.isPending ? (
                  <Skeleton className="h-9 w-14 mt-1" />
                ) : (
                  <p
                    className={`text-4xl font-bold text-foreground mt-1 font-display ${card.color}`}
                  >
                    {card.value}
                  </p>
                )}
                {card.label === "Present" &&
                  !studentsQuery.isPending &&
                  total > 0 && (
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

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="daily">
        <TabsList className="bg-muted/60 p-1" data-ocid="attendance.tab">
          <TabsTrigger value="daily">Daily Marking</TabsTrigger>
          <TabsTrigger value="qr">QR / Biometric</TabsTrigger>
          <TabsTrigger value="reports">Absence Reports</TabsTrigger>
        </TabsList>

        {/* ── Daily Marking Tab ─────────────────────────────────────────── */}
        <TabsContent value="daily" className="mt-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, type: "tween" }}
            className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
          >
            {/* Card header */}
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted/30 to-transparent flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground font-display">
                  Class {classKey}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-card font-mono">
                  {classStudents.length} students
                </Badge>
                {classStudents.length > 0 && !studentsQuery.isPending && (
                  <Button
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

            {/* Student list */}
            {studentsQuery.isPending ? (
              <AttendanceRowSkeleton />
            ) : classStudents.length === 0 ? (
              <div
                className="text-center py-20 text-muted-foreground"
                data-ocid="attendance.empty_state"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 opacity-30" />
                </div>
                <p className="font-bold text-base text-foreground">
                  No students in Class {classKey}
                </p>
                <p className="text-sm mt-1 text-muted-foreground/70">
                  Try selecting a different class or section.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {classStudents.map((student, i) => {
                  const status = localAttendance[student.id] ?? "present";
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

                      {/* Segmented status buttons */}
                      <div className="flex items-center gap-1.5">
                        {(
                          ["present", "absent", "late"] as AttendanceStatus[]
                        ).map((s) => {
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
                              data-ocid={`attendance.${s}.toggle`}
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
            <div className="sticky bottom-0 px-6 py-4 bg-card border-t border-border shadow-subtle flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                {(["present", "absent", "late"] as AttendanceStatus[]).map(
                  (s) => (
                    <span
                      key={s}
                      className={`badge-premium ${statusConfig[s].summaryBg} ${statusConfig[s].summaryText} border ${statusConfig[s].summaryBorder} gap-1.5`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig[s].dot}`}
                      />
                      {counts[s]} {statusConfig[s].label}
                    </span>
                  ),
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={saveMutation.isPending || classStudents.length === 0}
                className="gap-2 btn-school-primary hover-lift flex-shrink-0"
                data-ocid="attendance.submit_button"
              >
                {saveMutation.isPending ? (
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
          </motion.div>
        </TabsContent>

        {/* ── QR Tab ────────────────────────────────────────────────────── */}
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
                    Scan or paste a student ID to mark present
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQrScan()}
                  placeholder="Scan or paste student ID…"
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow input-premium"
                  data-ocid="attendance.qr.input"
                />
                <Button
                  onClick={handleQrScan}
                  className="btn-school-primary rounded-xl"
                  data-ocid="attendance.qr.submit_button"
                >
                  Mark Present
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Tip: Use student IDs from the class roster.
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

        {/* ── Absence Reports Tab ───────────────────────────────────────── */}
        <TabsContent value="reports" className="mt-5">
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted/30 to-transparent">
              <h2 className="font-bold text-foreground font-display">
                Absence Summary Report
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Students with recorded absences this term
              </p>
            </div>
            <div className="divide-y divide-border/60">
              {absenceReports.map((report, i) => (
                <motion.div
                  key={report.studentId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, type: "tween" }}
                  className="flex items-center gap-4 px-6 py-4 table-row-hover stagger-item"
                  data-ocid={`attendance.absence.item.${i + 1}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-sm font-bold flex-shrink-0`}
                  >
                    {getInitials(report.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {report.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Class {report.class} · Last absent: {report.lastAbsent}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold flex-shrink-0 ${
                      report.totalAbsences >= 5
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {report.totalAbsences} absences
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 shrink-0 rounded-xl hover:border-primary/40 hover:text-primary transition-fast"
                    onClick={() =>
                      toast.success(`Alert sent to parent of ${report.name}`)
                    }
                    data-ocid={`attendance.alert_parent.${i + 1}.button`}
                  >
                    <Bell className="w-3.5 h-3.5" /> Alert Parent
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
