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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, PlusCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type StaffRecord = {
  id: string;
  name: string;
  department: string;
  position: string;
  joinDate: string;
  status: "active" | "on_leave" | "inactive";
};

const initialStaff: StaffRecord[] = [
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

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const ATTEND_DISPLAY = MONTH_DAYS.slice(0, 10); // Show first 10 days for brevity

const staffAttendance: Record<string, Record<number, "P" | "A" | "L">> = {
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

export default function HRPayrollPage() {
  const [staff] = useState<StaffRecord[]>(initialStaff);
  const [selectedStaff, setSelectedStaff] = useState(staff[0].id);
  const [salary, setSalary] = useState({
    basic: 150000,
    housing: 30000,
    transport: 15000,
    deductions: 20000,
  });

  const net =
    salary.basic + salary.housing + salary.transport - salary.deductions;

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
                onClick={() => toast.info("Add staff form coming soon")}
                data-ocid="hr.add_staff.button"
              >
                <PlusCircle className="w-4 h-4" /> Add Staff
              </Button>
            </div>
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
                  {staff.map((s, i) => (
                    <TableRow key={s.id} data-ocid={`hr.staff.item.${i + 1}`}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {s.department}
                      </TableCell>
                      <TableCell className="text-sm">{s.position}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {s.joinDate}
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
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Staff Member</Label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
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
              {[
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
              ].map(({ key, label, color }) => (
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
            </div>

            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border shadow-card p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Net Pay
                </p>
                <p className="text-4xl font-bold text-foreground">
                  ₦{net.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {staff.find((s) => s.id === selectedStaff)?.name}
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
                onClick={() =>
                  toast.success(
                    `Payslip generated for ${staff.find((s) => s.id === selectedStaff)?.name}`,
                  )
                }
                data-ocid="hr.generate_payslip.button"
              >
                <Download className="w-4 h-4" /> Generate Payslip
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">
                Staff Attendance — March 2026
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
                  {staff.map((s, i) => (
                    <TableRow
                      key={s.id}
                      data-ocid={`hr.attendance.item.${i + 1}`}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {s.name}
                      </TableCell>
                      {ATTEND_DISPLAY.map((d) => {
                        const mark = staffAttendance[s.id]?.[d] ?? "P";
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
