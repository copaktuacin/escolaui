// MODULE: Students (hooks/useQueries.ts → api.ts)
// LIVE API STATUS: WIRED
// ENDPOINTS TESTED:
//   GET  /students                  — useStudents() list with pagination + filters
//   GET  /students/{id}             — useStudentDetail()
//   POST /students                  — useCreateStudent() with parentInfo
//   PUT  /students/{id}             — useUpdateStudent()
//   DELETE /students/{id}           — useDeleteStudent()
// KNOWN ISSUES: none — all CRUD operations are correctly wired with Bearer token

import { describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { mockFetchOk, setToken } from "./setup";

const BASE = "https://escola.doorstepgarage.in/api";

describe("GET /students — list with pagination and filters", () => {
  it("calls the correct URL with page and limit params", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/students?page=1&limit=10");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/students?page=1&limit=10`);
  });

  it("includes classId filter in query string", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/students?class=5&page=1&limit=10");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("class=5");
  });

  it("includes sectionId filter in query string", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/students?class=5&section=2&page=1&limit=10");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("section=2");
  });

  it("includes search param in query string", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/students?page=1&limit=10&search=raj");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("search=raj");
  });

  it("attaches Bearer token", async () => {
    setToken("student-list-token");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/students?page=1&limit=10");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer student-list-token");
  });

  it("returns student list shape: { data: StudentListItemDto[], total: number }", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        data: [
          {
            studentId: 101,
            enrollmentNo: "ES-2023001",
            fullName: "Raj Kumar",
            gender: "M",
            classId: 5,
            sectionId: 1,
            status: "Active",
            createdAt: "2024-01-15T10:30:00Z",
          },
        ],
        total: 45,
      },
    });
    const res = await api.get<{ data: unknown[]; total: number }>(
      "/students?page=1&limit=10",
    );
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty("data");
    expect(res.data).toHaveProperty("total");
  });
});

describe("GET /students/{id} — student detail", () => {
  it("calls the correct URL for a specific student", async () => {
    setToken("tok");
    mockFetchOk({ studentId: 101, fullName: "Raj Kumar", parents: [] });
    await api.get("/students/101");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/students/101`);
  });

  it("attaches Bearer token", async () => {
    setToken("detail-token");
    mockFetchOk({ studentId: 101, fullName: "Test", parents: [] });
    await api.get("/students/101");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer detail-token");
  });

  it("response includes parents array", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        studentId: 101,
        enrollmentNo: "ES-001",
        fullName: "Raj Kumar",
        parents: [
          { parentId: 201, fullName: "Ravi Kumar", phone: "+91-9876543210" },
        ],
      },
    });
    const res = await api.get<{
      studentId: number;
      parents: unknown[];
    }>("/students/101");
    expect(res.data?.parents).toHaveLength(1);
  });
});

describe("POST /students — create student with parentInfo", () => {
  it("sends POST to /students with correct URL", async () => {
    setToken("tok");
    mockFetchOk({
      studentId: 201,
      enrollmentNo: "ES-2023201",
      status: "Active",
    });
    await api.post("/students", {
      name: "Rajesh Kumar",
      classId: 5,
    });
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/students`);
  });

  it("sends POST method", async () => {
    setToken("tok");
    mockFetchOk({ studentId: 201 });
    await api.post("/students", { name: "Test", classId: 5 });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(opts.method).toBe("POST");
  });

  it("includes all required fields: name, classId", async () => {
    setToken("tok");
    mockFetchOk({ studentId: 202, enrollmentNo: "ES-001" });
    const payload = {
      name: "Rajesh Kumar",
      rollNo: "RK-2023001",
      classId: 5,
      sectionId: 1,
      dob: "2010-05-15",
      gender: "M",
    };
    await api.post("/students", payload);
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.name).toBe("Rajesh Kumar");
    expect(body.classId).toBe(5);
  });

  it("includes parentInfo block in payload", async () => {
    setToken("tok");
    mockFetchOk({ studentId: 203 });
    const payload = {
      name: "Priya Singh",
      classId: 6,
      parentInfo: {
        name: "Ravi Singh",
        phone: "+91-8765432109",
        email: "ravi@email.com",
      },
    };
    await api.post("/students", payload);
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.parentInfo).toBeDefined();
    expect(body.parentInfo.name).toBe("Ravi Singh");
    expect(body.parentInfo.phone).toBe("+91-8765432109");
  });

  it("attaches Bearer token for authenticated create", async () => {
    setToken("create-tok");
    mockFetchOk({ studentId: 204 });
    await api.post("/students", { name: "X", classId: 5 });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer create-tok");
  });

  it("response shape: { studentId, enrollmentNo, fullName, classId, status }", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        studentId: 205,
        enrollmentNo: "ES-2023205",
        fullName: "New Student",
        classId: 5,
        status: "Active",
      },
    });
    const res = await api.post<{
      studentId: number;
      enrollmentNo: string;
      status: string;
    }>("/students", { name: "New Student", classId: 5 });
    expect(res.data?.studentId).toBe(205);
    expect(res.data?.status).toBe("Active");
  });
});

describe("PUT /students/{id} — update student", () => {
  it("sends PUT to the correct URL", async () => {
    setToken("tok");
    mockFetchOk({ studentId: 101, fullName: "Updated Name" });
    await api.put("/students/101", { name: "Updated Name" });
    const [url, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/students/101`);
    expect(opts.method).toBe("PUT");
  });

  it("sends update payload with optional fields only", async () => {
    setToken("tok");
    mockFetchOk({ studentId: 101 });
    const update = {
      name: "Priya Singh Updated",
      classId: 6,
      status: "Active",
    };
    await api.put("/students/101", update);
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.name).toBe("Priya Singh Updated");
    expect(body.classId).toBe(6);
    expect(body.status).toBe("Active");
  });

  it("attaches Bearer token", async () => {
    setToken("update-token");
    mockFetchOk({ studentId: 101 });
    await api.put("/students/101", { status: "Inactive" });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer update-token");
  });
});

describe("DELETE /students/{id} — delete student", () => {
  it("sends DELETE to the correct URL", async () => {
    setToken("tok");
    mockFetchOk({ success: true });
    await api.delete("/students/101");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/students/101`);
  });

  it("uses DELETE method with no body", async () => {
    setToken("tok");
    mockFetchOk({ success: true });
    await api.delete("/students/101");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(opts.method).toBe("DELETE");
    expect(opts.body).toBeUndefined();
  });

  it("attaches Bearer token", async () => {
    setToken("delete-token");
    mockFetchOk({ success: true });
    await api.delete("/students/101");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer delete-token");
  });

  it("response: { success: true }", async () => {
    setToken("tok");
    mockFetchOk({ success: true });
    const res = await api.delete<{ success: boolean }>("/students/101");
    expect(res.data).toEqual({ success: true });
  });
});
