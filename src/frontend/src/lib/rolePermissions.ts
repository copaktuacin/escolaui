export const roleLabels: Record<string, string> = {
  admin: "Administrator",
  principal: "School Principal",
  teacher: "Teacher",
  account_officer: "Account Officer",
  accountant: "Accountant",
  admission_officer: "Admission Officer",
  clerk: "Clerk",
};

// Paths each role can access (admin gets all)
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
