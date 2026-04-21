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
  Check,
  Edit,
  Info,
  PlusCircle,
  RefreshCcw,
  Settings,
  Shield,
  Trash2,
  Upload,
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

  // Sync state when user changes
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
      <DialogContent data-ocid="admin.edit_user.dialog">
        <DialogHeader>
          <DialogTitle>Edit User — {user?.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-ocid="admin.edit_user_role.select">
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
          <div className="flex items-center gap-3">
            <Switch
              id="edit-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              data-ocid="admin.edit_user_active.switch"
            />
            <Label htmlFor="edit-active" className="text-sm cursor-pointer">
              Active account
            </Label>
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

  return (
    <div className="space-y-3">
      {roles.map((role, i) => (
        <div
          key={role.roleId}
          className="rounded-lg border border-border bg-card p-4 space-y-2"
          data-ocid={`admin.roles.item.${i + 1}`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">{role.roleName}</span>
              <Badge variant="outline" className="text-xs">
                ID {role.roleId}
              </Badge>
            </div>
            {editing !== role.roleId ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => handleEdit(role)}
                data-ocid={`admin.roles.edit_button.${i + 1}`}
              >
                <Edit className="w-3 h-3" /> Edit Permissions
              </Button>
            ) : (
              <div className="flex items-center gap-2">
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
                  className="h-7 text-xs"
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
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Permission IDs (comma-separated)
              </Label>
              <Input
                value={permInput}
                onChange={(e) => setPermInput(e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="1, 2, 3"
                data-ocid={`admin.roles.perms_input.${i + 1}`}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {role.permissions.map((p) => (
                <Badge
                  key={p}
                  variant="secondary"
                  className="text-xs font-mono"
                >
                  {p}
                </Badge>
              ))}
              {role.permissions.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No permissions assigned
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useSchoolProfile();

  // User list state
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({
    role: roleFilter,
    page,
    limit: 20,
  });
  const users = usersData?.data ?? [];
  const total = usersData?.total ?? 0;

  // Roles
  const { data: roles = [], isLoading: rolesLoading } = useAdminRoles();

  // Settings
  const { data: settingsData, isLoading: settingsLoading } = useAdminSettings();

  // Mutations
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const updateAdminSettings = useUpdateAdminSettings();

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(
    null,
  );

  // Create user form
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    userName: "",
    fullName: "",
    email: "",
    role: "Principal",
    password: "",
  });

  // Settings form — sourced from API values
  const settingsValues = settingsData?.values ?? {};
  const [settingsForm, setSettingsForm] = useState({
    SchoolName: profile.schoolName,
    TimeZone: "UTC",
    Currency: "USD",
  });

  // Sync settings form when data loads
  const settingsSynced = useRef(false);
  if (settingsData && !settingsSynced.current) {
    settingsSynced.current = true;
    setSettingsForm({
      SchoolName: String(settingsValues.SchoolName ?? profile.schoolName),
      TimeZone: String(settingsValues.TimeZone ?? "UTC"),
      Currency: String(settingsValues.Currency ?? "USD"),
    });
  }

  // Profile / logo form
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
    reader.onload = (ev) => {
      setProfileForm((f) => ({ ...f, logo: ev.target?.result as string }));
    };
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
    };
    updateAdminSettings.mutate(values, {
      onSuccess: (data) => {
        toast.success("Settings saved successfully");
        if (data.values.SchoolName) {
          updateProfile({ schoolName: data.values.SchoolName });
        }
      },
      onError: (e: Error) => toast.error(e.message),
    });
    // Always update local profile for other fields
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
          {isDemoMode() && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Demo Mode
            </span>
          )}
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList data-ocid="admin.tab">
          <TabsTrigger value="users" data-ocid="admin.tab.users">
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" data-ocid="admin.tab.roles">
            Roles &amp; Permissions
          </TabsTrigger>
          <TabsTrigger value="settings" data-ocid="admin.tab.settings">
            System Settings
          </TabsTrigger>
        </TabsList>

        {/* ── Users Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="users" className="mt-6 space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-foreground/80">
              <strong>Note:</strong> To appoint teachers, log in as{" "}
              <span className="font-semibold">Principal</span> and use the{" "}
              <strong>Principal Panel</strong>. Admin cannot create teacher
              accounts directly.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-semibold text-foreground">System Users</h2>
                <Select
                  value={roleFilter || "all"}
                  onValueChange={(v) => {
                    setRoleFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    className="h-8 w-40 text-xs"
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
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setAddDialogOpen(true)}
                data-ocid="admin.add_user.open_modal_button"
              >
                <PlusCircle className="w-4 h-4" /> Add User
              </Button>
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
                  {usersLoading ? (
                    (["a", "b", "c"] as const).map((k) => (
                      <TableRow key={`sk-${k}`}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-8" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10 text-muted-foreground text-sm"
                        data-ocid="admin.users.empty_state"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u, i) => (
                      <TableRow
                        key={u.userId}
                        data-ocid={`admin.user.item.${i + 1}`}
                      >
                        <TableCell className="font-medium">
                          {u.username}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {u.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {roleLabels[(u.role ?? "").toLowerCase()] ??
                              u.role ??
                              "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${u.isActive ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground"}`}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditTarget(u)}
                              data-ocid={`admin.edit.${i + 1}.button`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 hover:text-destructive"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                <span>{total} total users</span>
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
                  <span className="text-xs">
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

        {/* ── Roles Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="roles" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">
                Roles &amp; Permissions
              </h2>
            </div>
            {rolesLoading ? (
              <div className="space-y-3" data-ocid="admin.roles.loading_state">
                {[1, 2, 3].map((k) => (
                  <Skeleton key={k} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <RolePermissionsPanel roles={roles} />
            )}
          </div>
        </TabsContent>

        {/* ── Settings Tab ──────────────────────────────────────────────── */}
        <TabsContent value="settings" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Settings className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">
                System Settings &amp; School Profile
              </h2>
            </div>

            {settingsLoading ? (
              <div
                className="space-y-3 max-w-lg"
                data-ocid="admin.settings.loading_state"
              >
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
              </div>
            ) : (
              <div className="max-w-lg space-y-5">
                {/* ─ API Settings ─ */}
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    API Settings (PUT /admin/settings)
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">School Name</Label>
                    <Input
                      value={settingsForm.SchoolName}
                      onChange={(e) =>
                        setSettingsForm((f) => ({
                          ...f,
                          SchoolName: e.target.value,
                        }))
                      }
                      data-ocid="admin.school_name.input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Time Zone</Label>
                      <Input
                        value={settingsForm.TimeZone}
                        onChange={(e) =>
                          setSettingsForm((f) => ({
                            ...f,
                            TimeZone: e.target.value,
                          }))
                        }
                        placeholder="UTC"
                        data-ocid="admin.timezone.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Currency</Label>
                      <Input
                        value={settingsForm.Currency}
                        onChange={(e) =>
                          setSettingsForm((f) => ({
                            ...f,
                            Currency: e.target.value,
                          }))
                        }
                        placeholder="USD"
                        data-ocid="admin.currency.input"
                      />
                    </div>
                  </div>
                </div>

                {/* ─ Local Profile ─ */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Tagline / Motto</Label>
                  <Input
                    value={profileForm.tagline}
                    onChange={(e) =>
                      setProfileForm((f) => ({ ...f, tagline: e.target.value }))
                    }
                    data-ocid="admin.tagline.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Address</Label>
                  <Input
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder="123 School Road, City"
                    data-ocid="admin.address.input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder="+1 555 000 0000"
                      data-ocid="admin.phone.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Contact Email</Label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="info@school.edu"
                      data-ocid="admin.contact_email.input"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Website</Label>
                  <Input
                    value={profileForm.website}
                    onChange={(e) =>
                      setProfileForm((f) => ({ ...f, website: e.target.value }))
                    }
                    placeholder="https://school.edu"
                    data-ocid="admin.website.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Academic Year</Label>
                  <Input
                    value={profileForm.academicYear}
                    onChange={(e) =>
                      setProfileForm((f) => ({
                        ...f,
                        academicYear: e.target.value,
                      }))
                    }
                    data-ocid="admin.academic_year.input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Term Start</Label>
                    <Input
                      type="date"
                      value={profileForm.termStart}
                      onChange={(e) =>
                        setProfileForm((f) => ({
                          ...f,
                          termStart: e.target.value,
                        }))
                      }
                      data-ocid="admin.term_start.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Term End</Label>
                    <Input
                      type="date"
                      value={profileForm.termEnd}
                      onChange={(e) =>
                        setProfileForm((f) => ({
                          ...f,
                          termEnd: e.target.value,
                        }))
                      }
                      data-ocid="admin.term_end.input"
                    />
                  </div>
                </div>

                {/* Logo */}
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
                  {profileForm.logo && (
                    <div className="flex items-center gap-3 mt-2">
                      <img
                        src={profileForm.logo}
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

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Button
                    className="gap-2"
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
                    className="gap-2"
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

      {/* ── Add User Dialog ────────────────────────────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent data-ocid="admin.add_user.dialog">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Username</Label>
              <Input
                value={newUser.userName}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, userName: e.target.value }))
                }
                placeholder="jsmith"
                data-ocid="admin.user_username.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={newUser.fullName}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, fullName: e.target.value }))
                }
                placeholder="Jane Smith"
                data-ocid="admin.user_fullname.input"
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
                placeholder="jane@escola.com"
                data-ocid="admin.user_email.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser((u) => ({ ...u, role: v }))}
              >
                <SelectTrigger data-ocid="admin.user_role.select">
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
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, password: e.target.value }))
                }
                placeholder="Min 6 characters"
                data-ocid="admin.user_password.input"
              />
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
              data-ocid="admin.add_user.confirm_button"
            >
              {createUser.isPending ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ───────────────────────────────────────────── */}
      <EditUserDialog
        user={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />

      {/* ── Delete Confirmation ────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="admin.delete_user.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.username}</strong>? This action cannot be
              undone.
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
