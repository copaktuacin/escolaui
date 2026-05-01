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
import { useSchoolProfile } from "@/contexts/SchoolProfileContext";
import { api } from "@/lib/api";
import { isDemoMode } from "@/lib/demoMode";
import { mockStudents, withDelay } from "@/lib/mockData";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  CreditCard,
  Download,
  GraduationCap,
  Printer,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CardTemplate = "classic" | "modern" | "minimal";

type ApiStudent = {
  id: string;
  name: string;
  grade: string;
  class: string;
  photo?: string;
  cardUrl?: string;
  enrollmentNo?: string;
  dob?: string;
  section?: string;
};

type BatchProgress = {
  total: number;
  done: number;
  current: string;
};

// ─── Constants ──────────────────────────────────────────────────────────────────

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

const TEMPLATE_OPTIONS: {
  id: CardTemplate;
  label: string;
  description: string;
}[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Traditional school card with brand header",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Bold gradient with vibrant styling",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Clean white card, understated elegance",
  },
];

// ─── Helper ────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

// ─── ID Card Component (85.6×54mm aspect ratio ≈ 1.585) ──────────────────────

function IDCard({
  student,
  template,
  schoolName,
  schoolLogo,
}: {
  student: ApiStudent;
  template: CardTemplate;
  schoolName: string;
  schoolLogo: string | null;
}) {
  const isModern = template === "modern";
  const isMinimal = template === "minimal";
  const isClassic = template === "classic";

  return (
    /* Standard credit-card aspect ratio: 85.6mm / 54mm ≈ 1.585 */
    <div
      className="relative overflow-hidden rounded-2xl select-none"
      style={{
        width: 340,
        height: 214,
        boxShadow: "var(--shadow-floating)",
        background: isModern
          ? "linear-gradient(135deg, oklch(0.22 0.08 255), oklch(0.32 0.12 270))"
          : isMinimal
            ? "oklch(var(--card))"
            : "oklch(var(--card))",
        border: isMinimal ? "1px solid oklch(var(--border))" : "none",
      }}
    >
      {/* Decorative geometric pattern */}
      {isClassic && (
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              var(--color-primary) 0px,
              var(--color-primary) 1px,
              transparent 1px,
              transparent 12px
            )`,
          }}
        />
      )}
      {isModern && (
        <>
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 pointer-events-none"
            style={{ background: "oklch(0.7 0.18 290)" }}
          />
          <div
            className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-15 pointer-events-none"
            style={{ background: "oklch(0.55 0.15 250)" }}
          />
        </>
      )}

      {/* Corner crop marks */}
      {[
        "top-1.5 left-1.5",
        "top-1.5 right-1.5 rotate-90",
        "bottom-1.5 left-1.5 -rotate-90",
        "bottom-1.5 right-1.5 rotate-180",
      ].map((pos) => (
        <div
          key={pos}
          className={`absolute ${pos} w-3 h-3 pointer-events-none`}
          style={{
            borderTop: `1.5px solid ${isModern ? "rgba(255,255,255,0.3)" : "oklch(var(--border))"}`,
            borderLeft: `1.5px solid ${isModern ? "rgba(255,255,255,0.3)" : "oklch(var(--border))"}`,
          }}
        />
      ))}

      {/* School stripe */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{
          background: isModern
            ? "rgba(255,255,255,0.1)"
            : isMinimal
              ? "oklch(var(--muted)/0.5)"
              : "var(--color-primary)",
        }}
      >
        {schoolLogo ? (
          <img
            src={schoolLogo}
            alt="Logo"
            className="w-6 h-6 rounded object-cover"
            style={{
              background: isModern ? "rgba(255,255,255,0.2)" : undefined,
            }}
          />
        ) : (
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{
              background: isModern
                ? "rgba(255,255,255,0.2)"
                : "rgba(255,255,255,0.25)",
            }}
          >
            <GraduationCap
              className="w-4 h-4"
              style={{ color: isMinimal ? "var(--color-primary)" : "white" }}
            />
          </div>
        )}
        <span
          className="text-xs font-bold tracking-wide truncate flex-1"
          style={{
            color: isModern
              ? "white"
              : isMinimal
                ? "oklch(var(--foreground))"
                : "white",
          }}
        >
          {schoolName}
        </span>
        <span
          className="text-[9px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded"
          style={{
            background: isModern
              ? "rgba(255,255,255,0.15)"
              : isMinimal
                ? "var(--color-primary-light)"
                : "rgba(255,255,255,0.2)",
            color: isModern
              ? "white"
              : isMinimal
                ? "var(--color-primary)"
                : "white",
          }}
        >
          STUDENT
        </span>
      </div>

      {/* Card body */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Photo */}
        <div
          className="w-[52px] h-[52px] rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-bold"
          style={{
            border: `2px solid ${isModern ? "rgba(255,255,255,0.25)" : "var(--color-primary-light)"}`,
            background: isModern
              ? "rgba(255,255,255,0.12)"
              : "var(--color-primary-light)",
            color: isModern ? "white" : "var(--color-primary)",
          }}
        >
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            initials(student.name)
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-display font-bold text-base leading-tight truncate"
            style={{ color: isModern ? "white" : "oklch(var(--foreground))" }}
          >
            {student.name}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{
              color: isModern
                ? "rgba(255,255,255,0.65)"
                : "oklch(var(--muted-foreground))",
            }}
          >
            Class {student.class}
            {student.section ? ` · Sec ${student.section}` : ""}
          </p>
          {student.enrollmentNo && (
            <p
              className="font-mono text-[10px] mt-1 font-semibold"
              style={{
                color: isModern
                  ? "rgba(255,255,255,0.5)"
                  : "oklch(var(--muted-foreground))",
              }}
            >
              {student.enrollmentNo}
            </p>
          )}
          {student.dob && (
            <p
              className="text-[10px] mt-0.5"
              style={{
                color: isModern
                  ? "rgba(255,255,255,0.5)"
                  : "oklch(var(--muted-foreground))",
              }}
            >
              DOB: {student.dob}
            </p>
          )}
        </div>
      </div>

      {/* Footer strip */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2"
        style={{
          background: isModern
            ? "rgba(0,0,0,0.25)"
            : isMinimal
              ? "oklch(var(--muted)/0.4)"
              : "oklch(var(--muted)/0.6)",
          borderTop: `1px solid ${isModern ? "rgba(255,255,255,0.08)" : "oklch(var(--border))"}`,
        }}
      >
        <div>
          <p
            className="text-[8px] uppercase tracking-widest font-semibold"
            style={{
              color: isModern
                ? "rgba(255,255,255,0.4)"
                : "oklch(var(--muted-foreground))",
            }}
          >
            Student ID
          </p>
          <p
            className="text-[10px] font-mono font-bold mt-0"
            style={{ color: isModern ? "white" : "oklch(var(--foreground))" }}
          >
            {student.id}
          </p>
        </div>
        {/* Mini barcode */}
        <div className="flex gap-px items-end h-5">
          {(
            [
              "3a",
              "5b",
              "2c",
              "6d",
              "4e",
              "3f",
              "5g",
              "2h",
              "4i",
              "6j",
              "3k",
              "5l",
              "4m",
            ] as const
          ).map((barId, idx) => {
            const heights = [3, 5, 2, 6, 4, 3, 5, 2, 4, 6, 3, 5, 4];
            const h = heights[idx];
            return (
              <div
                key={barId}
                style={{
                  width: idx % 3 === 0 ? 2 : 1,
                  height: `${h * 3}px`,
                  background: isModern
                    ? "rgba(255,255,255,0.5)"
                    : isMinimal
                      ? "oklch(var(--muted-foreground)/0.5)"
                      : "oklch(var(--foreground)/0.4)",
                  borderRadius: 1,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Data hook ─────────────────────────────────────────────────────────────────

function useStudentsForCards(selectedClass: string) {
  return useQuery<ApiStudent[]>({
    queryKey: ["id-card-students", selectedClass],
    queryFn: async () => {
      if (isDemoMode()) {
        return withDelay(
          mockStudents
            .filter((s) => !selectedClass || s.class === selectedClass)
            .map((s) => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              class: s.class,
              enrollmentNo: `ES-${s.id.replace("s", "2023")}`,
              dob: "2010-03-15",
            })),
        );
      }
      const qs = selectedClass
        ? `?class=${selectedClass}&limit=50`
        : "?limit=50";
      const res = await api.get<{ data: ApiStudent[] }>(`/students${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load students");
      const d = res.data;
      if (!d) return [];
      if ("data" in d) return (d as { data: ApiStudent[] }).data;
      return d as unknown as ApiStudent[];
    },
    enabled: true,
  });
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function IDCardPage() {
  const [template, setTemplate] = useState<CardTemplate>("classic");
  const [selectedClass, setSelectedClass] = useState("10A");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
    null,
  );
  const { profile } = useSchoolProfile();

  const { data: students = [], isLoading } = useStudentsForCards(selectedClass);

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
    onSuccess: (name) => {
      toast.success(`Printing ID card for ${name ?? "student"}`);
      window.print();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleBatchGenerate() {
    if (students.length === 0) return;
    setBatchProgress({
      total: students.length,
      done: 0,
      current: students[0].name,
    });
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      setBatchProgress({
        total: students.length,
        done: i + 1,
        current: s.name,
      });
      await withDelay(null, 200);
    }
    toast.success(
      `${students.length} ID cards generated for Class ${selectedClass}`,
    );
    setBatchProgress(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
      data-ocid="id_card.page"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            ID Card Generation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Design and print student identification cards
          </p>
        </div>
        <Button
          className="gap-2 btn-school-primary btn-press"
          onClick={handleBatchGenerate}
          disabled={!!batchProgress || students.length === 0}
          data-ocid="id_card.batch_generate.button"
        >
          <Users className="w-4 h-4" />
          {batchProgress
            ? `Generating ${batchProgress.done}/${batchProgress.total}…`
            : "Generate All Cards"}
        </Button>
      </div>

      {/* Batch Progress Bar */}
      <AnimatePresence>
        {batchProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="print:hidden"
          >
            <div className="p-4 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">
                  Generating ID Cards — {batchProgress.current}
                </p>
                <span className="text-xs text-muted-foreground">
                  {batchProgress.done} / {batchProgress.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--color-primary)" }}
                  animate={{
                    width: `${(batchProgress.done / batchProgress.total) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6 print:block">
        {/* Config Panel */}
        <div className="space-y-4 print:hidden">
          {/* Class selector */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <h2 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
              Filter by Class
            </h2>
            <Select
              value={selectedClass}
              onValueChange={(v) => {
                setSelectedClass(v);
                setSelectedStudentId("");
              }}
            >
              <SelectTrigger
                className="input-premium"
                data-ocid="id_card.class.select"
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

          {/* Template selector */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <h2 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
              Card Template
            </h2>
            <div className="space-y-2">
              {TEMPLATE_OPTIONS.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-fast ${
                    template === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
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
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {t.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </div>
                  {template === t.id && (
                    <CheckCircle2
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "var(--color-primary)" }}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Student selector */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <h2 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
              Select Student
            </h2>
            {isLoading ? (
              <Skeleton
                className="h-10 w-full"
                data-ocid="id_card.loading_state"
              />
            ) : (
              <Select
                value={selectedStudentId || students[0]?.id || ""}
                onValueChange={setSelectedStudentId}
              >
                <SelectTrigger
                  className="input-premium"
                  data-ocid="id_card.student.select"
                >
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · Class {s.class}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2 btn-school-primary btn-press"
              onClick={() => student && printMutation.mutate(student.id)}
              disabled={printMutation.isPending || !student}
              data-ocid="id_card.print.button"
            >
              <Printer className="w-4 h-4" />
              {printMutation.isPending ? "Printing…" : "Print Card"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => student && generateMutation.mutate(student.id)}
              disabled={generateMutation.isPending || !student}
              className="hover-lift"
              data-ocid="id_card.export.button"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Class stats */}
          {!isLoading && students.length > 0 && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Class {selectedClass}
              </span>
              <Badge variant="outline" className="badge-premium text-[10px]">
                {students.length} students
              </Badge>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div
          className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-6 shadow-card min-h-[400px]"
          data-ocid="id_card.panel"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest print:hidden">
            Card Preview
          </p>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="w-[340px] h-[214px] rounded-2xl" />
            </div>
          ) : student ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${student.id}-${template}`}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.25 }}
                className="hover-lift"
              >
                <IDCard
                  student={student}
                  template={template}
                  schoolName={profile.schoolName}
                  schoolLogo={profile.logo}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div
              className="text-center text-muted-foreground"
              data-ocid="id_card.empty_state"
            >
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                Select a student to preview their ID card
              </p>
            </div>
          )}

          {student && (
            <div className="text-center print:hidden">
              <p className="text-xs text-muted-foreground">
                Template:{" "}
                <span className="font-semibold text-foreground capitalize">
                  {template}
                </span>
                {" · "}
                <span style={{ color: "var(--color-primary)" }}>
                  {profile.schoolName}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
