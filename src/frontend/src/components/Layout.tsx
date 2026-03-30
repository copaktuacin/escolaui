import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Crown,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Search,
  Settings,
  Shield,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSchoolProfile } from "../contexts/SchoolProfileContext";
import { RATE_LIMIT_EVENT } from "../lib/api";
import { roleLabels, roleNavPaths } from "../lib/rolePermissions";

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Core",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Students", path: "/students", icon: Users },
      { label: "Teachers", path: "/teachers", icon: GraduationCap },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Admissions", path: "/admissions", icon: ClipboardList },
      { label: "Attendance", path: "/attendance", icon: CalendarCheck },
      { label: "Online Classes", path: "/online-classes", icon: Monitor },
      { label: "Timetable", path: "/schedule", icon: Calendar },
      { label: "Report Cards", path: "/report-cards", icon: BookOpen },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Fees", path: "/fees", icon: DollarSign },
      { label: "HR & Payroll", path: "/hr-payroll", icon: BarChart3 },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "ID Cards", path: "/id-cards", icon: CreditCard },
      { label: "Notifications", path: "/notifications", icon: Bell },
      { label: "Teacher Portal", path: "/teacher", icon: UserCog },
      { label: "Principal Panel", path: "/principal", icon: Crown },
      { label: "Admin", path: "/admin", icon: Shield },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

type RateLimitInfo = {
  limit: string | null;
  remaining: string | null;
  reset: string | null;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { profile } = useSchoolProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [rateLimitDismissed, setRateLimitDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as RateLimitInfo;
      const remaining = Number.parseInt(detail.remaining || "999");
      if (remaining < 10) {
        setRateLimit(detail);
        setRateLimitDismissed(false);
      }
    };
    window.addEventListener(RATE_LIMIT_EVENT, handler);
    return () => window.removeEventListener(RATE_LIMIT_EVENT, handler);
  }, []);

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) ?? "SA";

  const allowedPaths = user?.role ? (roleNavPaths[user.role] ?? []) : [];

  const filteredNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowedPaths.includes(item.path)),
    }))
    .filter((group) => group.items.length > 0);

  const roleLabel = user?.role ? (roleLabels[user.role] ?? user.role) : "";

  const SidebarContent = () => (
    <div
      className="flex flex-col h-full"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.2 0.04 240) 0%, oklch(0.28 0.05 235) 100%)",
      }}
    >
      {/* Logo */}
      <div
        className="px-6 py-5 border-b"
        style={{ borderColor: "oklch(0.3 0.04 240)" }}
      >
        <div className="flex items-center gap-3">
          {profile.logo ? (
            <img
              src={profile.logo}
              alt="logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
            {profile.schoolName}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: "oklch(0.65 0.03 240)" }}>
          {profile.tagline}
        </p>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {filteredNavGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p
              className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "oklch(0.5 0.03 240)" }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  location.pathname === item.path ||
                  (item.path !== "/dashboard" &&
                    location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    data-ocid={`nav.${item.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}.link`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                      active
                        ? "text-white"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5"
                    }`}
                    style={
                      active
                        ? {
                            background: "oklch(0.42 0.14 255 / 0.25)",
                            color: "white",
                          }
                        : {}
                    }
                  >
                    <item.icon
                      className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <ChevronRight className="w-3 h-3 ml-auto text-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User quick info at bottom */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: "oklch(0.3 0.04 240)" }}
      >
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {user?.name}
            </p>
            <p
              className="text-[10px] truncate"
              style={{ color: "oklch(0.6 0.03 240)" }}
            >
              {roleLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[230px] flex-shrink-0 flex-col">
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
              initial={{ x: -230 }}
              animate={{ x: 0 }}
              exit={{ x: -230 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[230px] z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Rate limit banner */}
        <AnimatePresence>
          {rateLimit && !rateLimitDismissed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              <span className="text-foreground/80">
                API rate limit warning: {rateLimit.remaining} requests
                remaining. Resets at{" "}
                {rateLimit.reset
                  ? new Date(
                      Number.parseInt(rateLimit.reset) * 1000,
                    ).toLocaleTimeString()
                  : "soon"}
                .
              </span>
              <button
                type="button"
                onClick={() => setRateLimitDismissed(true)}
                className="ml-auto text-muted-foreground hover:text-foreground"
                data-ocid="rate_limit.close_button"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-md hover:bg-accent transition-colors"
            onClick={() => setSidebarOpen(true)}
            data-ocid="nav.menu.toggle"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-foreground leading-none">
                Welcome,{" "}
                {user?.name?.split(" ").slice(0, 2).join(" ") ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {roleLabel}
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md ml-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students, teachers, records..."
                className="pl-9 bg-accent border-0 text-sm h-9 rounded-full"
                data-ocid="topbar.search_input"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-accent transition-colors"
              data-ocid="topbar.notifications.button"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <Badge className="absolute -top-0.5 -right-0.5 w-4 h-4 p-0 text-[9px] flex items-center justify-center bg-destructive text-destructive-foreground border-0">
                3
              </Badge>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-1.5 text-xs h-8"
              data-ocid="topbar.logout.button"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
