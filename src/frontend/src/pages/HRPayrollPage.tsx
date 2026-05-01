import { Badge } from "@/components/ui/badge";
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
import { api } from "@/lib/api";
import { isDemoMode } from "@/lib/demoMode";
import { withDelay } from "@/lib/mockData";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  PlusCircle,
  Printer,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type StaffRecord = {
  id: string;
  name: string;
  department: string;
  position?: string;
  role?: string;
  joinDate?: string;
  salary?: number;
  basicSalary?: number;
  allowances?: number;
  deductions?: number;
  netSalary?: number;
  payStatus?: "Paid" | "Pending" | "Processing";
  status: "active" | "on_leave" | "inactive";
};

type AttendanceMark = "P" | "A" | "L";

type PayrollResult = {
  baseSalary: number;
  deductions: number;
  bonuses: number;
  netPay: number;
};

const MOCK_STAFF: StaffRecord[] = [
  {
    id: "st1",
    name: "Dr. Samuel Adeyemi",
    department: "Administration",
    position: "Principal",
    joinDate: "2015-09-01",
    basicSalary: 250000,
    allowances: 75000,
    deductions: 32000,
    netSalary: 293000,
    payStatus: "Paid",
    status: "active",
  },
  {
    id: "st2",
    name: "Mrs. Grace Okafor",
    department: "Academics",
    position: "Senior Teacher",
    joinDate: "2018-01-15",
    basicSalary: 180000,
    allowances: 50000,
    deductions: 24000,
    netSalary: 206000,
    payStatus: "Paid",
    status: "active",
  },
  {
    id: "st3",
    name: "Mr. James Bello",
    department: "Finance",
    position: "Bursar",
    joinDate: "2019-03-01",
    basicSalary: 200000,
    allowances: 60000,
    deductions: 28000,
    netSalary: 232000,
    payStatus: "Pending",
    status: "active",
  },
  {
    id: "st4",
    name: "Ms. Ngozi Eze",
    department: "Academics",
    position: "Teacher",
    joinDate: "2021-09-01",
    basicSalary: 150000,
    allowances: 40000,
    deductions: 20000,
    netSalary: 170000,
    payStatus: "Processing",
    status: "on_leave",
  },
  {
    id: "st5",
    name: "Mr. Tunde Abiola",
    department: "Academics",
    position: "Teacher",
    joinDate: "2020-01-10",
    basicSalary: 155000,
    allowances: 42000,
    deductions: 21000,
    netSalary: 176000,
    payStatus: "Pending",
    status: "active",
  },
  {
    id: "st6",
    name: "Mrs. Amaka Chukwu",
    department: "Admin Support",
    position: "Secretary",
    joinDate: "2022-06-01",
    basicSalary: 130000,
    allowances: 35000,
    deductions: 18000,
    netSalary: 147000,
    payStatus: "Paid",
    status: "active",
  },
];

const MOCK_ATTENDANCE: Record<string, Record<number, AttendanceMark>> = {
  st1: {
    1: "P",
    2: "P",
    3: "P",
    4: "P",
    5: "P",
    6: "P",
    7: "P",
    8: "P",
    9: "P",
    10: "P",
  },
  st2: {
    1: "P",
    2: "P",
    3: "A",
    4: "P",
    5: "P",
    6: "P",
    7: "P",
    8: "P",
    9: "P",
    10: "P",
  },
  st3: {
    1: "P",
    2: "P",
    3: "P",
    4: "P",
    5: "A",
    6: "P",
    7: "P",
    8: "P",
    9: "P",
    10: "P",
  },
  st4: {
    1: "L",
    2: "L",
    3: "L",
    4: "L",
    5: "L",
    6: "L",
    7: "L",
    8: "L",
    9: "L",
    10: "L",
  },
  st5: {
    1: "P",
    2: "P",
    3: "P",
    4: "P",
    5: "P",
    6: "A",
    7: "P",
    8: "P",
    9: "P",
    10: "P",
  },
  st6: {
    1: "P",
    2: "P",
    3: "P",
    4: "P",
    5: "P",
    6: "P",
    7: "P",
    8: "P",
    9: "A",
    10: "P",
  },
};

const ATTEND_DISPLAY = Array.from({ length: 10 }, (_, i) => i + 1);

const statusBadge: Record<StaffRecord["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  on_leave: "bg-amber-50 text-amber-700 border-amber-200",
  inactive: "bg-muted text-muted-foreground border-border",
};

const payStatusConfig: Record<
  string,
  { label: string; cls: string; icon: React.FC<{ className?: string }> }
> = {
  Paid: {
    label: "Paid",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  Pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  Processing: {
    label: "Processing",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Loader2,
  },
};

const attendColor: Record<string, string> = {
  P: "bg-emerald-50 text-emerald-700",
  A: "bg-red-50 text-red-700",
  L: "bg-amber-50 text-amber-700",
};

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

function formatCurrency(n: number) {
  return `₦${n.toLocaleString()}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function useStaff() {
  return useQuery<StaffRecord[]>({
    queryKey: ["hr-staff"],
    queryFn: async () => {
      if (isDemoMode()) return withDelay(MOCK_STAFF);
      const res = await api.get<{ data: StaffRecord[] }>("/hr/staff?limit=50");
      if (!res.success) throw new Error(res.error ?? "Failed to load staff");
      const d = res.data;
      if (!d) return [];
      if ("data" in d) return d.data;
      return d as unknown as StaffRecord[];
    },
  });
}

function useStaffAttendance(staffId: string, month: number, year: number) {
  return useQuery<Record<number, AttendanceMark>>({
    queryKey: ["hr-attendance", staffId, month, year],
    queryFn: async () => {
      if (isDemoMode()) return withDelay(MOCK_ATTENDANCE[staffId] ?? {});
      const res = await api.get<{ date: string; status: string }[]>(
        `/hr/attendance?staffId=${staffId}&month=${month}&year=${year}`,
      );
      if (!res.success) return {};
      const records = res.data ?? [];
      return Object.fromEntries(
        records.map((r) => {
          const day = new Date(r.date).getDate();
          const mark: AttendanceMark =
            r.status === "present" ? "P" : r.status === "absent" ? "A" : "L";
          return [day, mark];
        }),
      );
    },
    enabled: !!staffId,
  });
}

type PayslipData = {
  staffName: string;
  position: string;
  department: string;
  period: string;
  basicSalary: number;
  housing: number;
  transport: number;
  grossPay: number;
  deductions: number;
  netPay: number;
};

export default function HRPayrollPage() {
  const qc = useQueryClient();
  const { data: staff = [], isLoading: staffLoading } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH_IDX);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [salary, setSalary] = useState({
    basic: 150000,
    housing: 30000,
    transport: 15000,
    deductions: 20000,
  });
  const [payrollResult, setPayrollResult] = useState<PayrollResult | null>(
    null,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null);
  const [newStaff, setNewStaff] = useState({
    name: "",
    department: "",
    position: "",
    salary: "",
  });

  const currentStaffId = selectedStaff || staff[0]?.id;
  const currentStaff = staff.find((s) => s.id === currentStaffId);
  const net =
    salary.basic + salary.housing + salary.transport - salary.deductions;

  const { data: attendanceData = {} } = useStaffAttendance(
    currentStaffId,
    selectedMonth + 1,
    selectedYear,
  );

  // Summary stats
  const totalPayroll = staff.reduce(
    (sum, s) => sum + (s.netSalary ?? 150000),
    0,
  );
  const paidCount = staff.filter((s) => s.payStatus === "Paid").length;
  const pendingCount = staff.filter(
    (s) => s.payStatus === "Pending" || s.payStatus === "Processing",
  ).length;

  const computeMutation = useMutation({
    mutationFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 700);
        return {
          baseSalary: salary.basic,
          deductions: salary.deductions,
          bonuses: salary.housing + salary.transport,
          netPay: net,
        };
      }
      const res = await api.post<PayrollResult>("/hr/payroll/compute", {
        staffId: currentStaffId,
        month: selectedMonth + 1,
        year: selectedYear,
      });
      if (!res.success)
        throw new Error(res.error ?? "Failed to compute payroll");
      return (
        res.data ?? {
          baseSalary: salary.basic,
          deductions: salary.deductions,
          bonuses: 0,
          netPay: net,
        }
      );
    },
    onSuccess: (data) => {
      if (data) setPayrollResult(data);
      toast.success("Payroll computed", {
        description: `Net pay: ${formatCurrency(data?.netPay ?? net)}`,
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payslipMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const s = staff.find((x) => x.id === staffId) ?? currentStaff;
      if (isDemoMode()) {
        await withDelay(null, 600);
        return {
          staffName: s?.name ?? "Staff Member",
          position: s?.position ?? "Staff",
          department: s?.department ?? "–",
          period: `${MONTHS[selectedMonth]} ${selectedYear}`,
          basicSalary: s?.basicSalary ?? salary.basic,
          housing: s?.allowances
            ? Math.floor(s.allowances * 0.6)
            : salary.housing,
          transport: s?.allowances
            ? Math.floor(s.allowances * 0.4)
            : salary.transport,
          grossPay:
            (s?.basicSalary ?? salary.basic) +
            (s?.allowances ?? salary.housing + salary.transport),
          deductions: s?.deductions ?? salary.deductions,
          netPay: s?.netSalary ?? net,
        };
      }
      const res = await api.post<{ payslipId: string; payslipUrl?: string }>(
        "/hr/payslips/generate",
        { staffId, month: selectedMonth + 1, year: selectedYear },
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to generate payslip");
      if (res.data?.payslipUrl) window.open(res.data.payslipUrl, "_blank");
      return null;
    },
    onSuccess: (data) => {
      if (data) {
        setPayslipData(data);
        setPayslipOpen(true);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const processAllMutation = useMutation({
    mutationFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 1200);
        return { processed: staff.length, total: totalPayroll };
      }
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
      setConfirmOpen(false);
      toast.success("Payroll processed", {
        description: `${MONTHS[selectedMonth]} ${selectedYear} — ${staff.length} staff members`,
      });
    },
    onError: (e: Error) => {
      setConfirmOpen(false);
      toast.error(e.message);
    },
  });

  const addStaffMutation = useMutation({
    mutationFn: async (payload: typeof newStaff) => {
      if (!payload.name.trim()) throw new Error("Staff name is required");
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { id: `st${Date.now()}`, ...payload, status: "active" as const };
      }
      const res = await api.post<StaffRecord>("/hr/staff", {
        name: payload.name,
        department: payload.department,
        salary: Number(payload.salary) || 0,
        joinDate: new Date().toISOString().split("T")[0],
      });
      if (!res.success) throw new Error(res.error ?? "Failed to add staff");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-staff"] });
      toast.success("Staff member added");
      setAddOpen(false);
      setNewStaff({ name: "", department: "", position: "", salary: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const summaryCards = [
    {
      label: "Total Payroll",
      value: formatCurrency(totalPayroll),
      icon: Wallet,
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
      sub: `${MONTHS[selectedMonth]} ${selectedYear}`,
    },
    {
      label: "Paid",
      value: formatCurrency(
        staff
          .filter((s) => s.payStatus === "Paid")
          .reduce((sum, s) => sum + (s.netSalary ?? 0), 0),
      ),
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      sub: `${paidCount} staff`,
    },
    {
      label: "Pending",
      value: formatCurrency(
        staff
          .filter((s) => s.payStatus !== "Paid")
          .reduce((sum, s) => sum + (s.netSalary ?? 0), 0),
      ),
      icon: Clock,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      sub: `${pendingCount} staff`,
    },
    {
      label: "Staff Count",
      value: String(staff.length),
      icon: Users,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      sub: `${staff.filter((s) => s.status === "active").length} active`,
    },
  ];

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
              Staff records, payroll computation and attendance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
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
            <Banknote className="w-4 h-4" />
            Process Payroll
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
            <p className="text-2xl font-display font-bold text-foreground">
              {card.value}
            </p>
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
          <TabsTrigger
            value="attendance"
            className="rounded-lg data-[state=active]:shadow-card"
          >
            Attendance
          </TabsTrigger>
        </TabsList>

        {/* Staff Directory */}
        <TabsContent value="directory" className="mt-6">
          <div className="glass rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  Staff Directory
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {staff.length} members
                </p>
              </div>
              <Button
                size="sm"
                className="gap-2 btn-press transition-smooth"
                style={{ background: "var(--color-primary)" }}
                onClick={() => setAddOpen(!addOpen)}
                data-ocid="hr.add_staff.button"
              >
                <PlusCircle className="w-4 h-4" /> Add Staff
              </Button>
            </div>

            {addOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-6 border-b border-border bg-muted/20 space-y-4"
              >
                <h3 className="text-sm font-semibold">New Staff Member</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Full Name *
                    </Label>
                    <Input
                      value={newStaff.name}
                      onChange={(e) =>
                        setNewStaff((s) => ({ ...s, name: e.target.value }))
                      }
                      placeholder="Dr. Jane Smith"
                      className="input-premium"
                      data-ocid="hr.staff_name.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Department
                    </Label>
                    <Input
                      value={newStaff.department}
                      onChange={(e) =>
                        setNewStaff((s) => ({
                          ...s,
                          department: e.target.value,
                        }))
                      }
                      placeholder="e.g. Academics"
                      className="input-premium"
                      data-ocid="hr.staff_dept.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Position
                    </Label>
                    <Input
                      value={newStaff.position}
                      onChange={(e) =>
                        setNewStaff((s) => ({ ...s, position: e.target.value }))
                      }
                      placeholder="e.g. Senior Teacher"
                      className="input-premium"
                      data-ocid="hr.staff_position.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Basic Salary (₦)
                    </Label>
                    <Input
                      type="number"
                      value={newStaff.salary}
                      onChange={(e) =>
                        setNewStaff((s) => ({ ...s, salary: e.target.value }))
                      }
                      placeholder="150000"
                      className="input-premium"
                      data-ocid="hr.staff_salary.input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddOpen(false)}
                    className="transition-fast"
                    data-ocid="hr.add_staff.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => addStaffMutation.mutate(newStaff)}
                    disabled={addStaffMutation.isPending}
                    className="btn-press"
                    style={{ background: "var(--color-primary)" }}
                    data-ocid="hr.add_staff.submit_button"
                  >
                    {addStaffMutation.isPending ? "Adding..." : "Add Staff"}
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="overflow-x-auto">
              <Table data-ocid="hr.directory.table">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Staff Name</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">
                      Department
                    </TableHead>
                    <TableHead className="font-semibold">Position</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">
                      Join Date
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffLoading
                    ? (["sa", "sb", "sc", "sd"] as const).map((k) => (
                        <TableRow key={`sk-${k}`}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-10 rounded-lg" />
                          </TableCell>
                        </TableRow>
                      ))
                    : staff.map((s, i) => (
                        <TableRow
                          key={s.id}
                          className="stagger-item table-row-hover"
                          data-ocid={`hr.staff.item.${i + 1}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-subtle flex-shrink-0"
                                style={{ background: "var(--color-primary)" }}
                              >
                                {getInitials(s.name)}
                              </div>
                              <span className="font-medium text-sm">
                                {s.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {s.department}
                          </TableCell>
                          <TableCell className="text-sm">
                            {s.position ?? s.role ?? "–"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {s.joinDate ?? "–"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`badge-premium text-[10px] ${statusBadge[s.status]}`}
                            >
                              {s.status.replace("_", " ")}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Payroll Table + Computation */}
        <TabsContent value="payroll" className="mt-6 space-y-6">
          {/* Payroll Table */}
          <div className="glass rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">
                Payroll — {MONTHS[selectedMonth]} {selectedYear}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click "View Slip" to generate payslip for any staff member
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="hr.payroll.table">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Staff Name</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">
                      Role
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
                      Net Salary
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffLoading
                    ? (["pa", "pb", "pc", "pd"] as const).map((k) => (
                        <TableRow key={`sk-${k}`}>
                          <TableCell colSpan={8}>
                            <Skeleton className="h-10 rounded-lg" />
                          </TableCell>
                        </TableRow>
                      ))
                    : staff.map((s, i) => {
                        const ps = payStatusConfig[s.payStatus ?? "Pending"];
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
                                  {getInitials(s.name)}
                                </div>
                                <span className="font-medium text-sm">
                                  {s.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="badge-premium text-[10px] bg-muted text-muted-foreground border-border">
                                {s.position ?? "Staff"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm font-mono">
                              {formatCurrency(s.basicSalary ?? 150000)}
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell text-sm font-mono text-emerald-600">
                              +{formatCurrency(s.allowances ?? 45000)}
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell text-sm font-mono text-red-600">
                              -{formatCurrency(s.deductions ?? 20000)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-bold font-mono">
                              {formatCurrency(s.netSalary ?? 175000)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`badge-premium text-[10px] flex items-center gap-1 w-fit ${ps.cls}`}
                              >
                                <ps.icon className="w-3 h-3" />
                                {ps.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {s.payStatus !== "Paid" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs px-2 transition-fast hover:shadow-card"
                                    style={{
                                      color: "var(--color-primary)",
                                      borderColor: "var(--color-primary-light)",
                                    }}
                                    data-ocid={`hr.pay.${i + 1}.button`}
                                  >
                                    Pay
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs px-2 gap-1 transition-fast"
                                  onClick={() => payslipMutation.mutate(s.id)}
                                  disabled={payslipMutation.isPending}
                                  data-ocid={`hr.view_slip.${i + 1}.button`}
                                >
                                  <FileText className="w-3 h-3" />
                                  Slip
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Salary Computation */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5 hover:shadow-elevated transition-smooth">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--color-primary-light)" }}
                >
                  <Banknote
                    className="w-4 h-4"
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-foreground">
                    Salary Computation
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {MONTHS[selectedMonth]} {selectedYear}
                  </p>
                </div>
              </div>
              {staffLoading ? (
                <Skeleton className="h-10" />
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Staff Member
                  </Label>
                  <Select
                    value={currentStaffId}
                    onValueChange={setSelectedStaff}
                  >
                    <SelectTrigger
                      className="input-premium"
                      data-ocid="hr.payroll_staff.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {(
                  [
                    {
                      key: "basic" as const,
                      label: "Basic Pay",
                      color: "",
                      prefix: "₦",
                    },
                    {
                      key: "housing" as const,
                      label: "Housing Allowance",
                      color: "text-emerald-600",
                      prefix: "₦",
                    },
                    {
                      key: "transport" as const,
                      label: "Transport Allowance",
                      color: "text-emerald-600",
                      prefix: "₦",
                    },
                    {
                      key: "deductions" as const,
                      label: "Deductions",
                      color: "text-red-600",
                      prefix: "–₦",
                    },
                  ] as const
                ).map(({ key, label, color }) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-fast"
                  >
                    <Label
                      className={`text-xs font-medium w-36 flex-shrink-0 ${color || "text-muted-foreground"}`}
                    >
                      {label}
                    </Label>
                    <Input
                      type="number"
                      value={salary[key]}
                      onChange={(e) =>
                        setSalary((s) => ({
                          ...s,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-sm border-0 shadow-none font-mono focus-visible:ring-0 bg-transparent text-right"
                      data-ocid={`hr.${key}.input`}
                    />
                  </div>
                ))}
              </div>
              <Button
                className="w-full gap-2 btn-press transition-smooth"
                variant="outline"
                style={{
                  borderColor: "var(--color-primary)",
                  color: "var(--color-primary)",
                }}
                onClick={() => computeMutation.mutate()}
                disabled={computeMutation.isPending}
                data-ocid="hr.compute_payroll.button"
              >
                {computeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Computing...
                  </>
                ) : (
                  <>
                    <Banknote className="w-4 h-4" /> Compute Payroll
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <motion.div
                className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-elevated transition-smooth"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Net Pay
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {currentStaff?.payStatus ?? "Pending"}
                  </Badge>
                </div>
                <p
                  className="text-4xl font-display font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  {formatCurrency(payrollResult?.netPay ?? net)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentStaff?.name}
                </p>
                <div className="mt-5 rounded-xl bg-muted/40 overflow-hidden divide-y divide-border/50">
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Basic Pay</span>
                    <span className="font-mono">
                      {formatCurrency(salary.basic)}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Allowances</span>
                    <span className="font-mono text-emerald-600">
                      +{formatCurrency(salary.housing + salary.transport)}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Deductions</span>
                    <span className="font-mono text-red-600">
                      –{formatCurrency(salary.deductions)}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm font-bold border-t-2">
                    <span>Net Pay</span>
                    <span className="font-mono">{formatCurrency(net)}</span>
                  </div>
                </div>
              </motion.div>
              <Button
                className="w-full gap-2 btn-press shadow-card hover:shadow-elevated transition-smooth"
                style={{ background: "var(--color-primary)" }}
                onClick={() => payslipMutation.mutate(currentStaffId)}
                disabled={payslipMutation.isPending}
                data-ocid="hr.generate_payslip.button"
              >
                {payslipMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Generate Payslip
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-6">
          <div className="glass rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  Staff Attendance — {MONTHS[selectedMonth]} {selectedYear}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Days 1–10 ·{" "}
                  <span className="text-emerald-600 font-semibold">P</span> =
                  Present, <span className="text-red-600 font-semibold">A</span>{" "}
                  = Absent,{" "}
                  <span className="text-amber-600 font-semibold">L</span> =
                  Leave
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="hr.attendance.table">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Name</TableHead>
                    {ATTEND_DISPLAY.map((d) => (
                      <TableHead
                        key={d}
                        className="text-center w-10 font-semibold"
                      >
                        {d}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffLoading
                    ? (["aa", "ab", "ac"] as const).map((k) => (
                        <TableRow key={`sk-${k}`}>
                          <TableCell colSpan={11}>
                            <Skeleton className="h-10 rounded-lg" />
                          </TableCell>
                        </TableRow>
                      ))
                    : staff.map((s, i) => (
                        <TableRow
                          key={s.id}
                          className="stagger-item table-row-hover"
                          data-ocid={`hr.attendance.item.${i + 1}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: "var(--color-primary)" }}
                              >
                                {getInitials(s.name)}
                              </div>
                              <span className="font-medium text-sm whitespace-nowrap">
                                {s.name}
                              </span>
                            </div>
                          </TableCell>
                          {ATTEND_DISPLAY.map((d) => {
                            const mark: AttendanceMark =
                              (s.id === currentStaffId
                                ? attendanceData[d]
                                : MOCK_ATTENDANCE[s.id]?.[d]) ?? "P";
                            return (
                              <TableCell key={d} className="text-center p-1">
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold transition-fast ${attendColor[mark]}`}
                                >
                                  {mark}
                                </span>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
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
                <span className="font-semibold">{staff.length} members</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                <span className="font-semibold">Total Payroll</span>
                <span
                  className="font-bold text-lg"
                  style={{ color: "var(--color-primary)" }}
                >
                  {formatCurrency(totalPayroll)}
                </span>
              </div>
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
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Process
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip Dialog */}
      <Dialog open={payslipOpen} onOpenChange={setPayslipOpen}>
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
          {payslipData && (
            <div className="space-y-5">
              {/* Header */}
              <div
                className="rounded-xl p-4 text-white"
                style={{ background: "var(--color-primary)" }}
              >
                <p className="text-lg font-display font-bold">
                  {payslipData.staffName}
                </p>
                <p className="text-sm opacity-80">
                  {payslipData.position} · {payslipData.department}
                </p>
                <p className="text-xs opacity-60 mt-1">
                  Pay Period: {payslipData.period}
                </p>
              </div>

              {/* Earnings */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Earnings
                </p>
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-mono">
                      {formatCurrency(payslipData.basicSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">
                      Housing Allowance
                    </span>
                    <span className="font-mono text-emerald-600">
                      +{formatCurrency(payslipData.housing)}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">
                      Transport Allowance
                    </span>
                    <span className="font-mono text-emerald-600">
                      +{formatCurrency(payslipData.transport)}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm font-semibold bg-muted/20">
                    <span>Gross Pay</span>
                    <span className="font-mono">
                      {formatCurrency(payslipData.grossPay)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
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
                      –{formatCurrency(payslipData.deductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div
                className="rounded-xl p-4 flex justify-between items-center"
                style={{ background: "var(--color-primary-light)" }}
              >
                <span
                  className="font-bold text-lg"
                  style={{ color: "var(--color-primary)" }}
                >
                  Net Pay
                </span>
                <span
                  className="font-display font-bold text-2xl"
                  style={{ color: "var(--color-primary)" }}
                >
                  {formatCurrency(payslipData.netPay)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPayslipOpen(false)}
              className="transition-fast"
              data-ocid="hr.payslip.close_button"
            >
              Close
            </Button>
            <Button
              className="gap-2 btn-press"
              style={{ background: "var(--color-primary)" }}
              onClick={() => window.print()}
              data-ocid="hr.payslip.print_button"
            >
              <Printer className="w-4 h-4" /> Print Payslip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
