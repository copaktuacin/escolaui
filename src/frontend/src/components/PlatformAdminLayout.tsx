import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isDemoMode } from "../lib/demoMode";

// ─── Inline SVG icons (plain, aria-hidden) ────────────────────────────────────

function IconDashboard() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 flex-shrink-0"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 flex-shrink-0"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
function IconCreditCard() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 flex-shrink-0"
    >
      <rect width="22" height="16" x="1" y="4" rx="2" ry="2" />
      <line x1="1" x2="23" y1="10" y2="10" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 flex-shrink-0"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconScroll() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 flex-shrink-0"
    >
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    </svg>
  );
}
function IconShield({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconLogOut() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  path: string;
  Icon: () => ReactElement;
  description: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/platform-admin",
    Icon: IconDashboard,
    description: "Overview & metrics",
  },
  {
    label: "Schools",
    path: "/platform-admin/schools",
    Icon: IconBuilding,
    description: "Tenant profiles",
  },
  {
    label: "Subscriptions",
    path: "/platform-admin/subscriptions",
    Icon: IconCreditCard,
    description: "Plans & billing",
  },
  {
    label: "Payment Reminders",
    path: "/platform-admin/reminders",
    Icon: IconBell,
    description: "Send reminders",
  },
  {
    label: "Reminder Log",
    path: "/platform-admin/reminder-log",
    Icon: IconScroll,
    description: "History",
  },
];

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const demo = isDemoMode();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) ?? "PA";

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background:
          "linear-gradient(180deg, #0f172a 0%, #111827 60%, #1a2035 100%)",
      }}
    >
      {/* Top accent line */}
      <div
        className="h-0.5 w-full flex-shrink-0"
        style={{
          background:
            "linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, transparent 100%)",
        }}
      />

      {/* Branding */}
      <div className="px-4 py-4 flex-shrink-0 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <IconShield />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">
                EscolaUI
              </p>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#818cf8" }}
              >
                Platform Admin
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
              aria-label="Close navigation menu"
            >
              <IconClose />
            </button>
          )}
        </div>
        {demo && (
          <div className="mt-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest"
              style={{
                background: "rgba(251,191,36,0.12)",
                color: "#fbbf24",
                border: "1px solid rgba(251,191,36,0.25)",
              }}
              data-ocid="platform-admin.demo_badge"
            >
              Demo Mode
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-2 py-3 overflow-y-auto"
        aria-label="Platform admin navigation"
      >
        <p
          className="px-3 mb-2 text-[9px] font-bold uppercase tracking-widest"
          style={{ color: "#374151" }}
        >
          Administration
        </p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === "/platform-admin"
                ? location.pathname === "/platform-admin"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                data-ocid={`platform-admin.nav.${item.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}.link`}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 px-3 py-2.5 group ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
                }`}
                style={
                  isActive
                    ? {
                        background: "rgba(99,102,241,0.18)",
                        boxShadow: "inset 3px 0 0 #6366f1",
                      }
                    : {}
                }
              >
                <span
                  className={
                    isActive
                      ? "text-indigo-400"
                      : "text-gray-600 group-hover:text-gray-400"
                  }
                >
                  <item.Icon />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{item.label}</span>
                  <span
                    className="block text-[10px] truncate"
                    style={{ color: isActive ? "#a5b4fc" : "#374151" }}
                  >
                    {item.description}
                  </span>
                </div>
                {isActive && (
                  <span style={{ color: "#6366f1" }}>
                    <IconChevronRight />
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 flex-shrink-0 border-t border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-200 truncate leading-none">
              {user?.name}
            </p>
            <p
              className="text-[10px] truncate mt-0.5"
              style={{ color: "#4b5563" }}
            >
              Platform Administrator
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-md transition-colors hover:bg-white/10 text-gray-600 hover:text-red-400 flex-shrink-0"
            aria-label="Log out"
            data-ocid="platform-admin.logout.button"
          >
            <IconLogOut />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function PlatformAdminLayout({
  children,
}: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const demo = isDemoMode();

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel =
    NAV_ITEMS.find((item) =>
      item.path === "/platform-admin"
        ? location.pathname === "/platform-admin"
        : location.pathname.startsWith(item.path),
    )?.label ?? "Administration";

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) ?? "PA";

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#111827" }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 shadow-2xl overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ background: "rgba(0,0,0,0.65)" }}
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close navigation"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-60 z-50 shadow-2xl">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Demo banner */}
        {demo && (
          <div
            className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold flex-shrink-0"
            style={{
              background: "rgba(251,191,36,0.08)",
              borderBottom: "1px solid rgba(251,191,36,0.15)",
              color: "#fbbf24",
            }}
            data-ocid="platform-admin.demo_banner"
          >
            Demo Mode — no real API calls are made.
          </div>
        )}

        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-4 lg:px-5 h-14 flex-shrink-0 border-b"
          style={{
            background: "linear-gradient(90deg, #111827, #1e293b)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/10 text-gray-500"
            onClick={() => setMobileOpen(true)}
            data-ocid="platform-admin.menu.toggle"
            aria-label="Open navigation menu"
          >
            <IconMenu />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              <span style={{ color: "#818cf8" }}>
                <IconShield className="w-3.5 h-3.5" />
              </span>
            </div>
            <span
              className="text-xs font-medium uppercase tracking-wider hidden sm:block"
              style={{ color: "#4b5563" }}
            >
              Platform
            </span>
            <span className="hidden sm:block" style={{ color: "#374151" }}>
              <IconChevronRight />
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: "#e5e7eb" }}
            >
              {currentLabel}
            </span>
          </div>

          <div className="flex-1" />

          {/* SuperAdmin badge */}
          <span
            className="text-[10px] px-2.5 py-1 font-semibold uppercase tracking-wider rounded-md hidden sm:inline-flex items-center gap-1.5"
            style={{
              background: "rgba(99,102,241,0.15)",
              color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            <IconShield className="w-2.5 h-2.5" />
            SuperAdmin
          </span>

          {/* User info + dropdown menu */}
          <div className="relative flex items-center gap-2" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-white/10"
              aria-label="User menu"
              data-ocid="platform-admin.topbar.user_menu.toggle"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                {initials}
              </div>
              <span
                className="text-sm font-medium hidden md:block"
                style={{ color: "#d1d5db" }}
              >
                {user?.name?.split(" ").slice(0, 2).join(" ")}
              </span>
            </button>

            {/* Dropdown — plain HTML only, no Radix/AnimatePresence */}
            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden border"
                style={{
                  background: "#1e293b",
                  borderColor: "rgba(255,255,255,0.1)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                  zIndex: 9999,
                }}
                data-ocid="platform-admin.user_menu.dropdown"
              >
                {/* User info header */}
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: "#e2e8f0" }}
                  >
                    {user?.name}
                  </p>
                  <p
                    className="text-[10px] mt-0.5 truncate"
                    style={{ color: "#4b5563" }}
                  >
                    Platform Administrator
                  </p>
                </div>
                {/* Menu items */}
                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate({ to: "/profile" });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-white/10 text-left"
                    style={{ color: "#d1d5db" }}
                    data-ocid="platform-admin.topbar.profile.button"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "#6366f1" }}
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-red-500/10 text-left"
                    style={{ color: "#f87171" }}
                    data-ocid="platform-admin.topbar.logout.button"
                  >
                    <IconLogOut />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          style={{ background: "#111827" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
