import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Auth } from "./pages/Auth";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { EditEmployeeForm } from '@/components/admin/EditEmployeeForm';
import { AddEmployeeForm } from "./components/admin/AddEmployeeForm"; // Import the new component
import { ManagerDashboard } from "./pages/ManagerDashboard";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { ThemeProvider } from '@/components/ThemeProvider';
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Role-based Dashboard Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/employees" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/employees/edit/:id" element={
                <ProtectedRoute requiredRole="admin">
                  <EditEmployeeForm />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/employees/add" element={
                <ProtectedRoute requiredRole="admin">
                  <AddEmployeeForm />
                </ProtectedRoute>
              } />
              
              <Route path="/manager/dashboard" element={
                <ProtectedRoute requiredRole="manager">
                  <ManagerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/employee/dashboard" element={
                <ProtectedRoute requiredRole="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              } />

              {/* Universal Dashboard Route - Redirects based on role */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              } />

              {/* Profile and Settings Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />

              {/* Default redirect for authenticated users */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              } />
              
              <Route path="/manager" element={
                <ProtectedRoute requiredRole="manager">
                  <Navigate to="/manager/dashboard" replace />
                </ProtectedRoute>
              } />
              
              <Route path="/employee" element={
                <ProtectedRoute requiredRole="employee">
                  <Navigate to="/employee/dashboard" replace />
                </ProtectedRoute>
              } />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

// Component to handle dashboard redirection based on role
const DashboardRedirect = () => {
  const { profile } = useAuth();
  
  useEffect(() => {
    if (profile) {
      switch (profile.role) {
        case 'admin':
          window.location.href = '/admin/dashboard';
          break;
        case 'manager':
          window.location.href = '/manager/dashboard';
          break;
        case 'employee':
          window.location.href = '/employee/dashboard';
          break;
        default:
          window.location.href = '/employee/dashboard';
      }
    }
  }, [profile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Redirecting to your dashboard</h2>
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    </div>
  );
};

// You'll need to create this hook if it doesn't exist
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default App;