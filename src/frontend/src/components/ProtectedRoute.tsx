import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * ProtectedRoute — enforces role-based access.
 *
 * Rules:
 * - Unauthenticated → /login
 * - requirePlatformAdmin=true  AND user.isPlatformAdmin=false → /dashboard
 * - requirePlatformAdmin=false AND user.isPlatformAdmin=true  → /platform-admin
 *   (platform admin must NOT access school-side pages)
 * - allowedRoles specified AND user.role not in list          → /dashboard
 *
 * isPlatformAdmin is now set exclusively from the API role field in AuthContext.
 * There is NO email-based fallback.
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requirePlatformAdmin,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  requirePlatformAdmin?: boolean;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    const isPlatformAdmin = user?.isPlatformAdmin === true;

    // Platform admin routes: only platform admin users may enter
    if (requirePlatformAdmin && !isPlatformAdmin) {
      navigate({ to: "/dashboard" });
      return;
    }

    // Platform admin granted — skip all school-side role checks
    if (requirePlatformAdmin && isPlatformAdmin) {
      return;
    }

    // School-side routes: platform admin must NOT access these — redirect to their panel
    if (!requirePlatformAdmin && isPlatformAdmin) {
      navigate({ to: "/platform-admin" });
      return;
    }

    // School-side role check (case-insensitive — API may return any casing)
    if (allowedRoles && user) {
      const normalizedRole = user.role?.toLowerCase() ?? "";
      const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
      if (!normalizedAllowed.includes(normalizedRole)) {
        navigate({ to: "/dashboard" });
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    navigate,
    allowedRoles,
    user,
    requirePlatformAdmin,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse">
            <span className="text-primary-foreground font-bold text-lg">E</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading EscolaUI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isPlatformAdmin = user?.isPlatformAdmin === true;

  // Block platform admin from entering school-side pages (and vice-versa)
  if (requirePlatformAdmin && !isPlatformAdmin) return null;
  if (!requirePlatformAdmin && isPlatformAdmin) return null;

  // Platform admin on platform admin route — grant immediately, skip role check
  if (requirePlatformAdmin && isPlatformAdmin) return <>{children}</>;

  // Block wrong school-side roles (case-insensitive check)
  if (allowedRoles && user) {
    const normalizedRole = user.role?.toLowerCase() ?? "";
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
    if (!normalizedAllowed.includes(normalizedRole)) {
      return null;
    }
  }

  return <>{children}</>;
}
