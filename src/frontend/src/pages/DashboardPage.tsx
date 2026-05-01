import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarCheck,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import OnboardingWizard from "../components/OnboardingWizard";
import { useAuth } from "../contexts/AuthContext";
import { useSchoolProfile } from "../contexts/SchoolProfileContext";
import {
  useDashboardChart,
  useDashboardStats,
  useRecentFeeActivities,
  useUpcomingEvents,
} from "../hooks/useQueries";
import {
  getRoleOnboardingSteps,
  hasCompletedOnboarding,
  markOnboardingComplete,
} from "../lib/onboarding";

const eventTypeColors: Record<string, { dot: string; badge: string }> = {
  exam: {
    dot: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
  },
  holiday: {
    dot: "bg-success",
    badge: "bg-success/10 text-success border-success/20",
  },
  meeting: {
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  activity: {
    dot: "bg-warning",
    badge: "bg-warning/10 text-warning border-warning/20",
  },
  deadline: {
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-600 border-orange-200",
  },
};

const feeStatusConfig: Record<string, { cls: string; dot: string }> = {
  paid: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "#10b981",
  },
  pending: {
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "#f59e0b",
  },
  overdue: {
    cls: "bg-red-50 text-red-700 border-red-200",
    dot: "#ef4444",
  },
};

function KpiSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="w-11 h-11 rounded-2xl" />
      </div>
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function AdmissionsBarChart({
  data,
}: {
  data: { month: string; applications: number }[];
}) {
  const maxVal = Math.max(...data.map((d) => d.applications), 1);
  return (
    <div className="flex items-end gap-2 h-48 mt-5 px-1">
      {data.map((d, i) => (
        <div
          key={d.month}
          className="flex-1 flex flex-col items-center gap-2 group"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.07 }}
            className="text-[10px] font-bold text-primary"
          >
            {d.applications}
          </motion.span>
          <div
            className="w-full flex flex-col items-center"
            style={{ height: "120px", justifyContent: "flex-end" }}
          >
            <motion.div
              className="w-full rounded-t-xl relative overflow-hidden cursor-default"
              initial={{ height: 0 }}
              animate={{
                height: `${Math.max((d.applications / maxVal) * 100, 5)}%`,
              }}
              transition={{
                type: "tween",
                ease: [0.16, 1, 0.3, 1],
                duration: 0.65,
                delay: 0.1 + i * 0.07,
              }}
              title={`${d.applications} applications`}
              style={{
                background:
                  "linear-gradient(to top, var(--color-primary), oklch(0.55 0.18 268))",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-fast"
                style={{
                  background:
                    "linear-gradient(to top, oklch(0.42 0.16 255), oklch(0.6 0.2 268))",
                }}
              />
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: "rgba(255,255,255,0.3)" }}
              />
            </motion.div>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {d.month}
          </span>
        </div>
      ))}
    </div>
  );
}

interface KpiMeta {
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  iconBg: string;
  iconColor: string;
  borderAccent: string;
}

const KPI_META: KpiMeta[] = [
  {
    icon: Users,
    accentColor: "rgba(59,130,246,0.12)",
    iconBg: "rgba(59,130,246,0.15)",
    iconColor: "#3b82f6",
    borderAccent: "#3b82f6",
  },
  {
    icon: GraduationCap,
    accentColor: "rgba(139,92,246,0.12)",
    iconBg: "rgba(139,92,246,0.15)",
    iconColor: "#8b5cf6",
    borderAccent: "#8b5cf6",
  },
  {
    icon: DollarSign,
    accentColor: "rgba(34,197,94,0.12)",
    iconBg: "rgba(34,197,94,0.15)",
    iconColor: "#22c55e",
    borderAccent: "#22c55e",
  },
  {
    icon: CalendarCheck,
    accentColor: "rgba(234,179,8,0.12)",
    iconBg: "rgba(234,179,8,0.15)",
    iconColor: "#eab308",
    borderAccent: "#eab308",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useSchoolProfile();
  const statsQuery = useDashboardStats();
  const chartQuery = useDashboardChart("monthly");
  const eventsQuery = useUpcomingEvents(5);
  const feesQuery = useRecentFeeActivities(6);

  const userId = user?.id ?? "";
  const [showOnboarding, setShowOnboarding] = useState(
    () => !!user && !hasCompletedOnboarding(userId),
  );

  function handleOnboardingDone() {
    markOnboardingComplete(userId);
    setShowOnboarding(false);
  }

  useEffect(() => {
    if (statsQuery.error)
      toast.error(`Stats: ${(statsQuery.error as Error).message}`);
  }, [statsQuery.error]);
  useEffect(() => {
    if (chartQuery.error)
      toast.error(`Chart: ${(chartQuery.error as Error).message}`);
  }, [chartQuery.error]);
  useEffect(() => {
    if (eventsQuery.error)
      toast.error(`Events: ${(eventsQuery.error as Error).message}`);
  }, [eventsQuery.error]);
  useEffect(() => {
    if (feesQuery.error)
      toast.error(`Fee activities: ${(feesQuery.error as Error).message}`);
  }, [feesQuery.error]);

  const stats = statsQuery.data;
  const kpiCards = [
    {
      label: "Total Students",
      value: stats ? stats.totalStudents.toLocaleString() : null,
      change: "+42 this month",
      positive: true,
    },
    {
      label: "Total Teachers",
      value: stats ? stats.totalTeachers.toLocaleString() : null,
      change: "+3 this month",
      positive: true,
    },
    {
      label: "Fee Collection",
      value: stats ? `$${stats.totalRevenue.toLocaleString()}` : null,
      change: "89% collected",
      positive: true,
    },
    {
      label: "Attendance Today",
      value: stats ? `${stats.attendanceRate}%` : null,
      change: "-0.3% vs yesterday",
      positive: false,
    },
  ];

  const onboardingSteps = getRoleOnboardingSteps(user?.role ?? "clerk");
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {showOnboarding && user && (
        <OnboardingWizard
          steps={onboardingSteps}
          role={user.role}
          userName={user.name.split(" ")[0]}
          onComplete={handleOnboardingDone}
          onSkip={handleOnboardingDone}
        />
      )}

      <div className="space-y-6">
        {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
          className="rounded-2xl p-7 lg:p-8 text-white relative overflow-hidden"
          style={{
            background:
              "linear-gradient(118deg, var(--color-primary) 0%, oklch(0.32 0.12 268) 55%, oklch(0.26 0.09 280) 100%)",
            boxShadow:
              "0 8px 32px var(--color-primary-light), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
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
                <p
                  className="text-xs font-semibold tracking-widest uppercase mb-1.5"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {profile.schoolName}
                </p>
                <h1 className="text-2xl lg:text-3xl font-bold font-display leading-tight mb-2">
                  Welcome back, {user?.name?.split(" ")[0] ?? "User"} 👋
                </h1>
                <p
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {today}
                </p>
              </div>
              <div className="flex gap-2.5 items-center">
                <span
                  className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {user?.role?.replace(/_/g, " ") ?? "Staff"}
                </span>
                <Link to="/admissions/new">
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-smooth hover-lift"
                    style={{
                      background: "rgba(255,255,255,0.96)",
                      color: "var(--color-primary)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                    data-ocid="hero.primary_button"
                  >
                    New Application
                  </button>
                </Link>
                <Link to="/reports">
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-smooth"
                    style={{
                      background: "rgba(255,255,255,0.13)",
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                    data-ocid="hero.secondary_button"
                  >
                    View Reports
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, i) =>
            statsQuery.isLoading ? (
              <KpiSkeleton key={card.label} />
            ) : (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "tween",
                  ease: [0.16, 1, 0.3, 1],
                  duration: 0.42,
                  delay: 0.08 + i * 0.06,
                }}
                className="bg-card rounded-2xl border border-border shadow-card p-5 relative overflow-hidden hover-lift cursor-default"
                style={{
                  background: `linear-gradient(145deg, ${KPI_META[i].accentColor}, transparent)`,
                }}
                data-ocid={`kpi.${card.label
                  .toLowerCase()
                  .replace(/\s+/g, "_")
                  .replace(/[^a-z0-9_]/g, "")}.card`}
              >
                {/* Left accent stripe (brand stripe) */}
                <div
                  className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
                  style={{ background: KPI_META[i].borderAccent }}
                />

                {/* Top accent gradient line */}
                <div
                  className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl"
                  style={{
                    background: `linear-gradient(90deg, ${KPI_META[i].borderAccent}, transparent 60%)`,
                    opacity: 0.5,
                  }}
                />

                <div className="flex items-start justify-between mb-4 pl-2">
                  <p className="text-xs font-semibold text-muted-foreground leading-snug max-w-[6rem] uppercase tracking-wide">
                    {card.label}
                  </p>
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: KPI_META[i].iconBg }}
                  >
                    {(() => {
                      const Icon = KPI_META[i].icon;
                      return (
                        <span style={{ color: KPI_META[i].iconColor }}>
                          <Icon className="w-5 h-5" />
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, type: "tween" }}
                  className="text-3xl font-bold font-display text-foreground leading-none mb-2 pl-2"
                >
                  {card.value ?? "—"}
                </motion.p>

                <div className="flex items-center gap-1 pl-2">
                  {card.positive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                  )}
                  <p
                    className={`text-xs font-medium ${card.positive ? "text-success" : "text-destructive"}`}
                  >
                    {card.change}
                  </p>
                </div>
              </motion.div>
            ),
          )}
        </div>

        {/* ── Main content + Right rail ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-5">
            {/* Admissions Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.22,
                type: "tween",
                ease: [0.16, 1, 0.3, 1],
                duration: 0.5,
              }}
              className="bg-card rounded-2xl border border-border shadow-card p-6"
            >
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="font-semibold font-display text-foreground text-base">
                    Admissions Overview
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Monthly applications – last 6 months
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--color-primary-light)" }}
                >
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>
              </div>

              {chartQuery.isLoading ? (
                <div
                  className="flex items-end gap-2 h-48 mt-5 px-1"
                  data-ocid="dashboard.chart.loading_state"
                >
                  {["a", "b", "c", "d", "e", "f"].map((k, idx) => (
                    <div
                      key={k}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <Skeleton className="w-8 h-3" />
                      <Skeleton
                        className="w-full rounded-xl"
                        style={{ height: `${28 + idx * 14}px` }}
                      />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <AdmissionsBarChart data={chartQuery.data ?? []} />
              )}
            </motion.div>

            {/* Recent Fee Activities */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.32,
                type: "tween",
                ease: [0.16, 1, 0.3, 1],
                duration: 0.5,
              }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 className="font-semibold font-display text-foreground text-base">
                    Recent Fee Activities
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Latest payment records
                  </p>
                </div>
                <Link to="/fees">
                  <span
                    className="text-xs font-semibold transition-fast hover:opacity-70"
                    style={{ color: "var(--color-primary)" }}
                  >
                    View all →
                  </span>
                </Link>
              </div>

              <div className="p-6 pt-4">
                {feesQuery.isLoading ? (
                  <div className="space-y-3" data-ocid="fees.loading_state">
                    {["a", "b", "c", "d"].map((k) => (
                      <div key={k} className="flex gap-4 items-center py-1.5">
                        <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-1">
                    <table className="w-full text-sm" data-ocid="fees.table">
                      <thead>
                        <tr className="border-b border-border/60">
                          <th className="text-left pb-2.5 px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Student
                          </th>
                          <th className="text-left pb-2.5 px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Amount
                          </th>
                          <th className="text-left pb-2.5 px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:table-cell">
                            Date
                          </th>
                          <th className="text-left pb-2.5 px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(feesQuery.data ?? []).map((fee, i) => {
                          const statusCfg = feeStatusConfig[fee.status] ?? {
                            cls: "bg-muted text-muted-foreground border-border",
                            dot: "#94a3b8",
                          };
                          return (
                            <tr
                              key={fee.id}
                              className="border-b border-border/30 hover:bg-muted/25 transition-fast stagger-item"
                              data-ocid={`fees.item.${i + 1}`}
                            >
                              <td className="py-3 px-1">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
                                    style={{
                                      background: "var(--color-primary-light)",
                                      color: "var(--color-primary)",
                                    }}
                                  >
                                    {fee.student?.charAt(0) ?? "?"}
                                  </div>
                                  <span className="font-medium text-foreground truncate max-w-[8rem]">
                                    {fee.student}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-1 font-bold text-foreground">
                                {fee.amount}
                              </td>
                              <td className="py-3 px-1 text-muted-foreground text-xs hidden sm:table-cell">
                                {fee.date}
                              </td>
                              <td className="py-3 px-1">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusCfg.cls}`}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: statusCfg.dot }}
                                  />
                                  {fee.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── Right Rail ─────────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.28,
                type: "tween",
                ease: [0.16, 1, 0.3, 1],
                duration: 0.5,
              }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-semibold font-display text-foreground text-sm">
                  Upcoming Events
                </h3>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="p-5 pt-4">
                {eventsQuery.isLoading ? (
                  <div className="space-y-4" data-ocid="events.loading_state">
                    {["a", "b", "c", "d"].map((k) => (
                      <div key={k} className="flex gap-3 items-start">
                        <Skeleton className="w-2 h-2 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {(eventsQuery.data ?? []).map((event, i) => {
                      const colors = eventTypeColors[event.type] ?? {
                        dot: "bg-muted-foreground",
                        badge: "bg-muted text-muted-foreground border-border",
                      };
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.3 + i * 0.06,
                            type: "tween",
                          }}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-accent/60 transition-fast cursor-default stagger-item"
                          data-ocid={`events.item.${i + 1}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${colors.dot}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-snug truncate">
                              {event.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {event.date} · {event.time}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 capitalize flex-shrink-0 border ${colors.badge}`}
                          >
                            {event.type.replace("_", " ")}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Access */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.38,
                type: "tween",
                ease: [0.16, 1, 0.3, 1],
                duration: 0.5,
              }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold font-display text-foreground text-sm">
                  Quick Access
                </h3>
              </div>
              <div className="p-3">
                {[
                  {
                    label: "Add New Student",
                    icon: Plus,
                    path: "/admissions/new",
                    ocid: "quick_access.add_student.button",
                    bg: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                  },
                  {
                    label: "Mark Attendance",
                    icon: CalendarCheck,
                    path: "/attendance",
                    ocid: "quick_access.mark_attendance.button",
                    bg: "rgba(34,197,94,0.1)",
                    color: "#22c55e",
                  },
                  {
                    label: "Generate Report",
                    icon: FileText,
                    path: "/reports",
                    ocid: "quick_access.generate_report.button",
                    bg: "rgba(139,92,246,0.1)",
                    color: "#8b5cf6",
                  },
                  {
                    label: "View Exams",
                    icon: BookOpen,
                    path: "/exams",
                    ocid: "quick_access.view_exams.button",
                    bg: "rgba(234,179,8,0.1)",
                    color: "#eab308",
                  },
                ].map((item, idx) => (
                  <Link key={item.path} to={item.path}>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.06, type: "tween" }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-fast text-left group"
                      data-ocid={item.ocid}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: item.bg }}
                      >
                        <item.icon
                          className="w-4 h-4"
                          style={{ color: item.color }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-fast">
                        {item.label}
                      </span>
                    </motion.button>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Module Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.45,
                type: "tween",
                ease: [0.16, 1, 0.3, 1],
                duration: 0.5,
              }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold font-display text-foreground text-sm">
                  Module Activity
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  {
                    label: "Admissions",
                    pct: 72,
                    color: "var(--color-primary)",
                  },
                  { label: "Attendance", pct: 91, color: "#22c55e" },
                  { label: "Fee Collection", pct: 63, color: "#eab308" },
                  { label: "Online Classes", pct: 44, color: "#8b5cf6" },
                ].map((item, idx) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">
                        {item.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{
                          type: "tween",
                          ease: [0.16, 1, 0.3, 1],
                          duration: 0.8,
                          delay: 0.5 + idx * 0.08,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
