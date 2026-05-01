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
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SchoolProfileProvider } from "./contexts/SchoolProfileContext";
import AdminPage from "./pages/AdminPage";
import AdmissionsPage from "./pages/AdmissionsPage";
import AttendancePage from "./pages/AttendancePage";
import BulkImportPage from "./pages/BulkImportPage";
import DashboardPage from "./pages/DashboardPage";
import ExamsPage from "./pages/ExamsPage";
import FeesPage from "./pages/FeesPage";
import HRPayrollPage from "./pages/HRPayrollPage";
import IDCardPage from "./pages/IDCardPage";
import LoginPage from "./pages/LoginPage";
import NewApplicationPage from "./pages/NewApplicationPage";
import NotificationsPage from "./pages/NotificationsPage";
import OnlineClassesPage from "./pages/OnlineClassesPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import PlatformAdminAddSchoolPage from "./pages/PlatformAdminAddSchoolPage";
import PlatformAdminDashboardPage from "./pages/PlatformAdminDashboardPage";
import PlatformAdminReminderLogPage from "./pages/PlatformAdminReminderLogPage";
import PlatformAdminRemindersPage from "./pages/PlatformAdminRemindersPage";
import PlatformAdminSchoolDetailPage from "./pages/PlatformAdminSchoolDetailPage";
import PlatformAdminSettingsPage from "./pages/PlatformAdminSettingsPage";
import PlatformAdminSubscriptionsPage from "./pages/PlatformAdminSubscriptionsPage";
import PlatformAdminTenantsPage from "./pages/PlatformAdminTenantsPage";
import PrincipalPage from "./pages/PrincipalPage";
import ProfilePage from "./pages/ProfilePage";
import ReportCardPage from "./pages/ReportCardPage";
import SchedulePage from "./pages/SchedulePage";
import StudentsPage from "./pages/StudentsPage";
import TeacherPage from "./pages/TeacherPage";
import TeachersPage from "./pages/TeachersPage";

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

// School-side roles — platform admin is NOT in this list.
// Principal is the school admin and has the broadest school access.
const SCHOOL_ROLES = [
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
  path: "/platform-admin/schools",
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

const platformAdminAddSchoolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/platform-admin/schools/new",
  component: () => (
    <PlatformProtected>
      <PlatformAdminAddSchoolPage />
    </PlatformProtected>
  ),
});

const platformAdminSchoolDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/platform-admin/schools/$id",
  component: () => (
    <PlatformProtected>
      <PlatformAdminSchoolDetailPage />
    </PlatformProtected>
  ),
});

// ─── School-Side Routes ──────────────────────────────────────────────────────
// Platform admin is EXCLUDED from all school-side routes.
// ProtectedRoute will redirect isPlatformAdmin users to /platform-admin.

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <Protected allowedRoles={SCHOOL_ROLES}>
      <DashboardPage />
    </Protected>
  ),
});

const admissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admissions",
  component: () => (
    <Protected allowedRoles={["principal", "admission_officer", "clerk"]}>
      <AdmissionsPage />
    </Protected>
  ),
});

const newApplicationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admissions/new",
  component: () => (
    <Protected allowedRoles={["principal", "admission_officer"]}>
      <NewApplicationPage />
    </Protected>
  ),
});

const studentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/students",
  component: () => (
    <Protected allowedRoles={["principal", "admission_officer"]}>
      <StudentsPage />
    </Protected>
  ),
});

const bulkImportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/students/bulk-import",
  component: () => (
    <Protected allowedRoles={["principal", "admission_officer"]}>
      <BulkImportPage />
    </Protected>
  ),
});

const teachersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teachers",
  component: () => (
    <Protected allowedRoles={["principal"]}>
      <TeachersPage />
    </Protected>
  ),
});

const attendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/attendance",
  component: () => (
    <Protected allowedRoles={["principal", "teacher"]}>
      <AttendancePage />
    </Protected>
  ),
});

const feesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fees",
  component: () => (
    <Protected allowedRoles={["principal", "account_officer", "accountant"]}>
      <FeesPage />
    </Protected>
  ),
});

const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schedule",
  component: () => (
    <Protected allowedRoles={["principal", "teacher"]}>
      <SchedulePage />
    </Protected>
  ),
});

const onlineClassesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/online-classes",
  component: () => (
    <Protected allowedRoles={["principal", "teacher"]}>
      <OnlineClassesPage />
    </Protected>
  ),
});

const idCardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/id-cards",
  component: () => (
    <Protected allowedRoles={["principal"]}>
      <IDCardPage />
    </Protected>
  ),
});

const reportCardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/report-cards",
  component: () => (
    <Protected allowedRoles={["principal", "teacher"]}>
      <ReportCardPage />
    </Protected>
  ),
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: () => (
    <Protected
      allowedRoles={[
        "principal",
        "teacher",
        "admission_officer",
        "account_officer",
        "accountant",
        "clerk",
      ]}
    >
      <NotificationsPage />
    </Protected>
  ),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <Protected allowedRoles={["principal"]}>
      <AdminPage />
    </Protected>
  ),
});

const teacherRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teacher",
  component: () => (
    <Protected allowedRoles={["teacher"]}>
      <TeacherPage />
    </Protected>
  ),
});

const hrPayrollRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hr-payroll",
  component: () => (
    <Protected allowedRoles={["principal", "account_officer", "accountant"]}>
      <HRPayrollPage />
    </Protected>
  ),
});

const principalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/principal",
  component: () => (
    <Protected allowedRoles={["principal"]}>
      <PrincipalPage />
    </Protected>
  ),
});

const examsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exams",
  component: () => (
    <Protected allowedRoles={["principal", "teacher"]}>
      <ExamsPage />
    </Protected>
  ),
});

const staffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staff",
  component: () => (
    <Protected allowedRoles={["principal", "account_officer", "accountant"]}>
      <HRPayrollPage />
    </Protected>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <Protected allowedRoles={["principal"]}>
      <AdminPage />
    </Protected>
  ),
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: () => (
    <Protected allowedRoles={["principal"]}>
      <PlaceholderPage
        title="Reports & Analytics"
        description="Generate comprehensive reports and view school analytics."
      />
    </Protected>
  ),
});

// Profile route — accessible by ALL authenticated users (school + platform admin).
// Uses PlatformAdminLayout for superadmin, school Layout for everyone else.
function ProfileRouteComponent() {
  const { user } = useAuth();
  if (user?.isPlatformAdmin) {
    return (
      <ProtectedRoute requirePlatformAdmin>
        <PlatformAdminLayout>
          <ProfilePage />
        </PlatformAdminLayout>
      </ProtectedRoute>
    );
  }
  return (
    <Protected allowedRoles={SCHOOL_ROLES}>
      <ProfilePage />
    </Protected>
  );
}

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfileRouteComponent,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  // Platform admin routes
  platformAdminDashboardRoute,
  platformAdminTenantsRoute,
  platformAdminAddSchoolRoute,
  platformAdminSchoolDetailRoute,
  platformAdminSubscriptionsRoute,
  platformAdminRemindersRoute,
  platformAdminReminderLogRoute,
  platformAdminSettingsRoute,
  // School-side routes (no tenant-management — removed, belongs in platform admin)
  dashboardRoute,
  admissionsRoute,
  newApplicationRoute,
  studentsRoute,
  bulkImportRoute,
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
  examsRoute,
  staffRoute,
  settingsRoute,
  reportsRoute,
  profileRoute,
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
