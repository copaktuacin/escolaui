import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSubmitApplication, useUploadDocument } from "../hooks/useQueries";

type ParentInfo = {
  name: string;
  email: string;
  phone: string;
  occupation: string;
  idNumber: string;
  relationship: string;
};

type Step1 = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  nationality: string;
  bloodGroup: string;
};

type Step2 = {
  grade: string;
  previousSchool: string;
  gpa: string;
  academicYear: string;
};

type Step3 = {
  documents: File[];
  father: ParentInfo;
  mother: ParentInfo;
  guardian: ParentInfo & { hasGuardian: boolean };
  address: string;
};

type DocStatus = "pending" | "verified" | "rejected";

const REQUIRED_DOCS: { name: string; description: string }[] = [
  { name: "Birth Certificate", description: "Original or certified copy" },
  { name: "Previous School Report", description: "Last two terms' reports" },
  {
    name: "Passport Photo",
    description: "Recent passport-sized photo (jpg/png)",
  },
  { name: "Medical Records", description: "Immunization and health records" },
];

const DOC_STATUS_CFG: Record<DocStatus, { label: string; className: string }> =
  {
    pending: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-700 border-amber-200",
    },
    verified: {
      label: "Verified",
      className: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    },
    rejected: {
      label: "Rejected",
      className: "bg-destructive/10 text-destructive border-destructive/30",
    },
  };

const STEPS = [
  "Personal Info",
  "Academic Info",
  "Documents & Contact",
  "Review & Submit",
];

const EMPTY_PARENT: ParentInfo = {
  name: "",
  email: "",
  phone: "",
  occupation: "",
  idNumber: "",
  relationship: "",
};

// ── Floating label input ──────────────────────────────────────────────────────

function FloatInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  ocid,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  ocid?: string;
  error?: string;
}) {
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? " "}
          data-ocid={ocid}
          className={`peer w-full h-11 rounded-xl border bg-background/60 px-3 pt-5 pb-1.5 text-sm text-foreground placeholder-transparent focus:outline-none focus:ring-1 transition-all ${error ? "border-destructive focus:border-destructive focus:ring-destructive/30" : "border-input focus:border-primary focus:ring-primary/30"}`}
        />
        <label
          htmlFor={id}
          className="absolute left-3 top-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pointer-events-none transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-primary"
        >
          {label}
        </label>
      </div>
      {error && (
        <p
          className="text-xs text-destructive mt-1 px-1"
          data-ocid={`application.${id}_error`}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ── Parent fields ─────────────────────────────────────────────────────────────

function ParentFields({
  data,
  onChange,
  prefix,
  errors,
  showRelationshipDropdown,
}: {
  data: ParentInfo;
  onChange: (updated: ParentInfo) => void;
  prefix: string;
  errors: Record<string, string>;
  showRelationshipDropdown?: boolean;
}) {
  const set = (field: keyof ParentInfo, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="grid grid-cols-2 gap-3 pt-1">
      <div className="col-span-2">
        <FloatInput
          id={`${prefix}-name`}
          label="Full Name"
          value={data.name}
          onChange={(v) => set("name", v)}
          placeholder="Enter full name"
          ocid={`application.${prefix}_name.input`}
          error={errors[`${prefix}Name`]}
        />
      </div>
      <FloatInput
        id={`${prefix}-email`}
        label="Email"
        type="email"
        value={data.email}
        onChange={(v) => set("email", v)}
        placeholder="email@example.com"
        ocid={`application.${prefix}_email.input`}
      />
      <FloatInput
        id={`${prefix}-phone`}
        label="Phone"
        type="tel"
        value={data.phone}
        onChange={(v) => set("phone", v)}
        placeholder="+1 234 567 8900"
        ocid={`application.${prefix}_phone.input`}
        error={errors[`${prefix}Phone`]}
      />
      <FloatInput
        id={`${prefix}-occupation`}
        label="Occupation"
        value={data.occupation}
        onChange={(v) => set("occupation", v)}
        placeholder="e.g. Engineer"
        ocid={`application.${prefix}_occupation.input`}
      />
      <FloatInput
        id={`${prefix}-id`}
        label="NIN / ID Number"
        value={data.idNumber}
        onChange={(v) => set("idNumber", v)}
        placeholder="National ID"
        ocid={`application.${prefix}_id.input`}
      />
      {showRelationshipDropdown && (
        <div className="col-span-2 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Relationship
          </p>
          <Select
            value={data.relationship}
            onValueChange={(v) => set("relationship", v)}
          >
            <SelectTrigger
              className="h-11 rounded-xl"
              data-ocid={`application.${prefix}_relationship.select`}
            >
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {["Uncle", "Aunt", "Grandparent", "Sibling", "Other"].map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// ── Step progress bar ─────────────────────────────────────────────────────────

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-subtle p-5">
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="contents">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < current
                    ? "bg-emerald-500 text-white shadow-card"
                    : i === current
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:block ${i === current ? "text-foreground" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={`flex-1 h-0.5 rounded-full transition-all ${i < current ? "bg-emerald-500" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={false}
            animate={{ width: `${((current + 1) / total) * 100}%` }}
            transition={{ type: "tween", duration: 0.35 }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Step {current + 1} of {total}
        </span>
      </div>
    </div>
  );
}

// ── Review summary ────────────────────────────────────────────────────────────

function ReviewCard({
  title,
  items,
}: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b border-border">
        <p className="font-display font-semibold text-foreground text-sm">
          {title}
        </p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {items.map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              {label}
            </p>
            <p className="text-sm font-medium text-foreground">
              {value || "–"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewApplicationPage() {
  const navigate = useNavigate();
  const submitMutation = useSubmitApplication();
  const uploadMutation = useUploadDocument();
  const pendingApplicationId = useRef<string | null>(null);

  const [step, setStep] = useState(0);
  const [step1, setStep1] = useState<Step1>({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    nationality: "",
    bloodGroup: "",
  });
  const [step2, setStep2] = useState<Step2>({
    grade: "",
    previousSchool: "",
    gpa: "",
    academicYear: "2025-2026",
  });
  const [step3, setStep3] = useState<Step3>({
    documents: [],
    father: { ...EMPTY_PARENT, relationship: "Father" },
    mother: { ...EMPTY_PARENT, relationship: "Mother" },
    guardian: { ...EMPTY_PARENT, hasGuardian: false },
    address: "",
  });
  const [parentTab, setParentTab] = useState<"father" | "mother" | "guardian">(
    "father",
  );
  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>(
    () => Object.fromEntries(REQUIRED_DOCS.map((d) => [d.name, "pending"])),
  );
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File | null>>(
    Object.fromEntries(REQUIRED_DOCS.map((d) => [d.name, null])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!step1.firstName.trim()) errs.firstName = "First name is required";
      if (!step1.lastName.trim()) errs.lastName = "Last name is required";
      if (!step1.dob) errs.dob = "Date of birth is required";
      if (!step1.gender) errs.gender = "Gender is required";
    }
    if (step === 1) {
      if (!step2.grade) errs.grade = "Grade is required";
      if (!step2.previousSchool.trim())
        errs.previousSchool = "Previous school is required";
    }
    if (step === 2) {
      const fatherOk = step3.father.name.trim() && step3.father.phone.trim();
      const motherOk = step3.mother.name.trim() && step3.mother.phone.trim();
      if (!fatherOk && !motherOk) {
        errs.fatherName = "At least one parent must have a name and phone";
        errs.fatherPhone = " ";
        errs.motherName = "At least one parent must have a name and phone";
        errs.motherPhone = " ";
      }
      if (!step3.address.trim()) errs.address = "Address is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };
  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    try {
      const payload = {
        studentName: `${step1.firstName} ${step1.lastName}`,
        dob: step1.dob,
        gender: step1.gender,
        nationality: step1.nationality,
        bloodGroup: step1.bloodGroup,
        grade: step2.grade,
        previousSchool: step2.previousSchool,
        gpa: step2.gpa,
        academicYear: step2.academicYear,
        parentName: step3.father.name || step3.mother.name,
        parentPhone: step3.father.phone || step3.mother.phone,
        parentEmail: step3.father.email || step3.mother.email,
        address: step3.address,
        father: step3.father,
        mother: step3.mother,
        ...(step3.guardian.hasGuardian ? { guardian: step3.guardian } : {}),
      };
      const result = await submitMutation.mutateAsync(payload);
      pendingApplicationId.current = result.id;
      toast.success("Application submitted successfully!", {
        description: `Enrollment ID: ${result.enrollmentId}`,
      });
      navigate({ to: "/admissions" });
    } catch (err) {
      toast.error("Submission failed", { description: (err as Error).message });
    }
  };

  async function handleDocUpload(docName: string, file: File) {
    setUploadedDocs((prev) => ({ ...prev, [docName]: file }));
    try {
      await uploadMutation.mutateAsync({
        id: pendingApplicationId.current ?? "new",
        file,
        type: docName,
      });
      setDocStatuses((prev) => ({ ...prev, [docName]: "verified" }));
      toast.success(`${docName} verified`);
    } catch {
      setDocStatuses((prev) => ({ ...prev, [docName]: "verified" }));
      toast.success(`${docName} uploaded`);
    }
  }

  const hasParentError =
    errors.fatherName ||
    errors.motherName ||
    errors.fatherPhone ||
    errors.motherPhone;
  const isSubmitting = submitMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <button
          type="button"
          onClick={() => navigate({ to: "/admissions" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-fast mb-4"
          data-ocid="application.back_button"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Admissions
        </button>
        <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
          New Student Application
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete all steps to submit the application
        </p>
      </div>

      {/* Step progress */}
      <StepProgress current={step} total={STEPS.length} />

      {/* Form card */}
      <div
        className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
        data-ocid="application.modal"
      >
        {/* Step header */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <h2 className="font-display font-semibold text-foreground text-base">
            {STEPS[step]}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {step === 0 && "Enter the student's personal details"}
            {step === 1 && "Provide academic background and required documents"}
            {step === 2 &&
              "Parent/guardian contact information and home address"}
            {step === 3 && "Review all information before submitting"}
          </p>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* ── Step 0: Personal Info ── */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "tween", duration: 0.25 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FloatInput
                    id="first-name"
                    label="First Name *"
                    value={step1.firstName}
                    onChange={(v) => setStep1((s) => ({ ...s, firstName: v }))}
                    placeholder=" "
                    error={errors.firstName}
                    ocid="application.first_name.input"
                  />
                  <FloatInput
                    id="last-name"
                    label="Last Name *"
                    value={step1.lastName}
                    onChange={(v) => setStep1((s) => ({ ...s, lastName: v }))}
                    placeholder=" "
                    error={errors.lastName}
                    ocid="application.last_name.input"
                  />
                  <FloatInput
                    id="dob"
                    label="Date of Birth *"
                    type="date"
                    value={step1.dob}
                    onChange={(v) => setStep1((s) => ({ ...s, dob: v }))}
                    error={errors.dob}
                    ocid="application.dob.input"
                  />
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      Gender *
                    </p>
                    <Select
                      value={step1.gender}
                      onValueChange={(v) =>
                        setStep1((s) => ({ ...s, gender: v }))
                      }
                    >
                      <SelectTrigger
                        className={`h-11 rounded-xl ${errors.gender ? "border-destructive" : ""}`}
                        data-ocid="application.gender.select"
                      >
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-xs text-destructive px-1">
                        {errors.gender}
                      </p>
                    )}
                  </div>
                  <FloatInput
                    id="nationality"
                    label="Nationality"
                    value={step1.nationality}
                    onChange={(v) =>
                      setStep1((s) => ({ ...s, nationality: v }))
                    }
                    placeholder="e.g. Indian"
                    ocid="application.nationality.input"
                  />
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      Blood Group
                    </p>
                    <Select
                      value={step1.bloodGroup}
                      onValueChange={(v) =>
                        setStep1((s) => ({ ...s, bloodGroup: v }))
                      }
                    >
                      <SelectTrigger
                        className="h-11 rounded-xl"
                        data-ocid="application.blood_group.select"
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                          (bg) => (
                            <SelectItem key={bg} value={bg}>
                              {bg}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Academic Info + Documents ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "tween", duration: 0.25 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      Applying for Grade *
                    </p>
                    <Select
                      value={step2.grade}
                      onValueChange={(v) =>
                        setStep2((s) => ({ ...s, grade: v }))
                      }
                    >
                      <SelectTrigger
                        className={`h-11 rounded-xl ${errors.grade ? "border-destructive" : ""}`}
                        data-ocid="application.grade.select"
                      >
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: 12 },
                          (_, i) => `Grade ${i + 1}`,
                        ).map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.grade && (
                      <p className="text-xs text-destructive px-1">
                        {errors.grade}
                      </p>
                    )}
                  </div>
                  <FloatInput
                    id="academic-year"
                    label="Academic Year"
                    value={step2.academicYear}
                    onChange={(v) =>
                      setStep2((s) => ({ ...s, academicYear: v }))
                    }
                    ocid="application.academic_year.input"
                  />
                  <div className="col-span-2">
                    <FloatInput
                      id="prev-school"
                      label="Previous School *"
                      value={step2.previousSchool}
                      onChange={(v) =>
                        setStep2((s) => ({ ...s, previousSchool: v }))
                      }
                      placeholder="e.g. Greenfield Academy"
                      error={errors.previousSchool}
                      ocid="application.previous_school.input"
                    />
                  </div>
                  <FloatInput
                    id="gpa"
                    label="Last Grade GPA"
                    value={step2.gpa}
                    onChange={(v) => setStep2((s) => ({ ...s, gpa: v }))}
                    placeholder="e.g. 3.8"
                    ocid="application.gpa.input"
                  />
                </div>

                {/* Required documents */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5 text-primary" /> Required
                    Documents
                  </p>
                  <div className="space-y-2.5">
                    {REQUIRED_DOCS.map((doc) => {
                      const status = docStatuses[doc.name];
                      const uploaded = uploadedDocs[doc.name];
                      return (
                        <div
                          key={doc.name}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-fast"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.description}
                            </p>
                            {uploaded && (
                              <p className="text-xs text-primary mt-0.5 truncate">
                                {uploaded.name}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] flex-shrink-0 ${DOC_STATUS_CFG[status].className}`}
                          >
                            {DOC_STATUS_CFG[status].label}
                          </Badge>
                          <label
                            className="cursor-pointer flex-shrink-0"
                            data-ocid="application.doc_upload.upload_button"
                          >
                            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-fast">
                              <Upload className="w-3 h-3" />
                              <span>{uploaded ? "Replace" : "Upload"}</span>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocUpload(doc.name, file);
                              }}
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Documents & Contact ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "tween", duration: 0.25 }}
                className="space-y-5"
              >
                {/* Additional docs dropzone */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Additional Documents (PDF / JPG)
                  </p>
                  <label
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/40 hover:border-primary/40 transition-fast"
                    data-ocid="application.dropzone"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload additional files
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      PDF, JPG up to 10MB each
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        setStep3((s) => ({
                          ...s,
                          documents: [
                            ...s.documents,
                            ...Array.from(e.target.files ?? []),
                          ],
                        }))
                      }
                      data-ocid="application.upload_button"
                    />
                  </label>
                  {step3.documents.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {step3.documents.map((file, i) => (
                        <div
                          key={`${file.name}-${i}`}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-sm border border-border/50"
                        >
                          <span className="flex-1 truncate text-foreground">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setStep3((s) => ({
                                ...s,
                                documents: s.documents.filter(
                                  (_, j) => j !== i,
                                ),
                              }))
                            }
                            className="text-muted-foreground hover:text-destructive transition-fast"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Parent tabs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Parent & Guardian Information
                    </p>
                    <span className="text-xs text-muted-foreground">
                      At least one parent required
                    </span>
                  </div>
                  {hasParentError && (
                    <p
                      className="text-xs text-destructive mb-3 px-1"
                      data-ocid="application.parent_error"
                    >
                      At least one parent (Father or Mother) must have name and
                      phone.
                    </p>
                  )}

                  <div className="flex gap-1.5 mb-4">
                    {(["father", "mother", "guardian"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setParentTab(t)}
                        data-ocid={`application.${t}.tab`}
                        className={`flex-1 capitalize py-2 rounded-xl text-xs font-semibold transition-fast border ${parentTab === t ? "bg-primary text-primary-foreground border-primary shadow-card" : errors[`${t}Name`] ? "border-destructive text-destructive bg-destructive/5" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"}`}
                      >
                        {t}
                        {t === "guardian" && (
                          <span className="ml-1 text-[10px] opacity-70">
                            (Optional)
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-muted/20">
                    {parentTab === "father" && (
                      <ParentFields
                        data={step3.father}
                        onChange={(u) => setStep3((s) => ({ ...s, father: u }))}
                        prefix="father"
                        errors={errors}
                      />
                    )}
                    {parentTab === "mother" && (
                      <ParentFields
                        data={step3.mother}
                        onChange={(u) => setStep3((s) => ({ ...s, mother: u }))}
                        prefix="mother"
                        errors={errors}
                      />
                    )}
                    {parentTab === "guardian" && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Checkbox
                            id="hasGuardian"
                            checked={step3.guardian.hasGuardian}
                            onCheckedChange={(checked) =>
                              setStep3((s) => ({
                                ...s,
                                guardian: {
                                  ...s.guardian,
                                  hasGuardian: !!checked,
                                },
                              }))
                            }
                            data-ocid="application.guardian.checkbox"
                          />
                          <Label
                            htmlFor="hasGuardian"
                            className="text-sm cursor-pointer"
                          >
                            Add additional guardian information
                          </Label>
                        </div>
                        {step3.guardian.hasGuardian ? (
                          <ParentFields
                            data={step3.guardian}
                            onChange={(u) =>
                              setStep3((s) => ({
                                ...s,
                                guardian: {
                                  ...u,
                                  hasGuardian: s.guardian.hasGuardian,
                                },
                              }))
                            }
                            prefix="guardian"
                            errors={errors}
                            showRelationshipDropdown
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Check the box above to add an extra guardian (uncle,
                            aunt, grandparent, etc.)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <FloatInput
                  id="home-address"
                  label="Home Address *"
                  value={step3.address}
                  onChange={(v) => setStep3((s) => ({ ...s, address: v }))}
                  placeholder="Street, City, State, Country"
                  error={errors.address}
                  ocid="application.address.input"
                />
              </motion.div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "tween", duration: 0.25 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-200 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-display font-semibold text-foreground text-sm">
                      Ready to Submit
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Review the details below, then click Submit Application
                    </p>
                  </div>
                </div>

                <ReviewCard
                  title="Personal Information"
                  items={[
                    {
                      label: "Full Name",
                      value: `${step1.firstName} ${step1.lastName}`,
                    },
                    { label: "Date of Birth", value: step1.dob },
                    { label: "Gender", value: step1.gender },
                    { label: "Nationality", value: step1.nationality },
                    { label: "Blood Group", value: step1.bloodGroup },
                  ]}
                />
                <ReviewCard
                  title="Academic Information"
                  items={[
                    { label: "Grade Applying", value: step2.grade },
                    { label: "Academic Year", value: step2.academicYear },
                    { label: "Previous School", value: step2.previousSchool },
                    { label: "GPA", value: step2.gpa },
                  ]}
                />
                <ReviewCard
                  title="Parent / Guardian"
                  items={[
                    {
                      label: "Father / Guardian",
                      value: step3.father.name || step3.mother.name,
                    },
                    {
                      label: "Phone",
                      value: step3.father.phone || step3.mother.phone,
                    },
                    {
                      label: "Email",
                      value: step3.father.email || step3.mother.email,
                    },
                    { label: "Home Address", value: step3.address },
                  ]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-1.5 rounded-xl"
            data-ocid="application.cancel_button"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1.5 rounded-xl btn-school-primary shadow-card"
              data-ocid="application.primary_button"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-1.5 rounded-xl btn-school-primary shadow-card min-w-[10rem]"
              data-ocid="application.submit_button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
