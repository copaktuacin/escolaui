import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Crown,
  DollarSign,
  Eye,
  EyeOff,
  FlaskConical,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Search,
  Trophy,
  UserCog,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSchoolProfile } from "../contexts/SchoolProfileContext";
import { RATE_LIMIT_EVENT, changePassword } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";
import { platformAdminNotifications } from "../lib/mockData";
import { roleLabels, roleNavPaths } from "../lib/rolePermissions";

const DEMO_ADMIN_TENANT_MAP: Record<string, string> = {
  "admin@escolamodel.edu.ng": "demo-escola",
  "admin@cityacademy.edu": "demo-city-academy",
  "contact@sunriseintl.edu": "demo-sunrise",
  "hello@greenfieldhs.edu": "demo-greenfield",
  "info@riversideacademy.edu": "demo-riverside",
  "principal@escola.com": "demo-escola",
};

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
      { label: "Exams", path: "/exams", icon: Trophy },
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
  const navigate = useNavigate();
  const { profile } = useSchoolProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [rateLimitDismissed, setRateLimitDismissed] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const demoActive = isDemoMode();

  // Change password modal state (plain HTML only — no Radix/shadcn)
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [changePwdCurrent, setChangePwdCurrent] = useState("");
  const [changePwdNew, setChangePwdNew] = useState("");
  const [changePwdConfirm, setChangePwdConfirm] = useState("");
  const [changePwdShowCurrent, setChangePwdShowCurrent] = useState(false);
  const [changePwdShowNew, setChangePwdShowNew] = useState(false);
  const [changePwdShowConfirm, setChangePwdShowConfirm] = useState(false);
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [changePwdError, setChangePwdError] = useState("");
  const [changePwdSuccess, setChangePwdSuccess] = useState("");

  function openChangePwd() {
    setChangePwdOpen(true);
    setChangePwdCurrent("");
    setChangePwdNew("");
    setChangePwdConfirm("");
    setChangePwdError("");
    setChangePwdSuccess("");
    setChangePwdShowCurrent(false);
    setChangePwdShowNew(false);
    setChangePwdShowConfirm(false);
    setUserMenuOpen(false);
  }

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault();
    setChangePwdError("");
    setChangePwdSuccess("");
    if (changePwdNew.length < 8) {
      setChangePwdError("New password must be at least 8 characters.");
      return;
    }
    if (changePwdNew !== changePwdConfirm) {
      setChangePwdError("New password and confirmation do not match.");
      return;
    }
    setChangePwdLoading(true);
    try {
      const res = await changePassword(changePwdCurrent, changePwdNew);
      if (res.success) {
        setChangePwdSuccess("Password changed successfully.");
        setChangePwdCurrent("");
        setChangePwdNew("");
        setChangePwdConfirm("");
      } else {
        setChangePwdError(res.error ?? "Failed to change password.");
      }
    } catch {
      setChangePwdError("Network error — unable to reach the server.");
    } finally {
      setChangePwdLoading(false);
    }
  }

  const tenantId = user?.email
    ? (DEMO_ADMIN_TENANT_MAP[user.email] ?? "demo-escola")
    : "demo-escola";

  const unreadPlatformCount = useMemo(() => {
    if (!user) return 0;
    const notifs = platformAdminNotifications[tenantId] ?? [];
    return notifs.filter((n) => !n.read).length;
  }, [user, tenantId]);

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

  const currentPageLabel =
    location.pathname.split("/")[1]?.replace(/-/g, " ") || "Dashboard";

  const renderSidebarContent = () => (
    <div
      className="flex flex-col h-full"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.13 0.045 242) 0%, oklch(0.17 0.05 240) 45%, oklch(0.21 0.055 237) 100%)",
      }}
    >
      {/* Top brand accent line */}
      <div
        className="h-0.5 w-full flex-shrink-0"
        style={{
          background:
            "linear-gradient(90deg, var(--color-primary) 0%, oklch(0.6 0.15 240 / 0.3) 60%, transparent 100%)",
        }}
      />

      {/* Logo + School Name header */}
      <div
        className="px-4 py-4 flex-shrink-0 relative"
        style={{ borderBottom: "1px solid oklch(0.28 0.045 240 / 0.5)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {profile.logo ? (
            <img
              src={profile.logo}
              alt="logo"
              className="w-9 h-9 rounded-xl object-cover flex-shrink-0 shadow-card ring-1 ring-white/10"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-floating ring-1 ring-white/20"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), oklch(0.5 0.18 265))",
              }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <span className="text-sm font-bold text-white tracking-tight truncate font-display block">
                {profile.schoolName}
              </span>
              {profile.tagline && (
                <p
                  className="text-[10px] truncate mt-0.5"
                  style={{ color: "oklch(0.52 0.04 240)" }}
                >
                  {profile.tagline}
                </p>
              )}
              {demoActive && (
                <span
                  className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
                  style={{
                    background: "oklch(0.78 0.17 65 / 0.15)",
                    color: "oklch(0.82 0.18 65)",
                    border: "1px solid oklch(0.75 0.18 65 / 0.3)",
                  }}
                  data-ocid="sidebar.demo_mode.toggle"
                >
                  <FlaskConical className="w-2 h-2" />
                  Demo
                </span>
              )}
            </div>
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full items-center justify-center shadow-card transition-all duration-200 hover:shadow-elevated z-10"
          style={{
            background: "oklch(0.25 0.04 240)",
            border: "1px solid oklch(0.32 0.045 240)",
            color: "oklch(0.65 0.04 240)",
          }}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-ocid="sidebar.collapse.toggle"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-thin">
        {filteredNavGroups.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: gi * 0.06,
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="mb-4"
          >
            {!sidebarCollapsed && (
              <p
                className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] truncate"
                style={{ color: "oklch(0.42 0.04 240)" }}
              >
                {group.label}
              </p>
            )}
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
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                      sidebarCollapsed
                        ? "px-0 justify-center py-2.5"
                        : "px-3 py-2.5"
                    } ${
                      active
                        ? "text-white"
                        : "text-white/45 hover:text-white/85 hover:bg-white/[0.06]"
                    }`}
                    style={
                      active
                        ? {
                            background:
                              "linear-gradient(90deg, var(--color-primary-light) 0%, oklch(0.27 0.05 235 / 0.35) 100%)",
                            boxShadow: "inset 3px 0 0 var(--color-primary)",
                          }
                        : {}
                    }
                  >
                    {/* Pulse dot for active */}
                    {active && (
                      <span
                        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
                        style={{ background: "var(--color-primary)" }}
                      />
                    )}
                    <item.icon
                      className={`flex-shrink-0 transition-all duration-200 ${
                        sidebarCollapsed ? "w-5 h-5" : "w-4 h-4"
                      } ${active ? "text-white" : "text-white/35 group-hover:text-white/70"}`}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate overflow-hidden whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                    {active && !sidebarCollapsed && (
                      <ChevronRight className="w-3 h-3 ml-auto text-white/30 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}
      </nav>

      {/* User info at bottom */}
      <div
        className="px-3 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid oklch(0.27 0.04 240 / 0.5)" }}
      >
        <div
          className={`flex items-center gap-2.5 ${sidebarCollapsed ? "justify-center" : ""}`}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-1 ring-white/20 shadow-card"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), oklch(0.48 0.18 265))",
            }}
          >
            {initials}
          </div>

          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-xs font-semibold text-white/85 truncate leading-none">
                {user?.name}
              </p>
              <p
                className="text-[10px] truncate mt-0.5"
                style={{ color: "oklch(0.48 0.03 240)" }}
              >
                {roleLabel}
              </p>
            </div>
          )}

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-md transition-colors hover:bg-white/10 flex-shrink-0 focus-ring"
              style={{ color: "oklch(0.48 0.03 240)" }}
              aria-label="Log out"
              data-ocid="sidebar.logout.button"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
          {sidebarCollapsed && (
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-md transition-colors hover:bg-white/10 flex-shrink-0"
              style={{ color: "oklch(0.48 0.03 240)" }}
              aria-label="Log out"
              title="Log out"
              data-ocid="sidebar.logout.button"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:flex flex-shrink-0 flex-col shadow-overlay overflow-hidden"
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {renderSidebarContent()}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <div
              role="button"
              tabIndex={-1}
              aria-label="Close sidebar"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{
                type: "tween",
                duration: 0.25,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="absolute left-0 top-0 bottom-0 w-[240px] z-50 shadow-overlay"
            >
              {renderSidebarContent()}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Demo mode top banner */}
        {demoActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold flex-shrink-0"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.78 0.17 65 / 0.08), oklch(0.78 0.17 65 / 0.12), oklch(0.78 0.17 65 / 0.08))",
              borderBottom: "1px solid oklch(0.75 0.18 65 / 0.2)",
              color: "oklch(0.65 0.18 65)",
            }}
            data-ocid="topbar.demo_banner"
          >
            <FlaskConical className="w-3.5 h-3.5 animate-bounce-gentle" />
            <span>Demo Mode — all data is simulated. No real API calls.</span>
          </motion.div>
        )}

        {/* Rate limit banner */}
        <AnimatePresence>
          {rateLimit && !rateLimitDismissed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-warning/20 px-4 py-2 flex items-center gap-2 text-sm flex-shrink-0"
              style={{ background: "oklch(0.78 0.17 65 / 0.08)" }}
            >
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              <span className="text-foreground/80">
                API rate limit: {rateLimit.remaining} requests remaining. Resets{" "}
                {rateLimit.reset
                  ? `at ${new Date(Number.parseInt(rateLimit.reset) * 1000).toLocaleTimeString()}`
                  : "soon"}
                .
              </span>
              <button
                type="button"
                onClick={() => setRateLimitDismissed(true)}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="rate_limit.close_button"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Top bar ─────────────────────────────────────────────────── */}
        <header className="bg-card border-b border-border/50 px-4 lg:px-5 flex items-center gap-3 flex-shrink-0 h-14 shadow-subtle relative z-30">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
            data-ocid="nav.menu.toggle"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Breadcrumb — desktop */}
          <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider max-w-[120px] truncate">
              {profile.schoolName}
            </span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
            <span className="text-sm font-semibold text-foreground capitalize">
              {currentPageLabel}
            </span>
          </div>

          {/* Search bar */}
          <div
            className={`flex-1 max-w-xs transition-all duration-300 ${
              searchFocused ? "max-w-md" : ""
            }`}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
              <Input
                placeholder="Search students, teachers…"
                className="pl-8 bg-muted/50 border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-card text-sm h-9 rounded-lg transition-all duration-200 text-foreground placeholder:text-muted-foreground/50"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                data-ocid="topbar.search_input"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {/* Notifications */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => navigate({ to: "/notifications" })}
              aria-label={`Notifications${unreadPlatformCount > 0 ? ` — ${unreadPlatformCount} unread` : ""}`}
              data-ocid="topbar.notifications.button"
            >
              <Bell className="w-4.5 h-4.5 w-[18px] h-[18px] text-muted-foreground" />
              {unreadPlatformCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center border-2 border-card animate-glow-pulse"
                >
                  {unreadPlatformCount}
                </motion.span>
              )}
            </motion.button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* User avatar + dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors group"
                onClick={() => setUserMenuOpen((o) => !o)}
                data-ocid="topbar.user_menu.toggle"
                aria-label="User menu"
              >
                <Avatar className="w-7 h-7 flex-shrink-0 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                  <AvatarFallback
                    className="text-[11px] font-bold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-primary), oklch(0.48 0.18 265))",
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left leading-none">
                  <p className="text-sm font-semibold text-foreground leading-none truncate max-w-[120px]">
                    {user?.name?.split(" ").slice(0, 2).join(" ") ?? "User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                    {roleLabel}
                  </p>
                </div>
                <ChevronRight
                  className={`hidden sm:block w-3 h-3 text-muted-foreground/50 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Dropdown — plain HTML conditional, no AnimatePresence */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-floating overflow-hidden"
                  style={{ zIndex: 9999 }}
                >
                  <div className="px-4 py-3 border-b border-border/60">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {user?.email}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1.5 text-[10px] px-2 py-0.5 font-semibold capitalize"
                      style={{
                        borderColor: "var(--color-primary-light)",
                        color: "var(--color-primary)",
                        background: "var(--color-primary-light)",
                      }}
                    >
                      {roleLabel}
                    </Badge>
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate({ to: "/profile" });
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                      data-ocid="topbar.profile.button"
                    >
                      <UserRound className="w-3.5 h-3.5 text-muted-foreground" />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={openChangePwd}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                      data-ocid="topbar.change_password.button"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      data-ocid="topbar.logout.button"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin bg-background">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* ─── Change Password Modal (plain HTML only — no Radix/shadcn) ────── */}
      {changePwdOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
          }}
          data-ocid="change_password.dialog"
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-overlay overflow-hidden"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "var(--color-primary-light)",
                  }}
                >
                  <KeyRound
                    className="w-4 h-4"
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  Change Password
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setChangePwdOpen(false)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close"
                data-ocid="change_password.close_button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleChangePwd} className="px-6 py-5 space-y-4">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="cp-current"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="cp-current"
                    type={changePwdShowCurrent ? "text" : "password"}
                    value={changePwdCurrent}
                    onChange={(e) => setChangePwdCurrent(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full pr-10 pl-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "var(--color-input)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-foreground)",
                    }}
                    placeholder="Enter current password"
                    data-ocid="change_password.current_input"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setChangePwdShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      changePwdShowCurrent ? "Hide password" : "Show password"
                    }
                  >
                    {changePwdShowCurrent ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="cp-new"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="cp-new"
                    type={changePwdShowNew ? "text" : "password"}
                    value={changePwdNew}
                    onChange={(e) => setChangePwdNew(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className="w-full pr-10 pl-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "var(--color-input)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-foreground)",
                    }}
                    placeholder="At least 8 characters"
                    data-ocid="change_password.new_input"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setChangePwdShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      changePwdShowNew ? "Hide password" : "Show password"
                    }
                  >
                    {changePwdShowNew ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="cp-confirm"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="cp-confirm"
                    type={changePwdShowConfirm ? "text" : "password"}
                    value={changePwdConfirm}
                    onChange={(e) => setChangePwdConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full pr-10 pl-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "var(--color-input)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-foreground)",
                    }}
                    placeholder="Repeat new password"
                    data-ocid="change_password.confirm_input"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setChangePwdShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      changePwdShowConfirm ? "Hide password" : "Show password"
                    }
                  >
                    {changePwdShowConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error / Success messages */}
              {changePwdError && (
                <p
                  className="text-sm px-3 py-2 rounded-lg"
                  style={{
                    background: "oklch(0.4 0.18 25 / 0.12)",
                    color: "var(--color-destructive)",
                    border: "1px solid oklch(0.55 0.2 25 / 0.2)",
                  }}
                  data-ocid="change_password.error_state"
                >
                  {changePwdError}
                </p>
              )}
              {changePwdSuccess && (
                <p
                  className="text-sm px-3 py-2 rounded-lg"
                  style={{
                    background: "oklch(0.55 0.16 145 / 0.12)",
                    color: "oklch(0.55 0.16 145)",
                    border: "1px solid oklch(0.55 0.16 145 / 0.25)",
                  }}
                  data-ocid="change_password.success_state"
                >
                  {changePwdSuccess}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setChangePwdOpen(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: "var(--color-muted)",
                    color: "var(--color-muted-foreground)",
                    border: "1px solid var(--color-border)",
                  }}
                  data-ocid="change_password.cancel_button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changePwdLoading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: changePwdLoading
                      ? "var(--color-primary-light)"
                      : "var(--color-primary)",
                    color: "#ffffff",
                  }}
                  data-ocid="change_password.submit_button"
                >
                  {changePwdLoading ? "Saving…" : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
