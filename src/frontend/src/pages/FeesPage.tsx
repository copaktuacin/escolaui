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
  TrendingDown,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type Invoice, mockInvoices } from "../lib/mockData";

type FilterTab = "all" | "paid" | "pending" | "overdue";

const statusBadge: Record<Invoice["status"], string> = {
  paid: "bg-success/10 text-success border-success/30",
  pending: "bg-warning/10 text-warning border-warning/30",
  overdue: "bg-destructive/10 text-destructive border-destructive/30",
};

type Concession = {
  id: string;
  student: string;
  discountType: string;
  amount: number;
  approvedBy: string;
};

const mockConcessions: Concession[] = [
  {
    id: "c1",
    student: "Adaeze Okonkwo",
    discountType: "Academic Scholarship",
    amount: 50000,
    approvedBy: "Dr. Adeyemi",
  },
  {
    id: "c2",
    student: "Kofi Mensah",
    discountType: "Sports Bursary",
    amount: 30000,
    approvedBy: "Mr. Bello",
  },
  {
    id: "c3",
    student: "Fatima Al-Hassan",
    discountType: "Sibling Discount",
    amount: 15000,
    approvedBy: "Dr. Adeyemi",
  },
  {
    id: "c4",
    student: "Chidi Obi",
    discountType: "Hardship Grant",
    amount: 40000,
    approvedBy: "Mrs. Okafor",
  },
];

export default function FeesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [invoiceFilter, setInvoiceFilter] = useState<FilterTab>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const filtered =
    invoiceFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === invoiceFilter);

  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
  const totalCollected = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  function openRecordDialog(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setRecordDialogOpen(true);
  }

  function confirmPayment() {
    if (!selectedInvoice) return;
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === selectedInvoice.id
          ? {
              ...inv,
              status: "paid",
              paidDate: new Date().toISOString().split("T")[0],
            }
          : inv,
      ),
    );
    toast.success(`Payment recorded for ${selectedInvoice.studentName}`, {
      description: `$${selectedInvoice.amount.toLocaleString()} – ${selectedInvoice.description}`,
    });
    setRecordDialogOpen(false);
    setSelectedInvoice(null);
  }

  function openPayNow(invoice: Invoice) {
    setPayInvoice(invoice);
    setPayDialogOpen(true);
  }

  function handleOnlinePayment() {
    if (!payInvoice) return;
    if (!cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      toast.error("Please fill in all card details");
      return;
    }
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === payInvoice.id
          ? {
              ...inv,
              status: "paid",
              paidDate: new Date().toISOString().split("T")[0],
            }
          : inv,
      ),
    );
    toast.success(
      `Online payment of $${payInvoice.amount.toLocaleString()} processed successfully`,
    );
    setPayDialogOpen(false);
    setPayInvoice(null);
    setCardNumber("");
    setExpiry("");
    setCvv("");
  }

  const statCards = [
    {
      label: "Total Billed",
      value: `$${totalBilled.toLocaleString()}`,
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Collected",
      value: `$${totalCollected.toLocaleString()}`,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Outstanding",
      value: `$${outstanding.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Overdue Invoices",
      value: overdueCount,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Fees &amp; Finance
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track invoices, record payments, and manage student fees
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="bg-card rounded-xl border border-border shadow-card p-4"
            data-ocid={`fees.${card.label
              .toLowerCase()
              .replace(/\s+/g, "_")
              .replace(/[^a-z0-9_]/g, "")}.card`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
              <div
                className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
              >
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
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
            className="bg-card rounded-xl border border-border shadow-card p-5"
          >
            <Tabs
              value={invoiceFilter}
              onValueChange={(v) => setInvoiceFilter(v as FilterTab)}
            >
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="font-semibold text-foreground">Invoices</h2>
                <TabsList data-ocid="fees.filter.tab">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                </TabsList>
              </div>

              {(["all", "paid", "pending", "overdue"] as FilterTab[]).map(
                (tab) => (
                  <TabsContent key={tab} value={tab}>
                    {filtered.length === 0 ? (
                      <div
                        className="text-center py-16 text-muted-foreground"
                        data-ocid="fees.empty_state"
                      >
                        <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No invoices found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table data-ocid="fees.table">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice ID</TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead className="hidden md:table-cell">
                                Grade
                              </TableHead>
                              <TableHead className="hidden lg:table-cell">
                                Description
                              </TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead className="hidden sm:table-cell">
                                Due Date
                              </TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filtered.map((inv, i) => (
                              <TableRow
                                key={inv.id}
                                data-ocid={`fees.item.${i + 1}`}
                              >
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                  {inv.id}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {inv.studentName}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                  {inv.grade}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                  {inv.description}
                                </TableCell>
                                <TableCell className="font-semibold">
                                  ${inv.amount.toLocaleString()}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                  {inv.dueDate}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`capitalize text-xs ${statusBadge[inv.status]}`}
                                  >
                                    {inv.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {inv.status === "paid" ? (
                                      <>
                                        <span className="text-xs text-muted-foreground mr-1">
                                          {inv.paidDate}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0"
                                          onClick={() =>
                                            toast.success(
                                              `Receipt downloaded for ${inv.studentName}`,
                                            )
                                          }
                                          data-ocid={`fees.receipt.${i + 1}.button`}
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-7"
                                          onClick={() => openPayNow(inv)}
                                          data-ocid={`fees.pay_now.${i + 1}.open_modal_button`}
                                        >
                                          Pay Now
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-xs h-7"
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
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                ),
              )}
            </Tabs>
          </motion.div>
        </TabsContent>

        {/* Concessions Tab */}
        <TabsContent value="concessions" className="mt-5">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">
                Discounts &amp; Scholarships
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Approved concessions and scholarship records
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="fees.concessions.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Discount Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockConcessions.map((c, i) => (
                    <TableRow
                      key={c.id}
                      data-ocid={`fees.concession.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">{c.student}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs bg-primary/10 text-primary border-primary/30"
                        >
                          {c.discountType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${c.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.approvedBy}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent data-ocid="fees.record_payment.dialog">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Confirm payment details for this invoice.
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Student Name</Label>
                <Input
                  value={selectedInvoice.studentName}
                  readOnly
                  className="bg-accent"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={selectedInvoice.description}
                  readOnly
                  className="bg-accent"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  value={`$${selectedInvoice.amount.toLocaleString()}`}
                  readOnly
                  className="bg-accent font-semibold"
                />
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
              data-ocid="fees.record_payment.confirm_button"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Online Payment Gateway Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent data-ocid="fees.pay_now.dialog">
          <DialogHeader>
            <DialogTitle>Online Payment</DialogTitle>
            <DialogDescription>
              {payInvoice &&
                `Pay $${payInvoice.amount.toLocaleString()} for ${payInvoice.studentName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Card Number</Label>
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                data-ocid="fees.card_number.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Expiry</Label>
                <Input
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  data-ocid="fees.expiry.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>CVV</Label>
                <Input
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="123"
                  maxLength={4}
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
              data-ocid="fees.pay_now.confirm_button"
            >
              <CreditCard className="w-4 h-4 mr-2" /> Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
