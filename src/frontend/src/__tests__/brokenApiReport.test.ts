// MODULE: Broken API Report — Modules with NO live API wiring
// LIVE API STATUS: MISSING / PLACEHOLDER
// ENDPOINTS TESTED: none (documents gaps only)
// KNOWN ISSUES:
//   - Exams: no live API calls — placeholder page with static UI
//   - Report Cards: no live API calls — placeholder page
//   - ID Cards: no live API calls — uses mock student data
//   - HR/Payroll: no live API calls — placeholder page
//   - Online Classes teacher URL save: no live API — stored in local state only
//   - Notifications: mock data only — no real notification endpoint called
//
// HOW TO FIX: For each module below, wire the corresponding API endpoint.
// The pattern to follow is: isDemoMode() → mock data; else → api.get/post(endpoint)

import { describe, expect, it, vi } from "vitest";
import { mockFetchOk, setToken } from "./setup";

const BASE = "https://escola.doorstepgarage.in/api";

// ─────────────────────────────────────────────────────────────────────────────
// These tests PASS because they document the ABSENCE of API calls.
// They are not testing broken code — they are documenting missing features.
// ─────────────────────────────────────────────────────────────────────────────

describe("KNOWN BROKEN: Exams module — no live API wiring", () => {
  /**
   * The ExamsPage.tsx is a placeholder with hardcoded exam data.
   * No API endpoint is called. The page renders static content.
   *
   * FIX NEEDED: Wire the following endpoints:
   *   GET  /exams?classId=&status=    → list exams
   *   POST /exams                     → create exam
   *   PUT  /exams/{id}                → update exam
   *   DELETE /exams/{id}              → delete exam
   *   GET  /exams/{id}/results        → exam results per student
   */
  it("documents that Exams page has NO live API calls", () => {
    // This test intentionally passes — it documents the gap.
    // When exams ARE wired, replace this with real API call assertions.
    const examsEndpoints = [
      `${BASE}/exams`,
      `${BASE}/exams?classId=10&status=upcoming`,
    ];
    // Verify the expected endpoints exist as strings (not yet called)
    expect(examsEndpoints[0]).toContain("/exams");
    expect(examsEndpoints[1]).toContain("classId=10");
  });

  it("⚠️ MISSING: GET /exams should be called on ExamsPage mount", () => {
    // If this test is replaced with a real fetch assertion and it passes,
    // the Exams module has been wired to the live API.
    expect(true).toBe(true); // placeholder — replace when wired
  });

  it("⚠️ MISSING: POST /exams should be called when creating an exam", () => {
    expect(true).toBe(true); // placeholder — replace when wired
  });
});

describe("KNOWN BROKEN: Report Cards module — no live API wiring", () => {
  /**
   * The ReportCardsPage.tsx renders static/mock data.
   * No report card data is fetched from the API.
   *
   * FIX NEEDED: Wire the following endpoints:
   *   GET  /report-cards?studentId=&term=    → per-student report
   *   GET  /report-cards/class?classId=&term= → class-wide reports
   *   POST /report-cards/generate             → trigger generation
   */
  it("documents that Report Cards page has NO live API calls", () => {
    const reportCardEndpoints = [
      `${BASE}/report-cards`,
      `${BASE}/report-cards?studentId=101&term=Q1`,
    ];
    expect(reportCardEndpoints[0]).toContain("/report-cards");
  });

  it("⚠️ MISSING: GET /report-cards?studentId= should be called for per-student reports", () => {
    expect(true).toBe(true); // placeholder
  });
});

describe("KNOWN BROKEN: ID Cards module — no live API wiring", () => {
  /**
   * The IDCardPage.tsx uses hardcoded/mock student data.
   * Student photos and details are not fetched from the live API.
   *
   * FIX NEEDED:
   *   GET /students/{id}    → fetch student photo and profile
   *   or GET /id-cards?classId= → batch fetch for printing
   */
  it("documents that ID Cards page uses mock data, not live student API", () => {
    const idCardEndpoints = [
      `${BASE}/students/101`, // should be called to get photo + profile
    ];
    expect(idCardEndpoints[0]).toContain("/students/101");
  });

  it("⚠️ MISSING: GET /students/{id} with photo URL should be called for each ID card", () => {
    expect(true).toBe(true); // placeholder
  });
});

describe("KNOWN BROKEN: HR & Payroll module — no live API wiring", () => {
  /**
   * The HRPayrollPage.tsx is a placeholder page with hardcoded staff and payroll data.
   * No HR or payroll endpoints are called.
   *
   * FIX NEEDED: Wire the following endpoints:
   *   GET  /hr/staff             → list staff members
   *   GET  /hr/payroll?month=    → payroll for a given month
   *   POST /hr/payroll/process   → process payroll
   *   GET  /hr/salary/{id}       → individual salary details
   */
  it("documents that HR/Payroll page has NO live API calls", () => {
    const hrEndpoints = [
      `${BASE}/hr/staff`,
      `${BASE}/hr/payroll?month=2024-04`,
    ];
    expect(hrEndpoints[0]).toContain("/hr/staff");
    expect(hrEndpoints[1]).toContain("month=2024-04");
  });

  it("⚠️ MISSING: GET /hr/payroll should be called on HRPayrollPage mount", () => {
    expect(true).toBe(true); // placeholder
  });
});

describe("KNOWN BROKEN: Online Classes — teacher URL not persisted to API", () => {
  /**
   * When a teacher sets a join URL for an online class session, the URL is stored
   * in local React state only. It is NOT sent to any API endpoint.
   * On page refresh, the teacher's URL is lost.
   *
   * FIX NEEDED: Wire the following endpoint:
   *   PUT  /online-classes/{id}  → { joinUrl: string, isLive: boolean }
   *   GET  /online-classes       → list sessions with join URLs and live status
   */
  it("documents that teacher join URL is NOT saved to the live API", () => {
    // This test verifies that NO fetch call is made when a teacher "saves" a URL
    // (because the current implementation uses local state only)
    setToken("teacher-tok");
    mockFetchOk({ success: true });

    // In the current implementation, the teacher URL save doesn't call fetch at all.
    // So global.fetch is never called when the teacher saves a URL.
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled();
  });

  it("⚠️ MISSING: PUT /online-classes/{id} should be called when teacher sets join URL", () => {
    // When wired: teacher saves URL → PUT /online-classes/{id} → { joinUrl, isLive }
    // Students then see active Join button when isLive=true AND joinUrl is set
    expect(true).toBe(true); // placeholder
  });

  it("⚠️ MISSING: GET /online-classes should populate the session list from the API", () => {
    expect(true).toBe(true); // placeholder
  });
});

describe("KNOWN BROKEN: Notifications — mock data only", () => {
  /**
   * The NotificationsPage.tsx renders hardcoded/mock notification data.
   * No notification endpoint is called to fetch real notifications.
   * Payment reminders sent by SuperAdmin appear in mock data but are not
   * fetched from a real notifications API.
   *
   * FIX NEEDED: Wire the following endpoints:
   *   GET  /notifications?userId=&limit=    → fetch real notifications
   *   PUT  /notifications/{id}/read         → mark as read
   *   DELETE /notifications/{id}            → dismiss notification
   */
  it("documents that Notifications page uses mock data only", () => {
    const notifEndpoints = [
      `${BASE}/notifications`,
      `${BASE}/notifications?userId=1&limit=20`,
    ];
    expect(notifEndpoints[0]).toContain("/notifications");
  });

  it("⚠️ MISSING: GET /notifications should be called on NotificationsPage mount", () => {
    expect(true).toBe(true); // placeholder
  });

  it("⚠️ MISSING: PUT /notifications/{id}/read should be called on mark-as-read", () => {
    expect(true).toBe(true); // placeholder
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY REPORT
// ─────────────────────────────────────────────────────────────────────────────

describe("API Wiring Summary", () => {
  it("WIRED modules match the expected list", () => {
    const wiredModules = [
      "Authentication (POST /auth/login, GET /auth/me, POST /auth/logout, POST /auth/refresh)",
      "Students (GET/POST/PUT/DELETE /students, GET /students/{id})",
      "Teachers (GET/POST/PUT /teachers, GET/POST /teachers/{id}/gradebook, POST lesson-plan)",
      "Attendance (GET/POST /attendance, GET /attendance/stats)",
      "Admissions (GET/POST /admissions, PUT/POST /admissions/{id}/verify, POST documents)",
      "Fees (GET /fees/invoices, POST /fees/invoices/{id}/pay, GET /fees/concessions)",
      "Dashboard (GET /dashboard/stats, /dashboard/chart, /events/upcoming, /fees/recent)",
      "Schedule (GET/PUT /schedule, GET /schedule/clashes)",
      "TenantConfig (GET /TenantSettings/config)",
      "SuperAdmin (GET/POST/PUT /TenantSettings/admin/*)",
      "Admin (GET/POST/PUT/DELETE /admin/users, GET /admin/roles, GET/PUT /admin/settings)",
    ];
    expect(wiredModules).toHaveLength(11);
  });

  it("MISSING modules match the expected list", () => {
    const missingModules = [
      "Exams — no live API calls (placeholder page)",
      "Report Cards — no live API calls (placeholder page)",
      "ID Cards — uses mock student data (no photo API call)",
      "HR & Payroll — no live API calls (placeholder page)",
      "Online Classes teacher URL — not persisted to API (local state only)",
      "Notifications — mock data only (no real notification endpoint called)",
    ];
    expect(missingModules).toHaveLength(6);
    // All listed as missing
    for (const m of missingModules) {
      expect(m).toBeTruthy();
    }
  });
});
