import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { isDemoMode } from "@/lib/demoMode";
import { mockStudents, withDelay } from "@/lib/mockData";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, Download, Printer } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type CardTemplate = "classic" | "modern" | "minimal";

type ApiStudent = {
  id: string;
  name: string;
  grade: string;
  class: string;
  photo?: string;
  cardUrl?: string;
};

const templates: { id: CardTemplate; label: string; description: string }[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Traditional school card with logo bar",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Gradient accent with bold typography",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Clean white card, understated style",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function CardPreview({
  student,
  template,
}: { student: ApiStudent; template: CardTemplate }) {
  const isModern = template === "modern";
  const isMinimal = template === "minimal";
  return (
    <div
      className={`w-80 rounded-2xl overflow-hidden shadow-xl border ${
        isModern
          ? "border-primary/30 bg-gradient-to-br from-[oklch(0.25_0.06_240)] to-[oklch(0.35_0.08_255)]"
          : isMinimal
            ? "border-border bg-background"
            : "border-border bg-card"
      }`}
    >
      <div
        className={`px-5 py-3 flex items-center gap-2 ${isModern ? "bg-primary/20" : isMinimal ? "bg-muted/50" : "bg-primary"}`}
      >
        <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
          <CreditCard
            className={`w-4 h-4 ${isModern || !isMinimal ? "text-white" : "text-primary"}`}
          />
        </div>
        <span
          className={`text-sm font-bold tracking-wide ${isModern ? "text-white" : isMinimal ? "text-foreground" : "text-white"}`}
        >
          Central High School
        </span>
      </div>
      <div className="px-5 py-5 flex items-start gap-4">
        <Avatar className="w-16 h-16 rounded-xl border-2 border-primary/30 flex-shrink-0">
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.name}
              className="rounded-xl object-cover"
            />
          ) : (
            <AvatarFallback
              className={`text-xl font-bold rounded-xl ${isModern ? "bg-primary/30 text-white" : "bg-primary/10 text-primary"}`}
            >
              {initials(student.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <p
            className={`font-bold text-base leading-tight ${isModern ? "text-white" : "text-foreground"}`}
          >
            {student.name}
          </p>
          <p
            className={`text-xs mt-1 ${isModern ? "text-white/70" : "text-muted-foreground"}`}
          >
            {student.grade} · Class {student.class}
          </p>
          <Badge
            variant="outline"
            className={`mt-2 text-[10px] ${isModern ? "border-white/30 text-white/80" : "border-primary/30 text-primary"}`}
          >
            STUDENT
          </Badge>
        </div>
      </div>
      <div
        className={`px-5 py-3 border-t ${isModern ? "border-white/10 bg-black/20" : isMinimal ? "border-border bg-muted/30" : "border-border bg-muted/50"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className={`text-[9px] uppercase tracking-widest font-semibold ${isModern ? "text-white/50" : "text-muted-foreground"}`}
            >
              Student ID
            </p>
            <p
              className={`text-xs font-mono font-bold mt-0.5 ${isModern ? "text-white" : "text-foreground"}`}
            >
              {student.id}
            </p>
          </div>
          <div className="flex gap-0.5">
            {(
              [
                "b1",
                "b2",
                "b3",
                "b4",
                "b5",
                "b6",
                "b7",
                "b8",
                "b9",
                "b10",
                "b11",
              ] as const
            ).map((id, idx) => {
              const heights = [3, 5, 2, 6, 4, 3, 5, 2, 4, 6, 3];
              return (
                <div
                  key={id}
                  style={{ height: `${heights[idx] * 3}px` }}
                  className={`w-0.5 rounded-sm ${isModern ? "bg-white/60" : isMinimal ? "bg-muted-foreground/50" : "bg-foreground/40"}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function useStudentsForCards() {
  return useQuery<ApiStudent[]>({
    queryKey: ["id-card-students"],
    queryFn: async () => {
      if (isDemoMode()) {
        return withDelay(
          mockStudents.map((s) => ({
            id: s.id,
            name: s.name,
            grade: s.grade,
            class: s.class,
          })),
        );
      }
      const res = await api.get<{ data: ApiStudent[] }>("/students?limit=50");
      if (!res.success) throw new Error(res.error ?? "Failed to load students");
      const d = res.data;
      if (!d) return [];
      if ("data" in d) return d.data;
      return d as unknown as ApiStudent[];
    },
  });
}

export default function IDCardPage() {
  const { data: students = [], isLoading } = useStudentsForCards();
  const [template, setTemplate] = useState<CardTemplate>("classic");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const student =
    students.find((s) => s.id === selectedStudentId) ?? students[0];

  const generateMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const s = students.find((st) => st.id === studentId);
      if (isDemoMode()) {
        await withDelay(null, 600);
        return { cardUrl: null, name: s?.name };
      }
      const res = await api.post<{
        cards: { studentId: string; cardUrl: string }[];
      }>("/id-cards/generate", { studentIds: [studentId] });
      if (!res.success) throw new Error(res.error ?? "Failed to generate card");
      return { cardUrl: res.data?.cards?.[0]?.cardUrl, name: s?.name };
    },
    onSuccess: (data) => {
      if (data?.cardUrl) window.open(data.cardUrl, "_blank");
      else toast.success(`ID card generated for ${data?.name ?? "student"}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const printMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const s = students.find((st) => st.id === studentId);
      if (isDemoMode()) {
        await withDelay(null, 400);
        return s?.name;
      }
      const res = await api.get<{ cardUrl: string }>(`/id-cards/${studentId}`);
      if (!res.success) throw new Error(res.error ?? "Failed to get card");
      if (res.data?.cardUrl) window.open(res.data.cardUrl, "_blank");
      return s?.name;
    },
    onSuccess: (name) =>
      toast.success(`Printing ID card for ${name ?? "student"}`),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-foreground">
          ID Card Generation
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Design and print student identification cards
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Config Panel */}
        <div className="space-y-5">
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h2 className="font-semibold text-foreground mb-4">
              Card Template
            </h2>
            <div className="space-y-3">
              {templates.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                    template === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/50"
                  }`}
                  data-ocid={`id_card.${t.id}.toggle`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={template === t.id}
                    onChange={() => setTemplate(t.id)}
                    className="accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h2 className="font-semibold text-foreground mb-3">
              Select Student
            </h2>
            {isLoading ? (
              <Skeleton
                className="h-10 w-full"
                data-ocid="id_card.loading_state"
              />
            ) : (
              <div className="space-y-2">
                <Label className="text-xs">Student</Label>
                <Select
                  value={selectedStudentId || students[0]?.id}
                  onValueChange={setSelectedStudentId}
                >
                  <SelectTrigger data-ocid="id_card.student.select">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · {s.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2"
              onClick={() => student && printMutation.mutate(student.id)}
              disabled={printMutation.isPending || !student}
              data-ocid="id_card.print.button"
            >
              <Printer className="w-4 h-4" />
              {printMutation.isPending ? "Printing..." : "Print Card"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => student && generateMutation.mutate(student.id)}
              disabled={generateMutation.isPending || !student}
              data-ocid="id_card.export.button"
            >
              <Download className="w-4 h-4" />
              {generateMutation.isPending ? "Exporting..." : "Export PNG"}
            </Button>
          </div>
        </div>

        {/* Preview Panel */}
        <div
          className="bg-card rounded-xl border border-border shadow-card p-6 flex flex-col items-center justify-center gap-4"
          data-ocid="id_card.panel"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Preview
          </p>
          {isLoading ? (
            <Skeleton className="w-80 h-60 rounded-2xl" />
          ) : student ? (
            <CardPreview student={student} template={template} />
          ) : (
            <div
              className="text-center text-muted-foreground"
              data-ocid="id_card.empty_state"
            >
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a student to preview</p>
            </div>
          )}
          {student && (
            <p className="text-xs text-muted-foreground">
              Template: {template.charAt(0).toUpperCase() + template.slice(1)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
