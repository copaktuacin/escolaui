// Shared in-memory store so teacher-set URLs are reflected on the student view.
// In production this would be replaced by API calls.

export type VirtualSession = {
  id: string;
  subject: string;
  teacher: string;
  day: string;
  time: string;
  duration: string;
  participants: number;
  status: "live" | "scheduled" | "ended";
  joinLink: string;
};

const initialSessions: VirtualSession[] = [
  {
    id: "s1",
    subject: "Mathematics",
    teacher: "Mr. Adebayo",
    day: "Monday",
    time: "8:00 AM",
    duration: "60 min",
    participants: 28,
    status: "live",
    joinLink: "",
  },
  {
    id: "s2",
    subject: "English Literature",
    teacher: "Mrs. Okafor",
    day: "Monday",
    time: "10:00 AM",
    duration: "60 min",
    participants: 31,
    status: "scheduled",
    joinLink: "",
  },
  {
    id: "s3",
    subject: "Physics",
    teacher: "Dr. Nwosu",
    day: "Tuesday",
    time: "9:00 AM",
    duration: "90 min",
    participants: 24,
    status: "scheduled",
    joinLink: "",
  },
  {
    id: "s4",
    subject: "Chemistry",
    teacher: "Ms. Eze",
    day: "Wednesday",
    time: "11:00 AM",
    duration: "60 min",
    participants: 27,
    status: "scheduled",
    joinLink: "",
  },
  {
    id: "s5",
    subject: "Biology",
    teacher: "Mr. Chukwu",
    day: "Thursday",
    time: "2:00 PM",
    duration: "60 min",
    participants: 30,
    status: "scheduled",
    joinLink: "",
  },
  {
    id: "s6",
    subject: "History",
    teacher: "Mrs. Bello",
    day: "Friday",
    time: "9:00 AM",
    duration: "45 min",
    participants: 26,
    status: "scheduled",
    joinLink: "",
  },
];

// Mutable singleton — changes are visible to all components in the same session.
let sessions: VirtualSession[] = initialSessions.map((s) => ({ ...s }));

export function getSessions(): VirtualSession[] {
  return sessions;
}

export function updateSession(
  id: string,
  patch: Partial<VirtualSession>,
): void {
  sessions = sessions.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

export function addSession(
  session: Omit<VirtualSession, "id">,
): VirtualSession {
  const newSession: VirtualSession = {
    ...session,
    id: `s${Date.now()}`,
  };
  sessions = [...sessions, newSession];
  return newSession;
}

export function deleteSession(id: string): void {
  sessions = sessions.filter((s) => s.id !== id);
}
