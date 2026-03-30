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
  (s) => ({
    studentId: s.id,
    status: "present",
  }),
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

// Simulate API delay
export function withDelay<T>(data: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
