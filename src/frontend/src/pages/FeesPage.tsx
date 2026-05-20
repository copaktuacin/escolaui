import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  type Invoice,
  useFeeConcessions,
  useFeePayment,
  useFees,
} from "@/hooks/useQueries";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Eye,
  Gift,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type StatusFilter = "all" | "paid" | "unpaid" | "overdue" | "partial";
type PaymentMethod = "cash" | "cheque" | "online";

const STATUS_META: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  paid: {
    label: "Paid",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  unpaid: {
    label: "Unpaid",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  overdue: {
    label: "Overdue",
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  partial: {
    label: "Partial",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online Transfer" },
];

export default function FeesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Record payment form state
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordStudentId, setRecordStudentId] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [recordMethod, setRecordMethod] = useState<PaymentMethod>("cash");

  // View invoice dialog
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const feesQuery = useFees({ page, limit: 20, search });
  const concessionsQuery = useFeeConcessions();
  const payMutation = useFeePayment();

  const allInvoices = feesQuery.data?.data ?? [];
  const totalInvoices = feesQuery.data?.total ?? 0;

  // Filter client-side by status (status filter may also be passed to API via search params in future)
  const filtered =
    statusFilter === "all"
      ? allInvoices
      : allInvoices.filter((inv) => inv.status === statusFilter);

  // Summary stats — all derived from API response, no hardcoded numbers
  const totalBilled = allInvoices.reduce((s, i) => s + (i.amount ?? 0), 0);
  const totalCollected = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amount ?? 0), 0);
  const outstanding = allInvoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + (i.amount ?? 0), 0);
  const overdueAmt = allInvoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + (i.amount ?? 0), 0);
  const overdueCount = allInvoices.filter((i) => i.status === "overdue").length;
  const collectionRate =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const fmtAmt = (n: number) => `₦${n.toLocaleString()}`;

  const statCards = [
    {
      label: "Total Collected",
      value: feesQuery.isLoading ? null : fmtAmt(totalCollected),
      sub: `${collectionRate}% collection rate`,
      icon: TrendingUp,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      accent: "border-l-emerald-500",
      barColor: "bg-emerald-500",
      barPct: collectionRate,
      ocid: "fees.collected.card",
    },
    {
      label: "Outstanding",
      value: feesQuery.isLoading ? null : fmtAmt(outstanding),
      sub: `${allInvoices.filter((i) => i.status === "pending" || i.status === "unpaid").length} invoices pending`,
      icon: DollarSign,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      accent: "border-l-amber-500",
      barColor: "bg-amber-500",
      barPct:
        totalBilled > 0 ? Math.round((outstanding / totalBilled) * 100) : 0,
      ocid: "fees.outstanding.card",
    },
    {
      label: "Overdue Amount",
      value: feesQuery.isLoading ? null : fmtAmt(overdueAmt),
      sub: `${overdueCount} overdue invoices`,
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      accent: "border-l-red-500",
      barColor: "bg-red-500",
      barPct:
        totalBilled > 0 ? Math.round((overdueAmt / totalBilled) * 100) : 0,
      ocid: "fees.overdue.card",
    },
    {
      label: "Total Billed",
      value: feesQuery.isLoading ? null : fmtAmt(totalBilled),
      sub: `${totalInvoices || allInvoices.length} total invoices`,
      icon: TrendingDown,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      accent: "border-l-blue-500",
      barColor: "bg-blue-500",
      barPct: 100,
      ocid: "fees.total_billed.card",
    },
  ];

  async function handleRecordPayment() {
    if (!recordStudentId.trim()) {
      toast.error("Student ID is required");
      return;
    }
    if (!recordAmount || Number(recordAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await payMutation.mutateAsync({
        StudentId: recordStudentId,
        Amount: Number(recordAmount),
        PaymentDate: recordDate,
        PaymentMethod: recordMethod,
      });
      toast.success("Payment recorded successfully");
      setRecordOpen(false);
      setRecordStudentId("");
      setRecordAmount("");
      setRecordDate(new Date().toISOString().split("T")[0]);
      setRecordMethod("cash");
    } catch (e) {
      toast.error(`Payment failed: ${(e as Error).message}`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
            Fees &amp; Finance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track invoices, record payments, and manage student fees
          </p>
        </div>
        <Button
          className="gap-2 self-start sm:self-auto"
          style={{ background: "var(--color-primary)" }}
          onClick={() => setRecordOpen(true)}
          data-ocid="fees.record_payment.open_modal_button"
        >
          <CreditCard className="w-4 h-4" /> Record Payment
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i, duration: 0.4 }}
            className={`card-premium bg-card rounded-2xl border border-border shadow-card p-5 border-l-4 ${card.accent} relative overflow-hidden`}
            data-ocid={card.ocid}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/10 pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </p>
                  {card.value == null ? (
                    <Skeleton className="h-8 w-28 mt-1.5" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground mt-1 font-display">
                      {card.value}
                    </p>
                  )}
                </div>
                <div
                  className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{card.sub}</p>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${card.barPct}%` }}
                  transition={{
                    delay: 0.3 + 0.07 * i,
                    duration: 0.7,
                    ease: "easeOut",
                  }}
                  className={`h-full rounded-full ${card.barColor}`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="invoices">
        <TabsList data-ocid="fees.main.tab">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="concessions">Concessions</TabsTrigger>
        </TabsList>

        {/* ─── Invoices Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="invoices" className="mt-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-border bg-muted/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-9 h-9 input-premium bg-background"
                    placeholder="Search student or invoice…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    data-ocid="fees.search.input"
                  />
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  {(
                    [
                      "all",
                      "paid",
                      "unpaid",
                      "overdue",
                      "partial",
                    ] as StatusFilter[]
                  ).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setStatusFilter(tab);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150 ${
                        statusFilter === tab
                          ? "bg-primary text-primary-foreground shadow-card"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      data-ocid={`fees.filter.${tab}.tab`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table / States */}
            {feesQuery.isLoading ? (
              <div className="p-5 space-y-3" data-ocid="fees.loading_state">
                {["r1", "r2", "r3", "r4", "r5"].map((k) => (
                  <div key={k} className="flex gap-4 items-center">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-4 w-20 rounded flex-1" />
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : feesQuery.error ? (
              <div
                className="py-16 text-center text-muted-foreground"
                data-ocid="fees.error_state"
              >
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Failed to load invoices</p>
                <p className="text-sm mt-1">
                  {(feesQuery.error as Error).message}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="py-20 text-center text-muted-foreground"
                data-ocid="fees.empty_state"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 opacity-30" />
                </div>
                <p className="font-semibold text-base">No invoices found</p>
                <p className="text-sm mt-1 opacity-70">
                  {search
                    ? "Try adjusting your search"
                    : "No fee invoices have been created yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="fees.table">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3">
                        Invoice #
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3">
                        Student
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3 hidden md:table-cell">
                        Class
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3 hidden lg:table-cell">
                        Fee Type
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3 text-right">
                        Amount
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3 hidden sm:table-cell">
                        Due Date
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3">
                        Status
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv, i) => {
                      const meta =
                        STATUS_META[inv.status] ?? STATUS_META.pending;
                      return (
                        <TableRow
                          key={inv.id}
                          className="table-row-hover stagger-item border-b border-border/60 last:border-0"
                          data-ocid={`fees.item.${i + 1}`}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground py-3.5">
                            {inv.id}
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">
                                  {inv.studentName?.charAt(0) ?? "?"}
                                </span>
                              </div>
                              <span className="font-semibold text-sm text-foreground">
                                {inv.studentName ?? "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-3.5">
                            {inv.grade ?? "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground py-3.5">
                            {inv.description ?? "-"}
                          </TableCell>
                          <TableCell className="py-3.5 text-right">
                            <span className="font-bold text-foreground">
                              {inv.amount != null ? fmtAmt(inv.amount) : "-"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground py-3.5">
                            {inv.dueDate ?? "-"}
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span
                              className={`badge-premium inline-flex items-center gap-1.5 ${meta.badge}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                              />
                              {meta.label}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                                onClick={() => setViewInvoice(inv)}
                                data-ocid={`fees.view.${i + 1}.open_modal_button`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Footer / Pagination */}
            {!feesQuery.isLoading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {filtered.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {totalInvoices || allInvoices.length}
                  </span>{" "}
                  invoices
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-7 px-3 text-xs"
                    data-ocid="fees.pagination_prev"
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={allInvoices.length < 20}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-7 px-3 text-xs"
                    data-ocid="fees.pagination_next"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ─── Concessions Tab ──────────────────────────────────────────────── */}
        <TabsContent value="concessions" className="mt-5">
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/20">
              <h2 className="font-semibold text-foreground font-display">
                Discounts &amp; Scholarships
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Approved concessions and scholarship records
              </p>
            </div>

            {concessionsQuery.isLoading ? (
              <div className="p-5 space-y-3">
                {["c1", "c2", "c3"].map((k) => (
                  <div key={k} className="flex gap-4">
                    <Skeleton className="h-6 w-32 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : concessionsQuery.error ? (
              <div
                className="py-12 text-center text-muted-foreground"
                data-ocid="fees.concessions.error_state"
              >
                <p className="font-medium">Failed to load concessions</p>
                <p className="text-sm mt-1">
                  {(concessionsQuery.error as Error).message}
                </p>
              </div>
            ) : (concessionsQuery.data ?? []).length === 0 ? (
              <div
                className="py-16 text-center text-muted-foreground"
                data-ocid="fees.concessions.empty_state"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
                  <Gift className="w-7 h-7 opacity-30" />
                </div>
                <p className="font-semibold">No concessions found</p>
                <p className="text-sm mt-1 opacity-70">
                  Fee concessions and scholarships will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="fees.concessions.table">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                        Student Name
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                        Concession Type
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">
                        Amount / %
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(concessionsQuery.data ?? []).map((c, i) => {
                      const raw = c as unknown as Record<string, unknown>;
                      const studentName =
                        (raw.studentName as string | undefined) ??
                        (raw.StudentName as string | undefined) ??
                        "-";
                      const amount =
                        (raw.amount as number | undefined) ??
                        (raw.Amount as number | undefined);
                      const pct =
                        (raw.percentage as number | undefined) ?? c.percentage;
                      return (
                        <TableRow
                          key={c.id}
                          className="table-row-hover stagger-item"
                          data-ocid={`fees.concession.item.${i + 1}`}
                        >
                          <TableCell className="text-sm font-medium">
                            {studentName}
                          </TableCell>
                          <TableCell>
                            <span className="badge-premium bg-primary/10 text-primary border-primary/30">
                              {c.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {amount != null
                              ? fmtAmt(amount)
                              : pct != null
                                ? `${pct}%`
                                : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Record Payment Dialog ─────────────────────────────────────────── */}
      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent
          className="glass-elevated rounded-2xl max-w-md"
          data-ocid="fees.record_payment.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Record Payment</DialogTitle>
            <DialogDescription>
              Enter the payment details to record a fee collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Student ID *
              </Label>
              <Input
                value={recordStudentId}
                onChange={(e) => setRecordStudentId(e.target.value)}
                placeholder="Enter student ID or enrollment number"
                className="input-premium"
                data-ocid="fees.student_id.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount *
              </Label>
              <Input
                type="number"
                min="1"
                value={recordAmount}
                onChange={(e) => setRecordAmount(e.target.value)}
                placeholder="Enter amount"
                className="input-premium"
                data-ocid="fees.amount.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Date
              </Label>
              <Input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="input-premium"
                data-ocid="fees.payment_date.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Method
              </Label>
              <Select
                value={recordMethod}
                onValueChange={(v) => setRecordMethod(v as PaymentMethod)}
              >
                <SelectTrigger
                  className="input-premium"
                  data-ocid="fees.payment_method.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecordOpen(false)}
              data-ocid="fees.record_payment.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={payMutation.isPending}
              style={{ background: "var(--color-primary)" }}
              data-ocid="fees.record_payment.confirm_button"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {payMutation.isPending ? "Processing…" : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View Invoice Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={!!viewInvoice}
        onOpenChange={(o) => !o && setViewInvoice(null)}
      >
        <DialogContent
          className="max-w-md glass-elevated"
          data-ocid="fees.view_invoice.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Invoice Details</DialogTitle>
            <DialogDescription>
              Full breakdown for invoice {viewInvoice?.id}
            </DialogDescription>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Student
                    </p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {viewInvoice.studentName ?? "-"}
                    </p>
                  </div>
                  <span
                    className={`badge-premium ${(STATUS_META[viewInvoice.status] ?? STATUS_META.pending).badge}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${(STATUS_META[viewInvoice.status] ?? STATUS_META.pending).dot}`}
                    />
                    {
                      (STATUS_META[viewInvoice.status] ?? STATUS_META.pending)
                        .label
                    }
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Class
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {viewInvoice.grade ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Due Date
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {viewInvoice.dueDate ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Fee Type
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {viewInvoice.description ?? "-"}
                    </p>
                  </div>
                  {viewInvoice.paidDate && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Paid On
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {viewInvoice.paidDate}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="font-semibold text-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary font-display">
                  {viewInvoice.amount != null
                    ? fmtAmt(viewInvoice.amount)
                    : "-"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewInvoice(null)}
              data-ocid="fees.view_invoice.close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
