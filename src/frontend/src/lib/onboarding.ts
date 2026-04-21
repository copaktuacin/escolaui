export const ONBOARDING_STORAGE_KEY = "escola_onboarding_completed";

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: string;
  navigateTo?: string;
};

export function hasCompletedOnboarding(userId: string): boolean {
  if (!userId) return true;
  return localStorage.getItem(`${ONBOARDING_STORAGE_KEY}_${userId}`) === "true";
}

export function markOnboardingComplete(userId: string): void {
  if (!userId) return;
  localStorage.setItem(`${ONBOARDING_STORAGE_KEY}_${userId}`, "true");
}

export function resetOnboarding(userId: string): void {
  if (!userId) return;
  localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_${userId}`);
}

const ROLE_STEPS: Record<string, OnboardingStep[]> = {
  admin: [
    {
      id: "school-setup",
      title: "Configure Your School",
      description: "Add your school name, logo, and brand color",
      actionLabel: "Open School Settings",
      icon: "School",
      navigateTo: "/admin",
    },
    {
      id: "add-users",
      title: "Add Your Team",
      description: "Invite principals, teachers, and staff",
      actionLabel: "Go to Users",
      icon: "Users",
      navigateTo: "/admin",
    },
    {
      id: "academic-year",
      title: "Set Academic Year",
      description: "Define the current academic year and terms",
      actionLabel: "View Settings",
      icon: "Calendar",
      navigateTo: "/admin",
    },
  ],
  principal: [
    {
      id: "assign-classes",
      title: "Assign Classes",
      description: "Set up class sections and year groups",
      actionLabel: "View Schedule",
      icon: "LayoutGrid",
      navigateTo: "/schedule",
    },
    {
      id: "invite-teachers",
      title: "Appoint Teachers",
      description: "Assign teachers to classes and subjects",
      actionLabel: "Go to Teachers",
      icon: "UserCheck",
      navigateTo: "/teachers",
    },
  ],
  teacher: [
    {
      id: "class-roster",
      title: "View Your Classes",
      description: "See your assigned classes and students",
      actionLabel: "View Roster",
      icon: "Users",
      navigateTo: "/teacher",
    },
    {
      id: "online-class-url",
      title: "Set Up Online Classes",
      description: "Add meeting links for your online sessions",
      actionLabel: "Manage Classes",
      icon: "Video",
      navigateTo: "/online-classes",
    },
  ],
  admission_officer: [
    {
      id: "review-intake",
      title: "Review Student Intake",
      description: "Check the admissions form and pending applications",
      actionLabel: "View Admissions",
      icon: "ClipboardList",
      navigateTo: "/admissions",
    },
  ],
  account_officer: [
    {
      id: "fee-workflow",
      title: "Fee Workflow Overview",
      description: "Set up fee types and generate your first invoice",
      actionLabel: "Go to Fees",
      icon: "CreditCard",
      navigateTo: "/fees",
    },
  ],
  accountant: [
    {
      id: "fee-workflow",
      title: "Fee Workflow Overview",
      description: "Set up fee types and generate your first invoice",
      actionLabel: "Go to Fees",
      icon: "CreditCard",
      navigateTo: "/fees",
    },
  ],
  clerk: [
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Explore your dashboard and notifications",
      actionLabel: "View Dashboard",
      icon: "Home",
      navigateTo: "/dashboard",
    },
  ],
};

export function getRoleOnboardingSteps(role: string): OnboardingStep[] {
  return ROLE_STEPS[role] ?? ROLE_STEPS.clerk;
}
