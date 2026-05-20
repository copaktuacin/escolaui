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
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  ClassId: string;
  Section: string;
  RollNumber: string;
  valid: boolean;
  errors: string[];
};

type ImportStatus = "pending" | "importing" | "success" | "failed";

type ImportResult = ParsedRow & { status: ImportStatus; errorMsg?: string };

// ─── CSV helpers ──────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  "FirstName",
  "LastName",
  "DateOfBirth",
  "ClassId",
  "Section",
  "RollNumber",
];

/** Download a blank template — header row only, no sample data rows */
function downloadTemplate() {
  const csv = `${CSV_HEADERS.join(",")}\n`;
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
      r.FirstName,
      r.LastName,
      r.DateOfBirth,
      r.ClassId,
      r.Section,
      r.RollNumber,
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

  // Skip header row if present
  const startIndex = lines[0].toLowerCase().startsWith("firstname") ? 1 : 0;
  const dataLines = lines.slice(startIndex);

  return dataLines.map((line, i) => {
    const cols = line
      .split(",")
      .map((c) => c.trim().replace(/^"|"$/g, "").trim());
    const [
      FirstName = "",
      LastName = "",
      DateOfBirth = "",
      ClassId = "",
      Section = "",
      RollNumber = "",
    ] = cols;

    const errors: string[] = [];
    if (!FirstName.trim()) errors.push("FirstName is required");
    if (!LastName.trim()) errors.push("LastName is required");
    if (!ClassId.trim()) errors.push("ClassId is required");
    else if (Number.isNaN(Number(ClassId)))
      errors.push("ClassId must be a number");
    if (!Section.trim()) errors.push("Section is required");
    const dobRe = /^\d{4}-\d{2}-\d{2}$/;
    if (DateOfBirth && !dobRe.test(DateOfBirth))
      errors.push("DateOfBirth must be YYYY-MM-DD");

    return {
      rowNum: startIndex + i + 1,
      FirstName: FirstName.trim(),
      LastName: LastName.trim(),
      DateOfBirth: DateOfBirth.trim(),
      ClassId: ClassId.trim(),
      Section: Section.trim(),
      RollNumber: RollNumber.trim(),
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
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
        await createMutation.mutateAsync({
          FirstName: results[i].FirstName,
          LastName: results[i].LastName,
          DateOfBirth: results[i].DateOfBirth,
          ClassId: Number(results[i].ClassId),
          Section: results[i].Section,
          RollNumber: results[i].RollNumber,
        });
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
      {/* ── Header ──────────────────────────────────────────────────────────── */}
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
          className="gap-2"
          onClick={downloadTemplate}
          data-ocid="bulk_import.download_template.button"
        >
          <Download className="w-4 h-4" /> Download Template
        </Button>
      </div>

      {/* ── Upload Zone ──────────────────────────────────────────────────────── */}
      {!parsedRows && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-4 h-4 text-primary" />
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

          <button
            type="button"
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-2xl p-14 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              dragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/60 hover:bg-primary/5"
            }`}
            data-ocid="bulk_import.dropzone"
          >
            <motion.div
              animate={{ y: dragging ? -4 : 0 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5 shadow-card"
            >
              <FileText
                className={`w-8 h-8 ${dragging ? "text-primary" : "text-muted-foreground/50"}`}
              />
            </motion.div>
            <p className="font-display font-semibold text-lg text-foreground">
              {dragging ? "Drop it!" : "Drop CSV here or click to browse"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supported format: .csv with UTF-8 encoding
            </p>
            <div className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
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

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
              Required CSV Format
            </p>
            <code className="text-xs text-muted-foreground block font-mono bg-muted/50 rounded-lg px-3 py-2">
              {CSV_HEADERS.join(",")}
            </code>
            <p className="text-xs text-muted-foreground">
              Required: <strong>FirstName</strong>, <strong>LastName</strong>,{" "}
              <strong>ClassId</strong>, <strong>Section</strong>. DateOfBirth
              format: YYYY-MM-DD.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Preview Table ──────────────────────────────────────────────────────── */}
      {parsedRows && !importResults && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-card rounded-xl border border-border shadow-subtle px-4 py-3 flex flex-wrap items-center justify-between gap-3">
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
                className="gap-2 shadow-card"
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                data-ocid="bulk_import.import_all.button"
              >
                <Users className="w-4 h-4" />
                Import{" "}
                {validCount > 0
                  ? `${validCount} Student${validCount === 1 ? "" : "s"}`
                  : ""}
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
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Class ID</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead className="hidden md:table-cell">DOB</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Roll No.
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow
                      key={row.rowNum}
                      className={
                        !row.valid
                          ? "bg-destructive/5 hover:bg-destructive/8"
                          : ""
                      }
                      data-ocid={`bulk_import.preview.item.${i + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-xs">
                        {row.rowNum}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.FirstName || (
                          <span className="text-destructive italic text-xs">
                            (missing)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.LastName || (
                          <span className="text-destructive italic text-xs">
                            (missing)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{row.ClassId || "–"}</TableCell>
                      <TableCell>{row.Section || "–"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {row.DateOfBirth || "–"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {row.RollNumber || "–"}
                      </TableCell>
                      <TableCell>
                        {row.valid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                            Valid
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/30">
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

      {/* ── Import Progress & Results ──────────────────────────────────────────── */}
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
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-display font-semibold text-foreground">
                    Importing students…
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
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
            <div className="bg-card rounded-xl border border-border shadow-subtle px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {successCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> {successCount} imported
                  </span>
                )}
                {failCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/30">
                    <XCircle className="w-3 h-3" /> {failCount} failed
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
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
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class / Section</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Roll No.
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((row, i) => (
                    <TableRow
                      key={row.rowNum}
                      data-ocid={`bulk_import.result.item.${i + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-xs">
                        {row.rowNum}
                      </TableCell>
                      <TableCell className="font-medium">
                        {`${row.FirstName} ${row.LastName}`.trim() ||
                          "(missing)"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.ClassId}
                        {row.Section ? `-${row.Section}` : ""}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {row.RollNumber || "–"}
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
