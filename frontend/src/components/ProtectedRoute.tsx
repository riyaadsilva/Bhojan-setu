import { Navigate, useLocation } from "react-router-dom";
import type React from "react";
import { useUser, type UserRole } from "../contexts/UserContext";

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { isLoggedIn, authReady, role } = useUser();
  const location = useLocation();

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f0d0a", color: "#a89b85", fontFamily: "'DM Sans', sans-serif" }}>
        Loading BhojanSetu...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/select-role" replace state={{ from: location.pathname }} />;
  }

  if (roles?.length && (!role || !roles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
