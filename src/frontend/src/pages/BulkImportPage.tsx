import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateStudent } from "@/hooks/useQueries";
import { isDemoMode } from "@/lib/demoMode";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  FileText,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ParsedRow = {
  rowNum: number;
  name: string;
  rollNo: string;
  classId: string;
  sectionId: string;
  dob: string;
  gender: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  valid: boolean;
  errors: string[];
};

type ImportStatus = "pending" | "importing" | "success" | "failed";

type ImportResult = ParsedRow & {
  status: ImportStatus;
  errorMsg?: string;
};

// ─── CSV helpers ──────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  "name",
  "rollNo",
  "classId",
  "sectionId",
  "dob",
  "gender",
  "parentName",
  "parentPhone",
  "parentEmail",
];

const SAMPLE_ROWS = [
  "Aiden Clarke,STU-001,10,1,2010-05-15,M,Charles Clarke,+234-801-234-5678,charles@email.com",
  "Blessing Nwosu,STU-002,9,2,2011-08-22,F,Emmanuel Nwosu,+234-803-456-7890,e.nwosu@email.com",
  "Chidera Obi,,8,1,2012-03-10,M,,,",
];

function downloadTemplate() {
  const csv = [CSV_HEADERS.join(","), ...SAMPLE_ROWS].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadResults(results: ImportResult[]) {
  const header = [...CSV_HEADERS, "status", "error"].join(",");
  const rows = results.map((r) =>
    [
      r.name,
      r.rollNo,
      r.classId,
      r.sectionId,
      r.dob,
      r.gender,
      r.parentName,
      r.parentPhone,
      r.parentEmail,
      r.status,
      r.errorMsg ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "import_results.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const startIndex = lines[0].toLowerCase().startsWith("name") ? 1 : 0;
  const dataLines = lines.slice(startIndex);

  return dataLines.map((line, i) => {
    const cols = line
      .split(",")
      .map((c) => c.trim().replace(/^"|"$/g, "").trim());

    const [
      name = "",
      rollNo = "",
      classId = "",
      sectionId = "",
      dob = "",
      gender = "",
      parentName = "",
      parentPhone = "",
      parentEmail = "",
    ] = cols;

    const errors: string[] = [];
    if (!name.trim()) errors.push("Name is required");
    if (!classId.trim()) errors.push("Class ID is required");
    else if (Number.isNaN(Number(classId)))
      errors.push("Class ID must be a number");
    if (gender && !["M", "F"].includes(gender.toUpperCase()))
      errors.push("Gender must be M or F");
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob))
      errors.push("Date of birth must be YYYY-MM-DD");

    return {
      rowNum: startIndex + i + 1,
      name: name.trim(),
      rollNo: rollNo.trim(),
      classId: classId.trim(),
      sectionId: sectionId.trim(),
      dob: dob.trim(),
      gender: gender.toUpperCase().trim(),
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail.trim(),
      valid: errors.length === 0,
      errors,
    };
  });
}

function StatusIcon({ status }: { status: ImportStatus }) {
  if (status === "success")
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "failed")
    return <XCircle className="w-4 h-4 text-destructive" />;
  if (status === "importing")
    return (
      <div
        className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
        style={{
          borderColor: "var(--color-primary)",
          borderTopColor: "transparent",
        }}
      />
    );
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BulkImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(
    null,
  );
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");

  const createMutation = useCreateStudent();

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setImportResults(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("No data rows found in CSV");
        return;
      }
      setParsedRows(rows);
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleImport() {
    if (!parsedRows) return;
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setImporting(true);
    setImportProgress(0);

    const results: ImportResult[] = parsedRows.map((r) => ({
      ...r,
      status: r.valid ? ("pending" as const) : ("failed" as const),
      errorMsg: r.valid ? undefined : r.errors.join("; "),
    }));
    setImportResults([...results]);

    let done = 0;
    for (let i = 0; i < results.length; i++) {
      if (!results[i].valid) continue;

      results[i].status = "importing";
      setImportResults([...results]);

      try {
        if (isDemoMode()) {
          await new Promise((r) => setTimeout(r, 1000));
          if (Math.random() < 0.1) throw new Error("Simulated import error");
        } else {
          await createMutation.mutateAsync({
            name: results[i].name,
            rollNo: results[i].rollNo || undefined,
            classId: Number(results[i].classId),
            sectionId: results[i].sectionId || undefined,
            dob: results[i].dob || undefined,
            gender: results[i].gender || undefined,
            parentInfo:
              results[i].parentName ||
              results[i].parentPhone ||
              results[i].parentEmail
                ? {
                    name: results[i].parentName || undefined,
                    phone: results[i].parentPhone || undefined,
                    email: results[i].parentEmail || undefined,
                  }
                : undefined,
          });
        }
        results[i].status = "success";
      } catch (err) {
        results[i].status = "failed";
        results[i].errorMsg = (err as Error).message;
      }

      done++;
      setImportProgress(Math.round((done / validRows.length) * 100));
      setImportResults([...results]);
    }

    setImporting(false);
    const successCount = results.filter((r) => r.status === "success").length;
    const failCount = results.filter(
      (r) => r.status === "failed" && r.valid,
    ).length;
    toast.success(
      `Import complete: ${successCount} added, ${failCount} failed`,
    );
  }

  const validCount = parsedRows?.filter((r) => r.valid).length ?? 0;
  const invalidCount = parsedRows?.filter((r) => !r.valid).length ?? 0;
  const successCount =
    importResults?.filter((r) => r.status === "success").length ?? 0;
  const failCount =
    importResults?.filter((r) => r.status === "failed" && r.valid).length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-5xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/students"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              data-ocid="bulk_import.back.link"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Students
            </Link>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Bulk Student Import
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a CSV file to import multiple students at once
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 hover-lift border-border/60"
          onClick={downloadTemplate}
          data-ocid="bulk_import.download_template.button"
        >
          <Download className="w-4 h-4" /> Download Template
        </Button>
      </div>

      {/* Upload Zone */}
      {!parsedRows && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-card"
              style={{ background: "var(--color-primary-light)" }}
            >
              <Upload
                className="w-4 h-4"
                style={{ color: "var(--color-primary)" }}
              />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Upload CSV File
              </h2>
              <p className="text-xs text-muted-foreground">
                Accepts .csv files only
              </p>
            </div>
          </div>

          {/* Drop zone */}
          <button
            type="button"
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-2xl p-14 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
              dragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/60 hover:bg-primary/5"
            }`}
            data-ocid="bulk_import.dropzone"
          >
            <motion.div
              animate={{ y: dragging ? -4 : 0 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-card transition-all"
              style={{
                background: dragging
                  ? "var(--color-primary-light)"
                  : "oklch(var(--muted))",
              }}
            >
              <FileText
                className="w-8 h-8 transition-colors"
                style={{ color: dragging ? "var(--color-primary)" : undefined }}
              />
            </motion.div>
            <p className="font-display font-semibold text-lg text-foreground">
              {dragging ? "Drop it!" : "Drop CSV here or click to browse"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supported format: .csv with UTF-8 encoding
            </p>
            <div
              className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                background: "var(--color-primary-light)",
                color: "var(--color-primary)",
                borderColor: "var(--color-primary)",
              }}
            >
              Browse Files
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
            data-ocid="bulk_import.file.input"
          />

          {/* Template info */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
              Required CSV Format
            </p>
            <code className="text-xs text-muted-foreground block font-mono overflow-x-auto whitespace-pre bg-muted/50 rounded-lg px-3 py-2">
              {CSV_HEADERS.join(",")}
            </code>
            <p className="text-xs text-muted-foreground">
              Required: <strong>name</strong>, <strong>classId</strong>. All
              others are optional.
            </p>
          </div>
        </motion.div>
      )}

      {/* Preview Table */}
      {parsedRows && !importResults && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* File info bar */}
          <div className="glass rounded-xl border border-border shadow-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {fileName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fileSize}
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              >
                {validCount} valid
              </Badge>
              {invalidCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/30"
                >
                  {invalidCount} invalid
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setParsedRows(null);
                  setFileName("");
                  setFileSize("");
                }}
                data-ocid="bulk_import.reupload.button"
              >
                Re-upload
              </Button>
              <Button
                size="sm"
                className="gap-2 btn-press shadow-card"
                style={{ background: "var(--color-primary)" }}
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                data-ocid="bulk_import.import_all.button"
              >
                <Users className="w-4 h-4" />
                Import {validCount > 0 ? `${validCount} Students` : ""}
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
              <h2 className="font-display font-semibold text-foreground">
                Preview — {parsedRows.length} rows
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="bulk_import.preview.table">
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="w-10 font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Class</TableHead>
                    <TableHead className="font-semibold">Section</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">
                      Gender
                    </TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">
                      DOB
                    </TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold">
                      Parent
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow
                      key={row.rowNum}
                      className={`table-row-hover stagger-item ${!row.valid ? "bg-destructive/5 hover:bg-destructive/10" : ""}`}
                      data-ocid={`bulk_import.preview.item.${i + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-xs">
                        {row.rowNum}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.name || (
                          <span className="text-destructive italic text-xs">
                            (missing)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{row.classId || "–"}</TableCell>
                      <TableCell>{row.sectionId || "–"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {row.gender || "–"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {row.dob || "–"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {row.parentName || "–"}
                      </TableCell>
                      <TableCell>
                        {row.valid ? (
                          <span className="badge-premium bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs">
                            Valid
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="badge-premium bg-destructive/10 text-destructive border border-destructive/30 text-xs">
                              Invalid
                            </span>
                            {row.errors.map((e) => (
                              <p
                                key={e}
                                className="text-[10px] text-destructive leading-tight"
                              >
                                {e}
                              </p>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Import Progress & Results */}
      {importResults && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {importing && (
            <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--color-primary-light)" }}
                  >
                    <Upload
                      className="w-4 h-4"
                      style={{ color: "var(--color-primary)" }}
                    />
                  </div>
                  <p className="font-display font-semibold text-foreground">
                    Importing students…
                  </p>
                </div>
                <span
                  className="badge-premium"
                  style={{
                    background: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                  }}
                >
                  {importProgress}%
                </span>
              </div>
              <Progress
                value={importProgress}
                className="h-2.5 rounded-full"
                data-ocid="bulk_import.progress"
              />
              <p className="text-xs text-muted-foreground">
                Please don't close this page while import is in progress
              </p>
            </div>
          )}

          {!importing && (
            <div className="glass rounded-xl border border-border shadow-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {successCount > 0 && (
                  <span className="badge-premium bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    {successCount} imported
                  </span>
                )}
                {failCount > 0 && (
                  <span className="badge-premium bg-destructive/10 text-destructive border border-destructive/30 flex items-center gap-1.5">
                    <XCircle className="w-3 h-3" />
                    {failCount} failed
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 hover-lift"
                  onClick={() => downloadResults(importResults)}
                  data-ocid="bulk_import.download_results.button"
                >
                  <Download className="w-4 h-4" /> Download Results
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setParsedRows(null);
                    setImportResults(null);
                    setFileName("");
                    setFileSize("");
                  }}
                  data-ocid="bulk_import.new_import.button"
                >
                  New Import
                </Button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
              <h2 className="font-display font-semibold text-foreground">
                Import Results
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="bulk_import.results.table">
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="w-10 font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Class</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">
                      Parent
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((row, i) => (
                    <TableRow
                      key={row.rowNum}
                      className="table-row-hover stagger-item"
                      data-ocid={`bulk_import.result.item.${i + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-xs">
                        {row.rowNum}
                      </TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.classId}
                        {row.sectionId ? `-${row.sectionId}` : ""}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {row.parentName || "–"}
                      </TableCell>
                      <TableCell>
                        <StatusIcon status={row.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.status === "success"
                          ? "Added successfully"
                          : (row.errorMsg ?? "Skipped (invalid)")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
