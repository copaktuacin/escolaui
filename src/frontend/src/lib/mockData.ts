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
  studentName: string;
  grade: string;
  description: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: "paid" | "pending" | "overdue";
};

export type TimetableEntry = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  period: number;
  subject: string;
  teacher: string;
  room: string;
};

// ─── Demo School Profiles ───────────────────────────────────────────────────

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

export const DEMO_SCHOOL_PROFILES: Record<string, DemoSchoolProfile> = {
  "demo-escola": {
    id: "demo-escola",
    name: "demo-escola",
    schoolName: "Escola Model School",
    tagline: "Excellence in Education",
    logo: null,
    address: "14 Victoria Island, Lagos, Nigeria",
    phone: "+234 801 234 5678",
    email: "info@escolamodel.edu.ng",
    website: "escolamodel.edu.ng",
    motto: "Knowledge, Character, Service",
    established: 1998,
    academicYear: "2025–2026",
    termStart: "2026-01-10",
    termEnd: "2026-04-05",
    primaryColor: "#0B5AAE",
  },
  "demo-city-academy": {
    id: "demo-city-academy",
    name: "demo-city-academy",
    schoolName: "City Academy",
    tagline: "Shaping Future Leaders",
    logo: null,
    address: "22 Broad Street, Abuja, FCT, Nigeria",
    phone: "+234 802 345 6789",
    email: "admin@cityacademy.edu",
    website: "cityacademy.edu",
    motto: "Courage, Integrity, Excellence",
    established: 2005,
    academicYear: "2025–2026",
    termStart: "2026-01-15",
    termEnd: "2026-04-12",
    primaryColor: "#1A7A4A",
  },
  "demo-sunrise": {
    id: "demo-sunrise",
    name: "demo-sunrise",
    schoolName: "Sunrise International School",
    tagline: "A New Dawn in Learning",
    logo: null,
    address: "8 Airport Road, Enugu, Nigeria",
    phone: "+234 803 456 7890",
    email: "contact@sunriseintl.edu",
    website: "sunriseintl.edu",
    motto: "Rise, Learn, Achieve",
    established: 2010,
    academicYear: "2025–2026",
    termStart: "2026-01-12",
    termEnd: "2026-04-08",
    primaryColor: "#C45C1A",
  },
  "demo-greenfield": {
    id: "demo-greenfield",
    name: "demo-greenfield",
    schoolName: "Greenfield High School",
    tagline: "Growing Minds, Growing Futures",
    logo: null,
    address: "5 GRA Road, Port Harcourt, Rivers State, Nigeria",
    phone: "+234 804 567 8901",
    email: "hello@greenfieldhs.edu",
    website: "greenfieldhs.edu",
    motto: "Grow. Serve. Inspire.",
    established: 2003,
    academicYear: "2025–2026",
    termStart: "2026-01-08",
    termEnd: "2026-04-02",
    primaryColor: "#6B21A8",
  },
  "demo-riverside": {
    id: "demo-riverside",
    name: "demo-riverside",
    schoolName: "Riverside Academy",
    tagline: "Where Curiosity Meets Excellence",
    logo: null,
    address: "3 Ring Road, Ibadan, Oyo State, Nigeria",
    phone: "+234 805 678 9012",
    email: "info@riversideacademy.edu",
    website: "riversideacademy.edu",
    motto: "Flow. Focus. Flourish.",
    established: 2007,
    academicYear: "2025–2026",
    termStart: "2026-01-13",
    termEnd: "2026-04-10",
    primaryColor: "#06B6D4",
  },
};

export const mockApplications: Application[] = [
  {
    id: "APP-001",
    applicantName: "James Okonkwo",
    grade: "Grade 9",
    dateApplied: "2026-03-01",
    status: "enrolled",
    documents: 5,
    email: "james.o@gmail.com",
    parentName: "Charles Okonkwo",
  },
  {
    id: "APP-002",
    applicantName: "Amara Diallo",
    grade: "Grade 7",
    dateApplied: "2026-03-03",
    status: "approved",
    documents: 4,
    email: "amara.d@gmail.com",
    parentName: "Fatou Diallo",
  },
  {
    id: "APP-003",
    applicantName: "Lena Fischer",
    grade: "Grade 10",
    dateApplied: "2026-03-05",
    status: "under_review",
    documents: 3,
    email: "lena.f@gmail.com",
    parentName: "Hans Fischer",
  },
  {
    id: "APP-004",
    applicantName: "Carlos Mendez",
    grade: "Grade 8",
    dateApplied: "2026-03-07",
    status: "pending",
    documents: 2,
    email: "carlos.m@gmail.com",
    parentName: "Rosa Mendez",
  },
  {
    id: "APP-005",
    applicantName: "Yuki Tanaka",
    grade: "Grade 11",
    dateApplied: "2026-03-08",
    status: "approved",
    documents: 5,
    email: "yuki.t@gmail.com",
    parentName: "Hiroshi Tanaka",
  },
  {
    id: "APP-006",
    applicantName: "Aisha Kamara",
    grade: "Grade 6",
    dateApplied: "2026-03-10",
    status: "rejected",
    documents: 1,
    email: "aisha.k@gmail.com",
    parentName: "Ibrahim Kamara",
  },
  {
    id: "APP-007",
    applicantName: "Noah Williams",
    grade: "Grade 9",
    dateApplied: "2026-03-12",
    status: "pending",
    documents: 3,
    email: "noah.w@gmail.com",
    parentName: "Grace Williams",
  },
  {
    id: "APP-008",
    applicantName: "Sofia Rossi",
    grade: "Grade 7",
    dateApplied: "2026-03-14",
    status: "under_review",
    documents: 4,
    email: "sofia.r@gmail.com",
    parentName: "Marco Rossi",
  },
  {
    id: "APP-009",
    applicantName: "Kwame Asante",
    grade: "Grade 10",
    dateApplied: "2026-03-16",
    status: "enrolled",
    documents: 5,
    email: "kwame.a@gmail.com",
    parentName: "Ama Asante",
  },
  {
    id: "APP-010",
    applicantName: "Emily Chen",
    grade: "Grade 8",
    dateApplied: "2026-03-18",
    status: "approved",
    documents: 5,
    email: "emily.c@gmail.com",
    parentName: "David Chen",
  },
];

export const mockEvents: UpcomingEvent[] = [
  {
    id: "EVT-001",
    title: "Mid-Term Examinations Begin",
    date: "Apr 3, 2026",
    time: "8:00 AM",
    type: "exam",
  },
  {
    id: "EVT-002",
    title: "Parent-Teacher Conference",
    date: "Apr 7, 2026",
    time: "2:00 PM",
    type: "meeting",
  },
  {
    id: "EVT-003",
    title: "Spring Sports Day",
    date: "Apr 12, 2026",
    time: "9:00 AM",
    type: "activity",
  },
  {
    id: "EVT-004",
    title: "Fee Payment Deadline",
    date: "Apr 15, 2026",
    time: "5:00 PM",
    type: "deadline",
  },
  {
    id: "EVT-005",
    title: "Good Friday – School Holiday",
    date: "Apr 18, 2026",
    time: "All Day",
    type: "holiday",
  },
];

export const mockFeeActivities: FeeActivity[] = [
  {
    id: "FEE-001",
    student: "James Okonkwo",
    amount: "$1,200",
    date: "Mar 28, 2026",
    status: "paid",
    type: "Tuition",
  },
  {
    id: "FEE-002",
    student: "Amara Diallo",
    amount: "$800",
    date: "Mar 27, 2026",
    status: "paid",
    type: "Tuition",
  },
  {
    id: "FEE-003",
    student: "Carlos Mendez",
    amount: "$1,200",
    date: "Mar 26, 2026",
    status: "pending",
    type: "Tuition",
  },
  {
    id: "FEE-004",
    student: "Lena Fischer",
    amount: "$350",
    date: "Mar 25, 2026",
    status: "paid",
    type: "Lab Fee",
  },
  {
    id: "FEE-005",
    student: "Yuki Tanaka",
    amount: "$1,200",
    date: "Mar 20, 2026",
    status: "paid",
    type: "Tuition",
  },
  {
    id: "FEE-006",
    student: "Noah Williams",
    amount: "$600",
    date: "Mar 15, 2026",
    status: "overdue",
    type: "Activities",
  },
  {
    id: "FEE-007",
    student: "Sofia Rossi",
    amount: "$1,200",
    date: "Mar 10, 2026",
    status: "paid",
    type: "Tuition",
  },
  {
    id: "FEE-008",
    student: "Emily Chen",
    amount: "$200",
    date: "Mar 05, 2026",
    status: "paid",
    type: "Sports Fee",
  },
];

export const mockChartData: ChartDataPoint[] = [
  { month: "Oct", applications: 48, enrolled: 32 },
  { month: "Nov", applications: 72, enrolled: 54 },
  { month: "Dec", applications: 31, enrolled: 20 },
  { month: "Jan", applications: 95, enrolled: 71 },
  { month: "Feb", applications: 88, enrolled: 63 },
  { month: "Mar", applications: 110, enrolled: 78 },
];

export const mockClasses = [
  "6A",
  "6B",
  "7A",
  "7B",
  "8A",
  "9A",
  "9B",
  "10A",
  "10B",
  "11A",
];

export const mockStudents: Student[] = [
  {
    id: "STU-001",
    name: "Aiden Clarke",
    grade: "Grade 10",
    class: "10A",
    rollNo: 1,
  },
  {
    id: "STU-002",
    name: "Blessing Nwosu",
    grade: "Grade 10",
    class: "10A",
    rollNo: 2,
  },
  {
    id: "STU-003",
    name: "Chidera Obi",
    grade: "Grade 10",
    class: "10A",
    rollNo: 3,
  },
  {
    id: "STU-004",
    name: "Diana Petrov",
    grade: "Grade 10",
    class: "10A",
    rollNo: 4,
  },
  {
    id: "STU-005",
    name: "Elijah Santos",
    grade: "Grade 10",
    class: "10A",
    rollNo: 5,
  },
  {
    id: "STU-006",
    name: "Fatima Al-Hassan",
    grade: "Grade 10",
    class: "10A",
    rollNo: 6,
  },
  {
    id: "STU-007",
    name: "Gabriel Kim",
    grade: "Grade 10",
    class: "10A",
    rollNo: 7,
  },
  {
    id: "STU-008",
    name: "Hannah Müller",
    grade: "Grade 10",
    class: "10A",
    rollNo: 8,
  },
  {
    id: "STU-009",
    name: "Ivan Petrov",
    grade: "Grade 9",
    class: "9A",
    rollNo: 1,
  },
  {
    id: "STU-010",
    name: "Jasmine Osei",
    grade: "Grade 9",
    class: "9A",
    rollNo: 2,
  },
  {
    id: "STU-011",
    name: "Kevin Nkrumah",
    grade: "Grade 9",
    class: "9A",
    rollNo: 3,
  },
  {
    id: "STU-012",
    name: "Layla Farooq",
    grade: "Grade 9",
    class: "9B",
    rollNo: 1,
  },
  {
    id: "STU-013",
    name: "Marcus Owusu",
    grade: "Grade 9",
    class: "9B",
    rollNo: 2,
  },
  {
    id: "STU-014",
    name: "Nina Johansson",
    grade: "Grade 10",
    class: "10B",
    rollNo: 1,
  },
  {
    id: "STU-015",
    name: "Omar Abdullah",
    grade: "Grade 10",
    class: "10B",
    rollNo: 2,
  },
];

export const mockAttendanceRecords: AttendanceRecord[] = mockStudents.map(
  (s) => ({ studentId: s.id, status: "present" }),
);

export const mockInvoices: Invoice[] = [
  {
    id: "INV-001",
    studentName: "Aiden Clarke",
    grade: "Grade 10",
    description: "Tuition Fee – Term 2",
    amount: 1200,
    dueDate: "2026-04-15",
    paidDate: "2026-03-20",
    status: "paid",
  },
  {
    id: "INV-002",
    studentName: "Blessing Nwosu",
    grade: "Grade 10",
    description: "Tuition Fee – Term 2",
    amount: 1200,
    dueDate: "2026-04-15",
    paidDate: null,
    status: "pending",
  },
  {
    id: "INV-003",
    studentName: "Chidera Obi",
    grade: "Grade 10",
    description: "Lab Fee",
    amount: 350,
    dueDate: "2026-03-31",
    paidDate: null,
    status: "overdue",
  },
  {
    id: "INV-004",
    studentName: "Diana Petrov",
    grade: "Grade 10",
    description: "Tuition Fee – Term 2",
    amount: 1200,
    dueDate: "2026-04-15",
    paidDate: "2026-03-22",
    status: "paid",
  },
  {
    id: "INV-005",
    studentName: "Elijah Santos",
    grade: "Grade 10",
    description: "Sports & Activities Fee",
    amount: 600,
    dueDate: "2026-03-28",
    paidDate: null,
    status: "overdue",
  },
  {
    id: "INV-006",
    studentName: "Fatima Al-Hassan",
    grade: "Grade 10",
    description: "Tuition Fee – Term 2",
    amount: 1200,
    dueDate: "2026-04-15",
    paidDate: "2026-03-18",
    status: "paid",
  },
  {
    id: "INV-007",
    studentName: "Gabriel Kim",
    grade: "Grade 10",
    description: "Library & Resource Fee",
    amount: 150,
    dueDate: "2026-04-01",
    paidDate: null,
    status: "pending",
  },
  {
    id: "INV-008",
    studentName: "Hannah Müller",
    grade: "Grade 10",
    description: "Tuition Fee – Term 2",
    amount: 1200,
    dueDate: "2026-04-15",
    paidDate: "2026-03-25",
    status: "paid",
  },
  {
    id: "INV-009",
    studentName: "Ivan Petrov",
    grade: "Grade 9",
    description: "Tuition Fee – Term 2",
    amount: 1100,
    dueDate: "2026-04-15",
    paidDate: null,
    status: "pending",
  },
  {
    id: "INV-010",
    studentName: "Jasmine Osei",
    grade: "Grade 9",
    description: "Field Trip Fee",
    amount: 200,
    dueDate: "2026-03-25",
    paidDate: null,
    status: "overdue",
  },
  {
    id: "INV-011",
    studentName: "Kevin Nkrumah",
    grade: "Grade 9",
    description: "Tuition Fee – Term 2",
    amount: 1100,
    dueDate: "2026-04-15",
    paidDate: "2026-03-10",
    status: "paid",
  },
  {
    id: "INV-012",
    studentName: "Layla Farooq",
    grade: "Grade 9",
    description: "Uniform & Stationery",
    amount: 280,
    dueDate: "2026-04-05",
    paidDate: null,
    status: "pending",
  },
];

export const mockTimetable: TimetableEntry[] = [
  {
    day: "Mon",
    period: 1,
    subject: "Mathematics",
    teacher: "Mr. Adeyemi",
    room: "R-101",
  },
  {
    day: "Mon",
    period: 2,
    subject: "English",
    teacher: "Ms. Thornton",
    room: "R-102",
  },
  {
    day: "Mon",
    period: 3,
    subject: "Physics",
    teacher: "Dr. Osei",
    room: "Lab-1",
  },
  {
    day: "Mon",
    period: 4,
    subject: "Chemistry",
    teacher: "Ms. Patel",
    room: "Lab-2",
  },
  {
    day: "Mon",
    period: 6,
    subject: "History",
    teacher: "Mr. Kowalski",
    room: "R-105",
  },
  {
    day: "Mon",
    period: 7,
    subject: "Physical Education",
    teacher: "Coach Musa",
    room: "Gym",
  },
  {
    day: "Tue",
    period: 1,
    subject: "English",
    teacher: "Ms. Thornton",
    room: "R-102",
  },
  {
    day: "Tue",
    period: 2,
    subject: "Mathematics",
    teacher: "Mr. Adeyemi",
    room: "R-101",
  },
  {
    day: "Tue",
    period: 3,
    subject: "Biology",
    teacher: "Dr. Nguyen",
    room: "Lab-3",
  },
  {
    day: "Tue",
    period: 5,
    subject: "Art",
    teacher: "Ms. Rivera",
    room: "Art-1",
  },
  {
    day: "Tue",
    period: 6,
    subject: "Chemistry",
    teacher: "Ms. Patel",
    room: "Lab-2",
  },
  {
    day: "Tue",
    period: 8,
    subject: "Mathematics",
    teacher: "Mr. Adeyemi",
    room: "R-101",
  },
  {
    day: "Wed",
    period: 1,
    subject: "Physics",
    teacher: "Dr. Osei",
    room: "Lab-1",
  },
  {
    day: "Wed",
    period: 2,
    subject: "History",
    teacher: "Mr. Kowalski",
    room: "R-105",
  },
  {
    day: "Wed",
    period: 3,
    subject: "English",
    teacher: "Ms. Thornton",
    room: "R-102",
  },
  {
    day: "Wed",
    period: 4,
    subject: "Mathematics",
    teacher: "Mr. Adeyemi",
    room: "R-101",
  },
  {
    day: "Wed",
    period: 6,
    subject: "Biology",
    teacher: "Dr. Nguyen",
    room: "Lab-3",
  },
  {
    day: "Wed",
    period: 7,
    subject: "ICT",
    teacher: "Mr. Boateng",
    room: "Lab-4",
  },
  {
    day: "Thu",
    period: 1,
    subject: "Chemistry",
    teacher: "Ms. Patel",
    room: "Lab-2",
  },
  {
    day: "Thu",
    period: 2,
    subject: "Biology",
    teacher: "Dr. Nguyen",
    room: "Lab-3",
  },
  {
    day: "Thu",
    period: 3,
    subject: "Mathematics",
    teacher: "Mr. Adeyemi",
    room: "R-101",
  },
  {
    day: "Thu",
    period: 5,
    subject: "ICT",
    teacher: "Mr. Boateng",
    room: "Lab-4",
  },
  {
    day: "Thu",
    period: 6,
    subject: "English",
    teacher: "Ms. Thornton",
    room: "R-102",
  },
  {
    day: "Thu",
    period: 8,
    subject: "Physical Education",
    teacher: "Coach Musa",
    room: "Gym",
  },
  {
    day: "Fri",
    period: 1,
    subject: "Mathematics",
    teacher: "Mr. Adeyemi",
    room: "R-101",
  },
  {
    day: "Fri",
    period: 2,
    subject: "Art",
    teacher: "Ms. Rivera",
    room: "Art-1",
  },
  {
    day: "Fri",
    period: 3,
    subject: "History",
    teacher: "Mr. Kowalski",
    room: "R-105",
  },
  {
    day: "Fri",
    period: 4,
    subject: "English",
    teacher: "Ms. Thornton",
    room: "R-102",
  },
  {
    day: "Fri",
    period: 5,
    subject: "Physics",
    teacher: "Dr. Osei",
    room: "Lab-1",
  },
  {
    day: "Fri",
    period: 7,
    subject: "Biology",
    teacher: "Dr. Nguyen",
    room: "Lab-3",
  },
];

// ─── Subscription & Tenant Types ────────────────────────────────────────────

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
  // Subscription fields
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

// ─── Demo Tenants with Subscription Data ─────────────────────────────────────

export const DEMO_TENANTS: Tenant[] = [
  {
    id: "demo-escola",
    schoolName: "Escola Model School",
    adminEmail: "admin@escolamodel.edu.ng",
    primaryColor: "#3B82F6",
    logoUrl: null,
    domain: "escolamodel.escolaui.com",
    status: "active",
    userCount: 342,
    createdAt: "2024-01-15T09:00:00Z",
    plan: "Pro",
    billingCycle: "monthly",
    amountDue: 299,
    nextPaymentDate: "2026-05-01",
    subscriptionStatus: "Active",
  },
  {
    id: "demo-city-academy",
    schoolName: "City Academy",
    adminEmail: "admin@cityacademy.edu",
    primaryColor: "#8B5CF6",
    logoUrl: null,
    domain: "cityacademy.escolaui.com",
    status: "active",
    userCount: 215,
    createdAt: "2024-03-02T10:30:00Z",
    plan: "Basic",
    billingCycle: "monthly",
    amountDue: 99,
    nextPaymentDate: "2026-04-25",
    subscriptionStatus: "DueSoon",
  },
  {
    id: "demo-sunrise",
    schoolName: "Sunrise International School",
    adminEmail: "contact@sunriseintl.edu",
    primaryColor: "#F59E0B",
    logoUrl: null,
    domain: "sunrise.escolaui.com",
    status: "inactive",
    userCount: 89,
    createdAt: "2024-05-20T08:15:00Z",
    plan: "Basic",
    billingCycle: "annual",
    amountDue: 840,
    nextPaymentDate: "2026-03-20",
    subscriptionStatus: "Overdue",
  },
  {
    id: "demo-greenfield",
    schoolName: "Greenfield High School",
    adminEmail: "hello@greenfieldhs.edu",
    primaryColor: "#10B981",
    logoUrl: null,
    domain: "greenfield.escolaui.com",
    status: "active",
    userCount: 178,
    createdAt: "2024-07-11T11:00:00Z",
    plan: "Enterprise",
    billingCycle: "annual",
    amountDue: 3600,
    nextPaymentDate: "2026-12-01",
    subscriptionStatus: "Active",
  },
  {
    id: "demo-riverside",
    schoolName: "Riverside Academy",
    adminEmail: "info@riversideacademy.edu",
    primaryColor: "#06B6D4",
    logoUrl: null,
    domain: "riverside.escolaui.com",
    status: "active",
    userCount: 134,
    createdAt: "2024-09-05T14:00:00Z",
    plan: "Pro",
    billingCycle: "monthly",
    amountDue: 299,
    nextPaymentDate: "2026-03-15",
    subscriptionStatus: "Overdue",
  },
];

// ─── Mutable Demo Tenants Store (session-only, in-memory mutations) ──────────
// Mirrors DEMO_TENANTS but is mutable so create/update/toggle persist for the
// duration of the browser session without actual API calls.

export let demoTenantsStore: Tenant[] = [...DEMO_TENANTS];

export function resetDemoTenantsStore() {
  demoTenantsStore = [...DEMO_TENANTS];
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

// ─── Demo Payment Reminder Log ───────────────────────────────────────────────

export const DEMO_REMINDERS: PaymentReminder[] = [
  {
    id: "REM-001",
    tenantId: "demo-sunrise",
    tenantName: "Sunrise International School",
    recipientEmail: "contact@sunriseintl.edu",
    message:
      "Your subscription payment of $840 is overdue. Please settle your balance to avoid service interruption.",
    sentAt: "2026-04-10T09:15:00Z",
    status: "sent",
  },
  {
    id: "REM-002",
    tenantId: "demo-riverside",
    tenantName: "Riverside Academy",
    recipientEmail: "info@riversideacademy.edu",
    message:
      "Your subscription payment of $299 is overdue since Mar 15. Please renew to maintain uninterrupted access.",
    sentAt: "2026-04-10T09:16:00Z",
    status: "sent",
  },
  {
    id: "REM-003",
    tenantId: "demo-city-academy",
    tenantName: "City Academy",
    recipientEmail: "admin@cityacademy.edu",
    message:
      "Your subscription renewal of $99 is due on Apr 25. Please process your payment before the due date.",
    sentAt: "2026-04-08T14:30:00Z",
    status: "sent",
  },
  {
    id: "REM-004",
    tenantId: "demo-sunrise",
    tenantName: "Sunrise International School",
    recipientEmail: "contact@sunriseintl.edu",
    message:
      "Reminder: Your account remains suspended due to non-payment. Please clear your balance of $840 to restore access.",
    sentAt: "2026-04-05T10:00:00Z",
    status: "sent",
  },
  {
    id: "REM-005",
    tenantId: "demo-riverside",
    tenantName: "Riverside Academy",
    recipientEmail: "info@riversideacademy.edu",
    message:
      "Final notice: Payment of $299 is overdue. Continued non-payment may result in account suspension.",
    sentAt: "2026-04-01T11:45:00Z",
    status: "sent",
  },
  {
    id: "REM-006",
    tenantId: "demo-city-academy",
    tenantName: "City Academy",
    recipientEmail: "admin@cityacademy.edu",
    message:
      "Your EscolaUI Pro plan renews on Apr 25 for $99. No action needed if your payment method is up to date.",
    sentAt: "2026-03-25T08:00:00Z",
    status: "sent",
  },
];

// ─── Platform Notifications (for tenant admins) ──────────────────────────────

// Map of tenantId → array of notifications shown to that tenant's admin
export const platformAdminNotifications: Record<
  string,
  PlatformNotification[]
> = {
  "demo-sunrise": [
    {
      id: "PNOTIF-001",
      message:
        "Payment reminder sent: Your subscription of $840 is overdue. Please settle your balance.",
      sentAt: "2026-04-10T09:15:00Z",
      read: false,
      from: "platform",
    },
    {
      id: "PNOTIF-002",
      message:
        "Account notice: Your EscolaUI account has been suspended due to non-payment. Contact platform admin to restore.",
      sentAt: "2026-04-05T10:00:00Z",
      read: true,
      from: "platform",
    },
  ],
  "demo-riverside": [
    {
      id: "PNOTIF-003",
      message:
        "Payment reminder sent: Your subscription payment of $299 is overdue since Mar 15. Please renew to maintain access.",
      sentAt: "2026-04-10T09:16:00Z",
      read: false,
      from: "platform",
    },
    {
      id: "PNOTIF-004",
      message:
        "Final notice: Payment of $299 is overdue. Continued non-payment may result in account suspension.",
      sentAt: "2026-04-01T11:45:00Z",
      read: false,
      from: "platform",
    },
  ],
  "demo-city-academy": [
    {
      id: "PNOTIF-005",
      message:
        "Upcoming renewal: Your subscription of $99 is due on Apr 25. Please ensure your payment method is current.",
      sentAt: "2026-04-08T14:30:00Z",
      read: true,
      from: "platform",
    },
  ],
  "demo-escola": [],
  "demo-greenfield": [],
};

// Simulate API delay
export function withDelay<T>(data: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
