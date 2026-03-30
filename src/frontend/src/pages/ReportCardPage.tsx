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
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Save } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const SUBJECTS = ["Math", "English", "Science", "History", "PE"];
const TERMS = ["Term 1", "Term 2", "Term 3"];
const CLASSES = ["10A", "10B", "11A", "11B", "12A"];

type StudentGrades = {
  id: string;
  name: string;
  grades: Record<string, number | "">;
};

const initialStudents: StudentGrades[] = [
  {
    id: "s1",
    name: "Adaeze Okonkwo",
    grades: { Math: 78, English: 85, Science: 82, History: 74, PE: 90 },
  },
  {
    id: "s2",
    name: "Emeka Nwosu",
    grades: { Math: 92, English: 88, Science: 95, History: 80, PE: 76 },
  },
  {
    id: "s3",
    name: "Fatima Al-Hassan",
    grades: { Math: 65, English: 72, Science: 70, History: 68, PE: 88 },
  },
  {
    id: "s4",
    name: "Kofi Mensah",
    grades: { Math: 88, English: 91, Science: 84, History: 89, PE: 82 },
  },
  {
    id: "s5",
    name: "Amara Diallo",
    grades: { Math: 74, English: 78, Science: 72, History: 76, PE: 95 },
  },
  {
    id: "s6",
    name: "Chidi Obi",
    grades: { Math: 55, English: 62, Science: 58, History: 60, PE: 72 },
  },
];

const initialWeights: Record<string, number> = {
  Math: 25,
  English: 20,
  Science: 25,
  History: 20,
  PE: 10,
};

function letterGrade(score: number) {
  if (score >= 90) return { grade: "A+", cls: "text-success" };
  if (score >= 80) return { grade: "A", cls: "text-success" };
  if (score >= 70) return { grade: "B", cls: "text-primary" };
  if (score >= 60) return { grade: "C", cls: "text-warning" };
  if (score >= 50) return { grade: "D", cls: "text-warning" };
  return { grade: "F", cls: "text-destructive" };
}

export default function ReportCardPage() {
  const [term, setTerm] = useState("Term 1");
  const [selectedClass, setSelectedClass] = useState("10A");
  const [students, setStudents] = useState<StudentGrades[]>(initialStudents);
  const [weights, setWeights] =
    useState<Record<string, number>>(initialWeights);

  function updateGrade(studentId: string, subject: string, value: string) {
    const num = value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, grades: { ...s.grades, [subject]: num } }
          : s,
      ),
    );
  }

  function weightedAvg(grades: Record<string, number | "">) {
    let total = 0;
    let totalWeight = 0;
    for (const sub of SUBJECTS) {
      const g = grades[sub];
      if (g !== "") {
        total += Number(g) * (weights[sub] / 100);
        totalWeight += weights[sub] / 100;
      }
    }
    return totalWeight > 0 ? Math.round(total / totalWeight) : 0;
  }

  function handleSave() {
    toast.success(`Grades saved for ${term} – Class ${selectedClass}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Report Card Generation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enter grades, configure weights, and export term reports
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="w-32" data-ocid="report_card.term.select">
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
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger
              className="w-28"
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
        </div>
      </div>

      <Tabs defaultValue="grades">
        <TabsList data-ocid="report_card.tab">
          <TabsTrigger value="grades">Grade Entry</TabsTrigger>
          <TabsTrigger value="weights">Subject Weights</TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                Grade Entry — {term} · Class {selectedClass}
              </h2>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleSave}
                data-ocid="report_card.save_button"
              >
                <Save className="w-3.5 h-3.5" /> Save Grades
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="report_card.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    {SUBJECTS.map((s) => (
                      <TableHead key={s}>{s}</TableHead>
                    ))}
                    <TableHead>Avg</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Export</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, i) => {
                    const avg = weightedAvg(student.grades);
                    const { grade, cls } = letterGrade(avg);
                    return (
                      <TableRow
                        key={student.id}
                        data-ocid={`report_card.item.${i + 1}`}
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {student.name}
                        </TableCell>
                        {SUBJECTS.map((sub) => (
                          <TableCell key={sub}>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={student.grades[sub]}
                              onChange={(e) =>
                                updateGrade(student.id, sub, e.target.value)
                              }
                              className="w-16 h-7 text-xs text-center"
                              data-ocid={`report_card.${sub.toLowerCase()}.input`}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="font-bold">{avg}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${cls} border-current text-xs`}
                          >
                            {grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs"
                            onClick={() =>
                              toast.success(
                                `Downloading report card for ${student.name}`,
                              )
                            }
                            data-ocid={`report_card.download.${i + 1}.button`}
                          >
                            <Download className="w-3 h-3" /> PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="weights" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-foreground">
                Subject Weight Configuration
              </h2>
              <p className="text-xs text-muted-foreground">
                Total: {Object.values(weights).reduce((a, b) => a + b, 0)}%
              </p>
            </div>
            <div className="space-y-6 max-w-xl">
              {SUBJECTS.map((sub) => (
                <div key={sub} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{sub}</Label>
                    <span className="text-sm font-bold text-primary">
                      {weights[sub]}%
                    </span>
                  </div>
                  <Slider
                    value={[weights[sub]]}
                    onValueChange={([v]) =>
                      setWeights((prev) => ({ ...prev, [sub]: v }))
                    }
                    min={0}
                    max={50}
                    step={5}
                    className="w-full"
                    data-ocid={`report_card.${sub.toLowerCase()}_weight.input`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-border">
              <Button
                className="gap-2"
                onClick={() => toast.success("Weight configuration saved")}
                data-ocid="report_card.weights.save_button"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Term Report export */}
      <div className="bg-card rounded-xl border border-border shadow-card p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">Term Report — {term}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {students.length} students · Class {selectedClass}
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => toast.success(`Generating PDF report for ${term}...`)}
          data-ocid="report_card.term_export.button"
        >
          <FileText className="w-4 h-4" /> Export Term Report
        </Button>
      </div>
    </motion.div>
  );
}
