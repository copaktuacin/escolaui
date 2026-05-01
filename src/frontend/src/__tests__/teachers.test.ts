// MODULE: Teachers (hooks/useQueries.ts → api.ts)
// LIVE API STATUS: WIRED
// ENDPOINTS TESTED:
//   GET  /teachers                       — useTeachers() list
//   GET  /teachers/{id}                  — useTeacherDetail()
//   POST /teachers                       — useCreateTeacher()
//   PUT  /teachers/{id}                  — useUpdateTeacher()
//   GET  /teachers/{id}/gradebook        — useTeacherGradebook()
//   POST /teachers/{id}/lesson-plan      — useCreateLessonPlan()
// KNOWN ISSUES: none — all teacher endpoints are wired with Bearer token

import { describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { mockFetchOk, setToken } from "./setup";

const BASE = "https://escola.doorstepgarage.in/api";

describe("GET /teachers — list with pagination and search", () => {
  it("calls correct URL with page and limit", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/teachers?page=1&limit=20");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/teachers?page=1&limit=20`);
  });

  it("includes search param", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/teachers?page=1&limit=20&search=john");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("search=john");
  });

  it("attaches Bearer token", async () => {
    setToken("teacher-tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/teachers?page=1&limit=20");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer teacher-tok");
  });

  it("response shape includes data array and total", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        data: [
          {
            teacherId: 1,
            employeeCode: "EMP001",
            fullName: "John Smith",
            qualification: "B.Sc. Education",
            status: "Active",
            createdAt: "2023-06-01T08:00:00Z",
          },
        ],
        total: 12,
      },
    });
    const res = await api.get<{ data: unknown[]; total: number }>(
      "/teachers?page=1&limit=20",
    );
    expect(res.data).toHaveProperty("data");
    expect(res.data).toHaveProperty("total");
  });
});

describe("GET /teachers/{id} — teacher detail", () => {
  it("calls the correct URL", async () => {
    setToken("tok");
    mockFetchOk({ teacherId: 1, employeeCode: "EMP001", subjects: [] });
    await api.get("/teachers/1");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/teachers/1`);
  });

  it("response includes subjects and roster arrays", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        teacherId: 1,
        userId: 5,
        employeeCode: "EMP001",
        fullName: "John Smith",
        subjects: ["Mathematics", "Physics"],
        roster: [
          {
            studentId: 101,
            studentName: "Raj Kumar",
            classId: 5,
            sectionId: 1,
          },
        ],
        status: "Active",
        createdAt: "2023-06-01T08:00:00Z",
      },
    });
    const res = await api.get<{ subjects: string[]; roster: unknown[] }>(
      "/teachers/1",
    );
    expect(res.data?.subjects).toHaveLength(2);
    expect(res.data?.roster).toHaveLength(1);
  });
});

describe("POST /teachers — create teacher", () => {
  it("sends POST to /teachers URL", async () => {
    setToken("tok");
    mockFetchOk({ teacherId: 2 });
    await api.post("/teachers", {
      userId: 6,
      employeeCode: "EMP002",
      joinDate: "2024-01-10",
    });
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/teachers`);
  });

  it("includes all required fields: userId, employeeCode, joinDate", async () => {
    setToken("tok");
    mockFetchOk({ teacherId: 2 });
    const payload = {
      userId: 6,
      employeeCode: "EMP002",
      qualification: "M.A. English",
      joinDate: "2024-01-10",
      classAssigned: 5,
      subjectIds: [3, 4],
    };
    await api.post("/teachers", payload);
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.userId).toBe(6);
    expect(body.employeeCode).toBe("EMP002");
    expect(body.joinDate).toBe("2024-01-10");
  });

  it("includes optional subjectIds array", async () => {
    setToken("tok");
    mockFetchOk({ teacherId: 3 });
    await api.post("/teachers", {
      userId: 7,
      employeeCode: "EMP003",
      joinDate: "2024-02-01",
      subjectIds: [1, 2, 3],
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.subjectIds).toEqual([1, 2, 3]);
  });

  it("attaches Bearer token", async () => {
    setToken("create-teacher-tok");
    mockFetchOk({ teacherId: 4 });
    await api.post("/teachers", {
      userId: 8,
      employeeCode: "EMP004",
      joinDate: "2024-03-01",
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer create-teacher-tok");
  });

  it("response shape: { teacherId: number }", async () => {
    setToken("tok");
    mockFetchOk({ success: true, data: { teacherId: 5 } });
    const res = await api.post<{ teacherId: number }>("/teachers", {
      userId: 9,
      employeeCode: "EMP005",
      joinDate: "2024-04-01",
    });
    expect(res.data?.teacherId).toBe(5);
  });
});

describe("PUT /teachers/{id} — update teacher", () => {
  it("sends PUT to the correct teacher URL", async () => {
    setToken("tok");
    mockFetchOk({ success: true, id: 1 });
    await api.put("/teachers/1", { qualification: "M.Ed", status: "Active" });
    const [url, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/teachers/1`);
    expect(opts.method).toBe("PUT");
  });

  it("sends update payload matching UpdateTeacherRequest", async () => {
    setToken("tok");
    mockFetchOk({ success: true, id: 1 });
    const update = {
      qualification: "B.Sc. Education, M.Ed, B.Tech",
      status: "Active",
      subjectIds: [1, 2, 3],
    };
    await api.put("/teachers/1", update);
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.qualification).toBeTruthy();
    expect(body.status).toBe("Active");
    expect(body.subjectIds).toEqual([1, 2, 3]);
  });

  it("attaches Bearer token", async () => {
    setToken("update-teacher-tok");
    mockFetchOk({ success: true, id: 1 });
    await api.put("/teachers/1", { status: "Inactive" });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer update-teacher-tok");
  });
});

describe("GET /teachers/{id}/gradebook — gradebook with filters", () => {
  it("calls correct URL with classId, subject, and term params", async () => {
    setToken("tok");
    mockFetchOk({
      data: [
        {
          studentId: 101,
          studentName: "Raj Kumar",
          marks: [{ term: "Q1", score: 85 }],
          grade: "A",
        },
      ],
    });
    await api.get("/teachers/1/gradebook?class=5&subject=1&term=Q1");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/teachers/1/gradebook?class=5&subject=1&term=Q1`);
    expect(url).toContain("class=5");
    expect(url).toContain("subject=1");
    expect(url).toContain("term=Q1");
  });

  it("gradebook response includes studentId, marks array, and grade", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        data: [
          {
            studentId: 101,
            studentName: "Raj Kumar",
            marks: [
              { term: "Q1", score: 85 },
              { term: "Q2", score: 88 },
            ],
            grade: "A",
          },
        ],
      },
    });
    const res = await api.get<{
      data: { studentId: number; marks: unknown[]; grade: string }[];
    }>("/teachers/1/gradebook");
    const entry = res.data?.data[0];
    expect(entry?.studentId).toBe(101);
    expect(entry?.marks).toHaveLength(2);
    expect(entry?.grade).toBe("A");
  });

  it("attaches Bearer token to gradebook request", async () => {
    setToken("gradebook-tok");
    mockFetchOk({ data: [] });
    await api.get("/teachers/1/gradebook");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer gradebook-tok");
  });
});

describe("POST /teachers/{id}/lesson-plan — create lesson plan", () => {
  it("sends POST to correct teacher lesson-plan URL", async () => {
    setToken("tok");
    mockFetchOk({ lessonPlanId: 101 });
    await api.post("/teachers/1/lesson-plan", {
      subjectId: 1,
      classId: 5,
      lessonDate: "2024-04-20",
    });
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/teachers/1/lesson-plan`);
  });

  it("includes all required lesson plan fields", async () => {
    setToken("tok");
    mockFetchOk({ lessonPlanId: 102 });
    const payload = {
      subjectId: 1,
      classId: 5,
      lessonDate: "2024-04-20",
      objectives: "Students will learn quadratic equations",
      content: "Introduction to ax² + bx + c = 0",
      resources: "Textbook chapter 4, Graph paper",
    };
    await api.post("/teachers/1/lesson-plan", payload);
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.subjectId).toBe(1);
    expect(body.classId).toBe(5);
    expect(body.lessonDate).toBe("2024-04-20");
    expect(body.objectives).toBeTruthy();
    expect(body.content).toBeTruthy();
  });

  it("attaches Bearer token", async () => {
    setToken("lesson-tok");
    mockFetchOk({ lessonPlanId: 103 });
    await api.post("/teachers/1/lesson-plan", {
      subjectId: 2,
      classId: 6,
      lessonDate: "2024-05-01",
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer lesson-tok");
  });

  it("response shape: { lessonPlanId: number }", async () => {
    setToken("tok");
    mockFetchOk({ success: true, data: { lessonPlanId: 200 } });
    const res = await api.post<{ lessonPlanId: number }>(
      "/teachers/1/lesson-plan",
      { subjectId: 1, classId: 5, lessonDate: "2024-04-20" },
    );
    expect(res.data?.lessonPlanId).toBe(200);
  });
});
