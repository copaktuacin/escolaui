import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  QrCode,
  Save,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type AttendanceRecord,
  mockAttendanceRecords,
  mockClasses,
  mockStudents,
} from "../lib/mockData";

type AttendanceStatus = "present" | "absent" | "late";

const statusConfig: Record<
  AttendanceStatus,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  present: {
    label: "Present",
    className: "bg-success/10 text-success border-success/30",
    icon: CheckCircle2,
  },
  absent: {
    label: "Absent",
    className: "bg-destructive/10 text-destructive border-destructive/30",
    icon: XCircle,
  },
  late: {
    label: "Late",
    className: "bg-warning/10 text-warning border-warning/30",
    icon: Clock,
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

export default function AttendancePage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState("10A");
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >(() =>
    Object.fromEntries(
      mockAttendanceRecords.map((r) => [r.studentId, r.status]),
    ),
  );
  const [qrInput, setQrInput] = useState("");
  const [scanHistory, setScanHistory] = useState<
    { id: string; name: string; time: string }[]
  >([]);

  const classStudents = mockStudents.filter((s) => s.class === selectedClass);
  const counts = classStudents.reduce(
    (acc, s) => {
      const status = attendance[s.id] ?? "present";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0 } as Record<AttendanceStatus, number>,
  );

  function setStatus(studentId: string, status: AttendanceStatus) {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  }

  function handleSubmit() {
    toast.success(`Attendance for Class ${selectedClass} saved successfully!`, {
      description: `${counts.present} present \u00b7 ${counts.absent} absent \u00b7 ${counts.late} late`,
    });
  }

  function handleQrScan() {
    const trimmed = qrInput.trim();
    if (!trimmed) return;
    const student = mockStudents.find(
      (s) => s.id === trimmed || s.rollNo.toString() === trimmed,
    );
    if (!student) {
      toast.error(`Student ID "${trimmed}" not found`);
      return;
    }
    setAttendance((prev) => ({ ...prev, [student.id]: "present" }));
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

  const statCards = [
    {
      label: "Total Students",
      value: classStudents.length,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Present",
      value: counts.present,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Absent",
      value: counts.absent,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Late",
      value: counts.late,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

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
          <h1 className="text-xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Mark daily attendance for each class
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm bg-transparent text-foreground outline-none"
              data-ocid="attendance.date.input"
            />
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-32" data-ocid="attendance.class.select">
              <SelectValue placeholder="Class" />
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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="bg-card rounded-xl border border-border shadow-card p-4"
            data-ocid={`attendance.${card.label.toLowerCase().replace(/\s+/g, "_")}.card`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
              <div
                className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
              >
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="daily">
        <TabsList data-ocid="attendance.tab">
          <TabsTrigger value="daily">Daily Marking</TabsTrigger>
          <TabsTrigger value="qr">QR / Biometric Import</TabsTrigger>
          <TabsTrigger value="reports">Absence Reports</TabsTrigger>
        </TabsList>

        {/* Daily Marking */}
        <TabsContent value="daily" className="mt-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border shadow-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                Class {selectedClass} &mdash;{" "}
                {new Date(date).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <Badge variant="outline" className="text-xs">
                {classStudents.length} students
              </Badge>
            </div>

            {classStudents.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="attendance.empty_state"
              >
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No students in this class</p>
              </div>
            ) : (
              <Table data-ocid="attendance.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map((student, i) => {
                    const status = attendance[student.id] ?? "present";
                    return (
                      <TableRow
                        key={student.id}
                        data-ocid={`attendance.item.${i + 1}`}
                      >
                        <TableCell className="font-mono text-muted-foreground text-sm">
                          {student.rollNo.toString().padStart(2, "0")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(
                              [
                                "present",
                                "absent",
                                "late",
                              ] as AttendanceStatus[]
                            ).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(student.id, s)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                  status === s
                                    ? statusConfig[s].className
                                    : "border-border text-muted-foreground hover:bg-accent"
                                }`}
                                data-ocid={`attendance.${s}.toggle`}
                              >
                                {statusConfig[s].label}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            <div className="mt-5 flex justify-end">
              <Button
                onClick={handleSubmit}
                className="gap-2"
                data-ocid="attendance.submit_button"
              >
                <Save className="w-4 h-4" /> Submit Attendance
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* QR / Biometric Import */}
        <TabsContent value="qr" className="mt-5">
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">
                  QR / Biometric Scan
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Paste or scan a student ID to mark attendance
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQrScan()}
                  placeholder="Scan or paste student ID..."
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-accent text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  data-ocid="attendance.qr.input"
                />
                <Button
                  size="sm"
                  onClick={handleQrScan}
                  data-ocid="attendance.qr.submit_button"
                >
                  Mark Present
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Try student IDs like "s1", "s2", etc.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h2 className="font-semibold text-foreground mb-4">
                Scan History
              </h2>
              {scanHistory.length === 0 ? (
                <div
                  className="text-center py-10 text-muted-foreground"
                  data-ocid="attendance.qr.empty_state"
                >
                  <QrCode className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No scans yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scanHistory.map((s, i) => (
                    <div
                      key={`${s.id}-${i}`}
                      className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {s.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className="text-xs bg-success/10 text-success border-success/30"
                        >
                          Present
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Absence Reports */}
        <TabsContent value="reports" className="mt-5">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">
                Absence Summary Report
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Students with recorded absences this term
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="attendance.absence.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Absences</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Last Absent
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absenceReports.map((report, i) => (
                    <TableRow
                      key={report.studentId}
                      data-ocid={`attendance.absence.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">
                        {report.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        Class {report.class}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            report.totalAbsences >= 5
                              ? "bg-destructive/10 text-destructive border-destructive/30"
                              : "bg-warning/10 text-warning border-warning/30"
                          }`}
                        >
                          {report.totalAbsences} days
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {report.lastAbsent}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1"
                          onClick={() =>
                            toast.success(
                              `Alert sent to parent of ${report.name}`,
                            )
                          }
                          data-ocid={`attendance.alert_parent.${i + 1}.button`}
                        >
                          <Bell className="w-3 h-3" /> Alert Parent
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
