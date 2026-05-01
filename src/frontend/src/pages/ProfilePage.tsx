/**
 * ProfilePage — plain HTML only, no shadcn/Radix/AnimatePresence.
 * Shows current user info from GET /auth/me and allows editing display name & phone.
 */

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { isDemoMode } from "../lib/demoMode";
import { roleLabels } from "../lib/rolePermissions";

type ProfileData = {
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  joinDate?: string;
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  principal: { bg: "oklch(0.55 0.18 265 / 0.12)", text: "oklch(0.45 0.2 265)" },
  teacher: { bg: "oklch(0.55 0.18 145 / 0.12)", text: "oklch(0.45 0.18 145)" },
  account_officer: {
    bg: "oklch(0.65 0.18 55 / 0.12)",
    text: "oklch(0.55 0.18 55)",
  },
  accountant: { bg: "oklch(0.65 0.18 55 / 0.12)", text: "oklch(0.55 0.18 55)" },
  admission_officer: {
    bg: "oklch(0.55 0.16 200 / 0.12)",
    text: "oklch(0.45 0.16 200)",
  },
  clerk: { bg: "oklch(0.55 0.1 240 / 0.12)", text: "oklch(0.45 0.1 240)" },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editable fields
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        if (isDemoMode()) {
          // Use auth context data in demo mode
          const p: ProfileData = {
            name: user?.name ?? "Demo User",
            email: user?.email ?? "demo@escola.com",
            role: user?.role ?? "principal",
            phone: "+234-801-000-0001",
            department: "Administration",
            joinDate: "2023-09-01",
          };
          setProfile(p);
          setDisplayName(p.name);
          setPhone(p.phone ?? "");
          setCanEdit(false); // read-only note in demo
        } else {
          const res = await api.get<ProfileData>("/auth/me");
          if (res.success && res.data) {
            setProfile(res.data);
            setDisplayName(res.data.name);
            setPhone(res.data.phone ?? "");
            setCanEdit(true);
          } else {
            // Fallback to auth context
            const p: ProfileData = {
              name: user?.name ?? "",
              email: user?.email ?? "",
              role: user?.role ?? "",
            };
            setProfile(p);
            setDisplayName(p.name);
            setPhone("");
            setCanEdit(false);
          }
        }
      } catch {
        setError("Failed to load profile. Showing cached data.");
        const p: ProfileData = {
          name: user?.name ?? "",
          email: user?.email ?? "",
          role: user?.role ?? "",
        };
        setProfile(p);
        setDisplayName(p.name);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");
    if (!displayName.trim()) {
      setSaveError("Display name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put<{ success: boolean }>("/auth/profile", {
        name: displayName.trim(),
        phone: phone.trim() || undefined,
      });
      if (res.success) {
        setSaveSuccess("Profile updated successfully.");
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                name: displayName.trim(),
                phone: phone.trim() || undefined,
              }
            : prev,
        );
      } else {
        setSaveError(res.error ?? "Failed to update profile.");
      }
    } catch {
      setSaveError("Network error — unable to reach the server.");
    } finally {
      setSaving(false);
    }
  }

  const roleKey = (profile?.role ?? user?.role ?? "").toLowerCase();
  const roleLabel = roleLabels[roleKey] ?? profile?.role ?? user?.role ?? "";
  const roleColor = ROLE_COLORS[roleKey] ?? {
    bg: "oklch(0.55 0.1 240 / 0.12)",
    text: "oklch(0.45 0.1 240)",
  };

  const initials = (profile?.name ?? user?.name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "24px 0",
        fontFamily: "var(--font-body, system-ui, sans-serif)",
      }}
    >
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--color-foreground)",
            margin: 0,
            fontFamily: "var(--font-display, system-ui, sans-serif)",
            letterSpacing: "-0.02em",
          }}
        >
          My Profile
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--color-muted-foreground)",
            marginTop: 4,
          }}
        >
          View your account information
        </p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 32,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
          data-ocid="profile.loading_state"
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--color-muted)",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 20,
                width: 160,
                borderRadius: 8,
                background: "var(--color-muted)",
                marginBottom: 10,
              }}
            />
            <div
              style={{
                height: 14,
                width: 220,
                borderRadius: 8,
                background: "var(--color-muted)",
              }}
            />
          </div>
        </div>
      )}

      {/* Error banner */}
      {!loading && error && (
        <div
          style={{
            background: "oklch(0.4 0.18 25 / 0.1)",
            border: "1px solid oklch(0.55 0.2 25 / 0.2)",
            borderRadius: 10,
            padding: "10px 14px",
            color: "var(--color-destructive)",
            fontSize: 13,
            marginBottom: 16,
          }}
          data-ocid="profile.error_state"
        >
          {error}
        </div>
      )}

      {/* Profile card */}
      {!loading && profile && (
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow:
              "0 1px 4px oklch(0 0 0 / 0.06), 0 4px 20px oklch(0 0 0 / 0.04)",
          }}
          data-ocid="profile.card"
        >
          {/* Avatar + identity header */}
          <div
            style={{
              padding: "28px 28px 24px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: 20,
              background:
                "linear-gradient(135deg, oklch(0.97 0.008 240 / 0.6) 0%, oklch(0.99 0.003 240) 100%)",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--color-primary), oklch(0.48 0.18 265))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
                color: "#ffffff",
                flexShrink: 0,
                boxShadow:
                  "0 2px 8px oklch(0.45 0.2 265 / 0.35), 0 0 0 3px var(--color-card), 0 0 0 5px oklch(0.75 0.1 265 / 0.2)",
                fontFamily: "var(--font-display, system-ui)",
              }}
            >
              {initials}
            </div>

            {/* Name + email + role badge */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--color-foreground)",
                  margin: 0,
                  fontFamily: "var(--font-display, system-ui)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profile.name}
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-muted-foreground)",
                  marginTop: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profile.email}
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  background: roleColor.bg,
                  color: roleColor.text,
                  border: `1px solid ${roleColor.text}33`,
                  textTransform: "capitalize",
                }}
                data-ocid="profile.role_badge"
              >
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Info rows */}
          <div style={{ padding: "20px 28px" }}>
            {profile.department && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--color-border)",
                  gap: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    flexShrink: 0,
                  }}
                >
                  Department
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--color-foreground)",
                    fontWeight: 500,
                    textAlign: "right",
                  }}
                >
                  {profile.department}
                </span>
              </div>
            )}

            {profile.joinDate && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--color-border)",
                  gap: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    flexShrink: 0,
                  }}
                >
                  Joined
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--color-foreground)",
                    fontWeight: 500,
                    textAlign: "right",
                  }}
                >
                  {new Date(profile.joinDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Edit section */}
          <div
            style={{
              padding: "0 28px 28px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--color-foreground)",
                margin: "20px 0 16px",
                fontFamily: "var(--font-display, system-ui)",
              }}
            >
              {canEdit ? "Edit Details" : "Your Details"}
            </h3>

            {!canEdit && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--color-muted-foreground)",
                  marginBottom: 16,
                  padding: "8px 12px",
                  background: "var(--color-muted)",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                }}
              >
                Profile editing is available when connected to the live API.
              </p>
            )}

            <form
              onSubmit={handleSave}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {/* Display name */}
              <div>
                <label
                  htmlFor="profile-name"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-foreground)",
                    marginBottom: 6,
                  }}
                >
                  Display Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!canEdit || saving}
                  placeholder="Your full name"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    fontSize: 14,
                    borderRadius: 8,
                    outline: "none",
                    background: canEdit
                      ? "var(--color-input)"
                      : "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                    cursor: canEdit ? "text" : "not-allowed",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  data-ocid="profile.name.input"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="profile-phone"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-foreground)",
                    marginBottom: 6,
                  }}
                >
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!canEdit || saving}
                  placeholder="+234-800-000-0000"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    fontSize: 14,
                    borderRadius: 8,
                    outline: "none",
                    background: canEdit
                      ? "var(--color-input)"
                      : "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                    cursor: canEdit ? "text" : "not-allowed",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  data-ocid="profile.phone.input"
                />
              </div>

              {/* Email — read-only */}
              <div>
                <label
                  htmlFor="profile-email"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-foreground)",
                    marginBottom: 6,
                  }}
                >
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    fontSize: 14,
                    borderRadius: 8,
                    outline: "none",
                    background: "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-muted-foreground)",
                    cursor: "not-allowed",
                    boxSizing: "border-box",
                  }}
                  data-ocid="profile.email.input"
                />
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--color-muted-foreground)",
                    marginTop: 4,
                  }}
                >
                  Email cannot be changed here. Contact your administrator.
                </p>
              </div>

              {/* Error/success messages */}
              {saveError && (
                <p
                  style={{
                    fontSize: 13,
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: "oklch(0.4 0.18 25 / 0.1)",
                    border: "1px solid oklch(0.55 0.2 25 / 0.2)",
                    color: "var(--color-destructive)",
                    margin: 0,
                  }}
                  data-ocid="profile.save.error_state"
                >
                  {saveError}
                </p>
              )}
              {saveSuccess && (
                <p
                  style={{
                    fontSize: 13,
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: "oklch(0.55 0.16 145 / 0.1)",
                    border: "1px solid oklch(0.55 0.16 145 / 0.25)",
                    color: "oklch(0.45 0.16 145)",
                    margin: 0,
                  }}
                  data-ocid="profile.save.success_state"
                >
                  {saveSuccess}
                </p>
              )}

              {/* Save button (only if editable) */}
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#ffffff",
                    background: saving
                      ? "var(--color-primary-light)"
                      : "var(--color-primary)",
                    border: "none",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    transition: "background 0.15s, opacity 0.15s",
                    alignSelf: "flex-start",
                  }}
                  data-ocid="profile.save_button"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
