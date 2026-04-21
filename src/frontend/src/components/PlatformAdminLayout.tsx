import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isDemoMode } from "../lib/demoMode";

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const platformNavItems: NavItem[] = [
  { label: "Dashboard", path: "/platform-admin", icon: LayoutDashboard },
  { label: "Tenants", path: "/platform-admin/tenants", icon: Building2 },
  {
    label: "Subscriptions",
    path: "/platform-admin/subscriptions",
    icon: CreditCard,
  },
  { label: "Payment Reminders", path: "/platform-admin/reminders", icon: Bell },
  {
    label: "Reminder Log",
    path: "/platform-admin/reminder-log",
    icon: ScrollText,
  },
  {
    label: "System Settings",
    path: "/platform-admin/settings",
    icon: Settings,
  },
];

export default function PlatformAdminLayout({
  children,
}: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const demoActive = isDemoMode();

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) ?? "PA";

  const SidebarContent = () => (
    <div
      className="flex flex-col h-full"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.18 0.06 260) 0%, oklch(0.25 0.07 255) 100%)",
      }}
    >
      {/* Platform Admin Branding */}
      <div
        className="px-6 py-5 border-b"
        style={{ borderColor: "oklch(0.28 0.05 260)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.6 0.18 260)" }}
          >
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-tight leading-none">
              EscolaUI
            </p>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mt-0.5"
              style={{ color: "oklch(0.65 0.12 260)" }}
            >
              Platform Admin
            </p>
          </div>
        </div>

        {demoActive && (
          <div className="mt-2.5">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{
                background: "oklch(0.85 0.15 85 / 0.18)",
                color: "oklch(0.82 0.16 85)",
                border: "1px solid oklch(0.75 0.18 85 / 0.35)",
              }}
              data-ocid="platform-admin.demo_badge"
            >
              Demo Mode
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p
          className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "oklch(0.5 0.04 260)" }}
        >
          Administration
        </p>
        {platformNavItems.map((item) => {
          const active =
            item.path === "/platform-admin"
              ? location.pathname === "/platform-admin"
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              data-ocid={`platform-admin.nav.${item.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}.link`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active ? "text-white" : "hover:bg-white/5"
              }`}
              style={
                active
                  ? {
                      background: "oklch(0.6 0.18 260 / 0.3)",
                      color: "white",
                      boxShadow: "inset 2px 0 0 oklch(0.65 0.2 260)",
                    }
                  : { color: "oklch(0.72 0.04 260)" }
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {active && (
                <ChevronRight className="w-3 h-3 ml-auto text-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick link back to school side */}
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: "oklch(0.28 0.05 260)" }}
      >
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-white/5"
          style={{ color: "oklch(0.6 0.04 260)" }}
          data-ocid="platform-admin.nav.school_side.link"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Switch to School View</span>
        </Link>
      </div>

      {/* User info */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: "oklch(0.28 0.05 260)" }}
      >
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback
              className="text-xs font-bold text-white"
              style={{ background: "oklch(0.6 0.18 260)" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user?.name}
            </p>
            <p
              className="text-[10px] truncate"
              style={{ color: "oklch(0.6 0.04 260)" }}
            >
              Platform Administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[240px] flex-shrink-0 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[240px] z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Demo banner */}
        {demoActive && (
          <div
            className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium"
            style={{
              background: "oklch(0.85 0.15 85 / 0.1)",
              borderBottom: "1px solid oklch(0.75 0.18 85 / 0.2)",
              color: "oklch(0.65 0.16 85)",
            }}
            data-ocid="platform-admin.demo_banner"
          >
            Demo Mode — all data is simulated. No API calls are made.
          </div>
        )}

        {/* Top bar */}
        <header
          className="border-b border-border px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0"
          style={{ background: "oklch(0.22 0.04 260)" }}
        >
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-md transition-colors"
            style={{ color: "oklch(0.7 0.04 260)" }}
            onClick={() => setSidebarOpen(true)}
            data-ocid="platform-admin.menu.toggle"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Badge
              className="text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider border-0"
              style={{
                background: "oklch(0.6 0.18 260 / 0.25)",
                color: "oklch(0.8 0.12 260)",
              }}
            >
              Platform Admin
            </Badge>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium hidden sm:block"
              style={{ color: "oklch(0.75 0.04 260)" }}
            >
              {user?.name?.split(" ").slice(0, 2).join(" ")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-1.5 text-xs h-8 border-white/10 hover:bg-white/10"
              style={{ color: "oklch(0.7 0.04 260)" }}
              data-ocid="platform-admin.logout.button"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

// Dismiss/close icon exported for convenience
export { X };
