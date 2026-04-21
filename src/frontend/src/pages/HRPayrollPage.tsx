import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Download, PlusCircle } from "lucide-react";
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
    status: "active",
  },
  {
    id: "st2",
    name: "Mrs. Grace Okafor",
    department: "Academics",
    position: "Senior Teacher",
    joinDate: "2018-01-15",
    status: "active",
  },
  {
    id: "st3",
    name: "Mr. James Bello",
    department: "Finance",
    position: "Bursar",
    joinDate: "2019-03-01",
    status: "active",
  },
  {
    id: "st4",
    name: "Ms. Ngozi Eze",
    department: "Academics",
    position: "Teacher",
    joinDate: "2021-09-01",
    status: "on_leave",
  },
  {
    id: "st5",
    name: "Mr. Tunde Abiola",
    department: "Academics",
    position: "Teacher",
    joinDate: "2020-01-10",
    status: "active",
  },
  {
    id: "st6",
    name: "Mrs. Amaka Chukwu",
    department: "Admin Support",
    position: "Secretary",
    joinDate: "2022-06-01",
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
  active: "bg-success/10 text-success border-success/30",
  on_leave: "bg-warning/10 text-warning border-warning/30",
  inactive: "bg-muted text-muted-foreground",
};

const attendColor: Record<string, string> = {
  P: "bg-success/10 text-success",
  A: "bg-destructive/10 text-destructive",
  L: "bg-warning/10 text-warning",
};

const CURRENT_MONTH = new Date().toLocaleString("default", { month: "long" });
const CURRENT_YEAR = new Date().getFullYear();

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

export default function HRPayrollPage() {
  const qc = useQueryClient();
  const { data: staff = [], isLoading: staffLoading } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<string>("");
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
  const [newStaff, setNewStaff] = useState({
    name: "",
    department: "",
    position: "",
    salary: "",
  });

  const currentStaffId = selectedStaff || staff[0]?.id;

  const { data: attendanceData = {} } = useStaffAttendance(
    currentStaffId,
    new Date().getMonth() + 1,
    new Date().getFullYear(),
  );

  const net =
    salary.basic + salary.housing + salary.transport - salary.deductions;

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
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
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
      toast.success("Payroll computed successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payslipMutation = useMutation({
    mutationFn: async () => {
      const staffName = staff.find((s) => s.id === currentStaffId)?.name;
      if (isDemoMode()) {
        await withDelay(null, 600);
        return { payslipUrl: null, name: staffName };
      }
      const res = await api.post<{ payslipId: string; payslipUrl?: string }>(
        "/hr/payslips/generate",
        {
          staffId: currentStaffId,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to generate payslip");
      return { payslipUrl: res.data?.payslipUrl, name: staffName };
    },
    onSuccess: (data) => {
      if (data?.payslipUrl) window.open(data.payslipUrl, "_blank");
      else
        toast.success(`Payslip generated for ${data?.name ?? "staff member"}`);
    },
    onError: (e: Error) => toast.error(e.message),
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-foreground">HR &amp; Payroll</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Staff records, payroll computation, and attendance tracking
        </p>
      </div>

      <Tabs defaultValue="directory">
        <TabsList data-ocid="hr.tab">
          <TabsTrigger value="directory">Staff Directory</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* Staff Directory */}
        <TabsContent value="directory" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Staff Directory</h2>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setAddOpen(!addOpen)}
                data-ocid="hr.add_staff.button"
              >
                <PlusCircle className="w-4 h-4" /> Add Staff
              </Button>
            </div>

            {addOpen && (
              <div className="p-5 border-b border-border bg-muted/20 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Full Name *</Label>
                    <Input
                      value={newStaff.name}
                      onChange={(e) =>
                        setNewStaff((s) => ({ ...s, name: e.target.value }))
                      }
                      placeholder="Name"
                      className="h-8 text-xs"
                      data-ocid="hr.staff_name.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Department</Label>
                    <Input
                      value={newStaff.department}
                      onChange={(e) =>
                        setNewStaff((s) => ({
                          ...s,
                          department: e.target.value,
                        }))
                      }
                      placeholder="e.g. Academics"
                      className="h-8 text-xs"
                      data-ocid="hr.staff_dept.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Position</Label>
                    <Input
                      value={newStaff.position}
                      onChange={(e) =>
                        setNewStaff((s) => ({ ...s, position: e.target.value }))
                      }
                      placeholder="e.g. Teacher"
                      className="h-8 text-xs"
                      data-ocid="hr.staff_position.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Basic Salary (₦)</Label>
                    <Input
                      type="number"
                      value={newStaff.salary}
                      onChange={(e) =>
                        setNewStaff((s) => ({ ...s, salary: e.target.value }))
                      }
                      placeholder="150000"
                      className="h-8 text-xs"
                      data-ocid="hr.staff_salary.input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddOpen(false)}
                    data-ocid="hr.add_staff.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => addStaffMutation.mutate(newStaff)}
                    disabled={addStaffMutation.isPending}
                    data-ocid="hr.add_staff.submit_button"
                  >
                    {addStaffMutation.isPending ? "Adding..." : "Add Staff"}
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table data-ocid="hr.directory.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Department
                    </TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Join Date
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffLoading
                    ? (["a", "b", "c", "d"] as const).map((k) => (
                        <TableRow key={`sk-${k}`}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-8" />
                          </TableCell>
                        </TableRow>
                      ))
                    : staff.map((s, i) => (
                        <TableRow
                          key={s.id}
                          data-ocid={`hr.staff.item.${i + 1}`}
                        >
                          <TableCell className="font-medium">
                            {s.name}
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
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${statusBadge[s.status]}`}
                            >
                              {s.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Payroll */}
        <TabsContent value="payroll" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-5">
              <div>
                <h2 className="font-semibold text-foreground">
                  Salary Computation
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {CURRENT_MONTH} {CURRENT_YEAR}
                </p>
              </div>
              {staffLoading ? (
                <Skeleton className="h-10" />
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">Staff Member</Label>
                  <Select
                    value={currentStaffId}
                    onValueChange={setSelectedStaff}
                  >
                    <SelectTrigger data-ocid="hr.payroll_staff.select">
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
              {(
                [
                  { key: "basic" as const, label: "Basic Pay", color: "" },
                  {
                    key: "housing" as const,
                    label: "Housing Allowance",
                    color: "",
                  },
                  {
                    key: "transport" as const,
                    label: "Transport Allowance",
                    color: "",
                  },
                  {
                    key: "deductions" as const,
                    label: "Deductions",
                    color: "text-destructive",
                  },
                ] as const
              ).map(({ key, label, color }) => (
                <div key={key} className="space-y-1.5">
                  <Label className={`text-xs ${color}`}>{label} (₦)</Label>
                  <Input
                    type="number"
                    value={salary[key]}
                    onChange={(e) =>
                      setSalary((s) => ({
                        ...s,
                        [key]: Number(e.target.value),
                      }))
                    }
                    className="h-9"
                    data-ocid={`hr.${key}.input`}
                  />
                </div>
              ))}
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => computeMutation.mutate()}
                disabled={computeMutation.isPending}
                data-ocid="hr.compute_payroll.button"
              >
                {computeMutation.isPending ? "Computing..." : "Compute Payroll"}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border shadow-card p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Net Pay
                </p>
                <p className="text-4xl font-bold text-foreground">
                  ₦{(payrollResult?.netPay ?? net).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {staff.find((s) => s.id === currentStaffId)?.name}
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Pay</span>
                    <span>
                      ₦
                      {(
                        salary.basic +
                        salary.housing +
                        salary.transport
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-destructive">Deductions</span>
                    <span className="text-destructive">
                      –₦{salary.deductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-border pt-2">
                    <span>Net Pay</span>
                    <span>₦{net.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => payslipMutation.mutate()}
                disabled={payslipMutation.isPending}
                data-ocid="hr.generate_payslip.button"
              >
                <Download className="w-4 h-4" />
                {payslipMutation.isPending
                  ? "Generating..."
                  : "Generate Payslip"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">
                Staff Attendance — {CURRENT_MONTH} {CURRENT_YEAR}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Showing days 1–10 · P = Present, A = Absent, L = Leave
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="hr.attendance.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {ATTEND_DISPLAY.map((d) => (
                      <TableHead key={d} className="text-center w-8">
                        {d}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffLoading
                    ? (["a", "b", "c"] as const).map((k) => (
                        <TableRow key={`sk-${k}`}>
                          <TableCell colSpan={11}>
                            <Skeleton className="h-8" />
                          </TableCell>
                        </TableRow>
                      ))
                    : staff.map((s, i) => (
                        <TableRow
                          key={s.id}
                          data-ocid={`hr.attendance.item.${i + 1}`}
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            {s.name}
                          </TableCell>
                          {ATTEND_DISPLAY.map((d) => {
                            const mark: AttendanceMark =
                              (s.id === currentStaffId
                                ? attendanceData[d]
                                : MOCK_ATTENDANCE[s.id]?.[d]) ?? "P";
                            return (
                              <TableCell key={d} className="text-center p-1">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${attendColor[mark]}`}
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
    </motion.div>
  );
}
