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
  withDelay,
} from "../lib/mockData";

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
  classId: number;
  sectionId?: string;
  records: { studentId: string; status: "present" | "absent" | "late" }[];
};

export type AttendanceStats = {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
};

export type AttendanceStatsMonthly = {
  totalDays: number;
  presentAvg: number;
  absentAvg: number;
  lateAvg: number;
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

// ─── Class-specific mock timetable generator ─────────────────────────────────

const CLASS_6_7_SUBJECTS = [
  "Math",
  "English",
  "Science",
  "Hindi",
  "Social Studies",
  "Art",
  "PE",
  "Computer",
];
const CLASS_8_9_SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Math",
  "English",
  "History",
  "Geography",
  "Computer",
];
const CLASS_10_11_SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Math",
  "English",
  "Economics",
  "Accounts",
  "Computer",
];

const TEACHERS_BY_SUBJECT: Record<string, string[]> = {
  Math: ["Mr. Ravi Shankar", "Mrs. Anita Rao"],
  English: ["Ms. Amara Okafor", "Mr. James Osei"],
  Science: ["Dr. Priya Nair", "Mr. Samuel Eze"],
  Hindi: ["Mrs. Kavita Sharma", "Mr. Deepak Patel"],
  "Social Studies": ["Mr. David Mensah", "Ms. Grace Kone"],
  Art: ["Ms. Lena Kwame", "Mr. Aaron Diallo"],
  PE: ["Coach Mark Owusu", "Coach Sola Adeyemi"],
  Computer: ["Mr. Victor Osei", "Ms. Stella Nwosu"],
  Physics: ["Dr. James Bello", "Mr. Femi Adeyemi"],
  Chemistry: ["Dr. Priya Nair", "Ms. Aisha Hassan"],
  Biology: ["Dr. Ngozi Chukwu", "Mr. Emeka Obi"],
  History: ["Mr. David Mensah", "Mrs. Carol Yeboah"],
  Geography: ["Ms. Grace Kone", "Mr. Kwame Asante"],
  Economics: ["Mr. Tobias Mwangi", "Mrs. Fatima Al-Hassan"],
  Accounts: ["Mr. James Bello", "Mrs. Amaka Okafor"],
};

const ROOMS = [
  "Room 101",
  "Room 102",
  "Room 203",
  "Lab A",
  "Lab B",
  "Hall C",
  "Gym",
  "Room 305",
];

function getSubjectsForClass(classId: number): string[] {
  if (classId <= 7) return CLASS_6_7_SUBJECTS;
  if (classId <= 9) return CLASS_8_9_SUBJECTS;
  return CLASS_10_11_SUBJECTS;
}

function generateMockTimetable(
  classId: number,
  sectionId = 1,
): TimetableEntry[] {
  const subjects = getSubjectsForClass(classId);
  const days: TimetableEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const entries: TimetableEntry[] = [];
  // Use classId + sectionId as seed for rotation to ensure different timetables per class
  const seed = (classId * 7 + sectionId * 3) % subjects.length;

  for (let d = 0; d < days.length; d++) {
    const day = days[d];
    for (let p = 1; p <= 8; p++) {
      // Some free periods (skip period 4 on random days based on class)
      const isFree = (classId + d + p) % 9 === 0;
      if (isFree) continue;

      const subjectIdx = (seed + d * 3 + p * 2) % subjects.length;
      const subject = subjects[subjectIdx];
      const teacherList = TEACHERS_BY_SUBJECT[subject] ?? ["Mr. Staff"];
      const teacher = teacherList[(d + p + classId) % teacherList.length];
      const room = ROOMS[(d * 8 + p + sectionId) % ROOMS.length];

      entries.push({
        day,
        period: p,
        subject,
        teacher,
        room,
      });
    }
  }
  return entries;
}

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
  sectionId?: string;
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
  sectionId?: string;
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
  sectionId?: string;
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
  sectionId?: string;
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
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    studentId: 102,
    enrollmentNo: "ES-2023002",
    fullName: "Blessing Nwosu",
    gender: "F",
    classId: 10,
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-11T08:00:00Z",
  },
  {
    studentId: 103,
    enrollmentNo: "ES-2023003",
    fullName: "Chidera Obi",
    gender: "M",
    classId: 10,
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-12T08:00:00Z",
  },
  {
    studentId: 104,
    enrollmentNo: "ES-2023004",
    fullName: "Diana Petrov",
    gender: "F",
    classId: 10,
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-13T08:00:00Z",
  },
  {
    studentId: 105,
    enrollmentNo: "ES-2023005",
    fullName: "Elijah Santos",
    gender: "M",
    classId: 10,
    sectionId: "B",
    status: "Active",
    createdAt: "2024-01-14T08:00:00Z",
  },
  {
    studentId: 106,
    enrollmentNo: "ES-2023006",
    fullName: "Fatima Al-Hassan",
    gender: "F",
    classId: 10,
    sectionId: "B",
    status: "Active",
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    studentId: 107,
    enrollmentNo: "ES-2023007",
    fullName: "Gabriel Kim",
    gender: "M",
    classId: 10,
    sectionId: "B",
    status: "Inactive",
    createdAt: "2024-01-16T08:00:00Z",
  },
  {
    studentId: 108,
    enrollmentNo: "ES-2023008",
    fullName: "Hannah Müller",
    gender: "F",
    classId: 9,
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-17T08:00:00Z",
  },
  {
    studentId: 109,
    enrollmentNo: "ES-2023009",
    fullName: "Ivan Petrov",
    gender: "M",
    classId: 9,
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-18T08:00:00Z",
  },
  {
    studentId: 110,
    enrollmentNo: "ES-2023010",
    fullName: "Jasmine Osei",
    gender: "F",
    classId: 9,
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-19T08:00:00Z",
  },
  {
    studentId: 111,
    enrollmentNo: "ES-2023011",
    fullName: "Kevin Nkrumah",
    gender: "M",
    classId: 9,
    sectionId: "B",
    status: "Active",
    createdAt: "2024-01-20T08:00:00Z",
  },
  {
    studentId: 112,
    enrollmentNo: "ES-2023012",
    fullName: "Layla Farooq",
    gender: "F",
    classId: 9,
    sectionId: "B",
    status: "Active",
    createdAt: "2024-01-21T08:00:00Z",
  },
  {
    studentId: 113,
    enrollmentNo: "ES-2023013",
    fullName: "Marcus Owusu",
    gender: "M",
    classId: 8,
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-22T08:00:00Z",
  },
  {
    studentId: 114,
    enrollmentNo: "ES-2023014",
    fullName: "Nina Johansson",
    gender: "F",
    classId: 8,
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-23T08:00:00Z",
  },
  {
    studentId: 115,
    enrollmentNo: "ES-2023015",
    fullName: "Omar Abdullah",
    gender: "M",
    classId: 8,
    sectionId: "B",
    status: "Active",
    createdAt: "2024-01-24T08:00:00Z",
  },
  {
    studentId: 116,
    enrollmentNo: "ES-2023016",
    fullName: "Priya Sharma",
    gender: "F",
    classId: 7,
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-25T08:00:00Z",
  },
  {
    studentId: 117,
    enrollmentNo: "ES-2023017",
    fullName: "Quincy Mwangi",
    gender: "M",
    classId: 7,
    sectionId: "A",
    status: "Active",
    createdAt: "2024-01-26T08:00:00Z",
  },
  {
    studentId: 118,
    enrollmentNo: "ES-2023018",
    fullName: "Rose Adeyemi",
    gender: "F",
    classId: 6,
    sectionId: "A",
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
    sectionId: "A",
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
    sectionId: "A",
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
      const res = await fetch(
        `https://escola.doorstepgarage.in/api/admissions/${id}/documents`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      // Map class string like "10" to classId; section is already a string letter ("A", "B", etc.)
      const classNum = Number.parseInt(cls);
      const sectionCode = cls.replace(/^\d+/, "") || section;

      const qs = new URLSearchParams({ date });
      if (!Number.isNaN(classNum)) qs.set("classId", String(classNum));
      if (sectionCode) qs.set("sectionId", sectionCode);

      const res = await api.get<{ data: AttendanceRecord[]; total: number }>(
        `/attendance?${qs}`,
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to load attendance");
      // Handle both envelope { data: [] } and direct array
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object)) {
        return (raw as { data: AttendanceRecord[] }).data;
      }
      return (raw as AttendanceRecord[]) ?? [];
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
        return { success: true };
      }
      const res = await api.post<{ success: boolean }>("/attendance", payload);
      if (!res.success)
        throw new Error(res.error ?? "Failed to save attendance");
      return res.data ?? { success: true };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["attendance", vars.date, String(vars.classId)],
      });
    },
  });
}

export function useAttendanceStats(classId: number, month: string) {
  return useQuery<AttendanceStatsMonthly>({
    queryKey: ["attendance", "stats", classId, month],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 300);
        return {
          totalDays: 22,
          presentAvg: 19.5,
          absentAvg: 1.8,
          lateAvg: 0.7,
        };
      }
      const qs = new URLSearchParams({ classId: String(classId), month });
      const res = await api.get<AttendanceStatsMonthly>(
        `/attendance/stats?${qs}`,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to load stats");
      return res.data;
    },
    enabled: !!classId && !!month,
  });
}

// ─── Students (full CRUD, exact DTO mapping) ─────────────────────────────────

export function useStudents(params: {
  class?: number;
  section?: string;
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
  sectionId?: string;
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
    { studentId: 101, studentName: "Raj Kumar", classId: 5, sectionId: "A" },
    { studentId: 102, studentName: "Priya Singh", classId: 5, sectionId: "A" },
    { studentId: 103, studentName: "Arjun Mehta", classId: 5, sectionId: "B" },
    {
      studentId: 104,
      studentName: "Fatima Al-Hassan",
      classId: 6,
      sectionId: "A",
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
        const filtered =
          status && status !== "all"
            ? mockInvoices.filter((inv) => inv.status === status)
            : mockInvoices;
        return { data: filtered, total: filtered.length };
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
      }>(`/fees/invoices/${id}/pay`, {
        amount: payload.amount,
        paymentMethod: payload.method,
        transactionId: payload.transactionId || undefined,
      });
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
      const res = await api.get<{ data: Concession[] }>("/fees/concessions");
      if (!res.success)
        throw new Error(res.error ?? "Failed to load concessions");
      // Handle both { data: [] } envelope and direct array
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object)) {
        return (raw as { data: Concession[] }).data;
      }
      return (raw as Concession[]) ?? [];
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

export function useSchedule(classId: number, sectionId = "A") {
  return useQuery<TimetableEntry[]>({
    queryKey: ["schedule", classId, sectionId],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        // Convert section letter to numeric seed for mock timetable generator
        const sectionSeed = sectionId.charCodeAt(0) - 64;
        return generateMockTimetable(classId, sectionSeed);
      }
      const qs = new URLSearchParams({
        classId: String(classId),
        sectionId: sectionId,
      });
      const res = await api.get<{ data: TimetableEntry[] }>(`/schedule?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load schedule");
      // Handle both { data: [] } envelope and direct array
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object)) {
        return (raw as { data: TimetableEntry[] }).data;
      }
      return (raw as TimetableEntry[]) ?? [];
    },
    enabled: !!classId,
  });
}

export type ScheduleSlotUpdateVars = {
  id: string;
  payload: ScheduleSlotUpdate;
  classId: number;
  sectionId: string;
};

export function useUpdateScheduleSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: ScheduleSlotUpdateVars) => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { id: vars.id, ...vars.payload };
      }
      const res = await api.put<TimetableEntry>(
        `/schedule/${vars.id}`,
        vars.payload,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Update failed");
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["schedule", vars.classId, vars.sectionId],
      });
    },
  });
}

export function useScheduleClashes(classId: number, sectionId = "A") {
  return useQuery<{ day: string; period: number; conflict: string }[]>({
    queryKey: ["schedule", "clashes", classId, sectionId],
    queryFn: async () => {
      if (isDemoMode()) {
        return [];
      }
      const qs = new URLSearchParams({
        classId: String(classId),
        sectionId: sectionId,
      });
      const res = await api.get<
        { day: string; period: number; conflict: string }[]
      >(`/schedule/clashes?${qs}`);
      if (!res.success) return [];
      return res.data ?? [];
    },
    enabled: !!classId,
  });
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export type ExamDto = {
  id: string;
  name: string;
  subject: string;
  classId: number;
  sectionId?: string;
  date: string;
  duration: number;
  maxMarks: number;
  status: "Scheduled" | "Ongoing" | "Completed";
};

export type ExamResultDto = {
  studentId: number;
  studentName: string;
  marks: number;
  maxMarks: number;
  grade: string;
  status: "Pass" | "Fail";
};

export type CreateExamRequest = {
  name: string;
  subject: string;
  classId: number;
  sectionId?: string;
  examDate?: string;
  date?: string;
  duration: number;
  maxMarks: number;
  term?: string;
  totalMarks?: number;
};

const MOCK_EXAMS_DATA: ExamDto[] = [
  {
    id: "EX-001",
    name: "Mid-Term Mathematics",
    subject: "Mathematics",
    classId: 10,
    sectionId: "A",
    date: "2026-04-20",
    duration: 120,
    maxMarks: 100,
    status: "Scheduled",
  },
  {
    id: "EX-002",
    name: "Physics Unit Test 2",
    subject: "Physics",
    classId: 10,
    sectionId: "A",
    date: "2026-04-18",
    duration: 90,
    maxMarks: 50,
    status: "Completed",
  },
  {
    id: "EX-003",
    name: "English Literature Exam",
    subject: "English",
    classId: 9,
    sectionId: "A",
    date: "2026-04-15",
    duration: 180,
    maxMarks: 100,
    status: "Completed",
  },
  {
    id: "EX-004",
    name: "Chemistry Mid-Term",
    subject: "Chemistry",
    classId: 11,
    date: "2026-04-25",
    duration: 120,
    maxMarks: 100,
    status: "Scheduled",
  },
  {
    id: "EX-005",
    name: "Biology Practical",
    subject: "Biology",
    classId: 9,
    date: "2026-04-22",
    duration: 60,
    maxMarks: 30,
    status: "Ongoing",
  },
];

const MOCK_EXAM_RESULTS: ExamResultDto[] = [
  {
    studentId: 101,
    studentName: "Aiden Clarke",
    marks: 88,
    maxMarks: 100,
    grade: "A",
    status: "Pass",
  },
  {
    studentId: 102,
    studentName: "Blessing Nwosu",
    marks: 72,
    maxMarks: 100,
    grade: "B+",
    status: "Pass",
  },
  {
    studentId: 103,
    studentName: "Chidera Obi",
    marks: 91,
    maxMarks: 100,
    grade: "A+",
    status: "Pass",
  },
  {
    studentId: 104,
    studentName: "Diana Petrov",
    marks: 65,
    maxMarks: 100,
    grade: "B",
    status: "Pass",
  },
  {
    studentId: 105,
    studentName: "Elijah Santos",
    marks: 45,
    maxMarks: 100,
    grade: "D",
    status: "Fail",
  },
  {
    studentId: 106,
    studentName: "Fatima Al-Hassan",
    marks: 79,
    maxMarks: 100,
    grade: "B+",
    status: "Pass",
  },
];

export function useExams(params: {
  classId?: number;
  term?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { classId, term, status, page = 1, limit = 50 } = params;
  return useQuery<ExamDto[]>({
    queryKey: ["exams", classId, term, status, page, limit],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        let filtered = MOCK_EXAMS_DATA;
        if (classId) filtered = filtered.filter((e) => e.classId === classId);
        if (status && status !== "all")
          filtered = filtered.filter((e) => e.status === status);
        return filtered;
      }
      const qs = new URLSearchParams();
      if (classId) qs.set("classId", String(classId));
      if (term) qs.set("term", term);
      if (status && status !== "all") qs.set("status", status);
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      const res = await api.get<{ data: ExamDto[] } | ExamDto[]>(
        `/exams?${qs}`,
      );
      if (!res.success) throw new Error(res.error ?? "Failed to load exams");
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object))
        return (raw as { data: ExamDto[] }).data;
      return (raw as ExamDto[]) ?? [];
    },
  });
}

export function useExamResults(examId: string | number | null) {
  return useQuery<ExamResultDto[]>({
    queryKey: ["exam-results", examId],
    queryFn: async () => {
      if (!examId) return [];
      if (isDemoMode()) {
        await withDelay(null, 400);
        return MOCK_EXAM_RESULTS;
      }
      const res = await api.get<{ data: ExamResultDto[] } | ExamResultDto[]>(
        `/exams/${examId}/results`,
      );
      if (!res.success) throw new Error(res.error ?? "Failed to load results");
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object))
        return (raw as { data: ExamResultDto[] }).data;
      return (raw as ExamResultDto[]) ?? [];
    },
    enabled: !!examId,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateExamRequest): Promise<{ id: string }> => {
      if (isDemoMode()) {
        await withDelay(null, 600);
        return { id: `EX-${Date.now()}` };
      }
      const res = await api.post<{ id: string }>("/exams", payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to create exam");
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
    }: { id: string; payload: Partial<CreateExamRequest> }): Promise<{
      success: boolean;
    }> => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { success: true };
      }
      const res = await api.put<{ success: boolean }>(`/exams/${id}`, payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to update exam");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return { success: true };
      }
      const res = await api.delete<{ success: boolean }>(`/exams/${id}`);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to delete exam");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

// ─── Report Cards ─────────────────────────────────────────────────────────────

export type ReportCardDto = {
  student: { id: string; name: string };
  term: string;
  grades: { subject: string; marks: number; grade: string }[];
  totalMarks?: number;
  percentage?: number;
};

export type GenerateReportCardRequest = {
  studentId?: string | number;
  class?: string;
  term: string;
};

export function useReportCards(params: {
  classId?: number;
  sectionId?: string;
  term?: string;
}) {
  const { classId, sectionId, term = "Term 1" } = params;
  return useQuery<ReportCardDto[]>({
    queryKey: ["report-cards", classId, sectionId, term],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 500);
        return [];
      }
      const qs = new URLSearchParams();
      if (classId) qs.set("classId", String(classId));
      if (sectionId) qs.set("sectionId", String(sectionId));
      if (term) qs.set("term", encodeURIComponent(term));
      const res = await api.get<ReportCardDto[]>(`/report-cards?${qs}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to load report cards");
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object))
        return (raw as { data: ReportCardDto[] }).data;
      return (raw as ReportCardDto[]) ?? [];
    },
  });
}

export function useStudentReportCard(studentId: number | string, term: string) {
  return useQuery<ReportCardDto | null>({
    queryKey: ["report-cards", "student", studentId, term],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return null;
      }
      const qs = new URLSearchParams({ term });
      const res = await api.get<ReportCardDto>(
        `/report-cards/${studentId}?${qs}`,
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to load report card");
      return res.data;
    },
    enabled: !!studentId && !!term,
  });
}

export function useGenerateReportCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: GenerateReportCardRequest,
    ): Promise<{ url?: string }> => {
      if (isDemoMode()) {
        await withDelay(null, 800);
        return {};
      }
      const res = await api.post<{ url?: string }>(
        "/report-cards/generate",
        payload,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to generate report card");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-cards"] }),
  });
}

// ─── ID Cards ─────────────────────────────────────────────────────────────────

export function useStudentsForIDCards(params?: {
  classId?: number;
  sectionId?: string;
}) {
  const { classId, sectionId } = params ?? {};
  return useQuery<StudentListItemDto[]>({
    queryKey: ["id-card-students-v2", classId, sectionId],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        let filtered = MOCK_STUDENT_LIST;
        if (classId) filtered = filtered.filter((s) => s.classId === classId);
        if (sectionId)
          filtered = filtered.filter((s) => s.sectionId === sectionId);
        return filtered.slice(0, 100);
      }
      const qs = new URLSearchParams({ limit: "100" });
      if (classId) qs.set("class", String(classId));
      if (sectionId) qs.set("section", String(sectionId));
      const res = await api.get<
        { data: StudentListItemDto[] } | StudentListItemDto[]
      >(`/students?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load students");
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object))
        return (raw as { data: StudentListItemDto[] }).data;
      return (raw as StudentListItemDto[]) ?? [];
    },
  });
}

// ─── HR & Payroll ─────────────────────────────────────────────────────────────

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

export type PayrollProcessRequest = {
  staffId: string;
  month: number;
  year: number;
  amount?: number;
  deductions?: number;
};

export type PayrollResult = {
  baseSalary: number;
  deductions: number;
  bonuses: number;
  netPay: number;
};

const MOCK_HR_STAFF: StaffDto[] = [
  {
    id: "st1",
    name: "Dr. Samuel Adeyemi",
    department: "Administration",
    position: "Principal",
    joinDate: "2015-09-01",
    basicSalary: 250000,
    allowances: 75000,
    deductions: 32000,
    netSalary: 293000,
    payStatus: "Paid",
    status: "active",
  },
  {
    id: "st2",
    name: "Mrs. Grace Okafor",
    department: "Academics",
    position: "Senior Teacher",
    joinDate: "2018-01-15",
    basicSalary: 180000,
    allowances: 50000,
    deductions: 24000,
    netSalary: 206000,
    payStatus: "Paid",
    status: "active",
  },
  {
    id: "st3",
    name: "Mr. James Bello",
    department: "Finance",
    position: "Bursar",
    joinDate: "2019-03-01",
    basicSalary: 200000,
    allowances: 60000,
    deductions: 28000,
    netSalary: 232000,
    payStatus: "Pending",
    status: "active",
  },
  {
    id: "st4",
    name: "Ms. Ngozi Eze",
    department: "Academics",
    position: "Teacher",
    joinDate: "2021-09-01",
    basicSalary: 150000,
    allowances: 40000,
    deductions: 20000,
    netSalary: 170000,
    payStatus: "Processing",
    status: "on_leave",
  },
  {
    id: "st5",
    name: "Mr. Tunde Abiola",
    department: "Academics",
    position: "Teacher",
    joinDate: "2020-01-10",
    basicSalary: 155000,
    allowances: 42000,
    deductions: 21000,
    netSalary: 176000,
    payStatus: "Pending",
    status: "active",
  },
  {
    id: "st6",
    name: "Mrs. Amaka Chukwu",
    department: "Admin Support",
    position: "Secretary",
    joinDate: "2022-06-01",
    basicSalary: 130000,
    allowances: 35000,
    deductions: 18000,
    netSalary: 147000,
    payStatus: "Paid",
    status: "active",
  },
];

export function useHRStaff() {
  return useQuery<StaffDto[]>({
    queryKey: ["hr-staff-v2"],
    queryFn: async () => {
      if (isDemoMode()) return withDelay(MOCK_HR_STAFF);
      const res = await api.get<{ data: StaffDto[] } | StaffDto[]>(
        "/hr/staff?limit=50",
      );
      if (!res.success) throw new Error(res.error ?? "Failed to load staff");
      const d = res.data as unknown;
      if (d && typeof d === "object" && "data" in (d as object))
        return (d as { data: StaffDto[] }).data;
      return (d as StaffDto[]) ?? [];
    },
  });
}

export function usePayroll(params?: { month?: number; year?: number }) {
  const { month, year } = params ?? {};
  return useQuery<StaffDto[]>({
    queryKey: ["hr-payroll", month, year],
    queryFn: async () => {
      if (isDemoMode()) return withDelay(MOCK_HR_STAFF);
      const qs = new URLSearchParams();
      if (month) qs.set("month", String(month));
      if (year) qs.set("year", String(year));
      const res = await api.get<{ data: StaffDto[] } | StaffDto[]>(
        `/hr/payroll?${qs}`,
      );
      if (!res.success) throw new Error(res.error ?? "Failed to load payroll");
      const d = res.data as unknown;
      if (d && typeof d === "object" && "data" in (d as object))
        return (d as { data: StaffDto[] }).data;
      return (d as StaffDto[]) ?? [];
    },
  });
}

export function useProcessPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: PayrollProcessRequest,
    ): Promise<{ success: boolean }> => {
      if (isDemoMode()) {
        await withDelay(null, 800);
        return { success: true };
      }
      const res = await api.post<{ success: boolean }>(
        "/hr/payroll/process",
        payload,
      );
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to process payroll");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-staff-v2"] }),
  });
}

export function usePayslip(staffId: string, month: string) {
  return useQuery({
    queryKey: ["hr-payslip", staffId, month],
    queryFn: async () => {
      if (isDemoMode()) return null;
      const qs = new URLSearchParams({ month });
      const res = await api.get(`/hr/payroll/${staffId}/payslip?${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load payslip");
      return res.data;
    },
    enabled: !!staffId && !!month,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationDto = {
  id: string;
  date?: string;
  createdAt?: string;
  title: string;
  subject?: string;
  channel: string[];
  recipients?: string;
  recipientType?: string;
  status: "delivered" | "failed" | "pending";
  read?: boolean;
  type?: "info" | "warning" | "success" | "error" | "payment" | "system";
};

const MOCK_NOTIFICATIONS: NotificationDto[] = [
  {
    id: "n1",
    date: "2026-04-20",
    title: "End-of-Term Exam Schedule",
    channel: ["SMS", "Email"],
    recipients: "All Parents",
    status: "delivered",
    type: "info",
  },
  {
    id: "n2",
    date: "2026-04-18",
    title: "Fee Payment Reminder — Q2 Due",
    channel: ["Push", "Email"],
    recipients: "Class 10A",
    status: "delivered",
    type: "payment",
  },
  {
    id: "n3",
    date: "2026-04-15",
    title: "Sports Day Announcement",
    channel: ["SMS"],
    recipients: "All Parents",
    status: "pending",
    type: "info",
  },
  {
    id: "n4",
    date: "2026-04-12",
    title: "Attendance Alert — 3 Consecutive Absences",
    channel: ["SMS", "Push"],
    recipients: "Individual",
    status: "delivered",
    type: "warning",
    read: false,
  },
  {
    id: "n5",
    date: "2026-04-10",
    title: "Parent-Teacher Meeting — Friday 3PM",
    channel: ["Email"],
    recipients: "Class 11B",
    status: "failed",
    type: "error",
    read: false,
  },
  {
    id: "n6",
    date: "2026-04-08",
    title: "Public Holiday — School Closed",
    channel: ["SMS", "Email", "Push"],
    recipients: "All Parents",
    status: "delivered",
    type: "system",
  },
];

export function useNotifications(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = params ?? {};
  return useQuery<NotificationDto[]>({
    queryKey: ["notifications-v2", page, limit],
    queryFn: async () => {
      if (isDemoMode()) return withDelay(MOCK_NOTIFICATIONS);
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const res = await api.get<NotificationDto[]>(`/notifications?${qs}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to load notifications");
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object))
        return (raw as { data: NotificationDto[] }).data;
      return (raw as NotificationDto[]) ?? [];
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      if (isDemoMode()) {
        await withDelay(null, 200);
        return { success: true };
      }
      const res = await api.put<{ success: boolean }>(
        `/notifications/${id}/read`,
        {},
      );
      if (!res.success) throw new Error(res.error ?? "Failed to mark as read");
      return res.data ?? { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications-v2"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ success: boolean }> => {
      if (isDemoMode()) {
        await withDelay(null, 300);
        return { success: true };
      }
      const res = await api.put<{ success: boolean }>(
        "/notifications/read-all",
        {},
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to mark all as read");
      return res.data ?? { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications-v2"] }),
  });
}

// ─── Online Classes ───────────────────────────────────────────────────────────

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

export type CreateOnlineClassRequest = {
  title: string;
  subject: string;
  classId?: number;
  teacherId?: number;
  day?: string;
  time?: string;
  duration?: string;
  scheduledAt?: string;
  joinUrl?: string;
  status?: string;
};

export type UpdateOnlineClassRequest = {
  Title?: string;
  SubjectId?: number;
  ClassId?: number;
  SectionId?: number;
  ScheduledAt?: string; // ISO 8601
  Platform?: string;
  TeacherId?: number;
  Status?: string; // "Scheduled" | "Live" | "Ended"
};

export function useOnlineClasses(params?: { classId?: number }) {
  const { classId } = params ?? {};
  return useQuery<OnlineClassDto[]>({
    queryKey: ["online-classes-v2", classId],
    queryFn: async () => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return [];
      }
      const qs = classId ? `?classId=${classId}` : "";
      const res = await api.get<OnlineClassDto[]>(`/online-classes${qs}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load sessions");
      const raw = res.data as unknown;
      if (raw && typeof raw === "object" && "data" in (raw as object))
        return (raw as { data: OnlineClassDto[] }).data;
      return (raw as OnlineClassDto[]) ?? [];
    },
  });
}

export function useUpdateOnlineClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateOnlineClassRequest;
    }): Promise<OnlineClassDto | null> => {
      if (isDemoMode()) {
        await withDelay(null, 400);
        return null;
      }
      const res = await api.put<OnlineClassDto>(`/online-classes/${id}`, data);
      if (!res.success)
        throw new Error(res.error ?? "Failed to update session");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["online-classes-v2"] }),
  });
}

export function useCreateOnlineClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: CreateOnlineClassRequest,
    ): Promise<OnlineClassDto | null> => {
      if (isDemoMode()) {
        await withDelay(null, 600);
        return null;
      }
      const res = await api.post<OnlineClassDto>("/online-classes", payload);
      if (!res.success || !res.data)
        throw new Error(res.error ?? "Failed to create session");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["online-classes-v2"] }),
  });
}
