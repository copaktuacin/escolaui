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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const CLASSES = ["10A", "10B", "11A", "11B"];
const SUBJECTS = [
  "Mathematics",
  "English",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = [1, 2, 3, 4, 5, 6];
const PERIOD_LABELS: Record<number, string> = {
  1: "7:30",
  2: "8:30",
  3: "9:30",
  4: "10:30",
  5: "11:30",
  6: "13:00",
};

type Student = {
  id: string;
  rollNo: number;
  name: string;
  grade: string;
  status: "active" | "inactive";
};
type AssessmentRow = {
  id: string;
  name: string;
  ca1: number | "";
  ca2: number | "";
  exam: number | "";
};
type LessonEntry = { subject: string; topic: string };

const rosterByClass: Record<string, Student[]> = {
  "10A": [
    {
      id: "s1",
      rollNo: 1,
      name: "Adaeze Okonkwo",
      grade: "10",
      status: "active",
    },
    { id: "s2", rollNo: 2, name: "Emeka Nwosu", grade: "10", status: "active" },
    {
      id: "s3",
      rollNo: 3,
      name: "Fatima Al-Hassan",
      grade: "10",
      status: "inactive",
    },
    { id: "s4", rollNo: 4, name: "Kofi Mensah", grade: "10", status: "active" },
    {
      id: "s5",
      rollNo: 5,
      name: "Amara Diallo",
      grade: "10",
      status: "active",
    },
  ],
  "10B": [
    { id: "s6", rollNo: 1, name: "Chidi Obi", grade: "10", status: "active" },
    {
      id: "s7",
      rollNo: 2,
      name: "Yemi Adeyemi",
      grade: "10",
      status: "active",
    },
  ],
  "11A": [
    {
      id: "s8",
      rollNo: 1,
      name: "Temi Bankole",
      grade: "11",
      status: "active",
    },
    { id: "s9", rollNo: 2, name: "Kola Aina", grade: "11", status: "active" },
  ],
  "11B": [
    {
      id: "s10",
      rollNo: 1,
      name: "Sola Martins",
      grade: "11",
      status: "active",
    },
  ],
};

const initialGrades: AssessmentRow[] = [
  { id: "s1", name: "Adaeze Okonkwo", ca1: 18, ca2: 17, exam: 62 },
  { id: "s2", name: "Emeka Nwosu", ca1: 20, ca2: 19, exam: 71 },
  { id: "s3", name: "Fatima Al-Hassan", ca1: 14, ca2: 12, exam: 49 },
  { id: "s4", name: "Kofi Mensah", ca1: 19, ca2: 18, exam: 65 },
  { id: "s5", name: "Amara Diallo", ca1: 16, ca2: 15, exam: 58 },
];

const initialLessons: Record<string, LessonEntry | null> = {
  "Mon-1": { subject: "Quadratic Equations", topic: "Factorisation" },
  "Mon-3": { subject: "Trigonometry", topic: "SOHCAHTOA intro" },
  "Tue-2": { subject: "Statistics", topic: "Mean & Median" },
  "Wed-4": { subject: "Algebra", topic: "Simultaneous Equations" },
  "Thu-1": { subject: "Geometry", topic: "Circle theorems" },
  "Fri-3": { subject: "Number Theory", topic: "HCF & LCM" },
};

export default function TeacherPage() {
  const [rosterClass, setRosterClass] = useState("10A");
  const [gradebookSubject, setGradebookSubject] = useState("Mathematics");
  const [grades, setGrades] = useState<AssessmentRow[]>(initialGrades);
  const [lessons, setLessons] =
    useState<Record<string, LessonEntry | null>>(initialLessons);
  const [editLesson, setEditLesson] = useState<{
    key: string;
    subject: string;
    topic: string;
  } | null>(null);

  function updateAssessment(
    id: string,
    field: "ca1" | "ca2" | "exam",
    val: string,
  ) {
    const num = val === "" ? "" : Math.min(100, Math.max(0, Number(val)));
    setGrades((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: num } : g)),
    );
  }

  function total(row: AssessmentRow) {
    const { ca1, ca2, exam } = row;
    if (ca1 === "" || ca2 === "" || exam === "") return "–";
    return (Number(ca1) + Number(ca2) + Number(exam)).toString();
  }

  function saveLesson() {
    if (!editLesson) return;
    setLessons((prev) => ({
      ...prev,
      [editLesson.key]: {
        subject: editLesson.subject,
        topic: editLesson.topic,
      },
    }));
    toast.success("Lesson saved");
    setEditLesson(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-foreground">Teacher Portal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Class roster, gradebook, and lesson planning tools
        </p>
      </div>

      <Tabs defaultValue="roster">
        <TabsList data-ocid="teacher.tab">
          <TabsTrigger value="roster">Class Roster</TabsTrigger>
          <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
          <TabsTrigger value="planner">Lesson Planner</TabsTrigger>
        </TabsList>

        {/* Roster */}
        <TabsContent value="roster" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-3">
              <h2 className="font-semibold text-foreground flex-1">
                Class Roster
              </h2>
              <Select value={rosterClass} onValueChange={setRosterClass}>
                <SelectTrigger
                  className="w-28"
                  data-ocid="teacher.roster_class.select"
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
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="teacher.roster.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Roll No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rosterByClass[rosterClass] ?? []).map((s, i) => (
                    <TableRow
                      key={s.id}
                      data-ocid={`teacher.roster.item.${i + 1}`}
                    >
                      <TableCell className="font-mono text-muted-foreground">
                        {String(s.rollNo).padStart(2, "0")}
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>Grade {s.grade}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            s.status === "active"
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Gradebook */}
        <TabsContent value="gradebook" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-3">
              <h2 className="font-semibold text-foreground flex-1">
                Gradebook
              </h2>
              <Select
                value={gradebookSubject}
                onValueChange={setGradebookSubject}
              >
                <SelectTrigger
                  className="w-40"
                  data-ocid="teacher.gradebook_subject.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="teacher.gradebook.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>CA1 (/20)</TableHead>
                    <TableHead>CA2 (/20)</TableHead>
                    <TableHead>Exam (/60)</TableHead>
                    <TableHead>Total (/100)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((g, i) => (
                    <TableRow
                      key={g.id}
                      data-ocid={`teacher.gradebook.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">{g.name}</TableCell>
                      {(["ca1", "ca2", "exam"] as const).map((field) => (
                        <TableCell key={field}>
                          <Input
                            type="number"
                            value={g[field]}
                            onChange={(e) =>
                              updateAssessment(g.id, field, e.target.value)
                            }
                            className="w-16 h-7 text-xs text-center"
                            data-ocid={`teacher.${field}.input`}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="font-bold">{total(g)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <Button
                size="sm"
                className="gap-2"
                onClick={() => toast.success("Gradebook saved")}
                data-ocid="teacher.gradebook.save_button"
              >
                Save Grades
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Lesson Planner */}
        <TabsContent value="planner" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">
                Weekly Lesson Planner
              </h2>
            </div>
            <div className="overflow-x-auto">
              <div
                className="grid min-w-[640px]"
                style={{ gridTemplateColumns: "80px repeat(5, 1fr)" }}
              >
                {/* Header */}
                <div className="bg-muted/40 border-b border-r border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Period
                </div>
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="bg-muted/40 border-b border-r last:border-r-0 border-border px-3 py-2 text-center text-xs font-bold text-foreground"
                  >
                    {d}
                  </div>
                ))}
                {PERIODS.map((period) => (
                  <>
                    <div
                      key={`p-${period}`}
                      className="border-b border-r border-border px-2 py-3 flex flex-col items-center justify-center bg-muted/20"
                    >
                      <span className="text-xs font-bold">{period}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {PERIOD_LABELS[period]}
                      </span>
                    </div>
                    {DAYS.map((day) => {
                      const key = `${day}-${period}`;
                      const lesson = lessons[key];
                      return (
                        <div
                          key={key}
                          className="border-b border-r last:border-r-0 border-border min-h-[72px] p-1"
                        >
                          {lesson ? (
                            <div className="h-full rounded-md bg-primary/5 border border-primary/20 p-2 flex flex-col justify-between">
                              <p className="text-xs font-semibold text-primary leading-tight">
                                {lesson.subject}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {lesson.topic}
                              </p>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-[10px] text-primary/60 hover:text-primary underline text-left"
                                    onClick={() =>
                                      setEditLesson({
                                        key,
                                        subject: lesson.subject,
                                        topic: lesson.topic,
                                      })
                                    }
                                    data-ocid="teacher.planner.edit.button"
                                  >
                                    edit
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-60"
                                  data-ocid="teacher.planner.popover"
                                >
                                  <div className="space-y-3">
                                    <Label className="text-xs">Subject</Label>
                                    <Input
                                      value={
                                        editLesson?.key === key
                                          ? editLesson.subject
                                          : lesson.subject
                                      }
                                      onChange={(e) =>
                                        setEditLesson((el) =>
                                          el
                                            ? { ...el, subject: e.target.value }
                                            : null,
                                        )
                                      }
                                      className="h-7 text-xs"
                                    />
                                    <Label className="text-xs">Topic</Label>
                                    <Input
                                      value={
                                        editLesson?.key === key
                                          ? editLesson.topic
                                          : lesson.topic
                                      }
                                      onChange={(e) =>
                                        setEditLesson((el) =>
                                          el
                                            ? { ...el, topic: e.target.value }
                                            : null,
                                        )
                                      }
                                      className="h-7 text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      className="w-full"
                                      onClick={saveLesson}
                                      data-ocid="teacher.planner.save_button"
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="w-full h-full flex items-center justify-center text-muted-foreground/30 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                                  onClick={() =>
                                    setEditLesson({
                                      key,
                                      subject: "",
                                      topic: "",
                                    })
                                  }
                                  data-ocid="teacher.planner.add.button"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-60"
                                data-ocid="teacher.planner.popover"
                              >
                                <div className="space-y-3">
                                  <p className="text-sm font-medium">
                                    Add Lesson
                                  </p>
                                  <div>
                                    <Label className="text-xs">Subject</Label>
                                    <Input
                                      value={
                                        editLesson?.key === key
                                          ? editLesson.subject
                                          : ""
                                      }
                                      onChange={(e) =>
                                        setEditLesson((el) =>
                                          el
                                            ? { ...el, subject: e.target.value }
                                            : {
                                                key,
                                                subject: e.target.value,
                                                topic: "",
                                              },
                                        )
                                      }
                                      className="mt-1 h-7 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Topic</Label>
                                    <Input
                                      value={
                                        editLesson?.key === key
                                          ? editLesson.topic
                                          : ""
                                      }
                                      onChange={(e) =>
                                        setEditLesson((el) =>
                                          el
                                            ? { ...el, topic: e.target.value }
                                            : {
                                                key,
                                                subject: "",
                                                topic: e.target.value,
                                              },
                                        )
                                      }
                                      className="mt-1 h-7 text-xs"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={saveLesson}
                                    data-ocid="teacher.planner.save_button"
                                  >
                                    Add Lesson
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
