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
import { CreditCard, Download, Printer } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type CardTemplate = "classic" | "modern" | "minimal";

const students = [
  {
    id: "ENR-2026-0001",
    name: "Adaeze Okonkwo",
    grade: "Grade 10",
    class: "10A",
    photo: "AO",
  },
  {
    id: "ENR-2026-0002",
    name: "Emeka Nwosu",
    grade: "Grade 10",
    class: "10B",
    photo: "EN",
  },
  {
    id: "ENR-2026-0003",
    name: "Fatima Al-Hassan",
    grade: "Grade 11",
    class: "11A",
    photo: "FA",
  },
  {
    id: "ENR-2026-0004",
    name: "Kofi Mensah",
    grade: "Grade 9",
    class: "9C",
    photo: "KM",
  },
  {
    id: "ENR-2026-0005",
    name: "Amara Diallo",
    grade: "Grade 12",
    class: "12B",
    photo: "AD",
  },
];

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

function CardPreview({
  student,
  template,
}: { student: (typeof students)[0]; template: CardTemplate }) {
  const isModern = template === "modern";
  const isMinimal = template === "minimal";

  return (
    <div
      className={`w-80 rounded-2xl overflow-hidden shadow-xl border ${
        isModern
          ? "border-primary/30 bg-gradient-to-br from-[oklch(0.25_0.06_240)] to-[oklch(0.35_0.08_255)]"
          : isMinimal
            ? "border-border bg-white"
            : "border-border bg-card"
      }`}
    >
      {/* Header bar */}
      <div
        className={`px-5 py-3 flex items-center gap-2 ${
          isModern ? "bg-primary/20" : isMinimal ? "bg-muted/50" : "bg-primary"
        }`}
      >
        <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
          <CreditCard
            className={`w-4 h-4 ${isModern || !isMinimal ? "text-white" : "text-primary"}`}
          />
        </div>
        <span
          className={`text-sm font-bold tracking-wide ${
            isModern
              ? "text-white"
              : isMinimal
                ? "text-foreground"
                : "text-white"
          }`}
        >
          Central High School
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5 flex items-start gap-4">
        <Avatar className="w-16 h-16 rounded-xl border-2 border-primary/30 flex-shrink-0">
          <AvatarFallback
            className={`text-xl font-bold rounded-xl ${
              isModern
                ? "bg-primary/30 text-white"
                : "bg-primary/10 text-primary"
            }`}
          >
            {student.photo}
          </AvatarFallback>
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
            className={`mt-2 text-[10px] ${
              isModern
                ? "border-white/30 text-white/80"
                : "border-primary/30 text-primary"
            }`}
          >
            STUDENT
          </Badge>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`px-5 py-3 border-t ${
          isModern
            ? "border-white/10 bg-black/20"
            : isMinimal
              ? "border-border bg-muted/30"
              : "border-border bg-muted/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className={`text-[9px] uppercase tracking-widest font-semibold ${isModern ? "text-white/50" : "text-muted-foreground"}`}
            >
              Enrollment ID
            </p>
            <p
              className={`text-xs font-mono font-bold mt-0.5 ${isModern ? "text-white" : "text-foreground"}`}
            >
              {student.id}
            </p>
          </div>
          {/* Barcode placeholder */}
          <div className="flex gap-0.5">
            {(
              [
                { id: "b1", h: 3 },
                { id: "b2", h: 5 },
                { id: "b3", h: 2 },
                { id: "b4", h: 6 },
                { id: "b5", h: 4 },
                { id: "b6", h: 3 },
                { id: "b7", h: 5 },
                { id: "b8", h: 2 },
                { id: "b9", h: 4 },
                { id: "b10", h: 6 },
                { id: "b11", h: 3 },
              ] as { id: string; h: number }[]
            ).map(({ id, h }) => (
              <div
                key={id}
                style={{ height: `${h * 3}px` }}
                className={`w-0.5 rounded-sm ${
                  isModern
                    ? "bg-white/60"
                    : isMinimal
                      ? "bg-muted-foreground/50"
                      : "bg-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IDCardPage() {
  const [template, setTemplate] = useState<CardTemplate>("classic");
  const [selectedStudentId, setSelectedStudentId] = useState(students[0].id);

  const student =
    students.find((s) => s.id === selectedStudentId) ?? students[0];

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
          {/* Template Selector */}
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

          {/* Student Selector */}
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h2 className="font-semibold text-foreground mb-3">
              Select Student
            </h2>
            <div className="space-y-2">
              <Label className="text-xs">Student</Label>
              <Select
                value={selectedStudentId}
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
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2"
              onClick={() =>
                toast.success(`Printing ID card for ${student.name}`)
              }
              data-ocid="id_card.print.button"
            >
              <Printer className="w-4 h-4" /> Print Card
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() =>
                toast.success(`Exporting ID card for ${student.name} as PNG`)
              }
              data-ocid="id_card.export.button"
            >
              <Download className="w-4 h-4" /> Export PNG
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
          <CardPreview student={student} template={template} />
          <p className="text-xs text-muted-foreground">
            Template: {template.charAt(0).toUpperCase() + template.slice(1)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
