// Internal role keys (normalized from API response)
// "admin" role key is REMOVED — platform admin is identified by isPlatformAdmin flag
// Principal IS the school admin and has the broadest school-side access

export const roleLabels: Record<string, string> = {
  principal: "School Principal",
  teacher: "Teacher",
  account_officer: "Account Officer",
  accountant: "Accountant",
  admission_officer: "Admission Officer",
  clerk: "Clerk",
};

// Paths each school-side role can access
export const roleNavPaths: Record<string, string[]> = {
  principal: [
    "/dashboard",
    "/students",
    "/students/bulk-import",
    "/teachers",
    "/admissions",
    "/admissions/new",
    "/attendance",
    "/online-classes",
    "/schedule",
    "/report-cards",
    "/exams",
    "/fees",
    "/hr-payroll",
    "/id-cards",
    "/notifications",
    "/principal",
    "/reports",
  ],
  teacher: [
    "/dashboard",
    "/attendance",
    "/schedule",
    "/online-classes",
    "/report-cards",
    "/exams",
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
    "/students/bulk-import",
    "/notifications",
  ],
  clerk: ["/dashboard", "/notifications", "/admissions"],
};

// Platform admin nav paths — used by PlatformAdminLayout only
export const platformAdminNavPaths = [
  "/platform-admin",
  "/platform-admin/tenants",
  "/platform-admin/subscriptions",
  "/platform-admin/reminders",
  "/platform-admin/reminder-log",
  "/platform-admin/settings",
];

// Which roles each role can create
// Principal is the school admin and can create all school-side users
export const creatableRoles: Record<string, string[]> = {
  principal: [
    "teacher",
    "account_officer",
    "accountant",
    "admission_officer",
    "clerk",
  ],
  teacher: [],
  account_officer: [],
  accountant: [],
  admission_officer: [],
  clerk: [],
};
