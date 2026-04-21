import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import PlatformAdminLayout from "./components/PlatformAdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { SchoolProfileProvider } from "./contexts/SchoolProfileContext";
import AdminPage from "./pages/AdminPage";
import AdmissionsPage from "./pages/AdmissionsPage";
import AttendancePage from "./pages/AttendancePage";
import DashboardPage from "./pages/DashboardPage";
import FeesPage from "./pages/FeesPage";
import HRPayrollPage from "./pages/HRPayrollPage";
import IDCardPage from "./pages/IDCardPage";
import LoginPage from "./pages/LoginPage";
import NewApplicationPage from "./pages/NewApplicationPage";
import NotificationsPage from "./pages/NotificationsPage";
import OnlineClassesPage from "./pages/OnlineClassesPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import PlatformAdminDashboardPage from "./pages/PlatformAdminDashboardPage";
import PlatformAdminReminderLogPage from "./pages/PlatformAdminReminderLogPage";
import PlatformAdminRemindersPage from "./pages/PlatformAdminRemindersPage";
import PlatformAdminSettingsPage from "./pages/PlatformAdminSettingsPage";
import PlatformAdminSubscriptionsPage from "./pages/PlatformAdminSubscriptionsPage";
import PlatformAdminTenantsPage from "./pages/PlatformAdminTenantsPage";
import PrincipalPage from "./pages/PrincipalPage";
import ReportCardPage from "./pages/ReportCardPage";
import SchedulePage from "./pages/SchedulePage";
import StudentsPage from "./pages/StudentsPage";
import TeacherPage from "./pages/TeacherPage";
import TenantManagementPage from "./pages/TenantManagementPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
});

const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <SchoolProfileProvider>
        <AuthProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </SchoolProfileProvider>
    </QueryClientProvider>
  ),
});

// School-side Protected wrapper (uses standard school Layout)
function Protected({
  children,
  allowedRoles,
}: { children: React.ReactNode; allowedRoles?: string[] }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

// Platform admin Protected wrapper (uses PlatformAdminLayout)
function PlatformProtected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requirePlatformAdmin>
      <PlatformAdminLayout>{children}</PlatformAdminLayout>
    </ProtectedRoute>
  );
}

const ALL_ROLES = [
  "admin",
  "principal",
  "teacher",
  "account_officer",
  "accountant",
  "admission_officer",
  "clerk",
];

// ─── Routes ─────────────────────────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});

// ─── Platform Admin Routes ───────────────────────────────────────────────────

const platformAdminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/platform-admin",
  component: () => (
    <PlatformProtected>
      <PlatformAdminDashboardPage />
    </PlatformProtected>
  ),
});

const platformAdminTenantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/platform-admin/tenants",
  component: () => (
    <PlatformProtected>
      <PlatformAdminTenantsPage />
    </PlatformProtected>
  ),
});

const platformAdminSubscriptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/platform-admin/subscriptions",
  component: () => (
    <PlatformProtected>
      <PlatformAdminSubscriptionsPage />
    </PlatformProtected>
  ),
});

const platformAdminRemindersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/platform-admin/reminders",
  component: () => (
    <PlatformProtected>
      <PlatformAdminRemindersPage />
    </PlatformProtected>
  ),
});

const platformAdminReminderLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/platform-admin/reminder-log",
  component: () => (
    <PlatformProtected>
      <PlatformAdminReminderLogPage />
    </PlatformProtected>
  ),
});

const platformAdminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/platform-admin/settings",
  component: () => (
    <PlatformProtected>
      <PlatformAdminSettingsPage />
    </PlatformProtected>
  ),
});

// ─── School-Side Routes ──────────────────────────────────────────────────────

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <Protected allowedRoles={ALL_ROLES}>
      <DashboardPage />
    </Protected>
  ),
});
const admissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admissions",
  component: () => (
    <Protected
      allowedRoles={["admin", "principal", "admission_officer", "clerk"]}
    >
      <AdmissionsPage />
    </Protected>
  ),
});
const newApplicationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admissions/new",
  component: () => (
    <Protected allowedRoles={["admin", "admission_officer"]}>
      <NewApplicationPage />
    </Protected>
  ),
});
const studentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/students",
  component: () => (
    <Protected allowedRoles={["admin", "principal", "admission_officer"]}>
      <StudentsPage />
    </Protected>
  ),
});
const teachersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teachers",
  component: () => (
    <Protected allowedRoles={["admin", "principal"]}>
      <PlaceholderPage
        title="Teachers"
        description="View teacher profiles, assignments, and performance."
      />
    </Protected>
  ),
});
const attendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/attendance",
  component: () => (
    <Protected allowedRoles={["admin", "principal", "teacher"]}>
      <AttendancePage />
    </Protected>
  ),
});
const feesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fees",
  component: () => (
    <Protected allowedRoles={["admin", "account_officer", "accountant"]}>
      <FeesPage />
    </Protected>
  ),
});
const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schedule",
  component: () => (
    <Protected allowedRoles={["admin", "principal", "teacher"]}>
      <SchedulePage />
    </Protected>
  ),
});
const onlineClassesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/online-classes",
  component: () => (
    <Protected allowedRoles={["admin", "teacher"]}>
      <OnlineClassesPage />
    </Protected>
  ),
});
const idCardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/id-cards",
  component: () => (
    <Protected allowedRoles={["admin"]}>
      <IDCardPage />
    </Protected>
  ),
});
const reportCardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/report-cards",
  component: () => (
    <Protected allowedRoles={["admin", "teacher"]}>
      <ReportCardPage />
    </Protected>
  ),
});
const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: () => (
    <Protected allowedRoles={ALL_ROLES}>
      <NotificationsPage />
    </Protected>
  ),
});
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <Protected allowedRoles={["admin"]}>
      <AdminPage />
    </Protected>
  ),
});
const teacherRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teacher",
  component: () => (
    <Protected allowedRoles={["admin", "teacher"]}>
      <TeacherPage />
    </Protected>
  ),
});
const hrPayrollRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hr-payroll",
  component: () => (
    <Protected allowedRoles={["admin", "account_officer", "accountant"]}>
      <HRPayrollPage />
    </Protected>
  ),
});
const principalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/principal",
  component: () => (
    <Protected allowedRoles={["admin", "principal"]}>
      <PrincipalPage />
    </Protected>
  ),
});
const tenantManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tenant-management",
  component: () => (
    <Protected allowedRoles={["admin"]}>
      <TenantManagementPage />
    </Protected>
  ),
});

// Legacy aliases
const examsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exams",
  component: () => (
    <Protected allowedRoles={["admin", "teacher"]}>
      <ReportCardPage />
    </Protected>
  ),
});
const staffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staff",
  component: () => (
    <Protected allowedRoles={["admin", "account_officer", "accountant"]}>
      <HRPayrollPage />
    </Protected>
  ),
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <Protected allowedRoles={["admin"]}>
      <AdminPage />
    </Protected>
  ),
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: () => (
    <Protected allowedRoles={["admin", "principal"]}>
      <PlaceholderPage
        title="Reports & Analytics"
        description="Generate comprehensive reports and view school analytics."
      />
    </Protected>
  ),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  // Platform admin routes
  platformAdminDashboardRoute,
  platformAdminTenantsRoute,
  platformAdminSubscriptionsRoute,
  platformAdminRemindersRoute,
  platformAdminReminderLogRoute,
  platformAdminSettingsRoute,
  // School-side routes
  dashboardRoute,
  admissionsRoute,
  newApplicationRoute,
  studentsRoute,
  teachersRoute,
  attendanceRoute,
  feesRoute,
  scheduleRoute,
  onlineClassesRoute,
  idCardsRoute,
  reportCardsRoute,
  notificationsRoute,
  adminRoute,
  teacherRoute,
  hrPayrollRoute,
  principalRoute,
  tenantManagementRoute,
  examsRoute,
  staffRoute,
  settingsRoute,
  reportsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
