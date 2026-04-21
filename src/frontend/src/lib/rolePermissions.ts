export const roleLabels: Record<string, string> = {
  admin: "Administrator",
  principal: "School Principal",
  teacher: "Teacher",
  account_officer: "Account Officer",
  accountant: "Accountant",
  admission_officer: "Admission Officer",
  clerk: "Clerk",
};

// Paths each role can access in the school-side layout
// Note: admin (platform admin) gets school-side paths below for backwards compatibility,
// but platform admin routes (/platform-admin/*) are handled separately via PlatformAdminLayout
export const roleNavPaths: Record<string, string[]> = {
  admin: [
    "/dashboard",
    "/students",
    "/teachers",
    "/admissions",
    "/admissions/new",
    "/attendance",
    "/online-classes",
    "/schedule",
    "/report-cards",
    "/fees",
    "/hr-payroll",
    "/id-cards",
    "/notifications",
    "/teacher",
    "/admin",
    "/settings",
    "/principal",
    "/tenant-management",
  ],
  principal: [
    "/dashboard",
    "/students",
    "/teachers",
    "/admissions",
    "/attendance",
    "/schedule",
    "/notifications",
    "/principal",
  ],
  teacher: [
    "/dashboard",
    "/attendance",
    "/schedule",
    "/online-classes",
    "/report-cards",
    "/teacher",
    "/notifications",
  ],
  account_officer: ["/dashboard", "/fees", "/hr-payroll", "/notifications"],
  accountant: ["/dashboard", "/fees", "/hr-payroll", "/notifications"],
  admission_officer: [
    "/dashboard",
    "/admissions",
    "/admissions/new",
    "/students",
    "/notifications",
  ],
  clerk: ["/dashboard", "/notifications", "/admissions"],
};

// Platform admin nav paths — used by PlatformAdminLayout
export const platformAdminNavPaths = [
  "/platform-admin",
  "/platform-admin/tenants",
  "/platform-admin/subscriptions",
  "/platform-admin/reminders",
  "/platform-admin/reminder-log",
];

// Which roles each role can create
export const creatableRoles: Record<string, string[]> = {
  admin: [
    "principal",
    "account_officer",
    "admission_officer",
    "clerk",
    "accountant",
  ],
  principal: ["account_officer", "admission_officer", "clerk"],
  teacher: [],
  account_officer: [],
  accountant: [],
  admission_officer: [],
  clerk: [],
};
