import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Globe, Pencil, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { SchoolProfileData } from "../contexts/SchoolProfileContext";
import { api } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";

// ─── Demo mock data ────────────────────────────────────────────────────────────

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

function useSchoolProfile() {
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

function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SchoolProfileData>) => {
      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 400));
        toast.success("Profile updated (demo mode)");
        return { ...DEMO_PROFILE, ...payload };
      }
      const res = await api.put<{ success: boolean; data: SchoolProfileData }>(
        "/TenantSettings/profile",
        payload,
      );
      if (!res.success)
        throw new Error(res.error ?? "Failed to update profile");
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

// ─── Form ─────────────────────────────────────────────────────────────────────

type ProfileFormData = {
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
};

function toFormData(p: SchoolProfileData): ProfileFormData {
  return {
    schoolName: p.schoolName,
    schoolCode: p.schoolCode,
    address: p.address,
    city: p.city,
    state: p.state,
    country: p.country,
    phone: p.phone,
    email: p.email,
    website: p.website,
    principalName: p.principalName,
    establishedYear: p.establishedYear,
    schoolType: p.schoolType,
    affiliationNo: p.affiliationNo,
    boardName: p.boardName,
  };
}

function ProfileForm({ initial }: { initial: SchoolProfileData }) {
  const [form, setForm] = useState<ProfileFormData>(() => toFormData(initial));
  const [editing, setEditing] = useState(false);
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    setForm(toFormData(initial));
  }, [initial]);

  function setField<K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    updateProfile.mutate(form, {
      onSuccess: () => setEditing(false),
    });
  }

  function handleCancel() {
    setForm(toFormData(initial));
    setEditing(false);
  }

  return (
    <div className="space-y-4">
      {/* Identity section */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">
                School Identity
              </h3>
            </div>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setEditing(true)}
                data-ocid="tenant-mgmt.edit.button"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                {
                  key: "schoolName",
                  label: "School Name",
                  placeholder: "e.g. Springfield High School",
                  required: true,
                },
                {
                  key: "schoolCode",
                  label: "School Code",
                  placeholder: "e.g. SPR001",
                },
                {
                  key: "principalName",
                  label: "Principal Name",
                  placeholder: "Dr. John Smith",
                },
                {
                  key: "schoolType",
                  label: "School Type",
                  placeholder: "e.g. Secondary",
                },
                {
                  key: "boardName",
                  label: "Board Name",
                  placeholder: "e.g. CBSE, ICSE",
                },
                {
                  key: "affiliationNo",
                  label: "Affiliation No.",
                  placeholder: "e.g. AFF-12345",
                },
              ] as {
                key: keyof ProfileFormData;
                label: string;
                placeholder: string;
                required?: boolean;
              }[]
            ).map(({ key, label, placeholder, required }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`tmgmt-${key}`}>
                  {label}
                  {required && (
                    <span className="text-destructive ml-0.5">*</span>
                  )}
                </Label>
                {editing ? (
                  <Input
                    id={`tmgmt-${key}`}
                    value={String(form[key] ?? "")}
                    onChange={(e) =>
                      setField(
                        key,
                        e.target.value as ProfileFormData[typeof key],
                      )
                    }
                    placeholder={placeholder}
                    data-ocid={`tenant-mgmt.${key}.input`}
                  />
                ) : (
                  <p className="text-sm text-foreground py-2 px-3 bg-muted/30 rounded-md min-h-[36px]">
                    {String(form[key] ?? "—")}
                  </p>
                )}
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="tmgmt-estd">Established Year</Label>
              {editing ? (
                <Input
                  id="tmgmt-estd"
                  type="number"
                  value={form.establishedYear}
                  onChange={(e) =>
                    setField("establishedYear", Number(e.target.value))
                  }
                  min={1800}
                  data-ocid="tenant-mgmt.establishedYear.input"
                />
              ) : (
                <p className="text-sm text-foreground py-2 px-3 bg-muted/30 rounded-md min-h-[36px]">
                  {form.establishedYear || "—"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact section */}
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
            {(
              [
                { key: "address", label: "Address", span: true },
                { key: "city", label: "City" },
                { key: "state", label: "State" },
                { key: "country", label: "Country" },
                { key: "phone", label: "Phone" },
                { key: "email", label: "Email" },
                { key: "website", label: "Website" },
              ] as {
                key: keyof ProfileFormData;
                label: string;
                span?: boolean;
              }[]
            ).map(({ key, label, span }) => (
              <div
                key={key}
                className={`space-y-1.5 ${span ? "sm:col-span-2" : ""}`}
              >
                <Label htmlFor={`tmgmt-contact-${key}`}>{label}</Label>
                {editing ? (
                  <Input
                    id={`tmgmt-contact-${key}`}
                    value={String(form[key] ?? "")}
                    onChange={(e) =>
                      setField(
                        key,
                        e.target.value as ProfileFormData[typeof key],
                      )
                    }
                    data-ocid={`tenant-mgmt.${key}.input`}
                  />
                ) : (
                  <p className="text-sm text-foreground py-2 px-3 bg-muted/30 rounded-md min-h-[36px]">
                    {String(form[key] ?? "—")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons (edit mode only) */}
      {editing && (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateProfile.isPending}
            data-ocid="tenant-mgmt.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="gap-2"
            data-ocid="tenant-mgmt.save.button"
          >
            <Save className="w-4 h-4" />
            {updateProfile.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantManagementPage() {
  const { data: profile, isLoading, isError } = useSchoolProfile();

  return (
    <div className="space-y-6" data-ocid="tenant_management.page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              School Profile
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage school details and contact information
          </p>
        </div>
        {isDemoMode() && (
          <Badge variant="secondary" className="self-start sm:self-auto">
            Demo Mode
          </Badge>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4" data-ocid="tenant.loading_state">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="tenant.error_state"
        >
          <Building2 className="w-10 h-10 text-destructive/40 mb-3" />
          <p className="text-sm font-medium text-foreground">
            Failed to load school profile
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Check your API connection and try refreshing.
          </p>
        </div>
      )}

      {/* Form */}
      {!isLoading && !isError && profile && <ProfileForm initial={profile} />}
    </div>
  );
}
