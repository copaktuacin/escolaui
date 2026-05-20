import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { getToken } from "../lib/api";
import { applyTheme } from "../lib/theme";
import { useAuth } from "./AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SchoolProfile = {
  schoolName?: string;
  logoUrl?: string;
  motto?: string;
  primaryColor?: string;
  // Extended fields for full profile display
  tagline?: string;
  logo?: string | null;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  academicYear?: string;
  termStart?: string;
  termEnd?: string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = "https://escola.doorstepgarage.in/api";
const PROFILE_PATH = "/school/profileByTenantID";
const STORAGE_KEY = "schoolProfile";
// Spec-required individual cache keys
const NAME_CACHE_KEY = "escola_school_name";
const LOGO_CACHE_KEY = "escola_school_logo";
const MOTTO_CACHE_KEY = "escola_school_motto";
// Legacy key — kept for backwards compat
const LEGACY_NAME_KEY = "resolvedSchoolName";

function str(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return undefined;
}

/** Extract school name from every possible field path the .NET API might use. */
/** Extract school name from every possible field path the .NET API might use. */
function extractSchoolName(j: Record<string, unknown>): string | undefined {
  // The .NET TenantSettings/config endpoint may return the full object flat,
  // or wrapped under data / schoolProfile / tenantConfig / school.
  const env = (j.data ?? j) as Record<string, unknown>;
  const sp =
    (env.schoolProfile as Record<string, unknown> | undefined) ??
    (env.SchoolProfile as Record<string, unknown> | undefined);
  const tc =
    (env.tenantConfig as Record<string, unknown> | undefined) ??
    (env.TenantConfig as Record<string, unknown> | undefined);
  const school =
    (env.school as Record<string, unknown> | undefined) ??
    (env.School as Record<string, unknown> | undefined);

  return (
    // schoolProfile nested paths
    str(sp?.schoolName) ??
    str(sp?.SchoolName) ??
    str(sp?.name) ??
    str(sp?.Name) ??
    str(sp?.title) ??
    str(sp?.Title) ??
    // tenantConfig nested paths
    str(tc?.schoolName) ??
    str(tc?.SchoolName) ??
    str(tc?.name) ??
    str(tc?.Name) ??
    str(tc?.tenantName) ??
    str(tc?.TenantName) ??
    // school nested paths
    str(school?.name) ??
    str(school?.Name) ??
    str(school?.schoolName) ??
    str(school?.SchoolName) ??
    // flat on env (data wrapper)
    str(env.schoolName) ??
    str(env.SchoolName) ??
    str(env.name) ??
    str(env.Name) ??
    str(env.tenantName) ??
    str(env.TenantName) ??
    str(env.title) ??
    str(env.Title) ??
    str(env.school_name) ??
    // flat on root j
    str(j.schoolName) ??
    str(j.SchoolName) ??
    str(j.name) ??
    str(j.Name) ??
    str(j.tenantName) ??
    str(j.TenantName) ??
    str(j.title) ??
    str(j.Title) ??
    undefined
  );
}

/** Extract motto/tagline/quote from any shape. */
/** Extract motto/tagline/quote from any shape. */
function extractMotto(j: Record<string, unknown>): string | undefined {
  const env = (j.data ?? j) as Record<string, unknown>;
  const sp =
    (env.schoolProfile as Record<string, unknown> | undefined) ??
    (env.SchoolProfile as Record<string, unknown> | undefined);
  const tc =
    (env.tenantConfig as Record<string, unknown> | undefined) ??
    (env.TenantConfig as Record<string, unknown> | undefined);

  return (
    str(tc?.Motto) ??
    str(tc?.motto) ??
    str(tc?.tagLine) ??
    str(tc?.TagLine) ??
    str(tc?.tagline) ??
    str(tc?.Tagline) ??
    str(tc?.Quote) ??
    str(tc?.quote) ??
    str(tc?.SchoolMotto) ??
    str(tc?.schoolMotto) ??
    str(tc?.description) ??
    str(tc?.Description) ??
    str(sp?.Motto) ??
    str(sp?.motto) ??
    str(sp?.tagLine) ??
    str(sp?.TagLine) ??
    str(sp?.tagline) ??
    str(sp?.Tagline) ??
    str(sp?.Quote) ??
    str(sp?.quote) ??
    str(sp?.SchoolMotto) ??
    str(sp?.schoolMotto) ??
    str(sp?.description) ??
    str(sp?.Description) ??
    str(env.Motto) ??
    str(env.motto) ??
    str(env.tagLine) ??
    str(env.TagLine) ??
    str(env.tagline) ??
    str(env.Tagline) ??
    str(env.Quote) ??
    str(env.quote) ??
    str(env.SchoolMotto) ??
    str(env.schoolMotto) ??
    str(env.description) ??
    str(env.Description) ??
    str(j.Motto) ??
    str(j.motto) ??
    str(j.tagLine) ??
    str(j.TagLine) ??
    str(j.tagline) ??
    str(j.Tagline) ??
    str(j.Quote) ??
    str(j.quote) ??
    str(j.description) ??
    str(j.Description) ??
    undefined
  );
}

/** Extract logo URL. */
/** Extract logo URL. */
function extractLogo(j: Record<string, unknown>): string | undefined {
  const env = (j.data ?? j) as Record<string, unknown>;
  const sp =
    (env.schoolProfile as Record<string, unknown> | undefined) ??
    (env.SchoolProfile as Record<string, unknown> | undefined);
  const tc =
    (env.tenantConfig as Record<string, unknown> | undefined) ??
    (env.TenantConfig as Record<string, unknown> | undefined);

  return (
    str(tc?.LogoUrl) ??
    str(tc?.logoUrl) ??
    str(tc?.Logo) ??
    str(tc?.logo) ??
    str(tc?.logoPath) ??
    str(tc?.LogoPath) ??
    str(sp?.LogoUrl) ??
    str(sp?.logoUrl) ??
    str(sp?.Logo) ??
    str(sp?.logo) ??
    str(sp?.logoPath) ??
    str(sp?.LogoPath) ??
    str(env.LogoUrl) ??
    str(env.logoUrl) ??
    str(env.Logo) ??
    str(env.logo) ??
    str(env.SchoolLogo) ??
    str(env.schoolLogo) ??
    str(env.logoPath) ??
    str(env.LogoPath) ??
    str(j.Logo) ??
    str(j.logo) ??
    str(j.LogoUrl) ??
    str(j.logoUrl) ??
    str(j.SchoolLogo) ??
    str(j.schoolLogo) ??
    undefined
  );
}

/** Extract primary color. */
function extractPrimaryColor(j: Record<string, unknown>): string | undefined {
  const env = (j.data ?? j) as Record<string, unknown>;
  const tc =
    (env.tenantConfig as Record<string, unknown> | undefined) ??
    (env.TenantConfig as Record<string, unknown> | undefined);

  return (
    str(tc?.primaryColor) ??
    str(tc?.PrimaryColor) ??
    str(tc?.themeColor) ??
    str(tc?.ThemeColor) ??
    str(env.primaryColor) ??
    str(env.PrimaryColor) ??
    str(env.themeColor) ??
    str(env.ThemeColor) ??
    str(j.primaryColor) ??
    str(j.PrimaryColor) ??
    undefined
  );
}

function loadCached(): SchoolProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as SchoolProfile;
      // Prefer the individually-cached keys (more recently updated)
      const cn =
        localStorage.getItem(NAME_CACHE_KEY) ||
        localStorage.getItem(LEGACY_NAME_KEY);
      const cl = localStorage.getItem(LOGO_CACHE_KEY);
      const cm = localStorage.getItem(MOTTO_CACHE_KEY);
      if (cn?.trim()) p.schoolName = cn.trim();
      if (cl?.trim()) p.logoUrl = cl.trim();
      if (cm?.trim()) p.motto = cm.trim();
      return p;
    }
  } catch {
    /* ignore */
  }
  // Also try building from individual keys alone
  const cn =
    localStorage.getItem(NAME_CACHE_KEY) ||
    localStorage.getItem(LEGACY_NAME_KEY);
  const cl = localStorage.getItem(LOGO_CACHE_KEY);
  const cm = localStorage.getItem(MOTTO_CACHE_KEY);
  if (cn || cl || cm) {
    return {
      schoolName: cn?.trim() || undefined,
      logoUrl: cl?.trim() || undefined,
      motto: cm?.trim() || undefined,
    };
  }
  return null;
}

function saveCache(p: SchoolProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    // Write individual keys (spec-required + legacy)
    if (p.schoolName) {
      localStorage.setItem(NAME_CACHE_KEY, p.schoolName);
      localStorage.setItem(LEGACY_NAME_KEY, p.schoolName);
    } else {
      localStorage.removeItem(NAME_CACHE_KEY);
      localStorage.removeItem(LEGACY_NAME_KEY);
    }
    if (p.logoUrl) {
      localStorage.setItem(LOGO_CACHE_KEY, p.logoUrl);
    } else {
      localStorage.removeItem(LOGO_CACHE_KEY);
    }
    if (p.motto) {
      localStorage.setItem(MOTTO_CACHE_KEY, p.motto);
    } else {
      localStorage.removeItem(MOTTO_CACHE_KEY);
    }
  } catch {
    /* ignore */
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SchoolProfileContext = createContext<SchoolProfileContextType | null>(
  null,
);

export function SchoolProfileProvider({ children }: { children: ReactNode }) {
  // Consume auth to get tenantId — AuthProvider must be an ancestor.
  const { user, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<SchoolProfile>(() => {
    const cached = loadCached() ?? {};
    if (cached.primaryColor) applyTheme(cached.primaryColor);
    return cached;
  });
  // Start as false — will become true only while a live fetch is in flight.
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile.primaryColor) applyTheme(profile.primaryColor);
  }, [profile.primaryColor]);

  /**
   * Fetch school profile from GET /api/school/profileByTenantID
   * The backend reads the tenant ID automatically from the Bearer token —
   * NO query parameters should be appended to this endpoint.
   * Requires: authenticated user (school-side, not platform admin).
   * Uses the Bearer token from localStorage via getToken().
   * Never falls back to hardcoded strings — leaves branding blank on failure.
   */
  const fetchProfile = useCallback(async () => {
    // Only fetch for school-side users who have a tenantId in their session.
    // Platform admins (no tenantId) skip this and leave branding blank.
    let hasTenantId = !!user?.tenantId;
    if (!hasTenantId) {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          hasTenantId = !!((parsed.tenantId ??
            parsed.TenantId ??
            parsed.schoolId) as string | null | undefined);
        }
      } catch {
        /* ignore */
      }
    }

    if (!hasTenantId) {
      // Not a school-side user (platform admin or not logged in) — clear branding
      setProfile({});
      setIsLoading(false);
      return;
    }

    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // NO query params — the backend reads the tenant from the Bearer token.
      const url = `${BASE_URL}${PROFILE_PATH}`;
      console.log("[SchoolProfile] fetching:", url);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.warn(
          `[SchoolProfile] HTTP ${res.status} — leaving branding blank`,
        );
        // Clear stale cache so no old name bleeds through
        setProfile({});
        saveCache({});
        return;
      }

      const json = (await res.json()) as Record<string, unknown>;
      console.log("[SchoolProfile] raw response:", JSON.stringify(json));

      const schoolName = extractSchoolName(json);
      const motto = extractMotto(json);
      const logoUrl = extractLogo(json);
      const primaryColor = extractPrimaryColor(json);

      console.log(
        "[EscolaUI] Resolved — schoolName:",
        schoolName ?? "(none)",
        "| motto:",
        motto ?? "(none)",
        "| logo:",
        logoUrl ?? "(none)",
      );

      const updated: SchoolProfile = {
        schoolName: schoolName || undefined,
        logoUrl: logoUrl || undefined,
        motto: motto || undefined,
        primaryColor: primaryColor || undefined,
        tagline: motto || undefined,
        logo: logoUrl || null,
      };

      setProfile((prev) => {
        const next = { ...prev, ...updated };
        saveCache(next);
        if (next.primaryColor) applyTheme(next.primaryColor);
        return next;
      });
    } catch (err) {
      console.warn("[EscolaUI] Failed to fetch school profile:", err);
      // On network error keep cached profile — never set hardcoded fallback values
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId]);

  // Re-fetch whenever authentication state or tenantId changes
  useEffect(() => {
    if (isAuthenticated && user?.tenantId) {
      fetchProfile();
    } else if (!isAuthenticated) {
      // Clear branding when logged out
      setProfile({});
    }
  }, [isAuthenticated, user?.tenantId, fetchProfile]);

  function updateProfile(updates: Partial<SchoolProfile>) {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      saveCache(next);
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

// ─── Legacy type aliases ──────────────────────────────────────────────────────
// Keep these so existing pages that import them don't break.

export type TenantConfig = {
  tenantConfigId?: number;
  schoolProfileId?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  bannerImageUrl?: string;
  schoolAcronym?: string;
  tagLine?: string;
  enableStudentPortal?: boolean;
  enableParentPortal?: boolean;
  enableTeacherPortal?: boolean;
  enableOnlineClasses?: boolean;
  enablePaymentGateway?: boolean;
  enableNotifications?: boolean;
  defaultLanguage?: string;
  defaultTimeZone?: string;
  dateFormat?: string;
  emailFromAddress?: string;
  emailFromName?: string;
  maxUploadSizeInMb?: number;
  maxStudentsAllowed?: number;
  maxUsersAllowed?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SchoolProfileData = {
  schoolProfileId?: number;
  schoolName?: string;
  schoolCode?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
  establishedYear?: number;
  schoolType?: string;
  affiliationNo?: string;
  boardName?: string;
  createdAt?: string;
  updatedAt?: string;
};
