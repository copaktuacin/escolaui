import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle,
  ChevronLeft,
  CloudUpload,
  FolderOpen,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCreateAdmission } from "../hooks/useQueries";
import type { ClassDto } from "../hooks/useQueries";

// ─── Google Drive Picker config ───────────────────────────────────────────────
// Replace with your actual Google OAuth client ID
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"; // optional for picker
const GOOGLE_PICKER_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

// ── Robust list extractor — handles ALL .NET envelope shapes ─────────────────
function extractList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    for (const k of [
      "data",
      "Data",
      "items",
      "Items",
      "value",
      "Value",
      "results",
      "Results",
      "list",
      "List",
      "records",
      "Records",
      "$values",
      "classes",
      "Classes",
      "sections",
      "Sections",
      "academicYears",
      "AcademicYears",
    ]) {
      if (Array.isArray(r[k])) return r[k] as T[];
    }
    const found = Object.values(r).find((v) => Array.isArray(v));
    if (found) return found as T[];
  }
  return [];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  children,
  required,
}: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
    >
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

function inputCls(error?: string) {
  return `w-full h-10 px-3 rounded-xl border bg-background text-foreground text-sm outline-none focus:ring-1 transition-all ${
    error
      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
      : "border-input focus:border-primary focus:ring-primary/30"
  }`;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1 px-0.5">{msg}</p>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-4">
      {children}
    </p>
  );
}

// ── Google Drive Picker hook ──────────────────────────────────────────────────

declare global {
  interface Window {
    gapi?: {
      load: (lib: string, cb: () => void) => void;
      auth2?: {
        getAuthInstance?: () => {
          signIn: () => Promise<{
            getAuthResponse: () => { access_token: string };
          }>;
        };
        init: (config: { client_id: string; scope: string }) => Promise<void>;
      };
      client?: unknown;
    };
    google?: {
      picker: {
        PickerBuilder: new () => {
          addView: (view: unknown) => ReturnType<typeof Object>;
          setOAuthToken: (token: string) => ReturnType<typeof Object>;
          setDeveloperKey: (key: string) => ReturnType<typeof Object>;
          setCallback: (
            cb: (data: { action: string; docs?: DriveDoc[] }) => void,
          ) => ReturnType<typeof Object>;
          build: () => { setVisible: (v: boolean) => void };
        };
        Action: { PICKED: string };
        ViewId: { DOCS: string };
        DocsView: new (id: string) => unknown;
      };
    };
  }
}

type DriveDoc = {
  name: string;
  url?: string;
  embedUrl?: string;
  id?: string;
};

function useGoogleDrivePicker() {
  const loaded = useRef(false);
  const accessTokenRef = useRef<string | null>(null);

  const loadGapi = useCallback(() => {
    if (loaded.current || typeof window === "undefined") return;
    loaded.current = true;
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = () => {
      window.gapi?.load("auth2:picker", () => {
        window.gapi?.auth2
          ?.init({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_PICKER_SCOPE,
          })
          .catch(() => {
            /* ignore init errors — handled per-open */
          });
      });
    };
    document.head.appendChild(script);
  }, []);

  const openPicker = useCallback(
    async (onPicked: (name: string, url: string) => void) => {
      if (typeof window === "undefined") return;
      // Lazy load gapi if not done yet
      if (!window.gapi) {
        loadGapi();
        toast.error(
          "Google Drive API is loading — please try again in a moment.",
        );
        return;
      }
      if (!window.google?.picker) {
        toast.error(
          "Google Picker not ready. Please check your Google API Key configuration.",
        );
        return;
      }

      try {
        let accessToken = accessTokenRef.current;
        if (!accessToken) {
          const authInst = window.gapi?.auth2?.getAuthInstance?.();
          if (!authInst) {
            toast.error(
              "Google Auth not initialized. Configure GOOGLE_CLIENT_ID to enable Drive Picker.",
            );
            return;
          }
          const user = await authInst.signIn();
          accessToken = user.getAuthResponse().access_token;
          accessTokenRef.current = accessToken;
        }

        const picker = new window.google.picker.PickerBuilder()
          .addView(
            new window.google.picker.DocsView(window.google.picker.ViewId.DOCS),
          )
          .setOAuthToken(accessToken)
          .setDeveloperKey(GOOGLE_API_KEY)
          .setCallback((data) => {
            if (
              data.action === window.google?.picker.Action.PICKED &&
              data.docs?.length
            ) {
              const doc = data.docs[0];
              const url =
                doc.url ??
                doc.embedUrl ??
                `https://drive.google.com/file/d/${doc.id}/view`;
              onPicked(doc.name, url);
            }
          })
          .build();
        picker.setVisible(true);
      } catch (err) {
        console.error("[GDrivePicker] error:", err);
        toast.error(
          "Could not open Google Drive. Make sure pop-ups are allowed.",
        );
      }
    },
    [loadGapi],
  );

  useEffect(() => {
    loadGapi();
  }, [loadGapi]);

  return { openPicker };
}

// ── Document upload row ───────────────────────────────────────────────────────

type DocState = {
  file: File | null;
  driveUrl: string;
  driveName: string;
};

function DocumentUploadRow({
  label,
  docId,
  state,
  onFileChange,
  onDrivePick,
  onClear,
}: {
  label: string;
  docId: string;
  state: DocState;
  onFileChange: (file: File | null) => void;
  onDrivePick: () => void;
  onClear: (source: "file" | "drive") => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFile = !!state.file;
  const hasDrive = !!state.driveUrl;

  return (
    <div className="bg-background border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      {/* Browse File */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          id={`doc-file-${docId}`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          data-ocid={`application.${docId}.file_input`}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-medium px-3 h-8 rounded-lg border border-input bg-background hover:bg-muted/50 text-foreground transition-colors"
          data-ocid={`application.${docId}.browse_button`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Browse File
        </button>
        {hasFile ? (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Paperclip className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="text-xs text-foreground truncate max-w-[140px]">
              {state.file!.name}
            </span>
            <button
              type="button"
              onClick={() => onClear("file")}
              className="ml-auto text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            No file chosen
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          or
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Google Drive */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDrivePick}
          className="flex items-center gap-1.5 text-xs font-medium px-3 h-8 rounded-lg border border-input bg-background hover:bg-muted/50 text-foreground transition-colors"
          data-ocid={`application.${docId}.drive_button`}
        >
          <CloudUpload className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-blue-600 dark:text-blue-400">
            Pick from Google Drive
          </span>
        </button>
        {hasDrive ? (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Paperclip className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <a
              href={state.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[140px] hover:underline"
            >
              {state.driveName || "Drive file"}
            </a>
            <button
              type="button"
              onClick={() => onClear("drive")}
              className="ml-auto text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              aria-label="Remove drive file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            No file from Drive
          </span>
        )}
      </div>
    </div>
  );
}

// ── Parent tab fields ─────────────────────────────────────────────────────────

type ParentInfo = {
  name: string;
  email: string;
  phone: string;
  occupation: string;
  relationship: string;
};

function ParentTab({
  tabId,
  info,
  onChange,
}: {
  tabId: "father" | "mother" | "guardian";
  info: ParentInfo;
  onChange: (field: keyof ParentInfo, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
      {/* Full Name */}
      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${tabId}-name`}>Full Name</FieldLabel>
        <input
          id={`${tabId}-name`}
          type="text"
          value={info.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder={`${tabId.charAt(0).toUpperCase() + tabId.slice(1)}'s full name`}
          className={inputCls()}
          data-ocid={`application.${tabId}_name.input`}
        />
      </div>

      {/* Email */}
      <div>
        <FieldLabel htmlFor={`${tabId}-email`}>Email</FieldLabel>
        <input
          id={`${tabId}-email`}
          type="email"
          value={info.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="email@example.com"
          className={inputCls()}
          data-ocid={`application.${tabId}_email.input`}
        />
      </div>

      {/* Phone */}
      <div>
        <FieldLabel htmlFor={`${tabId}-phone`}>Phone</FieldLabel>
        <input
          id={`${tabId}-phone`}
          type="tel"
          value={info.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+91 XXXXX XXXXX"
          className={inputCls()}
          data-ocid={`application.${tabId}_phone.input`}
        />
      </div>

      {/* Occupation */}
      <div>
        <FieldLabel htmlFor={`${tabId}-occupation`}>Occupation</FieldLabel>
        <input
          id={`${tabId}-occupation`}
          type="text"
          value={info.occupation}
          onChange={(e) => onChange("occupation", e.target.value)}
          placeholder="e.g. Engineer, Doctor"
          className={inputCls()}
          data-ocid={`application.${tabId}_occupation.input`}
        />
      </div>

      {/* Relationship */}
      <div>
        <FieldLabel htmlFor={`${tabId}-relationship`}>Relationship</FieldLabel>
        <input
          id={`${tabId}-relationship`}
          type="text"
          value={info.relationship}
          onChange={(e) => onChange("relationship", e.target.value)}
          className={inputCls()}
          data-ocid={`application.${tabId}_relationship.input`}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
const GENDERS = ["Male", "Female", "Other"] as const;

const defaultParent = (relationship: string): ParentInfo => ({
  name: "",
  email: "",
  phone: "",
  occupation: "",
  relationship,
});

const defaultDoc = (): DocState => ({
  file: null,
  driveUrl: "",
  driveName: "",
});

export default function NewApplicationPage() {
  const navigate = useNavigate();
  const createAdmission = useCreateAdmission();
  const { openPicker } = useGoogleDrivePicker();

  // ── Academic year / class / section loading ───────────────────────────────
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [classesStatus, setClassesStatus] = useState<
    "idle" | "loading" | "no-year" | "error" | "done"
  >("idle");
  const [classesMessage, setClassesMessage] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  // ── Step 1: On mount → fetch academic years → find current → fetch classes ─
  useEffect(() => {
    let cancelled = false;
    setClassesStatus("loading");
    setClassesMessage("");

    (async () => {
      try {
        const yearsRes = await api.get<unknown>("/academic-years");
        if (!yearsRes.success) {
          if (!cancelled) {
            setClassesStatus("error");
            setClassesMessage(
              `Failed to load academic years: ${yearsRes.error ?? "unknown error"}`,
            );
          }
          return;
        }

        const yearsArr = extractList<Record<string, unknown>>(yearsRes.data);
        if (yearsArr.length === 0) {
          if (!cancelled) {
            setClassesStatus("no-year");
            setClassesMessage(
              "No academic years found — please complete School Setup first",
            );
          }
          return;
        }

        const currentYear =
          yearsArr.find((y) => {
            const r = y as Record<string, unknown>;
            return (
              r.IsCurrent === true ||
              r.isCurrent === true ||
              r.is_current === true ||
              r.IS_CURRENT === true
            );
          }) ?? yearsArr[0];

        const _cy = currentYear as Record<string, unknown>;
        const yearId =
          (_cy.academicYearId as number | undefined) ??
          (_cy.AcademicYearId as number | undefined) ??
          (_cy.Id as number | undefined) ??
          (_cy.id as number | undefined) ??
          (_cy.yearId as number | undefined) ??
          (_cy.YearId as number | undefined);

        if (!yearId) {
          if (!cancelled) {
            setClassesStatus("no-year");
            setClassesMessage(
              "No academic year marked as current — please complete School Setup",
            );
          }
          return;
        }

        const classesRes = await api.get<unknown>(
          `/classes/academicYear/${yearId}`,
        );

        if (!classesRes.success) {
          if (!cancelled) {
            setClassesStatus("error");
            setClassesMessage(
              `Failed to load classes: ${classesRes.error ?? "unknown error"}`,
            );
          }
          return;
        }

        const classesArr = extractList<ClassDto>(classesRes.data);
        if (!cancelled) {
          setClasses(classesArr);
          setClassesStatus("done");
          if (classesArr.length === 0) {
            setClassesMessage(
              "No classes found for the current academic year — please add classes in School Setup",
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setClassesStatus("error");
          setClassesMessage(
            err instanceof Error
              ? err.message
              : "Unexpected error loading classes",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Student form state ────────────────────────────────────────────────────
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    religion: "",
    nationality: "",
    allergies: "",
    address: "",
    lastSchoolName: "",
    lastSchoolGpa: "",
  });

  // ── Last school marksheet ─────────────────────────────────────────────────
  const [lastMarksheet, setLastMarksheet] = useState<DocState>(defaultDoc());
  const lastMarksheetInputRef = useRef<HTMLInputElement>(null);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Parent tabs state ─────────────────────────────────────────────────────
  const [activeParentTab, setActiveParentTab] = useState<
    "father" | "mother" | "guardian"
  >("father");
  const [father, setFather] = useState<ParentInfo>(defaultParent("Father"));
  const [mother, setMother] = useState<ParentInfo>(defaultParent("Mother"));
  const [guardian, setGuardian] = useState<ParentInfo>(
    defaultParent("Guardian"),
  );

  const updateParent = (
    tab: "father" | "mother" | "guardian",
    field: keyof ParentInfo,
    value: string,
  ) => {
    if (tab === "father") setFather((p) => ({ ...p, [field]: value }));
    else if (tab === "mother") setMother((p) => ({ ...p, [field]: value }));
    else setGuardian((p) => ({ ...p, [field]: value }));
  };

  const getParent = (tab: "father" | "mother" | "guardian") => {
    if (tab === "father") return father;
    if (tab === "mother") return mother;
    return guardian;
  };

  // ── Document state ────────────────────────────────────────────────────────
  const [birthCert, setBirthCert] = useState<DocState>(defaultDoc());
  const [transferCert, setTransferCert] = useState<DocState>(defaultDoc());
  const [passportPhoto, setPassportPhoto] = useState<DocState>(defaultDoc());
  const [addressProof, setAddressProof] = useState<DocState>(defaultDoc());

  const _makeDocHandlers = (
    setter: React.Dispatch<React.SetStateAction<DocState>>,
    docKey: string,
  ) => ({
    onFileChange: (file: File | null) => setter((prev) => ({ ...prev, file })),
    onDrivePick: () =>
      openPicker((name, url) =>
        setter((prev) => ({ ...prev, driveUrl: url, driveName: name })),
      ),
    onClear: (source: "file" | "drive") => {
      if (source === "file") setter((prev) => ({ ...prev, file: null }));
      else setter((prev) => ({ ...prev, driveUrl: "", driveName: "" }));
      // Reset file input value
      const input = document.getElementById(
        `doc-file-${docKey}`,
      ) as HTMLInputElement | null;
      if (input && source === "file") input.value = "";
    },
  });

  // ── Errors / submit state ─────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
    if (!selectedClassId || Number(selectedClassId) <= 0)
      errs.classId = "Please select a class";
    if (!form.address.trim()) errs.address = "Address is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const classId = Number(selectedClassId);
    if (!classId || classId <= 0) {
      setErrors((prev) => ({
        ...prev,
        classId: "Please select a valid class",
      }));
      return;
    }

    // Build AdmissionParents — only include entries where Name is filled
    const parentEntries: Array<{
      ParentType: string;
      Name: string;
      Email: string;
      Phone: string;
      Occupation: string;
      Relationship: string;
    }> = [];
    if (father.name.trim()) {
      parentEntries.push({
        ParentType: "Father",
        Name: father.name.trim(),
        Email: father.email.trim(),
        Phone: father.phone.trim(),
        Occupation: father.occupation.trim(),
        Relationship: "Father",
      });
    }
    if (mother.name.trim()) {
      parentEntries.push({
        ParentType: "Mother",
        Name: mother.name.trim(),
        Email: mother.email.trim(),
        Phone: mother.phone.trim(),
        Occupation: mother.occupation.trim(),
        Relationship: "Mother",
      });
    }
    if (guardian.name.trim()) {
      parentEntries.push({
        ParentType: "Guardian",
        Name: guardian.name.trim(),
        Email: guardian.email.trim(),
        Phone: guardian.phone.trim(),
        Occupation: guardian.occupation.trim(),
        Relationship: guardian.relationship.trim() || "Guardian",
      });
    }

    // Build AdmissionDocuments — only include entries where a file or URL is provided
    const docEntries: Array<{ DocumentType: string; FileUrl: string }> = [];
    const docSources: Array<{ type: string; state: DocState }> = [
      { type: "BirthCertificate", state: birthCert },
      { type: "TransferCertificate", state: transferCert },
      { type: "PassportPhoto", state: passportPhoto },
      { type: "AddressProof", state: addressProof },
      { type: "LastSchoolMarksheet", state: lastMarksheet },
    ];
    for (const { type, state } of docSources) {
      if (state.driveUrl) {
        docEntries.push({ DocumentType: type, FileUrl: state.driveUrl });
      } else if (state.file) {
        // Convert file to base64 data URL
        const fileUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(state.file!);
        });
        docEntries.push({ DocumentType: type, FileUrl: fileUrl });
      }
    }

    const payload = {
      ApplicantName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      DateOfBirth: form.dateOfBirth || undefined,
      Gender: form.gender || undefined,
      AppliedClassId: classId,
      Status: "Pending",
      Remarks: "",
      Religion: form.religion.trim() || undefined,
      Nationality: form.nationality.trim() || undefined,
      Allergies: form.allergies.trim() || undefined,
      Address: form.address.trim(),
      LastSchoolName: form.lastSchoolName.trim() || undefined,
      LastSchoolGpa: form.lastSchoolGpa
        ? Number(form.lastSchoolGpa)
        : undefined,
      AdmissionParents: parentEntries.length > 0 ? parentEntries : undefined,
      AdmissionDocuments: docEntries.length > 0 ? docEntries : undefined,
    };

    setSubmitting(true);
    try {
      await createAdmission.mutateAsync(payload);
      setSuccess(true);
      toast.success("Application submitted successfully!");
      setTimeout(() => navigate({ to: "/admissions" }), 1500);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.";
      toast.error(`Submission failed: ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        className="max-w-lg mx-auto mt-16 text-center space-y-4"
        data-ocid="application.success_state"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold font-display text-foreground">
          Application Submitted!
        </h2>
        <p className="text-sm text-muted-foreground">
          Redirecting you back to the admissions list…
        </p>
      </div>
    );
  }

  const classDropdownLabel = (() => {
    if (classesStatus === "loading") return "Loading classes…";
    if (classesStatus === "no-year" || classesStatus === "error")
      return classesMessage || "Setup required";
    if (classesStatus === "done" && classes.length === 0)
      return classesMessage || "No classes found";
    return "— Select Class —";
  })();

  const TABS: Array<{ id: "father" | "mother" | "guardian"; label: string }> = [
    { id: "father", label: "Father" },
    { id: "mother", label: "Mother" },
    { id: "guardian", label: "Guardian" },
  ];

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
          New Application
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Fill in the details below to submit a student application
        </p>
      </div>

      {/* Setup warning */}
      {(classesStatus === "no-year" || classesStatus === "error") && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
          ⚠️ {classesMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
        data-ocid="application.modal"
      >
        {/* ─── Student Information ─── */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6">
          <SectionHeading>Student Information</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <FieldLabel htmlFor="app-firstname" required>
                First Name
              </FieldLabel>
              <input
                id="app-firstname"
                type="text"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className={inputCls(errors.firstName)}
                data-ocid="application.first_name.input"
              />
              <FieldError msg={errors.firstName} />
            </div>

            {/* Last Name */}
            <div>
              <FieldLabel htmlFor="app-lastname" required>
                Last Name
              </FieldLabel>
              <input
                id="app-lastname"
                type="text"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className={inputCls(errors.lastName)}
                data-ocid="application.last_name.input"
              />
              <FieldError msg={errors.lastName} />
            </div>

            {/* Date of Birth */}
            <div>
              <FieldLabel htmlFor="app-dob" required>
                Date of Birth
              </FieldLabel>
              <input
                id="app-dob"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                className={inputCls(errors.dateOfBirth)}
                data-ocid="application.dob.input"
              />
              <FieldError msg={errors.dateOfBirth} />
            </div>

            {/* Gender */}
            <div>
              <FieldLabel htmlFor="app-gender">Gender</FieldLabel>
              <select
                id="app-gender"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className={inputCls()}
                data-ocid="application.gender.select"
              >
                <option value="">— Select Gender —</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <FieldLabel htmlFor="app-blood">Blood Group</FieldLabel>
              <select
                id="app-blood"
                value={form.bloodGroup}
                onChange={(e) => set("bloodGroup", e.target.value)}
                className={inputCls()}
                data-ocid="application.blood_group.select"
              >
                <option value="">— Select Blood Group —</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            {/* Class — full width in the 2-col grid */}
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="app-class" required>
                Class Applied For
              </FieldLabel>
              <select
                id="app-class"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  if (errors.classId) {
                    setErrors((prev) => {
                      const { classId: _c, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={inputCls(errors.classId)}
                data-ocid="application.class.select"
              >
                <option value="">{classDropdownLabel}</option>
                {classes.map((c) => {
                  const id = String(
                    c.classId ?? c.ClassId ?? c.Id ?? c.id ?? "",
                  );
                  const name = c.className ?? c.ClassName ?? id;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
              <FieldError msg={errors.classId} />
              <p className="text-[10px] text-muted-foreground mt-1">
                Section will be assigned by the admin upon approval.
              </p>
            </div>
          </div>

          {/* ─── Additional Student Details ─── */}
          <div className="mt-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Additional Information
            </p>

            {/* Religion + Nationality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="app-religion">Religion</FieldLabel>
                <input
                  id="app-religion"
                  type="text"
                  value={form.religion}
                  onChange={(e) => set("religion", e.target.value)}
                  placeholder="e.g. Islam, Hinduism, Christianity"
                  className={inputCls()}
                  data-ocid="application.religion.input"
                />
              </div>
              <div>
                <FieldLabel htmlFor="app-nationality">Nationality</FieldLabel>
                <input
                  id="app-nationality"
                  type="text"
                  value={form.nationality}
                  onChange={(e) => set("nationality", e.target.value)}
                  placeholder="e.g. Indian, Pakistani"
                  className={inputCls()}
                  data-ocid="application.nationality.input"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <FieldLabel htmlFor="app-address" required>
                Address
              </FieldLabel>
              <textarea
                id="app-address"
                rows={3}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Full residential address"
                className={`w-full px-3 py-2 rounded-xl border bg-background text-foreground text-sm outline-none focus:ring-1 transition-all resize-none ${
                  errors.address
                    ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                    : "border-input focus:border-primary focus:ring-primary/30"
                }`}
                data-ocid="application.address.textarea"
              />
              <FieldError msg={errors.address} />
            </div>

            {/* Allergies */}
            <div>
              <FieldLabel htmlFor="app-allergies">Any Allergies</FieldLabel>
              <textarea
                id="app-allergies"
                rows={2}
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
                placeholder="Describe any known allergies (leave blank if none)"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm outline-none focus:ring-1 focus:border-primary focus:ring-primary/30 transition-all resize-none"
                data-ocid="application.allergies.textarea"
              />
            </div>

            {/* Last School Name + GPA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="app-last-school">
                  Last School Name
                </FieldLabel>
                <input
                  id="app-last-school"
                  type="text"
                  value={form.lastSchoolName}
                  onChange={(e) => set("lastSchoolName", e.target.value)}
                  placeholder="Leave blank if not applicable"
                  className={inputCls()}
                  data-ocid="application.last_school_name.input"
                />
              </div>
              <div>
                <FieldLabel htmlFor="app-last-gpa">Last School GPA</FieldLabel>
                <input
                  id="app-last-gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={form.lastSchoolGpa}
                  onChange={(e) => set("lastSchoolGpa", e.target.value)}
                  placeholder="Leave blank if not applicable"
                  className={inputCls()}
                  data-ocid="application.last_school_gpa.input"
                />
              </div>
            </div>

            {/* Last School Marksheet */}
            <div>
              <FieldLabel htmlFor="app-marksheet">
                Last School Marksheet
              </FieldLabel>
              <div className="bg-background border border-border rounded-xl p-4 space-y-3">
                {/* Browse File */}
                <div className="flex items-center gap-2">
                  <input
                    ref={lastMarksheetInputRef}
                    id="doc-file-last_marksheet"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={(e) =>
                      setLastMarksheet((p) => ({
                        ...p,
                        file: e.target.files?.[0] ?? null,
                      }))
                    }
                    data-ocid="application.last_marksheet.file_input"
                  />
                  <button
                    type="button"
                    onClick={() => lastMarksheetInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 h-8 rounded-lg border border-input bg-background hover:bg-muted/50 text-foreground transition-colors"
                    data-ocid="application.last_marksheet.browse_button"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Browse File
                  </button>
                  {lastMarksheet.file ? (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Paperclip className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground truncate max-w-[140px]">
                        {lastMarksheet.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLastMarksheet((p) => ({ ...p, file: null }));
                          if (lastMarksheetInputRef.current)
                            lastMarksheetInputRef.current.value = "";
                        }}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                        aria-label="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      No file chosen
                    </span>
                  )}
                </div>

                {/* Or divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    or
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Google Drive */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openPicker((name, url) =>
                        setLastMarksheet((p) => ({
                          ...p,
                          driveUrl: url,
                          driveName: name,
                        })),
                      )
                    }
                    className="flex items-center gap-1.5 text-xs font-medium px-3 h-8 rounded-lg border border-input bg-background hover:bg-muted/50 text-foreground transition-colors"
                    data-ocid="application.last_marksheet.drive_button"
                  >
                    <CloudUpload className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400">
                      Pick from Google Drive
                    </span>
                  </button>
                  {lastMarksheet.driveUrl ? (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Paperclip className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <a
                        href={lastMarksheet.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[140px] hover:underline"
                      >
                        {lastMarksheet.driveName || "Drive file"}
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setLastMarksheet((p) => ({
                            ...p,
                            driveUrl: "",
                            driveName: "",
                          }))
                        }
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                        aria-label="Remove drive file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      No file from Drive
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Parent / Guardian Information (Tabs) ─── */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6">
          <SectionHeading>
            Parent / Guardian Information{" "}
            <span className="normal-case font-normal text-muted-foreground">
              (optional)
            </span>
          </SectionHeading>

          {/* Tab navigation */}
          <div className="flex gap-1 bg-muted/40 p-1 rounded-xl mb-1">
            {TABS.map((tab) => {
              const info = getParent(tab.id);
              const hasData = !!(info.name || info.email || info.phone);
              const isActive = activeParentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveParentTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  data-ocid={`application.${tab.id}_tab`}
                >
                  {tab.label}
                  {hasData && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content — all mounted, only visible active */}
          {TABS.map((tab) => (
            <div
              key={tab.id}
              style={{ display: activeParentTab === tab.id ? "block" : "none" }}
            >
              <ParentTab
                tabId={tab.id}
                info={getParent(tab.id)}
                onChange={(field, value) => updateParent(tab.id, field, value)}
              />
            </div>
          ))}
        </div>

        {/* ─── Document Upload ─── */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6">
          <SectionHeading>
            Document Upload{" "}
            <span className="normal-case font-normal text-muted-foreground">
              (optional)
            </span>
          </SectionHeading>
          <p className="text-xs text-muted-foreground mb-4">
            For each document, either browse a local file (PDF, JPG, PNG) or
            pick from Google Drive. All documents are optional.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DocumentUploadRow
              label="Birth Certificate"
              docId="birth_cert"
              state={birthCert}
              onFileChange={(f) => setBirthCert((p) => ({ ...p, file: f }))}
              onDrivePick={() =>
                openPicker((name, url) =>
                  setBirthCert((p) => ({
                    ...p,
                    driveUrl: url,
                    driveName: name,
                  })),
                )
              }
              onClear={(src) => {
                if (src === "file") {
                  setBirthCert((p) => ({ ...p, file: null }));
                  const el = document.getElementById(
                    "doc-file-birth_cert",
                  ) as HTMLInputElement | null;
                  if (el) el.value = "";
                } else
                  setBirthCert((p) => ({ ...p, driveUrl: "", driveName: "" }));
              }}
            />

            <DocumentUploadRow
              label="Transfer Certificate"
              docId="transfer_cert"
              state={transferCert}
              onFileChange={(f) => setTransferCert((p) => ({ ...p, file: f }))}
              onDrivePick={() =>
                openPicker((name, url) =>
                  setTransferCert((p) => ({
                    ...p,
                    driveUrl: url,
                    driveName: name,
                  })),
                )
              }
              onClear={(src) => {
                if (src === "file") {
                  setTransferCert((p) => ({ ...p, file: null }));
                  const el = document.getElementById(
                    "doc-file-transfer_cert",
                  ) as HTMLInputElement | null;
                  if (el) el.value = "";
                } else
                  setTransferCert((p) => ({
                    ...p,
                    driveUrl: "",
                    driveName: "",
                  }));
              }}
            />

            <DocumentUploadRow
              label="Passport Photo"
              docId="passport_photo"
              state={passportPhoto}
              onFileChange={(f) => setPassportPhoto((p) => ({ ...p, file: f }))}
              onDrivePick={() =>
                openPicker((name, url) =>
                  setPassportPhoto((p) => ({
                    ...p,
                    driveUrl: url,
                    driveName: name,
                  })),
                )
              }
              onClear={(src) => {
                if (src === "file") {
                  setPassportPhoto((p) => ({ ...p, file: null }));
                  const el = document.getElementById(
                    "doc-file-passport_photo",
                  ) as HTMLInputElement | null;
                  if (el) el.value = "";
                } else
                  setPassportPhoto((p) => ({
                    ...p,
                    driveUrl: "",
                    driveName: "",
                  }));
              }}
            />

            <DocumentUploadRow
              label="Address Proof"
              docId="address_proof"
              state={addressProof}
              onFileChange={(f) => setAddressProof((p) => ({ ...p, file: f }))}
              onDrivePick={() =>
                openPicker((name, url) =>
                  setAddressProof((p) => ({
                    ...p,
                    driveUrl: url,
                    driveName: name,
                  })),
                )
              }
              onClear={(src) => {
                if (src === "file") {
                  setAddressProof((p) => ({ ...p, file: null }));
                  const el = document.getElementById(
                    "doc-file-address_proof",
                  ) as HTMLInputElement | null;
                  if (el) el.value = "";
                } else
                  setAddressProof((p) => ({
                    ...p,
                    driveUrl: "",
                    driveName: "",
                  }));
              }}
            />
          </div>
        </div>

        {/* ─── Submit ─── */}
        <div className="flex items-center justify-between gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/admissions" })}
            className="text-sm text-muted-foreground hover:text-foreground transition-fast"
            data-ocid="application.cancel_button"
          >
            Cancel
          </button>
          <Button
            type="submit"
            disabled={submitting}
            className="gap-2 rounded-xl btn-school-primary shadow-card min-w-[10rem]"
            data-ocid="application.submit_button"
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
        </div>
      </form>
    </div>
  );
}
