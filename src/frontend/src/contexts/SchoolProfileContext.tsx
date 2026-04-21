import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";
import { applyTheme } from "../lib/theme";

// ─── Exported Types ────────────────────────────────────────────────────────────

export type TenantConfig = {
  tenantConfigId: number;
  schoolProfileId: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  bannerImageUrl: string;
  schoolAcronym: string;
  tagLine: string;
  enableStudentPortal: boolean;
  enableParentPortal: boolean;
  enableTeacherPortal: boolean;
  enableOnlineClasses: boolean;
  enablePaymentGateway: boolean;
  enableNotifications: boolean;
  defaultLanguage: string;
  defaultTimeZone: string;
  dateFormat: string;
  emailFromAddress: string;
  emailFromName: string;
  maxUploadSizeInMb: number;
  maxStudentsAllowed: number;
  maxUsersAllowed: number;
  createdAt: string;
  updatedAt: string;
};

export type SchoolProfileData = {
  schoolProfileId: number;
  schoolName: string;
  schoolCode: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  establishedYear: number;
  schoolType: string;
  affiliationNo: string;
  boardName: string;
  createdAt: string;
  updatedAt: string;
};

export type SchoolProfile = {
  id?: string;
  schoolName: string;
  tagline: string;
  logo: string | null;
  address: string;
  phone: string;
  email: string;
  website: string;
  academicYear: string;
  termStart: string;
  termEnd: string;
  motto?: string;
  established?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  faviconUrl?: string;
  bannerImageUrl?: string;
  enableStudentPortal?: boolean;
  enableParentPortal?: boolean;
  enableTeacherPortal?: boolean;
  enableOnlineClasses?: boolean;
  enablePaymentGateway?: boolean;
  enableNotifications?: boolean;
  defaultLanguage?: string;
  defaultTimeZone?: string;
  dateFormat?: string;
};

export type SchoolProfileContextType = {
  profile: SchoolProfile;
  isLoading: boolean;
  updateProfile: (updates: Partial<SchoolProfile>) => void;
  fetchProfile: () => Promise<void>;
};

// ─── Demo Mock Data ────────────────────────────────────────────────────────────

const DEMO_TENANT_CONFIG: TenantConfig = {
  tenantConfigId: 1,
  schoolProfileId: 1,
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  accentColor: "#f59e0b",
  logoUrl: "",
  faviconUrl: "",
  bannerImageUrl: "",
  schoolAcronym: "DEMO SCHOOL",
  tagLine: "Excellence in Education",
  enableStudentPortal: true,
  enableParentPortal: true,
  enableTeacherPortal: true,
  enableOnlineClasses: true,
  enablePaymentGateway: false,
  enableNotifications: true,
  defaultLanguage: "en",
  defaultTimeZone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  emailFromAddress: "school@escola.com",
  emailFromName: "Escola School",
  maxUploadSizeInMb: 10,
  maxStudentsAllowed: 500,
  maxUsersAllowed: 100,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const DEMO_SCHOOL_PROFILE_DATA: SchoolProfileData = {
  schoolProfileId: 1,
  schoolName: "Demo School",
  schoolCode: "DEMO001",
  address: "123 Education Street",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  phone: "+91-22-12345678",
  email: "info@escola.com",
  website: "https://escola.com",
  principalName: "Dr. Principal Name",
  establishedYear: 2010,
  schoolType: "Secondary",
  affiliationNo: "AFF-001",
  boardName: "CBSE",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// ─── Defaults & Storage ────────────────────────────────────────────────────────

const DEFAULTS: SchoolProfile = {
  schoolName: "Escola School",
  tagline: "Excellence in Education",
  logo: null,
  address: "",
  phone: "",
  email: "",
  website: "",
  academicYear: "2025–2026",
  termStart: "2026-01-10",
  termEnd: "2026-04-05",
};

const STORAGE_KEY = "schoolProfile";

function loadFromStorage(): SchoolProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return null;
}

function saveToStorage(profile: SchoolProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

function configToProfile(config: TenantConfig): SchoolProfile {
  return {
    schoolName: config.schoolAcronym || DEFAULTS.schoolName,
    tagline: config.tagLine || DEFAULTS.tagline,
    logo: config.logoUrl || null,
    address: DEFAULTS.address,
    phone: DEFAULTS.phone,
    email: DEFAULTS.email,
    website: DEFAULTS.website,
    academicYear: DEFAULTS.academicYear,
    termStart: DEFAULTS.termStart,
    termEnd: DEFAULTS.termEnd,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
    faviconUrl: config.faviconUrl,
    bannerImageUrl: config.bannerImageUrl,
    enableStudentPortal: config.enableStudentPortal,
    enableParentPortal: config.enableParentPortal,
    enableTeacherPortal: config.enableTeacherPortal,
    enableOnlineClasses: config.enableOnlineClasses,
    enablePaymentGateway: config.enablePaymentGateway,
    enableNotifications: config.enableNotifications,
    defaultLanguage: config.defaultLanguage,
    defaultTimeZone: config.defaultTimeZone,
    dateFormat: config.dateFormat,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SchoolProfileContext = createContext<SchoolProfileContextType | null>(
  null,
);

export function SchoolProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SchoolProfile>(() => {
    const stored = loadFromStorage() ?? DEFAULTS;
    applyTheme(stored.primaryColor);
    return stored;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    applyTheme(profile.primaryColor);
  }, [profile.primaryColor]);

  useEffect(() => {
    async function load() {
      if (isDemoMode()) {
        // Demo mode: zero API calls — use built-in mock data
        const p = configToProfile(DEMO_TENANT_CONFIG);
        setProfile(p);
        saveToStorage(p);
        setIsLoading(false);
        return;
      }

      // Live mode: fetch from GET /TenantSettings/config (AllowAnonymous)
      try {
        const res = await api.get<{ success: boolean; data: TenantConfig }>(
          "/TenantSettings/config",
        );
        if (res.success && res.data) {
          const cfg = res.data as unknown as {
            success: boolean;
            data: TenantConfig;
          };
          const configData = cfg.data ?? (res.data as unknown as TenantConfig);
          const fetched = configToProfile(configData);
          setProfile(fetched);
          saveToStorage(fetched);
        } else {
          toast.error(
            "Could not load school configuration. Using cached data.",
            {
              id: "school-profile-fetch-error",
              duration: 5000,
            },
          );
        }
      } catch {
        toast.error(
          "Failed to connect to the server. Using cached school profile.",
          {
            id: "school-profile-fetch-error",
            duration: 5000,
          },
        );
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  async function fetchProfile() {
    if (isDemoMode()) {
      // Demo mode: merge school name from demo profile data
      setProfile((prev) => ({
        ...prev,
        schoolName: DEMO_SCHOOL_PROFILE_DATA.schoolName,
        address: DEMO_SCHOOL_PROFILE_DATA.address,
        phone: DEMO_SCHOOL_PROFILE_DATA.phone,
        email: DEMO_SCHOOL_PROFILE_DATA.email,
        website: DEMO_SCHOOL_PROFILE_DATA.website,
        established: DEMO_SCHOOL_PROFILE_DATA.establishedYear,
      }));
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: SchoolProfileData }>(
        "/TenantSettings/profile",
      );
      if (res.success && res.data) {
        const profileData = res.data as unknown as {
          success: boolean;
          data: SchoolProfileData;
        };
        const d =
          profileData.data ?? (res.data as unknown as SchoolProfileData);
        setProfile((prev) => {
          const next = {
            ...prev,
            schoolName: d.schoolName || prev.schoolName,
            address: d.address || prev.address,
            phone: d.phone || prev.phone,
            email: d.email || prev.email,
            website: d.website || prev.website,
            established: d.establishedYear,
          };
          saveToStorage(next);
          return next;
        });
      }
    } catch {
      // Silently fail — profile already loaded from config
    }
  }

  function updateProfile(updates: Partial<SchoolProfile>) {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      saveToStorage(next);
      return next;
    });
  }

  return (
    <SchoolProfileContext.Provider
      value={{ profile, isLoading, updateProfile, fetchProfile }}
    >
      {children}
    </SchoolProfileContext.Provider>
  );
}

export function useSchoolProfile(): SchoolProfileContextType {
  const ctx = useContext(SchoolProfileContext);
  if (!ctx)
    throw new Error(
      "useSchoolProfile must be used within SchoolProfileProvider",
    );
  return ctx;
}
