import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { DashboardLayout } from './DashboardLayout';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'manager' | 'hr' | 'teamlead' | 'employee';
  allowedRoles?: ('admin' | 'manager' | 'hr' | 'teamlead' | 'employee')[];
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole,
  allowedRoles 
}: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to auth'); // Debug log
    return <Navigate to="/auth" replace />;
  }

  // Check if user has required role or is in allowed roles
  if (requiredRole && profile?.role !== requiredRole) {
    console.log(`Role mismatch. Required: ${requiredRole}, User: ${profile?.role}`); // Debug log
    // Redirect to appropriate dashboard based on user's actual role
    const dashboardPath = getDashboardPath(profile?.role);
    return <Navigate to={dashboardPath} replace />;
  }

  // Check if user's role is in allowed roles
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    console.log(`Role not allowed. Allowed: ${allowedRoles.join(', ')}, User: ${profile?.role}`); // Debug log
    const dashboardPath = getDashboardPath(profile?.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

// Helper function to get dashboard path based on role
const getDashboardPath = (role?: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'manager':
      return '/manager/dashboard';
    case 'hr':
      return '/hr/dashboard';
    case 'teamlead':
      return '/teamlead/dashboard';
    case 'employee':
      return '/employee/dashboard';
    default:
      return '/employee/dashboard';
  }
};

// Specific role-based protected routes for convenience
export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

export const ManagerRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="manager">
    {children}
  </ProtectedRoute>
);

export const HRRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="hr">
    {children}
  </ProtectedRoute>
);

export const TeamLeadRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="teamlead">
    {children}
  </ProtectedRoute>
);

export const EmployeeRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="employee">
    {children}
  </ProtectedRoute>
);