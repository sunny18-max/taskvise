import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Auth } from "./pages/Auth";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { EditEmployeeForm } from '@/pages/admin/EditEmployeeForm';
import { AddEmployeeForm } from "./pages/admin/AddEmployeeForm";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { HRDashboard } from "./pages/hr/HRDashboard";
import { TeamLeadDashboard } from "./pages/teamlead/TeamLeadDashboard";
import { EmployeeDashboard } from "./pages/employee/EmployeeDashboard";
import { ThemeProvider } from '@/components/ThemeProvider';
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { Projects } from './pages/admin/Projects';
import { Tasks } from './pages/admin/Tasks';
import { Analytics } from './pages/admin/Analytics';
import NotFound from "./pages/NotFound";
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

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
              
              {/* Admin Routes */}
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
              
              {/* Manager Routes */}
              <Route path="/manager/dashboard" element={
                <ProtectedRoute requiredRole="manager">
                  <ManagerDashboard />
                </ProtectedRoute>
              } />
              
              {/* HR Routes */}
              <Route path="/hr/dashboard" element={
                <ProtectedRoute requiredRole="hr">
                  <HRDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/hr/employees" element={
                <ProtectedRoute requiredRole="hr">
                  <HRDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/hr/recruitment" element={
                <ProtectedRoute requiredRole="hr">
                  <HRDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/hr/attendance" element={
                <ProtectedRoute requiredRole="hr">
                  <HRDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/hr/reports" element={
                <ProtectedRoute requiredRole="hr">
                  <HRDashboard />
                </ProtectedRoute>
              } />
              
              {/* Team Lead Routes */}
              <Route path="/teamlead/dashboard" element={
                <ProtectedRoute requiredRole="teamlead">
                  <TeamLeadDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/teamlead/team" element={
                <ProtectedRoute requiredRole="teamlead">
                  <TeamLeadDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/teamlead/projects" element={
                <ProtectedRoute requiredRole="teamlead">
                  <TeamLeadDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/teamlead/tasks" element={
                <ProtectedRoute requiredRole="teamlead">
                  <TeamLeadDashboard />
                </ProtectedRoute>
              } />
              
              {/* Employee Routes */}
              <Route path="/employee/dashboard" element={
                <ProtectedRoute requiredRole="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/employee/tasks" element={
                <ProtectedRoute requiredRole="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/employee/schedule" element={
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

              {/* Profile and Settings Routes - Accessible to all roles */}
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr', 'teamlead', 'employee']}>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr', 'teamlead', 'employee']}>
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
              
              <Route path="/hr" element={
                <ProtectedRoute requiredRole="hr">
                  <Navigate to="/hr/dashboard" replace />
                </ProtectedRoute>
              } />
              
              <Route path="/teamlead" element={
                <ProtectedRoute requiredRole="teamlead">
                  <Navigate to="/teamlead/dashboard" replace />
                </ProtectedRoute>
              } />
              
              <Route path="/employee" element={
                <ProtectedRoute requiredRole="employee">
                  <Navigate to="/employee/dashboard" replace />
                </ProtectedRoute>
              } />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
              <Route path="/admin/projects" element={<Projects />} />
              <Route path="/admin/tasks" element={<Tasks />} />
              <Route path="/admin/analytics" element={<Analytics />} />
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
        case 'hr':
          window.location.href = '/hr/dashboard';
          break;
        case 'teamlead':
          window.location.href = '/teamlead/dashboard';
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

export default App;