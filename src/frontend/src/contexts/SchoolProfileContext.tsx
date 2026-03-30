import { createContext, useContext, useState } from "react";

export type SchoolProfile = {
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
};

const DEFAULTS: SchoolProfile = {
  schoolName: "Central High School",
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

function loadProfile(): SchoolProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULTS;
}

type SchoolProfileContextValue = {
  profile: SchoolProfile;
  updateProfile: (updates: Partial<SchoolProfile>) => void;
};

const SchoolProfileContext = createContext<SchoolProfileContextValue | null>(
  null,
);

export function SchoolProfileProvider({
  children,
}: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<SchoolProfile>(loadProfile);

  function updateProfile(updates: Partial<SchoolProfile>) {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <SchoolProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </SchoolProfileContext.Provider>
  );
}

export function useSchoolProfile(): SchoolProfileContextValue {
  const ctx = useContext(SchoolProfileContext);
  if (!ctx)
    throw new Error(
      "useSchoolProfile must be used within SchoolProfileProvider",
    );
  return ctx;
}
