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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type CreateStudentRequest,
  type UpdateStudentRequest,
  useCreateStudent,
  useDeleteStudent,
  useStudentDetail,
  useStudents,
  useUpdateStudent,
} from "@/hooks/useQueries";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Pencil,
  Phone,
  PlusCircle,
  Search,
  Trash2,
  UserSquare2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const CLASS_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
const SECTION_OPTIONS = [1, 2, 3, 4];

type AddForm = {
  name: string;
  rollNo: string;
  classId: string;
  sectionId: string;
  dob: string;
  gender: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
};

const EMPTY_ADD_FORM: AddForm = {
  name: "",
  rollNo: "",
  classId: "10",
  sectionId: "",
  dob: "",
  gender: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
};

function statusBadge(status: string) {
  if (status === "Active")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
        Active
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-xs">
      {status}
    </Badge>
  );
}

// ─── View Dialog ──────────────────────────────────────────────────────────────

function ViewStudentDialog({
  studentId,
  open,
  onClose,
}: {
  studentId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useStudentDetail(studentId ?? 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" data-ocid="students.view.dialog">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
        </DialogHeader>
        {isLoading || !data ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 py-2 pr-2">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserSquare2 className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base leading-tight">
                    {data.fullName}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {data.enrollmentNo}
                  </p>
                  <div className="mt-1">{statusBadge(data.status)}</div>
                </div>
              </div>
              <Separator />
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  {
                    label: "Class",
                    value: data.classId ? `Class ${data.classId}` : "–",
                  },
                  {
                    label: "Section",
                    value: data.sectionId ? `Section ${data.sectionId}` : "–",
                  },
                  {
                    label: "Gender",
                    value:
                      data.gender === "M"
                        ? "Male"
                        : data.gender === "F"
                          ? "Female"
                          : (data.gender ?? "–"),
                  },
                  { label: "Date of Birth", value: data.dateOfBirth ?? "–" },
                  { label: "Status", value: data.status },
                  {
                    label: "Enrolled",
                    value: new Date(data.createdAt).toLocaleDateString(),
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              {data.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{data.address}</span>
                </div>
              )}
              {/* Parents */}
              {data.parents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">
                        Parents / Guardians
                      </span>
                    </div>
                    <div className="space-y-2">
                      {data.parents.map((p) => (
                        <div
                          key={p.parentId}
                          className="bg-muted/40 rounded-lg p-3 text-sm space-y-1"
                        >
                          <p className="font-medium text-foreground">
                            {p.fullName}
                          </p>
                          {p.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{p.phone}</span>
                            </div>
                          )}
                          {p.email && (
                            <p className="text-muted-foreground">{p.email}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="students.view.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditStudentDialog({
  studentId,
  open,
  onClose,
}: {
  studentId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useStudentDetail(studentId ?? 0);
  const updateMutation = useUpdateStudent();

  const [form, setForm] = useState<UpdateStudentRequest>({});

  // Sync form with fetched data when dialog opens
  const effectiveForm: UpdateStudentRequest = {
    name: form.name ?? data?.fullName ?? "",
    rollNo: form.rollNo ?? "",
    classId: form.classId ?? data?.classId ?? undefined,
    sectionId: form.sectionId ?? data?.sectionId ?? undefined,
    dob: form.dob ?? data?.dateOfBirth ?? "",
    gender: form.gender ?? data?.gender ?? "",
    status: form.status ?? data?.status ?? "Active",
  };

  function handleSave() {
    if (!studentId) return;
    updateMutation.mutate(
      { id: studentId, payload: effectiveForm },
      {
        onSuccess: () => {
          toast.success("Student updated successfully");
          setForm({});
          onClose();
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setForm({});
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg" data-ocid="students.edit.dialog">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={effectiveForm.name ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Full name"
                data-ocid="students.edit.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Class</Label>
              <Select
                value={
                  effectiveForm.classId !== undefined
                    ? String(effectiveForm.classId)
                    : ""
                }
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, classId: Number(v) }))
                }
              >
                <SelectTrigger data-ocid="students.edit.class.select">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((c) => (
                    <SelectItem key={c} value={String(c)}>
                      Class {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Section</Label>
              <Select
                value={
                  effectiveForm.sectionId !== undefined
                    ? String(effectiveForm.sectionId)
                    : ""
                }
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, sectionId: Number(v) }))
                }
              >
                <SelectTrigger data-ocid="students.edit.section.select">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Section {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select
                value={effectiveForm.gender ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}
              >
                <SelectTrigger data-ocid="students.edit.gender.select">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={effectiveForm.status ?? "Active"}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger data-ocid="students.edit.status.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date of Birth
              </Label>
              <Input
                type="date"
                value={effectiveForm.dob ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dob: e.target.value }))
                }
                data-ocid="students.edit.dob.input"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setForm({});
              onClose();
            }}
            data-ocid="students.edit.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
            data-ocid="students.edit.save_button"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Add form
  const [form, setForm] = useState<AddForm>(EMPTY_ADD_FORM);

  const classParam = classFilter !== "all" ? Number(classFilter) : undefined;
  const sectionParam =
    sectionFilter !== "all" ? Number(sectionFilter) : undefined;

  const { data, isLoading } = useStudents({
    class: classParam,
    section: sectionParam,
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  const students = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const createMutation = useCreateStudent();
  const deleteMutation = useDeleteStudent();

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleClassChange(val: string) {
    setClassFilter(val);
    setPage(1);
  }

  function handleSectionChange(val: string) {
    setSectionFilter(val);
    setPage(1);
  }

  function handleAddSubmit() {
    if (!form.name.trim()) {
      toast.error("Full name is required");
      return;
    }
    const payload: CreateStudentRequest = {
      name: form.name.trim(),
      rollNo: form.rollNo.trim() || undefined,
      classId: Number(form.classId),
      sectionId: form.sectionId ? Number(form.sectionId) : undefined,
      dob: form.dob || undefined,
      gender: form.gender || undefined,
      parentInfo:
        form.parentName || form.parentPhone || form.parentEmail
          ? {
              name: form.parentName || undefined,
              phone: form.parentPhone || undefined,
              email: form.parentEmail || undefined,
            }
          : undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: (res) => {
        toast.success(`Student added — Enrollment No: ${res.enrollmentNo}`);
        setAddOpen(false);
        setForm(EMPTY_ADD_FORM);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.name} removed`);
        setDeleteTarget(null);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and manage all enrolled students
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setAddOpen(true)}
          data-ocid="students.add.open_modal_button"
        >
          <PlusCircle className="w-4 h-4" /> Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or enrollment no..."
            className="pl-9"
            data-ocid="students.search.search_input"
          />
        </div>
        <Select value={classFilter} onValueChange={handleClassChange}>
          <SelectTrigger className="w-36" data-ocid="students.class.select">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASS_OPTIONS.map((c) => (
              <SelectItem key={c} value={String(c)}>
                Class {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sectionFilter} onValueChange={handleSectionChange}>
          <SelectTrigger className="w-36" data-ocid="students.section.select">
            <SelectValue placeholder="All Sections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {SECTION_OPTIONS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                Section {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">
            Student Records{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({total})
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table data-ocid="students.table">
            <TableHeader>
              <TableRow>
                <TableHead>Enrollment No.</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="hidden sm:table-cell">Section</TableHead>
                <TableHead className="hidden md:table-cell">Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((k) => (
                  <TableRow key={`sk-${k}`} data-ocid="students.loading_state">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full max-w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div
                      className="text-center py-12 text-muted-foreground"
                      data-ocid="students.empty_state"
                    >
                      <UserSquare2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No students found</p>
                      <p className="text-xs mt-1">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s, i) => (
                  <TableRow
                    key={s.studentId}
                    className="hover:bg-muted/30 transition-colors"
                    data-ocid={`students.item.${(page - 1) * PAGE_SIZE + i + 1}`}
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {s.enrollmentNo}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {s.fullName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.classId ? `Class ${s.classId}` : "–"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {s.sectionId ? `Section ${s.sectionId}` : "–"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {s.gender === "M"
                        ? "Male"
                        : s.gender === "F"
                          ? "Female"
                          : (s.gender ?? "–")}
                    </TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setViewId(s.studentId)}
                          data-ocid={`students.view_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setEditId(s.studentId)}
                          data-ocid={`students.edit_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setDeleteTarget({
                              id: s.studentId,
                              name: s.fullName,
                            })
                          }
                          data-ocid={`students.delete_button.${(page - 1) * PAGE_SIZE + i + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sr-only">Delete</span>
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
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {total > 0
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} students`
              : "No students"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              data-ocid="students.pagination_prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-1">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              data-ocid="students.pagination_next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add Student Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(v) => {
          if (!v) {
            setAddOpen(false);
            setForm(EMPTY_ADD_FORM);
          } else setAddOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg" data-ocid="students.add.dialog">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="grid grid-cols-2 gap-4 py-2 pr-1">
              {/* Student info */}
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Aiden Clarke"
                  data-ocid="students.add.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Roll No. / Reg No.</Label>
                <Input
                  value={form.rollNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rollNo: e.target.value }))
                  }
                  placeholder="e.g. STU-001"
                  data-ocid="students.add.roll_no.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date of Birth</Label>
                <Input
                  type="date"
                  value={form.dob}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dob: e.target.value }))
                  }
                  data-ocid="students.add.dob.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Class *</Label>
                <Select
                  value={form.classId}
                  onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}
                >
                  <SelectTrigger data-ocid="students.add.class.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((c) => (
                      <SelectItem key={c} value={String(c)}>
                        Class {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Section</Label>
                <Select
                  value={form.sectionId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, sectionId: v }))
                  }
                >
                  <SelectTrigger data-ocid="students.add.section.select">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        Section {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                >
                  <SelectTrigger data-ocid="students.add.gender.select">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Parent info */}
              <div className="col-span-2">
                <Separator className="mb-3" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Parent / Guardian Info
                </p>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Parent / Guardian Name</Label>
                <Input
                  value={form.parentName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, parentName: e.target.value }))
                  }
                  placeholder="e.g. Charles Clarke"
                  data-ocid="students.add.parent_name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={form.parentPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, parentPhone: e.target.value }))
                  }
                  placeholder="+234 800 000 0000"
                  data-ocid="students.add.parent_phone.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={form.parentEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, parentEmail: e.target.value }))
                  }
                  placeholder="parent@email.com"
                  data-ocid="students.add.parent_email.input"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setForm(EMPTY_ADD_FORM);
              }}
              data-ocid="students.add.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubmit}
              disabled={createMutation.isPending || !form.name.trim()}
              data-ocid="students.add.submit_button"
            >
              {createMutation.isPending ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <ViewStudentDialog
        studentId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />

      {/* Edit Dialog */}
      <EditStudentDialog
        studentId={editId}
        open={editId !== null}
        onClose={() => setEditId(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="students.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="students.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              data-ocid="students.delete.confirm_button"
            >
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
