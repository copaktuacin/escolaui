import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  type AdminUserListItem,
  type CreateUserRequest,
  type RoleListItem,
  useAdminRoles,
  useAdminSettings,
  useAdminUsers,
  useCreateUser,
  useDeleteUser,
  useUpdateAdminSettings,
  useUpdateRolePermissions,
  useUpdateUser,
} from "@/hooks/useQueries";
import { isDemoMode } from "@/lib/demoMode";
import { roleLabels } from "@/lib/rolePermissions";
import {
  Building2,
  Check,
  Edit,
  Globe,
  Info,
  KeyRound,
  Mail,
  Phone,
  PlusCircle,
  RefreshCcw,
  Settings,
  Shield,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useSchoolProfile } from "../contexts/SchoolProfileContext";
import { resetOnboarding } from "../lib/onboarding";

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_CREATABLE_ROLES = [
  "Principal",
  "AccountOfficer",
  "AdmissionOfficer",
  "Clerk",
  "Accountant",
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/30",
  principal: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  teacher: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  accountofficer: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  admissionofficer: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  clerk: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  accountant: "bg-orange-500/10 text-orange-600 border-orange-500/30",
};

function getRoleColor(role?: string | null) {
  return (
    ROLE_COLORS[(role ?? "").toLowerCase()] ??
    "bg-muted text-muted-foreground border-border"
  );
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0"
      style={{ background: "var(--color-primary)" }}
    >
      {initials || <User className="w-3.5 h-3.5" />}
    </div>
  );
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────

function EditUserDialog({
  user,
  open,
  onClose,
}: {
  user: AdminUserListItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const updateUser = useUpdateUser();
  const [role, setRole] = useState(user?.role ?? "");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  const prevUserId = useRef<number | undefined>(undefined);
  if (user && user.userId !== prevUserId.current) {
    prevUserId.current = user.userId;
    setRole(user.role ?? "");
    setIsActive(user.isActive);
  }

  function handleSave() {
    if (!user) return;
    const payload: { role?: string; active?: boolean } = {};
    if (role !== user.role) payload.role = role;
    if (isActive !== user.isActive) payload.active = isActive;
    updateUser.mutate(
      { id: user.userId, payload },
      {
        onSuccess: () => {
          toast.success(`User "${user.username}" updated`);
          onClose();
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="glass-elevated border-border/50 shadow-modal max-w-md"
        data-ocid="admin.edit_user.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Edit className="w-4 h-4 text-primary" />
            Edit User — {user?.username}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger
                className="input-premium"
                data-ocid="admin.edit_user_role.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_CREATABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabels[r.toLowerCase()] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            <Switch
              id="edit-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              data-ocid="admin.edit_user_active.switch"
            />
            <div>
              <Label
                htmlFor="edit-active"
                className="text-sm cursor-pointer font-medium"
              >
                Active account
              </Label>
              <p className="text-xs text-muted-foreground">
                User can log in when active
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="admin.edit_user.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateUser.isPending}
            className="btn-press"
            style={{ background: "var(--color-primary)" }}
            data-ocid="admin.edit_user.save_button"
          >
            {updateUser.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Role Permissions Panel ───────────────────────────────────────────────────

function RolePermissionsPanel({ roles }: { roles: RoleListItem[] }) {
  const updatePerms = useUpdateRolePermissions();
  const [editing, setEditing] = useState<number | null>(null);
  const [permInput, setPermInput] = useState("");

  function handleEdit(role: RoleListItem) {
    setEditing(role.roleId);
    setPermInput(role.permissions.join(", "));
  }

  function handleSave(roleId: number) {
    const ids = permInput
      .split(",")
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    updatePerms.mutate(
      { id: roleId, permissionIds: ids },
      {
        onSuccess: () => {
          toast.success("Role permissions updated");
          setEditing(null);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  const PERM_COLORS = [
    "bg-primary/10 text-primary",
    "bg-violet-500/10 text-violet-600",
    "bg-emerald-500/10 text-emerald-600",
    "bg-amber-500/10 text-amber-600",
    "bg-cyan-500/10 text-cyan-600",
    "bg-rose-500/10 text-rose-600",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {roles.map((role, i) => (
        <motion.div
          key={role.roleId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.3 }}
          className="card-premium rounded-xl border border-border bg-card shadow-card p-5 space-y-3"
          data-ocid={`admin.roles.item.${i + 1}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "var(--color-primary-light)" }}
              >
                <Shield
                  className="w-4 h-4"
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {role.roleName}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID #{role.roleId}
                </p>
              </div>
            </div>
            {editing !== role.roleId ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs hover-lift"
                onClick={() => handleEdit(role)}
                data-ocid={`admin.roles.edit_button.${i + 1}`}
              >
                <Edit className="w-3 h-3" /> Edit
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setEditing(null)}
                  data-ocid={`admin.roles.cancel_button.${i + 1}`}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs btn-press"
                  style={{ background: "var(--color-primary)" }}
                  onClick={() => handleSave(role.roleId)}
                  disabled={updatePerms.isPending}
                  data-ocid={`admin.roles.save_button.${i + 1}`}
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          {editing === role.roleId ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Permission IDs (comma-separated)
              </Label>
              <Input
                value={permInput}
                onChange={(e) => setPermInput(e.target.value)}
                className="h-8 text-xs font-mono input-premium"
                placeholder="1, 2, 3"
                data-ocid={`admin.roles.perms_input.${i + 1}`}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {role.permissions.length > 0 ? (
                role.permissions.map((p, pi) => (
                  <span
                    key={p}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PERM_COLORS[pi % PERM_COLORS.length]}`}
                  >
                    {p}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No permissions assigned
                </span>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useSchoolProfile();

  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({
    role: roleFilter,
    page,
    limit: 20,
  });
  const users = usersData?.data ?? [];
  const total = usersData?.total ?? 0;

  const { data: roles = [], isLoading: rolesLoading } = useAdminRoles();
  const { data: settingsData, isLoading: settingsLoading } = useAdminSettings();

  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const updateAdminSettings = useUpdateAdminSettings();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(
    null,
  );

  const [newUser, setNewUser] = useState<CreateUserRequest>({
    userName: "",
    fullName: "",
    email: "",
    role: "Principal",
    password: "",
  });

  const settingsValues = settingsData?.values ?? {};
  const [settingsForm, setSettingsForm] = useState({
    SchoolName: profile.schoolName,
    TimeZone: "UTC",
    Currency: "USD",
    MaxUploadSizeMB: "50",
  });

  const settingsSynced = useRef(false);
  if (settingsData && !settingsSynced.current) {
    settingsSynced.current = true;
    setSettingsForm({
      SchoolName: String(settingsValues.SchoolName ?? profile.schoolName),
      TimeZone: String(settingsValues.TimeZone ?? "UTC"),
      Currency: String(settingsValues.Currency ?? "USD"),
      MaxUploadSizeMB: String(settingsValues.maxUploadSizeMB ?? "50"),
    });
  }

  const [profileForm, setProfileForm] = useState({
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
    reader.onload = (ev) =>
      setProfileForm((f) => ({ ...f, logo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  function handleAddUser() {
    if (
      !newUser.userName.trim() ||
      !newUser.fullName.trim() ||
      !newUser.email.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    createUser.mutate(newUser, {
      onSuccess: (data) => {
        toast.success(`User created (ID: ${data.userId})`);
        setAddDialogOpen(false);
        setNewUser({
          userName: "",
          fullName: "",
          email: "",
          role: "Principal",
          password: "",
        });
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.userId, {
      onSuccess: () => {
        toast.success(`User "${deleteTarget.username}" deleted`);
        setDeleteTarget(null);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function handleSaveSettings() {
    const values: Record<string, string> = {
      SchoolName: settingsForm.SchoolName,
      TimeZone: settingsForm.TimeZone,
      Currency: settingsForm.Currency,
      MaxUploadSizeMB: settingsForm.MaxUploadSizeMB,
    };
    updateAdminSettings.mutate(values, {
      onSuccess: (data) => {
        toast.success("Settings saved successfully");
        if (data.values.SchoolName)
          updateProfile({ schoolName: data.values.SchoolName });
      },
      onError: (e: Error) => toast.error(e.message),
    });
    updateProfile({
      schoolName: settingsForm.SchoolName,
      tagline: profileForm.tagline,
      address: profileForm.address,
      phone: profileForm.phone,
      email: profileForm.email,
      website: profileForm.website,
      academicYear: profileForm.academicYear,
      termStart: profileForm.termStart,
      termEnd: profileForm.termEnd,
      logo: profileForm.logo,
    });
  }

  const totalPages = Math.ceil(total / 20);
  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          (u.email ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Admin Module
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            User management, role-based access control, and system settings
            {isDemoMode() && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Demo Mode
              </span>
            )}
          </p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList
          className="glass border border-border/50 shadow-card p-1"
          data-ocid="admin.tab"
        >
          <TabsTrigger
            value="users"
            className="data-[state=active]:shadow-card gap-1.5"
            data-ocid="admin.tab.users"
          >
            <Users className="w-3.5 h-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="data-[state=active]:shadow-card gap-1.5"
            data-ocid="admin.tab.roles"
          >
            <Shield className="w-3.5 h-3.5" /> Roles &amp; Permissions
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:shadow-card gap-1.5"
            data-ocid="admin.tab.settings"
          >
            <Settings className="w-3.5 h-3.5" /> System Settings
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 shadow-subtle"
          >
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-foreground/80 text-xs">
              <strong>Note:</strong> To appoint teachers, log in as{" "}
              <span className="font-semibold text-primary">Principal</span> and
              use the <strong>Principal Panel</strong>. Admin cannot create
              teacher accounts directly.
            </p>
          </motion.div>

          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border glass">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <h2 className="font-display font-semibold text-foreground">
                    System Users
                  </h2>
                  {total > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {total}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search users…"
                      className="pl-8 h-8 text-xs w-44 input-premium"
                      data-ocid="admin.users.search_input"
                    />
                  </div>
                  <Select
                    value={roleFilter || "all"}
                    onValueChange={(v) => {
                      setRoleFilter(v === "all" ? "" : v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger
                      className="h-8 w-36 text-xs input-premium"
                      data-ocid="admin.users.role_filter.select"
                    >
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {[
                        "Admin",
                        "Principal",
                        "Teacher",
                        "AccountOfficer",
                        "AdmissionOfficer",
                        "Clerk",
                      ].map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabels[r.toLowerCase()] ?? r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="gap-2 btn-press shadow-card"
                    style={{ background: "var(--color-primary)" }}
                    onClick={() => setAddDialogOpen(true)}
                    data-ocid="admin.add_user.open_modal_button"
                  >
                    <PlusCircle className="w-4 h-4" /> Add User
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table data-ocid="admin.users.table">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">
                      Email
                    </TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    (["a", "b", "c"] as const).map((k) => (
                      <TableRow key={`sk-${k}`}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-10 rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-14"
                        data-ocid="admin.users.empty_state"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-8 h-8 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">
                            No users found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u, i) => (
                      <TableRow
                        key={u.userId}
                        className="table-row-hover stagger-item"
                        data-ocid={`admin.user.item.${i + 1}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <AvatarInitials name={u.username} />
                            <span className="font-medium text-sm">
                              {u.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {u.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`badge-premium border ${getRoleColor(u.role)}`}
                          >
                            {roleLabels[(u.role ?? "").toLowerCase()] ??
                              u.role ??
                              "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`badge-premium border ${u.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground border-border"}`}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                              onClick={() => setEditTarget(u)}
                              data-ocid={`admin.edit.${i + 1}.button`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteTarget(u)}
                              data-ocid={`admin.delete.${i + 1}.delete_button`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-border glass flex items-center justify-between text-sm text-muted-foreground">
                <span className="text-xs">{total} total users</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    data-ocid="admin.users.pagination_prev"
                  >
                    Previous
                  </Button>
                  <span className="text-xs px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    data-ocid="admin.users.pagination_next"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-card"
                style={{ background: "var(--color-primary-light)" }}
              >
                <Shield
                  className="w-5 h-5"
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  Roles &amp; Permissions
                </h2>
                <p className="text-xs text-muted-foreground">
                  Manage access control for each role
                </p>
              </div>
            </div>
            <Separator />
            {rolesLoading ? (
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                data-ocid="admin.roles.loading_state"
              >
                {[1, 2, 3, 4].map((k) => (
                  <Skeleton key={k} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : (
              <RolePermissionsPanel roles={roles} />
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-card"
                style={{ background: "var(--color-primary-light)" }}
              >
                <Settings
                  className="w-5 h-5"
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  System Settings &amp; School Profile
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure school identity and API settings
                </p>
              </div>
            </div>

            {settingsLoading ? (
              <div
                className="space-y-4 max-w-2xl"
                data-ocid="admin.settings.loading_state"
              >
                <Skeleton className="h-11 rounded-lg" />
                <Skeleton className="h-11 rounded-lg" />
                <Skeleton className="h-11 rounded-lg" />
              </div>
            ) : (
              <div className="max-w-2xl space-y-6">
                {/* API Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">
                      API Settings
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded">
                      PUT /admin/settings
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-5 rounded-xl border border-border bg-muted/20">
                    <div className="space-y-1.5">
                      <Label
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-primary)" }}
                      >
                        School Name
                      </Label>
                      <Input
                        value={settingsForm.SchoolName}
                        onChange={(e) =>
                          setSettingsForm((f) => ({
                            ...f,
                            SchoolName: e.target.value,
                          }))
                        }
                        className="input-premium"
                        data-ocid="admin.school_name.input"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--color-primary)" }}
                        >
                          Timezone
                        </Label>
                        <Input
                          value={settingsForm.TimeZone}
                          onChange={(e) =>
                            setSettingsForm((f) => ({
                              ...f,
                              TimeZone: e.target.value,
                            }))
                          }
                          placeholder="UTC"
                          className="input-premium"
                          data-ocid="admin.timezone.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--color-primary)" }}
                        >
                          Currency
                        </Label>
                        <Input
                          value={settingsForm.Currency}
                          onChange={(e) =>
                            setSettingsForm((f) => ({
                              ...f,
                              Currency: e.target.value,
                            }))
                          }
                          placeholder="USD"
                          className="input-premium"
                          data-ocid="admin.currency.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--color-primary)" }}
                        >
                          Max Upload (MB)
                        </Label>
                        <Input
                          type="number"
                          value={settingsForm.MaxUploadSizeMB}
                          onChange={(e) =>
                            setSettingsForm((f) => ({
                              ...f,
                              MaxUploadSizeMB: e.target.value,
                            }))
                          }
                          placeholder="50"
                          className="input-premium"
                          data-ocid="admin.max_upload.input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* School Profile */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">
                      School Profile
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-5 rounded-xl border border-border bg-muted/20">
                    <div className="space-y-1.5">
                      <Label
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Tagline / Motto
                      </Label>
                      <Input
                        value={profileForm.tagline}
                        onChange={(e) =>
                          setProfileForm((f) => ({
                            ...f,
                            tagline: e.target.value,
                          }))
                        }
                        className="input-premium"
                        data-ocid="admin.tagline.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Address
                      </Label>
                      <Input
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm((f) => ({
                            ...f,
                            address: e.target.value,
                          }))
                        }
                        placeholder="123 School Road, City"
                        className="input-premium"
                        data-ocid="admin.address.input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--color-primary)" }}
                        >
                          Phone
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
                          <Input
                            value={profileForm.phone}
                            onChange={(e) =>
                              setProfileForm((f) => ({
                                ...f,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="+1 555 000 0000"
                            className="input-premium pl-9"
                            data-ocid="admin.phone.input"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--color-primary)" }}
                        >
                          Contact Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
                          <Input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) =>
                              setProfileForm((f) => ({
                                ...f,
                                email: e.target.value,
                              }))
                            }
                            placeholder="info@school.edu"
                            className="input-premium pl-9"
                            data-ocid="admin.contact_email.input"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Website
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
                        <Input
                          value={profileForm.website}
                          onChange={(e) =>
                            setProfileForm((f) => ({
                              ...f,
                              website: e.target.value,
                            }))
                          }
                          placeholder="https://school.edu"
                          className="input-premium pl-9"
                          data-ocid="admin.website.input"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Academic Year
                      </Label>
                      <Input
                        value={profileForm.academicYear}
                        onChange={(e) =>
                          setProfileForm((f) => ({
                            ...f,
                            academicYear: e.target.value,
                          }))
                        }
                        className="input-premium"
                        data-ocid="admin.academic_year.input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--color-primary)" }}
                        >
                          Term Start
                        </Label>
                        <Input
                          type="date"
                          value={profileForm.termStart}
                          onChange={(e) =>
                            setProfileForm((f) => ({
                              ...f,
                              termStart: e.target.value,
                            }))
                          }
                          className="input-premium"
                          data-ocid="admin.term_start.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--color-primary)" }}
                        >
                          Term End
                        </Label>
                        <Input
                          type="date"
                          value={profileForm.termEnd}
                          onChange={(e) =>
                            setProfileForm((f) => ({
                              ...f,
                              termEnd: e.target.value,
                            }))
                          }
                          className="input-premium"
                          data-ocid="admin.term_end.input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Logo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">
                      School Logo
                    </h3>
                  </div>
                  <label
                    className="flex items-center gap-4 border-2 border-dashed rounded-xl px-5 py-4 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors group"
                    data-ocid="admin.logo.dropzone"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, SVG, or JPG
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.svg,.jpg,.jpeg"
                      className="hidden"
                      onChange={handleLogoChange}
                      data-ocid="admin.logo.upload_button"
                    />
                  </label>
                  {profileForm.logo && (
                    <div className="flex items-center gap-4 p-3 rounded-xl border border-border bg-muted/20">
                      <img
                        src={profileForm.logo}
                        alt="Logo preview"
                        className="w-14 h-14 rounded-lg object-cover border border-border shadow-card"
                      />
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Logo preview
                        </p>
                        <button
                          type="button"
                          className="text-xs text-destructive hover:underline mt-0.5"
                          onClick={() =>
                            setProfileForm((f) => ({ ...f, logo: null }))
                          }
                          data-ocid="admin.logo.delete_button"
                        >
                          Remove logo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    className="gap-2 btn-press shadow-card"
                    style={{ background: "var(--color-primary)" }}
                    onClick={handleSaveSettings}
                    disabled={updateAdminSettings.isPending}
                    data-ocid="admin.settings.save_button"
                  >
                    <Check className="w-4 h-4" />
                    {updateAdminSettings.isPending
                      ? "Saving..."
                      : "Save Settings"}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 hover-lift"
                    onClick={() => {
                      if (!user) return;
                      resetOnboarding(user.id);
                      toast.success(
                        "Onboarding reset — shows again on next dashboard visit",
                      );
                    }}
                    data-ocid="admin.reset_onboarding.button"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Reset Onboarding
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent
          className="glass-elevated border-border/50 shadow-modal max-w-md"
          data-ocid="admin.add_user.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-primary" />
              Add New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-primary)" }}
              >
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
                <Input
                  value={newUser.userName}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, userName: e.target.value }))
                  }
                  placeholder="jsmith"
                  className="input-premium pl-9"
                  data-ocid="admin.user_username.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-primary)" }}
              >
                Full Name
              </Label>
              <Input
                value={newUser.fullName}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, fullName: e.target.value }))
                }
                placeholder="Jane Smith"
                className="input-premium"
                data-ocid="admin.user_fullname.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-primary)" }}
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, email: e.target.value }))
                  }
                  placeholder="jane@escola.com"
                  className="input-premium pl-9"
                  data-ocid="admin.user_email.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-primary)" }}
              >
                Role
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser((u) => ({ ...u, role: v }))}
              >
                <SelectTrigger
                  className="input-premium"
                  data-ocid="admin.user_role.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_CREATABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r.toLowerCase()] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-primary)" }}
              >
                Password
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, password: e.target.value }))
                  }
                  placeholder="Min 6 characters"
                  className="input-premium pl-9"
                  data-ocid="admin.user_password.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              data-ocid="admin.add_user.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={createUser.isPending}
              className="btn-press"
              style={{ background: "var(--color-primary)" }}
              data-ocid="admin.add_user.confirm_button"
            >
              {createUser.isPending ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent
          className="glass-elevated shadow-modal"
          data-ocid="admin.delete_user.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                {deleteTarget?.username}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteTarget(null)}
              data-ocid="admin.delete_user.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="admin.delete_user.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
