import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type StaffDto,
  useHRPayroll,
  useHRStaff,
  usePayrollSlip,
} from "@/hooks/useQueries";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Printer,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH_IDX = new Date().getMonth();

function fmt(n: number | null | undefined): string {
  if (n == null || n === 0) return "-";
  return `₦${n.toLocaleString()}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const payStatusCls: Record<string, string> = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Processing: "bg-blue-50 text-blue-700 border-blue-200",
};

const staffStatusCls: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  on_leave: "bg-amber-50 text-amber-700 border-amber-200",
  inactive: "bg-muted text-muted-foreground border-border",
};

// ── Payslip Viewer ────────────────────────────────────────────────────────────

function PayslipViewer({
  staffId,
  onClose,
}: { staffId: string | number; onClose: () => void }) {
  const { data: slip, isLoading, error } = usePayrollSlip(staffId);

  const raw = slip as Record<string, unknown> | null | undefined;
  const get = (k: string, fallback = "-") =>
    (raw?.[k] as string | undefined) ??
    (raw?.[k.charAt(0).toUpperCase() + k.slice(1)] as string | undefined) ??
    fallback;
  const getNum = (k: string): number | null => {
    const v =
      (raw?.[k] as number | undefined) ??
      (raw?.[k.charAt(0).toUpperCase() + k.slice(1)] as number | undefined);
    return v ?? null;
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="glass-elevated rounded-2xl border border-border/60 shadow-modal max-w-lg"
        data-ocid="hr.payslip.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FileText
              className="w-5 h-5"
              style={{ color: "var(--color-primary)" }}
            />
            Pay Slip
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 py-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        )}

        {error && (
          <div
            className="py-8 text-center text-muted-foreground"
            data-ocid="hr.payslip.error_state"
          >
            <p className="font-medium">Could not load payslip</p>
            <p className="text-sm mt-1">{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && raw && (
          <div className="space-y-5">
            <div
              className="rounded-xl p-4 text-white"
              style={{ background: "var(--color-primary)" }}
            >
              <p className="text-lg font-display font-bold">
                {get("staffName") !== "-" ? get("staffName") : get("name")}
              </p>
              <p className="text-sm opacity-80">
                {get("position")} · {get("department")}
              </p>
              <p className="text-xs opacity-60 mt-1">
                Period: {get("period") !== "-" ? get("period") : get("month")}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Earnings
              </p>
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Basic Salary</span>
                  <span className="font-mono">
                    {fmt(getNum("basicSalary") ?? getNum("basic"))}
                  </span>
                </div>
                {getNum("housing") != null && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">
                      Housing Allowance
                    </span>
                    <span className="font-mono text-emerald-600">
                      +{fmt(getNum("housing"))}
                    </span>
                  </div>
                )}
                {getNum("transport") != null && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">
                      Transport Allowance
                    </span>
                    <span className="font-mono text-emerald-600">
                      +{fmt(getNum("transport"))}
                    </span>
                  </div>
                )}
                {getNum("allowances") != null && getNum("housing") == null && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">
                      Total Allowances
                    </span>
                    <span className="font-mono text-emerald-600">
                      +{fmt(getNum("allowances"))}
                    </span>
                  </div>
                )}
                {getNum("grossPay") != null && (
                  <div className="flex justify-between px-4 py-2.5 text-sm font-semibold bg-muted/20">
                    <span>Gross Pay</span>
                    <span className="font-mono">
                      {fmt(getNum("grossPay") ?? getNum("grossSalary"))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Deductions
              </p>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">
                    Total Deductions
                  </span>
                  <span className="font-mono text-red-600">
                    –{fmt(getNum("deductions") ?? getNum("totalDeductions"))}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl border-2 p-4 flex items-center justify-between"
              style={{ borderColor: "var(--color-primary)" }}
            >
              <span className="font-bold">Net Pay</span>
              <span
                className="text-2xl font-display font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                {fmt(getNum("netPay") ?? getNum("netSalary"))}
              </span>
            </div>
          </div>
        )}

        {!isLoading && !error && !raw && (
          <div
            className="py-8 text-center text-muted-foreground"
            data-ocid="hr.payslip.empty_state"
          >
            <p className="font-medium">No payslip data available</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="hr.payslip.close_button"
          >
            Close
          </Button>
          {raw && (
            <Button
              onClick={() => window.print()}
              style={{ background: "var(--color-primary)" }}
              data-ocid="hr.payslip.print_button"
            >
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HRPayrollPage() {
  const qc = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH_IDX);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [payslipStaffId, setPayslipStaffId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const staffQuery = useHRStaff({ page: 1, limit: 20 });
  const payrollQuery = useHRPayroll({ page: 1, limit: 20 });

  const staff: StaffDto[] = staffQuery.data ?? [];
  const payroll: StaffDto[] = payrollQuery.data ?? [];

  // Summary derived entirely from API data — no hardcoded numbers
  const totalPayroll = payroll.reduce((sum, s) => sum + (s.netSalary ?? 0), 0);
  const paidCount = payroll.filter((s) => s.payStatus === "Paid").length;
  const pendingCount = payroll.filter(
    (s) => s.payStatus === "Pending" || s.payStatus === "Processing",
  ).length;
  const paidTotal = payroll
    .filter((s) => s.payStatus === "Paid")
    .reduce((sum, s) => sum + (s.netSalary ?? 0), 0);
  const pendingTotal = payroll
    .filter((s) => s.payStatus !== "Paid")
    .reduce((sum, s) => sum + (s.netSalary ?? 0), 0);

  const summaryCards = [
    {
      label: "Total Payroll",
      value: totalPayroll ? fmt(totalPayroll) : "-",
      icon: Wallet,
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
      sub: `${MONTHS[selectedMonth]} ${selectedYear}`,
    },
    {
      label: "Paid",
      value: paidTotal ? fmt(paidTotal) : "-",
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      sub: `${paidCount} staff`,
    },
    {
      label: "Pending",
      value: pendingTotal ? fmt(pendingTotal) : "-",
      icon: Clock,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      sub: `${pendingCount} staff`,
    },
    {
      label: "Staff Count",
      value: String(staff.length || "-"),
      icon: Users,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      sub: `${staff.filter((s) => s.status === "active").length} active`,
    },
  ];

  const processAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/hr/payroll/process-all", {
        month: selectedMonth + 1,
        year: selectedYear,
      });
      if (!res.success)
        throw new Error(res.error ?? "Failed to process payroll");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-staff"] });
      qc.invalidateQueries({ queryKey: ["hr-payroll"] });
      setConfirmOpen(false);
      toast.success("Payroll processed", {
        description: `${MONTHS[selectedMonth]} ${selectedYear}`,
      });
    },
    onError: (e: Error) => {
      setConfirmOpen(false);
      toast.error(e.message);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-card"
            style={{ background: "var(--color-primary-light)" }}
          >
            <Banknote
              className="w-5 h-5"
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
              HR &amp; Payroll
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Staff records and payroll management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-subtle">
            <Select
              value={String(selectedMonth)}
              onValueChange={(v) => setSelectedMonth(Number(v))}
            >
              <SelectTrigger
                className="border-0 shadow-none h-7 w-32 p-0 text-sm font-medium"
                data-ocid="hr.month.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, idx) => (
                  <SelectItem key={m} value={String(idx)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(Number(v))}
            >
              <SelectTrigger
                className="border-0 shadow-none h-7 w-20 p-0 text-sm font-medium"
                data-ocid="hr.year.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="gap-2 btn-press shadow-card hover:shadow-elevated transition-smooth"
            style={{ background: "var(--color-primary)" }}
            onClick={() => setConfirmOpen(true)}
            data-ocid="hr.process_payroll.button"
          >
            <Banknote className="w-4 h-4" /> Process Payroll
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card-premium bg-card rounded-2xl border border-border shadow-card p-5 hover:shadow-elevated"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg}`}
              >
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
            {staffQuery.isLoading || payrollQuery.isLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <p className="text-2xl font-display font-bold text-foreground">
                {card.value}
              </p>
            )}
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
              {card.label}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="directory">
        <TabsList
          className="bg-muted/60 p-1 rounded-xl shadow-subtle"
          data-ocid="hr.tab"
        >
          <TabsTrigger
            value="directory"
            className="rounded-lg data-[state=active]:shadow-card"
          >
            Staff Directory
          </TabsTrigger>
          <TabsTrigger
            value="payroll"
            className="rounded-lg data-[state=active]:shadow-card"
          >
            Payroll
          </TabsTrigger>
        </TabsList>

        {/* ─── Staff Directory Tab ──────────────────────────────────────────── */}
        <TabsContent value="directory" className="mt-6">
          <div className="glass rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">
                Staff Directory
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {staffQuery.isLoading ? "Loading…" : `${staff.length} members`}
              </p>
            </div>

            {staffQuery.error && (
              <div
                className="p-8 text-center text-muted-foreground"
                data-ocid="hr.directory.error_state"
              >
                <p className="font-medium">Failed to load staff</p>
                <p className="text-sm mt-1">
                  {(staffQuery.error as Error).message}
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table data-ocid="hr.directory.table">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">
                      Employee Code
                    </TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">
                      Designation
                    </TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">
                      Department
                    </TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">
                      Join Date
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Payslip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffQuery.isLoading ? (
                    ["a", "b", "c", "d"].map((k) => (
                      <TableRow key={k}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-10 rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : staff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div
                          className="py-16 text-center text-muted-foreground"
                          data-ocid="hr.directory.empty_state"
                        >
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
                            <Users className="w-7 h-7 opacity-30" />
                          </div>
                          <p className="font-semibold">
                            No staff records found
                          </p>
                          <p className="text-sm mt-1 opacity-70">
                            Staff will appear here once added via the API
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    staff.map((s, i) => {
                      const empCode = (s as unknown as Record<string, unknown>)
                        .employeeCode as string | undefined;
                      return (
                        <TableRow
                          key={s.id}
                          className="stagger-item table-row-hover"
                          data-ocid={`hr.staff.item.${i + 1}`}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {empCode ?? "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-subtle flex-shrink-0"
                                style={{ background: "var(--color-primary)" }}
                              >
                                {initials(s.name)}
                              </div>
                              <span className="font-medium text-sm">
                                {s.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {s.position ?? s.role ?? "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {s.department ?? "-"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {s.joinDate ?? "-"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`badge-premium text-[10px] ${staffStatusCls[s.status] ?? "bg-muted text-muted-foreground border-border"}`}
                            >
                              {s.status.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2 gap-1 transition-fast"
                              onClick={() => setPayslipStaffId(s.id)}
                              data-ocid={`hr.view_slip.${i + 1}.button`}
                            >
                              <FileText className="w-3 h-3" /> Slip
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ─── Payroll Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="payroll" className="mt-6">
          <div className="glass rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">
                Payroll — {MONTHS[selectedMonth]} {selectedYear}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click "Slip" to view a staff member's payslip
              </p>
            </div>

            {payrollQuery.error && (
              <div
                className="p-8 text-center text-muted-foreground"
                data-ocid="hr.payroll.error_state"
              >
                <p className="font-medium">Failed to load payroll</p>
                <p className="text-sm mt-1">
                  {(payrollQuery.error as Error).message}
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table data-ocid="hr.payroll.table">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Staff Name</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">
                      Month
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Basic
                    </TableHead>
                    <TableHead className="text-right hidden lg:table-cell font-semibold">
                      Allowances
                    </TableHead>
                    <TableHead className="text-right hidden lg:table-cell font-semibold">
                      Deductions
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Net Pay
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollQuery.isLoading ? (
                    ["a", "b", "c", "d"].map((k) => (
                      <TableRow key={k}>
                        <TableCell colSpan={8}>
                          <Skeleton className="h-10 rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : payroll.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <div
                          className="py-16 text-center text-muted-foreground"
                          data-ocid="hr.payroll.empty_state"
                        >
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
                            <Banknote className="w-7 h-7 opacity-30" />
                          </div>
                          <p className="font-semibold">
                            No payroll records found
                          </p>
                          <p className="text-sm mt-1 opacity-70">
                            Payroll data for {MONTHS[selectedMonth]}{" "}
                            {selectedYear} will appear here once processed
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    payroll.map((s, i) => {
                      const psCls =
                        payStatusCls[s.payStatus ?? "Pending"] ??
                        payStatusCls.Pending;
                      const monthLabel = (
                        s as unknown as Record<string, unknown>
                      ).month as string | undefined;
                      return (
                        <TableRow
                          key={s.id}
                          className="stagger-item table-row-hover"
                          data-ocid={`hr.payroll.item.${i + 1}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-subtle flex-shrink-0"
                                style={{ background: "var(--color-primary)" }}
                              >
                                {initials(s.name)}
                              </div>
                              <span className="font-medium text-sm">
                                {s.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {monthLabel ??
                              `${MONTHS[selectedMonth]} ${selectedYear}`}
                          </TableCell>
                          <TableCell className="text-right text-sm font-mono">
                            {fmt(s.basicSalary)}
                          </TableCell>
                          <TableCell className="text-right hidden lg:table-cell text-sm font-mono text-emerald-600">
                            {s.allowances != null
                              ? `+${fmt(s.allowances)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right hidden lg:table-cell text-sm font-mono text-red-600">
                            {s.deductions != null
                              ? `–${fmt(s.deductions)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold font-mono">
                            {fmt(s.netSalary)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`badge-premium text-[10px] ${psCls}`}
                            >
                              {s.payStatus ?? "Pending"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2 gap-1 transition-fast"
                              onClick={() => setPayslipStaffId(s.id)}
                              data-ocid={`hr.view_slip.${i + 1}.button`}
                            >
                              <FileText className="w-3 h-3" /> Slip
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Process Payroll Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          className="glass-elevated rounded-2xl border border-border/60 shadow-modal max-w-md"
          data-ocid="hr.process_payroll.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Process Payroll
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Period</span>
                <span className="font-semibold">
                  {MONTHS[selectedMonth]} {selectedYear}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Staff Count</span>
                <span className="font-semibold">{payroll.length} members</span>
              </div>
              {totalPayroll > 0 && (
                <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                  <span className="font-semibold">Total Payroll</span>
                  <span
                    className="font-bold text-lg"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {fmt(totalPayroll)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              This will mark all pending staff salaries as paid for the selected
              period. This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="transition-fast"
              data-ocid="hr.process_payroll.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => processAllMutation.mutate()}
              disabled={processAllMutation.isPending}
              className="gap-2 btn-press"
              style={{ background: "var(--color-primary)" }}
              data-ocid="hr.process_payroll.confirm_button"
            >
              {processAllMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirm &amp; Process
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip Dialog */}
      {payslipStaffId && (
        <PayslipViewer
          staffId={payslipStaffId}
          onClose={() => setPayslipStaffId(null)}
        />
      )}
    </motion.div>
  );
}
