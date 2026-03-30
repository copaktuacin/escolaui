import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Check,
  Edit,
  Info,
  PlusCircle,
  Settings,
  Shield,
  Upload,
  UserX,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSchoolProfile } from "../contexts/SchoolProfileContext";
import { roleLabels } from "../lib/rolePermissions";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  accessRevoked?: boolean;
};

// Roles admin can assign (not teacher — principal does that; not student)
const ADMIN_CREATABLE_ROLES = [
  "principal",
  "account_officer",
  "admission_officer",
  "clerk",
  "accountant",
];

const ALL_ROLES = [
  "admin",
  "principal",
  "teacher",
  "account_officer",
  "accountant",
  "admission_officer",
  "clerk",
];

const MODULES = [
  "Dashboard",
  "Admissions",
  "Attendance",
  "Fees",
  "Schedule",
  "Report Cards",
  "HR & Payroll",
  "Notifications",
  "Teacher Portal",
  "Admin Panel",
];

const roleAccess: Record<string, Record<string, boolean>> = {
  admin: {
    Dashboard: true,
    Admissions: true,
    Attendance: true,
    Fees: true,
    Schedule: true,
    "Report Cards": true,
    "HR & Payroll": true,
    Notifications: true,
    "Teacher Portal": true,
    "Admin Panel": true,
  },
  principal: {
    Dashboard: true,
    Admissions: true,
    Attendance: true,
    Fees: false,
    Schedule: true,
    "Report Cards": false,
    "HR & Payroll": false,
    Notifications: true,
    "Teacher Portal": false,
    "Admin Panel": false,
  },
  teacher: {
    Dashboard: true,
    Admissions: false,
    Attendance: true,
    Fees: false,
    Schedule: true,
    "Report Cards": true,
    "HR & Payroll": false,
    Notifications: true,
    "Teacher Portal": true,
    "Admin Panel": false,
  },
  account_officer: {
    Dashboard: true,
    Admissions: false,
    Attendance: false,
    Fees: true,
    Schedule: false,
    "Report Cards": false,
    "HR & Payroll": true,
    Notifications: true,
    "Teacher Portal": false,
    "Admin Panel": false,
  },
  accountant: {
    Dashboard: true,
    Admissions: false,
    Attendance: false,
    Fees: true,
    Schedule: false,
    "Report Cards": false,
    "HR & Payroll": true,
    Notifications: true,
    "Teacher Portal": false,
    "Admin Panel": false,
  },
  admission_officer: {
    Dashboard: true,
    Admissions: true,
    Attendance: false,
    Fees: false,
    Schedule: false,
    "Report Cards": false,
    "HR & Payroll": false,
    Notifications: true,
    "Teacher Portal": false,
    "Admin Panel": false,
  },
  clerk: {
    Dashboard: true,
    Admissions: true,
    Attendance: false,
    Fees: false,
    Schedule: false,
    "Report Cards": false,
    "HR & Payroll": false,
    Notifications: true,
    "Teacher Portal": false,
    "Admin Panel": false,
  },
};

const initialUsers: UserRecord[] = [
  {
    id: "u1",
    name: "Dr. Sarah Evans",
    email: "admin@escola.com",
    role: "admin",
    status: "active",
  },
  {
    id: "u2",
    name: "Mr. David Okonkwo",
    email: "principal@escola.com",
    role: "principal",
    status: "active",
  },
  {
    id: "u3",
    name: "Mrs. Grace Okafor",
    email: "teacher@escola.com",
    role: "teacher",
    status: "active",
  },
  {
    id: "u4",
    name: "Mr. James Bello",
    email: "accounts@escola.com",
    role: "account_officer",
    status: "active",
  },
  {
    id: "u5",
    name: "Ms. Amara Nwosu",
    email: "admissions@escola.com",
    role: "admission_officer",
    status: "active",
  },
  {
    id: "u6",
    name: "Mr. Tunde Abiola",
    email: "tunde.abiola@escola.com",
    role: "teacher",
    status: "inactive",
    accessRevoked: true,
  },
];

export default function AdminPage() {
  const { profile, updateProfile } = useSchoolProfile();
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "principal",
  });

  const [form, setForm] = useState({
    schoolName: profile.schoolName,
    tagline: profile.tagline,
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    academicYear: profile.academicYear,
    termStart: profile.termStart,
    termEnd: profile.termEnd,
    logo: profile.logo,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setForm((f) => ({ ...f, logo: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  function handleSaveSettings() {
    updateProfile(form);
    toast.success("School profile saved successfully");
  }

  function handleDeactivate(id: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u,
      ),
    );
    toast.success("User status updated");
  }

  function handleAddUser() {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error("Fill in all fields");
      return;
    }
    setUsers((prev) => [
      ...prev,
      {
        id: `u${prev.length + 1}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: "active",
      },
    ]);
    toast.success(`User ${newUser.name} added`);
    setDialogOpen(false);
    setNewUser({ name: "", email: "", role: "principal" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-foreground">Admin Module</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          User management, role-based access control, and system settings
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList data-ocid="admin.tab">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; Access</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6 space-y-4">
          {/* Info notice */}
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-foreground/80">
              <strong>Note:</strong> To appoint teachers, log in as{" "}
              <span className="font-semibold">Principal</span> and use the{" "}
              <strong>Principal Panel</strong>. Admin cannot create teacher
              accounts directly — teacher access is granted automatically by the
              Principal upon appointment.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">System Users</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-2"
                    data-ocid="admin.add_user.open_modal_button"
                  >
                    <PlusCircle className="w-4 h-4" /> Add User
                  </Button>
                </DialogTrigger>
                <DialogContent data-ocid="admin.add_user.dialog">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <Input
                        value={newUser.name}
                        onChange={(e) =>
                          setNewUser((u) => ({ ...u, name: e.target.value }))
                        }
                        data-ocid="admin.user_name.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email Address</Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser((u) => ({ ...u, email: e.target.value }))
                        }
                        data-ocid="admin.user_email.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(v) =>
                          setNewUser((u) => ({ ...u, role: v }))
                        }
                      >
                        <SelectTrigger data-ocid="admin.user_role.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ADMIN_CREATABLE_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {roleLabels[r] ?? r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-ocid="admin.add_user.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddUser}
                      data-ocid="admin.add_user.confirm_button"
                    >
                      Add User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="admin.users.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Email
                    </TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u, i) => (
                    <TableRow key={u.id} data-ocid={`admin.user.item.${i + 1}`}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {roleLabels[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={`text-xs w-fit ${
                              u.status === "active"
                                ? "bg-success/10 text-success border-success/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {u.status}
                          </Badge>
                          {u.accessRevoked && (
                            <Badge
                              variant="outline"
                              className="text-xs w-fit bg-destructive/10 text-destructive border-destructive/30"
                            >
                              Access Revoked
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => toast.info(`Editing ${u.name}`)}
                            data-ocid={`admin.edit.${i + 1}.button`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDeactivate(u.id)}
                            data-ocid={`admin.deactivate.${i + 1}.button`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">
                Role Access Matrix
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="admin.roles.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    {ALL_ROLES.map((r) => (
                      <TableHead key={r} className="text-center text-xs">
                        {roleLabels[r] ?? r}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map((mod, i) => (
                    <TableRow key={mod} data-ocid={`admin.roles.item.${i + 1}`}>
                      <TableCell className="font-medium text-sm">
                        {mod}
                      </TableCell>
                      {ALL_ROLES.map((role) => (
                        <TableCell key={role} className="text-center">
                          {roleAccess[role]?.[mod] ? (
                            <Check className="w-4 h-4 text-success mx-auto" />
                          ) : (
                            <span className="text-muted-foreground/30 text-lg">
                              –
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Settings className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">
                School Profile &amp; System Settings
              </h2>
            </div>
            <div className="max-w-lg space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs">School Name</Label>
                <Input
                  value={form.schoolName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, schoolName: e.target.value }))
                  }
                  data-ocid="admin.school_name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tagline / Motto</Label>
                <Input
                  value={form.tagline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tagline: e.target.value }))
                  }
                  data-ocid="admin.tagline.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="123 School Road, City"
                  data-ocid="admin.address.input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+1 555 000 0000"
                    data-ocid="admin.phone.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="info@school.edu"
                    data-ocid="admin.contact_email.input"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, website: e.target.value }))
                  }
                  placeholder="https://school.edu"
                  data-ocid="admin.website.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Academic Year</Label>
                <Input
                  value={form.academicYear}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, academicYear: e.target.value }))
                  }
                  data-ocid="admin.academic_year.input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Term Start Date</Label>
                  <Input
                    type="date"
                    value={form.termStart}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, termStart: e.target.value }))
                    }
                    data-ocid="admin.term_start.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Term End Date</Label>
                  <Input
                    type="date"
                    value={form.termEnd}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, termEnd: e.target.value }))
                    }
                    data-ocid="admin.term_end.input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">School Logo</Label>
                <label
                  className="flex items-center gap-3 border-2 border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  data-ocid="admin.logo.dropzone"
                >
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload logo (PNG/SVG/JPG)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.svg,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleLogoChange}
                    data-ocid="admin.logo.upload_button"
                  />
                </label>
                {form.logo && (
                  <div className="flex items-center gap-3 mt-2">
                    <img
                      src={form.logo}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-lg object-cover border border-border"
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Logo preview
                      </p>
                      <button
                        type="button"
                        className="text-xs text-destructive hover:underline"
                        onClick={() => setForm((f) => ({ ...f, logo: null }))}
                        data-ocid="admin.logo.delete_button"
                      >
                        Remove logo
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <Button
                  className="gap-2"
                  onClick={handleSaveSettings}
                  data-ocid="admin.settings.save_button"
                >
                  <Check className="w-4 h-4" /> Save Settings
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
