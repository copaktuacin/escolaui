import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
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
import PrincipalPage from "./pages/PrincipalPage";
import ReportCardPage from "./pages/ReportCardPage";
import SchedulePage from "./pages/SchedulePage";
import TeacherPage from "./pages/TeacherPage";

const rootRoute = createRootRoute({
  component: () => (
    <SchoolProfileProvider>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </SchoolProfileProvider>
  ),
});

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

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <Protected>
      <DashboardPage />
    </Protected>
  ),
});
const admissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admissions",
  component: () => (
    <Protected>
      <AdmissionsPage />
    </Protected>
  ),
});
const newApplicationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admissions/new",
  component: () => (
    <Protected>
      <NewApplicationPage />
    </Protected>
  ),
});
const studentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/students",
  component: () => (
    <Protected>
      <PlaceholderPage
        title="Students"
        description="Manage student records, profiles, and academic progress."
      />
    </Protected>
  ),
});
const teachersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teachers",
  component: () => (
    <Protected>
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
    <Protected>
      <AttendancePage />
    </Protected>
  ),
});
const feesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fees",
  component: () => (
    <Protected>
      <FeesPage />
    </Protected>
  ),
});
const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schedule",
  component: () => (
    <Protected>
      <SchedulePage />
    </Protected>
  ),
});
const onlineClassesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/online-classes",
  component: () => (
    <Protected>
      <OnlineClassesPage />
    </Protected>
  ),
});
const idCardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/id-cards",
  component: () => (
    <Protected>
      <IDCardPage />
    </Protected>
  ),
});
const reportCardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/report-cards",
  component: () => (
    <Protected>
      <ReportCardPage />
    </Protected>
  ),
});
const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: () => (
    <Protected>
      <NotificationsPage />
    </Protected>
  ),
});
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <Protected>
      <AdminPage />
    </Protected>
  ),
});
const teacherRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teacher",
  component: () => (
    <Protected>
      <TeacherPage />
    </Protected>
  ),
});
const hrPayrollRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hr-payroll",
  component: () => (
    <Protected>
      <HRPayrollPage />
    </Protected>
  ),
});
const principalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/principal",
  component: () => (
    <Protected>
      <PrincipalPage />
    </Protected>
  ),
});

// Kept for old paths
const examsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exams",
  component: () => (
    <Protected>
      <ReportCardPage />
    </Protected>
  ),
});
const staffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staff",
  component: () => (
    <Protected>
      <HRPayrollPage />
    </Protected>
  ),
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <Protected>
      <AdminPage />
    </Protected>
  ),
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: () => (
    <Protected>
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
