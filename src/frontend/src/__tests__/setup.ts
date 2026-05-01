/**
 * Global test setup for EscolaUI unit tests.
 * - Mocks fetch globally with vi.fn()
 * - Clears localStorage before each test
 * - Resets all mocks between tests
 */

import "@testing-library/jest-dom";
import { afterEach, beforeEach, vi } from "vitest";

// Global fetch mock — all tests use this; override per-test with mockImplementationOnce
global.fetch = vi.fn();

beforeEach(() => {
  // Clear all localStorage state between tests
  localStorage.clear();
  // Reset fetch mock call history but keep the spy reference
  vi.mocked(global.fetch).mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Silence console.log/error noise in tests unless explicitly checked
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

// Helper exported for test files
export function mockFetchOk(body: unknown, status = 200) {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

export function mockFetchFail(status: number, message = "Error") {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ message }),
  } as Response);
}

export function mockNetworkError() {
  vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network failure"));
}

export function setToken(token = "test-access-token") {
  localStorage.setItem("accessToken", token);
}

export function setRefreshToken(token = "test-refresh-token") {
  localStorage.setItem("refreshToken", token);
}

export function setDemoMode(active: boolean) {
  localStorage.setItem("escolaui_demo_override", active ? "true" : "false");
}
