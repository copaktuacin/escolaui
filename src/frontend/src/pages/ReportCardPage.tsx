import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchoolProfile } from "@/contexts/SchoolProfileContext";
import { api } from "@/lib/api";
import { isDemoMode } from "@/lib/demoMode";
import { withDelay } from "@/lib/mockData";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  GraduationCap,
  Printer,
  Search,
  Sliders,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SubjectGrade = {
  subject: string;
  marks: number;
  maxMarks: number;
  grade: string;
  remarks: string;
};

type StudentReport = {
  id: string;
  studentId?: number; // numeric ID for API calls
  name: string;
  enrollmentNo: string;
  classSection: string;
  dob: string;
  photo?: string;
  subjects: SubjectGrade[];
  attendedDays: number;
  totalDays: number;
  teacherRemarks: string;
  term: string;
  academicYear: string;
};

/** Matches .NET GenerateReportCardRequest DTO (PascalCase). */
type GenerateReportCardRequest = {
  StudentId: number;
  Term: string;
  Weightings?: Record<string, number>;
};

/** Matches .NET GenerateReportCardResponse DTO. */
type ReportCardDto = {
  student?: { id: string; name: string };
  grades?: { subject: string; marks: number; grade: string }[];
  totalMarks?: number;
  percentage?: number;
  [key: string]: unknown;
};

type GenerateReportCardResponse = {
  ReportCard: ReportCardDto;
};

/** Shape used when listing existing report cards. */
type ReportCardListItem = {
  student: { id: string; name: string };
  term: string;
  grades: { subject: string; marks: number; grade: string }[];
  totalMarks?: number;
  percentage?: number;
};

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const TERMS = ["Term 1", "Term 2", "Term 3", "Final"];
const CLASSES = [
  "6A",
  "6B",
  "7A",
  "7B",
  "8A",
  "8B",
  "9A",
  "9B",
  "10A",
  "10B",
  "11A",
  "12A",
];
const ACADEMIC_YEAR = "2025–2026";

const MOCK_REPORTS: StudentReport[] = [
  {
    id: "s101",
    studentId: 101,
    name: "Aiden Clarke",
    enrollmentNo: "ES-2023001",
    classSection: "10A",
    dob: "2010-05-15",
    subjects: [
      {
        subject: "Mathematics",
        marks: 88,
        maxMarks: 100,
        grade: "A",
        remarks: "Excellent analytical skills",
      },
      {
        subject: "English",
        marks: 82,
        maxMarks: 100,
        grade: "A",
        remarks: "Good writing proficiency",
      },
      {
        subject: "Physics",
        marks: 79,
        maxMarks: 100,
        grade: "B+",
        remarks: "Strong grasp of concepts",
      },
      {
        subject: "Chemistry",
        marks: 75,
        maxMarks: 100,
        grade: "B",
        remarks: "Consistent performance",
      },
      {
        subject: "Biology",
        marks: 91,
        maxMarks: 100,
        grade: "A+",
        remarks: "Outstanding laboratory work",
      },
      {
        subject: "History",
        marks: 72,
        maxMarks: 100,
        grade: "B",
        remarks: "Good understanding",
      },
    ],
    attendedDays: 188,
    totalDays: 200,
    teacherRemarks:
      "Aiden is an exemplary student who consistently demonstrates academic excellence and leadership qualities.",
    term: "Term 1",
    academicYear: ACADEMIC_YEAR,
  },
  {
    id: "s102",
    studentId: 102,
    name: "Blessing Nwosu",
    enrollmentNo: "ES-2023002",
    classSection: "10A",
    dob: "2010-08-22",
    subjects: [
      {
        subject: "Mathematics",
        marks: 95,
        maxMarks: 100,
        grade: "A+",
        remarks: "Exceptional problem-solving",
      },
      {
        subject: "English",
        marks: 90,
        maxMarks: 100,
        grade: "A+",
        remarks: "Outstanding literary analysis",
      },
      {
        subject: "Physics",
        marks: 88,
        maxMarks: 100,
        grade: "A",
        remarks: "Strong theoretical understanding",
      },
      {
        subject: "Chemistry",
        marks: 92,
        maxMarks: 100,
        grade: "A+",
        remarks: "Excellent experimental technique",
      },
      {
        subject: "Biology",
        marks: 87,
        maxMarks: 100,
        grade: "A",
        remarks: "Very good comprehension",
      },
      {
        subject: "History",
        marks: 85,
        maxMarks: 100,
        grade: "A",
        remarks: "Excellent research skills",
      },
    ],
    attendedDays: 197,
    totalDays: 200,
    teacherRemarks:
      "Blessing is an outstanding student with remarkable dedication and consistently superior academic performance.",
    term: "Term 1",
    academicYear: ACADEMIC_YEAR,
  },
  {
    id: "s103",
    studentId: 103,
    name: "Chidera Obi",
    enrollmentNo: "ES-2023003",
    classSection: "10A",
    dob: "2010-03-11",
    subjects: [
      {
        subject: "Mathematics",
        marks: 65,
        maxMarks: 100,
        grade: "C+",
        remarks: "Needs more practice",
      },
      {
        subject: "English",
        marks: 70,
        maxMarks: 100,
        grade: "B",
        remarks: "Improving steadily",
      },
      {
        subject: "Physics",
        marks: 58,
        maxMarks: 100,
        grade: "C",
        remarks: "More revision required",
      },
      {
        subject: "Chemistry",
        marks: 62,
        maxMarks: 100,
        grade: "C+",
        remarks: "Some improvement seen",
      },
      {
        subject: "Biology",
        marks: 74,
        maxMarks: 100,
        grade: "B",
        remarks: "Good grasp",
      },
      {
        subject: "History",
        marks: 68,
        maxMarks: 100,
        grade: "B-",
        remarks: "Average performance",
      },
    ],
    attendedDays: 175,
    totalDays: 200,
    teacherRemarks:
      "Chidera shows potential and with consistent effort can achieve higher grades in all subjects.",
    term: "Term 1",
    academicYear: ACADEMIC_YEAR,
  },
  {
    id: "s104",
    studentId: 104,
    name: "Diana Petrov",
    enrollmentNo: "ES-2023004",
    classSection: "10A",
    dob: "2010-11-30",
    subjects: [
      {
        subject: "Mathematics",
        marks: 83,
        maxMarks: 100,
        grade: "A",
        remarks: "Very good performance",
      },
      {
        subject: "English",
        marks: 88,
        maxMarks: 100,
        grade: "A",
        remarks: "Excellent vocabulary",
      },
      {
        subject: "Physics",
        marks: 80,
        maxMarks: 100,
        grade: "A-",
        remarks: "Good understanding",
      },
      {
        subject: "Chemistry",
        marks: 77,
        maxMarks: 100,
        grade: "B+",
        remarks: "Solid effort",
      },
      {
        subject: "Biology",
        marks: 85,
        maxMarks: 100,
        grade: "A",
        remarks: "Strong conceptual clarity",
      },
      {
        subject: "History",
        marks: 90,
        maxMarks: 100,
        grade: "A+",
        remarks: "Exceptional historical analysis",
      },
    ],
    attendedDays: 192,
    totalDays: 200,
    teacherRemarks:
      "Diana is a diligent student with excellent academic performance across all subjects.",
    term: "Term 1",
    academicYear: ACADEMIC_YEAR,
  },
];

// ─── Grade helpers ──────────────────────────────────────────────────────────────

function getGradeStyle(grade: string) {
  if (grade.startsWith("A"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (grade.startsWith("B")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (grade.startsWith("C"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

function calcTotal(subjects: SubjectGrade[]) {
  return subjects.reduce((sum, s) => sum + s.marks, 0);
}

function calcMax(subjects: SubjectGrade[]) {
  return subjects.reduce((sum, s) => sum + s.maxMarks, 0);
}

function isPassing(subjects: SubjectGrade[]) {
  return subjects.every((s) => s.marks / s.maxMarks >= 0.35);
}

// ─── Data hooks ─────────────────────────────────────────────────────────────────

function useReportCards(term: string, selectedClass: string) {
  return useQuery<StudentReport[]>({
    queryKey: ["report-cards-v2", term, selectedClass],
    queryFn: async () => {
      if (isDemoMode()) {
        return withDelay(
          MOCK_REPORTS.filter((r) => r.classSection === selectedClass).map(
            (r) => ({ ...r, term }),
          ),
        );
      }
      const res = await api.get<ReportCardListItem[]>(
        `/report-cards?term=${encodeURIComponent(term)}&class=${selectedClass}`,
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to load report cards");
      const cards = res.data ?? [];
      return cards.map((rc) => ({
        id: rc.student.id,
        name: rc.student.name,
        enrollmentNo: rc.student.id,
        classSection: selectedClass,
        dob: "",
        subjects: rc.grades.map((g) => ({
          subject: g.subject,
          marks: g.marks,
          maxMarks: 100,
          grade: g.grade,
          remarks: "",
        })),
        attendedDays: 0,
        totalDays: 200,
        teacherRemarks: "",
        term,
        academicYear: ACADEMIC_YEAR,
      }));
    },
  });
}

// ─── Weightings panel ─────────────────────────────────────────────────────────

type Weightings = { exam: string; assignment: string; attendance: string };

function WeightingsPanel({
  value,
  onChange,
}: {
  value: Weightings;
  onChange: (w: Weightings) => void;
}) {
  const total =
    (Number.parseFloat(value.exam) || 0) +
    (Number.parseFloat(value.assignment) || 0) +
    (Number.parseFloat(value.attendance) || 0);
  const valid = Math.abs(total - 1) < 0.01;

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            { key: "exam", label: "Exam" },
            { key: "assignment", label: "Assignment" },
            { key: "attendance", label: "Attendance" },
          ] as { key: keyof Weightings; label: string }[]
        ).map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              className="input-premium rounded-lg text-sm"
              data-ocid={`report_card.weight_${key}.input`}
              placeholder="0.0–1.0"
            />
          </div>
        ))}
      </div>
      <p className={`text-xs ${valid ? "text-success" : "text-warning"}`}>
        Sum: {total.toFixed(2)} {valid ? "✓ Valid" : "(must equal 1.0)"}
      </p>
    </div>
  );
}

// ─── Report Card Print Component ───────────────────────────────────────────────

function ReportCardDocument({
  report,
  schoolName,
  schoolLogo,
}: {
  report: StudentReport;
  schoolName: string;
  schoolLogo: string | null;
}) {
  const total = calcTotal(report.subjects);
  const max = calcMax(report.subjects);
  const pct = Math.round((total / max) * 100);
  const passing = isPassing(report.subjects);
  const attPct = Math.round((report.attendedDays / report.totalDays) * 100);

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-elevated print:shadow-none print:border-border"
      style={{ maxWidth: 760 }}
    >
      {/* School Header */}
      <div
        className="px-8 py-6 flex flex-col items-center gap-2 border-b-2"
        style={{
          background: "var(--color-primary)",
          borderColor: "var(--color-primary)",
        }}
      >
        <div className="flex items-center gap-4">
          {schoolLogo ? (
            <img
              src={schoolLogo}
              alt="School Logo"
              className="w-14 h-14 rounded-xl object-cover bg-white/20"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">
              {schoolName}
            </h1>
            <p className="text-white/80 text-sm mt-0.5">
              {report.academicYear} · Academic Report
            </p>
          </div>
        </div>
        <div
          className="mt-3 px-6 py-1.5 rounded-full text-sm font-semibold tracking-wider"
          style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
        >
          STUDENT REPORT CARD — {report.term.toUpperCase()}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Student Info Strip */}
        <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/40 border border-border">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
            {report.photo ? (
              <img
                src={report.photo}
                alt={report.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-primary/60" />
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Student Name
              </p>
              <p className="font-display font-bold text-foreground">
                {report.name}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Enrollment No.
              </p>
              <p className="font-mono text-sm font-bold text-foreground">
                {report.enrollmentNo}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Class & Section
              </p>
              <p className="font-bold text-foreground">
                Class {report.classSection}
              </p>
            </div>
            {report.dob && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Date of Birth
                </p>
                <p className="text-sm text-foreground">{report.dob}</p>
              </div>
            )}
          </div>
        </div>

        {/* Grades Table */}
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Academic Performance
          </h3>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Subject
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Marks
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Max
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Grade
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.subjects.map((s, i) => (
                  <tr
                    key={s.subject}
                    className={`stagger-item border-t border-border ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {s.subject}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-foreground">
                      {s.marks}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {s.maxMarks}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getGradeStyle(s.grade)}`}
                      >
                        {s.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                      {s.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/40">
                  <td className="px-4 py-3 font-bold text-foreground">Total</td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">
                    {total}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-muted-foreground">
                    {max}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">
                    {pct}%
                  </td>
                  <td className="hidden sm:table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Attendance + Remarks */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" />
              Attendance Summary
            </h4>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-display font-bold text-foreground">
                {report.attendedDays}
              </span>
              <span className="text-muted-foreground mb-0.5">
                / {report.totalDays} days
              </span>
              <span
                className="ml-auto text-sm font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                {attPct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${attPct}%`,
                  background: "var(--color-primary)",
                }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
              Class Teacher's Remarks
            </h4>
            <p className="text-sm text-foreground leading-relaxed italic">
              "{report.teacherRemarks}"
            </p>
          </div>
        </div>

        {/* Overall Result */}
        <div
          className={`rounded-xl border-2 p-4 flex items-center justify-between ${passing ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
        >
          <div className="flex items-center gap-3">
            <Award
              className={`w-6 h-6 ${passing ? "text-emerald-600" : "text-red-600"}`}
            />
            <div>
              <p
                className={`text-xs uppercase tracking-widest font-semibold ${passing ? "text-emerald-600" : "text-red-600"}`}
              >
                Overall Result
              </p>
              <p
                className={`text-xl font-display font-bold ${passing ? "text-emerald-700" : "text-red-700"}`}
              >
                {passing ? "PASS" : "FAIL"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Score
            </p>
            <p
              className={`text-2xl font-display font-bold ${passing ? "text-emerald-700" : "text-red-700"}`}
            >
              {total} / {max}
            </p>
          </div>
        </div>

        {/* Signature Lines */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
          {["Class Teacher", "Principal", "Parent / Guardian"].map((label) => (
            <div key={label} className="text-center">
              <div className="border-b border-foreground/30 mb-2 h-8" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ReportSkeleton() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportCardPage() {
  const [term, setTerm] = useState("Term 1");
  const [selectedClass, setSelectedClass] = useState("10A");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );

  // Advanced weightings state
  const [showWeightings, setShowWeightings] = useState(false);
  const [weightings, setWeightings] = useState<Weightings>({
    exam: "0.7",
    assignment: "0.2",
    attendance: "0.1",
  });
  const [useCustomWeightings, setUseCustomWeightings] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const { profile } = useSchoolProfile();

  const { data: reports = [], isLoading } = useReportCards(term, selectedClass);

  const filtered = search
    ? reports.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.enrollmentNo.toLowerCase().includes(search.toLowerCase()),
      )
    : reports;

  const selectedReport =
    reports.find((r) => r.id === selectedStudentId) ?? reports[0] ?? null;

  // ── Per-student report card generation ───────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: async (
      report: StudentReport,
    ): Promise<ReportCardDto | null> => {
      if (isDemoMode()) {
        await withDelay(null, 800);
        return null; // demo: just show existing data
      }

      // Build PascalCase payload
      const payload: GenerateReportCardRequest = {
        StudentId:
          report.studentId ??
          (Number.parseInt(report.id.replace(/\D/g, ""), 10) || 0),
        Term: term,
      };

      // Include custom weightings only if user has enabled them and sum is valid
      if (useCustomWeightings) {
        const examW = Number.parseFloat(weightings.exam) || 0;
        const assignW = Number.parseFloat(weightings.assignment) || 0;
        const attW = Number.parseFloat(weightings.attendance) || 0;
        if (Math.abs(examW + assignW + attW - 1) < 0.01) {
          payload.Weightings = {
            exam: examW,
            assignment: assignW,
            attendance: attW,
          };
        }
      }

      const res = await api.post<GenerateReportCardResponse>(
        "/report-cards/generate",
        payload,
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to generate report card");

      // Response shape: { ReportCard: ReportCardDto }
      return res.data?.ReportCard ?? null;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Report card generated for ${variables.name}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handlePrint() {
    window.print();
  }

  type Weightings = { exam: string; assignment: string; attendance: string };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
      data-ocid="report_card.page"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Report Cards
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate and print student academic reports
          </p>
        </div>
        {selectedReport && (
          <Button
            className="gap-2 btn-school-primary btn-press"
            onClick={() => generateMutation.mutate(selectedReport)}
            disabled={generateMutation.isPending}
            data-ocid="report_card.generate.button"
          >
            <FileText className="w-4 h-4" />
            {generateMutation.isPending
              ? "Generating…"
              : "Generate Report Card"}
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div
        className="bg-card border border-border rounded-2xl shadow-card print:hidden"
        data-ocid="report_card.filter.panel"
      >
        <div className="flex flex-wrap items-center gap-3 p-4">
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger
              className="w-32 input-premium"
              data-ocid="report_card.term.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TERMS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedClass}
            onValueChange={(v) => {
              setSelectedClass(v);
              setSelectedStudentId(null);
            }}
          >
            <SelectTrigger
              className="w-32 input-premium"
              data-ocid="report_card.class.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  Class {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search student…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 input-premium"
              data-ocid="report_card.search.input"
            />
          </div>

          {/* Advanced Weightings toggle */}
          <button
            type="button"
            onClick={() => setShowWeightings((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              showWeightings
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/60"
            }`}
            data-ocid="report_card.weightings.toggle"
            aria-expanded={showWeightings}
          >
            <Sliders className="w-3.5 h-3.5" />
            Weightings
            {showWeightings ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Collapsible weightings panel */}
        {showWeightings && (
          <div className="px-4 pb-4 border-t border-border">
            <div className="pt-3 space-y-2">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomWeightings}
                    onChange={(e) => setUseCustomWeightings(e.target.checked)}
                    className="rounded"
                    data-ocid="report_card.use_custom_weightings.checkbox"
                  />
                  Use custom weightings for generation
                </label>
              </div>
              {useCustomWeightings && (
                <WeightingsPanel value={weightings} onChange={setWeightings} />
              )}
              {!useCustomWeightings && (
                <p className="text-xs text-muted-foreground">
                  Default server-side weightings will be used. Enable above to
                  override.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 print:block">
        {/* Student Selector */}
        <div className="print:hidden">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {isLoading ? "Loading…" : `${filtered.length} students`}
              </p>
            </div>
            <div className="divide-y divide-border max-h-[520px] overflow-y-auto scrollbar-thin">
              {isLoading ? (
                (["sk-a", "sk-b", "sk-c", "sk-d"] as const).map((k) => (
                  <div key={k} className="p-3">
                    <Skeleton className="h-10" />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div
                  className="p-8 text-center text-muted-foreground"
                  data-ocid="report_card.empty_state"
                >
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No students found</p>
                </div>
              ) : (
                filtered.map((r, i) => {
                  const isActive =
                    (selectedStudentId ?? reports[0]?.id) === r.id;
                  const total = calcTotal(r.subjects);
                  const max = calcMax(r.subjects);
                  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedStudentId(r.id)}
                      className={`w-full text-left px-4 py-3 transition-fast flex items-center gap-3 ${
                        isActive
                          ? "bg-primary/10 border-l-2 border-l-primary"
                          : "hover:bg-muted/40"
                      }`}
                      data-ocid={`report_card.item.${i + 1}`}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: isActive
                            ? "var(--color-primary)"
                            : "var(--color-primary-light)",
                          color: isActive ? "white" : "var(--color-primary)",
                        }}
                      >
                        {r.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {r.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.enrollmentNo}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded ${pct >= 75 ? "text-emerald-700 bg-emerald-50" : pct >= 50 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50"}`}
                      >
                        {pct}%
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Report Card Preview */}
        <div>
          {isLoading ? (
            <ReportSkeleton />
          ) : selectedReport ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedReport.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                ref={printRef}
              >
                <div className="flex items-center justify-between mb-4 print:hidden">
                  <p className="text-sm text-muted-foreground">
                    Viewing report for{" "}
                    <strong className="text-foreground">
                      {selectedReport.name}
                    </strong>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => generateMutation.mutate(selectedReport)}
                      disabled={generateMutation.isPending}
                      data-ocid="report_card.generate_single.button"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {generateMutation.isPending ? "…" : "Generate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => toast.success("PDF download initiated")}
                      data-ocid="report_card.download.button"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 btn-school-primary"
                      onClick={handlePrint}
                      data-ocid="report_card.print.button"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </Button>
                  </div>
                </div>
                <ReportCardDocument
                  report={selectedReport}
                  schoolName={profile.schoolName}
                  schoolLogo={profile.logo}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-2xl text-muted-foreground"
              data-ocid="report_card.empty_state"
            >
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">
                Select a student to preview their report card
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
