/**
 * React Query hooks for EscolaUI — all data fetching goes through here.
 * Pattern: isDemoMode() → use mockData (no network), else → real API via api.ts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";
import {
  type Application,
  type AttendanceRecord,
  type ChartDataPoint,
  type FeeActivity,
  type Invoice,
  type Student,
  type TimetableEntry,
  type UpcomingEvent,
  mockApplications,
  mockAttendanceRecords,
  mockChartData,
  mockEvents,
  mockFeeActivities,
  mockInvoices,
  mockStudents,
  mockTimetable,
  withDelay,
} from "../lib/mockData";
import { getTenantId } from "../lib/tenant";

// ─── Types for live API ──────────────────────────────────────────────────────

export type DashboardStats = {
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  attendanceRate: number;
};

export type DashboardChartResponse = {
  labels: string[];
  datasets: { label: string; data: number[] }[];
};

export type AttendanceSavePayload = {
  date: string;
  class: string;
  section: string;
  records: { studentId: string; status: "present" | "absent" | "late" }[];
};

export type AttendanceStats = {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
};

export type PaymentPayload = {
  amount: number;
  method: string;
  transactionId: string;
};

export type ScheduleSlotUpdate = {
  subject: string;
  teacher: string;
  room: string;
};

export type Concession = {
  id: string;
  name: string;
  percentage: number;
};

// ─── Students API Types (exact DTO mapping) ───────────────────────────────────

export type StudentParentSimpleDto = {
  parentId: number;
  fullName: string;
  phone?: string;
  email?: string;
};

export type StudentListItemDto = {
  studentId: number;
  enrollmentNo: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  classId?: number;
  sectionId?: number;
  status: string;
  createdAt: string;
};

export type StudentDetailDto = {
  studentId: number;
  enrollmentNo: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  classId?: number;
  sectionId?: number;
  status: string;
  createdAt: string;
  photo?: string;
  address?: string;
  parents: StudentParentSimpleDto[];
};

export type CreateStudentRequest = {
  name: string;
  rollNo?: string;
  classId: number;
  sectionId?: number;
  dob?: string;
  gender?: string;
  photo?: string;
  parentInfo?: { name?: string; phone?: string; email?: string };
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
  sectionId?: number;
  dob?: string;
  gender?: string;
  photo?: string;
  status?: string;
  parentInfo?: {
    parentId?: number;
    name?: string;
    phone?: string;
    email?: string;
  };
};

// ─── Mock students in StudentListItemDto shape ────────────────────────────────

const MOCK_STUDENT_LIST: StudentListItemDto[] = [
  {
    studentId: 101,
    enrollmentNo: "ES-2023001",
    fullName: "Aiden Clarke",
    gender: "M",
    classId: 10,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    studentId: 102,
    enrollmentNo: "ES-2023002",
    fullName: "Blessing Nwosu",
    gender: "F",
    classId: 10,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-11T08:00:00Z",
  },
  {
    studentId: 103,
    enrollmentNo: "ES-2023003",
    fullName: "Chidera Obi",
    gender: "M",
    classId: 10,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-12T08:00:00Z",
  },
  {
    studentId: 104,
    enrollmentNo: "ES-2023004",
    fullName: "Diana Petrov",
    gender: "F",
    classId: 10,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-13T08:00:00Z",
  },
  {
    studentId: 105,
    enrollmentNo: "ES-2023005",
    fullName: "Elijah Santos",
    gender: "M",
    classId: 10,
    sectionId: 2,
    status: "Active",
    createdAt: "2024-01-14T08:00:00Z",
  },
  {
    studentId: 106,
    enrollmentNo: "ES-2023006",
    fullName: "Fatima Al-Hassan",
    gender: "F",
    classId: 10,
    sectionId: 2,
    status: "Active",
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    studentId: 107,
    enrollmentNo: "ES-2023007",
    fullName: "Gabriel Kim",
    gender: "M",
    classId: 10,
    sectionId: 2,
    status: "Inactive",
    createdAt: "2024-01-16T08:00:00Z",
  },
  {
    studentId: 108,
    enrollmentNo: "ES-2023008",
    fullName: "Hannah Müller",
    gender: "F",
    classId: 9,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-17T08:00:00Z",
  },
  {
    studentId: 109,
    enrollmentNo: "ES-2023009",
    fullName: "Ivan Petrov",
    gender: "M",
    classId: 9,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-18T08:00:00Z",
  },
  {
    studentId: 110,
    enrollmentNo: "ES-2023010",
    fullName: "Jasmine Osei",
    gender: "F",
    classId: 9,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-19T08:00:00Z",
  },
  {
    studentId: 111,
    enrollmentNo: "ES-2023011",
    fullName: "Kevin Nkrumah",
    gender: "M",
    classId: 9,
    sectionId: 2,
    status: "Active",
    createdAt: "2024-01-20T08:00:00Z",
  },
  {
    studentId: 112,
    enrollmentNo: "ES-2023012",
    fullName: "Layla Farooq",
    gender: "F",
    classId: 9,
    sectionId: 2,
    status: "Active",
    createdAt: "2024-01-21T08:00:00Z",
  },
  {
    studentId: 113,
    enrollmentNo: "ES-2023013",
    fullName: "Marcus Owusu",
    gender: "M",
    classId: 8,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-22T08:00:00Z",
  },
  {
    studentId: 114,
    enrollmentNo: "ES-2023014",
    fullName: "Nina Johansson",
    gender: "F",
    classId: 8,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-23T08:00:00Z",
  },
  {
    studentId: 115,
    enrollmentNo: "ES-2023015",
    fullName: "Omar Abdullah",
    gender: "M",
    classId: 8,
    sectionId: 2,
    status: "Active",
    createdAt: "2024-01-24T08:00:00Z",
  },
  {
    studentId: 116,
    enrollmentNo: "ES-2023016",
    fullName: "Priya Sharma",
    gender: "F",
    classId: 7,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-25T08:00:00Z",
  },
  {
    studentId: 117,
    enrollmentNo: "ES-2023017",
    fullName: "Quincy Mwangi",
    gender: "M",
    classId: 7,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-26T08:00:00Z",
  },
  {
    studentId: 118,
    enrollmentNo: "ES-2023018",
    fullName: "Rose Adeyemi",
    gender: "F",
    classId: 6,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-27T08:00:00Z",
  },
];

const MOCK_STUDENT_DETAILS: Record<number, StudentDetailDto> = {
  101: {
    studentId: 101,
    enrollmentNo: "ES-2023001",
    fullName: "Aiden Clarke",
    dateOfBirth: "2010-05-15",
    gender: "M",
    classId: 10,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-10T08:00:00Z",
    address: "14 Victoria Island, Lagos, Nigeria",
    parents: [
      {
        parentId: 201,
        fullName: "Charles Clarke",
        phone: "+234-801-234-5678",
        email: "charles.clarke@gmail.com",
      },
      {
        parentId: 202,
        fullName: "Mary Clarke",
        phone: "+234-802-345-6789",
        email: "mary.clarke@gmail.com",
      },
    ],
  },
  102: {
    studentId: 102,
    enrollmentNo: "ES-2023002",
    fullName: "Blessing Nwosu",
    dateOfBirth: "2010-08-22",
    gender: "F",
    classId: 10,
    sectionId: 1,
    status: "Active",
    createdAt: "2024-01-11T08:00:00Z",
    address: "22 Broad Street, Abuja, FCT, Nigeria",
    parents: [
      {
        parentId: 203,
        fullName: "Emmanuel Nwosu",
        phone: "+234-803-456-7890",
        email: "e.nwosu@gmail.com",
      },
    ],
  },
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return {
          totalStudents: 2450,
          totalTeachers: 187,
          totalRevenue: 112400,
          attendanceRate: 96.2,
        };
      }
      const res = await api.get<DashboardStats>("/dashboard/stats");
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load stats");
      return res.data;
    },
  });
}

export function useDashboardChart(period: "monthly" | "weekly" = "monthly") {
  return useQuery<ChartDataPoint[]>({
    queryKey: ["dashboard", "chart", period],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return mockChartData;
      }
      const res = await api.get<DashboardChartResponse>(
        `/dashboard/chart?period=${period}`,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load chart");
      return res.data.labels.map((label, i) => ({
        month: label,
        applications: res.data!.datasets[0]?.data[i] ?? 0,
        enrolled: res.data!.datasets[1]?.data[i] ?? 0,
      }));
    },
  });
}

export function useUpcomingEvents(limit = 5) {
  return useQuery<UpcomingEvent[]>({
    queryKey: ["events", "upcoming", limit],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 300);
        return mockEvents.slice(0, limit);
      }
      const res = await api.get<UpcomingEvent[]>(
        `/events/upcoming?limit=${limit}`,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load events");
      return res.data;
    },
  });
}

export function useRecentFeeActivities(limit = 10) {
  return useQuery<FeeActivity[]>({
    queryKey: ["fees", "recent", limit],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 300);
        return mockFeeActivities.slice(0, limit);
      }
      const res = await api.get<FeeActivity[]>(`/fees/recent?limit=${limit}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load fee activities");
      return res.data;
    },
  });
}

// ─── Admissions ──────────────────────────────────────────────────────────────

export function useAdmissions(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { status = "", page = 1, limit = 10 } = params;
  return useQuery<{ data: Application[]; total: number }>({
    queryKey: ["admissions", status, page, limit],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 500);
        const filtered =
          status && status !== "all"
            ? mockApplications.filter((a) => a.status === status)
            : mockApplications;
        return { data: filtered, total: filtered.length };
      }
      const qs = new URLSearchParams();
      if (status && status !== "all") qs.set("status", status);
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      const res = await api.get<{ data: Application[]; total: number }>(
        `/admissions?${qs}`,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load admissions");
      return res.data;
    },
  });
}

export function useVerifyAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      remarks,
    }: {
      id: string;
      status: string;
      remarks?: string;
    }) => {
      if (isDemoMode()) {
        await withDelay(null, 600);
        return { enrollmentId: `ENR-${Date.now()}`, status };
      }
      const res = await api.post<{ enrollmentId: string; status: string }>(
        `/admissions/${id}/verify`,
        { status, remarks },
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Verify failed");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admissions"] }),
  });
}

export function useUpdateAdmissionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { id, status };
      }
      const res = await api.put<Application>(`/admissions/${id}`, { status });
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Update failed");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admissions"] }),
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (isDemoMode()) {
        await withDelay(null, 1000);
        return {
          id: `APP-${Date.now()}`,
          enrollmentId: `ENR-${new Date().getFullYear()}-${String(1000 + Math.floor(Math.random() * 9000)).padStart(4, "0")}`,
          status: "pending",
        };
      }
      const res = await api.post<{
        id: string;
        enrollmentId: string;
        status: string;
      }>("/admissions", payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Submission failed");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admissions"] }),
  });
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: async ({
      id,
      file,
      type,
    }: {
      id: string;
      file: File;
      type: string;
    }) => {
      if (isDemoMode()) {
        await withDelay(null, 800);
        return { documentUrl: URL.createObjectURL(file), type };
      }
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      const token = localStorage.getItem("accessToken");
      const tenantId = getTenantId();
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/admissions/${id}/documents`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
          },
          body: form,
        },
      );
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      return json.data ?? json;
    },
  });
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export function useStudentsForClass(cls: string, section = "") {
  return useQuery<Student[]>({
    queryKey: ["students", cls, section],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return mockStudents.filter((s) => s.class === cls);
      }
      const qs = new URLSearchParams({ class: cls });
      if (section) qs.set("section", section);
      const res = await api.get<Student[]>(`/students?${qs}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load students");
      return res.data;
    },
    enabled: !!cls,
  });
}

export function useAttendanceRecords(date: string, cls: string, section = "") {
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", date, cls, section],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 300);
        return mockAttendanceRecords;
      }
      const qs = new URLSearchParams({ date, class: cls });
      if (section) qs.set("section", section);
      const res = await api.get<AttendanceRecord[]>(`/attendance?${qs}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load attendance");
      return res.data;
    },
    enabled: !!date && !!cls,
  });
}

export function useSaveAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AttendanceSavePayload) => {
      if (isDemoMode()) {
        await withDelay(null, 600);
        return { saved: true };
      }
      const res = await api.post<{ saved: boolean }>("/attendance", payload);
      if (!res.success)
        throw new Error(res.error ?? "Failed to save attendance");
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["attendance", vars.date, vars.class],
      });
    },
  });
}

export function useAttendanceStats(cls: string, date: string) {
  return useQuery<AttendanceStats>({
    queryKey: ["attendance", "stats", cls, date],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 300);
        return {
          presentCount: 28,
          absentCount: 3,
          lateCount: 2,
          percentage: 87.5,
        };
      }
      const qs = new URLSearchParams({ class: cls, date });
      const res = await api.get<AttendanceStats>(`/attendance/stats?${qs}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load stats");
      return res.data;
    },
    enabled: !!cls && !!date,
  });
}

// ─── Students (full CRUD, exact DTO mapping) ─────────────────────────────────

export function useStudents(params: {
  class?: number;
  section?: number;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { class: classId, section, page = 1, limit = 10, search = "" } = params;
  return useQuery<{ data: StudentListItemDto[]; total: number }>({
    queryKey: ["students-v2", classId, section, page, limit, search],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        let filtered = MOCK_STUDENT_LIST;
        if (classId) filtered = filtered.filter((s) => s.classId === classId);
        if (section) filtered = filtered.filter((s) => s.sectionId === section);
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (s) =>
              s.fullName.toLowerCase().includes(q) ||
              s.enrollmentNo.toLowerCase().includes(q),
          );
        }
        const start = (page - 1) * limit;
        return {
          data: filtered.slice(start, start + limit),
          total: filtered.length,
        };
      }
      const qs = new URLSearchParams();
      if (classId) qs.set("class", String(classId));
      if (section) qs.set("section", String(section));
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (search) qs.set("search", search);
      const res = await api.get<{ data: StudentListItemDto[]; total: number }>(
        `/students?${qs}`,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load students");
      return res.data;
    },
  });
}

export function useStudentDetail(id: number) {
  return useQuery<StudentDetailDto>({
    queryKey: ["students-v2", "detail", id],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        const detail = MOCK_STUDENT_DETAILS[id];
        if (detail) return detail;
        // Fallback: build from list item
        const listItem = MOCK_STUDENT_LIST.find((s) => s.studentId === id);
        if (!listItem) throw new Error("Student not found");
        return {
          ...listItem,
          parents: [],
        };
      }
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
      if (isDemoMode()) {
        await withDelay(null, 600);
        const newId = Date.now();
        return {
          studentId: newId,
          enrollmentNo: `ES-${newId}`,
          fullName: payload.name,
          classId: payload.classId,
          status: "Active",
        };
      }
      const res = await api.post<CreateStudentResponse>("/students", payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to create student");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students-v2"] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateStudentRequest;
    }): Promise<StudentDetailDto> => {
      if (isDemoMode()) {
        await withDelay(null, 500);
        const existing = MOCK_STUDENT_DETAILS[id];
        const listItem = MOCK_STUDENT_LIST.find((s) => s.studentId === id);
        return {
          studentId: id,
          enrollmentNo: listItem?.enrollmentNo ?? `ES-${id}`,
          fullName:
            payload.name ?? existing?.fullName ?? listItem?.fullName ?? "",
          dateOfBirth: payload.dob ?? existing?.dateOfBirth,
          gender: payload.gender ?? existing?.gender ?? listItem?.gender,
          classId: payload.classId ?? existing?.classId ?? listItem?.classId,
          sectionId:
            payload.sectionId ?? existing?.sectionId ?? listItem?.sectionId,
          status:
            payload.status ?? existing?.status ?? listItem?.status ?? "Active",
          createdAt:
            existing?.createdAt ??
            listItem?.createdAt ??
            new Date().toISOString(),
          address: existing?.address,
          parents: existing?.parents ?? [],
        };
      }
      const res = await api.put<StudentDetailDto>(`/students/${id}`, payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to update student");
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["students-v2"] });
      qc.invalidateQueries({ queryKey: ["students-v2", "detail", vars.id] });
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<{ success: boolean }> => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { success: true };
      }
      const res = await api.delete<{ success: boolean }>(`/students/${id}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to delete student");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students-v2"] }),
  });
}

// ─── Teachers ────────────────────────────────────────────────────────────────

export type TeacherListItemDto = {
  teacherId: number;
  employeeCode: string;
  fullName: string;
  qualification?: string;
  status: string;
  createdAt: string;
};

export type TeacherRosterStudentDto = {
  studentId: number;
  studentName: string;
  classId?: number;
  sectionId?: number;
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
  roster: TeacherRosterStudentDto[];
};

export type CreateTeacherRequest = {
  userId: number;
  employeeCode: string;
  qualification?: string;
  joinDate: string;
  classAssigned?: number;
  subjectIds?: number[];
};

export type UpdateTeacherRequest = {
  employeeCode?: string;
  qualification?: string;
  specialization?: string;
  joinDate?: string;
  status?: string;
  classAssigned?: number;
  subjectIds?: number[];
};

export type GradebookEntry = {
  studentId: number;
  studentName: string;
  marks: { term: string; score: number }[];
  grade: string;
};

export type CreateLessonPlanRequest = {
  subjectId: number;
  classId: number;
  lessonDate: string;
  objectives?: string;
  content?: string;
  resources?: string;
};

const mockTeachers: TeacherListItemDto[] = [
  {
    teacherId: 1,
    employeeCode: "EMP001",
    fullName: "John Smith",
    qualification: "B.Sc. Education",
    status: "Active",
    createdAt: "2023-06-01T08:00:00Z",
  },
  {
    teacherId: 2,
    employeeCode: "EMP002",
    fullName: "Amara Okafor",
    qualification: "M.A. English",
    status: "Active",
    createdAt: "2023-08-15T09:30:00Z",
  },
  {
    teacherId: 3,
    employeeCode: "EMP003",
    fullName: "Ravi Shankar",
    qualification: "M.Sc. Mathematics",
    status: "Active",
    createdAt: "2024-01-10T07:45:00Z",
  },
  {
    teacherId: 4,
    employeeCode: "EMP004",
    fullName: "Priya Nair",
    qualification: "B.Ed. Chemistry",
    status: "Active",
    createdAt: "2024-03-20T08:00:00Z",
  },
  {
    teacherId: 5,
    employeeCode: "EMP005",
    fullName: "David Mensah",
    qualification: "M.Ed. History",
    status: "Inactive",
    createdAt: "2022-11-01T10:00:00Z",
  },
];

const mockTeacherDetail: TeacherDetailDto = {
  teacherId: 1,
  userId: 5,
  employeeCode: "EMP001",
  fullName: "John Smith",
  qualification: "B.Sc. Education",
  joinDate: "2023-06-01",
  status: "Active",
  createdAt: "2023-06-01T08:00:00Z",
  subjects: ["Mathematics", "Physics"],
  roster: [
    { studentId: 101, studentName: "Raj Kumar", classId: 5, sectionId: 1 },
    { studentId: 102, studentName: "Priya Singh", classId: 5, sectionId: 1 },
    { studentId: 103, studentName: "Arjun Mehta", classId: 5, sectionId: 2 },
    {
      studentId: 104,
      studentName: "Fatima Al-Hassan",
      classId: 6,
      sectionId: 1,
    },
  ],
};

const mockGradebook: GradebookEntry[] = [
  {
    studentId: 101,
    studentName: "Raj Kumar",
    marks: [
      { term: "Q1", score: 85 },
      { term: "Q2", score: 88 },
    ],
    grade: "A",
  },
  {
    studentId: 102,
    studentName: "Priya Singh",
    marks: [
      { term: "Q1", score: 72 },
      { term: "Q2", score: 76 },
    ],
    grade: "B+",
  },
  {
    studentId: 103,
    studentName: "Arjun Mehta",
    marks: [
      { term: "Q1", score: 91 },
      { term: "Q2", score: 89 },
    ],
    grade: "A+",
  },
  {
    studentId: 104,
    studentName: "Fatima Al-Hassan",
    marks: [
      { term: "Q1", score: 65 },
      { term: "Q2", score: 70 },
    ],
    grade: "B",
  },
];

export function useTeachers(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { page = 1, limit = 20, search = "" } = params;
  return useQuery<{ data: TeacherListItemDto[]; total: number }>({
    queryKey: ["teachers", page, limit, search],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        const filtered = search
          ? mockTeachers.filter(
              (t) =>
                t.fullName.toLowerCase().includes(search.toLowerCase()) ||
                t.employeeCode.toLowerCase().includes(search.toLowerCase()),
            )
          : mockTeachers;
        return { data: filtered, total: filtered.length };
      }
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (search) qs.set("search", search);
      const res = await api.get<{ data: TeacherListItemDto[]; total: number }>(
        `/teachers?${qs}`,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load teachers");
      return res.data;
    },
  });
}

export function useTeacherDetail(id: number) {
  return useQuery<TeacherDetailDto>({
    queryKey: ["teacher", id],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { ...mockTeacherDetail, teacherId: id };
      }
      const res = await api.get<TeacherDetailDto>(`/teachers/${id}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load teacher detail");
      return res.data;
    },
    enabled: id > 0,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateTeacherRequest) => {
      if (isDemoMode()) {
        await withDelay(null, 600);
        return { teacherId: Date.now() };
      }
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
      if (isDemoMode()) {
        await withDelay(null, 500);
        return { success: true, id };
      }
      const res = await api.put<{ success: boolean; id: number }>(
        `/teachers/${id}`,
        body,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to update teacher");
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["teacher", vars.id] });
    },
  });
}

export function useTeacherGradebook(
  teacherId: number,
  params: { class?: number; subject?: number; term?: string },
) {
  const { class: cls, subject, term } = params;
  return useQuery<{ data: GradebookEntry[] }>({
    queryKey: ["teacher-gradebook", teacherId, cls, subject, term],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 500);
        return { data: mockGradebook };
      }
      const qs = new URLSearchParams();
      if (cls !== undefined) qs.set("class", String(cls));
      if (subject !== undefined) qs.set("subject", String(subject));
      if (term) qs.set("term", term);
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

export function useCreateLessonPlan() {
  return useMutation({
    mutationFn: async ({
      teacherId,
      body,
    }: { teacherId: number; body: CreateLessonPlanRequest }) => {
      if (isDemoMode()) {
        await withDelay(null, 500);
        return { lessonPlanId: Date.now() };
      }
      const res = await api.post<{ lessonPlanId: number }>(
        `/teachers/${teacherId}/lesson-plan`,
        body,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to create lesson plan");
      return res.data;
    },
  });
}

// ─── Fees ─────────────────────────────────────────────────────────────────────

export function useInvoices(params: {
  studentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { studentId = "", status = "", page = 1, limit = 20 } = params;
  return useQuery<{ data: Invoice[]; total: number }>({
    queryKey: ["invoices", studentId, status, page, limit],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { data: mockInvoices, total: mockInvoices.length };
      }
      const qs = new URLSearchParams();
      if (studentId) qs.set("studentId", studentId);
      if (status && status !== "all") qs.set("status", status);
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      const res = await api.get<{ data: Invoice[]; total: number }>(
        `/fees/invoices?${qs}`,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load invoices");
      return res.data;
    },
  });
}

export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: PaymentPayload;
    }) => {
      if (isDemoMode()) {
        await withDelay(null, 700);
        return {
          receiptId: `RCP-${Date.now()}`,
          paidAt: new Date().toISOString(),
          status: "paid",
        };
      }
      const res = await api.post<{
        receiptId: string;
        paidAt: string;
        status: string;
      }>(`/fees/invoices/${id}/pay`, payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Payment failed");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useConcessions() {
  return useQuery<Concession[]>({
    queryKey: ["fees", "concessions"],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 300);
        return [
          { id: "c1", name: "Academic Scholarship", percentage: 50 },
          { id: "c2", name: "Sports Bursary", percentage: 30 },
          { id: "c3", name: "Sibling Discount", percentage: 15 },
          { id: "c4", name: "Hardship Grant", percentage: 40 },
        ];
      }
      const res = await api.get<Concession[]>("/fees/concessions");
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load concessions");
      return res.data;
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

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
  [key: string]: unknown;
};

const MOCK_ADMIN_USERS: AdminUserListItem[] = [
  {
    userId: 1,
    username: "Dr. Sarah Evans",
    email: "admin@escola.com",
    role: "Admin",
    isActive: true,
  },
  {
    userId: 2,
    username: "Mr. David Okonkwo",
    email: "principal@escola.com",
    role: "Principal",
    isActive: true,
  },
  {
    userId: 3,
    username: "Mrs. Grace Okafor",
    email: "teacher@escola.com",
    role: "Teacher",
    isActive: true,
  },
  {
    userId: 4,
    username: "Mr. James Bello",
    email: "accounts@escola.com",
    role: "AccountOfficer",
    isActive: true,
  },
  {
    userId: 5,
    username: "Ms. Amara Nwosu",
    email: "admissions@escola.com",
    role: "AdmissionOfficer",
    isActive: true,
  },
  {
    userId: 6,
    username: "Mr. Tunde Abiola",
    email: "tunde.abiola@escola.com",
    role: "Teacher",
    isActive: false,
  },
];

const MOCK_ADMIN_ROLES: RoleListItem[] = [
  {
    roleId: 1,
    roleName: "Admin",
    permissions: ["manage_users", "view_reports", "manage_settings"],
  },
  {
    roleId: 2,
    roleName: "Principal",
    permissions: ["view_students", "manage_classes", "appoint_teachers"],
  },
  {
    roleId: 3,
    roleName: "Teacher",
    permissions: ["view_students", "manage_gradebook", "manage_lesson_plans"],
  },
  {
    roleId: 4,
    roleName: "AccountOfficer",
    permissions: ["manage_fees", "view_reports", "manage_payroll"],
  },
  {
    roleId: 5,
    roleName: "AdmissionOfficer",
    permissions: ["manage_admissions", "view_students"],
  },
  {
    roleId: 6,
    roleName: "Clerk",
    permissions: ["view_dashboard", "manage_admissions", "view_notifications"],
  },
];

export function useAdminUsers(
  params: { role?: string; page?: number; limit?: number } = {},
) {
  const { role = "", page = 1, limit = 20 } = params;
  return useQuery<{ data: AdminUserListItem[]; total: number }>({
    queryKey: ["admin", "users", role, page, limit],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        const filtered = role
          ? MOCK_ADMIN_USERS.filter((u) => u.role === role)
          : MOCK_ADMIN_USERS;
        return { data: filtered, total: filtered.length };
      }
      const qs = new URLSearchParams();
      if (role) qs.set("role", role);
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      const res = await api.get<{ data: AdminUserListItem[]; total: number }>(
        `/admin/users?${qs}`,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load users");
      return res.data;
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: CreateUserRequest,
    ): Promise<{ userId: number }> => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { userId: Date.now() };
      }
      const res = await api.post<{ userId: number }>("/admin/users", payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to create user");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: { id: number; payload: UpdateUserRequest }): Promise<{
      success: boolean;
    }> => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { success: true };
      }
      const res = await api.put<{ success: boolean }>(
        `/admin/users/${id}`,
        payload,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to update user");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<{ success: boolean }> => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { success: true };
      }
      const res = await api.delete<{ success: boolean }>(`/admin/users/${id}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to delete user");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminRoles() {
  return useQuery<RoleListItem[]>({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return MOCK_ADMIN_ROLES;
      }
      const res = await api.get<{ data: RoleListItem[] }>("/admin/roles");
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load roles");
      const d = res.data;
      if ("data" in d && Array.isArray((d as { data: RoleListItem[] }).data))
        return (d as { data: RoleListItem[] }).data;
      return d as unknown as RoleListItem[];
    },
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      permissionIds,
    }: { id: number; permissionIds: number[] }): Promise<{
      success: boolean;
    }> => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { success: true };
      }
      const res = await api.put<{ success: boolean }>(`/admin/roles/${id}`, {
        permissionIds,
      });
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to update role permissions");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });
}

export function useAdminSettings() {
  return useQuery<{ values: AdminSettingsValues }>({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return {
          values: {
            siteName: "Demo School",
            maintenanceMode: false,
            maxUploadSizeMB: 50,
            TimeZone: "UTC",
            Currency: "USD",
          },
        };
      }
      const res = await api.get<{ values: AdminSettingsValues }>(
        "/admin/settings",
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load settings");
      return res.data;
    },
  });
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      values: Record<string, string>,
    ): Promise<{ success: boolean; values: Record<string, string> }> => {
      if (isDemoMode()) {
        await withDelay(null, 500);
        return { success: true, values };
      }
      const res = await api.put<{
        success: boolean;
        values: Record<string, string>;
      }>("/admin/settings", { values });
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to update settings");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings"] }),
  });
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export function useSchedule(cls: string, section = "") {
  return useQuery<TimetableEntry[]>({
    queryKey: ["schedule", cls, section],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return mockTimetable;
      }
      const qs = new URLSearchParams({ class: cls });
      if (section) qs.set("section", section);
      const res = await api.get<TimetableEntry[]>(`/schedule?${qs}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load schedule");
      return res.data;
    },
    enabled: !!cls,
  });
}

export function useUpdateScheduleSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ScheduleSlotUpdate;
    }) => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { id, ...payload };
      }
      const res = await api.put<TimetableEntry>(`/schedule/${id}`, payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Update failed");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] }),
  });
}

export function useScheduleClashes(cls: string, section = "") {
  return useQuery<{ day: string; period: number; conflict: string }[]>({
    queryKey: ["schedule", "clashes", cls, section],
    queryFn: async () => {
      if (isDemoMode()) {
        return [];
      }
      const qs = new URLSearchParams({ class: cls });
      if (section) qs.set("section", section);
      const res = await api.get<
        { day: string; period: number; conflict: string }[]
      >(`/schedule/clashes?${qs}`);
      if (!res.success) return [];
      return res.data ?? [];
    },
    enabled: !!cls,
  });
}
