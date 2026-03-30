import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Plus,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { mockApplications } from "../lib/mockData";
import type { Application } from "../lib/mockData";
import { withDelay } from "../lib/mockData";

type FilterStatus = "all" | Application["status"];

const statusConfig: Record<
  Application["status"],
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  under_review: {
    label: "Under Review",
    className: "bg-blue-100 text-blue-700",
  },
  approved: { label: "Approved", className: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
  enrolled: { label: "Enrolled", className: "bg-purple-100 text-purple-700" },
};

const PAGE_SIZE = 7;

function generateEnrollmentId(_name: string, idx: number) {
  const year = new Date().getFullYear();
  const num = String(1000 + idx).padStart(4, "0");
  return `ENR-${year}-${num}`;
}

export default function AdmissionsPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    withDelay(mockApplications).then((data) => {
      setApplications(data);
      setIsLoading(false);
    });
  }, []);

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (val: string) => {
    setFilter(val as FilterStatus);
    setPage(1);
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    enrolled: applications.filter((a) => a.status === "enrolled").length,
    under_review: applications.filter((a) => a.status === "under_review")
      .length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Admissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage student applications and enrollment
          </p>
        </div>
        <Link to="/admissions/new">
          <Button
            size="sm"
            className="gap-1.5"
            data-ocid="admissions.primary_button"
          >
            <Plus className="w-4 h-4" />
            New Application
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Applications",
            value: stats.total,
            color: "text-foreground",
          },
          {
            label: "Pending Review",
            value: stats.pending + stats.under_review,
            color: "text-yellow-600",
          },
          { label: "Approved", value: stats.approved, color: "text-success" },
          { label: "Enrolled", value: stats.enrolled, color: "text-primary" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border border-border shadow-card p-4"
            data-ocid={`admissions.stats.${i + 1}.card`}
          >
            <p className="text-xs text-muted-foreground font-medium">
              {stat.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <Tabs value={filter} onValueChange={handleFilterChange}>
            <TabsList className="h-8">
              {(
                [
                  "all",
                  "pending",
                  "under_review",
                  "approved",
                  "rejected",
                  "enrolled",
                ] as FilterStatus[]
              ).map((f) => (
                <TabsTrigger
                  key={f}
                  value={f}
                  className="text-xs px-3 capitalize"
                  data-ocid={`admissions.${f}.tab`}
                >
                  {f.replace("_", " ")}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div
            className="p-8 flex items-center justify-center"
            data-ocid="admissions.loading_state"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">
                Loading applications...
              </p>
            </div>
          </div>
        ) : paginated.length === 0 ? (
          <div
            className="p-12 flex flex-col items-center justify-center"
            data-ocid="admissions.empty_state"
          >
            <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No applications found
            </p>
            <p className="text-xs text-muted-foreground/60">
              Try a different filter or create a new application.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" data-ocid="admissions.table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Applicant Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Grade
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">
                    Date Applied
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                    Enrollment ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((app, i) => (
                  <tr
                    key={app.id}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    data-ocid={`admissions.item.${i + 1}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {app.applicantName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {app.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {app.grade}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {app.dateApplied}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[app.status].className}`}
                      >
                        {statusConfig[app.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {app.status === "approved" ||
                      app.status === "enrolled" ? (
                        <Badge
                          variant="outline"
                          className="text-xs font-mono bg-primary/5 text-primary border-primary/30"
                        >
                          {generateEnrollmentId(app.applicantName, i + 1)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          –
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="View"
                          data-ocid={`admissions.view.${i + 1}.button`}
                          onClick={() =>
                            toast.info(
                              `Viewing application for ${app.applicantName}`,
                            )
                          }
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Verify"
                          data-ocid={`admissions.verify.${i + 1}.button`}
                          onClick={() =>
                            toast.success(
                              `Documents verified for ${app.applicantName}`,
                            )
                          }
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Enroll"
                          data-ocid={`admissions.enroll.${i + 1}.button`}
                          onClick={() =>
                            toast.success(
                              `${app.applicantName} enrolled successfully`,
                            )
                          }
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}\u2013
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md hover:bg-accent disabled:opacity-40 transition-colors"
                data-ocid="admissions.pagination_prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md hover:bg-accent disabled:opacity-40 transition-colors"
                data-ocid="admissions.pagination_next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
