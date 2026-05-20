import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarCheck,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutGrid,
  MonitorPlay,
  RefreshCw,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useSchoolProfile } from "../contexts/SchoolProfileContext";
import { useDashboardStats } from "../hooks/useQueries";

// ─── KPI meta config (icon + accent) ─────────────────────────────────────────

interface KpiMeta {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  borderAccent: string;
  accentBg: string;
}

const KPI_CONFIGS: {
  key: string;
  label: string;
  meta: KpiMeta;
  getValue: (s: StatsMap) => string;
  getSub: (s: StatsMap) => string;
  positive: (s: StatsMap) => boolean;
}[] = [
  {
    key: "totalStudents",
    label: "Total Students",
    meta: {
      icon: Users,
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "#3b82f6",
      borderAccent: "#3b82f6",
      accentBg: "rgba(59,130,246,0.07)",
    },
    getValue: (s) => s.totalStudents.toLocaleString(),
    getSub: (s) => `${s.totalClasses} classes`,
    positive: () => true,
  },
  {
    key: "totalTeachers",
    label: "Total Teachers",
    meta: {
      icon: GraduationCap,
      iconBg: "rgba(139,92,246,0.15)",
      iconColor: "#8b5cf6",
      borderAccent: "#8b5cf6",
      accentBg: "rgba(139,92,246,0.07)",
    },
    getValue: (s) => s.totalTeachers.toLocaleString(),
    getSub: (s) => `${s.totalSections} sections`,
    positive: () => true,
  },
  {
    key: "totalClasses",
    label: "Total Classes",
    meta: {
      icon: LayoutGrid,
      iconBg: "rgba(34,197,94,0.15)",
      iconColor: "#22c55e",
      borderAccent: "#22c55e",
      accentBg: "rgba(34,197,94,0.07)",
    },
    getValue: (s) => s.totalClasses.toLocaleString(),
    getSub: (s) => `${s.totalSections} total sections`,
    positive: () => true,
  },
  {
    key: "totalSections",
    label: "Sections",
    meta: {
      icon: CalendarCheck,
      iconBg: "rgba(234,179,8,0.15)",
      iconColor: "#eab308",
      borderAccent: "#eab308",
      accentBg: "rgba(234,179,8,0.07)",
    },
    getValue: (s) => s.totalSections.toLocaleString(),
    getSub: () => "across all classes",
    positive: () => true,
  },
  {
    key: "presentToday",
    label: "Present Today",
    meta: {
      icon: CalendarCheck,
      iconBg: "rgba(34,197,94,0.15)",
      iconColor: "#22c55e",
      borderAccent: "#22c55e",
      accentBg: "rgba(34,197,94,0.07)",
    },
    getValue: (s) => s.presentToday.toLocaleString(),
    getSub: (s) => `${s.absentToday} absent`,
    positive: (s) => s.absentToday === 0,
  },
  {
    key: "totalFeeCollected",
    label: "Fee Collected",
    meta: {
      icon: DollarSign,
      iconBg: "rgba(16,185,129,0.15)",
      iconColor: "#10b981",
      borderAccent: "#10b981",
      accentBg: "rgba(16,185,129,0.07)",
    },
    getValue: (s) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(s.totalFeeCollected),
    getSub: () => "total collected",
    positive: () => true,
  },
  {
    key: "pendingAdmissions",
    label: "Pending Admissions",
    meta: {
      icon: FileText,
      iconBg: "rgba(249,115,22,0.15)",
      iconColor: "#f97316",
      borderAccent: "#f97316",
      accentBg: "rgba(249,115,22,0.07)",
    },
    getValue: (s) => s.pendingAdmissions.toLocaleString(),
    getSub: (s) => `${s.totalAdmissions} total`,
    positive: (s) => s.pendingAdmissions === 0,
  },
  {
    key: "upcomingExams",
    label: "Upcoming Exams",
    meta: {
      icon: BookOpen,
      iconBg: "rgba(234,179,8,0.15)",
      iconColor: "#eab308",
      borderAccent: "#eab308",
      accentBg: "rgba(234,179,8,0.07)",
    },
    getValue: (s) => s.upcomingExams.toLocaleString(),
    getSub: () => "scheduled ahead",
    positive: () => true,
  },
  {
    key: "unreadNotifications",
    label: "Notifications",
    meta: {
      icon: Bell,
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "#3b82f6",
      borderAccent: "#3b82f6",
      accentBg: "rgba(59,130,246,0.07)",
    },
    getValue: (s) => s.unreadNotifications.toLocaleString(),
    getSub: (s) => `${s.unreadNotifications} unread`,
    positive: (s) => s.unreadNotifications === 0,
  },
  {
    key: "activeOnlineClasses",
    label: "Active Classes",
    meta: {
      icon: MonitorPlay,
      iconBg: "rgba(139,92,246,0.15)",
      iconColor: "#8b5cf6",
      borderAccent: "#8b5cf6",
      accentBg: "rgba(139,92,246,0.07)",
    },
    getValue: (s) => s.activeOnlineClasses.toLocaleString(),
    getSub: () => "online right now",
    positive: (s) => s.activeOnlineClasses > 0,
  },
  {
    key: "pendingFees",
    label: "Pending Fees",
    meta: {
      icon: Wallet,
      iconBg: "rgba(239,68,68,0.15)",
      iconColor: "#ef4444",
      borderAccent: "#ef4444",
      accentBg: "rgba(239,68,68,0.07)",
    },
    getValue: (s) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(s.pendingFees),
    getSub: (s) => (s.pendingFees > 0 ? "requires follow-up" : "all clear"),
    positive: (s) => s.pendingFees === 0,
  },
  {
    key: "totalAdmissions",
    label: "Total Admissions",
    meta: {
      icon: Users,
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "#3b82f6",
      borderAccent: "#3b82f6",
      accentBg: "rgba(59,130,246,0.07)",
    },
    getValue: (s) => s.totalAdmissions.toLocaleString(),
    getSub: (s) => `${s.pendingAdmissions} pending`,
    positive: (s) => s.pendingAdmissions === 0,
  },
];

type StatsMap = {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSections: number;
  presentToday: number;
  absentToday: number;
  totalFeeCollected: number;
  pendingFees: number;
  totalAdmissions: number;
  pendingAdmissions: number;
  upcomingExams: number;
  activeOnlineClasses: number;
  totalNotifications: number;
  unreadNotifications: number;
};

const _EMPTY_STATS: StatsMap = {
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  totalSections: 0,
  presentToday: 0,
  absentToday: 0,
  totalFeeCollected: 0,
  pendingFees: 0,
  totalAdmissions: 0,
  pendingAdmissions: 0,
  upcomingExams: 0,
  activeOnlineClasses: 0,
  totalNotifications: 0,
  unreadNotifications: 0,
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  cfg,
  stats,
  index,
}: {
  cfg: (typeof KPI_CONFIGS)[0];
  stats: StatsMap;
  index: number;
}) {
  const { meta } = cfg;
  const value = cfg.getValue(stats);
  const sub = cfg.getSub(stats);
  const positive = cfg.positive(stats);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "tween",
        ease: [0.16, 1, 0.3, 1],
        duration: 0.4,
        delay: 0.05 + index * 0.04,
      }}
      className="bg-card rounded-2xl border border-border p-5 relative overflow-hidden hover:shadow-md transition-all duration-200"
      style={{ background: meta.accentBg }}
      data-ocid={`dashboard.kpi.${cfg.key}.card`}
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 inset-y-4 w-[3px] rounded-r-full"
        style={{ background: meta.borderAccent }}
      />
      {/* Top gradient line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl"
        style={{
          background: `linear-gradient(90deg, ${meta.borderAccent}, transparent 60%)`,
          opacity: 0.45,
        }}
      />

      <div className="flex items-start justify-between mb-4 pl-3">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-snug max-w-[7rem]">
          {cfg.label}
        </p>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: meta.iconBg }}
        >
          <span
            style={{ color: meta.iconColor }}
            className="flex items-center justify-center"
          >
            <meta.icon className="w-5 h-5" />
          </span>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 + index * 0.04, type: "tween" }}
        className="text-3xl font-bold font-display text-foreground leading-none mb-2 pl-3"
      >
        {value}
      </motion.p>

      <div className="flex items-center gap-1 pl-3">
        {positive ? (
          <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
        )}
        <p
          className={`text-xs font-medium ${
            positive ? "text-green-600" : "text-red-500"
          }`}
        >
          {sub}
        </p>
      </div>
    </motion.div>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// ─── Role badge colors ────────────────────────────────────────────────────────

function getRoleBadgeStyle(role: string): string {
  const r = role.toLowerCase();
  if (r === "principal" || r === "admin")
    return "bg-blue-500/15 text-blue-700 border-blue-200";
  if (r === "teacher") return "bg-green-500/15 text-green-700 border-green-200";
  if (r === "admission_officer")
    return "bg-purple-500/15 text-purple-700 border-purple-200";
  if (r === "account_officer" || r === "accountant")
    return "bg-amber-500/15 text-amber-700 border-amber-200";
  return "bg-muted text-muted-foreground border-border";
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    principal: "Principal",
    admin: "Admin",
    teacher: "Teacher",
    admission_officer: "Admission Officer",
    account_officer: "Account Officer",
    accountant: "Accountant",
    clerk: "Clerk",
  };
  return map[role.toLowerCase()] ?? role.replace(/_/g, " ");
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useSchoolProfile();
  const statsQuery = useDashboardStats();

  const displayName = user?.name || user?.username || "User";
  const role = user?.role ?? "clerk";
  const isAdmin =
    role.toLowerCase() === "principal" || role.toLowerCase() === "admin";

  const stats: StatsMap = {
    totalStudents: statsQuery.data?.totalStudents ?? 0,
    totalTeachers: statsQuery.data?.totalTeachers ?? 0,
    totalClasses: statsQuery.data?.totalClasses ?? 0,
    totalSections: statsQuery.data?.totalSections ?? 0,
    presentToday: statsQuery.data?.presentToday ?? 0,
    absentToday: statsQuery.data?.absentToday ?? 0,
    totalFeeCollected: statsQuery.data?.totalFeeCollected ?? 0,
    pendingFees: statsQuery.data?.pendingFees ?? 0,
    totalAdmissions: statsQuery.data?.totalAdmissions ?? 0,
    pendingAdmissions: statsQuery.data?.pendingAdmissions ?? 0,
    upcomingExams: statsQuery.data?.upcomingExams ?? 0,
    activeOnlineClasses: statsQuery.data?.activeOnlineClasses ?? 0,
    totalNotifications: statsQuery.data?.totalNotifications ?? 0,
    unreadNotifications: statsQuery.data?.unreadNotifications ?? 0,
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Primary stat cards (row 1: core numbers)
  const primaryKeys = [
    "totalStudents",
    "totalTeachers",
    "totalClasses",
    "totalSections",
  ];
  // Secondary stat cards (row 2: operational)
  const secondaryKeys = [
    "presentToday",
    "totalFeeCollected",
    "pendingAdmissions",
    "upcomingExams",
  ];
  // Tertiary (row 3)
  const tertiaryKeys = [
    "unreadNotifications",
    "activeOnlineClasses",
    "pendingFees",
  ];

  const getConfig = (key: string) =>
    KPI_CONFIGS.find((c) => c.key === key) ?? KPI_CONFIGS[0];

  return (
    <div className="space-y-6" data-ocid="dashboard.page">
      {/* ── Hero Banner ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
        className="rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(118deg, var(--color-primary) 0%, oklch(0.32 0.12 268) 55%, oklch(0.26 0.09 280) 100%)",
          boxShadow:
            "0 8px 32px var(--color-primary-light), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
        data-ocid="dashboard.hero"
      >
        {/* Decorative orbs */}
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute right-10 bottom-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.2 265) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              {profile.schoolName && (
                <p
                  className="text-xs font-semibold tracking-widest uppercase mb-1.5"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {profile.schoolName}
                </p>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold font-display leading-tight mb-2">
                Welcome, {displayName} 👋
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {today}
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeStyle(
                    role,
                  )}`}
                  data-ocid="dashboard.role_badge"
                >
                  {getRoleLabel(role)}
                </span>
              </div>
            </div>
            <div className="flex gap-2.5 items-center flex-wrap">
              <Link to="/admissions/new">
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.96)",
                    color: "var(--color-primary)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                  data-ocid="dashboard.new_admission.primary_button"
                >
                  New Application
                </button>
              </Link>
              {isAdmin && (
                <Link to="/setup">
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.13)",
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                    data-ocid="dashboard.school_setup.secondary_button"
                  >
                    School Setup
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Error State ───────────────────────────────────────────────────── */}
      {statsQuery.isError && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap bg-red-50 border border-red-200"
          data-ocid="dashboard.stats.error_state"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Could not load dashboard data
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                {(statsQuery.error as Error)?.message ??
                  "Check your connection and try again"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => statsQuery.refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
            data-ocid="dashboard.stats.retry_button"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </motion.div>
      )}

      {/* ── School Setup Card (principal/admin only) ──────────────────────── */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "tween", ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-amber-200 p-5 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: "rgba(234,179,8,0.07)" }}
          data-ocid="dashboard.setup_card"
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(234,179,8,0.15)" }}
            >
              <Settings className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                School Setup
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Configure Academic Year, Classes, and Sections for your school.
              </p>
            </div>
          </div>
          <Link to="/setup" data-ocid="dashboard.setup_card.primary_button">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors whitespace-nowrap"
            >
              Open Setup →
            </button>
          </Link>
        </motion.div>
      )}

      {/* ── Primary KPI Row (Students, Teachers, Classes, Sections) ────────── */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-1">
          School Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryKeys.map((key, i) =>
            statsQuery.isLoading ? (
              <KpiSkeleton key={key} />
            ) : (
              <KpiCard key={key} cfg={getConfig(key)} stats={stats} index={i} />
            ),
          )}
        </div>
      </div>

      {/* ── Secondary KPI Row (Attendance, Fees, Admissions, Exams) ─────────── */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-1">
          Operations
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryKeys.map((key, i) =>
            statsQuery.isLoading ? (
              <KpiSkeleton key={key} />
            ) : (
              <KpiCard
                key={key}
                cfg={getConfig(key)}
                stats={stats}
                index={i + 4}
              />
            ),
          )}
        </div>
      </div>

      {/* ── Tertiary KPI Row (Notifications, Online Classes, Pending Fees) ─── */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-1">
          Activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tertiaryKeys.map((key, i) =>
            statsQuery.isLoading ? (
              <KpiSkeleton key={key} />
            ) : (
              <KpiCard
                key={key}
                cfg={getConfig(key)}
                stats={stats}
                index={i + 8}
              />
            ),
          )}
        </div>
      </div>

      {/* ── Quick Access Links ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          type: "tween",
          ease: [0.16, 1, 0.3, 1],
          duration: 0.45,
        }}
        className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
        data-ocid="dashboard.quick_access.panel"
      >
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold font-display text-foreground text-sm">
            Quick Access
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Jump to key modules
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-y divide-border">
          {(
            [
              {
                label: "Students",
                icon: Users,
                path: "/students",
                ocid: "dashboard.quick_access.students.link",
                bg: "rgba(59,130,246,0.08)",
                color: "#3b82f6",
              },
              {
                label: "Teachers",
                icon: GraduationCap,
                path: "/teachers",
                ocid: "dashboard.quick_access.teachers.link",
                bg: "rgba(139,92,246,0.08)",
                color: "#8b5cf6",
              },
              {
                label: "Attendance",
                icon: CalendarCheck,
                path: "/attendance",
                ocid: "dashboard.quick_access.attendance.link",
                bg: "rgba(34,197,94,0.08)",
                color: "#22c55e",
              },
              {
                label: "Fees",
                icon: DollarSign,
                path: "/fees",
                ocid: "dashboard.quick_access.fees.link",
                bg: "rgba(16,185,129,0.08)",
                color: "#10b981",
              },
              {
                label: "Exams",
                icon: BookOpen,
                path: "/exams",
                ocid: "dashboard.quick_access.exams.link",
                bg: "rgba(234,179,8,0.08)",
                color: "#eab308",
              },
              {
                label: "Reports",
                icon: FileText,
                path: "/reports",
                ocid: "dashboard.quick_access.reports.link",
                bg: "rgba(249,115,22,0.08)",
                color: "#f97316",
              },
              {
                label: "Notifications",
                icon: Bell,
                path: "/notifications",
                ocid: "dashboard.quick_access.notifications.link",
                bg: "rgba(59,130,246,0.08)",
                color: "#3b82f6",
              },
              {
                label: "Online Classes",
                icon: MonitorPlay,
                path: "/online-classes",
                ocid: "dashboard.quick_access.online_classes.link",
                bg: "rgba(139,92,246,0.08)",
                color: "#8b5cf6",
              },
              {
                label: "Admissions",
                icon: Users,
                path: "/admissions",
                ocid: "dashboard.quick_access.admissions.link",
                bg: "rgba(34,197,94,0.08)",
                color: "#22c55e",
              },
              {
                label: "HR & Payroll",
                icon: Wallet,
                path: "/hr-payroll",
                ocid: "dashboard.quick_access.hr.link",
                bg: "rgba(239,68,68,0.08)",
                color: "#ef4444",
              },
            ] as const
          ).map((item, idx) => (
            <Link key={item.path} to={item.path}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + idx * 0.03, type: "tween" }}
                className="flex flex-col items-center gap-2 px-4 py-5 hover:bg-muted/40 transition-colors cursor-pointer group"
                data-ocid={item.ocid}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                  style={{ background: item.bg }}
                >
                  <item.icon
                    className="w-5 h-5"
                    style={{ color: item.color }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground text-center group-hover:text-primary transition-colors">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Loading state placeholder ─────────────────────────────────────── */}
      {statsQuery.isLoading && (
        <div
          className="text-center py-4 text-xs text-muted-foreground"
          data-ocid="dashboard.stats.loading_state"
        >
          Loading dashboard data…
        </div>
      )}

      {/* ── Empty-state hint when all zeros and not loading ───────────────── */}
      {!statsQuery.isLoading &&
        !statsQuery.isError &&
        stats.totalStudents === 0 &&
        stats.totalTeachers === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, type: "tween" }}
            className="bg-card rounded-2xl border border-border p-8 text-center"
            data-ocid="dashboard.stats.empty_state"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--color-primary-light)" }}
            >
              <GraduationCap
                className="w-7 h-7"
                style={{ color: "var(--color-primary)" }}
              />
            </div>
            <h3 className="font-semibold font-display text-foreground text-base mb-1">
              No data yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by setting up your school structure — add academic years,
              classes, and sections.
            </p>
            {isAdmin && (
              <Link to="/setup">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ background: "var(--color-primary)" }}
                  data-ocid="dashboard.empty_state.setup_button"
                >
                  Go to School Setup
                </button>
              </Link>
            )}
          </motion.div>
        )}
    </div>
  );
}
