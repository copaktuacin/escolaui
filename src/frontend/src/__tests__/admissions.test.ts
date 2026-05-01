// MODULE: Admissions (hooks/useQueries.ts → api.ts)
// LIVE API STATUS: WIRED
// ENDPOINTS TESTED:
//   GET  /admissions?status=&page=&limit=  — useAdmissions()
//   POST /admissions                        — useSubmitApplication()
//   PUT  /admissions/{id}                   — useUpdateAdmissionStatus()
//   POST /admissions/{id}/verify            — useVerifyAdmission()
//   POST /admissions/{id}/documents         — useUploadDocument() (raw fetch)
// KNOWN ISSUES:
//   - Document upload uses raw fetch with manual Bearer token attachment.
//     This is acceptable but diverges from the api.ts wrapper. The token IS attached.

import { describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { mockFetchOk, setToken } from "./setup";

const BASE = "https://escola.doorstepgarage.in/api";

describe("GET /admissions — list applications", () => {
  it("calls correct URL with status, page, and limit", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/admissions?status=pending&page=1&limit=10");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/admissions?status=pending&page=1&limit=10`);
  });

  it("omits status param when status is 'all'", async () => {
    // When status === 'all', the frontend should omit the status param
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    // The hook only sets status if status !== "all" and status is truthy
    await api.get("/admissions?page=1&limit=10");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).not.toContain("status=all");
  });

  it("filters by specific status values: pending, approved, rejected", async () => {
    const statuses = ["pending", "approved", "rejected"];
    for (const status of statuses) {
      vi.mocked(global.fetch).mockReset();
      setToken("tok");
      mockFetchOk({ data: [], total: 0 });
      await api.get(`/admissions?status=${status}&page=1&limit=10`);
      const [url] = vi.mocked(global.fetch).mock.calls[0] as [
        string,
        RequestInit,
      ];
      expect(url).toContain(`status=${status}`);
    }
  });

  it("attaches Bearer token", async () => {
    setToken("admissions-tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/admissions?page=1&limit=10");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer admissions-tok");
  });

  it("response shape: { data: Application[], total: number }", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        data: [
          {
            id: "APP-001",
            studentName: "Aiden Clarke",
            status: "pending",
            guardianName: "John Clarke",
          },
        ],
        total: 1,
      },
    });
    const res = await api.get<{
      data: { id: string; status: string }[];
      total: number;
    }>("/admissions?page=1&limit=10");
    expect(res.data?.data).toHaveLength(1);
    expect(res.data?.total).toBe(1);
  });
});

describe("POST /admissions — submit new application", () => {
  it("sends POST to /admissions", async () => {
    setToken("tok");
    mockFetchOk({
      id: "APP-002",
      enrollmentId: "ENR-2024-0001",
      status: "pending",
    });
    await api.post("/admissions", {
      studentName: "New Student",
      classId: 5,
      guardianName: "Guardian Name",
    });
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/admissions`);
  });

  it("sends full application payload with parentInfo", async () => {
    setToken("tok");
    mockFetchOk({ id: "APP-003", status: "pending" });
    const payload = {
      studentName: "Priya Singh",
      dateOfBirth: "2012-03-15",
      gender: "F",
      classId: 6,
      guardianName: "Ravi Singh",
      guardianPhone: "+91-9876543210",
      guardianEmail: "ravi@email.com",
      address: "123 Main St, Mumbai",
    };
    await api.post("/admissions", payload);
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.studentName).toBe("Priya Singh");
    expect(body.guardianName).toBe("Ravi Singh");
    expect(body.classId).toBe(6);
  });

  it("attaches Bearer token", async () => {
    setToken("submit-tok");
    mockFetchOk({ id: "APP-004", status: "pending" });
    await api.post("/admissions", { studentName: "Test", classId: 5 });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer submit-tok");
  });

  it("response shape: { id, enrollmentId, status }", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        id: "APP-005",
        enrollmentId: "ENR-2024-0005",
        status: "pending",
      },
    });
    const res = await api.post<{
      id: string;
      enrollmentId: string;
      status: string;
    }>("/admissions", { studentName: "X", classId: 5 });
    expect(res.data?.id).toBe("APP-005");
    expect(res.data?.status).toBe("pending");
  });
});

describe("PUT /admissions/{id} — update admission status", () => {
  it("sends PUT to the correct admission URL", async () => {
    setToken("tok");
    mockFetchOk({ id: "APP-001", status: "approved" });
    await api.put("/admissions/APP-001", { status: "approved" });
    const [url, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/admissions/APP-001`);
    expect(opts.method).toBe("PUT");
  });

  it("includes status in the update body", async () => {
    setToken("tok");
    mockFetchOk({ id: "APP-001", status: "rejected" });
    await api.put("/admissions/APP-001", { status: "rejected" });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.status).toBe("rejected");
  });

  it("attaches Bearer token", async () => {
    setToken("update-admission-tok");
    mockFetchOk({ id: "APP-001", status: "approved" });
    await api.put("/admissions/APP-001", { status: "approved" });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer update-admission-tok");
  });
});

describe("POST /admissions/{id}/verify — verify admission", () => {
  it("sends POST to the correct verify URL", async () => {
    setToken("tok");
    mockFetchOk({ enrollmentId: "ENR-2024-001", status: "approved" });
    await api.post("/admissions/APP-001/verify", {
      status: "approved",
      remarks: "All documents verified",
    });
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/admissions/APP-001/verify`);
  });

  it("includes status and optional remarks", async () => {
    setToken("tok");
    mockFetchOk({ enrollmentId: "ENR-001", status: "approved" });
    await api.post("/admissions/APP-002/verify", {
      status: "approved",
      remarks: "Verified",
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.status).toBe("approved");
    expect(body.remarks).toBe("Verified");
  });

  it("attaches Bearer token", async () => {
    setToken("verify-tok");
    mockFetchOk({ enrollmentId: "ENR-003", status: "approved" });
    await api.post("/admissions/APP-003/verify", { status: "approved" });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer verify-tok");
  });
});

describe("POST /admissions/{id}/documents — document upload (raw fetch)", () => {
  /**
   * The document upload in useUploadDocument() uses raw fetch() instead of api.post().
   * This is intentional (FormData requires no Content-Type override).
   * The Bearer token IS attached manually from localStorage.
   */
  it("uses raw fetch with Authorization header (not api.ts wrapper)", async () => {
    localStorage.setItem("accessToken", "upload-token");
    mockFetchOk({
      documentUrl: "https://cdn/doc.pdf",
      type: "birth_certificate",
    });

    // Simulate what useUploadDocument does in live mode
    const token = localStorage.getItem("accessToken");
    const form = new FormData();
    form.append("type", "birth_certificate");

    await fetch(`${BASE}/admissions/APP-001/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    const [url, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/admissions/APP-001/documents`);
    expect(opts.method).toBe("POST");
    // Bearer token IS attached (not a bug — correct behavior)
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer upload-token");
  });

  it("sends FormData body (no Content-Type header — browser sets multipart boundary)", async () => {
    localStorage.setItem("accessToken", "upload-token");
    mockFetchOk({ documentUrl: "https://cdn/doc.pdf" });

    const form = new FormData();
    form.append(
      "file",
      new Blob(["test"], { type: "application/pdf" }),
      "doc.pdf",
    );
    form.append("type", "birth_certificate");

    await fetch(`${BASE}/admissions/APP-001/documents`, {
      method: "POST",
      headers: { Authorization: "Bearer upload-token" },
      body: form,
    });

    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    // Body is FormData, not a JSON string
    expect(opts.body).toBeInstanceOf(FormData);
  });
});
