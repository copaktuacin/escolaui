/**
 * React Query hooks for EscolaUI — fully dynamic, zero hardcoded data.
 * All hooks call the live API via api.ts. No mock data, no isDemoMode().
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// ─── Shared response normalizers ─────────────────────────────────────────────

/** Extract any array from an unknown response, checking every common envelope key. */
function extractAnyArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    for (const key of [
      "data",
      "Data",
      "items",
      "Items",
      "results",
      "Results",
      "value",
      "Value",
      "list",
      "List",
      "records",
      "Records",
    ]) {
      if (Array.isArray(r[key])) return r[key] as unknown[];
    }
    const found = Object.values(r).find((v) => Array.isArray(v));
    if (found) return found as unknown[];
  }
  return [];
}

/**
 * Unwrap the .NET backend's { success: bool, data: ..., total: ... } envelope.
 * Called before extractAnyArray/extractTotal so downstream code always sees
 * the actual payload, never the outer envelope object.
 */
function unwrapSuccessEnvelope(raw: unknown): unknown {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    if ("success" in r && "data" in r) {
      return r.data ?? raw;
    }
  }
  return raw;
}

function extractTotal(raw: unknown, fallback: number): number {
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  return (
    (r.total as number | undefined) ??
    (r.Total as number | undefined) ??
    (r.totalCount as number | undefined) ??
    (r.TotalCount as number | undefined) ??
    (r.count as number | undefined) ??
    (r.Count as number | undefined) ??
    fallback
  );
}

function normalizeArray<T>(raw: unknown): T[] {
  return extractAnyArray(raw) as T[];
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardStats = {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSections: number;
  presentToday: number;
  absentToday: number;
  totalFeeCollected: number;
  pendingFees: number;
  totalAdmissions: number;
  pendingAdmissions: number;
  upcomingExams: number;
  activeOnlineClasses: number;
  totalNotifications: number;
  unreadNotifications: number;
  totalRevenue: number;
  attendanceRate: number;
};

export type AcademicYearDto = {
  // Primary ID field returned by the API
  academicYearId?: number;
  AcademicYearId?: number;
  // Legacy / fallback ID fields
  Id?: number;
  id?: number;
  YearLabel?: string;
  yearLabel?: string;
  StartDate?: string;
  startDate?: string;
  EndDate?: string;
  endDate?: string;
  IsCurrent?: boolean;
  isCurrent?: boolean;
  is_current?: boolean;
};

/** Extract the numeric ID from an AcademicYearDto regardless of field casing. */
export function getAcademicYearId(yr: AcademicYearDto): number {
  return yr.academicYearId ?? yr.AcademicYearId ?? yr.Id ?? yr.id ?? 0;
}

/** Return true if this year is marked as current (all casing variants). */
export function isCurrentYear(yr: AcademicYearDto): boolean {
  return (
    yr.isCurrent === true || yr.IsCurrent === true || yr.is_current === true
  );
}

export type ClassDto = {
  // Primary ID returned by /classes/academicYear/{id} endpoint
  classId?: number;
  ClassId?: number;
  // Legacy/fallback fields
  Id?: number;
  id?: number;
  // Primary name returned by API
  className?: string;
  ClassName?: string;
  GradeLevel?: number;
  gradeLevel?: number;
  AcademicYearId?: number;
  academicYearId?: number;
};

export type SectionDto = {
  Id: number;
  id?: number;
  SectionName: string;
  sectionName?: string;
  ClassId: number;
  classId?: number;
  Capacity?: number;
  capacity?: number;
};

export type StudentListItemDto = {
  studentId: number;
  enrollmentNo: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  classId?: number;
  sectionId?: string;
  status: string;
  createdAt: string;
};

export type StudentParentSimpleDto = {
  parentId: number;
  fullName: string;
  phone?: string;
  email?: string;
};

export type StudentDetailDto = {
  studentId: number;
  enrollmentNo: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  classId?: number;
  sectionId?: string;
  status: string;
  createdAt: string;
  photo?: string;
  address?: string;
  parents: StudentParentSimpleDto[];
};

export type CreateStudentRequest = {
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  ClassId: number;
  Section: string;
  RollNumber: string;
};

export type CreateStudentResponse = {
  studentId: number;
  enrollmentNo: string;
  fullName: string;
  classId: number;
  status: string;
};

export type UpdateStudentRequest = {
  name?: string;
  rollNo?: string;
  classId?: number;
  sectionId?: string;
  dob?: string;
  gender?: string;
  photo?: string;
  status?: string;
};

export type TeacherListItemDto = {
  teacherId: number;
  employeeCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  qualification?: string;
  joinDate?: string;
  status: string;
  createdAt: string;
};

export type TeacherDetailDto = {
  teacherId: number;
  userId: number;
  employeeCode: string;
  fullName: string;
  qualification?: string;
  joinDate?: string;
  status: string;
  createdAt: string;
  subjects: string[];
  roster: {
    studentId: number;
    studentName: string;
    classId?: number;
    sectionId?: string;
  }[];
};

export type CreateTeacherRequest = {
  FullName: string;
  Email: string;
  Phone: string;
  EmployeeCode: string;
  Password: string;
  JoinDate?: string;
};

export type UpdateTeacherRequest = {
  employeeCode?: string;
  qualification?: string;
  joinDate?: string;
  status?: string;
  FullName?: string;
  Email?: string;
  Phone?: string;
};

export type AttendanceSavePayload = {
  date: string;
  classId: number | string;
  sectionId?: string;
  records: {
    studentId: string | number;
    status: "present" | "absent" | "late";
  }[];
};

export type TimetableEntry = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | string;
  period: number;
  subject: string;
  teacher: string;
  room: string;
};

export type OnlineClassDto = {
  id: string;
  title: string;
  subject: string;
  teacher?: string;
  day?: string;
  time?: string;
  duration?: string;
  joinUrl?: string;
  joinLink?: string;
  scheduledAt?: string;
  status: "live" | "scheduled" | "ended";
  recordingUrl?: string;
  participants?: number;
};

export type UpdateOnlineClassRequest = {
  Title?: string;
  SubjectId?: number;
  ClassId?: number;
  SectionId?: number;
  ScheduledAt?: string;
  Platform?: string;
  TeacherId?: number;
  Status?: string;
};

export type CreateOnlineClassRequest = {
  title?: string;
  Title?: string;
  subject?: string;
  classId?: number;
  ClassId?: number;
  teacherId?: number;
  TeacherId?: number;
  scheduledAt?: string;
  ScheduledAt?: string;
  joinUrl?: string;
  status?: string;
  Status?: string;
  Platform?: string;
};

export type ExamDto = {
  id: string;
  name: string;
  subject?: string;
  classId?: number;
  sectionId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  maxMarks?: number;
  term?: string;
  status?: "Scheduled" | "Ongoing" | "Completed";
};

export type CreateExamRequest = {
  Name: string;
  Term: string;
  ClassId?: number;
  StartDate?: string;
  EndDate?: string;
};

export type ReportCardDto = {
  student: { id: string; name: string };
  term: string;
  grades: { subject: string; marks: number; grade: string }[];
  totalMarks?: number;
  percentage?: number;
};

export type GenerateReportCardRequest = {
  StudentId: number;
  Term: string;
  Weightings?: Record<string, number>;
};

export type NotificationDto = {
  id: string;
  date?: string;
  createdAt?: string;
  title: string;
  subject?: string;
  channel?: string[];
  recipients?: string;
  recipientType?: string;
  status: "delivered" | "failed" | "pending";
  read?: boolean;
  type?: "info" | "warning" | "success" | "error" | "payment" | "system";
};

export type StaffDto = {
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

export type AdminUserListItem = {
  userId: number;
  username: string;
  email?: string;
  role?: string;
  isActive: boolean;
};

export type CreateUserRequest = {
  userName: string;
  fullName: string;
  email: string;
  role: string;
  password: string;
};

export type UpdateUserRequest = {
  role?: string;
  active?: boolean;
};

export type RoleListItem = {
  roleId: number;
  roleName: string;
  permissions: string[];
};

export type AdminSettingsValues = {
  siteName?: string;
  maintenanceMode?: boolean;
  maxUploadSizeMB?: number;
  SchoolName?: string;
  TimeZone?: string;
  Currency?: string;
  values?: AdminSettingsValues;
  [key: string]: unknown;
};

export type Concession = {
  id: string;
  name: string;
  percentage: number;
};

export type Invoice = {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "paid" | "unpaid" | "overdue" | "partial" | "pending";
  grade?: string;
  description?: string;
  [key: string]: unknown;
};

export type GradebookEntry = {
  studentId: number;
  studentName: string;
  marks: { term: string; score: number }[];
  grade: string;
};

export type Application = {
  id: number;
  applicationNo: string;
  applicantName: string;
  dateOfBirth?: string;
  gender?: string;
  appliedClassId?: number;
  status: string;
  remarks?: string;
  createTs?: string;
};

/** Map a raw API object (any casing) to a normalized Application record. */
function normalizeApplicationItem(raw: unknown): Application {
  const r = raw as Record<string, unknown>;
  return {
    id:
      (r.id as number | undefined) ??
      (r.Id as number | undefined) ??
      (r.admissionId as number | undefined) ??
      (r.AdmissionId as number | undefined) ??
      0,
    applicationNo:
      (r.applicationNo as string | undefined) ??
      (r.ApplicationNo as string | undefined) ??
      "",
    applicantName:
      (r.applicantName as string | undefined) ??
      (r.ApplicantName as string | undefined) ??
      (r.studentName as string | undefined) ??
      (r.StudentName as string | undefined) ??
      (r.fullName as string | undefined) ??
      (r.FullName as string | undefined) ??
      (() => {
        const fn =
          (r.firstName as string | undefined) ??
          (r.FirstName as string | undefined) ??
          "";
        const ln =
          (r.lastName as string | undefined) ??
          (r.LastName as string | undefined) ??
          "";
        return fn ? `${fn}${ln ? ` ${ln}` : ""}`.trim() : "";
      })(),
    dateOfBirth:
      (r.dateOfBirth as string | undefined) ??
      (r.DateOfBirth as string | undefined),
    gender:
      (r.gender as string | undefined) ?? (r.Gender as string | undefined),
    appliedClassId:
      (r.appliedClassId as number | undefined) ??
      (r.AppliedClassId as number | undefined) ??
      (r.classId as number | undefined) ??
      (r.ClassId as number | undefined),
    status:
      (r.status as string | undefined) ??
      (r.Status as string | undefined) ??
      "Pending",
    remarks:
      (r.remarks as string | undefined) ?? (r.Remarks as string | undefined),
    createTs:
      (r.createTs as string | undefined) ??
      (r.createAt as string | undefined) ??
      (r.createdAt as string | undefined) ??
      (r.CreatedAt as string | undefined),
  };
}

// ─── Auth & User ──────────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api.get<Record<string, unknown>>("/auth/me");
      if (!res.success) throw new Error(res.error ?? "Failed to load user");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      try {
        const res = await api.get<unknown>("/dashboard/stats");
        if (res.success && res.data) {
          const d = res.data as Record<string, unknown>;
          const n = (key: string, fallbackKey?: string): number =>
            (d[key] as number | undefined) ??
            (fallbackKey
              ? (d[fallbackKey] as number | undefined)
              : undefined) ??
            0;
          return {
            totalStudents: n("totalStudents", "TotalStudents"),
            totalTeachers: n("totalTeachers", "TotalTeachers"),
            totalClasses: n("totalClasses", "TotalClasses"),
            totalSections: n("totalSections", "TotalSections"),
            presentToday: n("presentToday", "PresentToday"),
            absentToday: n("absentToday", "AbsentToday"),
            totalFeeCollected: n("totalFeeCollected", "TotalFeeCollected"),
            pendingFees: n("pendingFees", "PendingFees"),
            totalAdmissions: n("totalAdmissions", "TotalAdmissions"),
            pendingAdmissions: n("pendingAdmissions", "PendingAdmissions"),
            upcomingExams: n("upcomingExams", "UpcomingExams"),
            activeOnlineClasses: n(
              "activeOnlineClasses",
              "ActiveOnlineClasses",
            ),
            totalNotifications: n("totalNotifications", "TotalNotifications"),
            unreadNotifications: n(
              "unreadNotifications",
              "UnreadNotifications",
            ),
            totalRevenue:
              n("totalFeeCollected", "TotalFeeCollected") ||
              n("totalRevenue", "TotalRevenue"),
            attendanceRate:
              n("attendanceRate", "AttendanceRate") ||
              (n("presentToday", "PresentToday") +
                n("absentToday", "AbsentToday") >
              0
                ? Math.round(
                    (n("presentToday", "PresentToday") /
                      (n("presentToday", "PresentToday") +
                        n("absentToday", "AbsentToday"))) *
                      1000,
                  ) / 10
                : 0),
          };
        }
      } catch {
        // fall through to fallback
      }

      const [studentsRes, teachersRes] = await Promise.allSettled([
        api.get<unknown>("/students?page=1&limit=1"),
        api.get<unknown>("/teachers?page=1&limit=1"),
      ]);

      const getCount = (
        result: PromiseSettledResult<{ success: boolean; data: unknown }>,
      ) => {
        if (result.status !== "fulfilled" || !result.value.success) return 0;
        const raw = result.value.data as unknown;
        if (Array.isArray(raw)) return raw.length;
        if (raw && typeof raw === "object") {
          const r = raw as Record<string, unknown>;
          return (
            (r.total as number | undefined) ??
            (r.Total as number | undefined) ??
            (r.totalCount as number | undefined) ??
            (r.TotalCount as number | undefined) ??
            extractAnyArray(raw).length
          );
        }
        return 0;
      };

      return {
        totalStudents: getCount(studentsRes),
        totalTeachers: getCount(teachersRes),
        totalClasses: 0,
        totalSections: 0,
        presentToday: 0,
        absentToday: 0,
        totalFeeCollected: 0,
        pendingFees: 0,
        totalAdmissions: 0,
        pendingAdmissions: 0,
        upcomingExams: 0,
        activeOnlineClasses: 0,
        totalNotifications: 0,
        unreadNotifications: 0,
        totalRevenue: 0,
        attendanceRate: 0,
      };
    },
    staleTime: 60 * 1000,
  });
}

// ─── Academic Masters ─────────────────────────────────────────────────────────

export function useAcademicYears() {
  return useQuery<AcademicYearDto[]>({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const res = await api.get<unknown>("/academic-years");
      if (!res.success)
        throw new Error(res.error ?? "Failed to load academic years");
      return normalizeArray<AcademicYearDto>(unwrapSuccessEnvelope(res.data));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useClasses(academicYearId?: number | string) {
  return useQuery<ClassDto[]>({
    queryKey: ["classes", academicYearId],
    queryFn: async () => {
      if (!academicYearId) return [];
      const res = await api.get<unknown>(
        `/classes/academicYear/${academicYearId}`,
      );
      if (!res.success) throw new Error(res.error ?? "Failed to load classes");
      return normalizeArray<ClassDto>(unwrapSuccessEnvelope(res.data));
    },
    enabled: !!academicYearId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSections(classId?: number | string) {
  return useQuery<SectionDto[]>({
    queryKey: ["sections", classId],
    queryFn: async () => {
      if (!classId) return [];
      const res = await api.get<unknown>(`/sections/Class/${classId}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load sections");
      return normalizeArray<SectionDto>(unwrapSuccessEnvelope(res.data));
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      YearLabel: string;
      StartDate: string;
      EndDate: string;
      IsCurrent: boolean;
    }) => {
      const res = await api.post<unknown>("/academic-years", payload);
      if (!res.success)
        throw new Error(res.error ?? "Failed to create academic year");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academic-years"] }),
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ClassName: string;
      GradeLevel?: number;
      AcademicYearId: number;
    }) => {
      const res = await api.post<unknown>("/classes", payload);
      if (!res.success) throw new Error(res.error ?? "Failed to create class");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ClassId: number;
      SectionName: string;
      Capacity?: number;
    }) => {
      const res = await api.post<unknown>("/sections", payload);
      if (!res.success)
        throw new Error(res.error ?? "Failed to create section");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections"] }),
  });
}

// ─── Students ────────────────────────────────────────────────────────────────

export function useStudents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  classId?: number | string;
  section?: string;
}) {
  const { page = 1, limit = 20, search = "", classId, section } = params ?? {};
  return useQuery<{ data: StudentListItemDto[]; total: number }>({
    queryKey: ["students", page, limit, search, classId, section],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (search) qs.set("search", search);
      if (classId) qs.set("classId", String(classId));
      if (section) qs.set("section", section);
      const res = await api.get<unknown>(`/students?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load students");
      console.log(
        "[useStudents] raw API response:",
        JSON.stringify(res.data).substring(0, 500),
      );
      const payload = unwrapSuccessEnvelope(res.data);
      const rawArr = extractAnyArray(payload);
      const total =
        extractTotal(payload, rawArr.length) ||
        extractTotal(res.data, rawArr.length);
      const data: StudentListItemDto[] = rawArr.map((item) => {
        const r = item as Record<string, unknown>;
        const studentId =
          (r.studentId as number | undefined) ??
          (r.StudentId as number | undefined) ??
          (r.id as number | undefined) ??
          (r.Id as number | undefined) ??
          0;
        const enrollmentNo =
          (r.enrollmentNo as string | undefined) ??
          (r.EnrollmentNo as string | undefined) ??
          (r.enrollmentNumber as string | undefined) ??
          (r.admissionNo as string | undefined) ??
          "";
        const fullName =
          (r.fullName as string | undefined) ??
          (r.FullName as string | undefined) ??
          (r.name as string | undefined) ??
          (r.Name as string | undefined) ??
          (() => {
            const fn =
              (r.firstName as string | undefined) ??
              (r.FirstName as string | undefined) ??
              "";
            const ln =
              (r.lastName as string | undefined) ??
              (r.LastName as string | undefined) ??
              "";
            return fn ? `${fn}${ln ? ` ${ln}` : ""}`.trim() : "";
          })();
        return {
          studentId,
          enrollmentNo,
          fullName,
          dateOfBirth:
            (r.dateOfBirth as string | undefined) ??
            (r.DateOfBirth as string | undefined),
          gender:
            (r.gender as string | undefined) ??
            (r.Gender as string | undefined),
          classId:
            (r.classId as number | undefined) ??
            (r.ClassId as number | undefined),
          sectionId:
            (r.sectionId as string | undefined) ??
            (r.SectionId as string | undefined) ??
            (r.section as string | undefined) ??
            (r.Section as string | undefined),
          status:
            (r.status as string | undefined) ??
            (r.Status as string | undefined) ??
            (r.isActive === true || r.IsActive === true
              ? "Active"
              : r.isActive === false || r.IsActive === false
                ? "Inactive"
                : "Active"),
          createdAt:
            (r.createdAt as string | undefined) ??
            (r.CreatedAt as string | undefined) ??
            new Date().toISOString(),
        };
      });
      return { data, total };
    },
    staleTime: 60 * 1000,
  });
}

export function useStudentDetail(id: number) {
  return useQuery<StudentDetailDto>({
    queryKey: ["student", id],
    queryFn: async () => {
      const res = await api.get<StudentDetailDto>(`/students/${id}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Student not found");
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: CreateStudentRequest,
    ): Promise<CreateStudentResponse> => {
      const res = await api.post<CreateStudentResponse>("/students", payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to create student");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: { id: number; payload: UpdateStudentRequest }) => {
      const res = await api.put<StudentDetailDto>(`/students/${id}`, payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to update student");
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student", vars.id] });
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete<unknown>(`/students/${id}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to delete student");
      return { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

// ─── Teachers ────────────────────────────────────────────────────────────────

export function useTeachers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { page = 1, limit = 20, search = "" } = params ?? {};
  return useQuery<{ data: TeacherListItemDto[]; total: number }>({
    queryKey: ["teachers", page, limit, search],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (search) qs.set("search", search);
      console.log(
        "[Teachers] token present?",
        !!localStorage.getItem("accessToken"),
      );
      let rawResponse: unknown;
      try {
        const res = await api.get<unknown>(`/teachers?${qs}`);
        console.log(
          "[Teachers] raw response:",
          JSON.stringify(res).slice(0, 800),
        );
        if (!res.success)
          throw new Error(res.error ?? "Failed to load teachers");
        rawResponse = unwrapSuccessEnvelope(res.data);
      } catch (err) {
        console.error("[Teachers] fetch failed:", err);
        throw err;
      }

      // ── Robust array extraction ──────────────────────────────────────────
      // Handles: plain array, {data:[]}, {Data:[]}, {items:[]}, {Items:[]},
      // {value:[]}, {teachers:[]}, {Teachers:[]}, {$values:[]},
      // as well as nested envelopes where authFetch already unwrapped one level.
      function extractArr(raw: unknown): Record<string, unknown>[] {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        if (raw && typeof raw === "object") {
          const r = raw as Record<string, unknown>;
          for (const key of [
            "data",
            "Data",
            "items",
            "Items",
            "value",
            "Value",
            "teachers",
            "Teachers",
            "results",
            "Results",
            "list",
            "List",
            "records",
            "Records",
            "$values",
          ]) {
            if (Array.isArray(r[key]))
              return r[key] as Record<string, unknown>[];
          }
          // Last resort: find the first array-valued property
          const found = Object.values(r).find((v) => Array.isArray(v));
          if (found) return found as Record<string, unknown>[];
        }
        return [];
      }

      const arr = extractArr(rawResponse);
      const total = extractTotal(rawResponse, arr.length);

      console.log(`[Teachers] resolved ${arr.length} teachers, total=${total}`);

      const data: TeacherListItemDto[] = arr.map((r) => ({
        teacherId:
          (r.teacherId as number | undefined) ??
          (r.TeacherId as number | undefined) ??
          (r.id as number | undefined) ??
          (r.Id as number | undefined) ??
          0,
        employeeCode:
          (r.employeeCode as string | undefined) ??
          (r.EmployeeCode as string | undefined) ??
          "",
        fullName:
          (r.fullName as string | undefined) ??
          (r.FullName as string | undefined) ??
          (r.name as string | undefined) ??
          (r.Name as string | undefined) ??
          (() => {
            const fn =
              (r.firstName as string | undefined) ??
              (r.FirstName as string | undefined) ??
              "";
            const ln =
              (r.lastName as string | undefined) ??
              (r.LastName as string | undefined) ??
              "";
            return fn ? `${fn}${ln ? ` ${ln}` : ""}`.trim() : "";
          })(),
        email:
          (r.email as string | undefined) ?? (r.Email as string | undefined),
        phone:
          (r.phone as string | undefined) ?? (r.Phone as string | undefined),
        qualification:
          (r.qualification as string | undefined) ??
          (r.Qualification as string | undefined),
        joinDate:
          (r.joinDate as string | undefined) ??
          (r.JoinDate as string | undefined),
        status:
          (r.status as string | undefined) ??
          (r.Status as string | undefined) ??
          (r.isActive === true || r.IsActive === true ? "Active" : "Inactive"),
        createdAt:
          (r.createdAt as string | undefined) ??
          (r.CreatedAt as string | undefined) ??
          new Date().toISOString(),
      }));
      return { data, total };
    },
    staleTime: 60 * 1000,
  });
}

export function useTeacherDetail(id: number) {
  return useQuery<TeacherDetailDto>({
    queryKey: ["teacher", id],
    queryFn: async () => {
      const res = await api.get<TeacherDetailDto>(`/teachers/${id}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load teacher");
      return res.data;
    },
    enabled: id > 0,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateTeacherRequest) => {
      const res = await api.post<{ teacherId: number }>("/teachers", body);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to create teacher");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: { id: number; body: UpdateTeacherRequest }) => {
      const res = await api.put<unknown>(`/teachers/${id}`, body);
      if (!res.success)
        throw new Error(res.error ?? "Failed to update teacher");
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["teacher", vars.id] });
    },
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete<unknown>(`/teachers/${id}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to delete teacher");
      return { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export function useAttendance(
  classId: string | number,
  sectionId: string,
  date: string,
) {
  return useQuery<{ studentId: string; status: string }[]>({
    queryKey: ["attendance", classId, sectionId, date],
    queryFn: async () => {
      const qs = new URLSearchParams({
        classId: String(classId),
        sectionId,
        date,
      });
      const res = await api.get<unknown>(`/attendance?${qs}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to load attendance");
      return normalizeArray<{ studentId: string; status: string }>(res.data);
    },
    enabled: !!classId && !!sectionId && !!date,
    staleTime: 60 * 1000,
  });
}

export function useSubmitAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AttendanceSavePayload) => {
      const res = await api.post<unknown>("/attendance", payload);
      if (!res.success)
        throw new Error(res.error ?? "Failed to save attendance");
      return res.data ?? { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

// ─── Fees ─────────────────────────────────────────────────────────────────────

export function useFees(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { page = 1, limit = 20, search = "" } = params ?? {};
  return useQuery<{ data: Invoice[]; total: number }>({
    queryKey: ["fees", page, limit, search],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (search) qs.set("search", search);
      const res = await api.get<unknown>(`/fees?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load fees");
      const feePayload = unwrapSuccessEnvelope(res.data);
      const arr = normalizeArray<Invoice>(feePayload);
      return {
        data: arr,
        total:
          extractTotal(feePayload, arr.length) ||
          extractTotal(res.data, arr.length),
      };
    },
    staleTime: 60 * 1000,
  });
}

export function useFeePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post<unknown>("/fees/payment", payload);
      if (!res.success) throw new Error(res.error ?? "Payment failed");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useFeeConcessions() {
  return useQuery<Concession[]>({
    queryKey: ["fees", "concessions"],
    queryFn: async () => {
      const res = await api.get<unknown>("/fees/concessions");
      if (!res.success)
        throw new Error(res.error ?? "Failed to load concessions");
      return normalizeArray<Concession>(unwrapSuccessEnvelope(res.data));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** @deprecated use useFeeConcessions() */
export const useConcessions = useFeeConcessions;
// ─── Schedule / Timetable ─────────────────────────────────────────────────────

export function useTimetable(classId: string | number, sectionId: string) {
  return useQuery<TimetableEntry[]>({
    queryKey: ["timetable", classId, sectionId],
    queryFn: async () => {
      const qs = new URLSearchParams({ classId: String(classId), sectionId });
      const res = await api.get<unknown>(`/timetable?${qs}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to load timetable");
      return normalizeArray<TimetableEntry>(unwrapSuccessEnvelope(res.data));
    },
    enabled: !!classId && !!sectionId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: { id: string | number; payload: Record<string, unknown> }) => {
      const res = await api.put<unknown>(`/timetable/${id}`, payload);
      if (!res.success)
        throw new Error(res.error ?? "Failed to update timetable");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
}

// ─── Online Classes ───────────────────────────────────────────────────────────

export function useOnlineClasses(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = params ?? {};
  return useQuery<OnlineClassDto[]>({
    queryKey: ["online-classes", page, limit],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const res = await api.get<unknown>(`/online-classes?${qs}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to load online classes");
      return normalizeArray<OnlineClassDto>(unwrapSuccessEnvelope(res.data));
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateOnlineClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateOnlineClassRequest) => {
      const res = await api.post<OnlineClassDto>("/online-classes", payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to create online class");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["online-classes"] }),
  });
}

export function useUpdateOnlineClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: string | number; data: UpdateOnlineClassRequest }) => {
      const res = await api.put<OnlineClassDto>(`/online-classes/${id}`, data);
      if (!res.success)
        throw new Error(res.error ?? "Failed to update online class");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["online-classes"] }),
  });
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export function useExams(params?: {
  page?: number;
  limit?: number;
  term?: string;
}) {
  const { page = 1, limit = 50, term } = params ?? {};
  return useQuery<ExamDto[]>({
    queryKey: ["exams", page, limit, term],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (term) qs.set("term", term);
      const res = await api.get<unknown>(`/exams?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load exams");
      return normalizeArray<ExamDto>(unwrapSuccessEnvelope(res.data));
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateExamRequest) => {
      const res = await api.post<unknown>("/exams", payload);
      if (!res.success) throw new Error(res.error ?? "Failed to create exam");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: { id: string | number; payload: Partial<CreateExamRequest> }) => {
      const res = await api.put<unknown>(`/exams/${id}`, payload);
      if (!res.success) throw new Error(res.error ?? "Failed to update exam");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const res = await api.delete<unknown>(`/exams/${id}`);
      if (!res.success) throw new Error(res.error ?? "Failed to delete exam");
      return { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

// ─── Report Cards ─────────────────────────────────────────────────────────────

export function useReportCards(params?: {
  page?: number;
  studentId?: number | string;
}) {
  const { page = 1, studentId } = params ?? {};
  return useQuery<ReportCardDto[]>({
    queryKey: ["report-cards", page, studentId],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page) });
      if (studentId) qs.set("studentId", String(studentId));
      const res = await api.get<unknown>(`/report-cards?${qs}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to load report cards");
      return normalizeArray<ReportCardDto>(res.data);
    },
    staleTime: 60 * 1000,
  });
}

export function useGenerateReportCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GenerateReportCardRequest) => {
      const res = await api.post<{
        ReportCard?: ReportCardDto;
        reportCard?: ReportCardDto;
      }>("/report-cards/generate", payload);
      if (!res.success)
        throw new Error(res.error ?? "Failed to generate report card");
      return res.data?.ReportCard ?? res.data?.reportCard ?? res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-cards"] }),
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useNotifications(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = params ?? {};
  return useQuery<NotificationDto[]>({
    queryKey: ["notifications", page, limit],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const res = await api.get<unknown>(`/notifications?${qs}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to load notifications");
      return normalizeArray<NotificationDto>(unwrapSuccessEnvelope(res.data));
    },
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put<unknown>(`/notifications/${id}/read`, {});
      if (!res.success) throw new Error(res.error ?? "Failed to mark as read");
      return { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.put<unknown>("/notifications/read-all", {});
      if (!res.success)
        throw new Error(res.error ?? "Failed to mark all as read");
      return { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ─── HR & Payroll ─────────────────────────────────────────────────────────────

export function useHRStaff(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = params ?? {};
  return useQuery<StaffDto[]>({
    queryKey: ["hr-staff", page, limit],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const res = await api.get<unknown>(`/hr/staff?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load staff");
      return normalizeArray<StaffDto>(unwrapSuccessEnvelope(res.data));
    },
    staleTime: 60 * 1000,
  });
}

export function useHRPayroll(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = params ?? {};
  return useQuery<StaffDto[]>({
    queryKey: ["hr-payroll", page, limit],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const res = await api.get<unknown>(`/hr/payroll?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load payroll");
      return normalizeArray<StaffDto>(unwrapSuccessEnvelope(res.data));
    },
    staleTime: 60 * 1000,
  });
}

export function usePayrollSlip(staffId: string | number) {
  return useQuery({
    queryKey: ["hr-payslip", staffId],
    queryFn: async () => {
      const res = await api.get<unknown>(`/hr/payroll/${staffId}/payslip`);
      if (!res.success) throw new Error(res.error ?? "Failed to load payslip");
      return res.data;
    },
    enabled: !!staffId,
  });
}

// ─── Admissions ───────────────────────────────────────────────────────────────

export function useAdmissions(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { page = 1, limit = 20, search = "" } = params ?? {};
  return useQuery<{ data: Application[]; total: number }>({
    queryKey: ["admissions", page, limit, search],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) qs.set("search", search);

      const res = await api.get<unknown>(`/admissions?${qs}`);
      const rawData = res.success ? res.data : null;

      if (!rawData) {
        // Fallback to /students if /admissions fails
        const fallback = await api.get<unknown>(`/students?${qs}`);
        if (!fallback.success)
          throw new Error(fallback.error ?? "Failed to load admissions");
        const unwrappedFb = unwrapSuccessEnvelope(fallback.data);
        const arrFb = extractAnyArray(unwrappedFb);
        return {
          data: arrFb.map(normalizeApplicationItem),
          total:
            extractTotal(unwrappedFb, arrFb.length) ||
            extractTotal(fallback.data, arrFb.length),
        };
      }

      // Unwrap { success, data, total } envelope if present, then extract array
      const unwrapped = unwrapSuccessEnvelope(rawData);
      const arr = Array.isArray(unwrapped)
        ? unwrapped
        : extractAnyArray(unwrapped);

      return {
        data: arr.map(normalizeApplicationItem),
        total:
          extractTotal(unwrapped, arr.length) ||
          extractTotal(rawData, arr.length) ||
          arr.length,
      };
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ApplicationNo?: string;
      ApplicantName: string;
      DateOfBirth?: string;
      Gender?: string;
      AppliedClassId?: number;
      Status: string;
      Remarks?: string;
      AdmissionParents?: Array<{
        ParentType: string;
        Name: string;
        Email: string;
        Phone: string;
        Occupation: string;
        Relationship: string;
      }>;
      AdmissionDocuments?: Array<{
        DocumentType: string;
        FileUrl: string;
      }>;
    }) => {
      const res = await api.post<unknown>("/admissions", payload);
      if (!res.success) {
        throw new Error(res.error ?? "Failed to create admission");
      }
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: Error) => {
      console.error("[useCreateAdmission] API error:", error.message);
    },
  });
}

export function useUpdateAdmissionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: { id: string | number; status: string }) => {
      const res = await api.put<unknown>(`/admissions/${id}/status`, {
        status,
      });
      if (res.success) return res.data;
      const fallback = await api.put<unknown>(`/students/${id}`, { status });
      if (!fallback.success)
        throw new Error(fallback.error ?? "Failed to update status");
      return fallback.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) {
  const { page = 1, limit = 20, search = "" } = params ?? {};
  return useQuery<{ data: AdminUserListItem[]; total: number }>({
    queryKey: ["admin", "users", page, limit, search],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) qs.set("search", search);
      if ((params as { role?: string } | undefined)?.role)
        qs.set("role", (params as { role?: string }).role!);
      const res = await api.get<unknown>(`/admin/users?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load users");
      const arr = normalizeArray<AdminUserListItem>(res.data);
      return { data: arr, total: extractTotal(res.data, arr.length) };
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserRequest) => {
      const res = await api.post<{ userId: number }>("/admin/users", payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to create user");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminRoles() {
  return useQuery<RoleListItem[]>({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const res = await api.get<unknown>("/admin/roles");
      if (!res.success) throw new Error(res.error ?? "Failed to load roles");
      return normalizeArray<RoleListItem>(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const res = await api.put<unknown>(`/admin/roles/${id}`, { role });
      if (!res.success) throw new Error(res.error ?? "Failed to update role");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete<unknown>(`/admin/users/${id}`);
      if (!res.success) throw new Error(res.error ?? "Failed to delete user");
      return { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminSettings() {
  return useQuery<{ values: AdminSettingsValues }>({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const res = await api.get<unknown>("/admin/settings");
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load settings");
      const d = res.data as Record<string, unknown>;
      // Normalize: if response has a 'values' key return as-is, else wrap it
      if (d.values && typeof d.values === "object") {
        return { values: d.values as AdminSettingsValues };
      }
      return { values: d as AdminSettingsValues };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const res = await api.put<unknown>("/admin/settings", values);
      if (!res.success)
        throw new Error(res.error ?? "Failed to update settings");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings"] }),
  });
}

// ─── Platform Admin (TenantSettings) ─────────────────────────────────────────

export type TenantDto = {
  Id?: number;
  id?: number;
  TenantId?: number;
  tenantId?: number;
  SchoolId?: number;
  schoolId?: number;
  SchoolName?: string;
  schoolName?: string;
  AdminEmail?: string;
  adminEmail?: string;
  SubscriptionPlan?: string;
  subscriptionPlan?: string;
  IsActive?: boolean;
  isActive?: boolean;
  CreatedAt?: string;
  createdAt?: string;
  PrincipalName?: string;
  principalName?: string;
  SchoolUsername?: string;
  schoolUsername?: string;
  AdminPhone?: string;
  adminPhone?: string;
  PrincipalEmail?: string;
  principalEmail?: string;
};

export type CreateTenantPayload = {
  SchoolName: string;
  SchoolAcronym?: string;
  Address?: string;
  Phone?: string;
  Email: string;
  Motto?: string;
  Website?: string;
  Logo?: string;
  SubscriptionPlan?: string;
  PrincipalName: string;
  SchoolUsername: string;
  PrincipalEmail: string;
  PrincipalPassword: string;
  RoleId?: number;
};

export type PaymentSummary = {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
};

export function usePlatformTenants(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = params ?? {};
  return useQuery<{ data: TenantDto[]; total: number }>({
    queryKey: ["platform", "tenants", page, limit],
    queryFn: async () => {
      const res = await api.get<unknown>(
        `/TenantSettings/admin/tenants?page=${page}&limit=${limit}`,
      );
      if (!res.success) throw new Error(res.error ?? "Failed to load tenants");
      const unwrapped = unwrapSuccessEnvelope(res.data);
      const arr = normalizeArray<TenantDto>(unwrapped);
      return {
        data: arr,
        total:
          extractTotal(unwrapped, arr.length) ||
          extractTotal(res.data, arr.length),
      };
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTenantPayload) => {
      const res = await api.post<TenantDto>(
        "/TenantSettings/admin/tenants",
        payload,
      );
      if (!res.success) throw new Error(res.error ?? "Failed to create tenant");
      return res.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["platform", "tenants"] }),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: { id: number; payload: Record<string, unknown> }) => {
      const res = await api.put<TenantDto>(
        `/TenantSettings/admin/tenants/${id}`,
        payload,
      );
      if (!res.success) throw new Error(res.error ?? "Failed to update tenant");
      return res.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["platform", "tenants"] }),
  });
}

export function useToggleTenantActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await api.put<unknown>(
        `/TenantSettings/admin/tenants/${id}`,
        { IsActive: isActive },
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to toggle tenant status");
      return res.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["platform", "tenants"] }),
  });
}

export function usePaymentSummary() {
  return useQuery<PaymentSummary>({
    queryKey: ["platform", "payment-summary"],
    queryFn: async () => {
      const res = await api.get<PaymentSummary>(
        "/TenantSettings/admin/payments-summary",
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load payment summary");
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useSendReminders() {
  return useMutation({
    mutationFn: async ({
      tenantIds,
      message,
    }: { tenantIds: number[]; message: string }) => {
      const res = await api.post<{ success: boolean; sentCount: number }>(
        "/TenantSettings/admin/reminders",
        { tenantIds, message },
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to send reminders");
      return res.data;
    },
  });
}

export function useReminderLog(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = params ?? {};
  return useQuery({
    queryKey: ["platform", "reminders", page, limit],
    queryFn: async () => {
      const res = await api.get<unknown>(
        `/TenantSettings/admin/reminders?page=${page}&limit=${limit}`,
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to load reminder log");
      return normalizeArray(unwrapSuccessEnvelope(res.data));
    },
    staleTime: 60 * 1000,
  });
}

export function useResetPrincipalPassword() {
  return useMutation({
    mutationFn: async ({
      id,
      newPassword,
    }: { id: number; newPassword: string }) => {
      const res = await api.post<{ success: boolean }>(
        `/TenantSettings/admin/tenants/${id}/reset-password`,
        { newPassword },
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to reset password");
      return res.data;
    },
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      plan,
      expiryDate,
      status,
    }: {
      id: number;
      plan: string;
      expiryDate: string;
      status: string;
    }) => {
      const res = await api.put<unknown>(
        `/TenantSettings/admin/tenants/${id}/subscription`,
        { plan, expiryDate, status },
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to update subscription");
      return res.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["platform", "tenants"] }),
  });
}

export type CreateLessonPlanRequest = {
  subjectId: number;
  classId: number;
  lessonDate: string;
  objectives?: string;
  content?: string;
  resources?: string;
};

/** Compat type for platform admin pages that use camelCase field names */
export type UpdateTenantPayload = {
  isActive?: boolean;
  IsActive?: boolean;
  subscriptionPlan?: string;
  SubscriptionPlan?: string;
  domain?: string;
  Domain?: string;
  adminEmail?: string;
  AdminEmail?: string;
  schoolName?: string;
  SchoolName?: string;
  principalName?: string;
  PrincipalName?: string;
  schoolUsername?: string;
  SchoolUsername?: string;
  adminPhone?: string;
  AdminPhone?: string;
};

// ─── Legacy aliases — kept so existing pages don't break ─────────────────────

/** @deprecated use useStudents() — returns Student[] shape for AttendancePage compat */
export function useStudentsForClass(cls: string, section = "") {
  return useQuery<import("../lib/mockData").Student[]>({
    queryKey: ["students-for-class", cls, section],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (cls) qs.set("classId", cls.replace(/[^0-9]/g, "") || cls);
      if (section) qs.set("section", section);
      const res = await api.get<unknown>(`/students?${qs}`);
      if (!res.success) return [];
      const arr = normalizeArray<Record<string, unknown>>(res.data);
      return arr.map((r) => ({
        id: String(
          (r.studentId as string | number | undefined) ??
            (r.StudentId as string | number | undefined) ??
            (r.id as string | number | undefined) ??
            "",
        ),
        name:
          (r.fullName as string | undefined) ??
          (r.FullName as string | undefined) ??
          (r.name as string | undefined) ??
          "",
        grade:
          (r.classId as string | undefined) ??
          (r.ClassId as string | undefined) ??
          cls,
        class: cls,
        rollNo: Number(
          (r.rollNumber as string | number | undefined) ??
            (r.RollNumber as string | number | undefined) ??
            (r.rollNo as string | number | undefined) ??
            0,
        ),
      }));
    },
    enabled: !!cls,
  });
}

// Allow legacy { class: number } param shape used by StudentsPage
export function useStudents_compat(params: {
  class?: number;
  classId?: number | string;
  section?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useStudents({
    classId: params.classId ?? params.class,
    section: params.section,
    page: params.page,
    limit: params.limit,
    search: params.search,
  });
}

/** @deprecated use useStudents() */
export function useStudentsForIDCards(params?: {
  classId?: number;
  sectionId?: string;
}) {
  return useStudents({
    classId: params?.classId,
    section: params?.sectionId,
    limit: 100,
  });
}

/** @deprecated use useStudents() */
export const useStudents_v2 = useStudents;

/** @deprecated use useTimetable() */
export function useSchedule(classId: number, sectionId = "A") {
  return useTimetable(classId, sectionId);
}

/** @deprecated use useFees() */
export function useInvoices(params: {
  studentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<{ data: Invoice[]; total: number }>({
    queryKey: [
      "invoices",
      params.studentId,
      params.status,
      params.page,
      params.limit,
    ],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.studentId) qs.set("studentId", params.studentId);
      if (params.status && params.status !== "all")
        qs.set("status", params.status);
      qs.set("page", String(params.page ?? 1));
      qs.set("limit", String(params.limit ?? 20));
      const res = await api.get<unknown>(`/fees/invoices?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load invoices");
      const arr = normalizeArray<Invoice>(res.data);
      return { data: arr, total: extractTotal(res.data, arr.length) };
    },
  });
}

/** @deprecated use useTeachers() */
export function useTeacherGradebook(
  teacherId: number,
  params: { class?: number; subject?: number; term?: string },
) {
  return useQuery<{ data: GradebookEntry[] }>({
    queryKey: [
      "teacher-gradebook",
      teacherId,
      params.class,
      params.subject,
      params.term,
    ],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.class !== undefined) qs.set("class", String(params.class));
      if (params.subject !== undefined)
        qs.set("subject", String(params.subject));
      if (params.term) qs.set("term", params.term);
      const res = await api.get<{ data: GradebookEntry[] }>(
        `/teachers/${teacherId}/gradebook?${qs}`,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load gradebook");
      return res.data;
    },
    enabled: teacherId > 0,
  });
}

/** @deprecated use useHRStaff() */
export function useHRStaff_v1() {
  return useHRStaff();
}

/** @deprecated use useHRPayroll() */
export function usePayroll(params?: { month?: number; year?: number }) {
  return useQuery<StaffDto[]>({
    queryKey: ["hr-payroll-legacy", params?.month, params?.year],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.month) qs.set("month", String(params.month));
      if (params?.year) qs.set("year", String(params.year));
      const res = await api.get<unknown>(`/hr/payroll?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load payroll");
      return normalizeArray<StaffDto>(unwrapSuccessEnvelope(res.data));
    },
  });
}

/** @deprecated use useNotifications().markAllRead */
export const useMarkAllNotificationsRead = useMarkAllRead;

/** @deprecated */
export function useAttendanceRecords(date: string, cls: string, section = "") {
  return useAttendance(cls, section, date);
}

/** @deprecated */
export function useSaveAttendance() {
  return useSubmitAttendance();
}

/** @deprecated */
export function useAdmissions_legacy(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useAdmissions(params);
}

/** @deprecated */
export function useExamResults(examId: string | number | null) {
  return useQuery({
    queryKey: ["exam-results", examId],
    queryFn: async () => {
      if (!examId) return [];
      const res = await api.get<unknown>(`/exams/${examId}/results`);
      if (!res.success) throw new Error(res.error ?? "Failed to load results");
      return normalizeArray(res.data);
    },
    enabled: !!examId,
  });
}

/** @deprecated */
export const useCreateUser = useCreateAdminUser;

/** @deprecated */
export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { amount: number; method: string; transactionId: string };
    }) => {
      const res = await api.post<unknown>(`/fees/invoices/${id}/pay`, {
        amount: payload.amount,
        paymentMethod: payload.method,
        transactionId: payload.transactionId || undefined,
      });
      if (!res.success) throw new Error(res.error ?? "Payment failed");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

/** @deprecated */
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: { id: number; payload: UpdateUserRequest }) => {
      const res = await api.put<unknown>(`/admin/users/${id}`, payload);
      if (!res.success) throw new Error(res.error ?? "Failed to update user");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

/** @deprecated */
export const useDeleteUser = useDeleteAdminUser;

/** @deprecated */
export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      permissionIds,
    }: { id: number; permissionIds: number[] }) => {
      const res = await api.put<unknown>(`/admin/roles/${id}`, {
        permissionIds,
      });
      if (!res.success) throw new Error(res.error ?? "Failed to update role");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });
}

/** @deprecated use useUpdateAdminSettings() */
export const useUpdateAdminSettings_v1 = useUpdateAdminSettings;

/** @deprecated */
export function useScheduleClashes(classId: number, sectionId = "A") {
  return useQuery<{ day: string; period: number; conflict: string }[]>({
    queryKey: ["timetable", "clashes", classId, sectionId],
    queryFn: async () => {
      const qs = new URLSearchParams({ classId: String(classId), sectionId });
      const res = await api.get<unknown>(`/schedule/clashes?${qs}`);
      if (!res.success) return [];
      return normalizeArray(res.data);
    },
    enabled: !!classId,
  });
}

/** @deprecated use useUpdateTimetable() */
export function useUpdateScheduleSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: string | number;
      payload: Record<string, unknown>;
      classId?: number | string;
      sectionId?: string;
    }) => {
      const res = await api.put<TimetableEntry>(
        `/timetable/${vars.id}`,
        vars.payload,
      );
      if (!res.success) throw new Error(res.error ?? "Failed to update slot");
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["timetable", vars.classId, vars.sectionId],
      });
    },
  });
}

/** @deprecated use useHRPayroll() */
export function useProcessPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post<unknown>("/hr/payroll/process", payload);
      if (!res.success)
        throw new Error(res.error ?? "Failed to process payroll");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-payroll"] }),
  });
}

/** @deprecated */
export function usePayslip(staffId: string, _month: string) {
  return usePayrollSlip(staffId);
}

/** @deprecated */
export function useStudentReportCard(studentId: number | string, term: string) {
  return useQuery<unknown>({
    queryKey: ["report-cards", "student", studentId, term],
    queryFn: async () => {
      const qs = new URLSearchParams({ term });
      const res = await api.get<unknown>(`/report-cards/${studentId}?${qs}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to load report card");
      return res.data;
    },
    enabled: !!studentId && !!term,
  });
}

/** @deprecated */
export function useVerifyAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      remarks,
    }: { id: string; status: string; remarks?: string }) => {
      const res = await api.post<unknown>(`/admissions/${id}/verify`, {
        status,
        remarks,
      });
      if (!res.success) throw new Error(res.error ?? "Verify failed");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admissions"] }),
  });
}

/** @deprecated */
export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post<{
        id: string;
        enrollmentId: string;
        status: string;
      }>("/admissions", payload);
      if (!res.success) throw new Error(res.error ?? "Submission failed");
      return res.data ?? { id: "", enrollmentId: "", status: "pending" };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admissions"] }),
  });
}

/** @deprecated */
export function useUploadDocument() {
  return useMutation({
    mutationFn: async ({
      id,
      file,
      type,
    }: { id: string; file: File; type: string }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `https://escola.doorstepgarage.in/api/admissions/${id}/documents`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        },
      );
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      return json.data ?? json;
    },
  });
}

/** @deprecated */
export function useAttendanceStats(classId: number, month: string) {
  return useQuery({
    queryKey: ["attendance", "stats", classId, month],
    queryFn: async () => {
      const qs = new URLSearchParams({ classId: String(classId), month });
      const res = await api.get<unknown>(`/attendance/stats?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load stats");
      return res.data;
    },
    enabled: !!classId && !!month,
  });
}

/** @deprecated */
export function useCreateLessonPlan() {
  return useMutation<
    { lessonPlanId: number },
    Error,
    { teacherId: number; body: Record<string, unknown> }
  >({
    mutationFn: async ({ teacherId, body }) => {
      const res = await api.post<{ lessonPlanId: number }>(
        `/teachers/${teacherId}/lesson-plan`,
        body,
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to create lesson plan");
      return (res.data ?? { lessonPlanId: 0 }) as { lessonPlanId: number };
    },
  });
}

/** @deprecated */
/** @deprecated */
export function useUpcomingEvents(limit = 5) {
  return useQuery<
    { id: string; title: string; date?: string; time?: string; type?: string }[]
  >({
    queryKey: ["events", "upcoming", limit],
    queryFn: async () => {
      const res = await api.get<unknown>(`/events/upcoming?limit=${limit}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load events");
      return normalizeArray<{
        id: string;
        title: string;
        date?: string;
        time?: string;
        type?: string;
      }>(res.data);
    },
  });
}

/** @deprecated */
export function useRecentFeeActivities(limit = 10) {
  return useQuery<
    {
      id: string;
      student?: string;
      amount?: number;
      date?: string;
      status?: string;
      type?: string;
    }[]
  >({
    queryKey: ["fees", "recent", limit],
    queryFn: async () => {
      const res = await api.get<unknown>(`/fees/recent?limit=${limit}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to load fee activities");
      return normalizeArray<{
        id: string;
        student?: string;
        amount?: number;
        date?: string;
        status?: string;
        type?: string;
      }>(res.data);
    },
  });
}

/** @deprecated */
export function useDashboardChart(period: "monthly" | "weekly" = "monthly") {
  return useQuery<{ month: string; applications: number; enrolled?: number }[]>(
    {
      queryKey: ["dashboard", "chart", period],
      queryFn: async () => {
        const res = await api.get<unknown>(`/dashboard/chart?period=${period}`);
        if (!res.success) throw new Error(res.error ?? "Failed to load chart");
        return normalizeArray<{
          month: string;
          applications: number;
          enrolled?: number;
        }>(res.data);
      },
    },
  );
}
