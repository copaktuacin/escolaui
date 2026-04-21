import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Globe,
  Info,
  Mail,
  Palette,
  Save,
  Settings2,
  Shield,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  SchoolProfileData,
  TenantConfig,
} from "../contexts/SchoolProfileContext";
import { api } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

// ─── Demo mock data ────────────────────────────────────────────────────────────

const DEMO_CONFIG: TenantConfig = {
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

const DEMO_PROFILE: SchoolProfileData = {
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

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useTenantConfig() {
  return useQuery<TenantConfig>({
    queryKey: ["tenant-config"],
    queryFn: async () => {
      if (isDemoMode()) return DEMO_CONFIG;
      const res = await api.get<{ success: boolean; data: TenantConfig }>(
        "/TenantSettings/config",
      );
      if (!res.success) throw new Error("Failed to load configuration");
      const envelope = res.data as unknown as {
        success: boolean;
        data: TenantConfig;
      };
      return envelope.data ?? (res.data as unknown as TenantConfig);
    },
  });
}

function useTenantProfile() {
  return useQuery<SchoolProfileData>({
    queryKey: ["tenant-profile"],
    queryFn: async () => {
      if (isDemoMode()) return DEMO_PROFILE;
      const res = await api.get<{ success: boolean; data: SchoolProfileData }>(
        "/TenantSettings/profile",
      );
      if (!res.success) throw new Error("Failed to load school profile");
      const envelope = res.data as unknown as {
        success: boolean;
        data: SchoolProfileData;
      };
      return envelope.data ?? (res.data as unknown as SchoolProfileData);
    },
  });
}

function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<TenantConfig>) => {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 400));
        return { ...DEMO_CONFIG, ...payload };
      }
      const res = await api.put<{ success: boolean; data: TenantConfig }>(
        "/TenantSettings/config",
        payload,
      );
      if (!res.success) throw new Error("Failed to update configuration");
      const envelope = res.data as unknown as {
        success: boolean;
        data: TenantConfig;
      };
      return envelope.data ?? (res.data as unknown as TenantConfig);
    },
    onSuccess: (data) => {
      qc.setQueryData(["tenant-config"], data);
      toast.success("Configuration saved successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SchoolProfileData>) => {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 400));
        return { ...DEMO_PROFILE, ...payload };
      }
      const res = await api.put<{ success: boolean; data: SchoolProfileData }>(
        "/TenantSettings/profile",
        payload,
      );
      if (!res.success) throw new Error("Failed to update school profile");
      const envelope = res.data as unknown as {
        success: boolean;
        data: SchoolProfileData;
      };
      return envelope.data ?? (res.data as unknown as SchoolProfileData);
    },
    onSuccess: (data) => {
      qc.setQueryData(["tenant-profile"], data);
      toast.success("School profile saved successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ─── Configuration Tab ────────────────────────────────────────────────────────

function ConfigTab({ config }: { config: TenantConfig }) {
  const [form, setForm] = useState<Partial<TenantConfig>>({
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
    logoUrl: config.logoUrl,
    faviconUrl: config.faviconUrl,
    bannerImageUrl: config.bannerImageUrl,
    schoolAcronym: config.schoolAcronym,
    tagLine: config.tagLine,
    enableStudentPortal: config.enableStudentPortal,
    enableParentPortal: config.enableParentPortal,
    enableTeacherPortal: config.enableTeacherPortal,
    enableOnlineClasses: config.enableOnlineClasses,
    enablePaymentGateway: config.enablePaymentGateway,
    enableNotifications: config.enableNotifications,
    defaultLanguage: config.defaultLanguage,
    defaultTimeZone: config.defaultTimeZone,
    dateFormat: config.dateFormat,
    emailFromAddress: config.emailFromAddress,
    emailFromName: config.emailFromName,
    maxUploadSizeInMb: config.maxUploadSizeInMb,
    maxStudentsAllowed: config.maxStudentsAllowed,
    maxUsersAllowed: config.maxUsersAllowed,
  });

  useEffect(() => {
    setForm({
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      accentColor: config.accentColor,
      logoUrl: config.logoUrl,
      faviconUrl: config.faviconUrl,
      bannerImageUrl: config.bannerImageUrl,
      schoolAcronym: config.schoolAcronym,
      tagLine: config.tagLine,
      enableStudentPortal: config.enableStudentPortal,
      enableParentPortal: config.enableParentPortal,
      enableTeacherPortal: config.enableTeacherPortal,
      enableOnlineClasses: config.enableOnlineClasses,
      enablePaymentGateway: config.enablePaymentGateway,
      enableNotifications: config.enableNotifications,
      defaultLanguage: config.defaultLanguage,
      defaultTimeZone: config.defaultTimeZone,
      dateFormat: config.dateFormat,
      emailFromAddress: config.emailFromAddress,
      emailFromName: config.emailFromName,
      maxUploadSizeInMb: config.maxUploadSizeInMb,
      maxStudentsAllowed: config.maxStudentsAllowed,
      maxUsersAllowed: config.maxUsersAllowed,
    });
  }, [config]);

  const updateConfig = useUpdateConfig();

  function setField<K extends keyof TenantConfig>(
    key: K,
    value: TenantConfig[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    updateConfig.mutate(form);
  }

  const PORTAL_FEATURES: { key: keyof TenantConfig; label: string }[] = [
    { key: "enableStudentPortal", label: "Student Portal" },
    { key: "enableParentPortal", label: "Parent Portal" },
    { key: "enableTeacherPortal", label: "Teacher Portal" },
    { key: "enableOnlineClasses", label: "Online Classes" },
    { key: "enablePaymentGateway", label: "Payment Gateway" },
    { key: "enableNotifications", label: "Notifications" },
  ];

  return (
    <div className="space-y-6" data-ocid="tenant-config.tab">
      {/* Branding */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              Branding & Theme
            </h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cfg-acronym">School Acronym / Display Name</Label>
              <Input
                id="cfg-acronym"
                value={form.schoolAcronym ?? ""}
                onChange={(e) => setField("schoolAcronym", e.target.value)}
                placeholder="e.g. CBSE High School"
                data-ocid="tenant-config.acronym.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-tagline">Tagline</Label>
              <Input
                id="cfg-tagline"
                value={form.tagLine ?? ""}
                onChange={(e) => setField("tagLine", e.target.value)}
                placeholder="e.g. Excellence in Education"
                data-ocid="tenant-config.tagline.input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(
              [
                { key: "primaryColor", label: "Primary Color" },
                { key: "secondaryColor", label: "Secondary Color" },
                { key: "accentColor", label: "Accent Color" },
              ] as { key: keyof TenantConfig; label: string }[]
            ).map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(form[key] as string) ?? "#6366f1"}
                    onChange={(e) => setField(key, e.target.value)}
                    className="w-10 h-9 rounded-md border border-input cursor-pointer bg-transparent"
                    data-ocid={`tenant-config.${key}.input`}
                  />
                  <Input
                    value={(form[key] as string) ?? ""}
                    onChange={(e) => setField(key, e.target.value)}
                    className="font-mono text-xs"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cfg-logo">Logo URL</Label>
              <Input
                id="cfg-logo"
                value={form.logoUrl ?? ""}
                onChange={(e) => setField("logoUrl", e.target.value)}
                placeholder="https://example.com/logo.png"
                data-ocid="tenant-config.logo_url.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-favicon">Favicon URL</Label>
              <Input
                id="cfg-favicon"
                value={form.faviconUrl ?? ""}
                onChange={(e) => setField("faviconUrl", e.target.value)}
                placeholder="https://example.com/favicon.ico"
                data-ocid="tenant-config.favicon_url.input"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cfg-banner">Banner Image URL</Label>
              <Input
                id="cfg-banner"
                value={form.bannerImageUrl ?? ""}
                onChange={(e) => setField("bannerImageUrl", e.target.value)}
                placeholder="https://example.com/banner.jpg"
                data-ocid="tenant-config.banner_url.input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              Feature Toggles
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PORTAL_FEATURES.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-muted/40"
              >
                <Label className="text-sm font-normal cursor-pointer">
                  {label}
                </Label>
                <Switch
                  checked={(form[key] as boolean) ?? false}
                  onCheckedChange={(v) => setField(key, v)}
                  data-ocid={`tenant-config.${key}.switch`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email & Localisation */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              Email & Localisation
            </h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cfg-email-from">From Email Address</Label>
              <Input
                id="cfg-email-from"
                type="email"
                value={form.emailFromAddress ?? ""}
                onChange={(e) => setField("emailFromAddress", e.target.value)}
                placeholder="noreply@school.edu"
                data-ocid="tenant-config.email_from.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-email-name">From Name</Label>
              <Input
                id="cfg-email-name"
                value={form.emailFromName ?? ""}
                onChange={(e) => setField("emailFromName", e.target.value)}
                placeholder="School Name"
                data-ocid="tenant-config.email_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-lang">Default Language (ISO 639-1)</Label>
              <Input
                id="cfg-lang"
                value={form.defaultLanguage ?? ""}
                onChange={(e) => setField("defaultLanguage", e.target.value)}
                placeholder="en"
                data-ocid="tenant-config.language.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-tz">Default Timezone (IANA)</Label>
              <Input
                id="cfg-tz"
                value={form.defaultTimeZone ?? ""}
                onChange={(e) => setField("defaultTimeZone", e.target.value)}
                placeholder="Asia/Kolkata"
                data-ocid="tenant-config.timezone.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-date-fmt">Date Format</Label>
              <Input
                id="cfg-date-fmt"
                value={form.dateFormat ?? ""}
                onChange={(e) => setField("dateFormat", e.target.value)}
                placeholder="DD/MM/YYYY"
                data-ocid="tenant-config.date_format.input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              Usage Limits
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cfg-upload">Max Upload Size (MB)</Label>
              <Input
                id="cfg-upload"
                type="number"
                value={form.maxUploadSizeInMb ?? 10}
                onChange={(e) =>
                  setField("maxUploadSizeInMb", Number(e.target.value))
                }
                min={1}
                data-ocid="tenant-config.max_upload.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-students">Max Students</Label>
              <Input
                id="cfg-students"
                type="number"
                value={form.maxStudentsAllowed ?? 500}
                onChange={(e) =>
                  setField("maxStudentsAllowed", Number(e.target.value))
                }
                min={1}
                data-ocid="tenant-config.max_students.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-users">Max Users</Label>
              <Input
                id="cfg-users"
                type="number"
                value={form.maxUsersAllowed ?? 100}
                onChange={(e) =>
                  setField("maxUsersAllowed", Number(e.target.value))
                }
                min={1}
                data-ocid="tenant-config.max_users.input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="gap-2"
          data-ocid="tenant-config.save.button"
        >
          <Save className="w-4 h-4" />
          {updateConfig.isPending ? "Saving…" : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ profile }: { profile: SchoolProfileData }) {
  const [form, setForm] = useState<Partial<SchoolProfileData>>({
    schoolName: profile.schoolName,
    schoolCode: profile.schoolCode,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    country: profile.country,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    principalName: profile.principalName,
    establishedYear: profile.establishedYear,
    schoolType: profile.schoolType,
    affiliationNo: profile.affiliationNo,
    boardName: profile.boardName,
  });

  useEffect(() => {
    setForm({
      schoolName: profile.schoolName,
      schoolCode: profile.schoolCode,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      phone: profile.phone,
      email: profile.email,
      website: profile.website,
      principalName: profile.principalName,
      establishedYear: profile.establishedYear,
      schoolType: profile.schoolType,
      affiliationNo: profile.affiliationNo,
      boardName: profile.boardName,
    });
  }, [profile]);

  const updateProfile = useUpdateProfile();

  function setField<K extends keyof SchoolProfileData>(
    key: K,
    value: SchoolProfileData[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="space-y-6" data-ocid="tenant-profile.tab">
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              School Identity
            </h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prof-name">
                School Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prof-name"
                value={form.schoolName ?? ""}
                onChange={(e) => setField("schoolName", e.target.value)}
                placeholder="e.g. Springfield High School"
                data-ocid="tenant-profile.school_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-code">School Code</Label>
              <Input
                id="prof-code"
                value={form.schoolCode ?? ""}
                onChange={(e) => setField("schoolCode", e.target.value)}
                placeholder="e.g. SPR001"
                data-ocid="tenant-profile.school_code.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-principal">Principal Name</Label>
              <Input
                id="prof-principal"
                value={form.principalName ?? ""}
                onChange={(e) => setField("principalName", e.target.value)}
                placeholder="Dr. John Smith"
                data-ocid="tenant-profile.principal_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-estd">Established Year</Label>
              <Input
                id="prof-estd"
                type="number"
                value={form.establishedYear ?? ""}
                onChange={(e) =>
                  setField("establishedYear", Number(e.target.value))
                }
                placeholder="2000"
                data-ocid="tenant-profile.established_year.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-type">School Type</Label>
              <Input
                id="prof-type"
                value={form.schoolType ?? ""}
                onChange={(e) => setField("schoolType", e.target.value)}
                placeholder="e.g. Secondary, Primary"
                data-ocid="tenant-profile.school_type.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-board">Board Name</Label>
              <Input
                id="prof-board"
                value={form.boardName ?? ""}
                onChange={(e) => setField("boardName", e.target.value)}
                placeholder="e.g. CBSE, ICSE"
                data-ocid="tenant-profile.board_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-affil">Affiliation No.</Label>
              <Input
                id="prof-affil"
                value={form.affiliationNo ?? ""}
                onChange={(e) => setField("affiliationNo", e.target.value)}
                placeholder="e.g. AFF-12345"
                data-ocid="tenant-profile.affiliation_no.input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              Contact & Address
            </h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="prof-addr">Address</Label>
              <Input
                id="prof-addr"
                value={form.address ?? ""}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Street address"
                data-ocid="tenant-profile.address.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-city">City</Label>
              <Input
                id="prof-city"
                value={form.city ?? ""}
                onChange={(e) => setField("city", e.target.value)}
                data-ocid="tenant-profile.city.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-state">State</Label>
              <Input
                id="prof-state"
                value={form.state ?? ""}
                onChange={(e) => setField("state", e.target.value)}
                data-ocid="tenant-profile.state.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-country">Country</Label>
              <Input
                id="prof-country"
                value={form.country ?? ""}
                onChange={(e) => setField("country", e.target.value)}
                data-ocid="tenant-profile.country.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-phone">Phone</Label>
              <Input
                id="prof-phone"
                value={form.phone ?? ""}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+91-22-12345678"
                data-ocid="tenant-profile.phone.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-email">Email</Label>
              <Input
                id="prof-email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setField("email", e.target.value)}
                data-ocid="tenant-profile.email.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-website">Website</Label>
              <Input
                id="prof-website"
                value={form.website ?? ""}
                onChange={(e) => setField("website", e.target.value)}
                placeholder="https://school.edu"
                data-ocid="tenant-profile.website.input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => updateProfile.mutate(form)}
          disabled={updateProfile.isPending}
          className="gap-2"
          data-ocid="tenant-profile.save.button"
        >
          <Save className="w-4 h-4" />
          {updateProfile.isPending ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminTenantsPage() {
  const configQuery = useTenantConfig();
  const profileQuery = useTenantProfile();

  const isLoading = configQuery.isLoading || profileQuery.isLoading;
  const isError = configQuery.isError || profileQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-6" data-ocid="tenant_management.page">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">School Settings</h1>
        </div>
        <div className="space-y-4" data-ocid="tenant.loading_state">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 text-center"
        data-ocid="tenant.error_state"
      >
        <Building2 className="w-10 h-10 text-destructive/40 mb-3" />
        <p className="text-sm font-medium text-foreground">
          Failed to load school settings
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Check your API connection and try refreshing.
        </p>
      </div>
    );
  }

  const config = configQuery.data!;
  const profile = profileQuery.data!;

  return (
    <div className="space-y-6" data-ocid="tenant_management.page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              School Settings
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage school configuration, branding, and profile details
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick info badges */}
          <Badge variant="outline" className="text-xs gap-1">
            <Info className="w-3 h-3" />
            Profile #{profile.schoolProfileId}
          </Badge>
          {isDemoMode() && (
            <Badge variant="secondary" className="text-xs">
              Demo Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="config" data-ocid="tenant_settings.tabs">
        <TabsList className="mb-6">
          <TabsTrigger value="config" data-ocid="tenant_settings.config.tab">
            <Palette className="w-3.5 h-3.5 mr-1.5" />
            School Configuration
          </TabsTrigger>
          <TabsTrigger value="profile" data-ocid="tenant_settings.profile.tab">
            <Building2 className="w-3.5 h-3.5 mr-1.5" />
            School Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <ConfigTab config={config} />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileTab profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
