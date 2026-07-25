import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, Role } from '../store/useAuthStore';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to proper role dashboard
    switch (user.role) {
      case Role.CANDIDATE:
        return <Navigate to="/candidate" replace />;
      case Role.RECRUITER:
        return <Navigate to="/recruiter" replace />;
      case Role.HIRING_MANAGER:
        return <Navigate to="/hiring-manager" replace />;
      case Role.ADMIN:
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
