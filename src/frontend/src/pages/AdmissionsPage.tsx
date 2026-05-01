import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdmissions, useVerifyAdmission } from "../hooks/useQueries";
import type { Application } from "../lib/mockData";

type FilterStatus = "all" | Application["status"];

const STATUS_CFG: Record<
  Application["status"],
  { label: string; dot: string; badge: string; icon: string }
> = {
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "⏳",
  },
  under_review: {
    label: "Under Review",
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "🔍",
  },
  approved: {
    label: "Approved",
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "✅",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-700 border-red-200",
    icon: "❌",
  },
  enrolled: {
    label: "Enrolled",
    dot: "bg-purple-400",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "🎓",
  },
};

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "enrolled", label: "Enrolled" },
];

const PAGE_SIZE = 8;

function generateEnrollmentId(_name: string, idx: number) {
  const year = new Date().getFullYear();
  const num = String(1000 + idx).padStart(4, "0");
  return `ENR-${year}-${num}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const avatarPalette = [
  "bg-primary/15 text-primary",
  "bg-success/15 text-success",
  "bg-purple-500/15 text-purple-600",
  "bg-warning/15 text-warning",
  "bg-cyan-500/15 text-cyan-600",
  "bg-rose-500/15 text-rose-600",
];

function StatusPill({ status }: { status: Application["status"] }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`badge-premium ${cfg.badge} border gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
      {cfg.label}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3" data-ocid="admissions.loading_state">
      {[1, 2, 3, 4, 5].map((k) => (
        <div key={k} className="flex gap-4 items-center px-2">
          <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3.5 w-16 hidden md:block" />
          <Skeleton className="h-3.5 w-20 hidden md:block" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Application Detail Modal ──────────────────────────────────────────────────

type DetailTab = "student" | "father" | "mother" | "guardian";

function ApplicationDetailModal({
  app,
  open,
  onClose,
}: { app: Application | null; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<DetailTab>("student");

  useEffect(() => {
    if (open) setTab("student");
  }, [open]);

  if (!app) return null;
  const cfg = STATUS_CFG[app.status];
  const initials = getInitials(app.applicantName);

  const detailTabs: { key: DetailTab; label: string }[] = [
    { key: "student", label: "Student" },
    { key: "father", label: "Father" },
    { key: "mother", label: "Mother" },
    { key: "guardian", label: "Guardian" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg rounded-2xl shadow-modal p-0 overflow-hidden border border-border/60"
        data-ocid="admissions.view.dialog"
      >
        {/* Header gradient */}
        <div className="relative px-6 pt-6 pb-5 border-b border-border bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-display text-lg font-bold">
              Application Details
            </DialogTitle>
          </DialogHeader>
          {/* Hero card */}
          <div className="glass rounded-2xl p-4 flex items-center gap-4 border border-white/30 shadow-subtle">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-card">
              <span className="font-display font-bold text-primary text-lg">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-base leading-tight truncate">
                {app.applicantName}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {app.id}
              </p>
              <div className="mt-2">
                <StatusPill status={app.status} />
              </div>
            </div>
            <div className="text-2xl">{cfg.icon}</div>
          </div>
        </div>

        <ScrollArea className="max-h-[58vh]">
          <div className="p-6 space-y-4">
            {/* Detail tab bar */}
            <div
              className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border/50"
              role="tablist"
            >
              {detailTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  data-ocid={`admissions.detail.${t.key}.tab`}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-fast ${
                    tab === t.key
                      ? "bg-card text-foreground shadow-subtle"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === "student" && (
                <motion.div
                  key="student"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="grid grid-cols-2 gap-2.5"
                >
                  {[
                    { label: "Full Name", value: app.applicantName },
                    { label: "Grade Applied", value: app.grade },
                    { label: "Date Applied", value: app.dateApplied },
                    { label: "Application ID", value: app.id },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="p-3 rounded-xl bg-muted/40 border border-border/50 hover-lift card-premium"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        {label}
                      </p>
                      <p className="font-semibold text-foreground text-sm">
                        {value}
                      </p>
                    </div>
                  ))}
                  <div className="col-span-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Status
                    </p>
                    <StatusPill status={app.status} />
                  </div>
                </motion.div>
              )}

              {(tab === "father" || tab === "mother") && (
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-4"
                >
                  <p className="font-display font-bold text-foreground text-sm capitalize flex items-center gap-2">
                    <span className="text-base">
                      {tab === "father" ? "👨" : "👩"}
                    </span>
                    {tab} Information
                  </p>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    {["Name", "Phone", "Email", "Occupation"].map((f) => (
                      <div key={f}>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">
                          {f}
                        </p>
                        <p className="font-medium text-foreground text-sm">–</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {tab === "guardian" && (
                <motion.div
                  key="guardian"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3"
                >
                  <p className="font-display font-bold text-foreground text-sm flex items-center gap-2">
                    <span className="text-base">👤</span> Guardian Information
                  </p>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    No additional guardian provided for this application.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl hover-lift transition-fast"
            data-ocid="admissions.view.close_button"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Application Form Dialog ──────────────────────────────────────────────

type FormStep = 1 | 2 | 3;
type GuardianTab = "father" | "mother" | "guardian";

interface NewApplicationFormData {
  fullName: string;
  dob: string;
  gender: string;
  classId: string;
  section: string;
  father: { name: string; phone: string; email: string };
  mother: { name: string; phone: string; email: string };
  guardian: { name: string; phone: string; email: string };
}

const EMPTY_FORM: NewApplicationFormData = {
  fullName: "",
  dob: "",
  gender: "",
  classId: "",
  section: "",
  father: { name: "", phone: "", email: "" },
  mother: { name: "", phone: "", email: "" },
  guardian: { name: "", phone: "", email: "" },
};

let _floatId = 0;

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [id] = useState(() => `fi-${++_floatId}`);
  return (
    <div className="floating-label">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? " "}
        required={required}
        className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm outline-none input-premium focus:border-primary/60 transition-fast"
      />
      <label htmlFor={id} className="pointer-events-none">
        {label}
        {required && " *"}
      </label>
    </div>
  );
}

function FloatingSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  const [id] = useState(() => `fs-${++_floatId}`);
  return (
    <div className="floating-label">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm outline-none input-premium focus:border-primary/60 transition-fast appearance-none"
      >
        <option value="" disabled />
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label htmlFor={id} className="pointer-events-none">
        {label}
        {required && " *"}
      </label>
    </div>
  );
}

function NewApplicationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<FormStep>(1);
  const [guardianTab, setGuardianTab] = useState<GuardianTab>("father");
  const [form, setForm] = useState<NewApplicationFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm(EMPTY_FORM);
    }
  }, [open]);

  function setField<K extends keyof NewApplicationFormData>(
    key: K,
    val: NewApplicationFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function setParentField(
    parent: GuardianTab,
    field: "name" | "phone" | "email",
    val: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: val },
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // Simulate POST /students with parentInfo block (API call preserved)
      await new Promise((r) => setTimeout(r, 1200));
      toast.success(`Application submitted for ${form.fullName}`, {
        description: `Class ${form.classId}${form.section} · Parent info recorded`,
      });
      onClose();
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { num: 1, label: "Personal Details" },
    { num: 2, label: "Parent Info" },
    { num: 3, label: "Review & Submit" },
  ];

  const parentTabs: GuardianTab[] = ["father", "mother", "guardian"];
  const parentLabels: Record<GuardianTab, string> = {
    father: "Father",
    mother: "Mother",
    guardian: "Guardian",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-xl rounded-2xl shadow-modal p-0 overflow-hidden border border-border/60"
        data-ocid="admissions.new.dialog"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-br from-primary/8 to-transparent">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              New Application
            </DialogTitle>
          </DialogHeader>

          {/* Step progress */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-smooth ${
                      step > s.num
                        ? "btn-school-primary"
                        : step === s.num
                          ? "bg-primary/15 text-primary border-2 border-primary/40"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.num ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold truncate ${step === s.num ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full transition-smooth ${step > s.num ? "bg-primary" : "bg-border"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Student Personal Details
                  </p>
                  <FloatingInput
                    label="Full Name"
                    value={form.fullName}
                    onChange={(v) => setField("fullName", v)}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput
                      label="Date of Birth"
                      type="date"
                      value={form.dob}
                      onChange={(v) => setField("dob", v)}
                    />
                    <FloatingSelect
                      label="Gender"
                      value={form.gender}
                      onChange={(v) => setField("gender", v)}
                      options={[
                        { value: "M", label: "Male" },
                        { value: "F", label: "Female" },
                        { value: "other", label: "Other" },
                      ]}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingSelect
                      label="Class"
                      value={form.classId}
                      onChange={(v) => setField("classId", v)}
                      options={[6, 7, 8, 9, 10, 11, 12].map((c) => ({
                        value: String(c),
                        label: `Class ${c}`,
                      }))}
                      required
                    />
                    <FloatingSelect
                      label="Section"
                      value={form.section}
                      onChange={(v) => setField("section", v)}
                      options={["A", "B", "C", "D"].map((s) => ({
                        value: s,
                        label: `Section ${s}`,
                      }))}
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Parent / Guardian Information
                  </p>
                  {/* Parent tabs */}
                  <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
                    {parentTabs.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setGuardianTab(t)}
                        data-ocid={`admissions.new.${t}.tab`}
                        className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-fast ${
                          guardianTab === t
                            ? "bg-card text-foreground shadow-subtle"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {parentLabels[t]}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={guardianTab}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3"
                    >
                      <FloatingInput
                        label={`${parentLabels[guardianTab]} Full Name`}
                        value={form[guardianTab].name}
                        onChange={(v) => setParentField(guardianTab, "name", v)}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <FloatingInput
                          label="Phone"
                          type="tel"
                          value={form[guardianTab].phone}
                          onChange={(v) =>
                            setParentField(guardianTab, "phone", v)
                          }
                        />
                        <FloatingInput
                          label="Email"
                          type="email"
                          value={form[guardianTab].email}
                          onChange={(v) =>
                            setParentField(guardianTab, "email", v)
                          }
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Review & Confirm
                  </p>
                  {/* Summary card */}
                  <div className="glass-elevated rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                        <span className="font-display font-bold text-primary">
                          {form.fullName ? getInitials(form.fullName) : "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-display font-bold text-foreground">
                          {form.fullName || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Class {form.classId || "—"}
                          {form.section ? `-${form.section}` : ""}
                          {form.gender
                            ? ` · ${form.gender === "M" ? "Male" : form.gender === "F" ? "Female" : form.gender}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: "Date of Birth", value: form.dob || "—" },
                        {
                          label: "Gender",
                          value:
                            form.gender === "M"
                              ? "Male"
                              : form.gender === "F"
                                ? "Female"
                                : form.gender || "—",
                        },
                        {
                          label: "Class",
                          value: form.classId ? `Class ${form.classId}` : "—",
                        },
                        {
                          label: "Section",
                          value: form.section ? `Section ${form.section}` : "—",
                        },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                            {label}
                          </p>
                          <p className="font-medium text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                    {form.father.name && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Father
                          </p>
                          <p className="font-medium text-foreground text-sm">
                            {form.father.name}
                            {form.father.phone ? ` · ${form.father.phone}` : ""}
                          </p>
                        </div>
                      </>
                    )}
                    {form.mother.name && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Mother
                          </p>
                          <p className="font-medium text-foreground text-sm">
                            {form.mother.name}
                            {form.mother.phone ? ` · ${form.mother.phone}` : ""}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() =>
              step > 1 ? setStep((s) => (s - 1) as FormStep) : onClose()
            }
            className="rounded-xl gap-1.5"
            data-ocid="admissions.new.cancel_button"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => (s + 1) as FormStep)}
              disabled={step === 1 && !form.fullName}
              className="rounded-xl gap-1.5 btn-school-primary hover-lift"
              data-ocid="admissions.new.next_button"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl gap-2 btn-school-primary hover-lift"
              data-ocid="admissions.new.submit_button"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdmissionsPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [newAppOpen, setNewAppOpen] = useState(false);

  const { data, isLoading, error } = useAdmissions({
    status: filter,
    page,
    limit: PAGE_SIZE,
  });
  const verifyMutation = useVerifyAdmission();

  useEffect(() => {
    if (error)
      toast.error(`Failed to load admissions: ${(error as Error).message}`);
  }, [error]);

  const applications = data?.data ?? [];
  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const displayTotal = data?.total ?? filtered.length;
  const displayPages = Math.max(1, Math.ceil(displayTotal / PAGE_SIZE));

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    enrolled: applications.filter((a) => a.status === "enrolled").length,
    under_review: applications.filter((a) => a.status === "under_review")
      .length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const tabCounts: Record<FilterStatus, number> = {
    all: stats.total,
    pending: stats.pending,
    under_review: stats.under_review,
    approved: stats.approved,
    rejected: stats.rejected,
    enrolled: stats.enrolled,
  };

  async function handleVerify(app: Application) {
    try {
      await verifyMutation.mutateAsync({ id: app.id, status: "approved" });
      toast.success(`Documents verified for ${app.applicantName}`);
    } catch (e) {
      toast.error(`Verify failed: ${(e as Error).message}`);
    }
  }

  async function handleEnroll(app: Application) {
    try {
      await verifyMutation.mutateAsync({ id: app.id, status: "enrolled" });
      toast.success(`${app.applicantName} enrolled successfully`);
    } catch (e) {
      toast.error(`Enroll failed: ${(e as Error).message}`);
    }
  }

  const statCardsData = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: FileText,
      color: "text-primary",
      iconBg: "bg-primary/10",
      border: "border-primary/15",
    },
    {
      label: "Pending Review",
      value: stats.pending + stats.under_review,
      icon: Users,
      color: "text-amber-600",
      iconBg: "bg-amber-100",
      border: "border-amber-200",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle,
      color: "text-emerald-600",
      iconBg: "bg-emerald-100",
      border: "border-emerald-200",
    },
    {
      label: "Enrolled",
      value: stats.enrolled,
      icon: GraduationCap,
      color: "text-purple-600",
      iconBg: "bg-purple-100",
      border: "border-purple-200",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
              Admissions
            </h1>
            {stats.pending > 0 && (
              <span className="badge-premium bg-amber-50 text-amber-700 border border-amber-200">
                {stats.pending} Pending
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage student applications and enrollment pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl h-9 hover-lift transition-fast"
            onClick={() => setNewAppOpen(true)}
            data-ocid="admissions.primary_button"
          >
            <Plus className="w-4 h-4" /> New Application
          </Button>
          <Link to="/admissions/new">
            <Button
              size="sm"
              className="gap-1.5 rounded-xl h-9 shadow-card btn-school-primary hover-lift"
              data-ocid="admissions.full_form_button"
            >
              <UserPlus className="w-4 h-4" /> Full Form
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCardsData.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "tween", delay: i * 0.07 }}
            className={`bg-card rounded-2xl border ${card.border} shadow-card p-4 hover-lift card-premium relative overflow-hidden`}
            data-ocid={`admissions.stats.${i + 1}.card`}
          >
            {/* Subtle background gradient */}
            <div
              className={`absolute top-0 right-0 w-20 h-20 rounded-full ${card.iconBg} blur-2xl opacity-40 translate-x-6 -translate-y-6`}
            />
            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1 leading-tight">
                  {card.label}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 rounded-lg mt-1" />
                ) : (
                  <p
                    className={`text-3xl font-bold font-display ${card.color}`}
                  >
                    {card.value}
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

      {/* ── Applications Table Card ────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        {/* Status filter tabs */}
        <div className="px-5 py-3.5 border-b border-border overflow-x-auto bg-gradient-to-r from-muted/20 to-transparent">
          <div className="flex items-center gap-1.5 min-w-max">
            {FILTER_TABS.map((t) => {
              const count = tabCounts[t.value];
              const active = filter === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setFilter(t.value);
                    setPage(1);
                  }}
                  data-ocid={`admissions.${t.value}.tab`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-fast border ${
                    active
                      ? "btn-school-primary border-transparent shadow-card"
                      : "bg-background/80 text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span
                      className={`min-w-[1.125rem] h-[1.125rem] rounded-full text-[10px] font-bold flex items-center justify-center ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : paginated.length === 0 ? (
          <div
            className="p-14 flex flex-col items-center justify-center"
            data-ocid="admissions.empty_state"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 border border-primary/10 shadow-subtle">
              <FileText className="w-10 h-10 text-primary/30" />
            </div>
            <p className="text-base font-bold font-display text-foreground">
              No applications found
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try a different filter or create a new application.
            </p>
            <Button
              size="sm"
              onClick={() => setNewAppOpen(true)}
              className="mt-4 gap-1.5 rounded-xl btn-school-primary"
            >
              <Plus className="w-3.5 h-3.5" /> New Application
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto" data-ocid="admissions.table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {[
                    "Applicant",
                    "Grade",
                    "Applied",
                    "Status",
                    "Enrollment ID",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide ${
                        i === 2 ? "hidden md:table-cell" : ""
                      } ${i === 4 ? "hidden sm:table-cell" : ""} ${
                        i === 5 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((app, i) => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 table-row-hover group stagger-item"
                    data-ocid={`admissions.item.${i + 1}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${avatarPalette[i % avatarPalette.length]}`}
                        >
                          <span className="font-display font-bold text-[11px]">
                            {getInitials(app.applicantName)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm leading-tight truncate">
                            {app.applicantName}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {app.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-medium">
                      {app.grade}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {app.dateApplied}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={app.status} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {app.status === "approved" ||
                      app.status === "enrolled" ? (
                        <Badge
                          variant="outline"
                          className="text-xs font-mono bg-primary/5 text-primary border-primary/20"
                        >
                          {generateEnrollmentId(app.applicantName, i + 1)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          –
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-fast">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-fast"
                          onClick={() => setSelectedApp(app)}
                          aria-label="View application"
                          data-ocid={`admissions.view.${i + 1}.button`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-700 disabled:opacity-40 transition-fast"
                          disabled={verifyMutation.isPending}
                          onClick={() => handleVerify(app)}
                          aria-label="Verify"
                          data-ocid={`admissions.verify.${i + 1}.button`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-purple-500/10 hover:text-purple-700 disabled:opacity-40 transition-fast"
                          disabled={verifyMutation.isPending}
                          onClick={() => handleEnroll(app)}
                          aria-label="Enroll"
                          data-ocid={`admissions.enroll.${i + 1}.button`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {displayPages > 1 && (
          <div className="px-5 py-3.5 border-t border-border bg-muted/10 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, displayTotal)} of {displayTotal}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 rounded-lg"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-ocid="admissions.pagination_prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-semibold text-muted-foreground px-1 min-w-[3rem] text-center">
                {page} / {displayPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 rounded-lg"
                disabled={page === displayPages}
                onClick={() => setPage((p) => Math.min(displayPages, p + 1))}
                data-ocid="admissions.pagination_next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ApplicationDetailModal
        app={selectedApp}
        open={selectedApp !== null}
        onClose={() => setSelectedApp(null)}
      />

      <NewApplicationDialog
        open={newAppOpen}
        onClose={() => setNewAppOpen(false)}
      />
    </motion.div>
  );
}
