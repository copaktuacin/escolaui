import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useState } from "react";
import { toast } from "sonner";
import { withDelay } from "../lib/mockData";

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

const DOC_STATUS_CONFIG: Record<
  DocStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  verified: {
    label: "Verified",
    className: "bg-success/10 text-success border-success/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

const STEPS = [
  "Personal Information",
  "Academic Information",
  "Documents & Contact",
];

const EMPTY_PARENT: ParentInfo = {
  name: "",
  email: "",
  phone: "",
  occupation: "",
  idNumber: "",
  relationship: "",
};

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
    <div className="grid grid-cols-2 gap-4 pt-2">
      <div className="col-span-2">
        <Label className="text-xs">Full Name</Label>
        <Input
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Enter full name"
          className="mt-1 h-9"
          data-ocid={`application.${prefix}_name.input`}
        />
        {errors[`${prefix}Name`] && (
          <p
            className="text-xs text-destructive mt-1"
            data-ocid={`application.${prefix}_name_error`}
          >
            {errors[`${prefix}Name`]}
          </p>
        )}
      </div>
      <div>
        <Label className="text-xs">Email</Label>
        <Input
          type="email"
          value={data.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="email@example.com"
          className="mt-1 h-9"
          data-ocid={`application.${prefix}_email.input`}
        />
      </div>
      <div>
        <Label className="text-xs">Phone</Label>
        <Input
          type="tel"
          value={data.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+1 234 567 8900"
          className="mt-1 h-9"
          data-ocid={`application.${prefix}_phone.input`}
        />
        {errors[`${prefix}Phone`] && (
          <p
            className="text-xs text-destructive mt-1"
            data-ocid={`application.${prefix}_phone_error`}
          >
            {errors[`${prefix}Phone`]}
          </p>
        )}
      </div>
      <div>
        <Label className="text-xs">Occupation</Label>
        <Input
          value={data.occupation}
          onChange={(e) => set("occupation", e.target.value)}
          placeholder="e.g. Engineer"
          className="mt-1 h-9"
          data-ocid={`application.${prefix}_occupation.input`}
        />
      </div>
      <div>
        <Label className="text-xs">NIN / ID Number</Label>
        <Input
          value={data.idNumber}
          onChange={(e) => set("idNumber", e.target.value)}
          placeholder="National ID"
          className="mt-1 h-9"
          data-ocid={`application.${prefix}_id.input`}
        />
      </div>
      {showRelationshipDropdown ? (
        <div className="col-span-2">
          <Label className="text-xs">Relationship</Label>
          <Select
            value={data.relationship}
            onValueChange={(v) => set("relationship", v)}
          >
            <SelectTrigger
              className="mt-1 h-9"
              data-ocid={`application.${prefix}_relationship.select`}
            >
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Uncle">Uncle</SelectItem>
              <SelectItem value="Aunt">Aunt</SelectItem>
              <SelectItem value="Grandparent">Grandparent</SelectItem>
              <SelectItem value="Sibling">Sibling</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}

export default function NewApplicationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    await withDelay(null, 1000);
    setIsSubmitting(false);
    toast.success("Application submitted successfully!", {
      description: `Application for ${step1.firstName} ${step1.lastName} has been received.`,
    });
    navigate({ to: "/admissions" });
  };

  function handleDocUpload(docName: string, file: File) {
    setUploadedDocs((prev) => ({ ...prev, [docName]: file }));
    setTimeout(() => {
      setDocStatuses((prev) => ({ ...prev, [docName]: "verified" }));
      toast.success(`${docName} verified`);
    }, 1500);
  }

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p
        className="text-xs text-destructive mt-1"
        data-ocid={`application.${name}_error`}
      >
        {errors[name]}
      </p>
    ) : null;

  const hasParentError =
    errors.fatherName ||
    errors.motherName ||
    errors.fatherPhone ||
    errors.motherPhone;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate({ to: "/admissions" })}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Admissions
        </button>
        <h1 className="text-xl font-bold text-foreground">
          New Student Application
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete all steps to submit the application
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-card rounded-xl border border-border shadow-card p-4">
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="contents">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step
                      ? "bg-success text-white"
                      : i === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    i === step ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? "bg-success" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div
        className="bg-card rounded-xl border border-border shadow-card p-6"
        data-ocid="application.modal"
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="font-semibold text-foreground">
                Personal Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">First Name *</Label>
                  <Input
                    value={step1.firstName}
                    onChange={(e) =>
                      setStep1((s) => ({ ...s, firstName: e.target.value }))
                    }
                    className="mt-1 h-9"
                    data-ocid="application.input"
                  />
                  <FieldError name="firstName" />
                </div>
                <div>
                  <Label className="text-xs">Last Name *</Label>
                  <Input
                    value={step1.lastName}
                    onChange={(e) =>
                      setStep1((s) => ({ ...s, lastName: e.target.value }))
                    }
                    className="mt-1 h-9"
                    data-ocid="application.input"
                  />
                  <FieldError name="lastName" />
                </div>
                <div>
                  <Label className="text-xs">Date of Birth *</Label>
                  <Input
                    type="date"
                    value={step1.dob}
                    onChange={(e) =>
                      setStep1((s) => ({ ...s, dob: e.target.value }))
                    }
                    className="mt-1 h-9"
                    data-ocid="application.input"
                  />
                  <FieldError name="dob" />
                </div>
                <div>
                  <Label className="text-xs">Gender *</Label>
                  <Select
                    value={step1.gender}
                    onValueChange={(v) =>
                      setStep1((s) => ({ ...s, gender: v }))
                    }
                  >
                    <SelectTrigger
                      className="mt-1 h-9"
                      data-ocid="application.select"
                    >
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError name="gender" />
                </div>
                <div>
                  <Label className="text-xs">Nationality</Label>
                  <Input
                    value={step1.nationality}
                    onChange={(e) =>
                      setStep1((s) => ({ ...s, nationality: e.target.value }))
                    }
                    placeholder="e.g. Nigerian"
                    className="mt-1 h-9"
                    data-ocid="application.input"
                  />
                </div>
                <div>
                  <Label className="text-xs">Blood Group</Label>
                  <Select
                    value={step1.bloodGroup}
                    onValueChange={(v) =>
                      setStep1((s) => ({ ...s, bloodGroup: v }))
                    }
                  >
                    <SelectTrigger
                      className="mt-1 h-9"
                      data-ocid="application.select"
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

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="font-semibold text-foreground">
                Academic Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Applying for Grade *</Label>
                  <Select
                    value={step2.grade}
                    onValueChange={(v) => setStep2((s) => ({ ...s, grade: v }))}
                  >
                    <SelectTrigger
                      className="mt-1 h-9"
                      data-ocid="application.select"
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
                  <FieldError name="grade" />
                </div>
                <div>
                  <Label className="text-xs">Academic Year</Label>
                  <Input
                    value={step2.academicYear}
                    onChange={(e) =>
                      setStep2((s) => ({ ...s, academicYear: e.target.value }))
                    }
                    className="mt-1 h-9"
                    data-ocid="application.input"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Previous School *</Label>
                  <Input
                    value={step2.previousSchool}
                    onChange={(e) =>
                      setStep2((s) => ({
                        ...s,
                        previousSchool: e.target.value,
                      }))
                    }
                    placeholder="e.g. Greenfield Academy"
                    className="mt-1 h-9"
                    data-ocid="application.input"
                  />
                  <FieldError name="previousSchool" />
                </div>
                <div>
                  <Label className="text-xs">Last Grade GPA</Label>
                  <Input
                    value={step2.gpa}
                    onChange={(e) =>
                      setStep2((s) => ({ ...s, gpa: e.target.value }))
                    }
                    placeholder="e.g. 3.8"
                    className="mt-1 h-9"
                    data-ocid="application.input"
                  />
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="mt-6">
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary" /> Required
                  Documents
                </h3>
                <div className="space-y-3">
                  {REQUIRED_DOCS.map((doc) => {
                    const status = docStatuses[doc.name];
                    const uploaded = uploadedDocs[doc.name];
                    return (
                      <div
                        key={doc.name}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-accent/30"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
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
                          className={`text-[10px] flex-shrink-0 ${DOC_STATUS_CONFIG[status].className}`}
                        >
                          {DOC_STATUS_CONFIG[status].label}
                        </Badge>
                        <label
                          className="cursor-pointer flex-shrink-0"
                          data-ocid="application.doc_upload.upload_button"
                        >
                          <div className="flex items-center gap-1 px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
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

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="font-semibold text-foreground">
                Documents &amp; Contact
              </h2>

              {/* Additional document upload */}
              <div>
                <Label className="text-xs">
                  Additional Documents (PDF / JPG)
                </Label>
                <label
                  className="mt-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-accent/50 transition-colors"
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
                        className="flex items-center gap-2 p-2 rounded-lg bg-accent text-sm"
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
                              documents: s.documents.filter((_, j) => j !== i),
                            }))
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Parent / Guardian Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Parent &amp; Guardian Information
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    At least one parent required
                  </span>
                </div>

                {hasParentError && (
                  <p
                    className="text-xs text-destructive mb-2"
                    data-ocid="application.parent_error"
                  >
                    At least one parent (Father or Mother) must have a name and
                    phone filled in.
                  </p>
                )}

                <Tabs
                  defaultValue="father"
                  className="w-full"
                  data-ocid="application.tab"
                >
                  <TabsList className="w-full grid grid-cols-3 mb-4">
                    <TabsTrigger
                      value="father"
                      className={errors.fatherName ? "text-destructive" : ""}
                      data-ocid="application.father.tab"
                    >
                      Father
                    </TabsTrigger>
                    <TabsTrigger
                      value="mother"
                      className={errors.motherName ? "text-destructive" : ""}
                      data-ocid="application.mother.tab"
                    >
                      Mother
                    </TabsTrigger>
                    <TabsTrigger
                      value="guardian"
                      data-ocid="application.guardian.tab"
                    >
                      Guardian
                      <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                        (Optional)
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="father" className="mt-0">
                    <div className="rounded-lg border border-border bg-accent/20 p-4">
                      <ParentFields
                        data={step3.father}
                        onChange={(updated) =>
                          setStep3((s) => ({ ...s, father: updated }))
                        }
                        prefix="father"
                        errors={errors}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="mother" className="mt-0">
                    <div className="rounded-lg border border-border bg-accent/20 p-4">
                      <ParentFields
                        data={step3.mother}
                        onChange={(updated) =>
                          setStep3((s) => ({ ...s, mother: updated }))
                        }
                        prefix="mother"
                        errors={errors}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="guardian" className="mt-0">
                    <div className="rounded-lg border border-border bg-accent/20 p-4">
                      <div className="flex items-center gap-2 mb-3">
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

                      {step3.guardian.hasGuardian && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ParentFields
                            data={step3.guardian}
                            onChange={(updated) =>
                              setStep3((s) => ({
                                ...s,
                                guardian: {
                                  ...updated,
                                  hasGuardian: s.guardian.hasGuardian,
                                },
                              }))
                            }
                            prefix="guardian"
                            errors={errors}
                            showRelationshipDropdown
                          />
                        </motion.div>
                      )}

                      {!step3.guardian.hasGuardian && (
                        <p className="text-xs text-muted-foreground">
                          Check the box above to add an extra guardian (uncle,
                          aunt, grandparent, etc.)
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Shared address */}
              <div>
                <Label className="text-xs">Home Address *</Label>
                <Input
                  value={step3.address}
                  onChange={(e) =>
                    setStep3((s) => ({ ...s, address: e.target.value }))
                  }
                  placeholder="Street, City, State, Country"
                  className="mt-1 h-9"
                  data-ocid="application.address.input"
                />
                <FieldError name="address" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-1.5"
            data-ocid="application.cancel_button"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1.5"
              data-ocid="application.primary_button"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-1.5"
              data-ocid="application.submit_button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit Application <CheckCircle className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
