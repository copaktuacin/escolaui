import { Badge } from "@/components/ui/badge";
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
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useConcessions,
  useInvoices,
  usePayInvoice,
} from "../hooks/useQueries";
import type { Invoice } from "../lib/mockData";

type FilterTab = "all" | "paid" | "pending" | "overdue";

const STATUS_META: Record<
  Invoice["status"],
  { label: string; badge: string; dot: string }
> = {
  paid: {
    label: "Paid",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700",
    dot: "bg-amber-500",
  },
  overdue: {
    label: "Overdue",
    badge:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700",
    dot: "bg-red-500",
  },
};

const CLASS_OPTIONS = ["All", "6", "7", "8", "9", "10", "11", "12"];

export default function FeesPage() {
  const [invoiceFilter, setInvoiceFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [localPaidIds, setLocalPaidIds] = useState<Set<string>>(new Set());
  const [localPaidDates, setLocalPaidDates] = useState<Record<string, string>>(
    {},
  );

  const invoicesQuery = useInvoices({ status: invoiceFilter, limit: 50 });
  const concessionsQuery = useConcessions();
  const payMutation = usePayInvoice();

  useEffect(() => {
    if (invoicesQuery.error)
      toast.error(
        `Failed to load invoices: ${(invoicesQuery.error as Error).message}`,
      );
  }, [invoicesQuery.error]);

  const allInvoices = invoicesQuery.data?.data ?? [];

  const invoices = allInvoices.map((inv) =>
    localPaidIds.has(inv.id)
      ? {
          ...inv,
          status: "paid" as const,
          paidDate: localPaidDates[inv.id] ?? null,
        }
      : inv,
  );

  const byStatus =
    invoiceFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === invoiceFilter);

  const filtered = byStatus.filter((inv) => {
    const matchSearch =
      !search ||
      inv.studentName.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    const matchClass =
      classFilter === "All" || inv.grade?.includes(classFilter);
    return matchSearch && matchClass;
  });

  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
  const totalCollected = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const collectionRate =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  function openRecordDialog(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setRecordDialogOpen(true);
  }

  function openViewDialog(invoice: Invoice) {
    setViewInvoice(invoice);
    setViewDialogOpen(true);
  }

  async function confirmPayment() {
    if (!selectedInvoice) return;
    try {
      await payMutation.mutateAsync({
        id: selectedInvoice.id,
        payload: {
          amount: selectedInvoice.amount,
          method: "cash",
          transactionId: "",
        },
      });
      const today = new Date().toISOString().split("T")[0];
      setLocalPaidIds((prev) => new Set(prev).add(selectedInvoice.id));
      setLocalPaidDates((prev) => ({ ...prev, [selectedInvoice.id]: today }));
      toast.success(`Payment recorded for ${selectedInvoice.studentName}`, {
        description: `$${selectedInvoice.amount.toLocaleString()} – ${selectedInvoice.description}`,
      });
      setRecordDialogOpen(false);
      setSelectedInvoice(null);
    } catch (e) {
      toast.error(`Payment failed: ${(e as Error).message}`);
    }
  }

  function openPayNow(invoice: Invoice) {
    setPayInvoice(invoice);
    setPayDialogOpen(true);
  }

  async function handleOnlinePayment() {
    if (!payInvoice) return;
    if (!cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      toast.error("Please fill in all card details");
      return;
    }
    try {
      await payMutation.mutateAsync({
        id: payInvoice.id,
        payload: {
          amount: payInvoice.amount,
          method: "online",
          transactionId: `TXN-${Date.now()}`,
        },
      });
      const today = new Date().toISOString().split("T")[0];
      setLocalPaidIds((prev) => new Set(prev).add(payInvoice.id));
      setLocalPaidDates((prev) => ({ ...prev, [payInvoice.id]: today }));
      toast.success(
        `Online payment of $${payInvoice.amount.toLocaleString()} processed successfully`,
      );
      setPayDialogOpen(false);
      setPayInvoice(null);
      setCardNumber("");
      setExpiry("");
      setCvv("");
    } catch (e) {
      toast.error(`Payment failed: ${(e as Error).message}`);
    }
  }

  const statCards = [
    {
      label: "Total Collected",
      value: `$${totalCollected.toLocaleString()}`,
      sub: `${collectionRate}% collection rate`,
      icon: TrendingUp,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      accent: "border-l-emerald-500",
      barColor: "bg-emerald-500",
      barWidth: `${collectionRate}%`,
      ocid: "fees.collected.card",
    },
    {
      label: "Outstanding",
      value: `$${outstanding.toLocaleString()}`,
      sub: `${invoices.filter((i) => i.status === "pending").length} invoices pending`,
      icon: DollarSign,
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      accent: "border-l-amber-500",
      barColor: "bg-amber-500",
      barWidth:
        totalBilled > 0
          ? `${Math.round((outstanding / totalBilled) * 100)}%`
          : "0%",
      ocid: "fees.outstanding.card",
    },
    {
      label: "Overdue Amount",
      value: `$${invoices
        .filter((i) => i.status === "overdue")
        .reduce((s, i) => s + i.amount, 0)
        .toLocaleString()}`,
      sub: `${overdueCount} overdue invoices`,
      icon: AlertTriangle,
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      accent: "border-l-red-500",
      barColor: "bg-red-500",
      barWidth:
        totalBilled > 0
          ? `${Math.round((invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0) / totalBilled) * 100)}%`
          : "0%",
      ocid: "fees.overdue.card",
    },
    {
      label: "Total Billed",
      value: `$${totalBilled.toLocaleString()}`,
      sub: `${invoices.length} total invoices`,
      icon: TrendingDown,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      accent: "border-l-blue-500",
      barColor: "bg-blue-500",
      barWidth: "100%",
      ocid: "fees.total_billed.card",
    },
  ];

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
          variant="outline"
          size="sm"
          className="gap-2 self-start sm:self-auto"
          onClick={() => toast.success("Exporting fee records…")}
          data-ocid="fees.export.button"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Premium Stat Cards */}
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
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/10 pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </p>
                  {invoicesQuery.isLoading ? (
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
              {/* Progress bar */}
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: card.barWidth }}
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

        {/* Invoices Tab */}
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
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-9 h-9 input-premium bg-background"
                    placeholder="Search student or invoice…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-ocid="fees.search.input"
                  />
                </div>
                {/* Class filter */}
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger
                    className="w-32 h-9 bg-background"
                    data-ocid="fees.class.select"
                  >
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === "All" ? "All Classes" : `Class ${c}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Status filter tabs */}
                <div className="flex items-center gap-1 ml-auto">
                  {(["all", "paid", "pending", "overdue"] as FilterTab[]).map(
                    (tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setInvoiceFilter(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150 ${
                          invoiceFilter === tab
                            ? "bg-primary text-primary-foreground shadow-card"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                        data-ocid={`fees.filter.${tab}.tab`}
                      >
                        {tab}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            {invoicesQuery.isLoading ? (
              <div className="p-5 space-y-3" data-ocid="fees.loading_state">
                {(["r1", "r2", "r3", "r4", "r5", "r6"] as const).map((k) => (
                  <div key={k} className="flex gap-4 items-center">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-4 w-20 rounded flex-1" />
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="text-center py-20 text-muted-foreground"
                data-ocid="fees.empty_state"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 opacity-30" />
                </div>
                <p className="font-semibold text-base">No invoices found</p>
                <p className="text-sm mt-1 opacity-70">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="fees.table">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3">
                        Invoice ID
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
                      const meta = STATUS_META[inv.status];
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
                                  {inv.studentName.charAt(0)}
                                </span>
                              </div>
                              <span className="font-semibold text-sm text-foreground">
                                {inv.studentName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-3.5">
                            {inv.grade}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground py-3.5">
                            {inv.description}
                          </TableCell>
                          <TableCell className="py-3.5 text-right">
                            <span className="font-bold text-foreground">
                              ${inv.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground py-3.5">
                            {inv.dueDate}
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
                                onClick={() => openViewDialog(inv)}
                                data-ocid={`fees.view.${i + 1}.open_modal_button`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {inv.status === "paid" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 hover:bg-emerald-50 hover:text-emerald-600"
                                  onClick={() =>
                                    toast.success(
                                      `Receipt downloaded for ${inv.studentName}`,
                                    )
                                  }
                                  data-ocid={`fees.receipt.${i + 1}.button`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-3 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-colors"
                                    onClick={() => openPayNow(inv)}
                                    data-ocid={`fees.pay_now.${i + 1}.open_modal_button`}
                                  >
                                    Pay Now
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-7 px-3 hover:bg-muted"
                                    onClick={() => openRecordDialog(inv)}
                                    data-ocid={`fees.record.${i + 1}.open_modal_button`}
                                  >
                                    Record
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Footer */}
            {!invoicesQuery.isLoading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {filtered.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {invoices.length}
                  </span>{" "}
                  invoices
                </p>
                <p className="text-xs text-muted-foreground">
                  Total:{" "}
                  <span className="font-bold text-foreground">
                    $
                    {filtered
                      .reduce((s, i) => s + i.amount, 0)
                      .toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Concessions Tab */}
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
                {(["c1", "c2", "c3", "c4"] as const).map((k) => (
                  <div key={k} className="flex gap-4">
                    <Skeleton className="h-6 w-32 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="fees.concessions.table">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                        Type
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                        Percentage
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(concessionsQuery.data ?? []).map((c, i) => (
                      <TableRow
                        key={c.id}
                        className="table-row-hover stagger-item"
                        data-ocid={`fees.concession.item.${i + 1}`}
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="badge-premium bg-primary/10 text-primary border-primary/30"
                          >
                            {c.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-foreground">
                          {c.percentage}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
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
                      {viewInvoice.studentName}
                    </p>
                  </div>
                  <span
                    className={`badge-premium ${STATUS_META[viewInvoice.status].badge}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_META[viewInvoice.status].dot}`}
                    />
                    {STATUS_META[viewInvoice.status].label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Class
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {viewInvoice.grade}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Due Date
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {viewInvoice.dueDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Fee Type
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {viewInvoice.description}
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
                  ${viewInvoice.amount.toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              data-ocid="fees.view_invoice.close_button"
            >
              Close
            </Button>
            {viewInvoice && viewInvoice.status !== "paid" && (
              <Button
                onClick={() => {
                  setViewDialogOpen(false);
                  openPayNow(viewInvoice);
                }}
                data-ocid="fees.view_invoice.pay_button"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent
          className="glass-elevated"
          data-ocid="fees.record_payment.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Record Payment</DialogTitle>
            <DialogDescription>
              Confirm cash payment details for this invoice.
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-muted/30 p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-semibold">
                    {selectedInvoice.studentName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Description</span>
                  <span className="font-medium">
                    {selectedInvoice.description}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-border/60 pt-2">
                  <span className="text-muted-foreground font-semibold">
                    Amount
                  </span>
                  <span className="text-lg font-bold text-primary font-display">
                    ${selectedInvoice.amount.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment Method
                </Label>
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium">
                  Cash Payment
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecordDialogOpen(false)}
              data-ocid="fees.record_payment.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPayment}
              disabled={payMutation.isPending}
              className="btn-school-primary"
              data-ocid="fees.record_payment.confirm_button"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {payMutation.isPending ? "Processing…" : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Online Payment Gateway Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent
          className="glass-elevated"
          data-ocid="fees.pay_now.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Online Payment</DialogTitle>
            <DialogDescription>
              {payInvoice &&
                `Pay $${payInvoice.amount.toLocaleString()} for ${payInvoice.studentName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {payInvoice && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Invoice Total</p>
                <p className="text-xl font-bold text-primary font-display">
                  ${payInvoice.amount.toLocaleString()}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Card Number
              </Label>
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="input-premium"
                data-ocid="fees.card_number.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Expiry
                </Label>
                <Input
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="input-premium"
                  data-ocid="fees.expiry.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  CVV
                </Label>
                <Input
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="123"
                  maxLength={4}
                  className="input-premium"
                  data-ocid="fees.cvv.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayDialogOpen(false)}
              data-ocid="fees.pay_now.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleOnlinePayment}
              disabled={payMutation.isPending}
              className="btn-school-primary"
              data-ocid="fees.pay_now.confirm_button"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {payMutation.isPending ? "Processing…" : "Pay Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
