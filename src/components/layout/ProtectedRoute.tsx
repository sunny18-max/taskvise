import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { DashboardLayout } from './DashboardLayout';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'manager' | 'employee';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
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

  if (requiredRole && profile?.role !== requiredRole) {
    console.log(`Role mismatch. Required: ${requiredRole}, User: ${profile?.role}`); // Debug log
    // Redirect to appropriate dashboard based on user's actual role
    const dashboardPath = profile?.role === 'admin' ? '/admin/dashboard' : 
                         profile?.role === 'manager' ? '/manager/dashboard' : 
                         '/employee/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};