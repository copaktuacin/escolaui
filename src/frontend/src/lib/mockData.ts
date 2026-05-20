// mockData.ts — type definitions and demo mode utility only.
// All hardcoded school profiles and tenant data removed.
// Demo mode returns empty arrays for all lists.

export type Application = {
  id: string;
  applicantName: string;
  grade: string;
  dateApplied: string;
  status: "pending" | "under_review" | "approved" | "rejected" | "enrolled";
  documents: number;
  email: string;
  parentName: string;
};

export type UpcomingEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "exam" | "holiday" | "meeting" | "activity" | "deadline";
};

export type FeeActivity = {
  id: string;
  student: string;
  amount: string;
  date: string;
  status: "paid" | "pending" | "overdue";
  type: string;
};

export type ChartDataPoint = {
  month: string;
  applications: number;
  enrolled: number;
};

export type Student = {
  id: string;
  name: string;
  grade: string;
  class: string;
  rollNo: number;
};

export type AttendanceRecord = {
  studentId: string;
  status: "present" | "absent" | "late";
};

export type Invoice = {
  id: string;
  studentId?: string;
  studentName: string;
  grade?: string;
  description?: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: "paid" | "pending" | "overdue" | "unpaid" | "partial";
  [key: string]: unknown;
};

export type TimetableEntry = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | string;
  period: number;
  subject: string;
  teacher: string;
  room: string;
};

export type SubscriptionStatus = "Active" | "Overdue" | "DueSoon" | "Paused";

export type Tenant = {
  id: string;
  schoolName: string;
  adminEmail: string;
  primaryColor: string;
  logoUrl: string | null;
  domain: string | null;
  status: "active" | "inactive";
  userCount: number;
  createdAt: string;
  plan: "Free" | "Basic" | "Pro" | "Enterprise";
  billingCycle: "monthly" | "annual";
  amountDue: number;
  nextPaymentDate: string;
  subscriptionStatus: SubscriptionStatus;
};

export type PaymentReminder = {
  id: string;
  tenantId: string;
  tenantName: string;
  recipientEmail: string;
  message: string;
  sentAt: string;
  status: "sent" | "failed" | "pending";
};

export type PlatformNotification = {
  id: string;
  message: string;
  sentAt: string;
  read: boolean;
  from: "platform";
};

// Demo school profile type — kept for import compatibility
export type DemoSchoolProfile = {
  id: string;
  name: string;
  schoolName: string;
  tagline: string;
  logo: string | null;
  address: string;
  phone: string;
  email: string;
  website: string;
  motto: string;
  established: number;
  academicYear: string;
  termStart: string;
  termEnd: string;
  primaryColor?: string;
};

// All demo data arrays are empty — no hardcoded school names or profiles.
export const DEMO_SCHOOL_PROFILES: Record<string, DemoSchoolProfile> = {};
export const DEMO_TENANTS: Tenant[] = [];
export const DEMO_REMINDERS: PaymentReminder[] = [];
export const platformAdminNotifications: Record<
  string,
  PlatformNotification[]
> = {};

export const mockApplications: Application[] = [];
export const mockEvents: UpcomingEvent[] = [];
export const mockFeeActivities: FeeActivity[] = [];
export const mockChartData: ChartDataPoint[] = [];
export const mockClasses: string[] = [];
export const mockStudents: Student[] = [];
export const mockAttendanceRecords: AttendanceRecord[] = [];
export const mockInvoices: Invoice[] = [];
export const mockTimetable: TimetableEntry[] = [];

// Mutable demo tenant store — empty in dynamic mode
export let demoTenantsStore: Tenant[] = [];

export function resetDemoTenantsStore() {
  demoTenantsStore = [];
}

export function addDemoTenant(tenant: Tenant) {
  demoTenantsStore = [...demoTenantsStore, tenant];
}

export function updateDemoTenant(id: string, updates: Partial<Tenant>) {
  demoTenantsStore = demoTenantsStore.map((t) =>
    t.id === id ? { ...t, ...updates } : t,
  );
}

export function toggleDemoTenantStatus(id: string, active: boolean) {
  demoTenantsStore = demoTenantsStore.map((t) =>
    t.id === id ? { ...t, status: active ? "active" : "inactive" } : t,
  );
}

/** Simulated async delay — kept for pages that still use it. */
export function withDelay<T>(data: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
