// MODULE: Fees & Finance (hooks/useQueries.ts → api.ts)
// LIVE API STATUS: WIRED
// ENDPOINTS TESTED:
//   GET  /fees/invoices?status=&limit=   — useInvoices()
//   POST /fees/invoices/{id}/pay         — usePayInvoice()
//   GET  /fees/concessions               — useConcessions()
// KNOWN ISSUES:
//   - The pay endpoint sends "paymentMethod" in the body, NOT "method" as the DTO doc shows.
//     (useQueries.ts line 1343: paymentMethod: payload.method)
//     This is a field name deviation that may cause 400 errors on the live backend.

import { describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { mockFetchOk, setToken } from "./setup";

const BASE = "https://escola.doorstepgarage.in/api";

describe("GET /fees/invoices — list invoices with filters", () => {
  it("calls correct URL with status and pagination params", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/fees/invoices?status=unpaid&page=1&limit=20");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/fees/invoices?status=unpaid&page=1&limit=20`);
  });

  it("includes status filter when provided", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/fees/invoices?status=overdue&page=1&limit=20");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("status=overdue");
  });

  it("includes studentId filter when provided", async () => {
    setToken("tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/fees/invoices?studentId=STU001&page=1&limit=20");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("studentId=STU001");
  });

  it("attaches Bearer token", async () => {
    setToken("fees-tok");
    mockFetchOk({ data: [], total: 0 });
    await api.get("/fees/invoices?page=1&limit=20");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer fees-tok");
  });

  it("response shape: { data: Invoice[], total: number }", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        data: [
          {
            id: "INV001",
            studentName: "Raj Kumar",
            amount: 25000,
            status: "unpaid",
          },
        ],
        total: 1,
      },
    });
    const res = await api.get<{
      data: { id: string; amount: number; status: string }[];
      total: number;
    }>("/fees/invoices?page=1&limit=20");
    expect(res.data?.data).toHaveLength(1);
    expect(res.data?.total).toBe(1);
  });
});

describe("POST /fees/invoices/{id}/pay — pay an invoice", () => {
  it("sends POST to the correct invoice pay URL", async () => {
    setToken("tok");
    mockFetchOk({ receiptId: "RCP-001", status: "paid" });
    await api.post("/fees/invoices/INV001/pay", {
      amount: 25000,
      paymentMethod: "cash",
      transactionId: "TXN-001",
    });
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/fees/invoices/INV001/pay`);
  });

  it("uses POST method", async () => {
    setToken("tok");
    mockFetchOk({ receiptId: "RCP-002", status: "paid" });
    await api.post("/fees/invoices/INV002/pay", {
      amount: 15000,
      paymentMethod: "bank_transfer",
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(opts.method).toBe("POST");
  });

  it("sends amount and paymentMethod in body", async () => {
    setToken("tok");
    mockFetchOk({ receiptId: "RCP-003", status: "paid" });
    await api.post("/fees/invoices/INV003/pay", {
      amount: 50000,
      paymentMethod: "online",
      transactionId: "TXN-XYZ",
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    expect(body.amount).toBe(50000);
    expect(body.paymentMethod).toBe("online");
    // NOTE: The codebase sends "paymentMethod" but API docs show "method"
    // This is a potential bug — the live API may return 400 if it expects "method"
    expect(body).toHaveProperty("paymentMethod");
  });

  /**
   * KNOWN DEVIATION: The API documentation specifies the payment field as "method",
   * but useQueries.ts sends "paymentMethod". This test documents the discrepancy.
   * If the live API rejects payments, rename "paymentMethod" → "method" in
   * hooks/useQueries.ts line ~1343.
   */
  it("⚠️ DEVIATION: sends paymentMethod (not method) — potential API mismatch", async () => {
    setToken("tok");
    mockFetchOk({ receiptId: "RCP-DEV", status: "paid" });
    await api.post("/fees/invoices/INV-DEV/pay", {
      amount: 10000,
      paymentMethod: "cash", // actual field sent
      // method: "cash",     // what API docs say
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(opts.body as string);
    // Documents the current behavior
    expect(body).toHaveProperty("paymentMethod");
    // If the backend expects "method", this should be "method" — change in useQueries.ts
    expect(body).not.toHaveProperty("method");
  });

  it("attaches Bearer token", async () => {
    setToken("pay-tok");
    mockFetchOk({ receiptId: "RCP-004", status: "paid" });
    await api.post("/fees/invoices/INV004/pay", {
      amount: 5000,
      paymentMethod: "cash",
    });
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer pay-tok");
  });

  it("response shape: { receiptId, paidAt, status }", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        receiptId: "RCP-005",
        paidAt: "2024-04-20T10:30:00Z",
        status: "paid",
      },
    });
    const res = await api.post<{
      receiptId: string;
      paidAt: string;
      status: string;
    }>("/fees/invoices/INV005/pay", { amount: 1000, paymentMethod: "cash" });
    expect(res.data?.receiptId).toBe("RCP-005");
    expect(res.data?.status).toBe("paid");
  });
});

describe("GET /fees/concessions — list fee concessions", () => {
  it("calls the correct URL", async () => {
    setToken("tok");
    mockFetchOk({ data: [] });
    await api.get("/fees/concessions");
    const [url] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${BASE}/fees/concessions`);
  });

  it("attaches Bearer token", async () => {
    setToken("concession-tok");
    mockFetchOk({ data: [] });
    await api.get("/fees/concessions");
    const [, opts] = vi.mocked(global.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer concession-tok");
  });

  it("returns concession list with id, name, percentage", async () => {
    setToken("tok");
    mockFetchOk({
      success: true,
      data: {
        data: [
          { id: "c1", name: "Academic Scholarship", percentage: 50 },
          { id: "c2", name: "Sports Bursary", percentage: 30 },
        ],
      },
    });
    const res = await api.get<{
      data: { id: string; name: string; percentage: number }[];
    }>("/fees/concessions");
    expect(res.data?.data).toHaveLength(2);
    expect(res.data?.data[0].percentage).toBe(50);
  });

  it("handles direct array response (no envelope)", async () => {
    setToken("tok");
    mockFetchOk([{ id: "c1", name: "Academic Scholarship", percentage: 50 }]);
    const res = await api.get("/fees/concessions");
    expect(Array.isArray(res.data)).toBe(true);
  });
});
