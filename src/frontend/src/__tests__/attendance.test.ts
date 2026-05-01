// MODULE: Attendance (hooks/useQueries.ts → api.ts)
// LIVE API STATUS: WIRED
// ENDPOINTS TESTED:
//   GET  /attendance?date=&classId=&sectionId=   — useAttendanceRecords()
//   POST /attendance                              — useSaveAttendance()
//   GET  /attendance/stats?classId=&month=       — useAttendanceStats()
// KNOWN ISSUES: none — attendance endpoints are wired with Bearer token

import { describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { mockFetchOk, setToken } from "./setup";

const BASE = "https://escola.doorstepgarage.in/api";

describe("GET /attendance — fetch attendance records", () => {
  it("calls correct URL with date param", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/attendance?date=2024-04-20");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/attendance?date=2024-04-20`);
    expect(url).toContain("date=2024-04-20");
  });

  it("includes classId in query string", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/attendance?date=2024-04-20&classId=10");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("classId=10");
  });

  it("includes sectionId when provided", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/attendance?date=2024-04-20&classId=10&sectionId=1");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("sectionId=1");
  });

  it("attaches Bearer token", async () => {
    setToken("attendance-tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/attendance?date=2024-04-20&classId=10");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer attendance-tok");
  });

  it("handles { data: AttendanceRecord[] } envelope response", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        data: [
          { studentId: "101", studentName: "Raj Kumar", status: "present" },
          { studentId: "102", studentName: "Priya Singh", status: "absent" },
        ],
        total: 2,
      },
    });
    const res = await api.get<{
      data: { studentId: string; status: string }[];
      total: number;
    }>("/attendance?date=2024-04-20&classId=10");
    expect(res.data?.data).toHaveLength(2);
  });

  it("handles direct array response (no envelope)", async () => {
    setToken("tok");
    mockFetchOk([
      { studentId: "101", status: "present" },
      { studentId: "102", status: "late" },
    ]);
    const res = await api.get("/attendance?date=2024-04-20&classId=10");
    expect(Array.isArray(res.data)).toBe(true);
  });
});

describe("POST /attendance — save attendance records", () => {
  it("sends POST to /attendance URL", async () => {
    setToken("tok");
    mockFetchOk({ success: true });
    await api.post("/attendance", {
      date: "2024-04-20",
      classId: 10,
      sectionId: 1,
      records: [],
    });
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/attendance`);
  });

  it("sends POST method", async () => {
    setToken("tok");
    mockFetchOk({ success: true });
    await api.post("/attendance", {
      date: "2024-04-20",
      classId: 10,
      records: [],
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(opts.method).toBe("POST");
  });

  it("includes date, classId, sectionId, and records array in body", async () => {
    setToken("tok");
    mockFetchOk({ success: true });
    const payload = {
      date: "2024-04-20",
      classId: 10,
      sectionId: 1,
      records: [
        { studentId: "101", status: "present" as const },
        { studentId: "102", status: "absent" as const },
        { studentId: "103", status: "late" as const },
      ],
    };
    await api.post("/attendance", payload);
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.date).toBe("2024-04-20");
    expect(body.classId).toBe(10);
    expect(body.sectionId).toBe(1);
    expect(body.records).toHaveLength(3);
    expect(body.records[0]).toMatchObject({
      studentId: "101",
      status: "present",
    });
  });

  it("attaches Bearer token", async () => {
    setToken("save-attendance-tok");
    mockFetchOk({ success: true });
    await api.post("/attendance", {
      date: "2024-04-20",
      classId: 10,
      records: [],
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer save-attendance-tok");
  });

  it("records status values: present, absent, or late", async () => {
    setToken("tok");
    mockFetchOk({ success: true });
    const validStatuses = ["present", "absent", "late"] as const;
    const records = validStatuses.map((status, i) => ({
      studentId: String(100 + i),
      status,
    }));
    await api.post("/attendance", {
      date: "2024-04-20",
      classId: 10,
      records,
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.records.map((r: { status: string }) => r.status)).toEqual([
      "present",
      "absent",
      "late",
    ]);
  });
});

describe("GET /attendance/stats — monthly stats", () => {
  it("calls correct URL with classId and month params", async () => {
    setToken("tok");
    mockFetchOk({
      totalDays: 22,
      presentAvg: 19.5,
      absentAvg: 1.8,
      lateAvg: 0.7,
    });
    await api.get("/attendance/stats?classId=10&month=2024-04");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/attendance/stats?classId=10&month=2024-04`);
    expect(url).toContain("classId=10");
    expect(url).toContain("month=2024-04");
  });

  it("attaches Bearer token", async () => {
    setToken("stats-tok");
    mockFetchOk({ totalDays: 20 });
    await api.get("/attendance/stats?classId=10&month=2024-04");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer stats-tok");
  });

  it("response shape includes totalDays, presentAvg, absentAvg, lateAvg", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        totalDays: 22,
        presentAvg: 19.5,
        absentAvg: 1.8,
        lateAvg: 0.7,
      },
    });
    const res = await api.get<{
      totalDays: number;
      presentAvg: number;
      absentAvg: number;
      lateAvg: number;
    }>("/attendance/stats?classId=10&month=2024-04");
    expect(res.data?.totalDays).toBe(22);
    expect(res.data?.presentAvg).toBe(19.5);
  });
});
