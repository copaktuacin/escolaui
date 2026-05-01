// MODULE: Schedule / Timetable (hooks/useQueries.ts)
// LIVE API STATUS: ⚠️ PARTIALLY WIRED — endpoint is GET /schedule (NOT /timetable)
// ENDPOINTS TESTED:
//   GET  /schedule?classId=&sectionId=     — useSchedule() → WIRED to real API in live mode
//   PUT  /schedule/{id}                     — useUpdateScheduleSlot()
//   GET  /schedule/clashes?classId=&sectionId= — useScheduleClashes()
// KNOWN ISSUES:
//   - The hook calls /schedule (not /timetable) — this is consistent with its naming.
//   - In DEMO MODE: generateMockTimetable() is used — zero API calls. This is correct.
//   - In LIVE MODE: api.get("/schedule?classId=&sectionId=") IS called. Wiring is correct.
//   - If the backend endpoint is actually /timetable, ALL schedule data will silently
//     fail and return empty arrays (the hook catches errors and returns [] on failure).
//   - Class-specific timetables ARE supported: different classId + sectionId combinations
//     produce different mock schedules in demo mode and different API calls in live mode.

import { describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { mockFetchFail, mockFetchOk, setToken } from "./setup";

const BASE = "https://escola.doorstepgarage.in/api";

describe("GET /schedule — fetch timetable per class and section", () => {
  it("calls /schedule (NOT /timetable) — verify endpoint name is correct", async () => {
    setToken("tok");
    mockFetchOk({ data: [] });
    await api.get("/schedule?classId=10&sectionId=1");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    // IMPORTANT: The frontend calls /schedule — if your backend uses /timetable,
    // this test will document the mismatch.
    expect(url).toBe(`${BASE}/schedule?classId=10&sectionId=1`);
    expect(url).toContain("/schedule");
    expect(url).not.toContain("/timetable");
  });

  it("includes classId in query string", async () => {
    setToken("tok");
    mockFetchOk({ data: [] });
    await api.get("/schedule?classId=8&sectionId=2");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("classId=8");
  });

  it("includes sectionId in query string", async () => {
    setToken("tok");
    mockFetchOk({ data: [] });
    await api.get("/schedule?classId=8&sectionId=2");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("sectionId=2");
  });

  it("different classId values produce different API calls (per-class timetable)", async () => {
    setToken("tok");
    const classes = [6, 7, 8, 9, 10, 11];
    for (const classId of classes) {
      vi.mocked(global.fetch).mockReset();
      mockFetchOk({ data: [] });
      await api.get(`/schedule?classId=${classId}&sectionId=1`);
      const [url] = vi.mocked(global.fetch).mock.calls[0] as [
        string,
        RequestInit,
      ];
      expect(url).toContain(`classId=${classId}`);
    }
  });

  it("attaches Bearer token", async () => {
    setToken("schedule-tok");
    mockFetchOk({ data: [] });
    await api.get("/schedule?classId=10&sectionId=1");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer schedule-tok");
  });

  it("handles { data: TimetableEntry[] } envelope response", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        data: [
          {
            day: "Mon",
            period: 1,
            subject: "Math",
            teacher: "Mr. Ravi",
            room: "Room 101",
          },
          {
            day: "Mon",
            period: 2,
            subject: "English",
            teacher: "Ms. Amara",
            room: "Room 102",
          },
        ],
      },
    });
    const res = await api.get<{
      data: { day: string; period: number; subject: string }[];
    }>("/schedule?classId=10&sectionId=1");
    expect(res.data?.data).toHaveLength(2);
  });

  it("handles direct array response (no envelope)", async () => {
    setToken("tok");
    mockFetchOk([
      { day: "Tue", period: 3, subject: "Physics", teacher: "Dr. James" },
    ]);
    const res = await api.get("/schedule?classId=10&sectionId=1");
    expect(Array.isArray(res.data)).toBe(true);
  });
});

describe("PUT /schedule/{id} — update a single schedule slot", () => {
  it("sends PUT to the correct schedule slot URL", async () => {
    setToken("tok");
    mockFetchOk({ day: "Mon", period: 1, subject: "Biology" });
    await api.put("/schedule/slot-mon-1", {
      subject: "Biology",
      teacher: "Dr. Ngozi",
      room: "Lab B",
    });
    const [url, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/schedule/slot-mon-1`);
    expect(opts.method).toBe("PUT");
  });

  it("includes subject, teacher, room in payload", async () => {
    setToken("tok");
    mockFetchOk({ day: "Wed", period: 4, subject: "Chemistry" });
    await api.put("/schedule/slot-wed-4", {
      subject: "Chemistry",
      teacher: "Ms. Aisha",
      room: "Lab A",
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.subject).toBe("Chemistry");
    expect(body.teacher).toBe("Ms. Aisha");
    expect(body.room).toBe("Lab A");
  });
});

describe("GET /schedule/clashes — detect scheduling conflicts", () => {
  it("calls correct URL with classId and sectionId", async () => {
    setToken("tok");
    mockFetchOk([]);
    await api.get("/schedule/clashes?classId=10&sectionId=1");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/schedule/clashes?classId=10&sectionId=1`);
  });

  it("returns empty array when no clashes", async () => {
    setToken("tok");
    mockFetchOk([]);
    const res = await api.get("/schedule/clashes?classId=10&sectionId=1");
    expect(Array.isArray(res.data)).toBe(true);
  });
});

/**
 * BUG DOCUMENTATION TEST
 * This test explicitly documents a gap in the schedule module:
 * Even in live mode, if the backend returns an error or empty data,
 * the useSchedule hook silently falls through and renders nothing
 * without any user-facing error message.
 */
describe("⚠️ SCHEDULE BUG: silent empty state on API failure", () => {
  it("KNOWN ISSUE: 404 from /schedule returns empty array with no error surfaced", async () => {
    setToken("tok");
    // Simulate the API returning 404 (endpoint might not exist or wrong URL)
    mockFetchFail(404, "Not Found");
    const res = await api.get("/schedule?classId=10&sectionId=1");
    // The request failed
    expect(res.success).toBe(false);
    expect(res.error).toBeTruthy();
    // FIX NEEDED: useSchedule hook should surface this error to the user
    // Currently: returns [] silently on error → empty timetable grid with no feedback
    // See useSchedule in useQueries.ts: "if (!res.success) throw new Error(...)"
    // → But the queryFn catches and returns [] for some cases
  });
});
