import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

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

    // Platform admin routes: only the designated platform super-admin may access.
    // Check isPlatformAdmin flag first; fall back to email for live deployments
    // where the API may not yet return that field.
    const isPlatformAdmin =
      user?.isPlatformAdmin === true || user?.email === "admin@escola.com";
    if (requirePlatformAdmin && !isPlatformAdmin) {
      navigate({ to: "/dashboard" });
      return;
    }

    // School-side role check
    if (
      !requirePlatformAdmin &&
      allowedRoles &&
      user &&
      !allowedRoles.includes(user.role)
    ) {
      navigate({ to: "/dashboard" });
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

  if (
    requirePlatformAdmin &&
    !(user?.isPlatformAdmin === true || user?.email === "admin@escola.com")
  )
    return null;

  if (
    !requirePlatformAdmin &&
    allowedRoles &&
    user &&
    !allowedRoles.includes(user.role)
  ) {
    return null;
  }

  return <>{children}</>;
}
