import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAdmissions, useCreateStudent } from "../hooks/useQueries";
import { api } from "../lib/api";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "pending" | "approved" | "enrolled" | "rejected";

type AdmissionRow = {
  id: string;
  applicationNo: string;
  studentName: string;
  class: string;
  section?: string;
  status: string;
  appliedAt: string;
  [key: string]: unknown;
};

function normalizeAdmission(item: Record<string, unknown>): AdmissionRow {
  // Resolve ID: API returns numeric `id`
  const resolvedId = String(
    item.id ?? item.Id ?? item.admissionId ?? item.AdmissionId ?? Math.random(),
  );

  // Resolve name: API returns camelCase `applicantName`
  const resolvedName =
    ((item.applicantName as string | undefined) ??
      (item.ApplicantName as string | undefined) ??
      (item.studentName as string | undefined) ??
      (item.StudentName as string | undefined) ??
      (item.fullName as string | undefined) ??
      (item.FullName as string | undefined) ??
      (() => {
        const fn =
          (item.firstName as string | undefined) ??
          (item.FirstName as string | undefined) ??
          "";
        const ln =
          (item.lastName as string | undefined) ??
          (item.LastName as string | undefined) ??
          "";
        return fn ? `${fn}${ln ? ` ${ln}` : ""}`.trim() : "";
      })()) ||
    "Unknown";

  // Resolve application number
  const resolvedAppNo = String(
    item.applicationNo ?? item.ApplicationNo ?? item.id ?? item.Id ?? "",
  );

  return {
    id: resolvedId,
    applicationNo: resolvedAppNo,
    studentName: resolvedName,
    class:
      (item.class as string | undefined) ??
      (item.Class as string | undefined) ??
      (item.className as string | undefined) ??
      (item.ClassName as string | undefined) ??
      (item.appliedClass as string | undefined) ??
      (item.classId != null ? `Class ${item.classId}` : undefined) ??
      (item.appliedClassId != null ? `Class ${item.appliedClassId}` : ""),
    section:
      (item.section as string | undefined) ??
      (item.Section as string | undefined) ??
      (item.sectionId as string | undefined) ??
      (item.SectionId as string | undefined) ??
      undefined,
    status:
      (item.status as string | undefined) ??
      (item.Status as string | undefined) ??
      "pending",
    appliedAt:
      (item.appliedAt as string | undefined) ??
      (item.AppliedAt as string | undefined) ??
      (item.createTs as string | undefined) ??
      (item.createdAt as string | undefined) ??
      (item.CreatedAt as string | undefined) ??
      new Date().toISOString(),
    ...item,
  };
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700" },
  enrolled: { label: "Enrolled", className: "bg-primary/10 text-primary" },
  rejected: { label: "Rejected", className: "bg-rose-100 text-rose-700" },
};

function statusCfg(status: string) {
  return (
    STATUS_CONFIG[status.toLowerCase()] ?? {
      label: status,
      className: "bg-muted text-muted-foreground",
    }
  );
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
  "bg-emerald-500/15 text-emerald-600",
  "bg-purple-500/15 text-purple-600",
  "bg-amber-500/15 text-amber-700",
  "bg-cyan-500/15 text-cyan-600",
  "bg-rose-500/15 text-rose-600",
];

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3" data-ocid="admissions.loading_state">
      {[1, 2, 3, 4, 5].map((k) => (
        <div key={k} className="flex gap-4 items-center px-2">
          <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3.5 w-16 hidden md:block" />
          <Skeleton className="h-3.5 w-16 hidden md:block" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ── Types for full admission detail ─────────────────────────────────────────

type AdmissionParent = {
  parentType?: string;
  ParentType?: string;
  name?: string;
  Name?: string;
  email?: string;
  Email?: string;
  phone?: string;
  Phone?: string;
  occupation?: string;
  Occupation?: string;
  relationship?: string;
  Relationship?: string;
};

type AdmissionDocument = {
  documentType?: string;
  DocumentType?: string;
  fileUrl?: string;
  FileUrl?: string;
};

type AdmissionDetail = {
  id: number;
  applicationNo: string;
  applicantName: string;
  dateOfBirth?: string;
  gender?: string;
  appliedClassId?: number;
  appliedClassName?: string;
  status: string;
  remarks?: string;
  religion?: string;
  nationality?: string;
  allergies?: string;
  address?: string;
  lastSchoolName?: string;
  lastSchoolGpa?: number;
  createTs?: string;
  admissionParents?: AdmissionParent[];
  AdmissionParents?: AdmissionParent[];
  admissionDocuments?: AdmissionDocument[];
  AdmissionDocuments?: AdmissionDocument[];
};

// ── Allotment Modal ───────────────────────────────────────────────────────────

function AllotmentModal({
  open,
  onClose,
  onConfirm,
  appliedClassId,
  applicantName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (rollNumber: string, sectionValue: string) => void;
  appliedClassId?: number;
  applicantName: string;
}) {
  const [rollNumber, setRollNumber] = useState("");
  const [sectionValue, setSectionValue] = useState("");
  const [rollError, setRollError] = useState("");
  const [sectionError, setSectionError] = useState("");

  // Load sections for the applied class
  const [sections, setSections] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const fetchedForRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setRollNumber("");
      setSectionValue("");
      setRollError("");
      setSectionError("");
      setSections([]);
      fetchedForRef.current = undefined;
      return;
    }
    if (!appliedClassId || fetchedForRef.current === appliedClassId) return;
    fetchedForRef.current = appliedClassId;
    setSectionsLoading(true);
    api
      .get<unknown>(`/sections/Class/${appliedClassId}`)
      .then((res) => {
        const raw = res.success ? res.data : null;
        let arr: unknown[] = [];
        if (Array.isArray(raw)) {
          arr = raw;
        } else if (raw && typeof raw === "object") {
          const r = raw as Record<string, unknown>;
          // Handle { success, data } envelope
          const inner =
            ("data" in r ? r.data : null) ?? ("Data" in r ? r.Data : null);
          if (Array.isArray(inner)) arr = inner;
          else {
            const found = Object.values(r).find((v) => Array.isArray(v));
            if (found) arr = found as unknown[];
          }
        }
        setSections(
          arr.map((s) => {
            const x = s as Record<string, unknown>;
            const id = String(x.sectionId ?? x.SectionId ?? x.id ?? x.Id ?? "");
            const name = String(
              x.sectionName ?? x.SectionName ?? x.name ?? x.Name ?? id,
            );
            return { id, name };
          }),
        );
      })
      .catch(() => setSections([]))
      .finally(() => setSectionsLoading(false));
  }, [open, appliedClassId]);

  function handleSubmit() {
    let valid = true;
    if (!rollNumber.trim()) {
      setRollError("Roll number is required");
      valid = false;
    } else {
      setRollError("");
    }
    if (!sectionValue) {
      setSectionError("Please select a section");
      valid = false;
    } else {
      setSectionError("");
    }
    if (!valid) return;
    onConfirm(rollNumber.trim(), sectionValue);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-sm rounded-2xl shadow-modal p-0 overflow-hidden border border-border/60"
        data-ocid="admissions.allotment.dialog"
      >
        <div className="relative px-6 pt-6 pb-5 border-b border-border bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
            data-ocid="admissions.allotment.close_button"
          >
            <X className="w-4 h-4" />
          </button>
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Allot Section & Roll Number
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mt-1">
            Assigning to{" "}
            <span className="font-semibold text-foreground">
              {applicantName}
            </span>
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Roll Number */}
          <div>
            <label
              htmlFor="allot-roll"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Roll Number <span className="text-destructive">*</span>
            </label>
            <input
              id="allot-roll"
              type="text"
              value={rollNumber}
              onChange={(e) => {
                setRollNumber(e.target.value);
                if (rollError) setRollError("");
              }}
              placeholder="e.g. 2026001"
              className={`w-full h-10 px-3 rounded-xl border bg-background text-foreground text-sm outline-none focus:ring-1 transition-all ${
                rollError
                  ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                  : "border-input focus:border-primary focus:ring-primary/30"
              }`}
              data-ocid="admissions.allotment.roll_number.input"
            />
            {rollError && (
              <p className="text-xs text-destructive mt-1">{rollError}</p>
            )}
          </div>

          {/* Section */}
          <div>
            <label
              htmlFor="allot-section"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Section <span className="text-destructive">*</span>
            </label>
            {sectionsLoading ? (
              <div className="h-10 rounded-xl border border-input bg-muted/40 animate-pulse" />
            ) : (
              <select
                id="allot-section"
                value={sectionValue}
                onChange={(e) => {
                  setSectionValue(e.target.value);
                  if (sectionError) setSectionError("");
                }}
                className={`w-full h-10 px-3 rounded-xl border bg-background text-foreground text-sm outline-none focus:ring-1 transition-all ${
                  sectionError
                    ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                    : "border-input focus:border-primary focus:ring-primary/30"
                }`}
                data-ocid="admissions.allotment.section.select"
              >
                <option value="">— Select Section —</option>
                {sections.length === 0 && (
                  <option value="" disabled>
                    No sections found for this class
                  </option>
                )}
                {sections.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            {sectionError && (
              <p className="text-xs text-destructive mt-1">{sectionError}</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl"
            data-ocid="admissions.allotment.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className="rounded-xl btn-school-primary gap-1.5"
            data-ocid="admissions.allotment.confirm_button"
          >
            <CheckCircle className="w-4 h-4" /> Confirm & Enroll
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Admission Detail Modal ────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
}: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className="font-semibold text-foreground text-sm break-words">
        {value}
      </p>
    </div>
  );
}

function AdmissionDetailModal({
  admissionRow,
  open,
  onClose,
  onApproveClick,
  canApprove,
}: {
  admissionRow: AdmissionRow | null;
  open: boolean;
  onClose: () => void;
  onApproveClick: (detail: AdmissionDetail) => void;
  canApprove: boolean;
}) {
  const [detail, setDetail] = useState<AdmissionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [activeParentTab, setActiveParentTab] = useState<
    "father" | "mother" | "guardian"
  >("father");

  // Fetch full admission when opening
  useEffect(() => {
    if (!open || !admissionRow) {
      setDetail(null);
      setFetchError("");
      setActiveParentTab("father");
      return;
    }
    setLoading(true);
    setFetchError("");
    api
      .get<unknown>(`/admissions/${admissionRow.id}`)
      .then((res) => {
        if (!res.success || !res.data) {
          setFetchError("Failed to load admission details");
          return;
        }
        const r = res.data as Record<string, unknown>;
        // Unwrap { success, data } envelope if present
        const raw =
          "success" in r && "data" in r
            ? (r.data as Record<string, unknown>)
            : r;
        setDetail({
          id: Number(
            raw.id ??
              raw.Id ??
              raw.admissionId ??
              raw.AdmissionId ??
              admissionRow.id,
          ),
          applicationNo: String(
            raw.applicationNo ??
              raw.ApplicationNo ??
              admissionRow.applicationNo ??
              "",
          ),
          applicantName: String(
            raw.applicantName ??
              raw.ApplicantName ??
              admissionRow.studentName ??
              "",
          ),
          dateOfBirth: (raw.dateOfBirth ?? raw.DateOfBirth) as
            | string
            | undefined,
          gender: (raw.gender ?? raw.Gender) as string | undefined,
          appliedClassId: (raw.appliedClassId ?? raw.AppliedClassId) as
            | number
            | undefined,
          appliedClassName:
            ((raw.appliedClass as Record<string, unknown> | undefined)
              ?.className as string | undefined) ??
            ((raw.className ?? raw.ClassName) as string | undefined) ??
            admissionRow.class,
          status: String(raw.status ?? raw.Status ?? admissionRow.status),
          remarks: (raw.remarks ?? raw.Remarks) as string | undefined,
          religion: (raw.religion ?? raw.Religion) as string | undefined,
          nationality: (raw.nationality ?? raw.Nationality) as
            | string
            | undefined,
          allergies: (raw.allergies ?? raw.Allergies) as string | undefined,
          address: (raw.address ?? raw.Address) as string | undefined,
          lastSchoolName: (raw.lastSchoolName ?? raw.LastSchoolName) as
            | string
            | undefined,
          lastSchoolGpa: (raw.lastSchoolGpa ?? raw.LastSchoolGpa) as
            | number
            | undefined,
          createTs: (raw.createTs ?? raw.createdAt ?? raw.CreatedAt) as
            | string
            | undefined,
          admissionParents: (raw.admissionParents ?? raw.AdmissionParents) as
            | AdmissionParent[]
            | undefined,
          admissionDocuments: (raw.admissionDocuments ??
            raw.AdmissionDocuments) as AdmissionDocument[] | undefined,
        });
      })
      .catch(() => setFetchError("Unexpected error loading details"))
      .finally(() => setLoading(false));
  }, [open, admissionRow]);

  if (!admissionRow) return null;

  const currentDetail = detail;
  const status = currentDetail?.status ?? admissionRow.status;
  const cfg = statusCfg(status);
  const name = currentDetail?.applicantName ?? admissionRow.studentName;
  const initials = getInitials(name || "?");

  // Parent helpers
  const allParents = (currentDetail?.admissionParents ??
    currentDetail?.AdmissionParents ??
    []) as AdmissionParent[];
  const getParentsByType = (type: string) =>
    allParents.filter(
      (p) =>
        (p.parentType ?? p.ParentType ?? "").toLowerCase() ===
        type.toLowerCase(),
    );
  const fatherEntries = getParentsByType("Father");
  const motherEntries = getParentsByType("Mother");
  const guardianEntries = allParents.filter(
    (p) =>
      !["father", "mother"].includes(
        (p.parentType ?? p.ParentType ?? "").toLowerCase(),
      ),
  );

  const parentTabs: Array<{
    id: "father" | "mother" | "guardian";
    label: string;
    entries: AdmissionParent[];
  }> = [
    { id: "father", label: "Father", entries: fatherEntries },
    { id: "mother", label: "Mother", entries: motherEntries },
    { id: "guardian", label: "Guardian", entries: guardianEntries },
  ];

  const documents = (currentDetail?.admissionDocuments ??
    currentDetail?.AdmissionDocuments ??
    []) as AdmissionDocument[];

  const statusLower = status.toLowerCase();
  const isPending = statusLower === "pending";
  const showApproveBtn = canApprove && isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg rounded-2xl shadow-modal p-0 overflow-hidden border border-border/60"
        data-ocid="admissions.view.dialog"
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-border bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
            data-ocid="admissions.view.close_button"
          >
            <X className="w-4 h-4" />
          </button>
          <DialogHeader className="mb-4">
            <DialogTitle className="font-display text-lg font-bold">
              Admission Details
            </DialogTitle>
          </DialogHeader>
          <div className="glass rounded-2xl p-4 flex items-center gap-4 border border-white/30 shadow-subtle">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-card">
              <span className="font-display font-bold text-primary text-lg">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-base leading-tight truncate">
                {name}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                #{currentDetail?.applicationNo ?? admissionRow.applicationNo}
              </p>
              <span
                className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}
              >
                {cfg.label}
              </span>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[55vh]">
          {loading ? (
            <div
              className="p-8 flex flex-col items-center gap-3"
              data-ocid="admissions.view.loading_state"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
              <p className="text-sm text-muted-foreground">Loading details…</p>
            </div>
          ) : fetchError ? (
            <div
              className="p-8 text-center"
              data-ocid="admissions.view.error_state"
            >
              <p className="text-sm text-destructive">{fetchError}</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Core Info */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-3">
                  Student Information
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <InfoRow
                    label="Application #"
                    value={
                      currentDetail?.applicationNo ?? admissionRow.applicationNo
                    }
                  />
                  <InfoRow label="Status" value={cfg.label} />
                  <InfoRow
                    label="Date of Birth"
                    value={
                      currentDetail?.dateOfBirth
                        ? new Date(
                            currentDetail.dateOfBirth,
                          ).toLocaleDateString()
                        : undefined
                    }
                  />
                  <InfoRow label="Gender" value={currentDetail?.gender} />
                  <InfoRow
                    label="Class Applied"
                    value={
                      currentDetail?.appliedClassName ?? admissionRow.class
                    }
                  />
                  <InfoRow label="Religion" value={currentDetail?.religion} />
                  <InfoRow
                    label="Nationality"
                    value={currentDetail?.nationality}
                  />
                  <InfoRow
                    label="Last School"
                    value={currentDetail?.lastSchoolName}
                  />
                  {currentDetail?.lastSchoolGpa != null && (
                    <InfoRow
                      label="Last School GPA"
                      value={String(currentDetail.lastSchoolGpa)}
                    />
                  )}
                  <InfoRow
                    label="Applied On"
                    value={
                      currentDetail?.createTs
                        ? new Date(currentDetail.createTs).toLocaleDateString()
                        : undefined
                    }
                  />
                </div>
                {currentDetail?.address && (
                  <div className="mt-2.5 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Address
                    </p>
                    <p className="font-semibold text-foreground text-sm">
                      {currentDetail.address}
                    </p>
                  </div>
                )}
                {currentDetail?.allergies && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                      ⚠ Allergies
                    </p>
                    <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                      {currentDetail.allergies}
                    </p>
                  </div>
                )}
                {currentDetail?.remarks && (
                  <div className="mt-2.5 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Remarks
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentDetail.remarks}
                    </p>
                  </div>
                )}
              </div>

              {/* Parent / Guardian */}
              {allParents.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-3">
                    Parent / Guardian
                  </p>
                  <div className="flex gap-1 bg-muted/40 p-1 rounded-xl mb-3">
                    {parentTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveParentTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                          activeParentTab === tab.id
                            ? "bg-card text-foreground shadow-sm border border-border"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        data-ocid={`admissions.view.${tab.id}_tab`}
                      >
                        {tab.label}
                        {tab.entries.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                        )}
                      </button>
                    ))}
                  </div>
                  {parentTabs.map((tab) => (
                    <div
                      key={tab.id}
                      style={{
                        display: activeParentTab === tab.id ? "block" : "none",
                      }}
                    >
                      {tab.entries.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-2">
                          No {tab.label.toLowerCase()} info provided.
                        </p>
                      ) : (
                        tab.entries.map((p, pi) => (
                          <div
                            key={`${tab.id}-parent-${pi}`}
                            className="grid grid-cols-2 gap-2.5"
                          >
                            <InfoRow label="Name" value={p.Name ?? p.name} />
                            <InfoRow label="Phone" value={p.Phone ?? p.phone} />
                            <InfoRow label="Email" value={p.Email ?? p.email} />
                            <InfoRow
                              label="Occupation"
                              value={p.Occupation ?? p.occupation}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Documents */}
              {documents.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-3">
                    Documents
                  </p>
                  <div className="space-y-2">
                    {documents.map((doc, di) => {
                      const type =
                        doc.DocumentType ??
                        doc.documentType ??
                        `Document ${di + 1}`;
                      const url = doc.FileUrl ?? doc.fileUrl ?? "";
                      return (
                        <div
                          key={`doc-${doc.DocumentType ?? doc.documentType ?? di}`}
                          className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border/50"
                        >
                          <span className="text-sm font-medium text-foreground">
                            {type}
                          </span>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No URL
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl"
            data-ocid="admissions.view.cancel_button"
          >
            Close
          </Button>
          {showApproveBtn && currentDetail && (
            <Button
              type="button"
              size="sm"
              onClick={() => onApproveClick(currentDetail)}
              className="rounded-xl btn-school-primary gap-1.5"
              data-ocid="admissions.view.confirm_button"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdmissionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedAdmission, setSelectedAdmission] =
    useState<AdmissionRow | null>(null);

  // Approve flow state
  const [allotmentTarget, setAllotmentTarget] =
    useState<AdmissionDetail | null>(null);
  const [approving, setApproving] = useState(false);
  const createStudent = useCreateStudent();

  const canApprove =
    user != null &&
    ["principal", "admin"].includes((user.role ?? "").toLowerCase());

  // Called from the row-level Approve button — fetches detail then triggers approve flow
  async function handleRowApproveClick(row: AdmissionRow) {
    if (!user) return;
    setApproving(true);
    try {
      const res = await api.get<unknown>(`/admissions/${row.id}`);
      if (!res.success || !res.data) {
        toast.error("Could not load admission details for approval");
        return;
      }
      const r = res.data as Record<string, unknown>;
      const raw =
        "success" in r && "data" in r ? (r.data as Record<string, unknown>) : r;
      const detail: AdmissionDetail = {
        id: Number(
          raw.id ?? raw.Id ?? raw.admissionId ?? raw.AdmissionId ?? row.id,
        ),
        applicationNo: String(
          raw.applicationNo ?? raw.ApplicationNo ?? row.applicationNo ?? "",
        ),
        applicantName: String(
          raw.applicantName ?? raw.ApplicantName ?? row.studentName ?? "",
        ),
        dateOfBirth: (raw.dateOfBirth ?? raw.DateOfBirth) as string | undefined,
        gender: (raw.gender ?? raw.Gender) as string | undefined,
        appliedClassId: (raw.appliedClassId ?? raw.AppliedClassId) as
          | number
          | undefined,
        appliedClassName: (raw.className ?? raw.ClassName ?? row.class) as
          | string
          | undefined,
        status: String(raw.status ?? raw.Status ?? row.status),
        remarks: (raw.remarks ?? raw.Remarks) as string | undefined,
        religion: (raw.religion ?? raw.Religion) as string | undefined,
        nationality: (raw.nationality ?? raw.Nationality) as string | undefined,
        allergies: (raw.allergies ?? raw.Allergies) as string | undefined,
        address: (raw.address ?? raw.Address) as string | undefined,
        lastSchoolName: (raw.lastSchoolName ?? raw.LastSchoolName) as
          | string
          | undefined,
        lastSchoolGpa: (raw.lastSchoolGpa ?? raw.LastSchoolGpa) as
          | number
          | undefined,
        createTs: (raw.createTs ?? raw.createdAt ?? raw.CreatedAt) as
          | string
          | undefined,
        admissionParents: (raw.admissionParents ?? raw.AdmissionParents) as
          | AdmissionParent[]
          | undefined,
        admissionDocuments: (raw.admissionDocuments ??
          raw.AdmissionDocuments) as AdmissionDocument[] | undefined,
      };
      // Inline the approve PUT so we can pass the already-fetched detail
      const putRes = await api.put<unknown>(`/admissions/${detail.id}`, {
        Status: "Approved",
        VerifiedByUserId: Number(user.id),
        VerifiedAt: new Date().toISOString(),
      });
      if (!putRes.success) {
        toast.error(
          `Could not approve admission: ${putRes.error ?? "Unknown error"}`,
        );
        return;
      }
      setAllotmentTarget(detail);
    } catch (err) {
      toast.error(`Approve failed: ${(err as Error).message}`);
    } finally {
      setApproving(false);
    }
  }

  // Called when "Approve" button is clicked — first PUT status, then open allotment
  async function handleApproveClick(detail: AdmissionDetail) {
    if (!user) return;
    setApproving(true);
    try {
      const putRes = await api.put<unknown>(`/admissions/${detail.id}`, {
        Status: "Approved",
        VerifiedByUserId: Number(user.id),
        VerifiedAt: new Date().toISOString(),
      });
      if (!putRes.success) {
        toast.error(
          `Could not approve admission: ${putRes.error ?? "Unknown error"}`,
        );
        return;
      }
      // Close detail modal and open allotment
      setSelectedAdmission(null);
      setAllotmentTarget(detail);
    } catch (err) {
      toast.error(`Approve failed: ${(err as Error).message}`);
    } finally {
      setApproving(false);
    }
  }

  // Called when allotment form is confirmed
  async function handleAllotmentConfirm(
    rollNumber: string,
    sectionValue: string,
  ) {
    if (!allotmentTarget) return;
    const nameParts = (allotmentTarget.applicantName ?? "").trim();
    const lastSpace = nameParts.lastIndexOf(" ");
    const firstName = lastSpace > 0 ? nameParts.slice(0, lastSpace) : nameParts;
    const lastName = lastSpace > 0 ? nameParts.slice(lastSpace + 1) : "";

    try {
      const studentRes = await createStudent.mutateAsync({
        FirstName: firstName,
        LastName: lastName,
        DateOfBirth: allotmentTarget.dateOfBirth ?? "",
        ClassId: allotmentTarget.appliedClassId ?? 0,
        Section: sectionValue,
        RollNumber: rollNumber,
      });

      const newStudentId =
        (studentRes as Record<string, unknown>)?.studentId ??
        (studentRes as Record<string, unknown>)?.StudentId;

      if (newStudentId) {
        await api.put<unknown>(`/admissions/${allotmentTarget.id}`, {
          EnrolledStudentId: Number(newStudentId),
        });
      }

      toast.success("Admission approved and student record created");
      setAllotmentTarget(null);
      qc.invalidateQueries({ queryKey: ["admissions"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    } catch (err) {
      toast.error(`Enrollment failed: ${(err as Error).message}`);
    }
  }

  const { data, isLoading, error } = useAdmissions({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  useEffect(() => {
    if (error)
      toast.error(`Failed to load admissions: ${(error as Error).message}`);
  }, [error]);

  // useAdmissions hook already normalizes items; data.data is always Application[]
  const rawList = data?.data ?? [];
  const rawRows: AdmissionRow[] = rawList.map((item) =>
    normalizeAdmission(item as unknown as Record<string, unknown>),
  );

  const filteredRows =
    statusFilter === "all"
      ? rawRows
      : rawRows.filter((r) => r.status.toLowerCase() === statusFilter);

  const totalFromApi = data?.total ?? rawRows.length;
  const displayTotal =
    statusFilter === "all" ? totalFromApi : filteredRows.length;
  const displayPages = Math.max(1, Math.ceil(totalFromApi / PAGE_SIZE));

  const statCounts = {
    total: totalFromApi,
    pending: rawRows.filter((r) => r.status.toLowerCase() === "pending").length,
    approved: rawRows.filter((r) => r.status.toLowerCase() === "approved")
      .length,
    enrolled: rawRows.filter((r) => r.status.toLowerCase() === "enrolled")
      .length,
    rejected: rawRows.filter((r) => r.status.toLowerCase() === "rejected")
      .length,
  };

  const statCards = [
    {
      label: "Total Applications",
      value: statCounts.total,
      color: "text-primary",
      iconBg: "bg-primary/10",
      icon: FileText,
    },
    {
      label: "Pending",
      value: statCounts.pending,
      color: "text-amber-600",
      iconBg: "bg-amber-100",
      icon: GraduationCap,
    },
    {
      label: "Approved",
      value: statCounts.approved,
      color: "text-emerald-600",
      iconBg: "bg-emerald-100",
      icon: CheckCircle,
    },
    {
      label: "Enrolled",
      value: statCounts.enrolled,
      color: "text-blue-600",
      iconBg: "bg-blue-100",
      icon: UserPlus,
    },
  ];

  const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "enrolled", label: "Enrolled" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
            Admissions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage student applications and enrolments
          </p>
        </div>
        <Link to="/admissions/new">
          <Button
            size="sm"
            className="gap-1.5 rounded-xl h-9 shadow-card btn-school-primary hover-lift"
            data-ocid="admissions.primary_button"
          >
            <UserPlus className="w-4 h-4" /> New Application
          </Button>
        </Link>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "tween", delay: i * 0.07 }}
            className="bg-card rounded-2xl border border-border shadow-card p-4 hover-lift card-premium"
            data-ocid={`admissions.stats.${i + 1}.card`}
          >
            <div className="flex items-start justify-between gap-2">
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

      {/* ── Table Card ── */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        {/* Search + Filters */}
        <div className="px-5 py-3.5 border-b border-border bg-gradient-to-r from-muted/20 to-transparent space-y-3">
          <input
            type="text"
            placeholder="Search by student name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full sm:max-w-xs h-8 px-3 rounded-lg border border-input bg-background text-foreground text-sm outline-none focus:border-primary transition-fast"
            data-ocid="admissions.search_input"
          />
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                data-ocid={`admissions.${tab.key}.tab`}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-fast border ${
                  statusFilter === tab.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table body */}
        {isLoading ? (
          <TableSkeleton />
        ) : filteredRows.length === 0 ? (
          <div
            className="p-14 flex flex-col items-center justify-center"
            data-ocid="admissions.empty_state"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 border border-primary/10">
              <FileText className="w-10 h-10 text-primary/30" />
            </div>
            <p className="text-base font-bold font-display text-foreground">
              No applications found
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {search
                ? "Try a different search term."
                : "No applications match the selected filter."}
            </p>
            <Link to="/admissions/new">
              <Button
                size="sm"
                className="mt-4 gap-1.5 rounded-xl btn-school-primary"
              >
                <UserPlus className="w-3.5 h-3.5" /> New Application
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto" data-ocid="admissions.table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {[
                    "Application #",
                    "Student Name",
                    "Class",
                    "Section",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide ${
                        i === 3 ? "hidden md:table-cell" : ""
                      } ${i === 5 ? "hidden lg:table-cell" : ""} ${i === 6 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => {
                  const cfg = statusCfg(row.status);
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 table-row-hover group"
                      data-ocid={`admissions.item.${i + 1}`}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        {row.applicationNo || `#${row.id}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${avatarPalette[i % avatarPalette.length]}`}
                          >
                            <span className="font-display font-bold text-[11px]">
                              {getInitials(row.studentName)}
                            </span>
                          </div>
                          <p className="font-semibold text-foreground text-sm leading-tight truncate max-w-[12rem]">
                            {row.studentName}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {row.class || "–"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                        {row.section || "–"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                        {row.appliedAt
                          ? new Date(row.appliedAt).toLocaleDateString()
                          : "–"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-fast">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-fast"
                            onClick={() => setSelectedAdmission(row)}
                            aria-label="View admission"
                            data-ocid={`admissions.view.${i + 1}.button`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {canApprove &&
                            !approving &&
                            row.status.toLowerCase() === "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 text-xs font-semibold transition-fast gap-1"
                                onClick={() => handleRowApproveClick(row)}
                                aria-label="Approve admission"
                                data-ocid={`admissions.approve.${i + 1}.button`}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                  Approve
                                </span>
                              </Button>
                            )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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

      <AdmissionDetailModal
        admissionRow={selectedAdmission}
        open={selectedAdmission !== null}
        onClose={() => setSelectedAdmission(null)}
        onApproveClick={handleApproveClick}
        canApprove={canApprove && !approving}
      />

      <AllotmentModal
        open={allotmentTarget !== null}
        onClose={() => setAllotmentTarget(null)}
        onConfirm={handleAllotmentConfirm}
        appliedClassId={allotmentTarget?.appliedClassId}
        applicantName={allotmentTarget?.applicantName ?? ""}
      />
    </motion.div>
  );
}
