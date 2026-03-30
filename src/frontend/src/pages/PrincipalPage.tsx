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
import {
  AlertTriangle,
  Crown,
  PlusCircle,
  ShieldOff,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { roleLabels } from "../lib/rolePermissions";

type TeacherRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  classAssigned: string;
  status: "active" | "inactive";
  accessStatus: "granted" | "revoked";
  terminationReason?: "resigned" | "relieved";
};

type StaffRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
};

const PRINCIPAL_STAFF_ROLES = ["account_officer", "admission_officer", "clerk"];

const initialTeachers: TeacherRecord[] = [
  {
    id: "t1",
    name: "Mrs. Grace Okafor",
    email: "grace.okafor@escola.com",
    phone: "+234 801 234 5678",
    subject: "Mathematics",
    classAssigned: "Grade 10A",
    status: "active",
    accessStatus: "granted",
  },
  {
    id: "t2",
    name: "Mr. Emeka Nwosu",
    email: "emeka.nwosu@escola.com",
    phone: "+234 802 345 6789",
    subject: "English Language",
    classAssigned: "Grade 9B",
    status: "active",
    accessStatus: "granted",
  },
  {
    id: "t3",
    name: "Ms. Fatima Aliyu",
    email: "fatima.aliyu@escola.com",
    phone: "+234 803 456 7890",
    subject: "Biology",
    classAssigned: "Grade 11C",
    status: "inactive",
    accessStatus: "revoked",
    terminationReason: "resigned",
  },
];

const initialStaff: StaffRecord[] = [
  {
    id: "s1",
    name: "Ms. Ngozi Eze",
    email: "ngozi.eze@escola.com",
    role: "clerk",
    status: "active",
  },
];

export default function PrincipalPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherRecord[]>(initialTeachers);
  const [staff, setStaff] = useState<StaffRecord[]>(initialStaff);

  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    classAssigned: "",
  });

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "clerk",
  });

  if (user?.role !== "principal") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldOff className="w-12 h-12 text-destructive/50" />
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-1">
            This panel is only accessible to the School Principal.
          </p>
        </div>
      </div>
    );
  }

  function handleAppointTeacher() {
    const { name, email, phone, subject, classAssigned } = newTeacher;
    if (!name.trim() || !email.trim() || !subject.trim()) {
      toast.error("Please fill in Name, Email, and Subject");
      return;
    }
    const teacher: TeacherRecord = {
      id: `t${teachers.length + 1}`,
      name,
      email,
      phone,
      subject,
      classAssigned,
      status: "active",
      accessStatus: "granted",
    };
    setTeachers((prev) => [teacher, ...prev]);
    toast.success(
      `Teacher ${name} appointed — system access granted automatically`,
    );
    setNewTeacher({
      name: "",
      email: "",
      phone: "",
      subject: "",
      classAssigned: "",
    });
  }

  function handleTerminate(id: string, reason: "resigned" | "relieved") {
    let teacherName = "";
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          teacherName = t.name;
          return {
            ...t,
            status: "inactive",
            accessStatus: "revoked",
            terminationReason: reason,
          };
        }
        return t;
      }),
    );
    toast.success(
      `${teacherName} has been ${reason === "resigned" ? "marked as resigned" : "relieved"} — system access revoked automatically`,
    );
  }

  function handleAddStaff() {
    if (!newStaff.name.trim() || !newStaff.email.trim()) {
      toast.error("Fill in all fields");
      return;
    }
    setStaff((prev) => [
      ...prev,
      {
        id: `s${prev.length + 1}`,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        status: "active",
      },
    ]);
    toast.success(
      `${newStaff.name} added as ${roleLabels[newStaff.role] ?? newStaff.role}`,
    );
    setNewStaff({ name: "", email: "", role: "clerk" });
  }

  const activeTeachers = teachers.filter((t) => t.status === "active");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Crown className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Principal Panel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Appoint teachers, manage resignations/reliefs, and add support staff
          </p>
        </div>
      </div>

      <Tabs defaultValue="appoint">
        <TabsList data-ocid="principal.tab">
          <TabsTrigger value="appoint" data-ocid="principal.appoint.tab">
            Appoint Teacher
          </TabsTrigger>
          <TabsTrigger value="relieve" data-ocid="principal.relieve.tab">
            Relieve / Resignation
          </TabsTrigger>
          <TabsTrigger value="staff" data-ocid="principal.staff.tab">
            Manage Staff
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Appoint Teacher */}
        <TabsContent value="appoint" className="mt-6 space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <UserCheck className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Appoint New Teacher</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input
                  value={newTeacher.name}
                  onChange={(e) =>
                    setNewTeacher((t) => ({ ...t, name: e.target.value }))
                  }
                  placeholder="Mrs. Jane Doe"
                  data-ocid="principal.teacher_name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) =>
                    setNewTeacher((t) => ({ ...t, email: e.target.value }))
                  }
                  placeholder="jane.doe@escola.com"
                  data-ocid="principal.teacher_email.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={newTeacher.phone}
                  onChange={(e) =>
                    setNewTeacher((t) => ({ ...t, phone: e.target.value }))
                  }
                  placeholder="+234 800 000 0000"
                  data-ocid="principal.teacher_phone.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subject *</Label>
                <Input
                  value={newTeacher.subject}
                  onChange={(e) =>
                    setNewTeacher((t) => ({ ...t, subject: e.target.value }))
                  }
                  placeholder="e.g. Physics"
                  data-ocid="principal.teacher_subject.input"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Class Assigned</Label>
                <Input
                  value={newTeacher.classAssigned}
                  onChange={(e) =>
                    setNewTeacher((t) => ({
                      ...t,
                      classAssigned: e.target.value,
                    }))
                  }
                  placeholder="e.g. Grade 10A"
                  data-ocid="principal.teacher_class.input"
                />
              </div>
            </div>
            <div className="mt-5">
              <Button
                onClick={handleAppointTeacher}
                className="gap-2"
                data-ocid="principal.appoint.primary_button"
              >
                <PlusCircle className="w-4 h-4" /> Appoint Teacher
              </Button>
            </div>
          </div>

          {/* Teacher list */}
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm">Appointed Teachers</h3>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="principal.teachers.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Subject
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Class
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.length === 0 ? (
                    <TableRow data-ocid="principal.teachers.empty_state">
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-6 text-sm"
                      >
                        No teachers appointed yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    teachers.map((t, i) => (
                      <TableRow
                        key={t.id}
                        data-ocid={`principal.teacher.item.${i + 1}`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {t.subject}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {t.classAssigned || "–"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              t.status === "active"
                                ? "bg-success/10 text-success border-success/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              t.accessStatus === "granted"
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-destructive/10 text-destructive border-destructive/30"
                            }`}
                          >
                            {t.accessStatus === "granted"
                              ? "Access Granted"
                              : "Access Revoked"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Relieve / Resignation */}
        <TabsContent value="relieve" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <UserMinus className="w-4 h-4 text-destructive" />
              <h2 className="font-semibold">Active Teachers</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                Click an action to revoke access immediately
              </span>
            </div>
            {activeTeachers.length === 0 ? (
              <div
                className="p-10 text-center text-muted-foreground text-sm"
                data-ocid="principal.relieve.empty_state"
              >
                No active teachers to relieve
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="principal.relieve.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Subject
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Class
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTeachers.map((t, i) => (
                      <TableRow
                        key={t.id}
                        data-ocid={`principal.relieve.item.${i + 1}`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {t.subject}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {t.classAssigned || "–"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 gap-1"
                              onClick={() => handleTerminate(t.id, "resigned")}
                              data-ocid={`principal.resign.${i + 1}.button`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Mark Resigned
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-7 gap-1"
                              onClick={() => handleTerminate(t.id, "relieved")}
                              data-ocid={`principal.relieve.${i + 1}.delete_button`}
                            >
                              <UserMinus className="w-3 h-3" />
                              Relieve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Terminated teachers */}
          {teachers.some((t) => t.status === "inactive") && (
            <div className="mt-4 bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Terminated / Resigned Teachers
                </h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Access</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers
                      .filter((t) => t.status === "inactive")
                      .map((t, i) => (
                        <TableRow
                          key={t.id}
                          data-ocid={`principal.terminated.item.${i + 1}`}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{t.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {t.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {t.terminationReason ?? "–"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs bg-destructive/10 text-destructive border-destructive/30"
                            >
                              Access Revoked
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Manage Staff */}
        <TabsContent value="staff" className="mt-6 space-y-6">
          {/* Warning notice */}
          <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-foreground/80">
              <strong>Restriction:</strong> You cannot create Admin accounts.
              Admins are managed only by the system administrator.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <PlusCircle className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Add Support Staff</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder="Full Name"
                  data-ocid="principal.staff_name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff((s) => ({ ...s, email: e.target.value }))
                  }
                  placeholder="staff@escola.com"
                  data-ocid="principal.staff_email.input"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Role</Label>
                <Select
                  value={newStaff.role}
                  onValueChange={(v) => setNewStaff((s) => ({ ...s, role: v }))}
                >
                  <SelectTrigger data-ocid="principal.staff_role.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRINCIPAL_STAFF_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {roleLabels[r] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-5">
              <Button
                onClick={handleAddStaff}
                className="gap-2"
                data-ocid="principal.add_staff.primary_button"
              >
                <PlusCircle className="w-4 h-4" /> Add Staff Member
              </Button>
            </div>
          </div>

          {/* Staff list */}
          {staff.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm">
                  Staff Added by Principal
                </h3>
              </div>
              <div className="overflow-x-auto">
                <Table data-ocid="principal.staff.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((s, i) => (
                      <TableRow
                        key={s.id}
                        data-ocid={`principal.staff.item.${i + 1}`}
                      >
                        <TableCell className="font-medium text-sm">
                          {s.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {roleLabels[s.role] ?? s.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs bg-success/10 text-success border-success/30"
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
