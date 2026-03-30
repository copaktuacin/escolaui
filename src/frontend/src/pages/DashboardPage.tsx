import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarCheck,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { mockChartData, mockEvents, mockFeeActivities } from "../lib/mockData";

const kpiCards = [
  {
    label: "Total Students",
    value: "2,450",
    icon: Users,
    change: "+42 this month",
    positive: true,
  },
  {
    label: "Total Teachers",
    value: "187",
    icon: GraduationCap,
    change: "+3 this month",
    positive: true,
  },
  {
    label: "Fee Collection (Oct)",
    value: "$112,400",
    icon: DollarSign,
    change: "89% collected",
    positive: true,
  },
  {
    label: "Attendance Today",
    value: "96.2%",
    icon: CalendarCheck,
    change: "-0.3% vs yesterday",
    positive: false,
  },
];

const eventTypeColors: Record<string, string> = {
  exam: "bg-destructive/10 text-destructive",
  holiday: "bg-success/10 text-success",
  meeting: "bg-primary/10 text-primary",
  activity: "bg-warning/10 text-warning",
  deadline: "bg-orange-100 text-orange-600",
};

const feeStatusColors: Record<string, string> = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
};

function AdmissionsBarChart() {
  const maxVal = Math.max(...mockChartData.map((d) => d.applications));
  return (
    <div className="flex items-end gap-3 h-40 mt-4">
      {mockChartData.map((d, i) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full flex flex-col items-center gap-0.5"
            style={{ height: "120px", justifyContent: "flex-end" }}
          >
            <div
              className="w-full rounded-t-md transition-all duration-700 bg-primary/80"
              style={{
                height: `${(d.applications / maxVal) * 100}%`,
                animationDelay: `${i * 80}ms`,
              }}
              title={`${d.applications} applications`}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {d.month}
          </span>
          <span className="text-[10px] text-primary font-bold">
            {d.applications}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(120deg, oklch(0.42 0.14 255) 0%, oklch(0.35 0.12 270) 100%)",
        }}
      >
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-1">
            Central High School
          </p>
          <h1 className="text-xl lg:text-2xl font-bold leading-snug mb-2">
            Welcome to EscolaUI – Admin Panel
          </h1>
          <p className="text-white/75 text-sm max-w-xl">
            Manage admissions, attendance, fees, exams, timetables, and staff
            all from one place.
          </p>
          <div className="flex gap-3 mt-4">
            <Link to="/admissions/new">
              <button
                type="button"
                className="px-4 py-2 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
                data-ocid="hero.primary_button"
              >
                New Application
              </button>
            </Link>
            <Link to="/reports">
              <button
                type="button"
                className="px-4 py-2 bg-white/15 text-white rounded-lg text-sm font-semibold hover:bg-white/25 transition-colors"
                data-ocid="hero.secondary_button"
              >
                View Reports
              </button>
            </Link>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 bottom-0 w-32 h-32 rounded-full bg-white/5" />
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i }}
            className="bg-card rounded-xl border border-border shadow-card p-4 relative overflow-hidden"
            data-ocid={`kpi.${card.label
              .toLowerCase()
              .replace(/\s+/g, "_")
              .replace(/[^a-z0-9_]/g, "")}.card`}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <card.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground leading-none mb-1">
              {card.value}
            </p>
            <p
              className={`text-xs font-medium ${
                card.positive ? "text-success" : "text-destructive"
              }`}
            >
              {card.positive ? "↑" : "↓"} {card.change}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts + Right Rail */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Admissions Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border shadow-card p-5"
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Admissions Overview
                </h3>
                <p className="text-xs text-muted-foreground">
                  Monthly applications – last 6 months
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <AdmissionsBarChart />
          </motion.div>

          {/* Fee Activities */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border shadow-card p-5"
          >
            <h3 className="font-semibold text-foreground text-sm mb-3">
              Recent Fee Activities
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="fees.table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-2 text-xs font-semibold text-muted-foreground">
                      Student
                    </th>
                    <th className="text-left pb-2 text-xs font-semibold text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-left pb-2 text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                      Date
                    </th>
                    <th className="text-left pb-2 text-xs font-semibold text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockFeeActivities.slice(0, 6).map((fee, i) => (
                    <tr
                      key={fee.id}
                      className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                      data-ocid={`fees.item.${i + 1}`}
                    >
                      <td className="py-2.5 font-medium text-foreground">
                        {fee.student}
                      </td>
                      <td className="py-2.5 text-foreground">{fee.amount}</td>
                      <td className="py-2.5 text-muted-foreground hidden sm:table-cell">
                        {fee.date}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${feeStatusColors[fee.status]}`}
                        >
                          {fee.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Right Rail */}
        <div className="space-y-5">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-xl border border-border shadow-card p-5"
          >
            <h3 className="font-semibold text-foreground text-sm mb-3">
              Upcoming Events
            </h3>
            <div className="space-y-3">
              {mockEvents.map((event, i) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3"
                  data-ocid={`events.item.${i + 1}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${eventTypeColors[event.type]?.split(" ")[0] ?? "bg-muted"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">
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
                    className={`text-[10px] px-1.5 py-0 capitalize flex-shrink-0 ${eventTypeColors[event.type] ?? ""}`}
                  >
                    {event.type.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Access */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card rounded-xl border border-border shadow-card p-5"
          >
            <h3 className="font-semibold text-foreground text-sm mb-3">
              Quick Access
            </h3>
            <div className="space-y-2">
              {[
                {
                  label: "Add New Student",
                  icon: Plus,
                  path: "/admissions/new",
                  ocid: "quick_access.add_student.button",
                },
                {
                  label: "Mark Attendance",
                  icon: CalendarCheck,
                  path: "/attendance",
                  ocid: "quick_access.mark_attendance.button",
                },
                {
                  label: "Generate Report",
                  icon: FileText,
                  path: "/reports",
                  ocid: "quick_access.generate_report.button",
                },
                {
                  label: "View Exams",
                  icon: BookOpen,
                  path: "/exams",
                  ocid: "quick_access.view_exams.button",
                },
              ].map((item) => (
                <Link key={item.path} to={item.path}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                    data-ocid={item.ocid}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                  </button>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
