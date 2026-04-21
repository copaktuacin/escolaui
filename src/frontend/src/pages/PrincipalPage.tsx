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
import { roleLabels } from "@/lib/rolePermissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

type TeacherRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  subjects?: string[];
  classAssigned?: string;
  status: "active" | "inactive";
  accessStatus?: "granted" | "revoked";
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

const MOCK_TEACHERS: TeacherRecord[] = [
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

function useTeachers() {
  return useQuery<TeacherRecord[]>({
    queryKey: ["principal-teachers"],
    queryFn: async () => {
      if (isDemoMode()) return withDelay(MOCK_TEACHERS);
      const res = await api.get<{ data: TeacherRecord[] }>(
        "/teachers?limit=50",
      );
      if (!res.success) throw new Error(res.error ?? "Failed to load teachers");
      const d = res.data;
      if (!d) return [];
      if ("data" in d) return d.data;
      return d as unknown as TeacherRecord[];
    },
  });
}

export default function PrincipalPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: teachers = [], isLoading } = useTeachers();
  const [staff, setStaff] = useState<StaffRecord[]>([
    {
      id: "s1",
      name: "Ms. Ngozi Eze",
      email: "ngozi.eze@escola.com",
      role: "clerk",
      status: "active",
    },
  ]);

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

  const appointMutation = useMutation({
    mutationFn: async (payload: typeof newTeacher) => {
      if (
        !payload.name.trim() ||
        !payload.email.trim() ||
        !payload.subject.trim()
      )
        throw new Error("Please fill in Name, Email, and Subject");
      if (isDemoMode()) {
        await withDelay(null, 500);
        return {
          id: `t${Date.now()}`,
          ...payload,
          status: "active" as const,
          accessStatus: "granted" as const,
        };
      }
      // Create user with teacher role via admin API
      const res = await api.post<TeacherRecord>("/teachers", {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        subjects: [payload.subject],
        classAssigned: payload.classAssigned,
      });
      if (!res.success)
        throw new Error(res.error ?? "Failed to appoint teacher");
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["principal-teachers"] });
      toast.success(
        `Teacher ${data?.name ?? newTeacher.name} appointed — system access granted automatically`,
      );
      setNewTeacher({
        name: "",
        email: "",
        phone: "",
        subject: "",
        classAssigned: "",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const terminateMutation = useMutation({
    mutationFn: async ({
      id,
      reason,
    }: { id: string; reason: "resigned" | "relieved" }) => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { id, reason };
      }
      // Revoke teacher role via admin users API
      const res = await api.put(`/admin/users/${id}`, {
        active: false,
        role: "inactive",
      });
      if (!res.success)
        throw new Error(res.error ?? "Failed to terminate teacher");
      return { id, reason };
    },
    onSuccess: ({ reason }) => {
      qc.invalidateQueries({ queryKey: ["principal-teachers"] });
      toast.success(
        `Teacher ${reason === "resigned" ? "marked as resigned" : "relieved"} — system access revoked automatically`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addStaffMutation = useMutation({
    mutationFn: async (payload: typeof newStaff) => {
      if (!payload.name.trim() || !payload.email.trim())
        throw new Error("Fill in all fields");
      if (isDemoMode()) {
        await withDelay(null, 300);
        return { id: `s${Date.now()}`, ...payload, status: "active" as const };
      }
      const res = await api.post<StaffRecord>("/admin/users", {
        name: payload.name,
        email: payload.email,
        role: payload.role,
        password: "Escola@2026",
      });
      if (!res.success) throw new Error(res.error ?? "Failed to add staff");
      return res.data;
    },
    onSuccess: (data) => {
      const name = data?.name ?? newStaff.name;
      const role = data?.role ?? newStaff.role;
      setStaff((prev) => [
        ...prev,
        {
          id: data?.id ?? `s${Date.now()}`,
          name,
          email: newStaff.email,
          role,
          status: "active",
        },
      ]);
      toast.success(`${name} added as ${roleLabels[role] ?? role}`);
      setNewStaff({ name: "", email: "", role: "clerk" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activeTeachers = teachers.filter((t) => t.status === "active");

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

        {/* Tab 1: Appoint */}
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
                onClick={() => appointMutation.mutate(newTeacher)}
                disabled={appointMutation.isPending}
                className="gap-2"
                data-ocid="principal.appoint.primary_button"
              >
                <PlusCircle className="w-4 h-4" />
                {appointMutation.isPending
                  ? "Appointing..."
                  : "Appoint Teacher"}
              </Button>
            </div>
          </div>

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
                  {isLoading ? (
                    (["a", "b", "c"] as const).map((k) => (
                      <TableRow key={`sk-${k}`}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-8" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : teachers.length === 0 ? (
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
                          {t.subject ?? (t.subjects ?? []).join(", ")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {t.classAssigned ?? "–"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${t.status === "active" ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground"}`}
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${(t.accessStatus ?? "granted") === "granted" ? "bg-primary/10 text-primary border-primary/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}
                          >
                            {(t.accessStatus ?? "granted") === "granted"
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

        {/* Tab 2: Relieve */}
        <TabsContent value="relieve" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <UserMinus className="w-4 h-4 text-destructive" />
              <h2 className="font-semibold">Active Teachers</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                Click an action to revoke access immediately
              </span>
            </div>
            {isLoading ? (
              <div className="p-5 space-y-3">
                {(["a", "b"] as const).map((k) => (
                  <Skeleton key={k} className="h-12" />
                ))}
              </div>
            ) : activeTeachers.length === 0 ? (
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
                          {t.subject ?? "–"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {t.classAssigned ?? "–"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 gap-1"
                              onClick={() =>
                                terminateMutation.mutate({
                                  id: t.id,
                                  reason: "resigned",
                                })
                              }
                              disabled={terminateMutation.isPending}
                              data-ocid={`principal.resign.${i + 1}.button`}
                            >
                              <AlertTriangle className="w-3 h-3" /> Mark
                              Resigned
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-7 gap-1"
                              onClick={() =>
                                terminateMutation.mutate({
                                  id: t.id,
                                  reason: "relieved",
                                })
                              }
                              disabled={terminateMutation.isPending}
                              data-ocid={`principal.relieve.${i + 1}.delete_button`}
                            >
                              <UserMinus className="w-3 h-3" /> Relieve
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

        {/* Tab 3: Staff */}
        <TabsContent value="staff" className="mt-6 space-y-6">
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
                onClick={() => addStaffMutation.mutate(newStaff)}
                disabled={addStaffMutation.isPending}
                className="gap-2"
                data-ocid="principal.add_staff.primary_button"
              >
                <PlusCircle className="w-4 h-4" />
                {addStaffMutation.isPending ? "Adding..." : "Add Staff Member"}
              </Button>
            </div>
          </div>

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
